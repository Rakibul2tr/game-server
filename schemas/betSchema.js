const mongoose = require("mongoose");

const betSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  roundNumber: { type: Number, required: true },
  winAmount: { type: Number, required: true },
  fullname: { type: String,  },
  profilePic: { type: String,  },
  createdAt: { type: Date, default: Date.now },
});

const Bet = mongoose.model("Bet", betSchema);

module.exports = Bet;
