import IMessage from "./IMessage";
import IUser from "./IUser";

export default interface IRoom {
  id: number;
  title: string;
  owner: IUser;
  messages: IMessage[];
  users: IUser[];
  totalCount: number;
}
