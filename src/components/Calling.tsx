import { useEffect, useRef, useState } from "react";
import * as adapterModule from 'webrtc-adapter';
declare global {
  interface Window {
    adapter: any;
  }
}
window.adapter = adapterModule.default || adapterModule;

import IRoom from "../types/IRoom";
import { connectionApi } from "../api/services/connectionApi";
import IUser from "../types/IUser";
import Janus, { JanusJS } from 'janus-gateway';

type LogEntry = { type: "info" | "success" | "error" | "stream"; message: string };

export default function Calling({
  currentRoom,
  currentUser,
  setCurrentRoom,
  updateRooms,
  stream,
  IsFullMuted,
  IsMicrophoneMuted
}: {
  currentRoom: IRoom | null | undefined;
  addUserToRoom: (room: IRoom) => void;
  setCurrentRoom: (room: IRoom | null) => void;
  updateRooms: (room: IRoom) => void;
  currentUser: IUser;
  isInCall: boolean;
  IsMicrophoneMuted: boolean;
  IsFullMuted: boolean;
  stream: MediaStream;
}) {

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [connected, setConnected] = useState(false);
  const [pluginHandle, setPluginHandle] = useState<JanusJS.PluginHandle | null>(null);
  const janus = useRef<Janus>(null);

  useEffect(() => {
    if(janus.current) return;
    console.log(Janus);
    
    Janus.init({
      debug: true,
      dependencies: Janus.useDefaultDependencies(),
      callback: () => {
        handleLog({ type: "info", message: "Janus initialized" });
      }
    })
    
    janus.current = new Janus({
      server: import.meta.env.VITE_JANUS_SERVER,
      success: () => {
        handleLog({ type: "success", message: "Janus connected" });
        setConnected(true);
      },
      error: (err: any) => {
        handleLog({ type: "error", message: "Janus connection error: " + err });
      }
    });
  }, [])

  useEffect(() => {
    if(connected && janus.current) {
      janus.current.attach({
        plugin: "janus.plugin.audiobridge",
        success: (pluginHandle) => {
          setPluginHandle(pluginHandle);
          const roomId = currentRoom?.id;
          handleLog({ type: "info", message: `Joining room ${roomId} as ${currentUser.login}` });
          pluginHandle.send({
            message: {
              request: "join",
              room: roomId,
              display: currentUser.login
            }
          });
          (pluginHandle as any).onmessage = (msg: any, jsep: any) => {
            if (msg["audiobridge"] === "joined") {
              handleLog({ type: "success", message: "Joined audiobridge room, creating offer..." });
              const audioTrack = stream.getAudioTracks()[0];
              if (!audioTrack) {
                handleLog({ type: "error", message: "No audio track available from getUserMedia! Not creating offer." });
                return;
              }
              pluginHandle.createOffer({
                  media: {
                    audioSend: true,
                    audioRecv: false,
                    videoSend: false,
                    videoRecv: false,
                  },
                  success: (jsep: any) => {
                    handleLog({ type: "success", message: "Offer created" });
                    pluginHandle.send({ message: { request: "configure", muted: false }, jsep });
                  },
                  error: (err: any) => {
                    handleLog({ type: "error", message: "Offer creation error: " + err });
                  },
                })
              }
            if(jsep) {
              pluginHandle.handleRemoteJsep({ jsep: jsep });
            }
          };
        },
        error: (err: any) => {
          handleLog({ type: "error", message: "Plugin attachment error: " + err });
        },
        onmessage: (msg: any, jsep: any) => {
          if (msg["audiobridge"] === "joined") {
            handleLog({ type: "success", message: "Joined audiobridge room, creating offer..." });
            navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
              const audioTrack = stream.getAudioTracks()[0];
              if (!audioTrack || audioTrack.readyState !== "live" || !audioTrack.enabled) {
                handleLog({ type: "error", message: "No usable audio track available from getUserMedia! Not creating offer." });
                return;
              }
              if(pluginHandle) {
                pluginHandle.createOffer({
                  success: (jsep: any) => {
                    if (!jsep || !jsep.sdp || !jsep.sdp.includes("m=audio")) {
                      handleLog({ type: "error", message: "Offer SDP is invalid or missing audio media line!" });
                      return;
                    }
                    handleLog({ type: "success", message: "Offer created" });
                    pluginHandle.send({ message: { request: "configure", muted: false }, jsep });
                  },
                  error: (err: any) => {
                    handleLog({ type: "error", message: "Offer creation error: " + err });
                  },
                });
              }
            }).catch(err => {
              handleLog({ type: "error", message: "Could not get local audio: " + err });
            });
          }
          if(jsep) {
            pluginHandle?.handleRemoteJsep({ jsep: jsep });
          }
        },
        onremotetrack: (track: MediaStreamTrack, _mid: string, on: boolean, _metadata?: any, streams?: MediaStream[]) => {
          if (!on) return;
          const audioElem = document.getElementById("remoteAudio") as HTMLAudioElement | null;
          if (audioElem) {
            if (streams && streams[0]) {
              audioElem.srcObject = streams[0];
              handleLog({ type: "stream", message: "Remote stream received" });
            } else {
              audioElem.srcObject = new MediaStream([track]);
              handleLog({ type: "stream", message: "Remote track received" });
            }
            audioElem.play().catch(e => handleLog({ type: "error", message: "audioElem.play() error: " + e }));
          } else {
            handleLog({ type: "error", message: "audioElem not found!" });
          }
        },
      })
    }
  }, [connected])

  useEffect(() => {
    if(IsMicrophoneMuted) {
      pluginHandle?.muteAudio();
    } else {
      pluginHandle?.unmuteAudio();
    }
  }, [IsMicrophoneMuted]);

  const handleLog = (entry: LogEntry | string) => {
    if (typeof entry === "string") {
      setLogs(prev => [...prev, { type: "info", message: entry }]);
    } else {
      setLogs(prev => [...prev, entry]);
    }
  };

  const handleClearLogs = () => setLogs([]);

  useEffect(() => {
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

      janus.current?.destroy({
        success: () => {
          console.log("Janus destroyed successfully");
        },
        error: (err: any) => {
          console.error("Error destroying Janus:", err);
        }
      });

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
      <audio id="remoteAudio" autoPlay playsInline controls hidden muted={IsFullMuted} />
      {showLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-gray-900/95 border border-gray-700 rounded-2xl shadow-2xl p-6 overflow-y-auto text-sm flex flex-col"
               style={{
                 boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                 border: '1.5px solid rgba(255,255,255,0.12)'
               }}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                Peer Connection Logs
              </div>
              <button
                className="text-gray-400 hover:text-red-400 transition text-lg font-bold px-2"
                onClick={() => setShowLogs(false)}
                title="Закрыть"
                style={{ lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <hr className="border-gray-700 mb-2" />
            <ul className="space-y-1 flex-1 overflow-y-auto">
              {logs.length === 0 && (
                <li className="text-gray-500 italic text-center py-4">No logs yet</li>
              )}
              {logs.map((log, idx) => (
                <li key={idx} className={
                  "flex items-start gap-2 px-3 py-2 rounded-xl shadow-sm " +
                  (log.type === "success"
                    ? "bg-green-900/30 border-l-4 border-green-400"
                    : log.type === "error"
                    ? "bg-red-900/30 border-l-4 border-red-400"
                    : log.type === "stream"
                    ? "bg-blue-900/30 border-l-4 border-blue-400"
                    : "bg-gray-800/30 border-l-4 border-gray-400")
                }>
                  <span className="mt-0.5">
                    {log.type === "success" && (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {log.type === "error" && (
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {log.type === "stream" && (
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A2 2 0 0020 6.382V5a2 2 0 00-2-2H6a2 2 0 00-2 2v1.382a2 2 0 00.447 1.342L9 10m6 0v4m0 0l-4 4m4-4l4 4" />
                      </svg>
                    )}
                    {log.type === "info" && (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                      </svg>
                    )}
                  </span>
                  <div className="flex-1">
                    <span
                      className={
                        log.type === "success"
                          ? "text-green-200"
                          : log.type === "error"
                          ? "text-red-200"
                          : log.type === "stream"
                          ? "text-blue-200"
                          : "text-gray-200"
                      }
                    >
                      {log.message}
                    </span>
                    <div className="text-xs text-gray-400 mt-1 select-none">
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-2">
              <button
                className="text-xs px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
                onClick={handleClearLogs}
                disabled={logs.length === 0}
              >
                Clear logs
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating log toggle button */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-gray-800/90 hover:bg-gray-700 text-gray-200 rounded-full shadow-lg p-3 flex items-center transition backdrop-blur"
        onClick={() => setShowLogs((v) => !v)}
        title={showLogs ? "Hide logs" : "Show logs"}
        style={{ outline: "none" }}
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <span className="text-xs">{showLogs ? "Hide logs" : "Logs"}</span>
      </button>
    </>
  );
}
