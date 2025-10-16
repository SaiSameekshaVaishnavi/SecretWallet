import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import Idempotency from "../models/Idempotency.js";
import User from "../models/User.js";

// Helper: convert rupees -> paise (int)
const toPaise = (amount) => {
  const n = Number(amount);
  if (Number.isNaN(n) || n <= 0) throw new Error("Invalid amount");
  return Math.round(n * 100);
};

// GET /api/wallet  -> returns user's wallet
export const getMyWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    return res.json({ wallet });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/wallet/topup { amount: number (INR) } optional Idempotency-Key header
export const topup = async (req, res) => {
  const key = req.headers["idempotency-key"];
  try {
    const amountPaise = toPaise(req.body.amount);
    // If key provided and exists, return stored result
    if (key) {
      const existing = await Idempotency.findOne({ key });
      if (existing) return res.status(200).json(existing.result);
    }

    // Use transaction if available
    const session = await mongoose.startSession();
    let txDoc;
    try {
      session.startTransaction();

      const wallet = await Wallet.findOne({ user: req.user.id }).session(
        session
      );
      if (!wallet) throw new Error("Wallet not found");

      wallet.balance += amountPaise;
      wallet.updatedAt = new Date();
      await wallet.save({ session });

      const txId = uuidv4();
      txDoc = (
        await Transaction.create(
          [
            {
              txId,
              type: "TOPUP",
              fromWallet: null,
              toWallet: wallet._id,
              amount: amountPaise,
              status: "COMPLETED",
              createdAt: new Date(),
              completedAt: new Date(),
            },
          ],
          { session }
        )
      )[0];

      if (key) {
        await Idempotency.create(
          [
            {
              key,
              user: req.user.id,
              result: { message: "Topup completed", tx: txDoc },
            },
          ],
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ message: "Topup successful", tx: txDoc });
    } catch (errInner) {
      await session.abortTransaction();
      session.endSession();
      // If transactions aren't supported (single node without replset), fall back to simple update
      if (
        String(errInner)
          .toLowerCase()
          .includes("transactions are not supported") ||
        String(errInner).toLowerCase().includes("replica set")
      ) {
        // Fallback: direct update without session
        const wallet = await Wallet.findOne({ user: req.user.id });
        if (!wallet) throw errInner;
        wallet.balance += amountPaise;
        wallet.updatedAt = new Date();
        await wallet.save();

        const txId = uuidv4();
        txDoc = await Transaction.create({
          txId,
          type: "TOPUP",
          fromWallet: null,
          toWallet: wallet._id,
          amount: amountPaise,
          status: "COMPLETED",
          createdAt: new Date(),
          completedAt: new Date(),
        });

        if (key) {
          await Idempotency.create({
            key,
            user: req.user.id,
            result: { message: "Topup completed", tx: txDoc },
          });
        }

        return res
          .status(200)
          .json({ message: "Topup successful (fallback)", tx: txDoc });
      }
      throw errInner;
    }
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: err.message || "Topup failed" });
  }
};

