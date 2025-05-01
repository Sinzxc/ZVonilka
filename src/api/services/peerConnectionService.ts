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
  // { url: "stun:stun1.l.google.com:19302" },
  {
    urls: import.meta.env.VITE_TURN_SERVER_IP,
    username: import.meta.env.VITE_TURN_SERVER_USERNAME,
    credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
  },
];
export class PeerConnectionService {
  peerConnections: PeerConnection[] = [];
  currentUser: IUser | null = null;

  createNewPeerConnection = async (userId: number) => {
    console.log(
      `[PeerConnectionService] Creating new peer connection for user ID: ${userId}`
    );
    const newPeerConnection = new RTCPeerConnection({ iceServers });
    console.log(`[PeerConnectionService] ICE servers configured:`, iceServers);

    if (userId) {
      console.log(`[PeerConnectionService] Requesting user media (audio)`);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      console.log(`[PeerConnectionService] Media stream obtained successfully`);

      stream.getTracks().forEach((track) => {
        console.log(
          `[PeerConnectionService] Adding track to peer connection: ${track.kind}`
        );
        newPeerConnection.addTrack(track, stream);
      });

      console.log(
        `[PeerConnectionService] Adding new peer connection to collection for user ID: ${userId}`
      );
      this.peerConnections = [
        ...this.peerConnections,
        { connection: newPeerConnection, userId, stream: stream },
      ];
    }

    return newPeerConnection;
  };

  createOffer = async (peerConnection: RTCPeerConnection) => {
    console.log(`[PeerConnectionService] Creating offer for peer connection`);
    const offer = await peerConnection.createOffer();
    console.log(`[PeerConnectionService] Setting local description (offer)`);
    await peerConnection.setLocalDescription(offer);
    console.log(`[PeerConnectionService] Sending offer via SignalR`);
    connectionApi.connection?.invoke("SendOffer", offer);
  };

  removePeerConnection = (userId: number) => {
    console.log(
      `[PeerConnectionService] Removing peer connection for user ID: ${userId}`
    );
    const connectionToRemove = this.peerConnections.find(
      (connection) => connection.userId === userId
    );
    if (connectionToRemove) {
      console.log(
        `[PeerConnectionService] Closing connection for user ID: ${userId}`
      );
      connectionToRemove.connection.close();
    } else {
      console.log(
        `[PeerConnectionService] No connection found for user ID: ${userId}`
      );
    }
    this.peerConnections = this.peerConnections.filter(
      (connection) => connection.userId !== userId
    );
    console.log(
      `[PeerConnectionService] Remaining connections: ${this.peerConnections.length}`
    );
  };

  getPeerConnectionByUserId = async (userId: number) => {
    console.log(
      `[PeerConnectionService] Looking for peer connection with user ID: ${userId}`
    );
    const connection = this.peerConnections.find(
      (peer) => peer.userId == userId
    );
    console.log(
      `[PeerConnectionService] Connection ${
        connection ? "found" : "not found"
      } for user ID: ${userId}`
    );
    return connection;
  };

  createPeerConnections = (room: IRoom, currentUser: IUser) => {
    this.currentUser = currentUser;
    console.log(
      `[PeerConnectionService] Creating peer connections for room: ${room.title} (ID: ${room.id})`
    );
    console.log(
      `[PeerConnectionService] Current user: ${currentUser.login} (ID: ${currentUser.id})`
    );
    console.log(
      `[PeerConnectionService] Total users in room: ${room.users.length}`
    );

    const otherUsers = room.users.filter((user) => user.id != currentUser.id);
    console.log(
      `[PeerConnectionService] Creating connections for ${
        otherUsers.length
      } other users: ${JSON.stringify(otherUsers)}`
    );

    otherUsers.map((user) => {
      console.log(
        `[PeerConnectionService] Creating connection for user: ${user.login} (ID: ${user.id})`
      );
      this.createNewPeerConnection(user.id);
    });
  };

  removeAllPeerConnections = () => {
    console.log(
      `[PeerConnectionService] Removing all peer connections (total: ${this.peerConnections.length})`
    );
    this.peerConnections.map((connection: PeerConnection) => {
      console.log(
        `[PeerConnectionService] Removing connection for user ID: ${connection.userId}`
      );
      this.removePeerConnection(connection.userId);
    });
  };

