require("dotenv").config();
const path = require("path"); 
const express = require("express");
const Order = require("./models/Order");
const cors = require("cors");
const mongoose = require("./config/db"); 
const userRoutes = require("./routes/userRoutes");
const { bot } = require("./services/bot"); 
const paymentService = require("./services/paymentService"); 
const User = require("./models/User");
const app = express();
const axios = require("axios");
const PORT = process.env.PORT || 3000;
const adminRoutes = require("./routes/adminRoutes");
const TelegramBot = require("node-telegram-bot-api");
// const { Telegraf } = require("telegraf");

app.use("/api/admin", adminRoutes);
app.use("/api", userRoutes);
app.use(express.json());
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));
app.use((req, res, next) => {
    console.log("🔹 CORS Headers:", res.getHeaders());
    next();
});
app.post("/webhook", (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});
app.get("/admin/dashboard", (req, res) => {
    res.sendFile(path.join(frontendPath, "admin", "dashboard.html"));
});
app.use(express.static(path.join(__dirname, "../frontend/src"))); 
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/src/index.html"));
});
app.get("/:page", (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, "../frontend/src", `${page}.html`);
    res.sendFile(filePath, err => {
        if (err) res.status(404).send("❌ Page not found");
    });
});
app.get("/api/get-ton-receiver", (req, res) => {
    const TON_RECEIVER = process.env.TON_RECEIVER;
    console.log("TON_RECEIVER:", process.env.TON_RECEIVER);
    if (!TON_RECEIVER) {
        return res.status(500).json({ success: false, error: "TON_RECEIVER not set in .env" });
    }
    res.json({ success: true, TON_RECEIVER });
});
app.get("/api/process-payment", async (req, res) => {
    try {
        const { userId, amount, username, price, tonAmount, paymentLink, orderId, service } = req.query;
        if (!userId || !amount || !username || !price || !tonAmount || !paymentLink || !orderId || !service) {
            return res.status(400).json({ error: "❌ Missing required parameters" });
        }
        console.log("📌 Received payment request:", { orderId, userId, username, service });
        const order = new Order({
            orderId,
            userId,
            username,
            service,
            packageAmount: Number(amount),
            packagePrice: Number(price),
            tonAmount: Number(tonAmount),
            paymentLink,
            status: "pending",
        });

        await order.save();
        console.log(`✅ New order created (PENDING): ${orderId}`);
        trackPayment(orderId, tonAmount);
        res.status(200).json({
            message: "✅ Order created successfully",
            orderId,
            paymentLink,
        });
    } catch (error) {
        console.error("❌ Error processing payment:", error);
        res.status(500).json({ error: "❌ Internal Server Error", details: error.message });
    }
});
async function checkTransaction(orderId, expectedTonAmount) {
    try {
        const order = await Order.findOne({ orderId });
        if (!order) return { success: false, message: "❌ Order not found" };
        const now = new Date();
        const orderTime = new Date(order.createdAt);
        const diffMinutes = Math.floor((now - orderTime) / (1000 * 60));
        if (diffMinutes > 4 && order.status === "pending") {
            order.status = "canceled";
            order.updatedAt = now;
            await order.save();
            console.log(`❌ Order ${order.orderId} auto-canceled after 5 minutes`);
            return { success: false, message: "❌ Order expired and was canceled" };
        }
        const tonAddress = process.env.TON_RECEIVER;
        const url = `https://toncenter.com/api/v2/getTransactions?address=${tonAddress}&limit=100`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data || !data.result || !Array.isArray(data.result)) {
            console.error("❌ Invalid response from TON API:", data);
            return { success: false, message: "❌ Error fetching transaction data" };
        }
        const transaction = data.result.find(tx =>
            tx.in_msg?.message?.includes(orderId) &&
            Number(tx.in_msg.value) >= Math.round(expectedTonAmount * 1e9)
        );
        if (transaction) {
            order.status = "paid";
            order.transactionId = transaction.transaction_id.hash;
            order.updatedAt = now;
            await order.save();
            notifyAdmin(order)
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
async function trackPayment(orderId, tonAmount) {
    console.log(`🔄 Tracking order ${orderId} for 5 minutes...`);
    for (let i = 0; i < 10; i++) { // Lặp lại tối đa 10 lần (mỗi 30s)
        const result = await checkTransaction(orderId, tonAmount);
        if (result.success) {
            console.log(`✅ Payment detected for order ${orderId}. Stopping tracking.`);
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 30000)); // 🔄 Chờ 30 giây trước khi kiểm tra lại
    }
    console.log(`❌ Order ${orderId} was not paid within 5 minutes. Marking as expired.`);
}
async function notifyAdmin(order, isCompleted = false) {
    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const APP_URL = process.env.WEB_APP_URL;
    if (!ADMIN_CHAT_ID || !BOT_TOKEN) {
        console.error("❌ Missing Admin Chat ID or Bot Token!");
        return;
    }
    const recipient = await getRecipient(order.username);
    if (!recipient) {
        console.error(`❌ Cannot find recipient for username: ${order.username}`);
        return;
    }
    const statusText = isCompleted ? "✅ COMPLETED" : "✅ PAID";
    const message = `
📢 *Order Update*
From (ID: ${order.userId})
🆔 Order ID: \`${order.orderId}\`
👤 To User: ${order.username}
💰 Amount: ${order.packageAmount} ${order.service === "Buy Star" ? "Stars" : "Months"}
💵 Price: $${order.packagePrice}
💎 TON Amount: ${order.tonAmount} TON
${statusText}
`;
    const inline_keyboard = isCompleted
        ? [] 
        : [
            [{ text: "Check", url: `https://tonscan.org/tx/${order.transactionId}` }],
            [{ text: "✅ Mark Completed", callback_data: JSON.stringify({ action: "complete", orderId: order.orderId }) }],
            [{ 
                text: "Go to Fragment", 
                url: `https://fragment.com/stars/buy?recipient=${encodeURIComponent(recipient)}&quantity=${encodeURIComponent(order.packageAmount)}`
            }]
        ];
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: ADMIN_CHAT_ID,
            text: message,
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard }
        });
        console.log(`✅ Admin notified: Order ${order.orderId} - ${statusText}`);
    } catch (error) {
        console.error("❌ Error sending notification to Admin:", error.response?.data || error.message);
    }
}
app.post("/api/cancel-order", async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: "Missing orderId" });
        }
        console.log(`📌 Attempting to cancel order: ${orderId}`);
        const order = await Order.findOne({ orderId });
        if (!order) {
            console.log(`❌ Order not found: ${orderId}`);
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.status === "paid") {
            console.log(`⚠️ Cannot cancel a paid order: ${orderId}`);
            return res.status(400).json({ success: false, message: "Cannot cancel a paid order" });
        }
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
bot.on("callback_query", async (query) => {
    try {
        const data = JSON.parse(query.data);

        if (data.action === "complete") {
            const orderId = data.orderId;
            console.log(`🔹 Completing order: ${orderId}`);
            url=process.env.WEB_APP_URL;
            const response = await axios.post(`${url}/api/complete-order`, { orderId });
            if (response.data.success) {
                await bot.answerCallbackQuery(query.id, {
                    text: "✅ Order marked as completed!",
                    show_alert: true
                });
                await bot.editMessageText(
                    `✅ Order *${orderId}* has been marked as *COMPLETED*! 🎉`,
                    {
                        chat_id: query.message.chat.id,
                        message_id: query.message.message_id,
                        parse_mode: "Markdown"
                    }
                );
            } else {
                throw new Error(response.data.message);
            }
        }
    } catch (error) {
        console.error("❌ Error:", error);
        await bot.answerCallbackQuery(query.id, {
            text: "❌ Error completing order!",
            show_alert: true
        });
    }
});
app.post("/api/admin/complete-order", async (req, res) => {
    try {
        const { orderId } = req.query; 
        if (!orderId) {
            return res.status(400).json({ success: false, message: "Missing orderId" });
        }
        console.log(`📌 Attempting to complete order: ${orderId}`);
        const order = await Order.findOne({ orderId });
        if (!order) {
            console.log(`❌ Order not found: ${orderId}`);
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.status === "pending" || order.status === "canceled") {
            console.log(`⚠️ Cannot complete this order: ${orderId}`);
            return res.status(400).json({ success: false, message: "Cannot complete this order" });
        }
        order.status = "complete";
        order.updatedAt = new Date();
        await order.save();
        console.log(`✅ Order ${orderId} has been completed`);
        return res.status(200).json({ success: true, message: "Order completed successfully" });
    } catch (error) {
        console.error("❌ Error completing order:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
app.post("/api/complete-order", async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: "Missing orderId" });
        }
        console.log(`📌 Attempting to cancel order: ${orderId}`);
        const order = await Order.findOne({ orderId });
        if (!order) {
            console.log(`❌ Order not found: ${orderId}`);
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.status === "pending" && order.status === "canceled") {
            console.log(`⚠️ Cannot complete this order: ${orderId}`);
            return res.status(400).json({ success: false, message: "Cannot cancel" });
        }
        order.status = "complete";
        order.updatedAt = new Date();
        await order.save();
        console.log(`✅ Order ${orderId} has been canceled`);
        return res.status(200).json({ success: true, message: "Order canceled successfully" });
    } catch (error) {
        console.error("❌ Error canceling order:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
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
app.post("/api/complete-order", async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }
        console.log(`✅ Order ${orderId} marked as completed`);
        await db.updateOrderStatus(orderId, "completed");

        res.json({ success: true, message: "Order marked as completed." });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
async function getRecipient(username) {
    const headers = {
        'Content-Length': '57',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Sec-Ch-Ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Sec-Ch-Ua-Mobile': '?0',
        'Origin': 'https://fragment.com',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': 'https://fragment.com/stars/buy?quantity=100',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'vi,fr-FR;q=0.9,fr;q=0.8,en-US;q=0.7,en;q=0.6,zh-TW;q=0.5,zh;q=0.4',
        'Priority': 'u=1, i',
        'Cookie': 'stel_ssid=5ac98476080a251d19_5036652558238127629; stel_dt=-420; stel_token=050eb84032063dce62c146a8a9496a63050eb85a050eb68b5a8d4ad9404b60900ec86; stel_ton_token=f0eB8_DfJStfHXF1N5iyx0LMBDUwix25jfg-3Jo5a-AWGnQxuyFwKF56CJLz84I7eTEddyhikJIofDSoclWtPTweMkfVGveaab4KkbqzSstnCaOTbFFCqfG-nJZFaBnq57xpZPyWlXzQAUqmjFLaTZVVh9A0NNxi5-hpMjrH1oSJn0zbQ9bxMKw6A_UnZzVQlehLhruw'
    };
    const payload = new URLSearchParams();
    payload.append('query', username); // Sử dụng username làm giá trị cho query
    payload.append('quantity', '100');
    payload.append('method', 'searchStarsRecipient');
    try {
        const response = await fetch('https://fragment.com/api?hash=e006bcba00888acbf2', {
            method: 'POST',
            headers: headers,
            body: payload.toString()
        });

        if (response.ok) {
            const data = await response.json(); // Giải mã phản hồi JSON
            if (data.ok) {
                const recipient = data.found ? data.found.recipient : null;
                return recipient ? recipient : 'Không tìm thấy recipient cho username này.';
            } else {
                return 'Không tìm thấy recipient cho username này.';
            }
        } else {
            return `Lỗi khi gửi yêu cầu. Mã lỗi: ${response.status}`;
        }
    } catch (error) {
        return `Lỗi khi gửi yêu cầu: ${error.message}`;
    }
}
app.get("/api/admin-chat-id", (req, res) => {
    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (!adminChatId) {
        return res.status(500).json({ error: "Admin Chat ID not set" });
    }
    res.json({ adminChatId });
});
app.get('/api/get-recipient', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Username not found.' });
    }

    try {
        const recipient = await getRecipient(username);
        res.json({ recipient });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
const botToken = process.env.BOT_TOKEN;
const botStar = new TelegramBot(botToken);
app.post("/api/create-invoice", async (req, res) => {
    try {
        const { userId, amount } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid userId or amount",
            });
        }

        const priceInNano = Math.round(amount * 1000000); // 1 Star = 1,000,000 nano units

        // Tạo payload cho hóa đơn
        const invoicePayload = {
            chat_id: userId,
            title: "Swap Stars",
            description: `Swap ${amount} Stars to your account`,
            payload: `swap_${userId}_${Date.now()}`, // Payload duy nhất để theo dõi
            provider_token: "", // Để trống cho Telegram Stars
            currency: "XTR", // Telegram Stars (XTR) là đơn vị tiền tệ
            prices: [{ label: "Stars", amount: priceInNano }],
        };

        // Gửi hóa đơn qua Telegram Bot API
        const invoice = await botStar.createInvoiceLink(invoicePayload);

        // Trả về link hóa đơn
        res.json({
            success: true,
            invoice: { link: invoice },
        });
    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create invoice",
        });
    }
});

// Khởi động server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});