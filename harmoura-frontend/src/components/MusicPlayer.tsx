import { useEffect, useState } from "react";
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";

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

  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (currentSong) setVisible(true);
  }, [currentSong]);

  useEffect(() => {
    if (!currentSong || !audioRef.current) return;

    const audio = audioRef.current;

    audio.pause();
    audio.src = currentSong.src;
    audio.load();

    audio
      .play()
      .then(() => {
        if (!isPlaying) togglePlayPause();
      })
      .catch((err) => console.error("Play blocked:", err));

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("timeupdate", updateProgress);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", updateProgress);
    };
  }, [currentSong]);

  if (!currentSong || !visible) return null;

  const handleClose = () => {
    if (audioRef.current) audioRef.current.pause();
    setVisible(false);
    onClose();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="fixed bottom-0 left-0 w-full 
          bg-gradient-to-r from-[#f9243d] to-pink-600 
          backdrop-blur-md text-white shadow-2xl z-50 rounded-t-2xl"
        >
          {/* Progress Bar with Seek */}
          <div className="relative h-1 group cursor-pointer">
            {/* Visual progress */}
            <motion.div
              className="h-1 bg-white/30 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.2 }}
            />
            {/* Transparent range input */}
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={handleSeek}
              className="absolute top-0 left-0 w-full h-1 opacity-0 cursor-pointer"
            />
          </div>

          {/* Main Row */}
          <div className="relative flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
            {/* Left: Song Info */}
            <div className="w-40 md:w-64 overflow-hidden">
              <p className="font-bold truncate text-sm md:text-base">
                {currentSong.title}
              </p>
              <p className="text-xs md:text-sm text-white/70 truncate">
                {currentSong.artist}
              </p>
            </div>

            {/* Center: Controls */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 text-lg md:text-xl">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={playPrevious}
                className="hover:scale-125 transition-transform"
                aria-label="Previous"
              >
                <FaStepBackward />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={togglePlayPause}
                className="bg-white text-[#f9243d] p-3 md:p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={playNext}
                className="hover:scale-125 transition-transform"
                aria-label="Next"
              >
                <FaStepForward />
              </motion.button>
            </div>

            {/* Right: Close */}
            <div className="w-40 md:w-64 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="text-xs md:text-sm bg-white text-[#f9243d] px-2 py-1 md:px-3 md:py-1 rounded-full hover:bg-gray-200"
              >
                ✕
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}