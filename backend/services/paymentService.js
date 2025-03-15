const Order = require("../models/Order");
const fetch = require("node-fetch");
// ✅ Xử lý thanh toán & lưu đơn hàng ngay lập tức với trạng thái `pending`

async function processPayment(amount, username) {
    if (!amount || !username) {
        throw new Error("❌ Amount and username are required");
    }

    const selectedPackage = { amount, price: (amount / 100) * 1.7 }; // 🔹 Giá theo gói

    // 📌 Tạo đơn hàng mới trong DB với trạng thái `pending`
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

// ✅ Cập nhật trạng thái đơn hàng thành `paid` sau khi kiểm tra giao dịch
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
