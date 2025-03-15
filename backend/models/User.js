const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: String,
    name: String,
    phone: String,
    pic: String
});

module.exports = mongoose.model("User", UserSchema);
