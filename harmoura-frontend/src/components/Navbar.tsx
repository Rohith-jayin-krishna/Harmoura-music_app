import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import axios from "axios";

interface NavbarProps {
  user: string | null;
  onSignOut: () => void;
}

export default function Navbar({ user, onSignOut }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  const BASE_URL = "http://127.0.0.1:8000";
  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch profile picture
  useEffect(() => {
    if (!token || !user) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/users/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const picUrl = res.data.profile_picture
          ? `${BASE_URL}${res.data.profile_picture}`
          : null;

        setProfilePictureUrl(picUrl);
      } catch (err) {
        console.error("Failed to fetch profile picture:", err);
        setProfilePictureUrl(null);
      }
    };

    fetchProfile();
  }, [token, user]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Library", path: "/library", protected: true },
    { name: "Profile", path: "/profile", protected: true },
  ];

  const handleSignOut = () => {
    const confirmSignOut = window.confirm("Are you sure you want to sign out?");
    if (confirmSignOut) {
      onSignOut();
      navigate("/signin");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link
        to="/"
        className="text-xl font-semibold tracking-tight"
        style={{ color: "#f9243d" }}
      >
        Harmoura
      </Link>

      <div className="flex gap-4 text-sm font-medium text-gray-600 items-center">
        {navLinks
          .filter((link) => !link.protected || user)
          .map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors duration-200 ${
                location.pathname === link.path ? "font-semibold" : "hover:text-[#f9243d]"
              }`}
              style={location.pathname === link.path ? { color: "#f9243d" } : undefined}
            >
              {link.name}
            </Link>
          ))}

        {!user && (
          <Link
            to="/signin"
            className="transition-colors duration-200 hover:text-[#f9243d] font-medium"
          >
            Sign In
          </Link>
        )}
      </div>

      {user && (
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer overflow-hidden"
          >
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500 text-xs">
                {user.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg text-sm z-50
                         origin-top-right transform transition duration-150 ease-out"
            >
              {/* Profile & Settings: theme-consistent soft hover */}
              <Link
                to="/profile"
                className="block px-4 py-2 text-gray-700 hover:bg-[#fdecee] hover:text-[#f9243d] transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                Profile
              </Link>
              <Link
                to="/settings"
                className="block px-4 py-2 text-gray-700 hover:bg-[#fdecee] hover:text-[#f9243d] transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                Settings
              </Link>

              <hr className="my-1 border-gray-200" />

              {/* Sign Out: strictly subtle red */}
              <button
                onClick={handleSignOut}
                className="
                  block w-full text-left px-4 py-2 
                  text-red-600 
                  hover:bg-red-100 
                  focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-0
                  active:bg-red-200 
                  transition-colors font-medium
                "
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}