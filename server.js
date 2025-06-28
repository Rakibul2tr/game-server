const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cron = require("node-cron");

const User = require("./schemas/userSchema");
const Bet = require("./schemas/betSchema");
const Fruit = require("./schemas/fruitSchema");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Replace with your frontend URL if needed
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(cors());

// Connect MongoDB
mongoose
  .connect(
    "mongodb+srv://rakibul2tr:rdUYI4rm70R2YsS7@cluster0.mnjws4o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Schema Definitions ---

const roundSchema = new mongoose.Schema({
  winCardIndex: Number,
  roundNumber: Number,
  fruitName: String,
  fruitImage: String,
  createdAt: { type: Date, default: Date.now },
});
const Round = mongoose.model("Round", roundSchema);

// // --- Global Variables ---
// let roundNumber = 1;
// let previousIndex = null;

// // --- Init Round Number from DB ---
// const initRoundNumber = async () => {
//   const lastRound = await Round.findOne().sort({ roundNumber: -1 });
//   roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;
//   console.log("🔁 Starting from round:", roundNumber);
// };
// initRoundNumber();

// // --- Round Generator: Emit every 30 seconds ---
// setInterval(async () => {
//   let winCardIndex;
//   let isSpecialRound = roundNumber % 15 === 0 || roundNumber % 20 === 0 || roundNumber % 25 === 0;

//   do {
//     if (isSpecialRound) {
//       // Special round → allow 56–58
//       winCardIndex = Math.floor(Math.random() * 3) + 56; // 56 to 58
//     } else {
//       // Normal round → only 51–55
//       winCardIndex = Math.floor(Math.random() * 5) + 51; // 51 to 55
//     }
//   } while (winCardIndex === previousIndex); // prevent repeat

//   previousIndex = winCardIndex;

//   const matchedFruit = await Fruit.findOne({ winCardIndex });
//   if (!matchedFruit) {
//     return console.error("❌ Fruit not found for index:", winCardIndex);
//   }

//   const round = new Round({
//     winCardIndex,
//     roundNumber,
//     fruitName: matchedFruit.name,
//     fruitImage: matchedFruit.image,
//   });

//   // await round.save();

//   const data = {
//     winCardIndex,
//     roundNumber,
//     time: new Date().toISOString(),
//   };

//   console.log("🎯 New Round:", data);
//   io.emit("new-round", data);
//   roundNumber++;
// }, 10000);

// --- Global Variables ---
let roundNumber = 1;
let previousIndex = null;

// 🔁 Stage system controller
let stageCounter = 0;
let stage = 'normal'; // 'normal', 'show56', 'after56', 'show57', 'after57', 'show58'

// --- Init Round Number from DB ---
const initRoundNumber = async () => {
  const lastRound = await Round.findOne().sort({ roundNumber: -1 });
  roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;
  console.log("🔁 Starting from round:", roundNumber);
};
initRoundNumber();

// --- Round Generator: Emit every 10 seconds ---
setInterval(async () => {
  let winCardIndex;

  // 🔁 Stage-based card selection
  switch (stage) {
    case 'normal':
      do {
        winCardIndex = Math.floor(Math.random() * 5) + 51; // 51–55
      } while (winCardIndex === previousIndex);
      stageCounter++;
      if (stageCounter >= 30) {
        stage = 'show56';
        stageCounter = 0;
      }
      break;

    case 'show56':
      winCardIndex = 56;
      stage = 'after56';
      break;

    case 'after56':
      do {
        winCardIndex = Math.floor(Math.random() * 5) + 51;
      } while (winCardIndex === previousIndex);
      stageCounter++;
      if (stageCounter >= 30) {
        stage = 'show57';
        stageCounter = 0;
      }
      break;

    case 'show57':
      winCardIndex = 57;
      stage = 'after57';
      break;

    case 'after57':
      do {
        winCardIndex = Math.floor(Math.random() * 5) + 51;
      } while (winCardIndex === previousIndex);
      stageCounter++;
      if (stageCounter >= 30) {
        stage = 'show58';
        stageCounter = 0;
      }
      break;

    case 'show58':
      winCardIndex = 58;
      stage = 'normal'; // Loop back
      stageCounter = 0;
      break;
  }

  previousIndex = winCardIndex;

  // 🍎 ফলটা খুঁজি
  const matchedFruit = await Fruit.findOne({ winCardIndex });
  if (!matchedFruit) {
    return console.error("❌ Fruit not found for index:", winCardIndex);
  }

  // 🧾 DB তে Save
  const round = new Round({
    winCardIndex,
    roundNumber,
    fruitName: matchedFruit.name,
    fruitImage: matchedFruit.image,
  });
  await round.save(); // ✅ Save চালু রাখলাম

  // 📡 Emit to Frontend
  const data = {
    winCardIndex,
    roundNumber,
    fruitName: matchedFruit.name,
    fruitImage: matchedFruit.image,
    stage,
    time: new Date().toISOString(),
  };
  console.log("🎯 New Round:", data);
  io.emit("new-round", data);

  roundNumber++;
}, 10000); // প্রতি 10 সেকেন্ডে একবার চালায়


// --- Daily Reset at 12:00 AM ---
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("⏰ Resetting round count and deleting all old rounds...");
    await Round.deleteMany({});
    await Bet.deleteMany({})
    roundNumber = 1;
    console.log("✅ Round reset successful");
  } catch (err) {
    console.error("❌ Round reset failed:", err);
  }
});

