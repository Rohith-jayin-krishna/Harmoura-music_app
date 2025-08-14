// --- Library.tsx (updated)
import { useState, useEffect } from "react";
import axios from "axios";
import { FaPlay, FaEllipsisV } from "react-icons/fa";

interface Song {
  id: number;
  title: string;
  artist: string;
  src: string;
}

interface Playlist {
  id: number;
  name: string;
  songs: Song[];
}

interface LibraryProps {
  onPlay: (song: Song) => void;
  currentSong: Song | null;
}

export default function Library({ onPlay, currentSong }: LibraryProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [openPlaylist, setOpenPlaylist] = useState<Playlist | null>(null);
  const [showCentralLibrary, setShowCentralLibrary] = useState(false);

  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  const baseURL = "http://127.0.0.1:8000";

  const toFullUrl = (u?: string) => (!u ? "" : u.startsWith("http") ? u : `${baseURL}${u}`);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const playlistRes = await axios.get(
          `${baseURL}/api/users/playlists/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPlaylists(playlistRes.data);

        const songsRes = await axios.get(
          `${baseURL}/api/users/songs/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Normalize src here so onPlay gets ready-to-play URL
        const normalizedSongs = songsRes.data.map((s: any) => ({
          ...s,
          src: toFullUrl(s.src || s.file || s.audio || "")
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
      setOpenPlaylist(res.data);
      setPlaylists(playlists.map(p => (p.id === playlistId ? res.data : p)));
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
      setOpenPlaylist(res.data);
      setPlaylists(playlists.map(p => (p.id === playlistId ? res.data : p)));
    } catch (err) {
      console.error("Failed to remove song:", err);
    }
  };

  if (loading) return <p>Loading your library...</p>;

  // --- Main Library View ---
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
              className="border p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
              onClick={() => setOpenPlaylist(playlist)}
            >
              <h2 className="text-lg font-semibold">{playlist.name}</h2>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Open Playlist View ---
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

      <div className="flex flex-col gap-2 mb-4">
        {openPlaylist.songs.map((song) => {
          const isPlayingSong = currentSong && currentSong.id === song.id;
          return (
            <div
              key={song.id}
              className={`flex justify-between items-center p-3 rounded-lg shadow hover:shadow-md transition
                ${isPlayingSong ? "bg-gray-200" : "bg-white"}`}
            >
              <div>
                <p className="font-semibold">{song.title}</p>
                <p className="text-sm text-gray-500">{song.artist}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Ensure src is fully qualified before calling onPlay
                    onPlay({ ...song, src: toFullUrl(song.src) });
                  }}
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

      {showCentralLibrary && (
        <div className="border-t pt-4 flex flex-wrap gap-2">
          {allSongs
            .filter(s => !openPlaylist.songs.some(ps => ps.id === s.id))
            .map((song) => (
              <button
                key={song.id}
                onClick={() => handleAddSong(openPlaylist.id, song.id)}
                className="bg-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300"
              >
                {song.title} - {song.artist}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}