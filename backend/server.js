require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("./config/db"); // ✅ Import file kết nối MongoDB
const userRoutes = require("./routes/userRoutes"); // ✅ Import API của User
const { bot } = require("./services/bot"); // ✅ Import bot.js để dùng Webhook

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ✅ Debug CORS headers
app.use((req, res, next) => {
    console.log("🔹 CORS Headers:", res.getHeaders());
    next();
});

// ✅ Sử dụng các routes API
app.use("/api", userRoutes);

// ✅ Webhook Telegram
app.post("/webhook", (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// ✅ Kiểm tra server
app.get("/", (req, res) => {
    res.send("✅ Server is running with Webhook enabled!");
});

// ✅ Chạy server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
