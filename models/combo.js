 const mongoose = require("mongoose");

const comboSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  slot: {
    type: Number, // 1, 2, or 3
    required: true
  },
  powerUnitWeight: Number,
  trailerWeight: Number,
  powerUnitGVWR: Number,
  trailerGVWR: Number
}, { timestamps: true });

module.exports = mongoose.model("Combo", comboSchema);
