import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaPlay, FaSearch } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";

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

  const { handlePlaySong } = usePlayer();

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
      setShowDropdown(true);
    } catch (err) {
      console.error("Search error:", err);
      setResults({ songs: [], artists: [], emotions: [], languages: [] });
    }
  };

  useEffect(() => {
    if (!query) return;
    const timeout = setTimeout(() => fetchResults(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

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
    handlePlaySong(song);
  };

  const handleTileClick = (type: "artist" | "emotion" | "language", value: string) => {
    navigate(`/songs/category/${type}/${encodeURIComponent(value)}`);
    setShowDropdown(false);
    setQuery("");
  };

  const hasResults =
    results.songs.length + results.artists.length + results.emotions.length + results.languages.length > 0;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Search Input */}
      <div className="flex items-center border border-gray-300 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-red-400 transition">
        <FaSearch className="text-gray-400 mr-3" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, emotions..."
          className="w-full outline-none text-gray-700 placeholder-gray-400"
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyPress}
        />
        <button
          onClick={() => fetchResults(query)}
          className="ml-3 px-4 py-1 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
        >
          Search
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && hasResults && (
        <div className="absolute z-50 w-full bg-white shadow-lg mt-2 rounded-2xl max-h-96 overflow-y-auto border border-gray-200 animate-dropdown-fade">
          
          {/* Songs */}
          {results.songs.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <h4 className="font-bold mb-2 text-gray-700 text-sm uppercase tracking-wide">Songs</h4>
              {results.songs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between px-2 py-2 hover:bg-red-50 rounded-lg cursor-pointer transition"
                >
                  <div className="flex items-center space-x-3" onClick={() => handleSongClick(song)}>
                    {song.cover_url && (
                      <img src={song.cover_url} className="w-10 h-10 rounded-xl object-cover" />
                    )}
                    <div className="text-gray-800 font-medium">{song.title}</div>
                  </div>
                  <button onClick={() => handleSongClick(song)} className="p-2 hover:text-red-500 transition">
                    <FaPlay />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Artists */}
          {results.artists.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <h4 className="font-bold mb-2 text-gray-700 text-sm uppercase tracking-wide">Artists</h4>
              {results.artists.map((artist) => (
                <div
                  key={artist}
                  className="flex items-center justify-between px-2 py-2 hover:bg-red-50 rounded-lg cursor-pointer transition"
                  onClick={() => handleTileClick("artist", artist)}
                >
                  <span className="text-gray-800 font-medium">{artist}</span>
                  <FaArrowRight className="text-gray-400" />
                </div>
              ))}
            </div>
          )}

          {/* Emotions */}
          {results.emotions.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <h4 className="font-bold mb-2 text-gray-700 text-sm uppercase tracking-wide">Emotions</h4>
              {results.emotions.map((emotion) => (
                <div
                  key={emotion}
                  className="flex items-center justify-between px-2 py-2 hover:bg-red-50 rounded-lg cursor-pointer transition"
                  onClick={() => handleTileClick("emotion", emotion)}
                >
                  <span className="text-gray-800 font-medium">{emotion}</span>
                  <FaArrowRight className="text-gray-400" />
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {results.languages.length > 0 && (
            <div className="p-3">
              <h4 className="font-bold mb-2 text-gray-700 text-sm uppercase tracking-wide">Languages</h4>
              {results.languages.map((lang) => (
                <div
                  key={lang}
                  className="flex items-center justify-between px-2 py-2 hover:bg-red-50 rounded-lg cursor-pointer transition"
                  onClick={() => handleTileClick("language", lang)}
                >
                  <span className="text-gray-800 font-medium">{lang}</span>
                  <FaArrowRight className="text-gray-400" />
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