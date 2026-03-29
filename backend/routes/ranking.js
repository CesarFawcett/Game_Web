const express = require('express');
const router = express.Router();
const User = require('../models/User');
const GlobalConfig = require('../models/GlobalConfig');
const Pack = require('../models/Pack');

// Helper to get season info
const getSeasonInfo = async () => {
    let config = await GlobalConfig.findOne({ key: 'main' });
    if (!config) {
        config = new GlobalConfig({ key: 'main', seasonStartDate: new Date() });
        await config.save();
    }

    const now = new Date();
    const start = new Date(config.seasonStartDate);
    const diffTime = Math.abs(now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Auto-reset season if 30 days passed
    if (diffDays >= 30) {
        config.seasonStartDate = now;
        await config.save();
        // Reset all users ranking points
        await User.updateMany({}, { rankingPoints: 0, lastRankingRewardClaimed: null, seasonRewardClaimed: false });
        return { day: 1, resetHappened: true };
    }

    return { day: diffDays + 1, resetHappened: false };
};

// GET /top - Get Top 10 players
router.get('/top', async (req, res) => {
    try {
        const { day } = await getSeasonInfo();
        const topPlayers = await User.find({})
            .sort({ rankingPoints: -1 })
            .limit(10)
            .select('username rankingPoints equippedAvatar');

        res.json({ day, topPlayers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /claim-daily - Claim manual ranking reward
router.post('/claim-daily', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { day } = await getSeasonInfo();
        // Removed day < 4 restriction as per user request

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const lastClaimStr = user.lastRankingRewardClaimed ? user.lastRankingRewardClaimed.toISOString().split('T')[0] : null;

        if (todayStr === lastClaimStr) {
            return res.status(400).json({ error: 'Ya has reclamado tu recompensa de hoy.' });
        }

        // Determine rank and reward
        const allPlayers = await User.find({}).sort({ rankingPoints: -1 }).select('username');
        const rank = allPlayers.findIndex(p => p.username === username) + 1;

        let reward = 50;
        if (rank === 1) reward = 2000;
        else if (rank === 2) reward = 1200;
        else if (rank === 3) reward = 600;
        else if (rank >= 4 && rank <= 10) reward = 250;

        user.credits += reward;
        user.lastRankingRewardClaimed = now;
        await user.save();

        res.json({ success: true, reward, newCredits: user.credits, rank });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /claim-streak - Claim manual connection reward
router.post('/claim-streak', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.connectionStreak < 5 || user.connectionStreak % 5 !== 0) {
            return res.status(400).json({ error: 'Aún no has alcanzado una racha múltiple de 5 días.' });
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const lastClaimAt = user.lastStreakRewardClaimedAt ? user.lastStreakRewardClaimedAt.toISOString().split('T')[0] : null;

        if (todayStr === lastClaimAt) {
            return res.status(400).json({ error: 'Ya has reclamado tu premio de racha hoy.' });
        }

        const pack = await Pack.findOne({ name: /Antigüedad|Antiguedad/i }).populate('cardPool.cardId');
        if (!pack) {
            return res.status(404).json({ error: 'Paquete de Antigüedad no encontrado. Contacta al admin.' });
        }

        // Give the pack contents directly (simple approach) or add as "inventory item"?
        // Current system in shop.js uses immediate opening.
        const rewardCards = [];
        const pool = pack.cardPool;

        const drawCard = () => {
            const rand = Math.random() * 100;
            let cumulative = 0;
            for (let item of pool) {
                cumulative += item.dropRate;
                if (rand <= cumulative) return item.cardId;
            }
            return pool[pool.length - 1].cardId;
        };

        for (let i = 0; i < pack.cardsPerPack; i++) {
            const pulledCard = drawCard();
            rewardCards.push(pulledCard);
            user.inventory.push(pulledCard._id);
            user.discoveredCards.addToSet(pulledCard._id);
        }

        user.lastStreakRewardClaimedAt = now;
        await user.save();

        res.json({ success: true, rewardCards });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
