// src/context/PlayerContext.tsx
import { createContext, useContext, useRef, useState, useEffect } from "react";

const BASE_URL = "http://127.0.0.1:8000";
const toFullUrl = (u?: string) =>
  !u ? "" : u.startsWith("http") ? u : `${BASE_URL}${u}`;

interface Song {
  id: number;
  title: string;
  artist: string;
  src: string;
}

interface PlayerContextType {
  songs: Song[];
  setSongs: (songs: Song[]) => void;
  currentSong: Song | null;
  currentSongIndex: number | null;
  isPlaying: boolean;
  handlePlaySong: (song: Song, playlist?: Song[]) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(new Audio());

  // Play a song (prevent overlapping)
  const handlePlaySong = (song: Song, playlist?: Song[]) => {
    if (!song) return;

    // If same song, toggle
    if (currentSong?.id === song.id) {
      togglePlayPause();
      return;
    }

    // Update playlist if provided
    if (playlist) setSongs(playlist);

    const audioUrl = toFullUrl(song.src);
    const playable = { ...song, src: audioUrl };
    setCurrentSong(playable);

    const index = playlist
      ? playlist.findIndex((s) => s.id === song.id)
      : songs.findIndex((s) => s.id === song.id);
    setCurrentSongIndex(index !== -1 ? index : null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = audioUrl;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Play blocked:", err));
    }
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
        .catch((err) => console.error("Play blocked:", err));
    }
  };

  const playNext = () => {
    if (!songs.length || currentSongIndex === null) return;
    const nextIndex = (currentSongIndex + 1) % songs.length;
    handlePlaySong(songs[nextIndex], songs);
  };

  const playPrevious = () => {
    if (!songs.length || currentSongIndex === null) return;
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    handlePlaySong(songs[prevIndex], songs);
  };

  // Ensure audioRef persists across renders
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => playNext();
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [songs, currentSongIndex]);

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
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};