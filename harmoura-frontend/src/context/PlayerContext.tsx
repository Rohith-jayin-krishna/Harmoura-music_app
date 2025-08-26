import { createContext, useContext, useRef, useState, useEffect } from "react";

const BASE_URL = "http://127.0.0.1:8000";
const toFullUrl = (u?: string) =>
  !u ? "" : u.startsWith("http") ? u : `${BASE_URL}${u}`;

export type Emotion =
  | "Happiness"
  | "Sadness"
  | "Calmness"
  | "Excitement"
  | "Love";

interface Song {
  id: number;
  title: string;
  artist: string;
  src: string;
  emotion?: Emotion;
}

interface Playlist {
  id: number;
  name: string;
  songs: Song[];
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
  fetchRecommendedSongs: () => Promise<void>;
  // NEW for Home
  recentPlaylists: Playlist[];
  frequentPlaylists: Playlist[];
  fetchRecentPlaylists: () => Promise<void>;
  fetchFrequentPlaylists: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>([]);
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

  // NEW states for Home
  const [recentPlaylists, setRecentPlaylists] = useState<Playlist[]>([]);
  const [frequentPlaylists, setFrequentPlaylists] = useState<Playlist[]>([]);

  const audioRef = useRef<HTMLAudioElement>(new Audio());

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

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

  // ----------------- Recommended Songs for Home (Backend) ----------------- //
  const fetchRecommendedSongs = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${BASE_URL}/api/users/songs/recommended/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const recommended: Song[] = await res.json();
      setCurrentPlaylist(recommended);
    } catch (err) {
      console.error("Failed to fetch recommended songs:", err);
    }
  };

  // ----------------- Recent Playlists ----------------- //
  const fetchRecentPlaylists = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/users/playlists/recent/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const recent: Playlist[] = await res.json();
      setRecentPlaylists(recent);
    } catch (err) {
      console.error("Failed to fetch recent playlists:", err);
    }
  };

  // ----------------- Frequent Playlists ----------------- //
  const fetchFrequentPlaylists = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/users/playlists/frequent/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const frequent: Playlist[] = await res.json();
      setFrequentPlaylists(frequent);
    } catch (err) {
      console.error("Failed to fetch frequent playlists:", err);
    }
  };

  // ----------------- Handle Song Play ----------------- //
  const handlePlaySong = async (song: Song, playlist?: Song[]) => {
    if (!song) return;

    if (currentSong?.id === song.id) {
      togglePlayPause();
      return;
    }

    if (playlist) setCurrentPlaylist(playlist);

    const playlistToUse =
      playlist || (currentPlaylist.length ? currentPlaylist : songs);

    const audioUrl = toFullUrl(song.src);
    const playable = { ...song, src: audioUrl };
    setCurrentSong(playable);

    const index = playlistToUse.findIndex((s) => s.id === song.id);
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
    if (!currentPlaylist.length || currentSongIndex === null) return;
    const nextIndex = (currentSongIndex + 1) % currentPlaylist.length;
    handlePlaySong(currentPlaylist[nextIndex], currentPlaylist);
  };

  const playPrevious = () => {
    if (!currentPlaylist.length || currentSongIndex === null) return;
    const prevIndex =
      (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    handlePlaySong(currentPlaylist[prevIndex], currentPlaylist);
  };

  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => playNext();
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentPlaylist, currentSongIndex]);

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
        fetchRecommendedSongs,
        recentPlaylists,
        frequentPlaylists,
        fetchRecentPlaylists,
        fetchFrequentPlaylists,
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
