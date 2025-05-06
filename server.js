const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const User = require("./schemas/userSchema");
const Bet = require("./schemas/betSchema");
const cron = require("node-cron");
const Fruit = require("./schemas/fruitSchema");
const { log } = require("console");

const app = express();
const server = http.createServer(app);
// const io = new Server(server);
app.use(express.json());
app.use(cors());

 const io = new Server(server, {
   cors: {
     origin: "*", // or specify your frontend URL
     methods: ["GET", "POST"],
   },
 });


mongoose
  .connect(
    "mongodb+srv://rakibul2tr:rdUYI4rm70R2YsS7@cluster0.mnjws4o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });


// Schema
const roundSchema = new mongoose.Schema({
  winCardIndex: Number,
  roundNumber: Number,
  fruitName: String, 
  fruitImage: String,
  createdAt: { type: Date, default: Date.now },
});

const Round = mongoose.model("Round", roundSchema);


// Global round number
let roundNumber = 1;
let previousIndex = null;
// Emit round every 30 seconds

setInterval(async () => {
  let winCardIndex;
  do {
    winCardIndex = Math.floor(Math.random() * 8) + 51; // 51 to 58
  } while (winCardIndex === previousIndex);

  previousIndex = winCardIndex;
  // 🔍 Fruits collection থেকে ফল বের করো
  const matchedFruit = await Fruit.findOne({ winCardIndex });

  if (!matchedFruit) {
    console.error(
      "❌ Matching fruit not found in DB for winCardIndex:",
      winCardIndex
    );
    return;
  }
  // ✅ Round 
  const round = new Round({
    winCardIndex,
    roundNumber,
    fruitName: matchedFruit.name,
    fruitImage: matchedFruit.image,
  });
  await round.save();

  const data = {
    winCardIndex,
    roundNumber,
    time: new Date().toISOString(),
  };
  console.log("round", data);

  io.emit("new-round", data);
  roundNumber++;
}, 30000);

// 🔄 Reset round count and delete old rounds at 12:00 AM every day
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("⏰ Resetting round count and deleting old rounds...");

    await Round.deleteMany({}); // Delete all previous rounds
    roundNumber = 1; // Reset round counter

    console.log("✅ Round reset successful");
  } catch (err) {
    console.error("❌ Failed to reset rounds:", err);
  }
});

app.get("/", (req, res) => {
  res.send("Hello Developer");
});
app.get("/rounds", async (req, res) => {
  try {
    const rounds = await Round.find().sort({ createdAt: -1 }); // latest first
    res.json(rounds);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rounds" });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { googleId, name, email, photo } = req.body;

    // Check if user already exists 
    let user = await User.findOne({ email });

    if (user) {
      // User exists — treat as login
      return res.status(200).json({
        message: "User logged in successfully",
        user,
      });
    }

    // Create new user
    user = new User({ googleId, name, email, photo,balance:200 });
    await user.save();

    res.status(201).json({
      message: "User signed up successfully",
      user,
    });
  } catch (error) {
    console.error("Signup/Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API to handle user bets
app.post("/bet", async (req, res) => {
  try {
    const { userId, roundNumber, winAmount } = req.body;

    // Fetch the current round from the database
    const currentRound = await Round.findOne({ roundNumber }).sort({ createdAt: -1 });

    if (!currentRound) {
      return res.status(400).json({ error: "Round number not found" });
    }

    // Fetch the user from the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user balance by adding the winAmount
    user.balance += winAmount;
    await user.save();

    // Save the bet details in the Bet collection
    const bet = new Bet({
      userId,
      roundNumber,
      winAmount
    });
    await bet.save();

    // Return the success response
    res.status(201).json({
      message: "Bet placed and balance updated successfully",
      user: {
        id: user._id,
        name: user.name,
        balance: user.balance,
      },
      bet,
    });
  } catch (error) {
    console.error("Betting Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API to get user information
app.get("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch the user from the database by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user information (name, email, balance)
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      balance: user.balance,
      photo:user.photo
    });
  } catch (error) {
    console.error("Get User Info Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API to place a bet and deduct balance
app.post("/place-bet", async (req, res) => {
  log("Place Bet API called",req.body);
  try {

    const { userId, betAmount,roundNumber } = req.body;
 if (!userId || !betAmount) {
   return res.status(400).json({ error: "Missing userId or betAmount" });
 }
    // Fetch the user from the database
    const user = await User.findById(parseInt(userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user has enough balance
    if (user.balance < parseInt(betAmount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Deduct the bet amount from the user's balance
    user.balance -= parseInt(betAmount);
    await user.save();

    // Return the success response
    res.status(200).json({
      message: "Bet placed successfully",
      user: {
        id: user._id,
        name: user.name,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error("Place Bet Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// Start server using dynamic port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
