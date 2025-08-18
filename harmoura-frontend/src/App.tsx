// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import MusicPlayer from "./components/MusicPlayer";

import { PlayerProvider, usePlayer } from "./context/PlayerContext";

export default function AppWrapper() {
  return (
    <PlayerProvider>
      <App />
    </PlayerProvider>
  );
}

function App() {
  const [user, setUser] = useState<string | null>(null);

  const BASE_URL = "http://127.0.0.1:8000";
  const toFullUrl = (u?: string) =>
    !u ? "" : u.startsWith("http") ? u : `${BASE_URL}${u}`;

  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  const {
    currentSong,
    isPlaying,
    handlePlaySong,
    togglePlayPause,
    playNext,
    playPrevious,
  } = usePlayer();

  // Fetch central library songs
  const [songs, setSongs] = useState<any[]>([]);
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
              element={user ? <Navigate to="/" /> : <SignIn onSignIn={handleSignIn} />}
            />
            <Route path="/register" element={<Register />} />
            <Route
              path="/library"
              element={user ? <Library /> : <Navigate to="/signin" />}
            />
            <Route
              path="/profile"
              element={user ? <Profile /> : <Navigate to="/signin" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Always render MusicPlayer if user exists and currentSong is set */}
        {user && currentSong && (
          <MusicPlayer
            song={currentSong}
            onClose={() => handlePlaySong(null)} // ✅ stops playback safely
            onNext={playNext}
            onPrev={playPrevious}
            isPlayingExternal={isPlaying}
            onTogglePlay={togglePlayPause}
          />
        )}

        <footer className="bg-gray-900 text-white text-center p-4">
          &copy; {new Date().getFullYear()} Harmoura. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}