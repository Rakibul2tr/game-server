const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cron = require("node-cron");
require("dotenv").config();

const Bet = require("./schemas/betSchema");
const Fruit = require("./schemas/fruitSchema");
const StageControl = require("./schemas/StageControlSchema");
const stageControlRoutes = require("./routes/stageControl");
const betRoutes = require("./routes/bet");
const fruitData = require("./fruitData");

const axios = require("axios").default;

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
// mongoose
//   .connect(
//     "mongodb+srv://rakibul2tr:rdUYI4rm70R2YsS7@cluster0.mnjws4o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
//   )
//   .then(() => console.log("✅ MongoDB connected successfully"))
//   .catch((err) => console.error("❌ MongoDB connection error:", err));

// insert fruity data 
const seedFruits = async () => {
  for (const fruit of fruitData) {
    const exists = await Fruit.findOne({ winCardIndex: fruit.winCardIndex });
    if (!exists) {
      await Fruit.create(fruit);
      console.log(`✅ Inserted: ${fruit.name}`);
    } else {
      console.log(`🟡 Already exists: ${fruit.name}`);
    }
  }
};
// insert stage 
const insertDefaultStageFlags = async () => {
  const exists = await StageControl.findOne();
  if (!exists) {
    await StageControl.create({}); // defaults will auto-fill
    console.log("✅ Default StageControl inserted");
  } else {
    console.log("🟡 StageControl already exists, skipping insert");
  }
};

  mongoose
    .connect(process.env.MONGO_URI)
    // .connect("mongodb://jkadmin:jklivegame@91.108.105.238:27017/jklive?authSource=admin")
    .then(() => console.log("✅ MongoDB connected"))
    .then(() => console.log("✅ MongoDB connected"))
    
    .catch((err) => console.error("❌ MongoDB connection failed:", err));
    seedFruits();
    insertDefaultStageFlags();
// --- Schema Definitions ---

const roundSchema = new mongoose.Schema({
  winCardIndex: Number,
  roundNumber: Number,
  fruitName: String,
  fruitImage: String,
  createdAt: { type: Date, default: Date.now },
});
const Round = mongoose.model("Round", roundSchema);


// global variable 
let stageFlags = {
  stage51: true,
  stage52: true,
  stage53: true,
  stage54: true,
  stage55: true,
  stage56: false,
  stage57: false,
  stage58: false,
};

// DB থেকে প্রতি 30 মিনিটে নতুন ফ্ল্যাগগুলো আনবে
const updateStageFlags = async () => {
  const control = await StageControl.findOne();
  if (control) {
    stageFlags = {
      stage51: control.stage51,
      stage52: control.stage52,
      stage53: control.stage53,
      stage54: control.stage54,
      stage55: control.stage55,
      stage56: control.stage56,
      stage57: control.stage57,
      stage58: control.stage58,
    };
  }
};
updateStageFlags(); 
setInterval(updateStageFlags, 30000); 

// --- Global Variables ---
let roundNumber = 1;
let previousIndex = null;
let stage = 'normal'; 

// --- Init Round Number from DB ---
const initRoundNumber = async () => {
  const lastRound = await Round.findOne().sort({ roundNumber: -1 });
  roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;
  console.log("🔁 Starting from round:", roundNumber);
};
initRoundNumber();

// round stage control and socket.io login
setInterval(async () => {
  let winCardIndex;
  // Step 1: Build enabled list
  const availableIndices = [];
  for (let i = 51; i <= 58; i++) {
    if (stageFlags[`stage${i}`]) {
      availableIndices.push(i);
    }
  }

  // Step 2: Check if at least one stage is active
  if (availableIndices.length === 0) {
    console.log("⚠️ No stage enabled, skipping round.");
    return;
  }

  // Step 3: Pick random from enabled only
  do {
    const rand = Math.floor(Math.random() * availableIndices.length);
    winCardIndex = availableIndices[rand];
  } while (winCardIndex === previousIndex);

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
}, 30000); // প্রতি 30 সেকেন্ডে একবার চালায়


// --- Daily Reset at 12:00 AM ---
// cron.schedule("0 0 * * *", async () => {
//   try {
//     console.log("⏰ Resetting round count and deleting all old rounds...");
//     await Round.deleteMany({});
//     await Bet.deleteMany({})
//     roundNumber = 1;
//     console.log("✅ Round reset successful");
//   } catch (err) {
//     console.error("❌ Round reset failed:", err);
//   }
// });


// --- Routes ---

app.get("/", (req, res) => {
  res.send("🎉 Server is running");
});
app.use("/stage", stageControlRoutes);
app.use("/bets", betRoutes);

app.get("/rounds", async (req, res) => {
  try {
    const rounds = await Round.find().sort({ createdAt: -1 });
    res.json(rounds);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rounds" });
  }
});



app.post("/placeBet", async (req, res) => {
  try {
    const { userId, betAmount,token } = req.body;

    if (!userId || !betAmount) {
      return res.status(400).json({ error: "Missing userId or betAmount" });
    }
    // Step 2: First server এ balance update
    const updateResponse = await axios.patch(
      `https://api.arjklive.xyz/add-remove-diamond/subtract/${userId}`,
      {
        diamond: parseInt(betAmount), // 👈 Body data
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // 👈 Replace with actual token
          "Content-Type": "application/json", // Optional, axios adds it automatically
        },
      }
    );
   
    res.status(200).json({
      message: "Bet placed successfully",
      // user: { id: user._id, name: user.name, balance: user.balance },
    });
  } catch (err) {
    console.error("Place Bet Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/bet", async (req, res) => {
  try {
    const { userId, roundNumber, winAmount, token, fullname, profilePic } =
      req.body;

    const round = await Round.findOne({ roundNumber });
    if (!round) return res.status(400).json({ error: "Invalid round" });

    // Step 2: First server এ balance update
    const updateResponse = await axios.patch(
      `https://api.arjklive.xyz/add-remove-diamond/add/${userId}`,
      {
        diamond: parseInt(winAmount), // 👈 Body data
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // 👈 Replace with actual token
          "Content-Type": "application/json", // Optional, axios adds it automatically
        },
      }
    );

    const bet = new Bet({ userId, roundNumber, winAmount,fullname,profilePic });
    await bet.save();

    res.status(201).json({
      message: "Bet successful",
      // user: { id: user._id, name: user.name, balance: user.balance },
      bet,
    });
  } catch (err) {
    console.error("Bet Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/winners/:roundNumber", async (req, res) => {
  try {
    const roundNumber = parseInt(req.params.roundNumber);
    console.log("req.params", roundNumber);
    // Find bets of that round, sorted by winAmount descending
    const topBets = await Bet.find({ roundNumber })
      .sort({ winAmount: -1 })
      .limit(5)
      .lean(); // lean makes it faster

      const Bets = topBets.filter(bet => bet.winAmount > 0);
    res.status(200).json({ roundNumber, Bets });
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
