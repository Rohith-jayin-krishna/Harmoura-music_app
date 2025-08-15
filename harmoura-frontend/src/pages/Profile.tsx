import { useState, useEffect } from "react";
import axios from "axios";

export default function Profile() {
  const [name, setName] = useState(""); // editable display name
  const [username, setUsername] = useState(""); // read-only
  const [email, setEmail] = useState(""); // read-only
  const [editing, setEditing] = useState(false);

  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  const BASE_URL = "http://127.0.0.1:8000";

  // Fetch profile from backend
  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/users/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(res.data.first_name || ""); // editable field
        setUsername(res.data.username || "");
        setEmail(res.data.email || "");
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, [token]);

  const handleSave = () => {
    setEditing(false);
    // For now, we only update locally. Backend update can be added later.
    alert("Profile updated locally!");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4" style={{ color: "#f9243d" }}>
        Your Profile
      </h1>
      <p className="text-gray-600 mb-8">Manage your account and settings.</p>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-lg font-bold">
            {username ? username.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="ml-4 flex flex-col gap-1">
            {editing ? (
              <>
                <input
                  className="border px-2 py-1 rounded"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display Name"
                />
                <input
                  className="border px-2 py-1 rounded bg-gray-100 cursor-not-allowed"
                  value={username}
                  readOnly
                  placeholder="Username"
                />
                <input
                  className="border px-2 py-1 rounded bg-gray-100 cursor-not-allowed"
                  value={email}
                  readOnly
                  placeholder="Email"
                />
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold">{name || username || "User"}</h2>
                <p className="text-gray-500">{email || "user@example.com"}</p>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded bg-[#f9243d] text-white"
              onClick={handleSave}
            >
              Save
            </button>
            <button
              className="px-4 py-2 rounded border"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="px-4 py-2 rounded bg-[#f9243d] text-white"
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}