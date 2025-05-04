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
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            await connection.invoke("SendAnswer", answer, fromUserId);
        });

        connection.on("ReceiveAnswer", async ({ answer, fromUserId }) => {
            console.log("Received answer from", fromUserId);

            const peer = peerConnections.current.get(fromUserId);

            console.log("Find peer: ", peer);
            
            if (peer) {
                await peer.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        connection.on("ReceiveCandidate", async ({ candidate, fromUserId }) => {
            console.log("Received candidate from", fromUserId);

            const peer = peerConnections.current.get(fromUserId);
            console.log("Receive candidate from", fromUserId, "candidate:", candidate);
            
            if (peer && candidate) {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
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
            iceServers: [
                {
                    urls: import.meta.env.VITE_TURN_SERVER_IP,
                    username: import.meta.env.VITE_TURN_SERVER_USERNAME,
                    credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
                  },
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

        peerConnections.current.set(userId, peer);
        return peer;
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
