import { useEffect, useState, useRef } from "react";
import SimplePeer from "simple-peer";
import IRoom from "../../types/IRoom";
import IUser from "../../types/IUser";

export function useSimplePeer(userId: number, connection?: signalR.HubConnection) {
  const [peers, setPeers] = useState<Record<number, SimplePeer.Instance>>({});
  const peersRef = useRef<Record<number, SimplePeer.Instance>>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Добавляем буфер для кандидатов
  const pendingCandidates = useRef<Record<number, any[]>>({});

  // Синхронизируем ref с состоянием
  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  useEffect(() => {
    // Получить доступ к микрофону один раз
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        setLocalStream(stream);

        // Создать локальный аудиоплеер для своего потока (и замьютить его)
        const localAudio = document.createElement("audio");
        localAudio.id = "localAudio";
        localAudio.srcObject = stream;
        localAudio.muted = true;
        localAudio.autoplay = true;
        document.body.appendChild(localAudio);
      } catch (error) {
        console.error("Error accessing local media:", error);
      }
    };

    getMedia();
  }, []);

  useEffect(() => {
    if (!connection || !localStream) return;

    connection.on("JoinedRoom", (response: { currentUser: IUser, room: IRoom, createOffer: boolean }) => {
      response.room.users.forEach(async (user: any) => {
        if (user.id !== userId) {
          await createPeer(user.id, connection, response.createOffer);
        }
      });
    });

    connection.on("ReceiveOffer", async ({ offer, fromUserId }) => {
      const peer = await createPeer(fromUserId, connection, false);
      if (peer) {
        peer.signal(offer);
      }
    });

    connection.on("ReceiveAnswer", async ({ answer, fromUserId }) => {
      let peer = peersRef.current[fromUserId];
      if (!peer) {
        // Если peer нет, пробуем создать его как initiator:true
        await createPeer(fromUserId, connection, true);
      }
      if (peer) {
        console.log("Received answer for peer", fromUserId, answer);
        peer.signal(answer);
      } else {
        console.warn("No peer found for answer from", fromUserId);
      }
    });

    connection.on("ReceiveCandidate", ({ candidate, fromUserId }) => {
      const peer = peersRef.current[fromUserId];
      if (peer) {
        peer.signal(candidate);
      } else {
        // Буферизуем кандидата, если peer ещё не создан
        if (!pendingCandidates.current[fromUserId]) {
          pendingCandidates.current[fromUserId] = [];
        }
        pendingCandidates.current[fromUserId].push(candidate);
        console.warn("No peer found for candidate from", fromUserId, "- candidate buffered");
      }
    });

    // Очистка событий при размонтировании
    return () => {
      connection.off("JoinedRoom");
      connection.off("ReceiveOffer");
      connection.off("ReceiveAnswer");
      connection.off("ReceiveCandidate");
    };
  }, [connection, localStream]);

  const createPeer = async (targetUserId: number, connection: any, initiator: boolean) => {
    try {
      if (!localStream) return;

      if (initiator && peersRef.current[targetUserId]) {
        return peersRef.current[targetUserId];
      }

      const peer = new SimplePeer({
        initiator,
        trickle: true,
        offerOptions: {
          offerToReceiveAudio: true,
        },
        config: {
          iceServers: [
            {
              urls: import.meta.env.VITE_TURN_SERVER_IP,
              username: import.meta.env.VITE_TURN_SERVER_USERNAME,
              credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
            },
            { urls: "stun:stun.l.google.com:19302" }
          ],
        },
        stream: localStream,
      });

      peer.on("signal", (data) => {
        if (data.type === "offer" && initiator) {
          connection.invoke("SendOffer", data, targetUserId);
        } else if (data.type === "answer") {
          connection.invoke("SendAnswer", data, targetUserId);
        } else if (data.type === "candidate") {
          connection.invoke("SendCandidate", data, targetUserId);
        }
      });

      peer.on("connect", () => {
        console.log("Peer connected:", targetUserId);
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
      });

      peer.on("close", () => {
        console.log("Peer closed:", targetUserId);
      });

      peer.on("end", () => {
        console.log("Peer ended:", targetUserId);
      });

      peer.on("data", (data) => {
       console.log(data); 
      })

      peer.on("stream", (stream) => {
        let audio = document.getElementById('remoteAudio-' + targetUserId) as HTMLAudioElement;
        if (audio) {
          audio.srcObject = stream;
          audio.volume = 1;
          audio.play().catch(err => console.log(err));
        }
      });


      setPeers(prev => {
        const updated = { ...prev, [targetUserId]: peer };
        peersRef.current = updated;
        return updated;
      });

      // После создания peer применяем все буферизованные кандидаты
      if (pendingCandidates.current[targetUserId]) {
        pendingCandidates.current[targetUserId].forEach((candidate) => {
          peer.signal(candidate);
        });
        pendingCandidates.current[targetUserId] = [];
      }

      return peer;
    } catch (error) {
      console.error("Error creating peer:", error);
    }
  };

  return { peers };
}
