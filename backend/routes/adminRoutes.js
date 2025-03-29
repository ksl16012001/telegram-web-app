const express = require("express");
const Order = require("../models/Order");
const User = require("../models/User");
const router = express.Router();

// Lấy danh sách đơn hàng
router.get("/orders", async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
});

// Lấy danh sách user
router.get("/users", async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
});

// Đánh dấu đơn hàng là "paid"
router.post("/order-paid", async (req, res) => {
    const { orderId } = req.body;
    const order = await Order.findOne({ orderId });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.status = "paid";
    await order.save();
    res.json({ success: true, message: "✅ Order marked as PAID" });
});

// Xóa user
router.delete("/delete-user", async (req, res) => {
    const { userId } = req.body;
    await User.deleteOne({ id: userId });
    res.json({ success: true, message: "✅ User deleted" });
});
module.exports = router;
