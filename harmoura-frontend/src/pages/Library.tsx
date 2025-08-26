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

  const baseURL = "http://127.0.0.1:8000";

  // ✅ Updated to include fallback for missing files
  const toFullUrl = (u?: string, fallback?: string) => {
    if (!u) return fallback || "";
    if (u.startsWith("http")) return u;
    if (!u.startsWith("/")) u = "/" + u;
    return `${baseURL}${u}`;
  };

  const { handlePlaySong, currentSong } = usePlayer();

  useEffect(() => {
    const fetchData = async () => {
      const token =
        localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      try {
        const playlistRes = await axios.get(`${baseURL}/api/users/playlists/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const normalizedPlaylists = playlistRes.data.map((playlist: Playlist) => ({
          ...playlist,
          songs: playlist.songs.map((s: Song) => ({
            ...s,
            src: toFullUrl(s.src || s.file || s.audio, "/media/default_song.mp3"),
            cover_url: toFullUrl(s.cover_url, "/media/default_cover.png"),
          })),
        }));
        setPlaylists(normalizedPlaylists);

        const songsRes = await axios.get(`${baseURL}/api/users/songs/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const normalizedSongs = songsRes.data.map((s: Song) => ({
          ...s,
          src: toFullUrl(s.src || s.file || s.audio, "/media/default_song.mp3"),
          cover_url: toFullUrl(s.cover_url, "/media/default_cover.png"),
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
  }, []);

  const handleCreatePlaylist = async () => {
    const token =
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
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
      successToast("Playlist created successfully!");
    } catch (err) {
      console.error("Failed to create playlist:", err);
      errorToast("Failed to create playlist.");
    }
  };

  const handleDeletePlaylist = async (playlistId: number) => {
    const token =
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    try {
      await axios.delete(`${baseURL}/api/users/playlists/delete/${playlistId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylists(playlists.filter(p => p.id !== playlistId));
      successToast("Playlist deleted successfully!");
    } catch (err) {
      console.error("Failed to delete playlist:", err);
      errorToast("Failed to delete playlist.");
    }
  };

  // ✅ Add song to playlist
  const handleAddSong = async (playlistId: number, songId: number) => {
    const token =
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    try {
      await axios.post(
        `${baseURL}/api/users/playlists/${playlistId}/add-song/`,
        { song_id: songId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const addedSong = allSongs.find(s => s.id === songId);
      if (!addedSong) return;

      setPlaylists(prev =>
        prev.map(p =>
          p.id === playlistId ? { ...p, songs: [...p.songs, addedSong] } : p
        )
      );

      setOpenPlaylist(prev =>
        prev && prev.id === playlistId
          ? { ...prev, songs: [...prev.songs, addedSong] }
          : prev
      );

      successToast("Song added to playlist!");
    } catch (err) {
      console.error("Failed to add song:", err);
      errorToast("Failed to add song to playlist.");
    }
  };

  // ✅ Remove song from playlist
  const handleRemoveSong = async (playlistId: number, songId: number) => {
    const token =
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    try {
      await axios.post(
        `${baseURL}/api/users/playlists/${playlistId}/remove-song/`,
        { song_id: songId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPlaylists(prev =>
        prev.map(p =>
          p.id === playlistId
            ? { ...p, songs: p.songs.filter(s => s.id !== songId) }
            : p
        )
      );

      setOpenPlaylist(prev =>
        prev && prev.id === playlistId
          ? { ...prev, songs: prev.songs.filter(s => s.id !== songId) }
          : prev
      );

      successToast("Song removed from playlist!");
    } catch (err) {
      console.error("Failed to remove song:", err);
      errorToast("Failed to remove song from playlist.");
    }
  };

  // ✅ Fixed: Notify backend when a playlist is opened with proper token
  const handleOpenPlaylist = async (playlist: Playlist) => {
    setOpenPlaylist(playlist);

    const token =
      localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) return;

    try {
      await axios.post(
        `${baseURL}/api/users/playlists/${playlist.id}/open/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to notify playlist open:", err);
    }
  };

  if (loading) return <p>Loading your library...</p>;

  if (openPlaylist) {
    return (
      <PlaylistView
        playlist={openPlaylist}
        allSongs={allSongs}
        handleAddSong={handleAddSong}
        handleRemoveSong={handleRemoveSong}
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
              onClick={() => handleOpenPlaylist(playlist)} // ✅ use new function
              className="relative group cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition transform hover:-translate-y-1 flex flex-col items-center justify-center p-3 sm:p-4"
              style={{ aspectRatio: "1 / 1", backgroundColor: "#f9f9f9" }}
            >
              <span className="text-gray-800 text-2xl sm:text-3xl md:text-4xl font-bold select-none">
                {firstLetter}
              </span>

              <span className="mt-2 text-gray-600 text-xs sm:text-sm text-center truncate w-full px-1">
                {playlist.name}
              </span>

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
