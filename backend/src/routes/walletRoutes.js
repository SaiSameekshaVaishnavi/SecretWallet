import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireIdempotencyKey } from "../middleware/idempotencyMiddleware.js";
import { getMyWallet, topup, transfer, listTransactions } from "../controllers/walletController.js";
import { getMe } from "../controllers/authController.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.get("/", protect, getMyWallet);
router.post("/topup", protect, topup); // optional idempotency header supported
router.post("/transfer", protect, requireIdempotencyKey, transfer); // requires Idempotency-Key
router.get("/transactions", protect, listTransactions);

export default router;
