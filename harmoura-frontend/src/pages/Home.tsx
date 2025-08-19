import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlay } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext"; // ✅ import context
import Fuse from "fuse.js"; // for fuzzy search
import { infoToast } from "../utils/toasts"; // ✅ import toast

type Song = {
  id: number;
  title: string;
  artist: string;
  src: string;
  cover_url?: string; // updated to match backend
};

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const { handlePlaySong, currentSong } = usePlayer(); // ✅ use context

  // Fetch songs
  useEffect(() => {
    axios
      .get<Song[]>("http://127.0.0.1:8000/api/users/songs/public/")
      .then((res) =>
        setSongs(
          res.data.map((s) => ({
            ...s,
            src: s.src.startsWith("http") ? s.src : `http://127.0.0.1:8000${s.src}`,
            cover_url: s.cover_url
              ? s.cover_url.startsWith("http")
                ? s.cover_url
                : `http://127.0.0.1:8000${s.cover_url}`
              : undefined,
          }))
        )
      )
      .catch((err) => console.error("Error fetching songs:", err));
  }, []);

  // Filter songs based on search term using fuzzy search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSongs(songs);
      return;
    }

    const fuse = new Fuse(songs, {
      keys: ["title", "artist"],
      threshold: 0.4, // fuzzy search tolerance
    });

    const results = fuse.search(searchTerm).map((res) => res.item);
    setFilteredSongs(results);
  }, [searchTerm, songs]);

  // Function to check if user is signed in
  const playSongIfSignedIn = (song: Song) => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) {
      infoToast("Please sign in to play songs."); // ✅ toast instead of alert
      return;
    }
    handlePlaySong(song, songs); // play if signed in
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center md:text-left">
        Central Library
      </h1>

      {/* Search Bar */}
      <div className="flex justify-center md:justify-start">
        <input
          type="text"
          placeholder="Search by song or artist..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-3/4 md:w-1/2 p-2 md:p-3 mb-6 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f9243d] transition text-sm md:text-base"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredSongs.map((song) => {
          const isPlayingSong = currentSong && currentSong.id === song.id;
          return (
            <div
              key={song.id}
              className={`relative bg-white shadow-md rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300 group
                ${isPlayingSong ? "ring-2 ring-[#f9243d]" : ""}`}
              onClick={() => playSongIfSignedIn(song)} // ✅ updated
            >
              <div className="w-full h-32 sm:h-40 md:h-48 bg-gray-200 relative">
                {song.cover_url ? (
                  <img
                    src={song.cover_url}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 text-xs md:text-sm">
                    No Cover
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                  <FaPlay className="text-white text-lg md:text-3xl p-2 md:p-3 rounded-full bg-black/60" />
                </div>
              </div>

              <div className="p-2 md:p-4">
                <h2 className="text-sm md:text-lg font-semibold truncate">{song.title}</h2>
                <p className="text-xs md:text-sm text-gray-500 truncate">{song.artist}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}