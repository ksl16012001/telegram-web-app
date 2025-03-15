require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("./config/db"); // ✅ Import file kết nối MongoDB
const userRoutes = require("./routes/userRoutes"); // ✅ Import API của User
const { bot } = require("./services/bot"); // ✅ Import bot.js để dùng Webhook
const paymentService = require("./services/paymentService"); // ✅ Import service thanh toán

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

// ✅ Endpoint xử lý giao dịch mua sao
app.post("/process-payment", async (req, res) => {
    const { amount, username } = req.body;

    try {
        const result = await paymentService.processPayment(amount, username);
        return res.status(200).json({
            message: "Transaction processed successfully",
            paymentLink: result.paymentLink,
            amount: result.amount,
            price: result.price,
            orderId: result.orderId  // trả về ID đơn hàng
        });
    } catch (error) {
        console.error("Error processing payment:", error);
        return res.status(500).json({ error: error.message });
    }
});

// ✅ Endpoint kiểm tra trạng thái giao dịch
app.post("/check-transaction", async (req, res) => {
    const { address, transactionId } = req.body;

    try {
        const result = await paymentService.checkTransactionStatus(address, transactionId);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error checking transaction:", error);
        return res.status(500).json({ error: error.message });
    }
});

// ✅ Chạy server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
