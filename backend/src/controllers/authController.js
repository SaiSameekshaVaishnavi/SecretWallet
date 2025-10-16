import bcrypt from "bcrypt";
//import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { signToken } from "../utils/jwt.util.js";

export const register = async (req, res) => {
  try {
    console.log("register called");
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    // Create a wallet for the user with zero balance
    const wallet = await Wallet.create({ user: user._id, balance: 0 });

    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email }, walletId: wallet._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
    return res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email _id");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};