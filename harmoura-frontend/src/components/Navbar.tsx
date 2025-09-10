import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { successToast } from "../utils/toasts";
import { confirmToast } from "../utils/toastUtils";
import { Menu, X, Search, User, LogOut } from "lucide-react";

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
    <nav className="mx-3 mt-3 
             bg-gradient-to-b from-white/40 to-white/10 
             backdrop-blur-md 
             border border-gray-200 
             px-4 md:px-6 py-3 
             flex items-center justify-between 
             relative z-50 
             rounded-2xl 
             shadow-xl 
             animate-fadeSlide">
      {/* Logo */}
      <Link
        to="/"
        className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#f9243d] to-[#c01f33] bg-clip-text text-transparent hover:scale-105 transition-transform duration-300"
      >
        Harmoura
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 relative h-10">
        {navLinks
          .filter((link) => !link.protected || user)
          .map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative px-2 py-1 rounded-lg transition-all duration-200 ${
                location.pathname === link.path
                  ? "font-semibold text-[#f9243d] bg-[#fdecee]"
                  : "hover:text-[#f9243d] hover:bg-gray-100"
              }`}
            >
              {link.name}
            </Link>
          ))}

        {/* Search Icon */}
        {user && getToken() && (
          <Link
            to="/search"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Search size={20} className="text-gray-600 hover:text-[#f9243d]" />
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
            className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer overflow-hidden ring-2 ring-transparent hover:ring-[#f9243d]/40 transition-all"
          >
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500 text-sm font-semibold">
                {user.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-48 
                            bg-white/80 backdrop-blur-xl 
                            border border-gray-200 
                            rounded-2xl shadow-xl 
                            text-sm z-50 animate-fadeIn overflow-hidden">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-[#fdecee] hover:text-[#f9243d] transition"
                onClick={() => setDropdownOpen(false)}
              >
                <User size={16} /> Profile
              </Link>
              <Link
                to="/search"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-[#fdecee] hover:text-[#f9243d] transition"
                onClick={() => setDropdownOpen(false)}
              >
                <Search size={16} /> Search
              </Link>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 font-medium transition"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-gray-700 hover:text-[#f9243d] transition-colors"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-t shadow-lg md:hidden z-40 animate-slideDown rounded-b-xl"
        >
          <div className="flex flex-col p-4 space-y-3 text-base">
            {navLinks
              .filter((link) => !link.protected || user)
              .map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                    location.pathname === link.path
                      ? "font-semibold text-[#f9243d] bg-[#fdecee]"
                      : "hover:text-[#f9243d] hover:bg-gray-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}

            {user && getToken() && (
              <Link
                to="/search"
                className="px-3 py-2 rounded-lg hover:text-[#f9243d] hover:bg-gray-100 font-medium transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Search
              </Link>
            )}

            {user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-100 text-left font-medium transition"
              >
                Sign Out
              </button>
            )}

            {!user && (
              <Link
                to="/signin"
                className="px-3 py-2 rounded-lg hover:text-[#f9243d] hover:bg-gray-100 font-medium transition"
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
