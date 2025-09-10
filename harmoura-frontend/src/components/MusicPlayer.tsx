import { useEffect, useState, useRef } from "react";
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaEllipsisV,
  FaTrash,
} from "react-icons/fa";
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
    queue,
    handlePlaySong,
    clearQueue,
    removeFromQueue,
  } = usePlayer();

  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showQueue, setShowQueue] = useState(false);

  const queueRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

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

  // Close queue if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        showQueue &&
        queueRef.current &&
        !queueRef.current.contains(target) &&
        playerRef.current &&
        !playerRef.current.contains(target)
      ) {
        setShowQueue(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showQueue]);

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
          ref={playerRef}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="fixed bottom-0 left-0 w-full 
          bg-gradient-to-r from-[#f9243d] to-pink-600 
          backdrop-blur-xl text-white shadow-2xl z-50 rounded-t-2xl overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="relative h-1 group cursor-pointer rounded-t-2xl overflow-hidden">
            <motion.div
              className="h-1 bg-gradient-to-r from-white via-pink-200 to-white shadow-sm"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.1 }}
            />
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
          <div className="relative flex items-center justify-between px-4 py-3 md:px-6 md:py-3">
            {/* Left: Song Info */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="w-36 md:w-56 overflow-hidden"
            >
              <p className="font-bold truncate text-sm md:text-base drop-shadow-md">
                {currentSong.title}
              </p>
              <p className="text-xs md:text-sm text-white/70 truncate">
                {currentSong.artist}
              </p>
            </motion.div>

            {/* Center: Controls */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 text-lg md:text-xl">
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.15 }}
                onClick={playPrevious}
                className="hover:text-white/90 transition-transform"
              >
                <FaStepBackward />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.15 }}
                onClick={togglePlayPause}
                className="bg-white text-[#f9243d] p-4 md:p-5 rounded-full shadow-lg hover:shadow-xl transition-transform"
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.15 }}
                onClick={playNext}
                className="hover:text-white/90 transition-transform"
              >
                <FaStepForward />
              </motion.button>
            </div>

            {/* Right: Options */}
            <div className="w-36 md:w-56 flex justify-end items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.2, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowQueue((prev) => !prev)}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 backdrop-blur-md shadow-md"
              >
                <FaEllipsisV />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={handleClose}
                className="text-xs md:text-sm bg-white text-[#f9243d] px-2 py-1 md:px-3 md:py-1 rounded-full hover:bg-gray-200 shadow-md"
              >
                ✕
              </motion.button>
            </div>
          </div>

          {/* Queue Section */}
          <AnimatePresence initial={false}>
            {showQueue && (
              <motion.div
                ref={queueRef}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="border-t border-white/20 backdrop-blur-xl overflow-hidden"
              >
                <div className="p-3 space-y-3">
                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold">Up Next</h3>
                    {queue.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        onClick={clearQueue}
                        className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full hover:bg-white/30 shadow-sm"
                      >
                        <FaTrash className="text-xs" /> Clear
                      </motion.button>
                    )}
                  </div>

                  {/* Queue List */}
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {queue.length > 0 ? (
                      queue.map((song) => (
                        <motion.div
                          key={song.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="w-full flex justify-between items-center px-3 py-2 
                          bg-white/10 rounded-xl hover:bg-white/20 
                          transition backdrop-blur-md shadow-sm"
                        >
                          <button
                            onClick={() => handlePlaySong(song)}
                            className="flex-1 text-left truncate"
                          >
                            {song.title}
                          </button>
                          <span className="text-xs text-white/70 mr-2">
                            {song.artist}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => removeFromQueue(song.id)}
                            className="text-xs bg-white/20 px-2 py-1 rounded-full hover:bg-white/30 shadow"
                          >
                            ✕
                          </motion.button>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-white/60 text-sm italic">
                        Queue is empty. Add some songs!
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}