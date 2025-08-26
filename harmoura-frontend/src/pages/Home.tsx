import { useEffect, useState } from "react";
import axios from "axios";
import { FaPlay } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";
import { infoToast } from "../utils/toasts";
import PlaylistView from "../components/PlaylistView";
import CentralLibrarySearch from "../components/CentralLibrarySearch";

type Song = {
  id: number;
  title: string;
  artist: string;
  src: string;
  cover_url?: string;
  emotion?: string;
  language?: string;
};

type Playlist = {
  id: number;
  name: string;
  cover_url?: string | null;
  songs: Song[];
  last_opened?: string;
  open_count?: number;
};

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [displayedSongs, setDisplayedSongs] = useState<Song[]>([]);
  const [recentPlaylists, setRecentPlaylists] = useState<Playlist[]>([]);
  const [frequentPlaylists, setFrequentPlaylists] = useState<Playlist[]>([]);
  const [searchActive, setSearchActive] = useState(false);
  const [openPlaylistView, setOpenPlaylistView] = useState<Playlist | null>(null);

  const { handlePlaySong, currentSong, fetchRecommendedSongs } = usePlayer();

  const baseURL = "http://127.0.0.1:8000";
  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  // ---------------- Fetch Recommended Songs ----------------
  useEffect(() => {
    const loadRecommended = async () => {
      if (!token) return;

      try {
        const res = await axios.get<Song[]>(
          `${baseURL}/api/users/songs/recommended/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const recSongs = res.data.map((s) => ({
          ...s,
          src: s.src.startsWith("http") ? s.src : `${baseURL}${s.src}`,
          cover_url: s.cover_url
            ? s.cover_url.startsWith("http")
              ? s.cover_url
              : `${baseURL}${s.cover_url}`
            : undefined,
        }));

        setSongs(recSongs);
        if (!searchActive) {
          setDisplayedSongs(recSongs.slice(0, 8));
        }
        await fetchRecommendedSongs();
      } catch (err) {
        console.error("Failed to load recommended songs:", err);
      }
    };

    loadRecommended();
  }, [fetchRecommendedSongs, token, searchActive]);

  // ---------------- Fetch Recent & Frequent Playlists ----------------
  useEffect(() => {
    const loadPlaylists = async () => {
      if (!token) {
        setRecentPlaylists([]);
        setFrequentPlaylists([]);
        return;
      }

      try {
        const recentRes = await axios.get(
          `${baseURL}/api/users/playlists/recent/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRecentPlaylists(
          (recentRes.data.recent_playlists || []).map((pl: Playlist) => ({
            ...pl,
            cover_url: pl.cover_url
              ? pl.cover_url.startsWith("http")
                ? pl.cover_url
                : `${baseURL}${pl.cover_url}`
              : null,
          }))
        );

        const frequentRes = await axios.get(
          `${baseURL}/api/users/playlists/frequent/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFrequentPlaylists(
          (frequentRes.data || []).map((pl: Playlist) => ({
            ...pl,
            cover_url: pl.cover_url
              ? pl.cover_url.startsWith("http")
                ? pl.cover_url
                : `${baseURL}${pl.cover_url}`
              : null,
          }))
        );
      } catch (err) {
        console.error("Failed to load playlists:", err);
        setRecentPlaylists([]);
        setFrequentPlaylists([]);
      }
    };

    loadPlaylists();
  }, [token]);

  // ---------------- Play Song ----------------
  const playSongIfSignedIn = (song: Song) => {
    if (!token) {
      infoToast("Please sign in to play songs.");
      return;
    }
    handlePlaySong(song, songs);
  };

  // ---------------- Open Playlist Inline ----------------
  const openPlaylistInline = async (pl: Playlist) => {
    if (!token) {
      infoToast("Please sign in to open playlists.");
      return;
    }

    try {
      await axios.post(
        `${baseURL}/api/users/playlists/${pl.id}/open/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpenPlaylistView(pl);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        infoToast("Playlist not found.");
      } else {
        infoToast("Failed to open playlist.");
      }
    }
  };

  if (openPlaylistView) {
    return (
      <PlaylistView
        playlist={openPlaylistView}
        allSongs={songs}
        handleAddSong={() => {}}
        handleRemoveSong={() => {}}
        onBack={() => setOpenPlaylistView(null)}
      />
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* ---------------- Header ---------------- */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">
          {searchActive ? "Search Results" : "Recommended For You"}
        </h1>
      </div>

      {/* ---------------- Central Library Search ---------------- */}
      {token && (
        <div className="mb-6">
          <CentralLibrarySearch
            token={token}
            onResults={(results: Song[]) => {
              if (results.length > 0) {
                setDisplayedSongs(results);
                setSearchActive(true);
              } else {
                setDisplayedSongs(songs.slice(0, 8));
                setSearchActive(false);
              }
            }}
          />
        </div>
      )}

      {/* ---------------- Songs Grid ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        {displayedSongs.map((song) => {
          const isPlayingSong = currentSong && currentSong.id === song.id;
          return (
            <div
              key={song.id}
              className={`relative bg-white shadow-md rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300 group
                ${isPlayingSong ? "ring-2 ring-[#f9243d]" : ""}`}
              onClick={() => playSongIfSignedIn(song)}
            >
              <div className="w-full h-32 sm:h-40 md:h-48 bg-gray-200 relative">
                {song.cover_url ? (
                  <img
                    src={song.cover_url}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 text-xs md:text-sm">
                    No Cover
                  </div>
                )}
                {song.language && (
                  <span className="absolute top-2 left-2 text-[10px] md:text-xs px-2 py-1 rounded-full bg-black/60 text-white">
                    {song.language}
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
                  <FaPlay className="text-white text-lg md:text-3xl p-2 md:p-3 rounded-full bg-black/60" />
                </div>
              </div>
              <div className="p-2 md:p-4">
                <h2 className="text-sm md:text-lg font-semibold truncate">{song.title}</h2>
                <p className="text-xs md:text-sm text-gray-500 truncate">{song.artist}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------- Recent Playlists ---------------- */}
      <h2 className="text-xl font-semibold mb-3">Recently Opened Playlists</h2>
      {recentPlaylists.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
          {recentPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => openPlaylistInline(pl)}
              className="flex-none w-36 h-36 bg-gray-100 rounded-xl shadow-md p-3 cursor-pointer hover:shadow-lg flex flex-col items-center justify-center"
            >
              {pl.cover_url ? (
                <img
                  src={pl.cover_url}
                  alt={pl.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-2xl font-bold">{pl.name.charAt(0).toUpperCase()}</span>
              )}
              <span className="mt-2 text-sm text-center truncate w-full">{pl.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mb-6">No recent playlists found.</p>
      )}

      {/* ---------------- Frequent Playlists ---------------- */}
      <h2 className="text-xl font-semibold mb-3">Frequently Opened Playlists</h2>
      {frequentPlaylists.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
          {frequentPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => openPlaylistInline(pl)}
              className="flex-none w-36 h-36 bg-gray-100 rounded-xl shadow-md p-3 cursor-pointer hover:shadow-lg flex flex-col items-center justify-center"
            >
              {pl.cover_url ? (
                <img
                  src={pl.cover_url}
                  alt={pl.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-2xl font-bold">{pl.name.charAt(0).toUpperCase()}</span>
              )}
              <span className="mt-2 text-sm text-center truncate w-full">{pl.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mb-6">No frequent playlists found.</p>
      )}
    </div>
  );
}