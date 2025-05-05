// models/Fruit.js
const mongoose = require("mongoose");

const fruitSchema = new mongoose.Schema({
  name: String,
  winCardIndex: Number,
  count: Number,
  image: String,
});

const Fruit = mongoose.model("Fruit", fruitSchema);
module.exports = Fruit;
