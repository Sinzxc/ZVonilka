import { apiInstance } from "../base";
import IUser from "../../types/IUser";
import IRoom from "../../types/IRoom";

class RoomsApi {
  navigate: (path: string) => void = () => {};
  isLoading: boolean = false;
  currentUser: IUser | undefined = undefined;
  setNavigate = (navigateFunc: (path: string) => void) => {
    this.navigate = navigateFunc;
  };

  createRoom = async (roomName: string) => {
    try {
      this.isLoading = true;
      const response = await apiInstance.post(
        `/Room/CreateRoom?title=${roomName}`
      );
      console.log(response);
    } catch (error) {
      switch (error.code) {
        case 400:
          alert("Комната уже существует");
          break;
        default:
          throw new Error("Неизвестная ошибка");
      }
    } finally {
      this.isLoading = false;
    }
  };
  getRooms = async () => {
    try {
      this.isLoading = true;
      const response = await apiInstance.get<{
        rooms: IRoom[];
        totalCount: number;
      }>(`/Room/GetRooms`); 
      console.log(response);
      return response.rooms;
    } catch (error) {
      switch (error.code) {
        case 404:
          alert("Комнаты не найдены");
          break;
        default:
          throw new Error("Неизвестная ошибка");
      }
    } finally {
      this.isLoading = false;
    }
  };
}

export const roomsApi = new RoomsApi();
