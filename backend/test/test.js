require("dotenv").config();
const mongoose = require("../config/db");
const Order = require("../models/Order");

async function createTestOrder() {
    try {
        const testOrder = new Order({
            username: "kinkin1601",  // ✅ Người dùng
            packageAmount: 50000,  // ✅ Số lượng sao
            packagePrice: 810, // ✅ Giá trị USD
            tonAmount: 10,  // ✅ Giá trị TON (đơn vị TON)
            paymentLink: "https://app.tonkeeper.com/transfer/UQDUIxkuAb8xjWpRQVyxGse3L3zN6dbmgUG1OK2M0EQdkxDg?amount=10000000000&text=kinkin1601",
            status: "pending",  // ✅ Đơn hàng đang chờ thanh toán
            transactionId: null,  // ✅ Chưa có ID giao dịch
            createdAt: new Date()
        });

        await testOrder.save();
        console.log(`✅ Test order created: ${testOrder._id}`);
        mongoose.connection.close();  // ✅ Đóng kết nối DB sau khi hoàn tất
    } catch (error) {
        console.error("❌ Error creating test order:", error);
        mongoose.connection.close();
    }
}

// Chạy hàm tạo đơn hàng test
createTestOrder();