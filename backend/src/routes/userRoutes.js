import express from "express";
import { getWalletByEmail } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/byEmail/:email", protect, getWalletByEmail);

export default router;