// --- Routes ---

app.get("/", (req, res) => {
  res.send("🎉 Server is running");
});

app.get("/rounds", async (req, res) => {
  try {
    const rounds = await Round.find().sort({ createdAt: -1 });
    res.json(rounds);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rounds" });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { googleId, name, email, photo } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      return res.status(200).json({ message: "User logged in", user });
    }

    user = new User({ googleId, name, email, photo, balance: 200 });
    await user.save();

    res.status(201).json({ message: "Signup successful", user });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/placeBet", async (req, res) => {
  try {
    const { userId, betAmount } = req.body;

    if (!userId || !betAmount) {
      return res.status(400).json({ error: "Missing userId or betAmount" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.balance < parseInt(betAmount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    user.balance -= parseInt(betAmount);
    await user.save();

    res.status(200).json({
      message: "Bet placed successfully",
      user: { id: user._id, name: user.name, balance: user.balance },
    });
  } catch (err) {
    console.error("Place Bet Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/bet", async (req, res) => {
  try {
    const { userId, roundNumber, winAmount } = req.body;

    const round = await Round.findOne({ roundNumber });
    if (!round) return res.status(400).json({ error: "Invalid round" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.balance += winAmount;
    await user.save();

    const bet = new Bet({ userId, roundNumber, winAmount });
    await bet.save();

    res.status(201).json({
      message: "Bet successful",
      user: { id: user._id, name: user.name, balance: user.balance },
      bet,
    });
  } catch (err) {
    console.error("Bet Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      balance: user.balance,
      photo: user.photo,
    });
  } catch (err) {
    console.error("User Fetch Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/winners/:roundNumber", async (req, res) => {
  console.log('req.params',req.params);
  
  try {
    const { roundNumber } = req.params;

    // Find bets of that round, sorted by winAmount descending
    const topBets = await Bet.find({ roundNumber })
      .sort({ winAmount: -1 })
      .limit(5)
      .lean(); // lean makes it faster

    const userIds = topBets.map((bet) => bet.userId);

    // Fetch user details
    const users = await User.find({ _id: { $in: userIds } })
      .select("name photo") // only necessary fields
      .lean();

    // Map back with winAmount
    const winners = topBets.map((bet) => {
      const user = users.find(
        (u) => u._id.toString() === bet.userId.toString()
      );

      // Fallback if user not found (e.g. deleted)
      if (!user) {
        return {
          userId: bet.userId,
          name: "Unknown",
          balance: 0,
          photo: null,
          winAmount: bet.winAmount,
        };
      }

      return {
        userId: user._id,
        name: user.name,
        balance: user.balance,
        photo: user.photo,
        winAmount: bet.winAmount,
      };
    });


    res.status(200).json({ roundNumber, winners });
  } catch (err) {
    console.error("Winner API Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// --- Start Server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
