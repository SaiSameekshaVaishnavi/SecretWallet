// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Wallet from "./pages/Wallet";

const Home: React.FC = () => (
  <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
    {/* Hero Section */}
    <div className="flex flex-col justify-center items-center text-center flex-1 px-6 pt-20">
      <h1 className="text-5xl font-bold mb-4 text-green-400">SecureWallet</h1>
      <p className="text-gray-300 max-w-lg mb-8 text-lg">
        Manage your money securely — Top up, transfer, and track your wallet balance with ease.
      </p>
      <div className="flex gap-4">
        <Link
          to="/register"
          className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-all"
        >
          Get Started
        </Link>
        <Link
          to="/login"
          className="border border-green-500 text-green-400 hover:bg-green-500 hover:text-black px-6 py-3 rounded-lg font-semibold transition-all"
        >
          Login
        </Link>
      </div>
    </div>

    {/* Features Section */}
    <div className="bg-gray-800/80 py-16">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-6 text-center">
        <div className="bg-gray-900/80 p-6 rounded-2xl shadow-xl hover:scale-105 transition-all">
          <h3 className="text-xl font-semibold mb-2 text-green-400">Top Up Instantly</h3>
          <p className="text-gray-300">
            Add funds in just a few clicks using secure payment methods.
          </p>
        </div>
        <div className="bg-gray-900/80 p-6 rounded-2xl shadow-xl hover:scale-105 transition-all">
          <h3 className="text-xl font-semibold mb-2 text-green-400">Send & Receive</h3>
          <p className="text-gray-300">
            Instantly transfer money to friends and family — anytime, anywhere.
          </p>
        </div>
        <div className="bg-gray-900/80 p-6 rounded-2xl shadow-xl hover:scale-105 transition-all">
          <h3 className="text-xl font-semibold mb-2 text-green-400">Track Transactions</h3>
          <p className="text-gray-300">
            Stay updated with your latest wallet transactions in one place.
          </p>
        </div>
      </div>
    </div>

    {/* Footer */}
    <footer className="bg-gray-900 text-gray-400 text-center py-6">
      © {new Date().getFullYear()} SecureWallet. All rights reserved.
    </footer>
  </div>
);

const App: React.FC = () => (
  <Router>
    {/* --- Navbar --- */}
    <header className="fixed top-0 left-0 w-full bg-gray-900/80 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4 text-white">
        <Link to="/" className="text-2xl font-bold text-green-400">
          SecureWallet
        </Link>
        <nav className="flex gap-6">
          <Link to="/" className="hover:text-green-400 transition">
            Home
          </Link>
          <Link to="/register" className="hover:text-green-400 transition">
            Register
          </Link>
          <Link to="/login" className="hover:text-green-400 transition">
            Login
          </Link>
          <Link to="/wallet" className="hover:text-green-400 transition">
            Wallet
          </Link>
        </nav>
      </div>
    </header>

    {/* --- Routes --- */}
    <div className="pt-20">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/wallet" element={<Wallet />} />
      </Routes>
    </div>
  </Router>
);

export default App;

