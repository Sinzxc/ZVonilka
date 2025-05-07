import { useEffect, useState } from "react";
import IRoom from "../types/IRoom";
import { connectionApi } from "../api/services/connectionApi";
import IUser from "../types/IUser";
import useSimplePeer from "../api/services/useSimplePeer";

type LogEntry = { type: "info" | "success" | "error" | "stream"; message: string };

export default function Calling({
  currentRoom,
  currentUser,
  setCurrentRoom,
  updateRooms,
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

  // If you use objects for logs:
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const handleLog = (entry: LogEntry | string) => {
    if (typeof entry === "string") {
      setLogs(prev => [...prev, { type: "info", message: entry }]);
    } else {
      setLogs(prev => [...prev, entry]);
    }
  };

  const handleClearLogs = () => setLogs([]);

  useSimplePeer({
    hub: connectionApi.connection!,
    currentUser: currentUser,
    onLog: handleLog
  });

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
              muted={false}
              className="hidden"
            ></audio>
          ))}

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
        <span className="text-xs">{showLogs ? "Скрыть логи" : "Логи"}</span>
      </button>

      {/* Animated log panel */}
      {showLogs && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-80 bg-gray-900/80 border border-gray-700 rounded-xl shadow-2xl p-4 overflow-y-auto text-sm backdrop-blur-lg animate-fade-in flex flex-col"
             style={{ transition: 'box-shadow 0.2s' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-200 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
          <ul className="space-y-1 flex-1">
            {logs.length === 0 && (
              <li className="text-gray-500 italic text-center py-4">Нет логов</li>
            )}
            {logs.map((log, idx) => (
              <li key={idx} className={
                "flex items-center gap-2 px-2 py-1 rounded " +
                (log.type === "success"
                  ? "bg-green-900/30"
                  : log.type === "error"
                  ? "bg-red-900/30"
                  : log.type === "stream"
                  ? "bg-blue-900/30"
                  : "bg-gray-800/30")
              }>
                <span
                  className={
                    "inline-block w-2 h-2 rounded-full mt-0.5 " +
                    (log.type === "success"
                      ? "bg-green-400"
                      : log.type === "error"
                      ? "bg-red-400"
                      : log.type === "stream"
                      ? "bg-blue-400"
                      : "bg-gray-400")
                  }
                  title={log.type}
                ></span>
                <span
                  className={
                    log.type === "success"
                      ? "text-green-300"
                      : log.type === "error"
                      ? "text-red-300"
                      : log.type === "stream"
                      ? "text-blue-300"
                      : "text-gray-300"
                  }
                >
                  {log.message}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-end mt-2">
            <button
              className="text-xs px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
              onClick={handleClearLogs}
              disabled={logs.length === 0}
            >
              Очистить логи
            </button>
          </div>
        </div>
      )}
    </>
  );
}