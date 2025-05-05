const mongoose = require("mongoose");

const betSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  roundNumber: { type: Number, required: true },
  winAmount: { type: Number, required: true },
  // itemName: { type: String, required: true },
  // itemId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Bet = mongoose.model("Bet", betSchema);

module.exports = Bet;
