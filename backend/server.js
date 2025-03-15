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
        // 🔹 Tạo đơn hàng với trạng thái `pending`
        const newOrder = new Order({
            username,
            packageAmount: amount,
            packagePrice: price,
            tonPriceInUsd: (price / tonAmount).toFixed(2), // Giá 1 TON
            tonAmount,
            paymentLink,
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newOrder.save(); // ✅ Lưu vào MongoDB

        res.status(200).json({ message: "✅ Order created successfully", orderId: newOrder._id });
    } catch (error) {
        console.error("❌ Error processing payment:", error);
        res.status(500).json({ error: error.message });
    }
});
async function autoUpdatePaidOrders() {
    console.log("🔄 Checking pending orders for payment...");

    const pendingOrders = await Order.find({ status: "pending" });

    for (const order of pendingOrders) {
        const result = await paymentService.checkTransactionStatus(order.paymentLink);
        if (result.success) {
            order.status = "paid";
            order.transactionId = result.transactionId;
            order.updatedAt = new Date();
            await order.save();
            console.log(`✅ Order ${order._id} marked as PAID`);

            // ✅ Gửi thông báo cho Admin
            await paymentService.notifyAdmin(order);
        }
    }
}

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
