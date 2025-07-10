const mongoose = require("mongoose");

const StageControlSchema = new mongoose.Schema(
  {
    stage51: { type: Boolean, default: false },
    stage52: { type: Boolean, default: false },
    stage53: { type: Boolean, default: false },
    stage54: { type: Boolean, default: false },
    stage55: { type: Boolean, default: false },
    stage56: { type: Boolean, default: false },
    stage57: { type: Boolean, default: false },
    stage58: { type: Boolean, default: false },
  },
  { timestamps: true }
);
  

const StageControl = mongoose.model("StageControl", StageControlSchema);

module.exports = StageControl;
