import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/services/authApi";

export const Login = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (login == "" || password == "") setError("Укажите все данные");
      await authApi.login(login, password);
    } catch (err) {
      if (err instanceof Error) setError(err.message || "Failed to login");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          VibeCast
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              placeholder="Введите имя пользователя"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
              placeholder="Введите пароль"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition-colors"
          >
            Войти
          </button>
        </form>

        <p className="text-gray-400 text-center mt-6">
          Ещё нет аккаунта?{" "}
          <Link to="/register" className="text-blue-500 hover:text-blue-400">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  );
};
