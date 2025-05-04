import { useEffect, useRef, useState } from "react";
import { HubConnection } from "@microsoft/signalr";

type PeerConnections = Map<number, RTCPeerConnection>;

export default function useWebRTC(connection: HubConnection) {
    const peerConnections = useRef<PeerConnections>(new Map());
    // @ts-ignore
    const [remoteStreams, setRemoteStreams] = useState<Map<number, MediaStream>>(new Map());
    // @ts-ignore
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [otherUsers, setOtherUsers] = useState<number[]>([]);
    const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

    useEffect(() => {
        if (!connection) return;

        connection.on("JoinedRoom", async ({ currentUser, room, createOffer }: any) => {
            console.log("JoinedRoom event:", { createOffer });

            setCurrentUserId(currentUser.id);
            const others = room.users.filter((u: any) => u.id !== currentUser.id).map((u: any) => u.id);
            setOtherUsers(others);

            if (createOffer) {
                for (const userId of others) {
                    await createOfferToUser(userId);
                }
            }
        });

        // @ts-ignore
        connection.on("LeavedRoom", ({ currentUser, room }: any) => {
            console.log(`User ${currentUser.id} left the room`);
        
            const peer = peerConnections.current.get(currentUser.id);
            if (peer) {
                peer.close();
                peerConnections.current.delete(currentUser.id); 
            }

            pendingCandidates.current.delete(currentUser.id);
            setOtherUsers(prevUsers => prevUsers.filter(userId => userId !== currentUser.id));

            const remoteAudio = document.getElementById(`remoteAudio-${currentUser.id}`) as HTMLAudioElement;
            if (remoteAudio) {
                remoteAudio.srcObject = null;
            }
        });

        connection.on("ReceiveOffer", async ({ offer, fromUserId }) => {
            console.log("Received offer from", fromUserId);

            const peer = createPeerConnection(fromUserId);
            const localStream = await getLocalStream();

            if (localStream) {
                localStream.getTracks().forEach(track => {
                    peer.addTrack(track, localStream!);
                });
            }

            await peer.setRemoteDescription(new RTCSessionDescription(offer));

            const pending = pendingCandidates.current.get(fromUserId);
            if (pending) {
                pending.forEach(candidate => {
                    peer?.addIceCandidate(new RTCIceCandidate(candidate));
                });
                pendingCandidates.current.delete(fromUserId);
            }

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            await connection.invoke("SendAnswer", answer, fromUserId);
        });

        connection.on("ReceiveAnswer", async ({ answer, fromUserId }) => {
            console.log("Received answer from", fromUserId);

            const peer = peerConnections.current.get(fromUserId);

            if (peer) {
                await peer.setRemoteDescription(new RTCSessionDescription(answer));
            }

            const pending = pendingCandidates.current.get(fromUserId);
            if (pending) {
                pending.forEach(candidate => {
                    peer?.addIceCandidate(new RTCIceCandidate(candidate));
                });
                pendingCandidates.current.delete(fromUserId);
            }
        });

        connection.on("ReceiveCandidate", async ({ candidate, fromUserId }) => {
            console.log("Received candidate from", fromUserId);

            let peer = peerConnections.current.get(fromUserId);

            if (!peer) {
                console.log(`Peer connection not found for user ${fromUserId}, creating...`);
                peer = createPeerConnection(fromUserId);
            }

            if (peer.remoteDescription && peer.remoteDescription.type) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log(`Candidate successfully added for user ${fromUserId}`);
                } catch (error) {
                    console.error(`Error adding candidate for user ${fromUserId}`, error);
                }
            } else {
                console.log(`Remote description not set yet for user ${fromUserId}, storing candidate`);
                if (!pendingCandidates.current.has(fromUserId)) {
                    pendingCandidates.current.set(fromUserId, []);
                }
                pendingCandidates.current.get(fromUserId)!.push(candidate);
            }
        });

        return () => {
            connection.off("JoinedRoom");
            connection.off("ReceiveOffer");
            connection.off("ReceiveAnswer");
            connection.off("ReceiveCandidate");
        };
    }, [connection]);

    function createPeerConnection(userId: number): RTCPeerConnection {
        const peer = new RTCPeerConnection({
            iceCandidatePoolSize: 40,
            iceTransportPolicy: "all",
            iceServers: [
                {
                    urls: import.meta.env.VITE_TURN_SERVER_IP,
                    username: import.meta.env.VITE_TURN_SERVER_USERNAME,
                    credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
                  },
                  { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun.stunprotocol.org:3478" },
                {urls: "stun:stun2.l.google.com:19302"}
            ],
        });

        peer.onicecandidate = event => {            
            console.log("Sending candidate to", userId);
            
            if (event.candidate) {
                console.log("Sending candidate to", userId);
                connection.invoke("SendCandidate", event.candidate, userId);
            }
        };

        peer.ontrack = event => {
            console.log("Receiving remote stream from", userId);
            const remoteAudio = document.getElementById(
                `remoteAudio-${userId}`
              ) as HTMLAudioElement;
            
              console.log("Remote audio for user with id:", userId);
            
              if (remoteAudio && event.streams[0]) {
                remoteAudio.srcObject = event.streams[0];
                remoteAudio.volume = 1; // Задаём громкость на 100% (от 0 до 1)
              } else {
                console.log(
                  `[PeerConnectionService] Could not find audio element or stream for user ID: ${userId}`
                );
              }
        };

        peer.oniceconnectionstatechange = () => {
            console.log(`ICE connection state: ${peer.iceConnectionState}`);
            if (peer.iceConnectionState === "failed") {
                console.error(`ICE connection failed for user ${userId}`);
                // Можно попробовать перезапустить соединение или отправить запрос на новый кандидата
                restartIceConnection(peer, userId);
            }
        };

        peerConnections.current.set(userId, peer);
        return peer;
    }

    function restartIceConnection(peer: RTCPeerConnection, userId: number) {
        console.log(`Attempting to restart ICE connection for user ${userId}`);
        
        // Закрытие старого соединения
        peer.close();
        peerConnections.current.delete(userId);
    
        // Попробуем создать новое соединение
        const newPeer = createPeerConnection(userId);
        peerConnections.current.set(userId, newPeer);

        createOfferToUser(userId);
    }

    async function createOfferToUser(targetUserId: number) {
        const peer = createPeerConnection(targetUserId);
        var localStream = await getLocalStream();

        if (localStream) {
            localStream.getTracks().forEach(track => {
                peer.addTrack(track, localStream!);
            });
        }

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        await connection.invoke("SendOffer", offer, targetUserId);
    }

    async function getLocalStream() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            return stream;
        } catch (error) {
            console.error("Error getting user media: ", error);
            return null;
        }
    }

    return {
        remoteStreams,
        otherUsers,
    };
}
