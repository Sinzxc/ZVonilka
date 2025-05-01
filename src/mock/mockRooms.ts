import IRoom from "../types/IRoom";
import mockUsers from "./mockUsers";
import mockMessages from "./mockMessages";

const mockRooms: IRoom[] = [
  {
    id: 1,
    title: "Gym",
    owner: mockUsers[0], // Billy is the owner
    messages: mockMessages[0],
    users: mockUsers,
    totalCount: mockUsers.length,
  },
  {
    id: 2,
    title: "Wrestling",
    owner: mockUsers[1], // Van is the owner
    messages: mockMessages[1],
    users: [mockUsers[1], mockUsers[2]], // Van and Ricardo
    totalCount: 2,
  },
  {
    id: 3,
    title: "Performance",
    owner: mockUsers[2], // Ricardo is the owner
    messages: mockMessages[2],
    users: [mockUsers[2]], // Just Ricardo
    totalCount: 1,
  },
];

export default mockRooms;
