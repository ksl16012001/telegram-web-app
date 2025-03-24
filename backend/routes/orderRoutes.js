const express = require("express");
const Order = require("../models/Order");
const router = express.Router();

// 📌 Lấy danh sách đơn hàng theo userId
router.get("/user-orders/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });

        if (!orders.length) {
            return res.status(404).json({ success: false, message: "❌ No orders found" });
        }

        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("❌ Error fetching user orders:", error);
        res.status(500).json({ success: false, message: "❌ Internal Server Error" });
    }
});

// 📌 Hủy đơn hàng
router.post("/cancel-order", async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: "❌ Missing orderId" });
        }

        console.log(`📌 Attempting to cancel order: ${orderId}`);

        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: "❌ Order not found" });
        }

        if (order.status === "paid") {
            return res.status(400).json({ success: false, message: "❌ Cannot cancel a paid order" });
        }

        order.status = "canceled";
        order.updatedAt = new Date();
        await order.save();

        console.log(`✅ Order ${orderId} has been canceled`);

        res.status(200).json({ success: true, message: "✅ Order canceled successfully" });
    } catch (error) {
        console.error("❌ Error canceling order:", error);
        res.status(500).json({ success: false, message: "❌ Internal server error" });
    }
});

// 📌 Kiểm tra trạng thái giao dịch
router.post("/check-transaction", async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({ success: false, message: "❌ Missing orderId" });
    }

    try {
        console.log(`📌 Checking transaction for Order ID: ${orderId}`);

        const result = await checkTransaction(orderId);

        console.log(`✅ Transaction check result:`, result);

        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error checking transaction:", error);
        res.status(500).json({ success: false, message: "❌ Internal server error", error: error.message });
    }
});

module.exports = router;
