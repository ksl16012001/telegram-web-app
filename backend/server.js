require("dotenv").config();
const path = require("path"); 
const express = require("express");
const Order = require("./models/Order");
const cors = require("cors");
const mongoose = require("./config/db"); // ✅ Kết nối MongoDB
const userRoutes = require("./routes/userRoutes"); // ✅ API User
const { bot } = require("./services/bot"); // ✅ Telegram Bot
const paymentService = require("./services/paymentService"); // ✅ Xử lý thanh toán
const User = require("./models/User"); // Đảm bảo đường dẫn đúng
const app = express();
const PORT = process.env.PORT || 3000;
async function fetchTonPrice() {
    try {
        const response = await fetch('https://tonapi.io/v2/rates?tokens=ton&currencies=usd');
        const data = await response.json();
        return data.rates.TON.prices.USD; // ✅ Lấy tỷ giá USD/TON
    } catch (error) {
        console.error('❌ Error fetching TON price:', error);
        return null;
    }
}

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
app.use(express.static(path.join(__dirname, "../frontend/src"))); 

// ✅ Render `index.html` khi truy cập `/`
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/src/index.html"));
});

// ✅ Render các trang khác (VD: `/buypre` ➝ `buypre.html`)
app.get("/:page", (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, "../frontend/src", `${page}.html`);
    res.sendFile(filePath, err => {
        if (err) res.status(404).send("❌ Page not found");
    });
});
// ✅ API lấy giá TON/USD từ Backend


