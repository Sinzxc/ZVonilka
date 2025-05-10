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
import { useState } from "react";
import IUser from "../types/IUser";

const VoiceCall = ({
  currentRoom,
  setIsInCall,
  IsMicrophoneMuted,
  IsFullMuted,
  setIsMicrophoneMuted,
  setIsFullMuted,
  currentUser
}: {
  currentRoom: IRoom | null | undefined;
  setCurrentRoom: (room: IRoom | null) => void;
  setIsInCall: (value: boolean) => void;
  setIsMicrophoneMuted: (value: boolean) => void;
  setIsFullMuted: (value: boolean) => void;
  IsMicrophoneMuted: boolean;
  IsFullMuted: boolean;
  currentUser: IUser
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const onRoomLeave = () => {
    connectionApi.connection?.invoke("Handle", "LeaveRoom", {});
    setIsInCall(false);
  };

  const avatarBaseUrl = import.meta.env.VITE_PUBLIC_API_URL;

  return (
    <div className="w-full flex">
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Call Header */}
          <div className="h-12 px-4 border-b border-gray-800 flex items-center justify-between">
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
              <div
                className={`flex flex-wrap justify-center gap-10 mb-10 ${
                  currentRoom?.users && currentRoom.users.length > 3
                    ? "max-w-[600px]"
                    : ""
                }`}
              >
                {currentRoom?.users && (
                  <>
                    {currentRoom.users.map((user) => (
                      <div
                        key={user.id}
                        className="w-50 h-50 rounded-full bg-[#5865f2] flex items-center justify-center text-white shadow-md overflow-hidden"
                      >
                        {user.avatarUrl ? (
                          <img
                            src={avatarBaseUrl + "/avatars/" + user.avatarUrl}
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
                    IsMicrophoneMuted
                      ? "bg-gray-400"
                      : "bg-gray-600 hover:bg-gray-500"
                  }`}
                  onClick={() => {
                    setIsMicrophoneMuted(!IsMicrophoneMuted);
                    setIsFullMuted(false);
                  }}
                  title={
                    IsMicrophoneMuted
                      ? "Включить микрофон"
                      : "Выключить микрофон"
                  }
                >
                  <FontAwesomeIcon
                    icon={faMicrophone}
                    style={{ opacity: IsMicrophoneMuted ? 0.4 : 1 }}
                  />
                </button>
                <button
                  onClick={() => {
                    setIsFullMuted(!IsFullMuted);
                  }}
                  className={`w-10 h-10 rounded-full  flex items-center justify-center text-white hover:bg-gray-500 ${
                    IsFullMuted
                      ? "bg-gray-400"
                      : "bg-gray-600 hover:bg-gray-500"
                  }`}
                >
                  <FontAwesomeIcon
                    style={{ opacity: IsFullMuted ? 0.4 : 1 }}
                    icon={faHeadphones}
                  />
                </button>
                <button
                  onClick={() => alert("Ну не тыкай")}
                  className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white hover:bg-gray-500"
                >
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
        {isChatOpen && connectionApi.connection && currentRoom && (
          <div className="w-[400px] border-l border-gray-800">
            <Chat currentRoom={currentRoom} currentUser={currentUser} connection={connectionApi.connection} isShowAllUsers={false} setIsShowAllUsers={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceCall;
