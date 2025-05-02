import { useEffect, useState, useRef, use } from "react";
import IRoom from "../types/IRoom";
import { connectionApi } from "../api/services/connectionApi";
import IUser from "../types/IUser";
import { peerConnectionService } from "../api/services/peerConnectionService";

export default function Calling({
  currentRoom,
  currentUser,
  setCurrentRoom,
  isInCall,
}: {
  currentRoom: IRoom | null | undefined;
  addUserToRoom: (room: IRoom) => void;
  setCurrentRoom: (room: IRoom | null) => void;
  currentUser: IUser;
  isInCall: boolean;
}) {
  useEffect(() => {
    if (isInCall && currentRoom) {
      peerConnectionService.createPeerConnections(currentRoom, currentUser);
    } else {
      peerConnectionService.removeAllPeerConnections();
    }
  }, [isInCall]);

  useEffect(() => {
    peerConnectionService.subscribeOnEvents();
    connectionApi.connection?.on("JoinedRoom", (response: {user: IUser, room: IRoom}) => {
      setCurrentRoom(response.room);
      console.log(`[Calling] Joined room: ${response.room.title}`);
    });

    return () => {
      connectionApi.connection?.off("ReceiveOffer");
      connectionApi.connection?.off("ReceiveAnswer");
      connectionApi.connection?.off("ReceiveCandidate");
    };
  }, [connectionApi.connection]);
  
  return (
    <>
      {currentRoom && currentRoom?.users.filter(u => u.id !== currentUser.id).map((user) => (
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
