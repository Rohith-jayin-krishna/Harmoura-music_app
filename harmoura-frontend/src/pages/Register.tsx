import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { successToast, errorToast } from "../utils/toasts";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState(""); // confirm password
  const [errors, setErrors] = useState<any>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/users/register/", {
        username,
        email,
        password,
        password2, // send confirm password
      });

      if (response.status === 201 || response.status === 200) {
        successToast("Registration successful! Please login.");
        navigate("/signin"); // redirect to SignIn page
      }
    } catch (error: any) {
      console.error("Registration failed:", error.response?.data || error.message);

      if (error.response?.data) {
        setErrors(error.response.data);
        errorToast(
          Object.entries(error.response.data)
            .map(([key, value]: any) =>
              Array.isArray(value) ? value.join(", ") : value
            )
            .join(" | ")
        );
      } else {
        setErrors({ general: error.message });
        errorToast(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#f9243d]">Register</h2>

        {errors && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
            {Object.entries(errors).map(([key, value]: any) => (
              <p key={key}>{Array.isArray(value) ? value.join(", ") : value}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9243d]"
          />
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
          <input
            type="password"
            placeholder="Confirm Password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f9243d]"
          />

          <button
            type="submit"
            className="bg-[#f9243d] text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition"
          >
            Register
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{" "}
          <Link to="/signin" className="text-[#f9243d] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}