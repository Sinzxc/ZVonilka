import { apiInstance } from "../base";
import IMessage from "../../types/IMessage";

class MessagesApi {
  async getMessagesByRoomId(roomId: number, page = 1, pageSize = 10) {
    return apiInstance.get<{ messages: IMessage[]; totalCount: number }>(
      `/Messages/GetMessagesByRoomId?id=${roomId}&page=${page}&pageSize=${pageSize}`
    );
  }
}

export const messagesApi = new MessagesApi();