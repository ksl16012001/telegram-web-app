const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ✅ Cấu hình CORS cho phép Telegram gọi API
app.use(cors({
    origin: "*", // Hoặc thay "*" bằng "https://web.telegram.org" để chặt chẽ hơn
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));
app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    next();
});
const app = express();
const PORT = 3000;

// Kết nối MongoDB
mongoose.connect("mongodb+srv://admin:Nhincaigi1!@telegrambot.htjft.mongodb.net/?retryWrites=true&w=majority&appName=telegrambot", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Mô hình User
const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // ✅ Chỉ `id` là unique
    username: String,
    name: String,
    phone: String,
    pic: String
});

const User = mongoose.model("User", UserSchema);
module.exports = User;

// 🌟 API: Thêm user khi mở app
app.get("/api/adduser", async (req, res) => {
    try {
        console.log("🔹 Incoming request:", req.query); // ✅ Debug input

        const { id, username, name, phone, pic } = req.query;
        if (!id || !username || !name) {
            return res.status(400).json({ message: "❌ Missing required fields!" });
        }

        let user = await User.findOne({ id });
        if (!user) {
            user = new User({ id, username, name, phone: phone || "", pic });
            await user.save();
        }

        console.log("✅ User saved:", user); // ✅ Debug saved user
        res.json({ message: "✅ User saved!", user });
    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ message: "❌ Server error", error });
    }
});

// 🌟 API: Cập nhật số điện thoại sau khi share contact
app.get("/api/updateuser", async (req, res) => {
    try {
        console.log("🔹 Incoming request:", req.query); // ✅ Debug input

        const { id, phone } = req.query;
        if (!id || !phone) return res.status(400).json({ message: "❌ Missing id or phone!" });

        let user = await User.findOneAndUpdate({ id }, { phone }, { new: true });
        if (!user) return res.status(404).json({ message: "❌ User not found!" });

        console.log("✅ Phone updated:", user); // ✅ Debug updated user
        res.json({ message: "✅ Phone updated!", user });
    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ message: "❌ Server error", error });
    }
});

// Kiểm tra server có đang chạy không
app.get("/", (req, res) => {
    res.send("✅ Server is running!");
});

// Chạy server
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
