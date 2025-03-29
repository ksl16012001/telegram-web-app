const Order = require("../models/Order");
const fetch = require("node-fetch");
async function processPayment(amount, username) {
    if (!amount || !username) {
        throw new Error("❌ Amount and username are required");
    }
    const selectedPackage = { amount, price: (amount / 100) * 1.7 }; // 🔹 Giá theo gói
    const order = new Order({
        username: username,
        packageAmount: selectedPackage.amount,
        packagePrice: selectedPackage.price,
        status: "pending", // 🔹 Chưa thanh toán
        paymentLink: generatePaymentLink(username, selectedPackage.price),
        createdAt: new Date()
    });

    await order.save(); // ✅ Lưu đơn hàng vào MongoDB ngay lập tức
    console.log(`✅ New order created (PENDING): ${order._id}`);

    return { orderId: order._id, paymentLink: order.paymentLink };
}

async function checkTransactionStatus(transactionId) {
    const order = await Order.findOne({ transactionId });

    if (!order) {
        return { success: false, message: "❌ Order not found" };
    }

    if (order.status === "paid") {
        return { success: true, message: "✅ Order already paid" };
    }

    // 📌 Giả lập kiểm tra trạng thái từ blockchain (Cập nhật theo API thật)
    const isPaid = true; // 🔹 Giả định giao dịch thành công
    if (isPaid) {
        order.status = "paid";
        order.updatedAt = new Date();
        await order.save(); // ✅ Cập nhật trạng thái đơn hàng
        return { success: true, message: "✅ Payment confirmed", order };
    }
    return { success: false, message: "❌ Payment not found" };
}


// ✅ Export tất cả các hàm (bao gồm `fetchTonPrice`)
module.exports = {  processPayment, checkTransactionStatus };
