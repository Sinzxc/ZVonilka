import { useEffect, useState, useRef } from "react";
import IRoom from "../types/IRoom";
import { connectionApi } from "../api/services/connectionApi";
import IUser from "../types/IUser";
import { peerConnectionService } from "../api/services/peerConnectionService";

// Define an interface for peer connection data
interface PeerConnection {
  connection: RTCPeerConnection;
  userId: number;
  stream?: MediaStream;
}

export default function Calling({
  currentRoom,
  addUserToRoom,
  setCurrentRoom,
  currentUser,
  isInCall,
}: {
  currentRoom: IRoom | null | undefined;
  addUserToRoom: (room: IRoom) => void;
  setCurrentRoom: (room: IRoom | null) => void;
  currentUser: IUser;
  isInCall: boolean;
}) {
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [volume, setVolume] = useState<number>(100);

  useEffect(() => {
    if (isInCall && currentRoom) {
      console.log(
        `[Calling] Starting call in room: ${currentRoom.title} (ID: ${currentRoom.id})`
      );
      peerConnectionService.createPeerConnections(currentRoom, currentUser);
    } else {
      console.log(
        `[Calling] Ending call or no room selected, removing peer connections`
      );
      peerConnectionService.removeAllPeerConnections();
    }
  }, [isInCall]);

  useEffect(() => {
    console.log(`[Calling] Subscribing to SignalR connection events`);
    peerConnectionService.subscribeOnEvents();

    return () => {
      console.log(`[Calling] Unsubscribing from SignalR connection events`);
      connectionApi.connection?.off("ReceiveOffer");
      connectionApi.connection?.off("ReceiveAnswer");
      connectionApi.connection?.off("ReceiveCandidate");
    };
  }, [connectionApi.connection]);

  useEffect(() => {
    if (currentRoom) {
      console.log(
        `[Calling] Current room updated: ${currentRoom.title}, Users: ${currentRoom.users.length}`
      );
    }
  }, [currentRoom]);

  return (
    <>
      {currentRoom?.users.map((user) => (
        <audio
          key={user.id}
          id={`remoteAudio-${user.id}`}
          autoPlay
          playsInline
          className="hidden"
        ></audio>
      ))}
    </>
  );
}
