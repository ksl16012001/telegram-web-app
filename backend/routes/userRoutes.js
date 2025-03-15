const express = require("express");
const User = require("../models/User");

const router = express.Router();

// 🌟 Thêm user vào database
router.get("/adduser", async (req, res) => {
    try {
        console.log("🔹 Incoming request:", req.query);
        const { id, username, name, phone, pic } = req.query;
        if (!id || !username || !name) {
            return res.status(400).json({ message: "❌ Missing required fields!" });
        }

        let user = await User.findOne({ id });
        if (!user) {
            user = new User({ id, username, name, phone: phone || "", pic });
            await user.save();
        }

        console.log("✅ User saved:", user);
        res.json({ message: "✅ User saved!", user });
    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ message: "❌ Server error", error });
    }
});

// 🌟 Lấy thông tin user
router.get("/getuser", async (req, res) => {
    try {
        console.log("🔹 Incoming request:", req.query);
        const { id } = req.query;
        if (!id) return res.status(400).json({ message: "❌ Missing user ID!" });

        let user = await User.findOne({ id });
        if (!user) return res.status(404).json({ message: "❌ User not found!" });

        console.log("✅ User found:", user);
        res.json({ message: "✅ User found!", user });
    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ message: "❌ Server error", error });
    }
});

// 🌟 Cập nhật số điện thoại
router.get("/updateuser", async (req, res) => {
    try {
        console.log("🔹 Incoming request:", req.query);
        const { id, phone } = req.query;
        if (!id || !phone) return res.status(400).json({ message: "❌ Missing id or phone!" });

        let user = await User.findOneAndUpdate({ id }, { phone }, { new: true });
        if (!user) return res.status(404).json({ message: "❌ User not found!" });

        console.log("✅ Phone updated:", user);
        res.json({ message: "✅ Phone updated!", user });
    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ message: "❌ Server error", error });
    }
});

module.exports = router;
