import { useEffect, useState } from "react";
import axios from "axios";

interface Song {
  id: number;
  title: string;
  artist: string;
  src: string;
}

export default function CentralLibrary() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = "http://127.0.0.1:8000";
  const toFullUrl = (u?: string) => (!u ? "" : u.startsWith("http") ? u : `${BASE_URL}${u}`);

  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/users/songs/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSongs((res.data || []).map((s: any) => ({ ...s, src: toFullUrl(s.src) })));
      } catch (err) {
        console.error("Failed to fetch central library songs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [token]);

  if (loading) return <p>Loading central library...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Central Library</h1>
      {songs.map((song) => (
        <div key={song.id} className="flex justify-between items-center bg-white p-4 mb-2 rounded shadow">
          <div>
            <p className="font-semibold">{song.title}</p>
            <p className="text-sm text-gray-500">{song.artist}</p>
          </div>
          <audio
            controls
            src={song.src}
            className="w-48"
            onError={(e) => {
              const el = e.currentTarget as HTMLAudioElement;
              console.error("Audio error in CentralLibrary. src=", el?.src);
            }}
          />
        </div>
      ))}
    </div>
  );
}