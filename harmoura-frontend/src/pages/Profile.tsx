import { useState, useEffect, type ChangeEvent } from "react";
import axios from "axios";

export default function Profile() {
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  const BASE_URL = "http://127.0.0.1:8000";

  // Fetch user profile
  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/users/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFirstName(res.data.first_name || "");
        setUsername(res.data.username || "");
        setEmail(res.data.email || "");

        // Ensure full URL for profile picture
        const picUrl = res.data.profile_picture
          ? `${BASE_URL}${res.data.profile_picture}`
          : null;
        setProfilePictureUrl(picUrl);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, [token]);

  // Handle file input change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setProfilePicture(file);
    if (file) {
      // Preview new file
      setProfilePictureUrl(URL.createObjectURL(file));
    }
  };

  // Save profile changes
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
      setProfilePicture(null); // reset new upload

      // Ensure full URL again after save
      const picUrl = res.data.profile_picture
        ? `${BASE_URL}${res.data.profile_picture}`
        : profilePictureUrl;
      setProfilePictureUrl(picUrl);

      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile.");
    }
  };

  const buttonClass =
    "px-4 py-2 rounded text-white font-medium shadow hover:shadow-lg transition";

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4" style={{ color: "#f9243d" }}>
        Your Profile
      </h1>
      <p className="text-gray-600 mb-8">Manage your account and settings.</p>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-gray-500 text-lg font-bold">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              username ? username.charAt(0).toUpperCase() : "U"
            )}
          </div>

          <div className="ml-4 flex flex-col gap-2">
            {editing ? (
              <>
                <input
                  className="border px-2 py-1 rounded"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
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

                {/* File upload */}
                <input
                  type="file"
                  accept="image/*"
                  id="profilePicUpload"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="profilePicUpload"
                  className="cursor-pointer px-4 py-2 rounded bg-[#f9243d] text-white text-center hover:bg-red-600 transition"
                >
                  {profilePictureUrl ? "Edit Profile Picture" : "Upload Profile Picture"}
                </label>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold">{firstName || username || "User"}</h2>
                <p className="text-gray-500">{email || "user@example.com"}</p>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                className={`${buttonClass} bg-[#f9243d] hover:bg-red-600`}
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className={`${buttonClass} bg-gray-200 text-gray-700 hover:bg-gray-300`}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className={`${buttonClass} bg-[#f9243d] hover:bg-red-600`}
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}