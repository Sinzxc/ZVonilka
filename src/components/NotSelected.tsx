import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeHigh } from "@fortawesome/free-solid-svg-icons";

export default function NotSelected() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
      <FontAwesomeIcon
        icon={faVolumeHigh}
        className="text-gray-400 text-6xl mb-4"
      />
      <h2 className="text-2xl font-bold text-white mb-2">
        Голосовой канал не выбран
      </h2>
      <p className="text-gray-400 text-center">
        Выберите голосовой канал слева, чтобы присоединиться к разговору
      </p>
    </div>
  );
}
