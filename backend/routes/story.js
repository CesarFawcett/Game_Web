const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Enemy = require('../models/Enemy');
const User = require('../models/User');

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'enemy_' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get all enemies (Admin: all, Player: only enabled)
router.get('/enemies', async (req, res) => {
  try {
    const isAdmin = req.query.role === 'admin';
    const filter = isAdmin ? {} : { enabled: true };
    const enemies = await Enemy.find(filter).sort({ rankIndex: 1 }).populate('deck');
    res.json(enemies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'cardBack', maxCount: 1 },
  { name: 'field', maxCount: 1 },
  { name: 'fieldTexture', maxCount: 1 }
]);

// Create new Enemy (Admin only)
router.post('/enemies', uploadFields, async (req, res) => {
  try {
    const { name, hp, enabled, imageString, cardBackString, fieldString, fieldTextureString } = req.body;
    const imageUrl = imageString ? imageString : (req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : '/uploads/default_enemy.png');
    const cardBackUrl = cardBackString ? cardBackString : (req.files['cardBack'] ? `/uploads/${req.files['cardBack'][0].filename}` : '');
    const fieldImageUrl = fieldString ? fieldString : (req.files['field'] ? `/uploads/${req.files['field'][0].filename}` : '');
    const fieldTextureUrl = fieldTextureString ? fieldTextureString : (req.files['fieldTexture'] ? `/uploads/${req.files['fieldTexture'][0].filename}` : '');
    
    // Get next rankIndex
    const lastEnemy = await Enemy.findOne().sort({ rankIndex: -1 });
    const rankIndex = lastEnemy ? lastEnemy.rankIndex + 1 : 0;

    const newEnemy = new Enemy({ name, hp, enabled, imageUrl, cardBackUrl, fieldImageUrl, fieldTextureUrl, rankIndex, deck: [] });
    await newEnemy.save();
    res.status(201).json(newEnemy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update enemy (Admin only)
router.put('/enemies/:id', uploadFields, async (req, res) => {
  try {
    const { name, deck, hp, enabled, imageString, cardBackString, fieldString, fieldTextureString } = req.body;
    const enemy = await Enemy.findById(req.params.id);
    if (!enemy) return res.status(404).json({ message: 'Enemigo no encontrado' });

    if (name) enemy.name = name;
    if (deck) {
        enemy.deck = Array.isArray(deck) ? deck : JSON.parse(deck);
    }
    if (hp !== undefined) enemy.hp = hp;
    if (enabled !== undefined) enemy.enabled = typeof enabled === 'string' ? enabled === 'true' : enabled;
    
    if (imageString) enemy.imageUrl = imageString;
    else if (req.files['image']) enemy.imageUrl = `/uploads/${req.files['image'][0].filename}`;
    
    if (cardBackString) enemy.cardBackUrl = cardBackString;
    else if (req.files['cardBack']) enemy.cardBackUrl = `/uploads/${req.files['cardBack'][0].filename}`;
    
    if (fieldString) enemy.fieldImageUrl = fieldString;
    else if (req.files['field']) enemy.fieldImageUrl = `/uploads/${req.files['field'][0].filename}`;
    
    if (fieldTextureString) enemy.fieldTextureUrl = fieldTextureString;
    else if (req.files['fieldTexture']) enemy.fieldTextureUrl = `/uploads/${req.files['fieldTexture'][0].filename}`;

    await enemy.save();
    res.json(enemy);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Seed Initial Enemies
router.post('/seed', async (req, res) => {
  const initialEnemies = [
    { name: 'Madera', rankIndex: 0, hp: 1000 },
    { name: 'Bronce', rankIndex: 1, hp: 1500 },
    { name: 'Plata', rankIndex: 2, hp: 2000 },
    { name: 'Oro', rankIndex: 3, hp: 3000 },
    { name: 'Diamante', rankIndex: 4, hp: 5000 },
    { name: 'Leyenda', rankIndex: 5, hp: 10000, enabled: false }
  ];

  try {
    for (const e of initialEnemies) {
      await Enemy.findOneAndUpdate({ rankIndex: e.rankIndex }, e, { upsert: true, new: true });
    }
    res.json({ message: 'Enemies seeded successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Enemy (Admin only)
router.delete('/enemies/:id', async (req, res) => {
  try {
    const enemy = await Enemy.findByIdAndDelete(req.params.id);
    if (!enemy) return res.status(404).json({ message: 'Enemigo no encontrado' });
    res.json({ success: true, message: 'Enemigo eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /victory - Award credits and avatar on story win
router.post('/victory', async (req, res) => {
  try {
    const { username, enemyId } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const enemy = await Enemy.findById(enemyId).populate('deck');
    if (!enemy) return res.status(404).json({ error: 'Enemy not found' });

    // --- RARITY WEIGHTS FOR DROPS ---
    const RARITY_WEIGHTS = {
      'Común': 100,
      'Rara': 40,
      'Épica': 15,
      'Legendaria': 5,
      'Mítica': 2,
      'Divina': 1,
      'Ancestral': 0.5,
      'Inmortal': 0.2,
      'Cósmica': 0.1
    };

    // Always award 150 credits
    user.credits += 150;

    let firstTime = false;
    let rewardAvatar = null;
    let rewardCard = null;

    // --- RARITY-BASED DROP CHANCE ---
    if (Math.random() <= 0.5 && enemy.deck && enemy.deck.length > 0) {
      // Get only unique cards from the deck
      const uniqueDeck = [];
      const seenIds = new Set();
      enemy.deck.forEach(card => {
        if (card && card._id && !seenIds.has(card._id.toString())) {
          uniqueDeck.push(card);
          seenIds.add(card._id.toString());
        }
      });

      if (uniqueDeck.length > 0) {
        // Calculate total weight of unique cards
        const totalWeight = uniqueDeck.reduce((sum, card) => {
          return sum + (RARITY_WEIGHTS[card.rarity] || 100);
        }, 0);

        // Weighted Random Selection
        let randomValue = Math.random() * totalWeight;
        for (const card of uniqueDeck) {
          const weight = RARITY_WEIGHTS[card.rarity] || 100;
          if (randomValue < weight) {
            rewardCard = card;
            break;
          }
          randomValue -= weight;
        }
        
        if (rewardCard) {
          // Add to inventory and discovered set
          user.inventory.push(rewardCard._id);
          user.discoveredCards.addToSet(rewardCard._id);
        }
      }
    }

    // First time defeating this enemy -> unlock their avatar
    if (!user.defeatedEnemies.some(id => id.toString() === enemyId)) {
      user.defeatedEnemies.push(enemyId);
      if (enemy.imageUrl && !user.unlockedEnemyAvatars.includes(enemy.imageUrl)) {
        user.unlockedEnemyAvatars.push(enemy.imageUrl);
        rewardAvatar = enemy.imageUrl;
      }
      firstTime = true;
    }

    await user.save();

    res.json({
      success: true,
      newCredits: user.credits,
      firstTime,
      rewardAvatar,
      rewardCard,
      unlockedEnemyAvatars: user.unlockedEnemyAvatars,
      defeatedEnemies: user.defeatedEnemies,
      duelsUnlocked: user.duelsUnlocked
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
