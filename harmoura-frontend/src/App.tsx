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
import SearchPage from "./pages/SearchPage";

// ✅ Import the new category page
import CategorySongsPage from "./pages/CategorySongsPage";

import { PlayerProvider, usePlayer } from "./context/PlayerContext";
import { ToastContainer } from "react-toastify";
import { errorToast } from "./utils/toasts";

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

  const handleSignOut = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
  };

  const handleSignIn = (email: string, rememberMe: boolean) => {
    setUser(email);
    if (rememberMe) localStorage.setItem("userEmail", email);
    else sessionStorage.setItem("userEmail", email);
  };

  // Auto Sign-In
  useEffect(() => {
    const accessToken =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");
    const userEmail =
      localStorage.getItem("userEmail") ||
      sessionStorage.getItem("userEmail");
    if (accessToken && userEmail) setUser(userEmail);
  }, []);

  // Global Axios interceptor for token expiry
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleSignOut();
          errorToast("Session timed out. Please login again.");
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

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
      } catch (err: any) {
        if (err.response?.status === 401) {
          handleSignOut();
          errorToast("Session timed out. Please login again.");
        } else {
          console.error("Failed to fetch central library songs:", err);
        }
      }
    };
    fetchSongs();
  }, [token]);

  return (
    <Router>
      <ToastContainer />

      <div className="min-h-screen flex flex-col overflow-y-auto scroll-smooth custom-scrollbar">
        <Navbar user={user} onSignOut={handleSignOut} />

        <main className="flex-grow bg-gray-100 p-6 pb-32">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/signin"
              element={
                user ? <Navigate to="/" /> : <SignIn onSignIn={handleSignIn} />
              }
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
            <Route
              path="/search"
              element={user ? <SearchPage /> : <Navigate to="/signin" />}
            />

            {/* ✅ Dynamic Category Route */}
            <Route
              path="/songs/category/:type/:value"
              element={user ? <CategorySongsPage /> : <Navigate to="/signin" />}
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {user && currentSong && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg">
            <MusicPlayer
              song={currentSong}
              onClose={() => handlePlaySong(null)}
              onNext={playNext}
              onPrev={playPrevious}
              isPlayingExternal={isPlaying}
              onTogglePlay={togglePlayPause}
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