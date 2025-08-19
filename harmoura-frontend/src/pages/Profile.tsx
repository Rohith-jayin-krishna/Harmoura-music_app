import { useState, useEffect, type ChangeEvent } from "react";
import axios from "axios";
import { type Emotion } from "../context/PlayerContext";
import HarmouraPortrait from "../components/HarmouraPortrait";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { successToast, errorToast } from "../utils/toasts";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Profile() {
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [emotionStats, setEmotionStats] = useState<Record<Emotion, number>>({
    Happiness: 0,
    Sadness: 0,
    Calmness: 0,
    Excitement: 0,
    Love: 0,
  });

  const [artistStats, setArtistStats] = useState<Record<string, number>>({});

  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${BASE_URL}/api/users/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setFirstName(res.data.first_name || "");
        setUsername(res.data.username || "");
        setEmail(res.data.email || "");

        const picUrl = res.data.profile_picture
          ? `${BASE_URL}${res.data.profile_picture}`
          : null;
        setProfilePictureUrl(picUrl);

        setEmotionStats(res.data.emotion_stats || emotionStats);
        setArtistStats(res.data.artist_stats || artistStats);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        errorToast("Failed to load profile.");
      }
    };

    fetchProfile();
  }, [token]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setProfilePicture(file);
    if (file) setProfilePictureUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!token) return;
    const formData = new FormData();
    formData.append("first_name", firstName);
    if (profilePicture) formData.append("profile_picture", profilePicture);

    try {
      const res = await axios.put(`${BASE_URL}/api/users/profile/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setFirstName(res.data.first_name || "");
      setProfilePicture(null);
      const picUrl = res.data.profile_picture
        ? `${BASE_URL}${res.data.profile_picture}`
        : profilePictureUrl;
      setProfilePictureUrl(picUrl);
      setEditing(false);
      successToast("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      errorToast("Failed to update profile.");
    }
  };

  const buttonClass =
    "px-4 py-2 rounded text-white font-medium shadow hover:shadow-lg transition";

  const emotionLabels: Emotion[] = ["Happiness", "Sadness", "Calmness", "Excitement", "Love"];
  const emotionData = emotionLabels.map((e) => emotionStats[e] || 0);

  const pieData = {
    labels: emotionLabels,
    datasets: [
      {
        data: emotionData,
        backgroundColor: ["#FFC857", "#2A4D69", "#88B04B", "#FF8C42", "#E63946"],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const },
    },
  };

  const topArtists = Object.entries(artistStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-[#f9243d]">Your Profile</h1>

      {/* User Info */}
      <div className="bg-white shadow-lg rounded-lg p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Profile Picture */}
        <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 text-gray-500 font-bold text-xl mx-auto sm:mx-0">
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            username ? username.charAt(0).toUpperCase() : "U"
          )}
        </div>

        {/* Name & Email */}
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <h2 className="text-lg font-semibold">{firstName || username || "User"}</h2>
          <p className="text-gray-500 text-sm">{email || "user@example.com"}</p>
        </div>

        {/* Edit Button */}
        <div className="sm:ml-auto text-center sm:text-right">
          <button
            className={`${buttonClass} bg-[#f9243d] hover:bg-red-600 text-sm px-3 py-1`}
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-white shadow-lg rounded-lg p-5 mb-6 flex flex-col gap-3">
          <input
            className="border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f9243d]"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Display Name"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border px-3 py-2 rounded"
          />
          <button
            className={`${buttonClass} bg-[#f9243d] hover:bg-red-600`}
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      )}
      {/* Harmoura Portrait */}
<div className="bg-white shadow-lg rounded-lg p-5 mb-6">
  <h2 className="text-lg font-semibold mb-2 text-gray-800">Harmoura Portrait</h2>
  <HarmouraPortrait
    emotionStats={emotionStats} // pass full emotionStats object
  />
</div>

      {/* Emotion Pie Chart */}
      <div className="bg-white shadow-lg rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Listening Emotions</h2>
        <div className="h-56">
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>

      {/* Top Artists */}
      <div className="bg-white shadow-lg rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Top Artists</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          {topArtists.length ? (
            topArtists.map(([artist, count]) => (
              <li key={artist}>
                {artist}{" "}
                <span className="text-gray-500">
                  ({count} {count === 1 ? "play" : "plays"})
                </span>
              </li>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No songs played yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
}