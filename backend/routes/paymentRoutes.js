const express = require("express");
const paymentService = require("../services/paymentService");

const router = express.Router();

// ✅ Xử lý giao dịch mua sao
router.post("/process-payment", async (req, res) => {
    const { amount, username } = req.body;

    try {
        const result = await paymentService.processPayment(amount, username);
        return res.status(200).json({
            message: "Transaction processed successfully",
            paymentLink: result.paymentLink,
            amount: result.amount,
            price: result.price,
            orderId: result.orderId
        });
    } catch (error) {
        console.error("Error processing payment:", error);
        return res.status(500).json({ error: error.message });
    }
});

// ✅ Kiểm tra trạng thái giao dịch
router.post("/check-transaction", async (req, res) => {
    const { address, transactionId } = req.body;

    try {
        const result = await paymentService.checkTransactionStatus(address, transactionId);
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error checking transaction:", error);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;
