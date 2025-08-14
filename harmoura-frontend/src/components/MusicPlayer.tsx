import { useState, useRef, useEffect } from "react";
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa";

interface MusicPlayerProps {
  song: { title: string; artist: string; src: string };
  onClose: () => void;
}

export default function MusicPlayer({ song, onClose }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const BASE_URL = "http://127.0.0.1:8000";
  const fullSrc = song?.src?.startsWith("http")
    ? song.src
    : `${BASE_URL}${song?.src || ""}`;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = fullSrc;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Autoplay blocked or failed:", err));
    }
  }, [fullSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current
        .play()
        .catch((err) => console.error("Play failed:", err));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full backdrop-blur-md bg-[#f9243d]/90 text-white flex items-center justify-between px-6 py-4 shadow-lg z-50">
      <div>
        <p className="font-semibold">{song.title}</p>
        <p className="text-sm text-white/80">{song.artist}</p>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-xl hover:scale-110 transition-transform">
          <FaStepBackward />
        </button>

        <button
          onClick={togglePlay}
          className="bg-white text-[#f9243d] p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>

        <button className="text-xl hover:scale-110 transition-transform">
          <FaStepForward />
        </button>
      </div>

      <button
        onClick={() => {
          if (audioRef.current) audioRef.current.pause();
          onClose();
        }}
        className="text-sm bg-white text-[#f9243d] px-3 py-1 rounded-full hover:bg-gray-200"
      >
        ✕
      </button>

      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onError={(e) => {
          console.error("Audio load error:", e.currentTarget.src);
        }}
      />
    </div>
  );
}