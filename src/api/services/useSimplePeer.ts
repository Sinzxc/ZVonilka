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

        peer.on("signal", (data) => {
            if(data.type === "offer") onOffer(uid, data);
            if(data.type === "answer") onAnswer(uid, data);
            if(data.type === "candidate") onCandidate(uid, data);
        })

        peer.on("connect", () => {
            log("success", `Пользователь ${uid} подключен`);
        })
        peer.on("close", () => {
            log("info", `Пользователь ${uid} отключен`);
            peers.current!.delete(uid);
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

        peers.current!.set(uid, peer);
    }

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
        peers
    }
}
export default useSimplePeer;