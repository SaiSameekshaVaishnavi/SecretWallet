import User from "../models/User.js";
import Wallet from "../models/Wallet.js";

export const getWalletByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    return res.json({ walletId: wallet._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
