import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { usePlayer } from "../context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaPlay, FaEllipsisV } from "react-icons/fa";

interface Song {
  id: number;
  title: string;
  artist: string;
  src: string;
  cover_url?: string;
  emotion?: string;
  language?: string;
}

const CategorySongsPage = () => {
  const { type, value } = useParams<{ type: string; value: string }>();
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const songsPerPage = 10;
  const { handlePlaySong, currentSong, isPlaying, addToQueue, playNext } =
    usePlayer();
  const navigate = useNavigate();

  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchSongs = async () => {
      if (!token || !type || !value) return;

      let url = "";
      if (type === "artist")
        url = `http://127.0.0.1:8000/api/users/songs/artist/${encodeURIComponent(
          value
        )}/`;
      else if (type === "emotion")
        url = `http://127.0.0.1:8000/api/users/songs/emotion/${encodeURIComponent(
          value
        )}/`;
      else if (type === "language")
        url = `http://127.0.0.1:8000/api/users/songs/language/${encodeURIComponent(
          value
        )}/`;
      else return;

      try {
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSongs(res.data.songs || []);
        setCurrentPage(1);
      } catch (err) {
        console.error("Failed to fetch category songs:", err);
        setSongs([]);
      }
    };

    fetchSongs();
  }, [type, value, token]);

  const handleSongClick = (song: Song) => {
    handlePlaySong(song, songs);
  };

  // Pagination
  const indexOfLastSong = currentPage * songsPerPage;
  const indexOfFirstSong = indexOfLastSong - songsPerPage;
  const currentSongs = songs.slice(indexOfFirstSong, indexOfLastSong);
  const totalPages = Math.ceil(songs.length / songsPerPage);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold text-gray-800"
        >
          {type?.charAt(0).toUpperCase() + type?.slice(1)}:{" "}
          <span className="text-red-500">{value}</span>
        </motion.h2>
        <button
          onClick={() => navigate("/search")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition shadow-sm"
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      {/* Songs */}
      {songs.length === 0 ? (
        <p className="text-gray-500 text-lg text-center">
          No songs found for this category.
        </p>
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 overflow-visible"
          >
            {currentSongs.map((song) => (
              <div
                key={song.id}
                className="relative dropdown-container"
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`p-4 rounded-2xl border cursor-pointer transition shadow-sm flex items-center gap-4 relative ${
                    currentSong?.id === song.id
                      ? "bg-red-50 border-red-400 shadow-md"
                      : "bg-white border-gray-200 hover:shadow-md"
                  }`}
                  onClick={() => handleSongClick(song)}
                >
                  {/* Cover */}
                  {song.cover_url ? (
                    <img
                      src={song.cover_url}
                      alt={song.title}
                      className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-xl text-gray-500">
                      N/A
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate text-gray-800">
                      {song.title}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                  </div>

                  {/* Status + Menu */}
                  <div
                    className="flex items-center gap-2 relative z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {currentSong?.id === song.id && isPlaying ? (
                      <div className="flex gap-1">
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                        <span className="wave-bar"></span>
                      </div>
                    ) : (
                      <FaPlay className="text-gray-500" />
                    )}

                    {/* Menu Button */}
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === song.id ? null : song.id)
                      }
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <FaEllipsisV />
                    </button>
                  </div>
                </motion.div>

                {/* Dropdown */}
                <AnimatePresence>
                  {menuOpen === song.id && (
                    <motion.div
                      layout={false}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 top-full mt-2 bg-white border rounded-xl shadow-lg w-40 z-[9999]"
                    >
                      <button
                        onClick={() => {
                          addToQueue(song);
                          setMenuOpen(null);
                        }}
                        className="block w-full px-4 py-2 text-left hover:bg-gray-100 rounded-t-xl"
                      >
                        ➕ Add to Queue
                      </button>
                      <button
                        onClick={() => {
                          playNext(song);
                          setMenuOpen(null);
                        }}
                        className="block w-full px-4 py-2 text-left hover:bg-gray-100 rounded-b-xl"
                      >
                        Play Next
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-lg transition ${
                      currentPage === page
                        ? "bg-red-500 text-white shadow"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategorySongsPage;