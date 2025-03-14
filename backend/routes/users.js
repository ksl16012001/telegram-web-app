// backend/routes/users.js
import express from "express";
import User from "../models/User.js";

const router = express.Router();

// 📌 Lưu thông tin người dùng
router.post("/", async (req, res) => {
    try {
        const { telegramId, username, phone } = req.body;
        let user = await User.findOne({ telegramId });

        if (!user) {
            user = new User({ telegramId, username, phone });
            await user.save();
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 Lấy thông tin người dùng
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.params.id });
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
