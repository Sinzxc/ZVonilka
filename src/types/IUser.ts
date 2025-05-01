export default interface IUser {
  id: number;
  login: string;
  createdAt: string;
  roomId?: number;
  avatarUrl?: string;
  connectionId?: string;
}
