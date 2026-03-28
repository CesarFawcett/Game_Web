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
    const { name, hp, enabled } = req.body;
    const imageUrl = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : '/uploads/default_enemy.png';
    const cardBackUrl = req.files['cardBack'] ? `/uploads/${req.files['cardBack'][0].filename}` : '';
    const fieldImageUrl = req.files['field'] ? `/uploads/${req.files['field'][0].filename}` : '';
    const fieldTextureUrl = req.files['fieldTexture'] ? `/uploads/${req.files['fieldTexture'][0].filename}` : '';
    
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
    const { name, deck, hp, enabled } = req.body;
    const enemy = await Enemy.findById(req.params.id);
    if (!enemy) return res.status(404).json({ message: 'Enemigo no encontrado' });

    if (name) enemy.name = name;
    if (deck) {
        enemy.deck = Array.isArray(deck) ? deck : JSON.parse(deck);
    }
    if (hp !== undefined) enemy.hp = hp;
    if (enabled !== undefined) enemy.enabled = typeof enabled === 'string' ? enabled === 'true' : enabled;
    
    if (req.files['image']) enemy.imageUrl = `/uploads/${req.files['image'][0].filename}`;
    if (req.files['cardBack']) enemy.cardBackUrl = `/uploads/${req.files['cardBack'][0].filename}`;
    if (req.files['field']) enemy.fieldImageUrl = `/uploads/${req.files['field'][0].filename}`;
    if (req.files['fieldTexture']) enemy.fieldTextureUrl = `/uploads/${req.files['fieldTexture'][0].filename}`;

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

    const enemy = await Enemy.findById(enemyId);
    if (!enemy) return res.status(404).json({ error: 'Enemy not found' });

    // Always award 150 credits
    user.credits += 150;

    let firstTime = false;
    let rewardAvatar = null;

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
      unlockedEnemyAvatars: user.unlockedEnemyAvatars,
      defeatedEnemies: user.defeatedEnemies,
      duelsUnlocked: user.duelsUnlocked
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
