import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaPlay, FaSearch } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext"; // <-- import player context

interface Song {
  id: number;
  title: string;
  artist: string;
  cover_url: string | null;
  emotion: string;
  language: string;
  src: string;
}

interface SearchResults {
  songs: Song[];
  artists: string[];
  emotions: string[];
  languages: string[];
}

interface GlobalSearchProps {
  token: string;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ token }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    songs: [],
    artists: [],
    emotions: [],
    languages: [],
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { handlePlaySong } = usePlayer(); // <-- get handlePlaySong

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const fetchResults = async (searchQuery: string) => {
    if (!searchQuery.trim() || !token) return;
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/users/songs/search/?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(res.data);
      setShowDropdown(true); // keep dropdown visible
    } catch (err) {
      console.error("Search error:", err);
      setResults({ songs: [], artists: [], emotions: [], languages: [] });
    }
  };

  // Debounce typing
  useEffect(() => {
    if (!query) return;
    const timeout = setTimeout(() => fetchResults(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") fetchResults(query);
  };

  const handleSongClick = (song: Song) => {
    handlePlaySong(song); // <-- plays via MusicPlayer, synced
    // DO NOT close dropdown here to persist results
  };

  const handleTileClick = (type: "artist" | "emotion" | "language", value: string) => {
  // ✅ Navigate to the new dynamic route
  const path = `/songs/category/${type}/${encodeURIComponent(value)}`;
  navigate(path);
  setShowDropdown(false); // close dropdown after navigating
  setQuery(""); // clear search input
};

  const hasResults =
    results.songs.length + results.artists.length + results.emotions.length + results.languages.length > 0;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex items-center border rounded px-3 py-2 focus-within:ring focus-within:ring-red-300">
        <FaSearch className="text-gray-400 mr-2" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, emotions..."
          className="w-full outline-none"
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyPress}
        />
        <button
          onClick={() => fetchResults(query)}
          className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Search
        </button>
      </div>

      {showDropdown && hasResults && (
        <div className="absolute z-50 w-full bg-white shadow-lg mt-1 rounded max-h-96 overflow-y-auto">
          {/* Songs */}
          {results.songs.length > 0 && (
            <div className="p-2 border-b">
              <h4 className="font-semibold mb-1">Songs</h4>
              {results.songs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <div
                    className="flex items-center space-x-2"
                    onClick={() => handleSongClick(song)} // click anywhere on left div plays song
                  >
                    {song.cover_url && <img src={song.cover_url} className="w-8 h-8 rounded" />}
                    <span>{song.title}</span>
                  </div>
                  <button
                    onClick={() => handleSongClick(song)} // click play button also plays
                    className="p-1"
                  >
                    <FaPlay />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Artists */}
          {results.artists.length > 0 && (
            <div className="p-2 border-b">
              <h4 className="font-semibold mb-1">Artists</h4>
              {results.artists.map((artist) => (
                <div
                  key={artist}
                  className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => handleTileClick("artist", artist)}
                >
                  <span>{artist}</span>
                  <FaArrowRight />
                </div>
              ))}
            </div>
          )}

          {/* Emotions */}
          {results.emotions.length > 0 && (
            <div className="p-2 border-b">
              <h4 className="font-semibold mb-1">Emotions</h4>
              {results.emotions.map((emotion) => (
                <div
                  key={emotion}
                  className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => handleTileClick("emotion", emotion)}
                >
                  <span>{emotion}</span>
                  <FaArrowRight />
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {results.languages.length > 0 && (
            <div className="p-2">
              <h4 className="font-semibold mb-1">Languages</h4>
              {results.languages.map((lang) => (
                <div
                  key={lang}
                  className="flex items-center justify-between px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => handleTileClick("language", lang)}
                >
                  <span>{lang}</span>
                  <FaArrowRight />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;