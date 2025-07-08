const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // googleId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  photo: String,
  balance: { type: Number, default: 200 },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
