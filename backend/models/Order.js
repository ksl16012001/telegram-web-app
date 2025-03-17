const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true }, // 🔹 Thêm orderId để định danh đơn hàng
    userId: { type: String, required: true, ref: "User" }, // 🔹 Liên kết với `User.id`
    username: { type: String, required: true },
    service: { type: String, enum: ["Buy Star", "Buy Premium"], required: true }, // 🔹 Loại dịch vụ
    packageAmount: { type: Number, required: true },
    packagePrice: { type: Number, required: true },
    tonPriceInUsd: { type: Number, required: false },
    tonAmount: { type: Number, required: true },
    paymentLink: { type: String, required: true },
    transactionId: { type: String, default: null }, // 🔹 Cập nhật khi xác nhận giao dịch
    status: { type: String, enum: ["pending", "paid", "complete","canceled"], default: "pending" }, // 🔹 Trạng thái đơn hàng
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", OrderSchema);
