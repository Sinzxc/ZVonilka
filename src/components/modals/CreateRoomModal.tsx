interface ICreateRoomModalProps {
    setShowModal: (value: boolean) => void;
    setRoomName: (value: string) => void;
    setError: (value: string) => void;
    error: string;
    handleCreateRoom: (e: React.FormEvent) => void;
    roomName: string;
}

const CreateRoomModal = ({setError, setRoomName, setShowModal, roomName, handleCreateRoom, error}: ICreateRoomModalProps) => {

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 shadow-2xl p-8 w-full max-w-xl relative border border-gray-700">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-400 text-xl"
              onClick={() => {
                setShowModal(false);
                setRoomName("");
                setError("");
              }}
              aria-label="Закрыть"
            >
              ×
            </button>
            <h2 className="text-xl font-bold text-white mb-4 text-center">Создать комнату</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <input
                type="text"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                placeholder="Название комнаты"
                className="w-full px-4 py-2 rounded-lg text-white border border-gray-700 focus:outline-none focus:border-blue-500 transition"
                autoFocus
              />
              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}
              <button
                type="submit"
                className="w-full bg-[#5865f2] text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Создать
              </button>
            </form>
          </div>
        </div>
    )
}

export default CreateRoomModal;