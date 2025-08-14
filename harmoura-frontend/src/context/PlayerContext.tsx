// src/context/PlayerContext.tsx
import { createContext, useContext, useRef, useState } from "react";

const BASE_URL = "http://127.0.0.1:8000";
const toFullUrl = (u?: string) =>
  !u ? "" : u.startsWith("http") ? u : `${BASE_URL}${u}`;

const PlayerContext = createContext<any>(null);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [songs, setSongs] = useState<any[]>([]);
  const [currentSong, setCurrentSong] = useState<any | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlaySong = (song: any, allSongs?: any[]) => {
    if (!song) return;

    // Prevent double-click restart if the same song is already playing
    if (currentSong && currentSong.id === song.id) {
      togglePlayPause();
      return;
    }

    const raw = song?.src || song?.file || song?.audio || "";
    const audioUrl = toFullUrl(raw);
    if (!audioUrl) {
      console.error("No valid audio URL for song:", song);
      return;
    }

    // Update playlist if provided
    let updatedSongs = songs;
    if (allSongs && allSongs.length) {
      setSongs(allSongs);
      updatedSongs = allSongs;
    }

    const playable = { ...song, src: audioUrl };
    setCurrentSong(playable);
    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current
        .play()
        .catch((err) => console.log("Play blocked:", err));
    }

    const index = updatedSongs.findIndex((s) => s.id === song.id);
    setCurrentSongIndex(index !== -1 ? index : null);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Play blocked:", err));
    }
  };

  const playNext = () => {
    if (currentSongIndex === null || songs.length === 0) return;
    const nextIndex = (currentSongIndex + 1) % songs.length;
    handlePlaySong(songs[nextIndex]);
    setCurrentSongIndex(nextIndex);
  };

  const playPrevious = () => {
    if (currentSongIndex === null || songs.length === 0) return;
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    handlePlaySong(songs[prevIndex]);
    setCurrentSongIndex(prevIndex);
  };

  return (
    <PlayerContext.Provider
      value={{
        songs,
        setSongs,
        currentSong,
        currentSongIndex,
        isPlaying,
        handlePlaySong,
        togglePlayPause,
        playNext,
        playPrevious,
        audioRef,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        onEnded={playNext}
        onError={(e) =>
          console.error("Audio error. src=", e.currentTarget?.src)
        }
      />
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);