import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlay } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext"; // ✅ import context

type Song = {
  id: number;
  title: string;
  artist: string;
  src: string;
  cover?: string;
};

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const { handlePlaySong, currentSong } = usePlayer(); // ✅ use context

  useEffect(() => {
    axios
      .get<Song[]>("http://127.0.0.1:8000/api/users/songs/public/")
      .then((res) =>
        setSongs(
          res.data.map((s) => ({
            ...s,
            src: s.src.startsWith("http") ? s.src : `http://127.0.0.1:8000${s.src}`,
          }))
        )
      )
      .catch((err) => console.error("Error fetching songs:", err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Central Library</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {songs.map((song) => {
          const isPlayingSong = currentSong && currentSong.id === song.id;
          return (
            <div
              key={song.id}
              className={`relative bg-white shadow-md rounded-3xl overflow-hidden cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300 group
                ${isPlayingSong ? "ring-2 ring-[#f9243d]" : ""}`}
              onClick={() => handlePlaySong(song, songs)} // ✅ play via context
            >
              <div className="w-full h-48 bg-gray-200 relative">
                {song.cover ? (
                  <img
                    src={
                      song.cover.startsWith("http")
                        ? song.cover
                        : `http://127.0.0.1:8000${song.cover}`
                    }
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Cover
                  </div>
                )}
<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
  <FaPlay className="text-white text-3xl p-3 rounded-full bg-black/60" />
</div>
              </div>

              <div className="p-4">
                <h2 className="text-lg font-semibold truncate">{song.title}</h2>
                <p className="text-sm text-gray-500 truncate">{song.artist}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}