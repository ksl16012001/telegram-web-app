require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const Order = require("../models/Order");

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;
const WEB_APP_URL = process.env.WEB_APP_URL;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME;

const bot = new TelegramBot(BOT_TOKEN);
bot.setWebHook(TELEGRAM_WEBHOOK_URL);

console.log(`🤖 Telegram Bot is running via Webhook at ${TELEGRAM_WEBHOOK_URL}`);

// ✅ Xử lý lệnh `/start`
bot.on("message", async (msg) => {
    const chatId = msg.chat.id.toString();
    const firstName = msg.chat.first_name || "User";
    const lastName = msg.chat.last_name || "User";
    const username = msg.chat.username ? `@${msg.chat.username}` : "No username";
    const text = msg.text;

    console.log(`📩 Received message from ${chatId}: ${text}`);

    if (text === "/start") {
        // ✅ Gửi tin nhắn chào mừng
        bot.sendMessage(chatId, 
        `👋 *Welcome, ${firstName} ${lastName}!* 🚀  

📌 *This is our official Telegram MiniApp!*  
🔹 Manage your profile  
🔹 Check your wallet  
🔹 Stay updated with the latest news  

📢 *Join our community for exclusive updates:*  
👉 [Join our Channel](https://t.me/${CHANNEL_USERNAME})  

Click the button below to start exploring!`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🟢 Open MiniApp", web_app: { url: WEB_APP_URL } }],
                    [{ text: "📢 Join Channel", url: `https://t.me/${CHANNEL_USERNAME}` }]
                ]
            }
        });

        // ✅ Gửi thông báo đến Admin
        if (ADMIN_CHAT_ID) {
            bot.sendMessage(ADMIN_CHAT_ID, 
            `📢 *New User Started the Bot*  
👤 *Name:* ${firstName}  
🔗 *Username:* ${username}  
🆔 *Chat ID:* \`${chatId}\``, { parse_mode: "Markdown" });
        }
    }
});

// ✅ Xử lý lệnh `/admin` (Chỉ Admin mới dùng được)
bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id.toString();

    // 🔹 Kiểm tra nếu user không phải admin
    if (chatId !== ADMIN_CHAT_ID) {
        return bot.sendMessage(chatId, "❌ You are not authorized to use this command.");
    }

    try {
        // 🔹 Lấy 10 đơn hàng mới nhất từ MongoDB
        const orders = await Order.find().sort({ createdAt: -1 }).limit(10);

        if (orders.length === 0) {
            return bot.sendMessage(chatId, "📭 No pending orders.");
        }

        let message = "📌 *Latest Orders:*\n\n";

        orders.forEach(order => {
            message += `🆔 Order ID: \`${order._id}\`\n`;
            message += `👤 User: *${order.username}*\n`;
            message += `⭐ Stars: *${order.packageAmount}*\n`;
            message += `💰 Price: *$${order.packagePrice}*\n`;
            message += `🕒 Status: *${order.status.toUpperCase()}*\n`;
            if (order.paymentLink) message += `🔗 [Payment Link](${order.paymentLink})\n\n`;
        });

        bot.sendMessage(chatId, message, { parse_mode: "Markdown", disable_web_page_preview: true });
    } catch (error) {
        console.error("❌ Error fetching orders:", error);
        bot.sendMessage(chatId, "❌ Error fetching orders. Please try again later.");
    }
});

module.exports = { bot };
