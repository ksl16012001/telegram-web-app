const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Đăng nhập admin
router.post("/login", async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ success: false, message: "❌ Missing password" });
    }

    const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);
    if (!isValid) {
        return res.status(401).json({ success: false, message: "❌ Incorrect password" });
    }

    const token = jwt.sign({ role: "admin" }, process.env.SECRET_KEY, { expiresIn: "3h" });

    res.json({ success: true, token });
});

module.exports = router;