  subscribeOnEvents = () => {
    console.log(`[PeerConnectionService] Subscribing to SignalR events`);

    connectionApi.connection?.on(
      "ReceiveOffer",
      async (response: {
        offer: RTCSessionDescriptionInit;
        fromUserId: number;
      }) => {
        console.log(
          `[PeerConnectionService] Received offer from user ID: ${response.fromUserId}`
        );
        // if (!this.currentUser) return;
        const userConnection = await this.getPeerConnectionByUserId(
          response.fromUserId
        );
        if (userConnection) {
          console.log("state: ", userConnection.connection.signalingState);
          console.log(
            `[PeerConnectionService] Setting remote description (offer) from user ID: ${response.fromUserId}`
          );
          await userConnection.connection.setRemoteDescription(
            new RTCSessionDescription(response.offer)
          );
          console.log(
            `[PeerConnectionService] Creating answer for user ID: ${response.fromUserId}`
          );
          const answer = await userConnection.connection.createAnswer();
          console.log(
            `[PeerConnectionService] Setting local description (answer)`
          );
          await userConnection.connection?.setLocalDescription(answer);
          console.log(
            `[PeerConnectionService] Sending answer to user ID: ${response.fromUserId}`
          );
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
        console.log(
          `[PeerConnectionService] Received answer from user ID: ${response.fromUserId}`
        );
        // if (!this.currentUser) return;

        const userConnection = await this.getPeerConnectionByUserId(
          response.fromUserId
        );
        console.log("Find userConnection: ", userConnection);
        console.log(
          "state (answer): ",
          userConnection?.connection.signalingState
        );
        console.log("founded user:", userConnection);
        // await new Promise((r) => setTimeout(r, 5000));
        if (userConnection) {
          console.log(
            `[PeerConnectionService] Setting remote description (answer) from user ID: ${response.fromUserId}`
          );

          await userConnection.connection.setRemoteDescription(
            new RTCSessionDescription(response.answer)
          );

          console.log(
            `[PeerConnectionService] Setting up ICE candidate handler for user ID: ${response.fromUserId}`
          );
          userConnection.connection.onicecandidate = (event) => {
            console.log(
              "[PeerConnectionService]  ICE candidate event handler: ",
              event
            );
            if (event.candidate) {
              console.log(
                `[PeerConnectionService] ICE candidate generated, sending to user ID: ${response.fromUserId}`
              );
              connectionApi.connection?.invoke(
                "SendCandidate",
                event.candidate
              );
            }
          };

          console.log(
            `[PeerConnectionService] Setting up track handler for user ID: ${response.fromUserId}`
          );
          userConnection.connection.ontrack = (event) => {
            console.log(
              `[PeerConnectionService] Track received from user ID: ${response.fromUserId}`
            );
            const remoteAudio = document.getElementById(
              `remoteAudio-${userConnection.userId}`
            ) as HTMLAudioElement;
            if (remoteAudio && event.streams[0]) {
              console.log(
                `[PeerConnectionService] Setting remote stream to audio element for user ID: ${userConnection.userId}`
              );
              remoteAudio.srcObject = event.streams[0];
              remoteAudio.volume = 100 / 100; // Устанавливаем начальную громкость
            } else {
              console.log(
                `[PeerConnectionService] Could not find audio element or stream for user ID: ${userConnection.userId}`
              );
            }
          };
          userConnection.connection.oniceconnectionstatechange = (event) => {
            console.log("StageChanged on: ", event);
          };
        } else {
          console.log(
            `[PeerConnectionService] No connection found for user ID: ${response.fromUserId}, cannot process answer`
          );
        }
      }
    );

    connectionApi.connection?.on(
      "ReceiveCandidate",
      async (response: { candidate: RTCIceCandidate; fromUserId: number }) => {
        console.log(
          `[PeerConnectionService] Received ICE candidate from user ID: ${response.fromUserId}`
        );
        try {
          // if (!this.currentUser) return;
          const userConnection = await this.getPeerConnectionByUserId(
            response.fromUserId
          );
          if (userConnection?.connection.remoteDescription) {
            console.log(
              `[PeerConnectionService] Adding ICE candidate from user ID: ${response.fromUserId}`
            );
            await userConnection.connection.addIceCandidate(
              new RTCIceCandidate(response.candidate)
            );
            console.log(
              `[PeerConnectionService] ICE candidate added successfully`
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
      console.log(
        `[PeerConnectionService] User with ID: ${user.id} Joined to room: ${room.id}`
      );
      this.createNewPeerConnection(user.id);
    });

    console.log(
      `[PeerConnectionService] All SignalR event handlers registered`
    );

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
