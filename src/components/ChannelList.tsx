import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVolumeHigh,
  faPlus,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import IUser from "../types/IUser";
import IRoom from "../types/IRoom";
import { authApi } from "../api/services/authApi";
import { roomsApi } from "../api/services/roomsApi";
import { connectionApi } from "../api/services/connectionApi";
import { useState } from "react";
import CreateRoomModal from "./modals/CreateRoomModal";

interface ChannelListProps {
  currentUser: IUser;
  rooms: IRoom[];
  setCurrentRoom: (room: IRoom) => void;
  setIsInCall: (value: boolean) => void;
}

const ChannelList = ({
  currentUser,
  rooms: allRooms,
  setCurrentRoom,
  setIsInCall,
}: ChannelListProps) => {
  const navigate = useNavigate();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError("Название комнаты не может быть пустым");
      return;
    }
    try {
      roomsApi.createRoom(roomName.trim());
      setShowModal(false);
      setRoomName("");
      setError("");
    } catch (err: any) {
      setError(err.message || "Ошибка создания комнаты");
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-800">
      {/* Server Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors duration-200">
        <h1 className="font-bold text-white text-lg">VibeCast</h1>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="select-none">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-bold tracking-widest text-gray-400">
              КОМНАТЫ
            </span>
            <FontAwesomeIcon
              icon={faPlus}
              className="text-gray-400 cursor-pointer hover:text-white text-[10px]"
              onClick={() => setShowModal(true)}
            />
          </div>
          <div className="space-y-1 ml-2">
            {allRooms.map((room) => (
              <div
                key={room.id}
                className="px-2 py-[6px] hover:bg-gray-700/40 cursor-pointer group transition-all duration-150 rounded-md"
              >
                <div
                  onClick={() => {
                    setCurrentRoom(room);
                    connectionApi.connection?.invoke("JoinRoom", room.id);
                    setIsInCall(true);
                  }}
                  className="flex items-center rounded-[4px]"
                >
                  <FontAwesomeIcon
                    icon={faVolumeHigh}
                    className="mr-2 text-gray-400 group-hover:text-gray-200 text-[15px]"
                  />
                  <span className="text-[15px] text-gray-400 group-hover:text-gray-200">
                    {room.title}
                  </span>
                </div>
                {room.users.length !== 0 && (
                  <div className="flex flex-col gap-2">
                    {room.users.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 mt-3 ml-2">
                        <div className="w-5 h-5 rounded-full bg-[#5865f2] flex items-center justify-center text-white shadow-md overflow-hidden">
                          {user.avatarUrl ? (
                            <img
                              src={"/avatars/" + user.avatarUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-medium">
                              {user.login[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-white">{user.login}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div
        onClick={() => navigate("/profile")}
        className="h-14 px-3 bg-gray-900/40 flex items-center justify-between group hover:bg-gray-900/60 transition-colors duration-200 cursor-pointer"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white shadow-md overflow-hidden">
            {currentUser && currentUser.avatarUrl ? (
              <img
                src={"/avatars/" + currentUser.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium">
                {currentUser && currentUser.login[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="ml-2">
            <div className="text-sm font-medium text-white">
              {currentUser && currentUser.login}
            </div>
          </div>
        </div>
        <button
          onClick={() => authApi.logout()}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
        </button>
      </div>

      {showModal && (
        <CreateRoomModal
          setShowModal={setShowModal}
          roomName={roomName}
          setRoomName={setRoomName}
          handleCreateRoom={handleCreateRoom}
          error={error}
          setError={setError}
        />
      )}
    </div>
  );
};

export default ChannelList;
