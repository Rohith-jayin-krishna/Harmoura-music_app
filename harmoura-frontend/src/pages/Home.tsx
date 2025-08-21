import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaPlay, FaFilter, FaTimes } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";
import Fuse from "fuse.js";
import { infoToast } from "../utils/toasts";

type Song = {
  id: number;
  title: string;
  artist: string;
  src: string;
  cover_url?: string;
  emotion?: string;
  language?: string;
};

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [showFilters, setShowFilters] = useState(false); // filter panel toggle

  // Filter states
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("All");
  const [selectedArtist, setSelectedArtist] = useState<string>("All");

  const { handlePlaySong, currentSong, fetchRecommendedSongs } = usePlayer();
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Fetch recommended songs from backend
  useEffect(() => {
    const loadRecommended = async () => {
      const token =
        localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      if (!token) return;

      try {
        const res = await axios.get<Song[]>(
          "http://127.0.0.1:8000/api/users/songs/recommended/",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const recSongs = res.data.map((s) => ({
          ...s,
          src: s.src.startsWith("http") ? s.src : `http://127.0.0.1:8000${s.src}`,
          cover_url: s.cover_url
            ? s.cover_url.startsWith("http")
              ? s.cover_url
              : `http://127.0.0.1:8000${s.cover_url}`
            : undefined,
        }));

        setSongs(recSongs);
        await fetchRecommendedSongs();
      } catch (err) {
        console.error("Failed to load recommended songs:", err);
      }
    };

    loadRecommended();
  }, [fetchRecommendedSongs]);

  // Unique filter options (sorted)
  const languages = [
    "All",
    ...Array.from(new Set(songs.map((s) => s.language).filter(Boolean))).sort() as string[],
  ];
  const emotions = [
    "All",
    ...Array.from(new Set(songs.map((s) => s.emotion).filter(Boolean))).sort() as string[],
  ];
  const artists = [
    "All",
    ...Array.from(new Set(songs.map((s) => s.artist).filter(Boolean))).sort() as string[],
  ];

  // Filter + search
  useEffect(() => {
    let temp = songs;

    if (selectedLanguage !== "All") {
      temp = temp.filter(
        (s) => (s.language || "").toLowerCase() === selectedLanguage.toLowerCase()
      );
    }

    if (selectedEmotion !== "All") {
      temp = temp.filter(
        (s) => (s.emotion || "").toLowerCase() === selectedEmotion.toLowerCase()
      );
    }

    if (selectedArtist !== "All") {
      temp = temp.filter(
        (s) => (s.artist || "").toLowerCase() === selectedArtist.toLowerCase()
      );
    }

    if (!searchTerm) {
      setFilteredSongs(temp);
      return;
    }

    const fuse = new Fuse(temp, {
      keys: ["title", "artist", "emotion", "language"],
      threshold: 0.4,
    });

    const results = fuse.search(searchTerm).map((res) => res.item);
    setFilteredSongs(results);
  }, [searchTerm, songs, selectedLanguage, selectedEmotion, selectedArtist]);

  // Close filter panel when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener("mousedown", onClickOutside);
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showFilters]);

  const clearFilters = () => {
    setSelectedLanguage("All");
    setSelectedEmotion("All");
    setSelectedArtist("All");
  };

  // Play song if signed in
  const playSongIfSignedIn = (song: Song) => {
    const token =
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) {
      infoToast("Please sign in to play songs.");
      return;
    }
    handlePlaySong(song, songs);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center md:text-left">
        Recommended For You
      </h1>

      {/* Search + Filter Toggle */}
      <div className="relative flex flex-col gap-3 md:gap-4 mb-4">
        <div className="flex items-center justify-between">
          <input
            type="text"
            placeholder="Search by song, artist, emotion, or language..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-3/4 md:w-1/2 p-2 md:p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#f9243d] transition text-sm md:text-base"
          />
          <button
            onClick={() => setShowFilters((p) => !p)}
            className="ml-3 p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition"
            aria-label="Toggle filters"
          >
            <FaFilter className="text-gray-600" />
          </button>
        </div>

        {/* Expandable Filter Panel (small popover) */}
        {showFilters && (
          <div
            ref={panelRef}
            className="absolute right-0 top-12 z-20 w-full sm:w-auto sm:min-w-[22rem] bg-white border rounded-xl shadow-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Filters</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearFilters}
                  className="text-xs px-2 py-1 rounded-full border hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100"
                  aria-label="Close"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Language */}
            {languages.length > 1 && (
              <div className="mb-3">
                <span className="block text-sm font-medium text-gray-600 mb-1">
                  Language
                </span>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-3 py-1 rounded-full border text-sm transition
                        ${
                          selectedLanguage === lang
                            ? "bg-[#f9243d] text-white border-[#f9243d]"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Emotion */}
            {emotions.length > 1 && (
              <div className="mb-3">
                <span className="block text-sm font-medium text-gray-600 mb-1">
                  Emotion
                </span>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {emotions.map((emo) => (
                    <button
                      key={emo}
                      onClick={() => setSelectedEmotion(emo)}
                      className={`px-3 py-1 rounded-full border text-sm transition
                        ${
                          selectedEmotion === emo
                            ? "bg-[#f9243d] text-white border-[#f9243d]"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Artist */}
            {artists.length > 1 && (
              <div>
                <span className="block text-sm font-medium text-gray-600 mb-1">
                  Artist
                </span>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {artists.map((art) => (
                    <button
                      key={art}
                      onClick={() => setSelectedArtist(art)}
                      className={`px-3 py-1 rounded-full border text-sm transition
                        ${
                          selectedArtist === art
                            ? "bg-[#f9243d] text-white border-[#f9243d]"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                    >
                      {art}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Songs Grid */}
<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
  {filteredSongs.map((song) => {
    const isPlayingSong = currentSong && currentSong.id === song.id;
    return (
      <div
        key={song.id}
        className={`relative bg-white shadow-md rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300 group
          ${isPlayingSong ? "ring-2 ring-[#f9243d]" : ""}`}
        onClick={() => playSongIfSignedIn(song)}
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

          {/* ✅ Only language badge kept */}
          {song.language && (
            <span className="absolute top-2 left-2 text-[10px] md:text-xs px-2 py-1 rounded-full bg-black/60 text-white">
              {song.language}
            </span>
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