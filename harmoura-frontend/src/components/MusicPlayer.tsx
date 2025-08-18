// src/components/MusicPlayer.tsx
import { useEffect } from "react";
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";

interface MusicPlayerProps {
  onClose: () => void;
}

export default function MusicPlayer({ onClose }: MusicPlayerProps) {
  const {
    currentSong,
    isPlaying,
    togglePlayPause,
    playNext,
    playPrevious,
    audioRef,
  } = usePlayer();

  // Auto-play when a new song is selected
  useEffect(() => {
    if (!currentSong || !audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.src = currentSong.src;
    audioRef.current.load();

    audioRef.current
      .play()
      .then(() => {
        if (!isPlaying) togglePlayPause();
      })
      .catch((err) => console.error("Play blocked:", err));

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [currentSong]);

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full backdrop-blur-md bg-[#f9243d]/90 text-white flex items-center justify-between px-6 py-4 shadow-lg z-50 relative">
      
      {/* Song info */}
      <div className="w-64 overflow-hidden">
        <p className="font-semibold truncate">{currentSong.title}</p>
        <p className="text-sm text-white/80 truncate">{currentSong.artist}</p>
      </div>

      {/* Centered controls */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-6 text-xl">
        <button onClick={playPrevious} className="hover:scale-110 transition-transform" aria-label="Previous">
          <FaStepBackward />
        </button>

        <button
          onClick={togglePlayPause}
          className="bg-white text-[#f9243d] p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>

        <button onClick={playNext} className="hover:scale-110 transition-transform" aria-label="Next">
          <FaStepForward />
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="text-sm bg-white text-[#f9243d] px-3 py-1 rounded-full hover:bg-gray-200"
      >
        ✕
      </button>
    </div>
  );
}