// POST /api/wallet/transfer { toWalletId, amount }  require idempotency middleware
export const transfer = async (req, res) => {
  const key = req.idempotencyKey || req.headers["idempotency-key"];
  const { toWalletId, amount } = req.body;
  const userId = req.user.id;
  if (!key)
    return res.status(400).json({ message: "Idempotency-Key required" });

  try {
    // If already executed, return stored result
    const existing = await Idempotency.findOne({ key });
    if (existing) return res.status(200).json(existing.result);

    const amountPaise = toPaise(amount);

    const session = await mongoose.startSession();
    let txDoc;
    try {
      session.startTransaction();

      const fromWallet = await Wallet.findOne({ user: userId }).session(
        session
      );
      if (!fromWallet) throw new Error("Sender wallet not found");
      if (fromWallet.balance < amountPaise)
        throw new Error("Insufficient funds");

      const toWallet = await Wallet.findById(toWalletId).session(session);
      if (!toWallet) throw new Error("Receiver wallet not found");

      fromWallet.balance -= amountPaise;
      fromWallet.updatedAt = new Date();
      await fromWallet.save({ session });

      toWallet.balance += amountPaise;
      toWallet.updatedAt = new Date();
      await toWallet.save({ session });

      const txId = uuidv4();
      txDoc = (
        await Transaction.create(
          [
            {
              txId,
              type: "TRANSFER",
              fromWallet: fromWallet._id,
              toWallet: toWallet._id,
              amount: amountPaise,
              status: "COMPLETED",
              createdAt: new Date(),
              completedAt: new Date(),
            },
          ],
          { session }
        )
      )[0];

      // Store idempotency entry
      await Idempotency.create(
        [
          {
            key,
            user: userId,
            result: { message: "Transfer completed", tx: txDoc },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();
      return res
        .status(200)
        .json({ message: "Transfer successful", tx: txDoc });
    } catch (errInner) {
      await session.abortTransaction();
      session.endSession();

      // Fallback if transactions unsupported — best-effort atomic style with compensation
      if (
        String(errInner)
          .toLowerCase()
          .includes("transactions are not supported") ||
        String(errInner).toLowerCase().includes("replica set")
      ) {
        // Non-transaction fallback: decrement sender with atomic check, then increment receiver.
        const fromUpdated = await Wallet.findOneAndUpdate(
          { user: userId, balance: { $gte: amountPaise } },
          { $inc: { balance: -amountPaise }, updatedAt: new Date() },
          { new: true }
        );
        if (!fromUpdated)
          return res.status(400).json({
            message: "Insufficient funds or sender wallet not found (fallback)",
          });

        const toUpdated = await Wallet.findByIdAndUpdate(
          toWalletId,
          { $inc: { balance: amountPaise }, updatedAt: new Date() },
          { new: true }
        );
        if (!toUpdated) {
          // compensation attempt
          await Wallet.findByIdAndUpdate(fromUpdated._id, {
            $inc: { balance: amountPaise },
            updatedAt: new Date(),
          });
          return res.status(400).json({
            message: "Receiver wallet not found; reverted debit (fallback)",
          });
        }

        const txId = uuidv4();
        txDoc = await Transaction.create({
          txId,
          type: "TRANSFER",
          fromWallet: fromUpdated._id,
          toWallet: toUpdated._id,
          amount: amountPaise,
          status: "COMPLETED",
          createdAt: new Date(),
          completedAt: new Date(),
        });

        await Idempotency.create({
          key,
          user: userId,
          result: { message: "Transfer completed (fallback)", tx: txDoc },
        });
        return res
          .status(200)
          .json({ message: "Transfer successful (fallback)", tx: txDoc });
      }

      throw errInner;
    }
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: err.message || "Transfer failed" });
  }
};

// GET /api/wallet/transactions -> list transactions for user's wallet
export const listTransactions = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const { limit = 50 } = req.query;
    const txs = await Transaction.find({
      $or: [{ fromWallet: wallet._id }, { toWallet: wallet._id }],
    })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate({
        path: "fromWallet",
        populate: { path: "user", select: "name email _id" },
      })
      .populate({
        path: "toWallet",
        populate: { path: "user", select: "name email _id" },
      });

    const populatedTxs = await Promise.all(
      txs.map(async (tx) => {
        let fromUserName = null;
        let toUserName = null;

        if (tx.fromWallet?.user) {
          const u = await User.findById(tx.fromWallet.user);
          fromUserName = u?.name || "Unknown";
        }
        if (tx.toWallet?.user) {
          const u = await User.findById(tx.toWallet.user);
          toUserName = u?.name || "Unknown";
        }

        // Determine direction
        let direction = "RECEIVED";
        let counterpartyName = null;
        if (tx.type === "TOPUP") {
          direction = "Top-up";
        } else if (tx.fromWallet?._id.equals(wallet._id)) {
          direction = "SENT";
          counterpartyName = toUserName;
        } else {
          direction = "RECEIVED";
          counterpartyName = fromUserName;
        }

        return {
          _id: tx._id,
          type: tx.type,
          fromWallet: tx.fromWallet?._id,
          toWallet: tx.toWallet?._id,
          fromUserName,
          toUserName,
          counterpartyName,
          amount: tx.amount,
          status: tx.status,
          direction,
          createdAt: tx.createdAt,
        };
      })
    );

    console.log(
      `Transactions for user ${req.user.id} (wallet ${wallet._id}):`,
      txs
    );
    return res.json({ transactions: populatedTxs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
