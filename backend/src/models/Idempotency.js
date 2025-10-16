import mongoose from "mongoose";

const idempotencySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  result: { type: Object }, // store response/result
  createdAt: { type: Date, default: Date.now, expires: `${process.env.IDEMPOTENCY_TTL_HOURS || 24}h` }
});

// TTL is set by "expires" on createdAt. It uses the environment variable or defaults to 24h.
export default mongoose.model("Idempotency", idempotencySchema);
