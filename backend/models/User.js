const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    pic: { type: String, required: true }
});

module.exports = mongoose.model("User", UserSchema);
