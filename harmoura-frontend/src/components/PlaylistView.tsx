// --- components/PlaylistView.tsx
import { useState } from "react";
import { FaPlay, FaEllipsisV } from "react-icons/fa";
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
  const { handlePlaySong, currentSong } = usePlayer();
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
    <div>
      <button
        onClick={onBack}
        className="mb-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
      >
        &larr; Back to Playlists
      </button>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{playlist.name}</h2>
        <button
          onClick={() => setShowCentralLibrary(!showCentralLibrary)}
          className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
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
          className="px-4 py-2 border rounded-lg w-full mb-2"
        />
      </div>

      {/* Playlist Songs */}
      <div className="flex flex-col gap-2 mb-4">
        {filteredSongs.map((song) => {
          const isPlayingSong = currentSong && currentSong.id === song.id;
          return (
            <div
              key={song.id}
              className={`flex justify-between items-center p-3 rounded-lg shadow hover:shadow-md transition
                ${isPlayingSong ? "bg-gray-200" : "bg-white"}`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={song.cover_url || "/default_cover.png"}
                  alt={song.title}
                  className="w-10 h-10 rounded-2xl object-cover flex-shrink-0"
                  loading="lazy"
                />
                <div>
                  <p className="font-semibold">{song.title}</p>
                  <p className="text-sm text-gray-500">{song.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlaySong(song, playlist.songs)}
                  className="bg-[#f9243d] text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
                >
                  <FaPlay />
                </button>
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
                className="flex items-center gap-2 bg-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300"
              >
                <img
                  src={song.cover_url || "/default_cover.png"}
                  alt={song.title}
                  className="w-8 h-8 rounded-2xl object-cover flex-shrink-0"
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