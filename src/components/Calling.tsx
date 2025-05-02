import { useEffect } from "react";
import IRoom from "../types/IRoom";
import { connectionApi } from "../api/services/connectionApi";
import IUser from "../types/IUser";
import { peerConnectionService } from "../api/services/peerConnectionService";

export default function Calling({
  currentRoom,
  currentUser,
  setCurrentRoom,
  updateRooms,
  isInCall,
  IsMicrophoneMuted,
  IsFullMuted,
}: {
  currentRoom: IRoom | null | undefined;
  addUserToRoom: (room: IRoom) => void;
  setCurrentRoom: (room: IRoom | null) => void;
  updateRooms: (room: IRoom) => void;
  currentUser: IUser;
  isInCall: boolean;
  IsMicrophoneMuted: boolean;
  IsFullMuted: boolean;
}) {
  useEffect(() => {
    if (isInCall && currentRoom) {
      peerConnectionService.createPeerConnections(currentRoom, currentUser);
    } else {
      peerConnectionService.removeAllPeerConnections();
    }
  }, [isInCall]);

  useEffect(() => {
    peerConnectionService.setMicrophoneState(IsMicrophoneMuted);
    if (IsFullMuted) peerConnectionService.setMicrophoneState(true);
  }, [IsMicrophoneMuted]);
  useEffect(() => {
    peerConnectionService.setSpeakerState(IsFullMuted);
  }, [IsFullMuted]);

  useEffect(() => {
    peerConnectionService.subscribeOnEvents();
    connectionApi.connection?.on(
      "JoinedRoom",
      (response: { user: IUser; room: IRoom }) => {
        setCurrentRoom(response.room);
        updateRooms(response.room);
        console.log(`[Calling] Joined room: ${response.room.title}`);
      }
    );
    connectionApi.connection?.on("LeavedRoom", (user: IUser, room: IRoom) => {
      console.log(`[Calling] User ${user.login} leaved room`);
      setCurrentRoom(room);
      updateRooms(room);
      console.log(`[Calling] Leaved room: ${room.title}`);
    });

    return () => {
      connectionApi.connection?.off("ReceiveOffer");
      connectionApi.connection?.off("ReceiveAnswer");
      connectionApi.connection?.off("ReceiveCandidate");
    };
  }, [connectionApi.connection]);

  return (
    <>
      {currentRoom &&
        currentRoom?.users
          .filter((u) => u.id !== currentUser.id)
          .map((user) => (
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
