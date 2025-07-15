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
  // console.log("📩 Received body:", req.body);

  let control = await StageControl.findOne();
  if (!control) control = new StageControl();
  control.stage51 = req.body.stage51 ?? control.stage51;
  control.stage52 = req.body.stage52 ?? control.stage52;
  control.stage53 = req.body.stage53 ?? control.stage53;
  control.stage54 = req.body.stage54 ?? control.stage54;
  control.stage55 = req.body.stage55 ?? control.stage55;
  control.stage56 = req.body.stage56 ?? control.stage56;
  control.stage57 = req.body.stage57 ?? control.stage57;
  control.stage58 = req.body.stage58 ?? control.stage58;
  control.stage59 = req.body.stage59 ?? control.stage59;
  control.stage60 = req.body.stage60 ?? control.stage60;
  await control.save();
  // console.log("✅ Saved control:", control);
  res.json({ message: "✅ Stage updated successfully", control });
});

module.exports = router;
