require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

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
    const chatId = msg.chat.id;
    const firstName = msg.chat.first_name || "User";
    const username = msg.chat.username ? `@${msg.chat.username}` : "No username";
    const text = msg.text;

    console.log(`📩 Received message from ${chatId}: ${text}`);

    if (text === "/start") {
        // ✅ Gửi tin nhắn chào mừng
        bot.sendMessage(chatId, 
        `👋 *Welcome, ${firstName}!* 🚀  

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
    } else {
        // bot.sendMessage(chatId, `📌 *You sent:* \`${text}\``, { parse_mode: "Markdown" });
    }
});

module.exports = { bot };
