require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN);
bot.setWebHook(process.env.TELEGRAM_WEBHOOK_URL);

console.log(`🤖 Telegram Bot is running via Webhook at ${process.env.TELEGRAM_WEBHOOK_URL}`);

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    console.log(`📩 Received message from ${chatId}: ${text}`);

    if (text === "/start") {
        bot.sendMessage(chatId, "🚀 Chào mừng bạn đến với MiniApp! Nhấn nút bên dưới để mở ứng dụng.", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🟢 Mở MiniApp", web_app: { url: process.env.WEB_APP_URL } }]
                ]
            }
        });
    } else {
        // bot.sendMessage(chatId, `📌 Bạn đã gửi: ${text}`);
    }
});

module.exports = { bot };
