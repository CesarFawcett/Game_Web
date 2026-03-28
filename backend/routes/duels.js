const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Card = require('../models/Card');

// POST /api/duels/bet-result - Transfer cards after a duel
router.post('/bet-result', async (req, res) => {
  const { winnerName, loserName, winnerBetId, loserBetId } = req.body;
  if (!loserBetId) return res.status(400).json({ success: false, message: 'Falta ID de la carta apostada' });

  try {
    // 1. Find loser and remove ONE copy
    const loserDoc = await User.findOne({ username: loserName });
    if (loserDoc) {
      // Remove from inventory
      const invIdx = loserDoc.inventory.findIndex(id => String(id) === String(loserBetId));
      if (invIdx !== -1) {
        loserDoc.inventory.splice(invIdx, 1);
        // Important: Tell Mongoose the array changed
        loserDoc.markModified('inventory');
      }
      
      // Remove from deck (all decks this user might have)
      const deckIdx = loserDoc.deck.findIndex(id => String(id) === String(loserBetId));
      if (deckIdx !== -1) {
        loserDoc.deck.splice(deckIdx, 1);
        loserDoc.markModified('deck');
      }
      
      await loserDoc.save();
    }

    // 2. Add ONE copy to winner
    await User.findOneAndUpdate(
      { username: winnerName },
      { 
        $push: { inventory: loserBetId },
        $addToSet: { discoveredCards: loserBetId },
        $inc: { credits: 200 }
      }
    );

    const stolenCard = await Card.findById(loserBetId);

    res.json({
      success: true,
      message: 'Transferencia de botín completada',
      stolenCard: stolenCard
    });

  } catch (err) {
    console.error("Loot transfer error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
