import React, { useState, useEffect } from "react";
import { apiClient } from "../api/apiClient";
import { v4 as uuidv4 } from "uuid";

interface User {
  _id: string;
  name: string;
  email: string;
}

const Wallet: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  // Fetch user info
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await apiClient.get("/wallet/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
    } catch {
      setMessage("Failed to load user info");
    }
  };

  // ---- FETCH WALLET + TRANSACTIONS ----
  const fetchWallet = async () => {
    try {
      const res = await apiClient.get("/wallet");
      setBalance(res.data.wallet?.balance ?? res.data.balance ?? 0);
    } catch (err) {
      setMessage("Failed to load balance");
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await apiClient.get("/wallet/transactions");
      setTransactions(res.data.transactions);
    } catch (err) {
      setMessage("Failed to load transactions");
    }
  };

  // ---- TOP UP HANDLER ----
  const handleTopup = async () => {
    try {
      const idempotencyKey = uuidv4();
      const res = await apiClient.post(
        "/wallet/topup",
        { amount },
        { headers: { "Idempotency-Key": idempotencyKey } }
      );
      setMessage(res.data.message);
      fetchWallet();
      fetchTransactions();
      setAmount("");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Topup failed");
    }
  };

  // ---- TRANSFER HANDLER ----
  const handleTransfer = async () => {
    try {
      if (!transferEmail || !transferAmount) {
        setMessage("Please enter both email and amount");
        return;
      }

      // Step 1: Fetch walletId for the recipient email
      const walletRes = await apiClient.get(`/users/byEmail/${transferEmail}`);
      const toWalletId = walletRes.data.walletId;

      if (!toWalletId) {
        setMessage("Recipient wallet not found");
        return;
      }

      // Step 2: Call transfer endpoint
      const idempotencyKey = uuidv4();
      const transferRes = await apiClient.post(
        "/wallet/transfer",
        { toWalletId, amount: transferAmount },
        { headers: { "Idempotency-Key": idempotencyKey } }
      );

      setMessage(transferRes.data.message);
      fetchWallet();
      fetchTransactions();
      setTransferAmount("");
      setTransferEmail("");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Transfer failed");
    }
  };

  useEffect(() => {
    fetchUser();
    fetchWallet();
    fetchTransactions();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
        {/* Greeting */}
        <h2 className="text-3xl font-semibold mb-6 text-center">
          Hi, {user?.name || "User"}! 👋
        </h2>

        {/* BALANCE */}
        <div className="bg-white/10 rounded-xl p-4 text-center mb-8">
          <p className="text-lg text-gray-300">Current Balance</p>
          <h1 className="text-4xl font-bold text-green-400 mt-2">
            ₹{balance ? (balance / 100).toFixed(2) : "Loading..."}
          </h1>
        </div>

        {/* TOP-UP SECTION */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Add Funds</h3>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              onClick={handleTopup}
              className="bg-green-500 hover:bg-green-600 px-5 py-3 rounded-lg font-semibold transition-all"
            >
              Top Up
            </button>
          </div>
        </div>

        {/* TRANSFER SECTION */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Transfer Funds</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Recipient Email"
              value={transferEmail}
              onChange={(e) => setTransferEmail(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="number"
              placeholder="Amount"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleTransfer}
              className="bg-blue-500 hover:bg-blue-600 px-5 py-3 rounded-lg font-semibold transition-all"
            >
              Send
            </button>
          </div>
        </div>

        {/* MESSAGE */}
        {message && (
          <p className="text-center mb-6 text-yellow-300 font-medium">
            {message}
          </p>
        )}

        {/* TRANSACTION HISTORY */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Recent Transactions</h3>
          <ul className="divide-y divide-gray-700">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <li
                  key={tx._id}
                  className="flex justify-between py-3 text-gray-300 hover:bg-gray-800/50 rounded-lg px-3 transition-all"
                >
                  <div className="flex-1">
                    <span>
                      {tx.direction}
                      {tx.direction !== "Top-up" && tx.counterpartyName
                        ? ` from ${tx.counterpartyName}`
                        : ""}
                    </span>
                  </div>

                  <div className="w-32 text-right font-semibold">
                    <span
                      className={`${
                        tx.direction === "Top-up" || tx.direction === "RECEIVED"
                          ? "text-green-400"
                          : "text-red-400"
                      } font-semibold`}
                    >
                      ₹{(tx.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-24 text-right text-sm text-gray-400">
                    {tx.status}
                  </div>
                </li>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">
                No transactions yet.
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
