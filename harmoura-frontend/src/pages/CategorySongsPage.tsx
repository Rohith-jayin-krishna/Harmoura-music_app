// src/pages/CategorySongsPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { usePlayer } from "../context/PlayerContext";

interface Song {
  id: number;
  title: string;
  artist: string;
  src: string;
  cover_url?: string;
  emotion?: string;
  language?: string;
}

const CategorySongsPage = () => {
  const { type, value } = useParams<{ type: string; value: string }>();
  const [songs, setSongs] = useState<Song[]>([]);
  const { handlePlaySong, currentSong, isPlaying } = usePlayer();
  const navigate = useNavigate();

  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  useEffect(() => {
    const fetchSongs = async () => {
      if (!token || !type || !value) return;

      let url = "";
      if (type === "artist") url = `http://127.0.0.1:8000/api/users/songs/artist/${encodeURIComponent(value)}/`;
      else if (type === "emotion") url = `http://127.0.0.1:8000/api/users/songs/emotion/${encodeURIComponent(value)}/`;
      else if (type === "language") url = `http://127.0.0.1:8000/api/users/songs/language/${encodeURIComponent(value)}/`;
      else return;

      try {
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSongs(res.data.songs || []);
      } catch (err) {
        console.error("Failed to fetch category songs:", err);
        setSongs([]);
      }
    };

    fetchSongs();
  }, [type, value, token]);

  const handleSongClick = (song: Song) => {
    handlePlaySong(song, songs);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          {type?.charAt(0).toUpperCase() + type?.slice(1)}: {value}
        </h2>
        <button
          onClick={() => navigate("/search")}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          Back to Search
        </button>
      </div>

      {songs.length === 0 ? (
        <p className="text-gray-500 text-lg">No songs found for this category.</p>
      ) : (
        <div className="space-y-3">
          {songs.map((song) => (
            <div
              key={song.id}
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 shadow-sm transition ${
                currentSong?.id === song.id ? "bg-red-50 border-red-300" : "border-gray-200"
              }`}
              onClick={() => handleSongClick(song)}
            >
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
              
              <span className="flex items-end space-x-1">
                {currentSong?.id === song.id && isPlaying ? (
                  <div className="flex items-end">
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                  </div>
                ) : (
                  "▶"
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategorySongsPage;