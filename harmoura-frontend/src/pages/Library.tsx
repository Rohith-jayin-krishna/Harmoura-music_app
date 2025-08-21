import { useState, useEffect } from "react";
import axios from "axios";
import PlaylistView from "../components/PlaylistView";
import { usePlayer } from "../context/PlayerContext";
import { successToast, errorToast } from "../utils/toasts"; // ✅ import toasts

export interface Song {
  id: number;
  title: string;
  artist: string;
  src: string;
  cover_url?: string;
}

export interface Playlist {
  id: number;
  name: string;
  songs: Song[];
}

export default function Library() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [openPlaylist, setOpenPlaylist] = useState<Playlist | null>(null);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const baseURL = "http://127.0.0.1:8000";

  const toFullUrl = (u?: string) => (!u ? "" : u.startsWith("http") ? u : `${baseURL}${u}`);

  const { handlePlaySong, currentSong } = usePlayer();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const playlistRes = await axios.get(`${baseURL}/api/users/playlists/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const normalizedPlaylists = playlistRes.data.map((playlist: Playlist) => ({
          ...playlist,
          songs: playlist.songs.map((s: Song) => ({
            ...s,
            src: toFullUrl(s.src || s.file || s.audio || ""),
            cover_url: s.cover_url ? toFullUrl(s.cover_url) : undefined,
          })),
        }));
        setPlaylists(normalizedPlaylists);

        const songsRes = await axios.get(`${baseURL}/api/users/songs/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const normalizedSongs = songsRes.data.map((s: Song) => ({
          ...s,
          src: toFullUrl(s.src || s.file || s.audio || ""),
          cover_url: s.cover_url ? toFullUrl(s.cover_url) : undefined,
        }));
        setAllSongs(normalizedSongs);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        errorToast("Failed to load library data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const res = await axios.post(
        `${baseURL}/api/users/playlists/create/`,
        { name: newPlaylistName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlaylists([...playlists, res.data]);
      setNewPlaylistName("");
      setCreatingPlaylist(false);
      successToast("Playlist created successfully!"); // ✅ toast
    } catch (err) {
      console.error("Failed to create playlist:", err);
      errorToast("Failed to create playlist."); // ✅ toast
    }
  };

  const handleDeletePlaylist = async (playlistId: number) => {
    try {
      await axios.delete(`${baseURL}/api/users/playlists/delete/${playlistId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylists(playlists.filter(p => p.id !== playlistId));
      successToast("Playlist deleted successfully!"); // ✅ toast
    } catch (err) {
      console.error("Failed to delete playlist:", err);
      errorToast("Failed to delete playlist."); // ✅ toast
    }
  };

  if (loading) return <p>Loading your library...</p>;

  if (openPlaylist) {
    return (
      <PlaylistView
        playlist={openPlaylist}
        allSongs={allSongs}
        handleAddSong={() => {}}
        handleRemoveSong={() => {}}
        onBack={() => setOpenPlaylist(null)}
      />
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center md:text-left">
        Your Library
      </h1>

      {/* Create Playlist Button / Input */}
      <div className="mb-6 flex flex-col sm:flex-row gap-2">
        {creatingPlaylist ? (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <input
              type="text"
              placeholder="Playlist Name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="px-3 py-2 border rounded-lg flex-grow text-sm sm:text-base"
            />
            <button
              onClick={handleCreatePlaylist}
              className="bg-[#f9243d] text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm sm:text-base"
            >
              Save
            </button>
            <button
              onClick={() => {
                setCreatingPlaylist(false);
                setNewPlaylistName("");
              }}
              className="bg-gray-300 px-3 py-2 rounded-lg hover:bg-gray-400 transition text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingPlaylist(true)}
            className="bg-[#f9243d] text-white px-4 py-2 rounded-lg hover:bg-red-600 transition w-full sm:w-auto text-sm sm:text-base"
          >
            Create Playlist
          </button>
        )}
      </div>

      {/* Playlist Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {playlists.map((playlist) => {
          const firstLetter = playlist.name.charAt(0).toUpperCase();
          return (
            <div
              key={playlist.id}
              onClick={() => setOpenPlaylist(playlist)}
              className="relative group cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition transform hover:-translate-y-1 flex flex-col items-center justify-center p-3 sm:p-4"
              style={{ aspectRatio: "1 / 1", backgroundColor: "#f9f9f9" }}
            >
              {/* First Letter */}
              <span className="text-gray-800 text-2xl sm:text-3xl md:text-4xl font-bold select-none">
                {firstLetter}
              </span>

              {/* Playlist Name */}
              <span className="mt-2 text-gray-600 text-xs sm:text-sm text-center truncate w-full px-1">
                {playlist.name}
              </span>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePlaylist(playlist.id);
                }}
                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition text-xs sm:text-sm"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}