const jwt = require("jsonwebtoken");

exports.authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Lấy token từ header

    if (!token) {
        return res.status(403).json({ success: false, message: "❌ Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.role !== "admin") {
            return res.status(403).json({ success: false, message: "❌ Forbidden" });
        }
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "❌ Invalid token" });
    }
};
