const mongoose = require("mongoose");

const StageControlSchema = new mongoose.Schema(
  {
    stage56: { type: Boolean, default: false },
    stage57: { type: Boolean, default: false },
    stage58: { type: Boolean, default: false },
  },
  { timestamps: true }
);
  

const StageControl = mongoose.model("StageControl", StageControlSchema);

module.exports = StageControl;
