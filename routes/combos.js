 const path = require('path');
console.log('LOOKING FOR:', path.resolve(__dirname, '../middleware/authMiddleware.js'));
console.log('FILE EXISTS:', require('fs').existsSync(path.resolve(__dirname, '../middleware/authMiddleware.js')));
 
 const express = require("express");
const router = express.Router();
const Combo = require("../models/combo");
const authenticateToken = require("../middleware/authMiddleware");
console.log('✅ Loaded authMiddleware:', typeof authenticateToken);


// GET /api/combos - Get all combos for the logged-in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const combos = await Combo.find({ userId: req.user.userId });
    res.json(combos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load combos" });
  }
});

// POST /api/combos - Save or update a combo for a user
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { slot, powerUnitWeight, trailerWeight, powerUnitGVWR, trailerGVWR } = req.body;

    if (![1, 2, 3].includes(slot)) {
      return res.status(400).json({ message: "Invalid slot. Must be 1, 2, or 3." });
    }

    const existing = await Combo.findOne({ userId: req.user.userId, slot });

    if (existing) {
      existing.powerUnitWeight = powerUnitWeight;
      existing.trailerWeight = trailerWeight;
      existing.powerUnitGVWR = powerUnitGVWR;
      existing.trailerGVWR = trailerGVWR;
      await existing.save();
      return res.json({ message: `Combo slot ${slot} updated.` });
    } else {
      const newCombo = new Combo({
        userId: req.user.userId,
        slot,
        powerUnitWeight,
        trailerWeight,
        powerUnitGVWR,
        trailerGVWR
      });
      await newCombo.save();
      return res.status(201).json({ message: `Combo slot ${slot} created.` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save combo" });
  }
});

// PUT /api/combos/:id - Update a combo by its ID
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const updated = await Combo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Combo not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update combo" });
  }
});

// DELETE /api/combos/:id - Delete a combo by its ID
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const deleted = await Combo.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    if (!deleted) return res.status(404).json({ message: "Combo not found" });
    res.json({ message: "Combo deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete combo" });
  }
});

module.exports = router;
