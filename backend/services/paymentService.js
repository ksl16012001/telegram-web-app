require("dotenv").config();
const fetch = require("node-fetch");
const Order = require("../models/Order");

const TONAPI_URL = "https://tonapi.io/v2/rates?tokens=ton&currencies=usd";

// ✅ Lấy tỷ giá TON/USD
async function fetchTonPrice() {
    try {
        console.log("🔄 Fetching TON price from `tonapi.io`...");
        const response = await fetch(TONAPI_URL);
        if (!response.ok) throw new Error(`TONAPI.io failed: ${response.status}`);

        const data = await response.json();
        console.log("📌 API Response:", data);

        const tonPrice = data.rates?.TON?.prices?.USD;
        if (!tonPrice) throw new Error("Invalid response structure from TONAPI.io");

        return tonPrice;
    } catch (error) {
        console.error("❌ Error fetching TON price:", error);
        return null;
    }
}

// ✅ Kiểm tra trạng thái giao dịch
async function checkTransactionStatus(address, transactionId) {
    try {
        const response = await fetch(`https://tonapi.io/v2/blockchain/getTransactions?account=${address}&limit=10`);
        const data = await response.json();

        const transactions = data.transactions || [];
        const transaction = transactions.find(tx => tx.transaction_id.hash === transactionId);

        if (transaction) {
            return { success: true, status: "Transaction found and completed." };
        } else {
            return { success: false, status: "Transaction not found or not completed yet." };
        }
    } catch (error) {
        console.error("❌ Error checking transaction status:", error);
        return { success: false, status: "Error checking transaction status." };
    }
}

// ✅ Xử lý thanh toán và tạo đơn hàng
async function processPayment(amount, username) {
    if (!amount || !username) {
        throw new Error("❌ Amount and username are required");
    }

    // 📌 Gói sao được chọn (Chỉnh sửa theo nhu cầu)
    const selectedPackage = { amount, price: (amount / 100) * 1.7 }; // Giá linh động theo số sao

    // 📌 Lấy tỷ giá TON/USD
    const tonPriceInUsd = await fetchTonPrice();
    if (!tonPriceInUsd) {
        throw new Error("❌ Failed to fetch TON price");
    }

    // 📌 Chuyển đổi giá sang TON
    const tonPrice = (selectedPackage.price / tonPriceInUsd + 0.01).toFixed(2); // Convert USD to TON
    const paymentLink = generatePaymentLink(username, tonPrice);

    // 📌 Lưu đơn hàng vào MongoDB
    const order = new Order({
        username: username,
        packageAmount: selectedPackage.amount,
        packagePrice: selectedPackage.price,
        tonPriceInUsd: tonPriceInUsd,
        tonAmount: tonPrice,
        paymentLink: paymentLink
    });

    await order.save();  // ✅ Lưu đơn hàng vào DB

    return { paymentLink, amount: selectedPackage.amount, price: selectedPackage.price, orderId: order._id };
}

// ✅ Tạo link thanh toán TON Keeper
function generatePaymentLink(username, tonPrice) {
    const tonAmountInNano = (tonPrice * 1e9).toFixed(0); // Convert to nanoTON
    return `https://app.tonkeeper.com/transfer/UQDUIxkuAb8xjWpRQVyxGse3L3zN6dbmgUG1OK2M0EQdkxDg?amount=${tonAmountInNano}&text=${encodeURIComponent(username)}`;
}

module.exports = { processPayment, checkTransactionStatus, fetchTonPrice };
