const mongoose = require("mongoose");

const StageControlSchema = new mongoose.Schema(
  {
    stage51: { type: Boolean, default: true },
    stage52: { type: Boolean, default: true },
    stage53: { type: Boolean, default: true },
    stage54: { type: Boolean, default: true },
    stage55: { type: Boolean, default: true },
    stage56: { type: Boolean, default: false },
    stage57: { type: Boolean, default: false },
    stage58: { type: Boolean, default: false },
  },
  { timestamps: true }
);
  

const StageControl = mongoose.model("StageControl", StageControlSchema);

module.exports = StageControl;
