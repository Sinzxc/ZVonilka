import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faCamera } from "@fortawesome/free-solid-svg-icons";
import IUser from "../types/IUser";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/services/authApi";
import { apiInstance } from "../api/base";

interface ProfileProps {
  user: IUser;
  setUser: (user: IUser) => void;
}

const Profile = ({ user, setUser }: ProfileProps) => {
  const [login, setLogin] = useState(user.login);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_PUBLIC_API_URL;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (file) {
      try {
        await apiInstance.uploadAvatar("/Avatar/SetAvatar", file);
      } catch (error: any) {
        alert(error.message || "Failed to upload avatar");
      } finally {
        authApi.getUser();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login.trim()) {
      setUser({
        ...user,
        login: login.trim(),
      });
      navigate("/");
    }
  };

  return (
    <div className="bg-gray-700 w-full h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <h1 className="text-xl font-bold text-white">Настройки пользователя</h1>
        <button
          onClick={() => {
            navigate("/");
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faXmark} size="lg" />
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Settings Panel */}
        <div className="w-1/2 p-6 border-r border-gray-600">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                USERNAME
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                NEW PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                AVATAR
              </label>
              <div className="relative w-24 h-24 group cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  {user.avatarUrl ? (
                    <img
                      src={"/avatars/" + user.avatarUrl}
                      className="h-full w-full object-cover rounded-md"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                      {login[0].toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <FontAwesomeIcon
                      icon={faCamera}
                      className="text-white text-xl"
                    />
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
            >
              Сохранить изменения
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
