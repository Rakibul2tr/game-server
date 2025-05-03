const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

mongoose
  .connect(
    "mongodb+srv://rakibul2tr:rdUYI4rm70R2YsS7@cluster0.mnjws4o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
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
  createdAt: { type: Date, default: Date.now },
});

const Round = mongoose.model("Round", roundSchema);

// Emit round every 30s
let roundNumber = 1;
let previousIndex = null;
setInterval(async () => {
  let winCardIndex;
   do {
     winCardIndex = Math.floor(Math.random() * 8) + 51; // 51 to 58
   } while (winCardIndex === previousIndex);

   previousIndex = winCardIndex;

   const round = new Round({ winCardIndex, roundNumber });
  await round.save();
  const data = {
    winCardIndex,
    roundNumber,
    time: new Date().toISOString(),
  };
    console.log("Emitting new round data:", data); 

   io.emit("new-round", data);

  roundNumber++;
}, 10000);

// Start server
server.listen(3000, () => {
  console.log("Server running on port 3000");
});
