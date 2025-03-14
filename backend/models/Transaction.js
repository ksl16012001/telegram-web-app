// backend/models/Transaction.js
import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    username: { type: String, required: true },
    amount: { type: Number, required: true },
    stars: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    txId: { type: String, default: null }, // Transaction ID từ TON
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", TransactionSchema);
