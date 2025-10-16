import Idempotency from "../models/Idempotency.js";

export const requireIdempotencyKey = async (req, res, next) => {
  const key = req.headers["idempotency-key"];
  if (!key) return res.status(400).json({ message: "Missing Idempotency-Key header" });

  // If we've already stored a result for this key, return it immediately:
  const existing = await Idempotency.findOne({ key });
  if (existing) {
    return res.status(200).json({ idempotent: true, result: existing.result });
  }
  req.idempotencyKey = key;
  next();
};
