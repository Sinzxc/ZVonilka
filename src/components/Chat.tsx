import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
  faHashtag,
  faFaceSmile,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";

type Message = {
  id: number;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
};

type ChatProps = {
  isShowAllUsers: boolean;
  setIsShowAllUsers: (value: boolean) => void;
};

const Chat = ({ isShowAllUsers, setIsShowAllUsers }: ChatProps) => {
  // Моковые данные для сообщений
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      author: "Пользователь 1",
      avatar: "1",
      content: "Привет всем! Как дела?",
      timestamp: "12:30",
    },
    {
      id: 2,
      author: "Пользователь 2",
      avatar: "2",
      content: "Всё отлично! Что нового?",
      timestamp: "12:32",
    },
    {
      id: 3,
      author: "Пользователь 3",
      avatar: "3",
      content: "Я только что присоединился к серверу. Рад быть здесь!",
      timestamp: "12:35",
    },
  ]);

  const [newMessage, setNewMessage] = useState("");
  const [isShowEmojis, setIsShowEmojis] = useState<boolean>(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg: Message = {
      id: messages.length + 1,
      author: "Вы",
      avatar: "U",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-900">
      {/* Заголовок канала */}
      <div className="h-12 px-4 border-b border-gray-600 flex items-center justify-between shadow-sm">
        <div>
          <FontAwesomeIcon icon={faHashtag} className="text-gray-400 mr-2" />
          <span className="font-bold text-white">общий</span>
        </div>
        <button
          className="cursor-pointer text-gray-400 hover:text-gray-200 duration-300 mr-2"
          onClick={() => setIsShowAllUsers(!isShowAllUsers)}
        >
          <FontAwesomeIcon icon={faUserGroup} />
        </button>
      </div>

      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex hover:bg-gray-600/20 p-2 rounded"
          >
            <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white mr-3 flex-shrink-0">
              <span>{message.avatar}</span>
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-medium text-blue-400">
                  {message.author}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  {message.timestamp}
                </span>
              </div>
              <p className="text-gray-200">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Форма отправки сообщения */}
      <div className="p-4">
        <form onSubmit={handleSendMessage} className="relative">
          <div className="flex items-center bg-gray-600 rounded-lg px-4 py-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Написать сообщение..."
              className="flex-1 bg-transparent outline-none text-gray-200 placeholder:text-gray-400"
            />
            <div className="flex items-center space-x-2 text-gray-400">
              {isShowEmojis && (
                <div className="absolute bottom-full right-0 mb-2">
                  <EmojiPicker
                    theme={Theme.DARK}
                    onEmojiClick={(value) => {
                      setNewMessage((prev) => prev + value.emoji);
                      setIsShowEmojis(false);
                    }}
                  />
                </div>
              )}
              <button
                onClick={() => setIsShowEmojis(!isShowEmojis)}
                type="button"
                className="hover:text-gray-200"
              >
                <FontAwesomeIcon icon={faFaceSmile} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
