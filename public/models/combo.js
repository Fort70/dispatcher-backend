const mongoose = require("mongoose");

const comboSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  slot: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  powerUnitWeight: Number,
  trailerWeight: Number,
  powerUnitGVWR: Number,
  trailerGVWR: Number
}, { timestamps: true });

module.exports = mongoose.model("Combo", comboSchema);


