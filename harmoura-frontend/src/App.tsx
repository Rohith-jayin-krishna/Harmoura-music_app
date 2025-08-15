import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from "react-icons/fa";
import axios from "axios";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";

export default function App() {
  const [songs, setSongs] = useState<any[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<any[] | null>(null); 
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [currentSong, setCurrentSong] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const BASE_URL = "http://127.0.0.1:8000";
  const toFullUrl = (u?: string) =>
    !u ? "" : u.startsWith("http") ? u : `${BASE_URL}${u}`;

  const [user, setUser] = useState<string | null>(null);

  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  // Fetch central library songs
  useEffect(() => {
    const fetchSongs = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${BASE_URL}/api/users/songs/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const normalized = (res.data || []).map((s: any) => ({
          ...s,
          src: toFullUrl(s.src || s.file || s.audio || ""),
        }));
        setSongs(normalized);
      } catch (err) {
        console.error("Failed to fetch central library songs:", err);
      }
    };
    fetchSongs();
  }, [token]);

  // Auto Sign-In
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    const userEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
    if (accessToken && userEmail) setUser(userEmail);
  }, []);

  const handleSignIn = (email: string, rememberMe: boolean) => {
    setUser(email);
    if (rememberMe) localStorage.setItem("userEmail", email);
    else sessionStorage.setItem("userEmail", email);
  };

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setCurrentSong(null);
    setCurrentSongIndex(null);
    setIsPlaying(false);
    setActivePlaylist(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // ===== Play Logic with Playlist Support =====
  const handlePlaySong = (song: any, playlist?: any[]) => {
    if (!song) return;

    // Toggle play/pause if same song clicked
    if (currentSong?.id === song.id) {
      togglePlayPause();
      return;
    }

    const audioUrl = toFullUrl(song?.src || song?.file || song?.audio || "");
    if (!audioUrl) {
      console.error("No valid audio URL found for song:", song);
      return;
    }

    // Set current song (we play in useEffect)
    setCurrentSong({ ...song, src: audioUrl });

    // Set the active playlist if provided
    if (playlist && playlist.length) {
      setActivePlaylist(playlist);
      const index = playlist.findIndex((s) => s.id === song.id);
      setCurrentSongIndex(index !== -1 ? index : null);
    } else {
      setActivePlaylist(null);
      const index = songs.findIndex((s) => s.id === song.id);
      setCurrentSongIndex(index !== -1 ? index : null);
    }
  };

  // Play when currentSong changes
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = currentSong.src;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("Play blocked:", err));
    }
  }, [currentSong]);

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
    const list = activePlaylist || songs;
    if (currentSongIndex === null || list.length === 0) return;
    const nextIndex = (currentSongIndex + 1) % list.length;
    setCurrentSongIndex(nextIndex);
    handlePlaySong(list[nextIndex], activePlaylist || undefined);
  };

  const playPrevious = () => {
    const list = activePlaylist || songs;
    if (currentSongIndex === null || list.length === 0) return;
    const prevIndex = (currentSongIndex - 1 + list.length) % list.length;
    setCurrentSongIndex(prevIndex);
    handlePlaySong(list[prevIndex], activePlaylist || undefined);
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} onSignOut={handleSignOut} />

        <main className="flex-grow bg-gray-100 p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/signin"
              element={
                user ? <Navigate to="/home" /> : <SignIn onSignIn={handleSignIn} />
              }
            />
            <Route path="/register" element={<Register />} />
            <Route
              path="/library"
              element={
                user ? (
                  <Library
                    onPlay={(song, playlist) => handlePlaySong(song, playlist)}
                    currentSong={currentSong}
                  />
                ) : (
                  <Navigate to="/signin" />
                )
              }
            />
            <Route
              path="/profile"
              element={user ? <Profile /> : <Navigate to="/signin" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {user && currentSong && (
          <div className="fixed bottom-0 left-0 w-full bg-[#f9243d] text-white p-4 flex justify-between items-center shadow-lg backdrop-blur-md z-50">
            <div>
              <p className="font-semibold text-lg">{currentSong.title}</p>
              <p className="text-sm opacity-90">{currentSong.artist}</p>
            </div>
            <div className="flex items-center gap-6 text-2xl">
              <button
                onClick={playPrevious}
                className="hover:scale-110 transition"
                aria-label="Previous"
              >
                <FaStepBackward />
              </button>
              <button
                onClick={togglePlayPause}
                className="bg-white text-[#f9243d] p-3 rounded-full shadow-md hover:scale-110 transition"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button
                onClick={playNext}
                className="hover:scale-110 transition"
                aria-label="Next"
              >
                <FaStepForward />
              </button>
            </div>

            <audio
              ref={audioRef}
              onEnded={playNext}
              onError={(e) => {
                const el = e.currentTarget as HTMLAudioElement;
                console.error("Audio error. src=", el?.src);
              }}
            />
          </div>
        )}

        <footer className="bg-gray-900 text-white text-center p-4">
          &copy; {new Date().getFullYear()} Harmoura. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}