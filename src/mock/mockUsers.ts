import IUser from "../types/IUser";

const mockUsers: IUser[] = [
  {
    id: 1,
    login: "Billy",
    createdAt: "2024-01-20T12:00:00",
    roomId: 1,
    connectionId: "conn_billy_1",
  },
  {
    id: 2,
    login: "Van",
    createdAt: "2024-01-20T12:00:00",
    roomId: 1,
    connectionId: "conn_van_1",
  },
  {
    id: 3,
    login: "Ricardo",
    createdAt: "2024-01-20T12:00:00",
    roomId: 1,
    connectionId: "conn_ricardo_1",
  },
  {
    id: 4,
    login: "Aniki",
    createdAt: "2024-01-20T12:00:00",
    roomId: 1,
    connectionId: "conn_aniki_1",
  },
];

export default mockUsers;