// ✅ Xử lý giao dịch mua sao
app.get("/api/process-payment", async (req, res) => {
    try {
        const { userId, amount, username, price, tonAmount, paymentLink, orderId, service } = req.query;

        if (!userId || !amount || !username || !price || !tonAmount || !paymentLink || !orderId || !service) {
            return res.status(400).json({ error: "❌ Missing required parameters" });
        }

        console.log("📌 Received payment request:", { orderId, userId, username, service });

        const tonPriceInUsd = await fetchTonPrice();
        if (!tonPriceInUsd) {
            return res.status(500).json({ error: "❌ Failed to fetch TON price" });
        }

        // 📌 Kiểm tra userId có tồn tại không
        const userExists = await User.findOne({ id: userId });
        if (!userExists) {
            return res.status(404).json({ error: "❌ User not found" });
        }

        // 📌 Lưu đơn hàng vào MongoDB
        const order = new Order({
            orderId,
            userId,
            username,
            service, // 🔹 Thêm loại dịch vụ
            packageAmount: Number(amount),
            packagePrice: Number(price),
            tonPriceInUsd,
            tonAmount: Number(tonAmount),
            paymentLink,
            status: "pending",
            createdAt: new Date()
        });

        await order.save();
        console.log(`✅ New order created (PENDING): ${orderId}`);

        res.status(200).json({
            message: "✅ Order created successfully",
            orderId,
            paymentLink
        });
    } catch (error) {
        console.error("❌ Error processing payment:", error);
        res.status(500).json({ error: "❌ Internal Server Error", details: error.message });
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
const TON_API_URL = "https://toncenter.com/api/v2/getTransactions?"
async function checkTransaction(orderId, expectedTonAmount) {
    try {
        // 📌 Lấy đơn hàng từ DB
        const order = await Order.findOne({ orderId });
        if (!order) return { success: false, message: "❌ Order not found" };

        // 🔹 Kiểm tra nếu `service` không hợp lệ
        const validServices = ["Buy Star", "Buy Premium"];
        if (!validServices.includes(order.service)) {
            console.error(`❌ Invalid service: ${order.service}`);
            return { success: false, message: `Invalid service: ${order.service}` };
        }

        // 🔹 Kiểm tra nếu đơn hàng quá 30 phút
        const now = new Date();
        const orderTime = new Date(order.createdAt);
        const diffMinutes = Math.floor((now - orderTime) / (1000 * 60)); // Tính phút
        if (diffMinutes > 30 && order.status === "pending") {
            order.status = "canceled";
            order.updatedAt = now;
            await order.save();
            console.log(`❌ Order ${order.orderId} auto-canceled after 30 minutes`);
            return { success: false, message: "❌ Order expired and was canceled" };
        }

        // 📌 Gọi API lấy danh sách giao dịch
        const url = `https://toncenter.com/api/v2/getTransactions?address=UQCXXeVeKrgfsPdwczOkxn9a1oItWNu-RB_vXS8hP_9jCEJ0&limit=100`;
        const response = await fetch(url);
        const data = await response.json();

        // 🔹 Kiểm tra nếu API trả về lỗi
        if (!data || !data.result || !Array.isArray(data.result)) {
            console.error("❌ Invalid response from TON API:", data);
            return { success: false, message: "❌ Error fetching transaction data" };
        }

        // 📌 Tìm giao dịch khớp orderId trong message & amount
        const transaction = data.result.find(tx =>
            tx.in_msg?.message?.includes(orderId)  // Kiểm tra số tiền
        );

        if (transaction) {
            // ✅ Cập nhật trạng thái đơn hàng
            order.status = "paid";
            order.transactionId = transaction.transaction_id.hash;
            order.updatedAt = now;
            await order.save();

            console.log(`✅ Order ${order.orderId} marked as PAID`);
            return { success: true, transactionId: transaction.transaction_id.hash };
        } else {
            return { success: false, message: "⚠️ Transaction not found or incorrect amount" };
        }
    } catch (error) {
        console.error("❌ Error checking transaction:", error);
        return { success: false, message: "❌ Error fetching transaction data" };
    }
}

app.post("/api/cancel-order", async (req, res) => {
    try {
        const { orderId } = req.body;

        // 🔹 Kiểm tra nếu `orderId` không tồn tại
        if (!orderId) {
            return res.status(400).json({ success: false, message: "Missing orderId" });
        }

        console.log(`📌 Attempting to cancel order: ${orderId}`);

        // 🔹 Tìm đơn hàng theo `orderId`
        const order = await Order.findOne({ orderId });

        if (!order) {
            console.log(`❌ Order not found: ${orderId}`);
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // 🔹 Kiểm tra nếu đơn hàng đã được thanh toán
        if (order.status === "paid") {
            console.log(`⚠️ Cannot cancel a paid order: ${orderId}`);
            return res.status(400).json({ success: false, message: "Cannot cancel a paid order" });
        }

        // 🔹 Cập nhật trạng thái đơn hàng thành "canceled"
        order.status = "canceled";
        order.updatedAt = new Date();
        await order.save();

        console.log(`✅ Order ${orderId} has been canceled`);

        return res.status(200).json({ success: true, message: "Order canceled successfully" });
    } catch (error) {
        console.error("❌ Error canceling order:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});


// ✅ Kiểm tra trạng thái giao dịch
app.post("/api/check-transaction", async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({ success: false, message: "❌ Missing orderId" });
    }

    try {
        console.log(`📌 Checking transaction for Order ID: ${orderId}`);

        const result = await checkTransaction(orderId);

        console.log(`✅ Transaction check result:`, result);

        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error checking transaction:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});
app.get("/api/user-orders/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // 📌 Tìm đơn hàng theo userId
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });

        if (!orders.length) {
            return res.status(404).json({ success: false, message: "No orders found" });
        }

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("❌ Error fetching user orders:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

async function autoCheckPendingOrders() {
    console.log("🔄 Checking all pending orders...");

    try {
        const pendingOrders = await Order.find({ status: "pending" });

        if (pendingOrders.length === 0) {
            console.log("✅ No pending orders found.");
            return;
        }

        console.log(`📌 Found ${pendingOrders.length} pending orders. Checking transactions...`);

        for (const order of pendingOrders) {
            try {
                const result = await checkTransaction(order.orderId, order.tonAmount);

                if (result.success) {
                    console.log(`✅ Order ${order.orderId} is now PAID.`);
                } else {
                    console.log(`⚠️ Order ${order.orderId}: ${result.message}`);
                }
            } catch (error) {
                console.error(`❌ Error processing order ${order.orderId}:`, error);
            }
        }
    } catch (error) {
        console.error("❌ Error checking pending orders:", error);
    }
}

// ✅ Thiết lập kiểm tra tự động mỗi 5 phút (300000ms)
setInterval(autoCheckPendingOrders, 3000); // Chạy mỗi 5 phút

// ✅ Khởi chạy server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
