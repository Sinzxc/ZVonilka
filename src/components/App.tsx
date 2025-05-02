import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import ChannelList from "./ChannelList";
import VoiceCall from "./VoiceCall";
import Profile from "./Profile";
import IRoom from "../types/IRoom";
import NotSelected from "./NotSelected";
import IUser from "../types/IUser";
import mockUsers from "../mock/mockUsers";
import { Login } from "./Login";
import { Register } from "./Register";
import { authApi } from "../api/services/authApi";
import { connectionApi } from "../api/services/connectionApi";
import { roomsApi } from "../api/services/roomsApi";
import Calling from "./Calling";

function App() {
  const [currentUser, setCurrentUser] = useState<IUser>(mockUsers[0]);
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<IRoom | null>();
  const [isInCall, setIsInCall] = useState<boolean>(false);
  const [isMicrophoneMuted, setIsMicrophoneMuted] = useState<boolean>(false);
  const [isFullMuted, setIsFullMuted] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  authApi.setNavigate(navigate);

  const updateRooms = (room: IRoom) => {
    setRooms((prevRooms) => {
      return prevRooms.map((r) => (r.id === room.id ? room : r));
    });
  };

  useEffect(() => {
    const initialize = async () => {
      if (location.pathname != "/login" && location.pathname != "/register") {
        const isAuthorized = await authApi.checkAuth();
        if (isAuthorized) {
          const user = await authApi.getUser();
          connectionApi.connect();
          if (user != undefined) setCurrentUser(user as IUser);
        }
      }
    };
    initialize();
  }, [location]);

  useEffect(() => {
    const getRooms = async () => {
      const rooms = await roomsApi.getRooms();
      if (rooms != undefined) setRooms(rooms);
    };
    getRooms();
  }, []);

  useEffect(() => {
    connectionApi.connection?.on("CreatedRoom", (room: IRoom) => {
      setRooms([...rooms, room]);
    });

    connectionApi.connection?.on("JoinedToOtherRoom", (room: IRoom) => {
      addUserToRoom(room);
    });

    connectionApi.connection?.on("LeavedFromOtherRoom", (room: IRoom) => {
      addUserToRoom(room);
    });

    return () => {
      connectionApi.connection?.off("CreatedRoom");
      connectionApi.connection?.off("JoinedToOtherRoom");
      connectionApi.connection?.off("LeavedFromOtherRoom");
    };
  }, [connectionApi.connection]);

  const addUserToRoom = async (newRoom: IRoom) => {
    setRooms((prevRooms) => {
      const updatedRooms = prevRooms.map((room) =>
        room.id === newRoom.id ? newRoom : room
      );

      return updatedRooms;
    });
  };
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {location.pathname != "/login" && location.pathname != "/register" && (
        <div
          className="flex h-full bg-gray-800 shadow-lg"
          style={{ width: "300px" }}
        >
          <ChannelList
            rooms={rooms}
            currentUser={currentUser}
            setCurrentRoom={setCurrentRoom}
            setIsInCall={setIsInCall}
          />
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={
            isInCall ? (
              <VoiceCall
                setCurrentRoom={setCurrentRoom}
                setIsInCall={setIsInCall}
                currentRoom={currentRoom}
                IsFullMuted={isFullMuted}
                IsMicrophoneMuted={isMicrophoneMuted}
                setIsFullMuted={setIsFullMuted}
                setIsMicrophoneMuted={setIsMicrophoneMuted}
              />
            ) : (
              <NotSelected />
            )
          }
        />
        <Route
          path="/profile"
          element={<Profile user={currentUser} setUser={setCurrentUser} />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Calling
        currentRoom={currentRoom}
        addUserToRoom={addUserToRoom}
        setCurrentRoom={setCurrentRoom}
        currentUser={currentUser}
        isInCall={isInCall}
        updateRooms={updateRooms}
        IsMicrophoneMuted={isMicrophoneMuted}
        IsFullMuted={isFullMuted}
      />
    </div>
  );
}

export default App;
