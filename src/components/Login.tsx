import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/services/authApi";
import { motion } from "framer-motion";
import logo from "../img/logo.png";

export const Login = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (login === "" || password === "") {
        setError("Укажите все данные");
        return;
      }
      await authApi.login(login, password);
    } catch (err) {
      if (err instanceof Error) setError(err.message || "Failed to login");
    }
  };

  return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center"
        >
          <div className="rounded-2xl w-full max-w-md p-8 flex flex-col items-center">
            <div className="mb-6 flex flex-col items-center">
              <img className="w-128 flex items-center justify-center mb-2" src={logo} alt="" />
            </div>

            {error && (
              <div className="w-full bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-6 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Логин</label>
                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all"
                  placeholder="Введите логин"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Пароль</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400 transition-all"
                  placeholder="Введите пароль"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold text-lg shadow-md transition-all"
              >
                Войти
              </button>
            </form>

            <p className="text-gray-400 text-center mt-6 text-sm">
              Нет аккаунта?{" "}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 underline transition">
                Регистрация
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
  );
};
