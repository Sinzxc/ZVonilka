import { HubConnection } from "@microsoft/signalr";
import { useEffect, useRef } from "react";
import SimplePeer from "simple-peer";
import IUser from "../../types/IUser";
import IRoom from "../../types/IRoom";

interface LogEntry {
    type: "info" | "success" | "error" | "stream";
    message: string;
}

interface SimplePeerProps {
    hub: HubConnection
    currentUser: IUser
    onLog?: (entry: LogEntry) => void
}

const useSimplePeer = ({hub, currentUser, onLog}: SimplePeerProps) => {
    const peers = useRef<Map<number, SimplePeer.Instance>>(null);
    const media = useRef<MediaStream | null>(null);
    const pendingCandidates = useRef<Map<number, any[]>>(new Map());
    // Добавим таймеры для отслеживания "мертвых" peer'ов
    const peerTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map());

    useEffect(() => {
        if(!peers.current) {
            peers.current = new Map<number, SimplePeer.Instance>();
        }
    }, [])

    useEffect(() => {
        hub.on("ReceiveOffer", receiveOffer);
        hub.on("ReceiveAnswer", receiveAnswer);
        hub.on("ReceiveCandidate", receiveCandidate);
        hub.on("JoinedRoom", joinedRoom);

        // ОТПИСКА!
        return () => {
            hub.off("ReceiveOffer", receiveOffer);
            hub.off("ReceiveAnswer", receiveAnswer);
            hub.off("ReceiveCandidate", receiveCandidate);
            hub.off("JoinedRoom", joinedRoom);
        };
    }, []);

    const log = (type: LogEntry["type"], message: string) => {
        if (onLog) onLog({ type, message });
    };

    const joinedRoom = (response: {currentUser: IUser, room: IRoom, createOffer: boolean}) => {
        log("info", `Пользователь ${response.currentUser.login} присоединился к комнате ${response.room.title}`);
        response.room.users.forEach((user) => {
            if(user.id !== currentUser.id) {
                addPeer(user.id, response.createOffer);
            }
        })

        console.log(peers.current);
    }

    const receiveOffer = (response: {offer: any, fromUserId: number, toUserId: number}) => {
        const peer = peers.current!.get(response.fromUserId);
        if(peer) {
            peer.signal(response.offer);
        }
    }

    const receiveAnswer = (response: {answer: any, fromUserId: number, toUserId: number}) => {
        const peer = peers.current!.get(response.fromUserId);
        if(peer) {
            peer.signal(response.answer);
        }
    }

    const receiveCandidate = (response: {candidate: any, fromUserId: number, toUserId: number}) => {
        const peer = peers.current!.get(response.fromUserId);
        if(peer) {
            peer.signal(response.candidate);
        } else {
            // Добавляем в буфер, если peer ещё не создан
            if (!pendingCandidates.current.has(response.fromUserId)) {
                pendingCandidates.current.set(response.fromUserId, []);
            }
            pendingCandidates.current.get(response.fromUserId)!.push(response.candidate);
        }
    }

    const getMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          return stream
        } catch (error) {
          console.error("Error accessing local media:", error);
        }
      };
    
    const addPeer = async (uid: number, createOffer: boolean) => {
        if (peers.current!.has(uid)) {
            log("info", `Peer для пользователя ${uid} уже существует`);
            return;
        }
        if(!media.current) {
            const localMedia = await getMedia();
            if(localMedia) {
                media.current = localMedia;
            }
        }
        const peer = new SimplePeer(
            {
                initiator: createOffer, 
                stream: media.current!,
                channelName: "audio",
                config: {
                    iceServers: [
                        {
                            urls: import.meta.env.VITE_TURN_SERVER_IP,
                            username: import.meta.env.VITE_TURN_SERVER_USERNAME,
                            credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
                        },
                    ]
                }
            }
        );

        // Таймаут для "мертвого" peer'а (например, 20 секунд)
        const timeout = setTimeout(() => {
            if (peers.current!.has(uid)) {
                peer.destroy();
                peers.current!.delete(uid);
                log("error", `Peer для пользователя ${uid} уничтожен по таймауту (не подключился)`);
            }
        }, 20000);
        peerTimeouts.current.set(uid, timeout);

        peer.on("signal", (data) => {
            if(data.type === "offer") onOffer(uid, data);
            if(data.type === "answer") onAnswer(uid, data);
            if(data.type === "candidate") onCandidate(uid, data);
        })

        peer.on("connect", () => {
            log("success", `Пользователь ${uid} подключен`);
            // Если peer успешно подключился — очищаем таймаут
            if (peerTimeouts.current.has(uid)) {
                clearTimeout(peerTimeouts.current.get(uid)!);
                peerTimeouts.current.delete(uid);
            }
        })
        peer.on("close", () => {
            log("info", `Пользователь ${uid} отключен`);
            peers.current!.delete(uid);
            // Очищаем таймаут, если есть
            if (peerTimeouts.current.has(uid)) {
                clearTimeout(peerTimeouts.current.get(uid)!);
                peerTimeouts.current.delete(uid);
            }
        })
        peer.on("error", (err) => {
            log("error", `Пользователь ${uid} ошибка: ${err}`);
        })
        peer.on("stream", (stream) => {
            log("stream", `Пользователь ${uid} поток получен`);
            
            const audio = document.getElementById("remoteAudio-"+uid) as HTMLAudioElement;
            audio.srcObject = stream;
            audio.play();
        })

        if (pendingCandidates.current.has(uid)) {
            pendingCandidates.current.get(uid)!.forEach(candidate => {
                peer.signal(candidate);
            });
            pendingCandidates.current.delete(uid);
        }

        peers.current!.set(uid, peer);
    }

    // Функция для ручной очистки всех peer'ов (например, при выходе из комнаты)
    const clearAllPeers = () => {
        peers.current?.forEach((peer, uid) => {
            peer.destroy();
            if (peerTimeouts.current.has(uid)) {
                clearTimeout(peerTimeouts.current.get(uid)!);
                peerTimeouts.current.delete(uid);
            }
        });
        peers.current?.clear();
        log("info", "Все peer'ы уничтожены");
    };

    const onOffer = (uid: number, data: SimplePeer.SignalData) => {
        hub.invoke("SendOffer", data, uid);
    }

    const onAnswer = (uid: number, data: SimplePeer.SignalData) => {
        hub.invoke("SendAnswer", data, uid);
    }

    const onCandidate = (uid: number, data: SimplePeer.SignalData) => {
        hub.invoke("SendCandidate", data, uid);
    }

    return {
        peers,
        clearAllPeers
    }
}
export default useSimplePeer;