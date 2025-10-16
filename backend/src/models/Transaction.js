import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  txId: { type: String, required: true, unique: true },
  type: { type: String, enum: ["TOPUP","TRANSFER","ADJUSTMENT","REFUND"], required: true },
  fromWallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", default: null },
  toWallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", default: null },
  amount: { type: Number, required: true }, // paise
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["PENDING","COMPLETED","FAILED"], default: "PENDING" },
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

export default mongoose.model("Transaction", transactionSchema);
