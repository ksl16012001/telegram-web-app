const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
// const Config = require("../models/Config");

// ✅ Middleware xác thực Admin
function verifyAdmin(req, res, next) {
    const { adminPassword } = req.headers;
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: "❌ Unauthorized access" });
    }
    next();
}

// ✅ Lấy danh sách đơn hàng
router.get("/orders", verifyAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("❌ Error fetching orders:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ✅ Đánh dấu đơn hàng là ĐÃ THANH TOÁN
router.post("/order-paid", verifyAdmin, async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findOne({ orderId });

        if (!order) return res.status(404).json({ success: false, message: "❌ Order not found" });

        order.status = "paid";
        order.updatedAt = new Date();
        await order.save();

        res.status(200).json({ success: true, message: `✅ Order ${orderId} marked as PAID` });
    } catch (error) {
        console.error("❌ Error marking order as paid:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ✅ Hủy đơn hàng
router.post("/cancel-order", verifyAdmin, async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findOne({ orderId });

        if (!order) return res.status(404).json({ success: false, message: "❌ Order not found" });

        order.status = "canceled";
        order.updatedAt = new Date();
        await order.save();

        res.status(200).json({ success: true, message: `✅ Order ${orderId} has been canceled` });
    } catch (error) {
        console.error("❌ Error canceling order:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ✅ Lấy danh sách người dùng
router.get("/users", verifyAdmin, async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ✅ Xóa người dùng
router.delete("/delete-user", verifyAdmin, async (req, res) => {
    try {
        const { userId } = req.body;
        await User.deleteOne({ id: userId });
        res.status(200).json({ success: true, message: `✅ User ${userId} deleted` });
    } catch (error) {
        console.error("❌ Error deleting user:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ✅ Lấy thông tin cấu hình hệ thống
router.get("/config", verifyAdmin, async (req, res) => {
    try {
        const config = await Config.findOne();
        res.status(200).json(config || {});
    } catch (error) {
        console.error("❌ Error fetching config:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ✅ Cập nhật cài đặt hệ thống
router.post("/update-config", verifyAdmin, async (req, res) => {
    try {
        const { tonReceiver, channelId, adminChatId } = req.body;
        let config = await Config.findOne();

        if (!config) {
            config = new Config({ tonReceiver, channelId, adminChatId });
        } else {
            config.tonReceiver = tonReceiver;
            config.channelId = channelId;
            config.adminChatId = adminChatId;
        }

        await config.save();
        res.status(200).json({ success: true, message: "✅ Config updated successfully" });
    } catch (error) {
        console.error("❌ Error updating config:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;
