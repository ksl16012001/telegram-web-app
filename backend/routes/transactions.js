// backend/routes/transactions.js
import express from "express";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// 📌 Tạo giao dịch mới
router.post("/", async (req, res) => {
    try {
        const { userId, username, amount, stars } = req.body;
        const transaction = new Transaction({ userId, username, amount, stars });
        await transaction.save();
        res.status(201).json(transaction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 Lấy danh sách giao dịch
router.get("/", async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 Cập nhật trạng thái giao dịch
router.patch("/:id", async (req, res) => {
    try {
        const { status, txId } = req.body;
        const transaction = await Transaction.findByIdAndUpdate(req.params.id, { status, txId }, { new: true });
        res.json(transaction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
