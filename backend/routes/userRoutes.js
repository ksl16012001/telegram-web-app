const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 🛠 Thêm người dùng (Không mã hóa)
router.post("/add", async (req, res) => {
    try {
        const { telegramId, username, name, phone, pic } = req.body;
        const existingUser = await User.findOne({ telegramId });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const newUser = new User({ telegramId, username, name, phone, pic });
        await newUser.save();

        res.json({ message: "User added successfully", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Error adding user", error });
    }
});

// 🔍 Lấy thông tin user
router.get("/:telegramId", async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.params.telegramId });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving user", error });
    }
});

module.exports = router;
