import { useEffect, useState } from "react";
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

  // Local state to control visibility
  const [visible, setVisible] = useState(true);

  // Reset visibility whenever a new song is selected
  useEffect(() => {
    if (currentSong) setVisible(true);
  }, [currentSong]);

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

  if (!currentSong || !visible) return null;

  const handleClose = () => {
    if (audioRef.current) audioRef.current.pause(); // stop the song
    setVisible(false); // hide player locally
    onClose(); // trigger parent callback
  };

  return (
    <div className="fixed bottom-0 left-0 w-full backdrop-blur-md bg-[#f9243d]/90 text-white flex items-center justify-between px-4 py-3 md:px-6 md:py-4 shadow-lg z-50 relative">
      <div className="w-40 md:w-64 overflow-hidden">
        <p className="font-semibold truncate text-sm md:text-base">{currentSong.title}</p>
        <p className="text-xs md:text-sm text-white/80 truncate">{currentSong.artist}</p>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4 md:gap-6 text-lg md:text-xl">
        <button onClick={playPrevious} className="hover:scale-110 transition-transform" aria-label="Previous">
          <FaStepBackward />
        </button>

        <button
          onClick={togglePlayPause}
          className="bg-white text-[#f9243d] p-3 md:p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>

        <button onClick={playNext} className="hover:scale-110 transition-transform" aria-label="Next">
          <FaStepForward />
        </button>
      </div>

      <button
        onClick={handleClose}
        className="text-xs md:text-sm bg-white text-[#f9243d] px-2 py-1 md:px-3 md:py-1 rounded-full hover:bg-gray-200"
      >
        ✕
      </button>
    </div>
  );
}