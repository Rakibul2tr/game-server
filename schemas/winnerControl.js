// models/WinnerControl.js
const mongoose = require("mongoose");

const winnerControlSchema = new mongoose.Schema({
  winnerControl: { type: Boolean, default: false },
});

const WinnerControl = mongoose.model("WinnerControl", winnerControlSchema);

module.exports = WinnerControl;