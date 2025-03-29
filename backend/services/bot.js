require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const Order = require("../models/Order");
const { Telegraf } = require('telegraf');
// const BOT_TOKEN = process.env.BOT_TOKEN;
// const bot = new Telegraf(BOT_TOKEN);
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
//         if (ADMIN_CHAT_ID) {
//             bot.sendMessage(ADMIN_CHAT_ID,
//                 `📢 *New User Started the Bot*  
// 👤 *Name:* ${firstName}  
// 🔗 *Username:* ${username}  
// 🆔 *Chat ID:* \`${chatId}\``, { parse_mode: "Markdown" });
//         }
    }
});

bot.onText(/\/admin/, async (msg) => {
    const chatId = msg.chat.id.toString();
    if (chatId !== ADMIN_CHAT_ID) {
        return bot.sendMessage(chatId, "❌ You are not authorized to use this command.");
    }
    try {
        const adminDashboardUrl = `${process.env.WEB_APP_URL}/admin/dashboard.html`; // 🔹 Đổi thành URL trang admin
        bot.sendMessage(
            chatId,
            `🚀 *Admin Panel Access*\n\nClick the link below to access the admin dashboard:\n🔗 [Open Admin Panel](${adminDashboardUrl})`,
            {
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🟢 Open Dashboard", web_app: { url: adminDashboardUrl } }]
                    ]
                }
            }
        );
    } catch (error) {
        console.error("❌ Error sending admin link:", error);
        bot.sendMessage(chatId, "❌ Error accessing admin panel. Please try again later.");
    }
});
module.exports = { bot };
