// const express = require("express");
// const http = require("http");
// const cors = require("cors");
// const { Server } = require("socket.io");
// const mongoose = require("mongoose");
// const User = require("./schemas/userSchema");
// const Bet = require("./schemas/betSchema");
// const cron = require("node-cron");
// const Fruit = require("./schemas/fruitSchema");
// const { log } = require("console");

// const app = express();
// const server = http.createServer(app);
// // const io = new Server(server);
// app.use(express.json());
// app.use(cors());

//  const io = new Server(server, {
//    cors: {
//      origin: "*", // or specify your frontend URL
//      methods: ["GET", "POST"],
//    },
//  });


// mongoose
//   .connect(
//     "mongodb+srv://rakibul2tr:rdUYI4rm70R2YsS7@cluster0.mnjws4o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
//   )
//   .then(() => {
//     console.log("✅ MongoDB connected successfully");
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:", err);
//   });


// // Schema
// const roundSchema = new mongoose.Schema({
//   winCardIndex: Number,
//   roundNumber: Number,
//   fruitName: String, 
//   fruitImage: String,
//   createdAt: { type: Date, default: Date.now },
// });

// const Round = mongoose.model("Round", roundSchema);


// // Global round number
// let roundNumber = 1;
// let previousIndex = null;

// // ⏳ Init roundNumber from DB
// const initRoundNumber = async () => {
//   const lastRound = await Round.findOne().sort({ roundNumber: -1 });
//   roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;
//   console.log("🔁 Starting from round:", roundNumber);
// };
// // Emit round every 30 seconds

// setInterval(async () => {
//   let winCardIndex;
//   do {
//     winCardIndex = Math.floor(Math.random() * 8) + 51; // 51 to 58
//   } while (winCardIndex === previousIndex);

//   previousIndex = winCardIndex;
//   // 🔍 Fruits collection থেকে ফল বের করো
//   const matchedFruit = await Fruit.findOne({ winCardIndex });

//   if (!matchedFruit) {
//     console.error(
//       "❌ Matching fruit not found in DB for winCardIndex:",
//       winCardIndex
//     );
//     return;
//   }
//   // ✅ Round 
//   const round = new Round({
//     winCardIndex,
//     roundNumber,
//     fruitName: matchedFruit.name,
//     fruitImage: matchedFruit.image,
//   });
//   await round.save();

//   const data = {
//     winCardIndex,
//     roundNumber,
//     time: new Date().toISOString(),
//   };
//   console.log("round", data);

//   io.emit("new-round", data);
//   roundNumber++;
// }, 30000);

// // 🔄 Reset round count and delete old rounds at 12:00 AM every day
// cron.schedule("0 0 * * *", async () => {
//   try {
//     console.log("⏰ Resetting round count and deleting old rounds...");

//     await Round.deleteMany({}); // Delete all previous rounds
//     roundNumber = 1; // Reset round counter

//     console.log("✅ Round reset successful");
//   } catch (err) {
//     console.error("❌ Failed to reset rounds:", err);
//   }
// });

// app.get("/", (req, res) => {
//   res.send("Hello Developer");
// });
// app.get("/rounds", async (req, res) => {
//   try {
//     const rounds = await Round.find().sort({ createdAt: -1 }); // latest first
//     res.json(rounds);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch rounds" });
//   }
// });

// app.post("/signup", async (req, res) => {
//   try {
//     const { googleId, name, email, photo } = req.body;

//     // Check if user already exists 
//     let user = await User.findOne({ email });

//     if (user) {
//       // User exists — treat as login
//       return res.status(200).json({
//         message: "User logged in successfully",
//         user,
//       });
//     }

//     // Create new user
//     user = new User({ googleId, name, email, photo,balance:200 });
//     await user.save();

//     res.status(201).json({
//       message: "User signed up successfully",
//       user,
//     });
//   } catch (error) {
//     console.error("Signup/Login Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // API to handle user bets
// app.post("/bet", async (req, res) => {
//   try {
//     const { userId, roundNumber, winAmount } = req.body;

//     // Fetch the current round from the database
//     const currentRound = await Round.findOne({ roundNumber }).sort({ createdAt: -1 });

//     if (!currentRound) {
//       return res.status(400).json({ error: "Round number not found" });
//     }

//     // Fetch the user from the database
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Update user balance by adding the winAmount
//     user.balance += winAmount;
//     await user.save();

//     // Save the bet details in the Bet collection
//     const bet = new Bet({
//       userId,
//       roundNumber,
//       winAmount
//     });
//     await bet.save();

//     // Return the success response
//     res.status(201).json({
//       message: "Bet placed and balance updated successfully",
//       user: {
//         id: user._id,
//         name: user.name,
//         balance: user.balance,
//       },
//       bet,
//     });
//   } catch (error) {
//     console.error("Betting Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // API to get user information
// app.get("/user/:id", async (req, res) => {
//   try {
//     const userId = req.params.id;

//     // Fetch the user from the database by userId
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Return the user information (name, email, balance)
//     res.status(200).json({
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       balance: user.balance,
//       photo:user.photo
//     });
//   } catch (error) {
//     console.error("Get User Info Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// // API to place a bet and deduct balance
// app.post("/placeBet", async (req, res) => {
//   // log("Place Bet API called",req.body);
//   try {

//     const { userId, betAmount } = req.body;
//  if (!userId || !betAmount) {
//    return res.status(400).json({ error: "Missing userId or betAmount" });
//  }
//     // Fetch the user from the database
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Check if the user has enough balance
//     if (user.balance < parseInt(betAmount)) {
//       return res.status(400).json({ error: "Insufficient balance" });
//     }

//     // Deduct the bet amount from the user's balance
//     user.balance -= parseInt(betAmount);
//     await user.save();

//     // Return the success response
//     res.status(200).json({
//       message: "Bet placed successfully",
//       user: {
//         id: user._id,
//         name: user.name,
//         balance: user.balance,
//       },
//     });
//   } catch (error) {
//     console.error("Place Bet Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });



// // Start server using dynamic port
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });
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

// --- Global Variables ---
let roundNumber = 1;
let previousIndex = null;

// --- Init Round Number from DB ---
const initRoundNumber = async () => {
  const lastRound = await Round.findOne().sort({ roundNumber: -1 });
  roundNumber = lastRound ? lastRound.roundNumber + 1 : 1;
  console.log("🔁 Starting from round:", roundNumber);
};
initRoundNumber();

// --- Round Generator: Emit every 30 seconds ---
setInterval(async () => {
  let winCardIndex;

  do {
    winCardIndex = Math.floor(Math.random() * 8) + 51; // random index between 51-58
  } while (winCardIndex === previousIndex);

  previousIndex = winCardIndex;

  const matchedFruit = await Fruit.findOne({ winCardIndex });
  if (!matchedFruit) {
    return console.error("❌ Fruit not found for index:", winCardIndex);
  }

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

  console.log("🎯 New Round:", data);
  io.emit("new-round", data);
  roundNumber++;
}, 30000);

// --- Daily Reset at 12:00 AM ---
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("⏰ Resetting round count and deleting all old rounds...");
    await Round.deleteMany({});
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

// --- Start Server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
