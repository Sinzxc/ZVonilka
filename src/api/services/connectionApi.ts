import * as signalR from "@microsoft/signalr";

class ConnectionApi {
  navigate: (path: string) => void = () => {};
  isLoading: boolean = false;
  connection: signalR.HubConnection | null = null;

  connect = async () => {
    try {
      const signalRServerUrl = import.meta.env.VITE_SIGNALR_SERVER;
      console.log("SignalR Server URL:", signalRServerUrl);
      const token = localStorage.getItem("token");

      const hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(signalRServerUrl, { accessTokenFactory: () => token || "" })
        .configureLogging(signalR.LogLevel.Debug)
        .withAutomaticReconnect()
        .build();

      hubConnection
        .start()
        .then(() => console.log("Connected to SignalR server"))
        .catch((err) => console.error("SignalR connection error:", err));

      this.connection = hubConnection;

      return () => {
        hubConnection.stop();
      };
    } catch (error: any) {
      switch (error.code) {
        default:
          throw new Error("Неизвестная ошибка подключения");
      }
    } finally {
      this.isLoading = false;
    }
  };
}

export const connectionApi = new ConnectionApi();
