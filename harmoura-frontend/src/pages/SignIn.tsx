import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

interface SignInProps {
  onSignIn: (email: string, rememberMe: boolean) => void; // ✅ two arguments
}

export default function SignIn({ onSignIn }: SignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<any>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/users/login/", {
        email,  
        password,
        remember_me: rememberMe,
      });

      if (response.status === 200) {
        console.log("Login successful:", response.data);
        onSignIn(email, rememberMe); // ✅ pass both arguments

        // store tokens based on rememberMe
        if (rememberMe) {
          localStorage.setItem("accessToken", response.data.tokens.access);
          localStorage.setItem("refreshToken", response.data.tokens.refresh);
        } else {
          sessionStorage.setItem("accessToken", response.data.tokens.access);
          sessionStorage.setItem("refreshToken", response.data.tokens.refresh);
        }

        navigate("/home");
      }
    } catch (error: any) {
      console.error("Login failed:", error.response?.data || error.message);
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: error.message });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#f9243d]">Sign In</h2>

        {errors && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
            {Object.entries(errors).map(([key, value]: any) => (
              <p key={key}>{Array.isArray(value) ? value.join(", ") : value}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9243d]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9243d]"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-[#f9243d]"
            />
            Remember Me
          </label>

          <button
            type="submit"
            className="bg-[#f9243d] text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition"
          >
            Sign In
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Don’t have an account?{" "}
          <Link to="/register" className="text-[#f9243d] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}