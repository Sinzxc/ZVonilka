import IRoom from "../../types/IRoom";
import IUser from "../../types/IUser";
import { connectionApi } from "./connectionApi";

// Define interfaces
export interface PeerConnection {
  connection: RTCPeerConnection;
  userId: number;
  stream?: MediaStream;
}
const iceServers = [
  {
    urls: import.meta.env.VITE_TURN_SERVER_IP,
    username: import.meta.env.VITE_TURN_SERVER_USERNAME,
    credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
  },
];
export class PeerConnectionService {
  peerConnections: PeerConnection[] = [];
  currentUser: IUser | null = null;
  isMuted: boolean = false;
  isSpeakerMuted: boolean = false;

  createNewPeerConnection = async (userId: number) => {
    const newPeerConnection = new RTCPeerConnection({ iceServers });

    newPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        connectionApi.connection?.invoke("SendCandidate", event.candidate);
      }
    };

    newPeerConnection.ontrack = (event) => {
      const remoteAudio = document.getElementById(
        `remoteAudio-${userId}`
      ) as HTMLAudioElement;

      console.log("Remote audio for user with id:" + userId);

      if (remoteAudio && event.streams[0]) {
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.volume = 100 / 100;
      } else {
        console.log(
          `[PeerConnectionService] Could not find audio element or stream for user ID: ${userId}`
        );
      }
    };

    if (userId) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        },
      });

      stream.getTracks().forEach((track) => {
        newPeerConnection.addTrack(track, stream);
      });

      this.peerConnections = [
        ...this.peerConnections,
        { connection: newPeerConnection, userId, stream: stream },
      ];
    }

    return newPeerConnection;
  };

  createOffer = async (peerConnection: RTCPeerConnection) => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
    connectionApi.connection?.invoke("SendOffer", offer);
  };

  removePeerConnection = (userId: number) => {
    const connectionToRemove = this.peerConnections.find(
      (connection) => connection.userId === userId
    );
    if (connectionToRemove) {
      connectionToRemove.connection.close();
    }

    this.peerConnections = this.peerConnections.filter(
      (connection) => connection.userId !== userId
    );
  };

  getPeerConnectionByUserId = async (userId: number) => {
    const connection = this.peerConnections.find(
      (peer) => peer.userId == userId
    );
    return connection;
  };

  createPeerConnections = (room: IRoom, currentUser: IUser) => {
    this.currentUser = currentUser;
    const otherUsers = room.users.filter((user) => user.id != currentUser.id);
    otherUsers.map((user) => {
      this.createNewPeerConnection(user.id);
    });
  };

  setMicrophoneState = (state: boolean) => {
    this.isMuted = state;

    console.log(`Setting microphone muted state to: ${this.isMuted}`);

    this.peerConnections.forEach((connection) => {
      if (connection.stream) {
        const audioTracks = connection.stream.getAudioTracks();
        console.log(
          `Found ${audioTracks.length} audio tracks for connection ${connection.userId}`
        );

        audioTracks.forEach((track) => {
          track.enabled = !this.isMuted;
          console.log(`Set track ${track.id} enabled to ${!this.isMuted}`);
        });
      }
    });

    return this.isMuted;
  };

  setSpeakerState = (state: boolean) => {
    this.isSpeakerMuted = state;

    // Set volume for all remote audio elements
    this.peerConnections.forEach((connection) => {
      const remoteAudio = document.getElementById(
        `remoteAudio-${connection.userId}`
      ) as HTMLAudioElement;

      if (remoteAudio) {
        remoteAudio.muted = this.isSpeakerMuted;
        console.log(
          `Set speaker for user ${connection.userId} to ${
            this.isSpeakerMuted ? "muted" : "unmuted"
          }`
        );
      }
    });

    return this.isSpeakerMuted;
  };

  removeAllPeerConnections = () => {
    this.peerConnections.map((connection: PeerConnection) => {
      this.removePeerConnection(connection.userId);
    });
  };

  subscribeOnEvents = () => {
    connectionApi.connection?.on(
      "ReceiveOffer",
      async (response: { offer: any; fromUserId: number }) => {
        const userConnection = await this.getPeerConnectionByUserId(
          response.fromUserId
        );

        if (userConnection) {
          userConnection.connection.setRemoteDescription(response.offer);

          const answer = await userConnection.connection.createAnswer();
          await userConnection.connection?.setLocalDescription(answer);

          connectionApi.connection?.invoke(
            "SendAnswer",
            answer,
            response.fromUserId
          );
        } else {
          console.log(
            `[PeerConnectionService] No connection found for user ID: ${response.fromUserId}, cannot process offer`
          );
        }
      }
    );

    connectionApi.connection?.on(
      "ReceiveAnswer",
      async (response: {
        answer: RTCSessionDescriptionInit;
        fromUserId: number;
      }) => {
        const userConnection = await this.getPeerConnectionByUserId(
          response.fromUserId
        );

        if (userConnection) {
          await userConnection.connection.setRemoteDescription(
            new RTCSessionDescription(response.answer)
          );
        }
      }
    );

    connectionApi.connection?.on(
      "ReceiveCandidate",
      async (response: { candidate: RTCIceCandidate; fromUserId: number }) => {
        try {
          const userConnection = await this.getPeerConnectionByUserId(
            response.fromUserId
          );

          if (userConnection?.connection.remoteDescription) {
            await userConnection.connection.addIceCandidate(
              new RTCIceCandidate(response.candidate)
            );
          } else {
            console.log(
              `[PeerConnectionService] Cannot add ICE candidate, no remote description set for user ID: ${response.fromUserId}`
            );
          }
        } catch (error) {
          console.error(
            `[PeerConnectionService] Error adding ICE candidate from user ID: ${response.fromUserId}:`,
            error
          );
        }
      }
    );

    connectionApi.connection?.on("JoinedRoom", (user: IUser, room: IRoom) => {
      this.createNewPeerConnection(user.id);
    });

    connectionApi.connection?.on("InitiateOffer", async (user: IUser) => {
      this.peerConnections
        .filter((connection) => connection.userId != user.id)
        .map((connection) => {
          this.createOffer(connection.connection);
        });
    });
  };
}

export const peerConnectionService = new PeerConnectionService();
