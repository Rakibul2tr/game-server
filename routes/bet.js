const express = require("express");
const router = express.Router();
const Bet = require("../schemas/betSchema");

// 🔹 GET: All bets (no filter)
router.get("/", async (req, res) => {
  try {
    const bets = await Bet.find().sort({ createdAt: -1 }); // latest first
    res.json({ success: true, bets });
  } catch (error) {
    console.error("❌ Failed to fetch bets:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// 🔴 DELETE: Clear all bets
router.delete("/delete", async (req, res) => {
  try {
    await Bet.deleteMany({});
    res.json({ success: true, message: "All bets deleted successfully" });
  } catch (error) {
    console.error("❌ Failed to delete bets:", error);
    res.status(500).json({ success: false, message: "Failed to delete bets" });
  }
});

module.exports = router;
