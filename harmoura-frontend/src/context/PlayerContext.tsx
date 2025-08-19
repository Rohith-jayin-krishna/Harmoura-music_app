import { createContext, useContext, useRef, useState, useEffect } from "react";

const BASE_URL = "http://127.0.0.1:8000";
const toFullUrl = (u?: string) =>
  !u ? "" : u.startsWith("http") ? u : `${BASE_URL}${u}`;

export type Emotion = "Happiness" | "Sadness" | "Calmness" | "Excitement" | "Love";

interface Song {
  id: number;
  title: string;
  artist: string;
  src: string;
  emotion?: Emotion;
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
  emotionStats: Record<Emotion, number>;
  artistStats: Record<string, number>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [emotionStats, setEmotionStats] = useState<Record<Emotion, number>>({
    Happiness: 0,
    Sadness: 0,
    Calmness: 0,
    Excitement: 0,
    Love: 0,
  });

  const [artistStats, setArtistStats] = useState<Record<string, number>>({});

  const audioRef = useRef<HTMLAudioElement>(new Audio());

  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  // Fetch stats from backend on load
  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/users/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEmotionStats(data.emotion_stats || emotionStats);
        setArtistStats(data.artist_stats || artistStats);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    fetchStats();
  }, [token]);

  const handlePlaySong = async (song: Song, playlist?: Song[]) => {
    if (!song) return;

    if (currentSong?.id === song.id) {
      togglePlayPause();
      return;
    }

    if (playlist) setSongs(playlist);

    const audioUrl = toFullUrl(song.src);
    const playable = { ...song, src: audioUrl };
    setCurrentSong(playable);

    const index = playlist
      ? playlist.findIndex((s) => s.id === song.id)
      : songs.findIndex((s) => s.id === song.id);
    setCurrentSongIndex(index !== -1 ? index : null);

    // Update emotion stats locally
    if (song.emotion) {
      const key: Emotion = song.emotion;
      setEmotionStats((prev) => ({
        ...prev,
        [key]: (prev[key] || 0) + 1,
      }));
    }

    // Update artist stats locally
    if (song.artist) {
      setArtistStats((prev) => ({
        ...prev,
        [song.artist]: (prev[song.artist] || 0) + 1,
      }));
    }

    // Update backend
    try {
      await fetch(`${BASE_URL}/api/users/play_song/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ song_id: song.id }),
      });
    } catch (err) {
      console.error("Failed to update play stats on backend", err);
    }

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
        emotionStats,
        artistStats,
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