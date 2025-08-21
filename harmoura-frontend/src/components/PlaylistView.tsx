// --- components/PlaylistView.tsx
import { useState } from "react";
import { FaEllipsisV } from "react-icons/fa";
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
  const [showCentralLibrary, setShowCentralLibrary] = useState(false);

  const searchQuery = playlistSearch.trim().toLowerCase();
  const filteredSongs = playlist.songs.filter((song) => {
    if (!searchQuery) return true;
    return (
      song.title.toLowerCase().includes(searchQuery) ||
      song.artist.toLowerCase().includes(searchQuery)
    );
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
      >
        &larr; Back to Playlists
      </button>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{playlist.name}</h2>
        <button
          onClick={() => setShowCentralLibrary(!showCentralLibrary)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          Browse Central Library
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search songs in this playlist..."
          value={playlistSearch}
          onChange={(e) => setPlaylistSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full mb-2 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>

      {/* Playlist Songs */}
      <div className="space-y-3">
        {filteredSongs.map((song) => {
          const isPlayingSong = currentSong && currentSong.id === song.id;

          return (
            <div
              key={song.id}
              className={`flex items-center justify-between p-3 border rounded-lg cursor-default hover:bg-gray-50 shadow-sm transition ${
                isPlayingSong ? "bg-red-50 border-red-300" : "border-gray-200"
              }`}
            >
              {/* Left info */}
              <div className="flex items-center space-x-4">
                {song.cover_url ? (
                  <img
                    src={song.cover_url}
                    alt={song.title}
                    className="w-12 h-12 object-cover rounded-md border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 flex items-center justify-center rounded-md text-gray-400">
                    N/A
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-gray-800">{song.title}</span>
                  <span className="text-gray-500 text-sm">{song.artist}</span>
                </div>
              </div>

              {/* Right controls: ▶ button + ellipsis */}
              <div className="flex items-center space-x-3">
                {/* Play button */}
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

                {/* Ellipsis menu */}
                <div className="relative group">
                  <button className="p-2 hover:bg-gray-200 rounded-full">
                    <FaEllipsisV />
                  </button>
                  <div className="absolute right-0 mt-2 w-24 bg-white border rounded shadow-lg opacity-0 group-hover:opacity-100 transition z-10">
                    <button
                      className="w-full text-left px-3 py-1 hover:bg-gray-100"
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

      {/* Central Library Browse */}
      {showCentralLibrary && (
        <div className="border-t pt-4 flex flex-wrap gap-2">
          {allSongs
            .filter((s) => !playlist.songs.some((ps) => ps.id === s.id))
            .map((song) => (
              <button
                key={song.id}
                onClick={() => handleAddSong(playlist.id, song.id)}
                className="flex items-center gap-2 bg-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300 transition"
              >
                <img
                  src={song.cover_url || "/default_cover.png"}
                  alt={song.title}
                  className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                  loading="lazy"
                />
                <span>{song.title} - {song.artist}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}