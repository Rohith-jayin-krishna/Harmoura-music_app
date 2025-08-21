import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { successToast } from "../utils/toasts";
import { confirmToast } from "../utils/toastUtils";
import { Menu, X, Search } from "lucide-react";

interface NavbarProps {
  user: string | null;
  onSignOut: () => void;
}

export default function Navbar({ user, onSignOut }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const BASE_URL = "http://127.0.0.1:8000";

  const getToken = () =>
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node))
        setDropdownOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node))
        setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch profile picture
  useEffect(() => {
    const token = getToken();
    if (!token || !user) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/users/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfilePictureUrl(
          res.data.profile_picture ? `${BASE_URL}${res.data.profile_picture}` : null
        );
      } catch (err) {
        console.error("Failed to fetch profile picture:", err);
        setProfilePictureUrl(null);
      }
    };

    fetchProfile();
  }, [user]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Library", path: "/library", protected: true },
    { name: "Profile", path: "/profile", protected: true },
  ];

  const handleSignOut = () => {
    confirmToast("Are you sure you want to sign out?", () => {
      onSignOut();
      successToast("Signed out successfully 👋");
      navigate("/signin");
    });
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between relative">
      {/* Logo */}
      <Link
        to="/"
        className="text-lg md:text-xl font-semibold tracking-tight"
        style={{ color: "#f9243d" }}
      >
        Harmoura
      </Link>

      {/* Desktop Menu wrapper to prevent layout shift */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 relative h-10">
        {/* Links */}
        <div className="flex gap-6 items-center h-full">
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
        </div>

        {/* Search Icon */}
        {user && getToken() && (
          <Link to="/search" className="p-2 rounded hover:bg-gray-100 transition">
            <Search size={20} />
          </Link>
        )}

        {!user && (
          <Link
            to="/signin"
            className="transition-colors duration-200 hover:text-[#f9243d] font-medium"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Profile Dropdown (Desktop) */}
      {user && (
        <div className="hidden md:block relative" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer overflow-hidden"
          >
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500 text-sm">{user.charAt(0).toUpperCase()}</span>
            )}
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg text-sm z-50 animate-fadeIn">
              <Link
                to="/profile"
                className="block px-4 py-2 text-gray-700 hover:bg-[#fdecee] hover:text-[#f9243d]"
                onClick={() => setDropdownOpen(false)}
              >
                Profile
              </Link>
              <Link
                to="/settings"
                className="block px-4 py-2 text-gray-700 hover:bg-[#fdecee] hover:text-[#f9243d]"
                onClick={() => setDropdownOpen(false)}
              >
                Settings
              </Link>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 font-medium"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-gray-700"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute top-full left-0 w-full bg-white border-t shadow-md md:hidden z-40 animate-slideDown"
        >
          <div className="flex flex-col p-4 space-y-3 text-base">
            {navLinks
              .filter((link) => !link.protected || user)
              .map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors duration-200 ${
                    location.pathname === link.path
                      ? "font-semibold text-[#f9243d]"
                      : "hover:text-[#f9243d]"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

            {user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="text-red-600 hover:text-red-800 text-left"
              >
                Sign Out
              </button>
            )}

            {!user && (
              <Link
                to="/signin"
                className="hover:text-[#f9243d] font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}