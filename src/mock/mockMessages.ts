import IMessage from "../types/IMessage";

const mockMessages: IMessage[] = [
  {
    id: 1,
    from: {
      id: 1,
      login: "Billy",
      createdAt: "2024-01-20T12:00:00",
      roomId: 1,
      connectionId: "conn_billy_1",
    },
    sendAt: "2024-01-20T12:30:00",
    content: "♂ Welcome to the gym ♂",
  },
  {
    id: 2,
    from: {
      id: 2,
      login: "Van",
      createdAt: "2024-01-20T12:00:00",
      roomId: 1,
      connectionId: "conn_van_1",
    },
    sendAt: "2024-01-20T12:32:00",
    content: "♂ Boy next door ♂",
  },
  {
    id: 3,
    from: {
      id: 3,
      login: "Ricardo",
      createdAt: "2024-01-20T12:00:00",
      roomId: 1,
      connectionId: "conn_ricardo_1",
    },
    sendAt: "2024-01-20T12:35:00",
    content: "♂ Deep dark fantasies ♂",
  },
  {
    id: 4,
    from: {
      id: 4,
      login: "Aniki",
      createdAt: "2024-01-20T12:00:00",
      roomId: 1,
      connectionId: "conn_aniki_1",
    },
    sendAt: "2024-01-20T12:40:00",
    content: "♂ Thank you sir ♂",
  },
];

export default mockMessages;
