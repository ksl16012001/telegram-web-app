const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    username: { type: String, required: true },
    packageAmount: { type: Number, required: true },
    packagePrice: { type: Number, required: true },
    tonPriceInUsd: { type: Number, required: true },
    tonAmount: { type: Number, required: true },
    paymentLink: { type: String, required: true },
    transactionId: { type: String, default: null }, // 🔹 Cập nhật khi xác nhận giao dịch
    status: { type: String, enum: ["pending", "paid", "complete"], default: "pending" }, // 🔹 Trạng thái đơn hàng
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", OrderSchema);
