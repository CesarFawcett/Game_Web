const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ChestConfig = require('../models/ChestConfig');
const Card = require('../models/Card');

// Helper to check and reset missions
const checkResets = async (user) => {
  const now = new Date();
  let changed = false;

  // Daily Reset (Check if day is different)
  const lastDaily = new Date(user.lastDailyReset);
  if (now.toDateString() !== lastDaily.toDateString()) {
    user.dailyWins = 0;
    user.claimedMissions = [];
    user.lastDailyReset = now;
    changed = true;
  }

  // Weekly Reset (Check if more than 7 days or different week)
  // Simple check: if Monday has passed since last reset
  const lastWeekly = new Date(user.lastWeeklyReset);
  const diffTime = Math.abs(now - lastWeekly);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays >= 7) {
    user.weeklyPoints = 0;
    user.claimedChests = [];
    user.lastWeeklyReset = now;
    changed = true;
  }

  if (changed) await user.save();
  return user;
};

// GET /status/:username
router.get('/status/:username', async (req, res) => {
  try {
    let user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user = await checkResets(user);
    
    // Milestones and rewards
    const missions = [
      { id: 'win1', name: 'Vencedor de la historia', goal: 1, prize: 10, points: 1 },
      { id: 'win5', name: 'Vencedor renombrado', goal: 5, prize: 20, points: 1 },
      { id: 'win15', name: 'Nacido para ganar', goal: 15, prize: 50, points: 1 }
    ];

    res.json({
      dailyWins: user.dailyWins,
      weeklyPoints: user.weeklyPoints,
      claimedMissions: user.claimedMissions,
      claimedChests: user.claimedChests,
      missions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /update-win
router.post('/update-win', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.dailyWins += 1;
    await user.save();
    res.json({ success: true, dailyWins: user.dailyWins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /claim-mission
router.post('/claim-mission', async (req, res) => {
  try {
    const { username, missionId } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.claimedMissions.includes(missionId)) {
      return res.status(400).json({ error: 'Misión ya reclamada' });
    }

    const missions = {
      'win1': { goal: 1, prize: 10, points: 1 },
      'win5': { goal: 5, prize: 20, points: 1 },
      'win15': { goal: 15, prize: 50, points: 1 }
    };

    const mission = missions[missionId];
    if (!mission) return res.status(400).json({ error: 'Misión inválida' });

    if (user.dailyWins < mission.goal) {
      return res.status(400).json({ error: 'Misión no completada' });
    }

    user.credits += mission.prize;
    user.weeklyPoints += mission.points;
    user.claimedMissions.push(missionId);
    await user.save();

    res.json({ success: true, newCredits: user.credits, newPoints: user.weeklyPoints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /claim-chest
router.post('/claim-chest', async (req, res) => {
  try {
    const { username, milestone } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.claimedChests.includes(milestone)) {
      return res.status(400).json({ error: 'Cofre ya reclamado' });
    }

    if (user.weeklyPoints < milestone) {
      return res.status(400).json({ error: 'Puntos insuficientes' });
    }

    const config = await ChestConfig.findOne({ milestone }).populate('cardsPrizes');
    if (!config) return res.status(404).json({ error: 'Configuración de cofre no encontrada' });

    user.credits += (config.coinsPrizes || 0);
    if (config.cardsPrizes && config.cardsPrizes.length > 0) {
      config.cardsPrizes.forEach(card => {
        user.inventory.push(card._id);
        user.discoveredCards.addToSet(card._id);
      });
    }
    
    user.claimedChests.push(milestone);
    await user.save();

    res.json({ 
      success: true, 
      newCredits: user.credits, 
      rewardCards: config.cardsPrizes,
      claimedChests: user.claimedChests 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
