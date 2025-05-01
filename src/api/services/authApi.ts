import { apiInstance } from "../base";
import IUser from "../../types/IUser";

class AuthApi {
  navigate: (path: string) => void = () => {};
  isLoading: boolean = false;
  currentUser: IUser | undefined = undefined;
  setNavigate = (navigateFunc: (path: string) => void) => {
    this.navigate = navigateFunc;
  };

  login = async (login: string, password: string) => {
    try {
      this.isLoading = true;
      const response = await apiInstance.get<{ token: string; user: IUser }>(
        `/Authorization/Login?login=${login}&password=${password}`
      );
      const token = response.token;
      localStorage.setItem("token", token);

      localStorage.setItem("user", JSON.stringify(response.user));
      this.navigate("/");
      window.location.reload();
    } catch (error) {
      switch (error.code) {
        case 404:
          throw new Error("Не верные данные");
        default:
          throw new Error("Неизвестная ошибка");
      }
    } finally {
      this.isLoading = false;
    }
  };

  register = async (login: string, password: string) => {
    try {
      this.isLoading = true;
      await apiInstance.get(
        `/Users/Register?login=${login}&password=${password}`
      );
      this.navigate("/login");
    } catch (error) {
      let errorString = "";
      error.data.errors.map((error) => {
        errorString = errorString + "\n" + error;
      });
      throw new Error(errorString);
    } finally {
      this.isLoading = false;
    }
  };

  logout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.navigate("/login");
  };

  checkAuth = async (): Promise<boolean> => {
    const token = localStorage.getItem("token");
    if (!token) {
      this.navigate("/login");
      return false;
    }
    return true;
  };

  getUser = async (): Promise<IUser | undefined> => {
    try {
      this.isLoading = true;
      const data = await apiInstance.get<{ user: IUser }>(`/Users/GetProfile`);
      this.currentUser = data.user;
      localStorage.setItem("user", JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      switch (error.code) {
        case 404:
          throw new Error("Пользователь не найден");
        default:
          throw new Error("Неизвестная ошибка");
      }
    } finally {
      this.isLoading = false;
    }
  };

  uploadAvatar = async (
    formData: FormData
  ): Promise<{ message: string; url: string }> => {
    try {
      this.isLoading = true;
      const response = await apiInstance.post<{ message: string; url: string }>(
        "/Avatar/SetAvatar",
        formData
      );

      if (this.currentUser) {
        this.currentUser.avatarUrl = `/avatars/${response.url}`;
        localStorage.setItem("user", JSON.stringify(this.currentUser));
      }

      return response;
    } catch (error) {
      throw new Error("Не удалось загрузить аватар");
    } finally {
      this.isLoading = false;
    }
  };
}

export const authApi = new AuthApi();
