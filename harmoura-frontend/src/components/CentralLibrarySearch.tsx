// src/components/CentralLibrarySearch.tsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaSearch, FaPlay } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";

interface Song {
  id: number;
  title: string;
  artist: string;
  cover_url: string | null;
  src: string;
  emotion?: string;
  language?: string;
}

interface CentralLibrarySearchProps {
  token: string;
  onResults: (songs: Song[]) => void; // <-- callback
}

const CentralLibrarySearch: React.FC<CentralLibrarySearchProps> = ({ token, onResults }) => {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { handlePlaySong } = usePlayer();

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const fetchSongs = async (searchQuery: string) => {
    if (!searchQuery.trim() || !token) {
      setSongs([]);
      onResults([]); // clear home grid if empty
      return;
    }
    try {
      const res = await axios.get<{ songs: Song[] }>(
        `http://127.0.0.1:8000/api/users/songs/search/?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSongs(res.data.songs || []);
      onResults(res.data.songs || []); // send to parent
      setShowDropdown(true);
    } catch (err) {
      console.error("Search error:", err);
      setSongs([]);
      onResults([]);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => fetchSongs(query), 300);
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

  const handleSongClick = (song: Song) => {
    handlePlaySong(song);
    setShowDropdown(false);
    setQuery("");
    onResults([]); // optional: clear results after playing
  };

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
          placeholder="Search songs..."
          className="w-full outline-none text-gray-700 placeholder-gray-400"
          onFocus={() => setShowDropdown(true)}
        />
      </div>

      {/* Dropdown */}
      {showDropdown && songs.length > 0 && (
        <div className="absolute z-50 w-full bg-white shadow-lg mt-2 rounded-2xl max-h-80 overflow-y-auto border border-gray-200 animate-dropdown-fade">
          {songs.map((song) => (
            <div
              key={song.id}
              className="flex items-center justify-between px-3 py-2 hover:bg-red-50 rounded-lg cursor-pointer transition"
              onClick={() => handleSongClick(song)}
            >
              <div className="flex items-center space-x-3">
                {song.cover_url && (
                  <img src={song.cover_url} className="w-10 h-10 rounded-xl object-cover" />
                )}
                <div className="text-gray-800 font-medium">{song.title}</div>
              </div>
              <button className="p-2 hover:text-red-500 transition">
                <FaPlay />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CentralLibrarySearch;
