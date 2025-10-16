import React, { useState } from "react";
import { apiClient } from "../api/apiClient";
import { isValidEmail, isStrongPassword } from "../utils/validation";
import AuthLayout from "../components/authLayout";

const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    // Check if name is provided
    if (!name.trim()) {
      setMessage("❌ Please enter your name.");
      return;
    }

    // Validate email
    if (!isValidEmail(email)) {
      setMessage("❌ Please enter a valid email address.");
      return;
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      setMessage(
        "❌ Password must be at least 8 chars, include upper, lower, number, and a special character."
      );
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post("/auth/register", {
        name,
        email,
        password,
      });
      setMessage(res.data.message || "✅ Registration successful!");
      setName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "❌ Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Your Account">
      <form onSubmit={handleRegister} className="space-y-5">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-2 rounded-lg transition duration-300"
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <p
          className={`text-center mt-2 text-sm ${
            message.startsWith("✅") ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
