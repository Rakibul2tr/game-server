// routes/stageControl.js
const express = require("express");
const StageControl = require("../schemas/StageControlSchema");
const router = express.Router();

// 🔍 দেখার জন্য
router.get("/get-status", async (req, res) => {
  const control = await StageControl.findOne();
  res.json(control);
});

// ✅ আপডেট করার জন্য
router.post("/update-status", async (req, res) => {
  let control = await StageControl.findOne();
  if (!control) control = new StageControl();
  control.stage56 = req.body.stage56 ?? control.stage56;
  control.stage57 = req.body.stage57 ?? control.stage57;
  control.stage58 = req.body.stage58 ?? control.stage58;
  await control.save();
  res.json({ message: "✅ Stage updated successfully", control });
});

module.exports = router;
