require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("./config/db"); // ✅ Kết nối MongoDB
const userRoutes = require("./routes/userRoutes"); // ✅ API User
const { bot } = require("./services/bot"); // ✅ Telegram Bot
const paymentService = require("./services/paymentService"); // ✅ Xử lý thanh toán

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Cấu hình CORS
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

// ✅ Sử dụng API User
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

// ✅ API lấy giá TON/USD từ Backend
app.get("/api/get-ton-price", async (req, res) => {
    try {
        const tonPrice = await paymentService.fetchTonPrice();
        if (!tonPrice) return res.status(500).json({ error: "Failed to fetch TON price" });

        res.json({ tonPrice });
    } catch (error) {
        console.error("❌ Error fetching TON price:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ✅ Xử lý giao dịch mua sao
app.post("/api/process-payment", async (req, res) => {
    const { amount, username, price, tonAmount, paymentLink } = req.body;

    if (!amount || !username || !price || !tonAmount || !paymentLink) {
        return res.status(400).json({ error: "❌ Missing required fields" });
    }

    try {
        await paymentService.processPayment(amount, username, price, tonAmount, paymentLink);
        res.sendStatus(200); // ✅ Chỉ trả về 200, không gửi JSON về frontend
    } catch (error) {
        console.error("❌ Error processing payment:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Kiểm tra trạng thái giao dịch
app.post("/api/check-transaction", async (req, res) => {
    const { address, transactionId } = req.body;

    try {
        const result = await paymentService.checkTransactionStatus(address, transactionId);
        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error checking transaction:", error);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Khởi chạy server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
