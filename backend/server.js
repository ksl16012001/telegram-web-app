const express = require("express");
const mongoose = require("mongoose");

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
    id: { type: String, required: true, unique: true },
    username: String,
    name: String,
    phone: String,
    pic: String
});
const User = mongoose.model("User", UserSchema);

// 🌟 API: Thêm user
app.get("/api/adduser", async (req, res) => {
    try {
        const { id, username, name, phone, pic } = req.query;
        if (!id || !username || !name || !phone) {
            return res.status(400).json({ message: "❌ Missing required fields!" });
        }

        const existingUser = await User.findOne({ id });
        if (existingUser) return res.status(400).json({ message: "❌ User already exists!" });

        const newUser = new User({ id, username, name, phone, pic });
        await newUser.save();
        res.json({ message: "✅ User added successfully!", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "❌ Server error", error });
    }
});

// 🌟 API: Lấy user qua id
app.get("/api/getuser", async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ message: "❌ Missing id!" });

        const user = await User.findOne({ id });
        if (!user) return res.status(404).json({ message: "❌ User not found!" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "❌ Server error", error });
    }
});

// 🌟 API: Cập nhật user
app.get("/api/updateuser/:id/:updates", async (req, res) => {
    try {
        const { id, updates } = req.params;

        // Tách key=value từ URL
        const updateFields = {};
        updates.split("/").forEach(pair => {
            const [key, value] = pair.split("=");
            if (key && value) updateFields[key] = value;
        });

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "❌ No valid update fields provided!" });
        }

        const updatedUser = await User.findOneAndUpdate(
            { id },
            { $set: updateFields },
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ message: "❌ User not found!" });

        res.json({ message: "✅ User updated successfully!", user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: "❌ Server error", error: err });
    }
});

// 🌟 API: Xóa user
app.get("/api/deleteuser", async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) return res.status(400).json({ message: "❌ Missing id!" });

        const deletedUser = await User.findOneAndDelete({ id });
        if (!deletedUser) return res.status(404).json({ message: "❌ User not found!" });

        res.json({ message: "✅ User deleted successfully!", user: deletedUser });
    } catch (error) {
        res.status(500).json({ message: "❌ Server error", error });
    }
});

// Chạy server
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
