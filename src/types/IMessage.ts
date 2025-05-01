import IUser from "./IUser";

export default interface IMessage {
  id: number;
  from: IUser;
  sendAt: string;
  content: string;
}
