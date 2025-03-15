const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    packageAmount: { type: Number, required: true },
    packagePrice: { type: Number, required: true },
    tonPriceInUsd: { type: Number, required: true },
    tonAmount: { type: Number, required: true },
    paymentLink: { type: String, required: true },
    transactionId: { type: String, required: false },
    status: { type: String, default: "pending" },  // pending, completed, failed
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
