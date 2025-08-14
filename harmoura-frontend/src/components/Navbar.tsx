import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

interface NavbarProps {
  user: string | null;
  onSignOut: () => void;
}

export default function Navbar({ user, onSignOut }: NavbarProps) {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Library", path: "/library", protected: true },
    { name: "Profile", path: "/profile", protected: true },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Logo as link */}
      <Link
        to="/"
        className="text-xl font-semibold tracking-tight"
        style={{ color: "#f9243d" }}
      >
        Harmoura
      </Link>

      {/* Links */}
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

        {/* Show Sign In if no user */}
        {!user && (
          <Link
            to="/signin"
            className="transition-colors duration-200 hover:text-[#f9243d] font-medium"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Profile icon and dropdown */}
      {user && (
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer"
          >
            <span className="text-gray-500 text-xs">P</span>
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg text-sm z-50">
              <button
                onClick={onSignOut}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
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
