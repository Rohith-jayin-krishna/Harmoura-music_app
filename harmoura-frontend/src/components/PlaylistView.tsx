import { useState, useRef, useEffect } from "react";
import { FaEllipsisV, FaPlus, FaTimes } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";
import type { Song, Playlist } from "../pages/Library";

interface Props {
  playlist: Playlist;
  allSongs: Song[];
  handleAddSong: (playlistId: number, songId: number) => void;
  handleRemoveSong: (playlistId: number, songId: number) => void;
  onBack: () => void;
}

export default function PlaylistView({
  playlist,
  allSongs,
  handleAddSong,
  handleRemoveSong,
  onBack,
}: Props) {
  const { handlePlaySong, currentSong, isPlaying } = usePlayer();
  const [playlistSearch, setPlaylistSearch] = useState("");
  const [showLibrarySearch, setShowLibrarySearch] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const safeCoverUrl = (url?: string) => url || "/media/default_cover.png";

  // Playlist songs filter
  const filteredSongs = playlist.songs.filter((song) => {
    if (!playlistSearch.trim()) return true;
    const q = playlistSearch.toLowerCase();
    return song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q);
  });

  // Library songs filter (show 4 max)
  const filteredLibrary = allSongs
    .filter((s) => !playlist.songs.some((ps) => ps.id === s.id))
    .filter((s) => {
      if (!librarySearch.trim()) return true;
      const q = librarySearch.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
    })
    .slice(0, 4);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg shadow-sm hover:bg-gray-200 transition flex-shrink-0"
        >
          &larr; Back to Playlists
        </button>

        <h2 className="text-3xl font-bold text-gray-800 flex-shrink-0">{playlist.name}</h2>

        {/* Add Songs / Search */}
        <div
          className="relative w-full sm:w-64 mt-2 sm:mt-0 flex-shrink-0"
          ref={searchRef}
        >
          {showLibrarySearch ? (
            <div className="flex w-full">
              <input
                type="text"
                placeholder="Search songs to add..."
                value={librarySearch}
                onChange={(e) => {
                  setLibrarySearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition"
              />
              <button
                onClick={() => {
                  setShowLibrarySearch(false);
                  setLibrarySearch("");
                  setShowDropdown(false);
                }}
                className="px-3 py-2 bg-gray-200 border border-l-0 rounded-r-lg hover:bg-gray-300 transition flex items-center justify-center"
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowLibrarySearch(true);
                setShowDropdown(true);
                setTimeout(() => searchRef.current?.focus(), 100);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition w-full justify-center"
            >
              <FaPlus /> Add Songs
            </button>
          )}

          {/* Dropdown */}
          {showDropdown && showLibrarySearch && (
            <div className="absolute mt-1 w-full bg-white border rounded-lg shadow-lg z-20 overflow-hidden">
              {filteredLibrary.length > 0 ? (
                filteredLibrary.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => {
                      handleAddSong(playlist.id, song.id);
                      setLibrarySearch("");
                      setShowDropdown(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 w-full hover:bg-gray-100 transition"
                  >
                    <img
                      src={safeCoverUrl(song.cover_url)}
                      alt={song.title}
                      className="w-10 h-10 rounded-md object-cover"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium text-gray-800">{song.title}</span>
                      <span className="text-xs text-gray-500">{song.artist}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  No matching songs found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Playlist Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search songs in this playlist..."
          value={playlistSearch}
          onChange={(e) => setPlaylistSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-400 shadow-sm"
        />
      </div>

      {/* Playlist Songs */}
      <div className="space-y-3">
        {filteredSongs.map((song) => {
          const isPlayingSong = currentSong && currentSong.id === song.id;

          return (
            <div
              key={song.id}
              className={`flex items-center justify-between p-3 border rounded-lg shadow hover:shadow-md transition cursor-pointer ${
                isPlayingSong ? "bg-red-50 border-red-300" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center space-x-4">
                <img
                  src={safeCoverUrl(song.cover_url)}
                  alt={song.title}
                  className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                />
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-gray-800">{song.title}</span>
                  <span className="text-gray-500 text-sm">{song.artist}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handlePlaySong(song, playlist.songs)}
                  className="text-red-500 font-semibold hover:text-red-600 transition"
                >
                  {isPlayingSong && isPlaying ? (
                    <div className="flex items-end space-x-1">
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                      <span className="wave-bar"></span>
                    </div>
                  ) : (
                    "▶"
                  )}
                </button>

                <div className="relative group">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition">
                    <FaEllipsisV />
                  </button>
                  <div className="absolute right-0 mt-2 w-32 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition z-10">
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => handleRemoveSong(playlist.id, song.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}