const fetch = require("node-fetch");
const Order = require("../models/Order");

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // ID Telegram của Admin
const BOT_TOKEN = process.env.BOT_TOKEN; // Token bot Telegram
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

// ✅ Gửi thông báo khi đơn hàng đã thanh toán
async function notifyAdmin(order) {
    const message = `
📌 *New Paid Order*  
👤 *User:* @${order.username}  
⭐ *Stars:* ${order.packageAmount}  
💰 *Price:* $${order.packagePrice}  
🔗 *Payment Link:* [Click to Pay](${order.paymentLink})  
📅 *Paid At:* ${new Date().toLocaleString()}
`;

    const inlineKeyboard = {
        inline_keyboard: [
            [{ text: "✅ Mark as Completed", callback_data: `complete_${order._id}` }]
        ]
    };

    const payload = {
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
        reply_markup: JSON.stringify(inlineKeyboard)
    };

    try {
        await fetch(TELEGRAM_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        console.log("✅ Admin notified about PAID order");
    } catch (error) {
        console.error("❌ Failed to notify admin:", error);
    }
}

// ✅ Cập nhật trạng thái đơn hàng khi thanh toán thành công
async function updateOrderStatus(transactionId, orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("❌ Order not found");

    order.transactionId = transactionId;
    order.status = "paid";
    await order.save();

    // 🔹 Gửi thông báo cho Admin khi đơn được cập nhật thành "paid"
    await notifyAdmin(order);

    return { success: true, message: "✅ Order updated to PAID", order };
}

module.exports = { updateOrderStatus };
