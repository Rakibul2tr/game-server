const express = require("express");
const router = express.Router();
const WinnerControl = require("../schemas/winnerControl");

// ✅ GET winnerControl value
router.get("/", async (req, res) => {
  try {
    const control = await WinnerControl.findOne();
    res.status(200).json(control || { winnerControl: false });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching value", error: err.message });
  }
});

// ✅ PATCH winnerControl value
router.patch("/", async (req, res) => {
  const { value } = req.body;
  try {
    const updated = await WinnerControl.findOneAndUpdate(
      {},
      { winnerControl: value },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: `Updated to ${value}`, data: updated });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

module.exports = router;
