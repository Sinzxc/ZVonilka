import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import EmojiPicker, { Theme } from "emoji-picker-react";
import {
  faHashtag,
  faFaceSmile,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { HubConnection } from "@microsoft/signalr";
import IUser from "../types/IUser";
import IMessage from "../types/IMessage";
import { messagesApi } from "../api/services/messagesApi";
import IRoom from "../types/IRoom";

type Message = {
  id: number;
  from: IUser;
  sendAt: string;
  content: string;
};

type ChatProps = {
  isShowAllUsers: boolean;
  connection: HubConnection;
  currentUser: IUser;
  setIsShowAllUsers: (value: boolean) => void;
  currentRoom: IRoom;
};

function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const day = pad(date.getDate());
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

const Chat = ({ isShowAllUsers, setIsShowAllUsers, connection, currentUser, currentRoom }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [newMessage, setNewMessage] = useState("");
  const [isShowEmojis, setIsShowEmojis] = useState<boolean>(false);

  const avatarBaseUrl = import.meta.env.VITE_PUBLIC_API_URL;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg: Message = {
      id: messages.length + 1,
      from: currentUser,
      content: newMessage,
      sendAt: new Date().toISOString(),
    };

    connection.invoke("Handle", "SendMessage", newMessage);
    
    setMessages([...messages, newMsg]);
    setNewMessage("");
  };

  const fetchMessages = async (roomId: number, pageNum: number) => {
    setLoading(true);
    const res = await messagesApi.getMessagesByRoomId(roomId, pageNum, 10);
    setMessages(prev => {
      if (pageNum === 1) {
        return res.messages;
      }
      // Добавляем только те сообщения, которых еще нет в prev
      const existingIds = new Set(prev.map(m => m.id));
      const newMessages = res.messages.filter(m => !existingIds.has(m.id));
      return [...prev, ...newMessages];
    });
    setTotalCount(res.totalCount);
    setLoading(false);
  };

  useEffect(() => {
    if (!currentRoom) return;
    setPage(1);
    fetchMessages(currentRoom.id, 1);
  }, [currentRoom]);

  useEffect(() => {
    connection.on("ReceiveMessage", (message: IMessage) => {
      setMessages(prevMessages => [...prevMessages, message]);
    })
  }, [])

  const handleShowMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(currentRoom.id, nextPage);
  };

  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll to bottom on new messages (if at bottom)
  useEffect(() => {
    if (!showScrollToBottom) {
      scrollToBottom();
    }
  }, [messages]);

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const threshold = 100; // px from bottom to consider "at bottom"
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      setShowScrollToBottom(!atBottom);
    };
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      // Initial check
      handleScroll();
    }
    return () => {
      if (container) container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-900">
      {/* Заголовок канала */}
      <div className="h-12 px-4 border-b border-gray-800 flex items-center justify-between shadow-sm">
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
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar relative"
        ref={scrollContainerRef}
      >
        {messages.length < totalCount && (
          <button
            onClick={handleShowMore}
            disabled={loading}
            className="
              w-full
              mb-4 px-6 py-3
              rounded-lg
              bg-gray-800
              text-gray-100
              font-semibold
              border border-gray-700
              shadow-md
              hover:bg-gray-700 hover:border-gray-500
              transition-all
              flex items-center justify-center gap-3
              self-center
              focus:outline-none
              disabled:opacity-60
            "
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"
                  aria-label="Загрузка"
                />
                Загрузка...
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon={faHashtag} className="text-blue-400 text-lg" />
                <span className="tracking-wide">Показать еще</span>
              </>
            )}
          </button>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex hover:bg-gray-600/20 p-2 rounded"
          >
            {message.from.avatarUrl ? (
              <img
                src={avatarBaseUrl + "/avatars/" + message.from.avatarUrl}
                className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white mr-3 flex-shrink-0"
                alt=""
              />
              ) : (
              <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white mr-3 flex-shrink-0">
                {message.from.login[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center">
                <span className="font-medium text-blue-400">
                  {message.from.login}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  {formatDateTime(message.sendAt)}
                </span>
              </div>
              <p className="text-gray-200 break-all">{message.content}</p>
            </div>
          </div>
        ))}
        {/* Invisible div to scroll to bottom */}
        <div ref={messagesEndRef} />
        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-8 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-blue-600/80 text-white shadow-lg hover:bg-blue-700/90 transition-all"
            aria-label="Вернуться к последним сообщениям"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
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
