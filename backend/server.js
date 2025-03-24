require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { authenticateAdmin } = require("./middlewares/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/src"))); // Phục vụ file tĩnh

// Routes
app.use("/api/auth", authRoutes); // Xác thực admin
app.use("/api/admin", authenticateAdmin, adminRoutes); // API admin (yêu cầu JWT)
app.use("/api/users", userRoutes); // API user
app.use("/api/orders", orderRoutes); // API đơn hàng
app.use("/api/payment", paymentRoutes); // API thanh toán

// Route hiển thị trang admin
app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/src/admin/dashboard.html"));
});

// Route mặc định
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/src/index.html"));
});

// Khởi chạy server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
