// backend/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    phone: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);
