import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlay } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext"; // ✅ import context
import Fuse from "fuse.js"; // for fuzzy search

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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Central Library</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by song or artist..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:w-1/2 p-3 mb-6 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f9243d] transition"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredSongs.map((song) => {
          const isPlayingSong = currentSong && currentSong.id === song.id;
          return (
            <div
              key={song.id}
              className={`relative bg-white shadow-md rounded-3xl overflow-hidden cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300 group
                ${isPlayingSong ? "ring-2 ring-[#f9243d]" : ""}`}
              onClick={() => handlePlaySong(song, songs)} // ✅ play via context
            >
              <div className="w-full h-48 bg-gray-200 relative">
                {song.cover_url ? (
                  <img
                    src={song.cover_url}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500">
                    No Cover
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                  <FaPlay className="text-white text-3xl p-3 rounded-full bg-black/60" />
                </div>
              </div>

              <div className="p-4">
                <h2 className="text-lg font-semibold truncate">{song.title}</h2>
                <p className="text-sm text-gray-500 truncate">{song.artist}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}