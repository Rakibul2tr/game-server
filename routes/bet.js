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
  
  module.exports = router;
