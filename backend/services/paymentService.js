const axios = require("axios");
const Order = require("../models/Order"); // Import model Order

const TONCENTER_API_URL = "https://toncenter.com/api/v2";

// Lấy tỷ giá TON/USD
async function fetchTonPrice() {
  try {
    const response = await axios.get(`${TONCENTER_API_URL}/rates?tokens=ton&currencies=usd`);
    return response.data.rates.TON.prices.USD;
  } catch (error) {
    console.error('Error fetching TON price:', error);
    return null;
  }
}

// Kiểm tra giao dịch trên địa chỉ ví
async function checkTransactionStatus(address, transactionId) {
  try {
    const response = await axios.get(`${TONCENTER_API_URL}/getTransactions`, {
      params: {
        address: address,
        limit: 10,
        to_lt: 0,
        archival: false
      }
    });

    const transactions = response.data.result;
    const transaction = transactions.find(tx => tx.transaction_id.hash === transactionId);

    if (transaction) {
      return { success: true, status: "Transaction found and completed." };
    } else {
      return { success: false, status: "Transaction not found or not completed yet." };
    }
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return { success: false, status: "Error checking transaction status." };
  }
}

// Xử lý thanh toán và lưu đơn hàng vào DB
async function processPayment(amount, username) {
  if (!amount || !username) {
    throw new Error("Amount and username are required");
  }

  // Giả sử bạn đã có gói sao được chọn từ danh sách
  const selectedPackage = { amount: 100, price: 1.7 }; // Example package, replace with your actual package selection logic

  const tonPriceInUsd = await fetchTonPrice();
  if (!tonPriceInUsd) {
    throw new Error("Failed to fetch TON price");
  }

  const tonPrice = (selectedPackage.price / tonPriceInUsd + 0.01).toFixed(2); // Convert USD to TON
  const paymentLink = generatePaymentLink(username, tonPrice); // Tạo link thanh toán

  // Lưu đơn hàng vào DB
  const order = new Order({
    username: username,
    packageAmount: selectedPackage.amount,
    packagePrice: selectedPackage.price,
    tonPriceInUsd: tonPriceInUsd,
    tonAmount: tonPrice,
    paymentLink: paymentLink
  });

  await order.save();  // Lưu đơn hàng vào MongoDB

  return { paymentLink, amount: selectedPackage.amount, price: selectedPackage.price, orderId: order._id };
}

function generatePaymentLink(username, tonPrice) {
  const tonAmountInNano = (tonPrice * 1000000000).toFixed(0); // Convert to nanoTON
  return `https://app.tonkeeper.com/transfer/UQDUIxkuAb8xjWpRQVyxGse3L3zN6dbmgUG1OK2M0EQdkxDg?amount=${tonAmountInNano}&text=${encodeURIComponent(username)}`;
}

module.exports = { processPayment, checkTransactionStatus };
