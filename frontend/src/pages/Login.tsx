// src/pages/Login.tsx
import React, { useState } from "react";
import { apiClient } from "../api/apiClient";
import { isValidEmail } from "../utils/validation";
import AuthLayout from "../components/authLayout";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    // Email validation
    if (!isValidEmail(email)) {
      setMessage("❌ Invalid email format.");
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token); // store JWT
      setMessage("✅ Login successful!");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back">
      <form onSubmit={handleLogin} className="space-y-5">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-2 rounded-lg transition duration-300"
        >
          {" "}
          {loading ? "Logging in..." : "Login"}
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

export default Login;
