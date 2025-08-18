// --- Library.tsx (PlayerContext fully integrated)
import { useState, useEffect } from "react";
import axios from "axios";
import { FaPlay, FaEllipsisV } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext"; // ✅ use context

export interface Song {
  id: number;
  title: string;
  artist: string;
  src: string;
  cover_url?: string; // cover from backend
}

interface Playlist {
  id: number;
  name: string;
  songs: Song[];
}

export default function Library() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [openPlaylist, setOpenPlaylist] = useState<Playlist | null>(null);
  const [showCentralLibrary, setShowCentralLibrary] = useState(false);
  const [playlistSearch, setPlaylistSearch] = useState("");

  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const baseURL = "http://127.0.0.1:8000";

  const toFullUrl = (u?: string) => (!u ? "" : u.startsWith("http") ? u : `${baseURL}${u}`);

  const { handlePlaySong, currentSong } = usePlayer();

  // Fetch playlists and songs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const playlistRes = await axios.get(`${baseURL}/api/users/playlists/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Normalize playlist songs
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
        { name: newPlaylistName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlaylists([...playlists, res.data]);
      setNewPlaylistName("");
    } catch (err) {
      console.error("Failed to create playlist:", err);
    }
  };

  const handleAddSong = async (playlistId: number, songId: number) => {
    try {
      const res = await axios.post(
        `${baseURL}/api/users/playlists/add_song/`,
        { playlist_id: playlistId, song_id: songId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedPlaylist = {
        ...res.data,
        songs: res.data.songs.map((s: Song) => ({
          ...s,
          cover_url: s.cover_url ? toFullUrl(s.cover_url) : undefined,
        })),
      };
      setOpenPlaylist(updatedPlaylist);
      setPlaylists(playlists.map(p => (p.id === playlistId ? updatedPlaylist : p)));
    } catch (err) {
      console.error("Failed to add song:", err);
    }
  };

  const handleRemoveSong = async (playlistId: number, songId: number) => {
    try {
      const res = await axios.post(
        `${baseURL}/api/users/playlists/remove_song/`,
        { playlist_id: playlistId, song_id: songId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedPlaylist = {
        ...res.data,
        songs: res.data.songs.map((s: Song) => ({
          ...s,
          cover_url: s.cover_url ? toFullUrl(s.cover_url) : undefined,
        })),
      };
      setOpenPlaylist(updatedPlaylist);
      setPlaylists(playlists.map(p => (p.id === playlistId ? updatedPlaylist : p)));
    } catch (err) {
      console.error("Failed to remove song:", err);
    }
  };

  const handleDeletePlaylist = async (playlistId: number) => {
    try {
      await axios.delete(`${baseURL}/api/users/playlists/delete/${playlistId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylists(playlists.filter(p => p.id !== playlistId));
    } catch (err) {
      console.error("Failed to delete playlist:", err);
    }
  };

  if (loading) return <p>Loading your library...</p>;

  if (!openPlaylist) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Your Library</h1>

        <div className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="New Playlist Name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="px-4 py-2 border rounded-lg flex-grow"
          />
          <button
            onClick={handleCreatePlaylist}
            className="bg-[#f9243d] text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Create Playlist
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="border p-4 rounded-lg shadow flex justify-between items-center cursor-pointer hover:shadow-lg transition"
            >
              <h2
                className="text-lg font-semibold"
                onClick={() => setOpenPlaylist(playlist)}
              >
                {playlist.name}
              </h2>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePlaylist(playlist.id);
                }}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const searchQuery = playlistSearch.trim().toLowerCase();
  const filteredSongs = openPlaylist.songs.filter((song) => {
    if (!searchQuery) return true;
    return (
      song.title.toLowerCase().includes(searchQuery) ||
      song.artist.toLowerCase().includes(searchQuery)
    );
  });

  return (
    <div>
      <button
        onClick={() => { setOpenPlaylist(null); setShowCentralLibrary(false); }}
        className="mb-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
      >
        &larr; Back to Playlists
      </button>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{openPlaylist.name}</h2>
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
                  onClick={() => handlePlaySong(song, openPlaylist.songs)}
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
                      onClick={() => handleRemoveSong(openPlaylist.id, song.id)}
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
            .filter(s => !openPlaylist.songs.some(ps => ps.id === s.id))
            .map((song) => (
              <button
                key={song.id}
                onClick={() => handleAddSong(openPlaylist.id, song.id)}
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