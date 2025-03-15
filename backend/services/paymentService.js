const Order = require("../models/Order");
const fetch = require("node-fetch");
// ✅ Xử lý thanh toán & lưu đơn hàng ngay lập tức với trạng thái `pending`

const TON_API_URL = "https://tonapi.io/v3/blockchain/getTransactions";
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
async function checkTransaction(orderId, expectedTonAmount) {
    try {
        // 📌 Lấy đơn hàng từ DB
        const order = await Order.findById(orderId);
        if (!order) return { success: false, message: "Order not found" };

        // 📌 Gọi API lấy danh sách giao dịch
        const url = `${TON_API_URL}?account=${process.env.TON_RECEIVER}&limit=10`;  
        const response = await fetch(url);
        const data = await response.json();

        // 📌 Tìm giao dịch khớp `orderId` & `amount`
        const transaction = data.result.find(tx =>
            tx.in_msg?.msg_data?.body.includes(`Order_${orderId}`) && 
            parseFloat(tx.in_msg.value) / 1e9 === parseFloat(expectedTonAmount)
        );

        if (transaction) {
            // ✅ Cập nhật trạng thái đơn hàng
            order.status = "paid";
            order.transactionId = transaction.transaction_id.hash;
            order.updatedAt = new Date();
            await order.save();

            console.log(`✅ Order ${order._id} marked as PAID`);

            return { success: true, transactionId: transaction.transaction_id.hash };
        } else {
            return { success: false, message: "Transaction not found or incorrect amount" };
        }
    } catch (error) {
        console.error("❌ Error checking transaction:", error);
        return { success: false, message: "Error fetching transaction data" };
    }
}


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
async function autoUpdatePaidOrders() {
    console.log("🔄 Checking pending orders...");

    const pendingOrders = await Order.find({ status: "pending" });

    for (const order of pendingOrders) {
        const result = await checkTransaction(order._id, order.tonAmount);
        if (result.success) {
            console.log(`✅ Order ${order._id} updated to PAID`);
        }
    }
}

// ✅ Kiểm tra mỗi 5 phút
setInterval(autoUpdatePaidOrders, 300000);
// ✅ Export tất cả các hàm (bao gồm `fetchTonPrice`)
module.exports = { fetchTonPrice, processPayment, checkTransaction };
