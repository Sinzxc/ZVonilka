
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faMicrophone,
  faHeadphones,
  faVideoCamera,
  faPhoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import Chat from "./Chat";
import IRoom from "../types/IRoom";
import { connectionApi } from "../api/services/connectionApi";
import { useEffect, useRef, useState } from "react";

const VoiceCall = ({
  currentRoom,
  setIsInCall,
}: {
  currentRoom: IRoom | null | undefined;
  setCurrentRoom: (room: IRoom | null) => void;
  setIsInCall: (value: boolean) => void;
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const baseURL = import.meta.env.VITE_PUBLIC_API_URL;

  // Получаем локальный аудиопоток один раз при входе в звонок
  useEffect(() => {
    if (currentRoom) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        localStreamRef.current = stream;
        // mute если нужно
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMicMuted;
        });
      });
    }
    return () => {
      // Останавливаем треки при выходе
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    };
  }, [currentRoom]);

  // Слежение за изменением mute
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMicMuted;
      });
    }
  }, [isMicMuted]);

  const toggleMic = () => {
    setIsMicMuted((prev) => !prev);
  };

  const onRoomLeave = () => {
    connectionApi.connection?.invoke("LeaveRoom");
    setIsInCall(false);
  };

  return (
    <div className="w-full flex">
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col bg-gray-700">
          {/* Call Header */}
          <div className="h-12 px-4 border-b border-gray-600 flex items-center justify-between">
            <span className="font-bold text-white">{currentRoom?.title}</span>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`text-gray-400 hover:text-gray-200 transition-colors ${
                isChatOpen ? "text-white" : ""
              }`}
            >
              <FontAwesomeIcon icon={faMessage} />
            </button>
          </div>

          {/* Call Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <div className="grid grid-cols-3 gap-10 mb-10">
                {currentRoom?.users && (
                  <>
                    {currentRoom.users.map((user) => (
                      <div className="w-50 h-50 rounded-full bg-[#5865f2] flex items-center justify-center text-white shadow-md overflow-hidden">
                        {user.avatarUrl ? (
                          <img
                            src={baseURL + "/avatars/" + user.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl font-medium">
                            {user.login[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
              <div className="mb-8">Голосовой канал</div>
              <div className="flex gap-4 justify-center">
                <button
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    isMicMuted ? "bg-gray-400" : "bg-gray-600 hover:bg-gray-500"
                  }`}
                  onClick={toggleMic}
                  title={isMicMuted ? "Включить микрофон" : "Выключить микрофон"}
                >
                  <FontAwesomeIcon icon={faMicrophone} style={{ opacity: isMicMuted ? 0.4 : 1 }} />
                </button>
                <button className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white hover:bg-gray-500">
                  <FontAwesomeIcon icon={faHeadphones} />
                </button>
                <button className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white hover:bg-gray-500">
                  <FontAwesomeIcon icon={faVideoCamera} />
                </button>
                <button
                  onClick={() => onRoomLeave()}
                  className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600"
                >
                  <FontAwesomeIcon icon={faPhoneSlash} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="w-[300px] border-l border-gray-600">
            <Chat isShowAllUsers={false} setIsShowAllUsers={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceCall;
