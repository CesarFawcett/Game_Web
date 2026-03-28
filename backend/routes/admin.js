const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Card = require('../models/Card');
const Board = require('../models/Board');
const User = require('../models/User');
const Pack = require('../models/Pack');
const Avatar = require('../models/Avatar');
const ChestConfig = require('../models/ChestConfig');

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Aceptar PNG y JPEG
  if (
     (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') && 
     (path.extname(file.originalname).toLowerCase() === '.png' || path.extname(file.originalname).toLowerCase() === '.jpeg' || path.extname(file.originalname).toLowerCase() === '.jpg')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes en formato .png o .jpg'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit for high-res boards
});

// Admin Login (Simplified for this task)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, user: { username: 'admin', role: 'admin' } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get unique card backs
router.get('/card-backs', async (req, res) => {
  try {
    const backs = await Card.distinct('cardBackImageUrl');
    const filteredBacks = backs.filter(b => b && b.trim() !== '');
    res.json(filteredBacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Card
router.post('/cards', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'cardBackImage', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, type, description, attack, defense, ability, rarity, existingCardBack } = req.body;
    const imageUrl = req.files && req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : '';
    
    let cardBackImageUrl = '';
    if (req.files && req.files['cardBackImage']) {
      cardBackImageUrl = `/uploads/${req.files['cardBackImage'][0].filename}`;
    } else if (existingCardBack) {
      cardBackImageUrl = existingCardBack;
    }

    const newCard = new Card({ name, type, description, attack, defense, ability, rarity, imageUrl, cardBackImageUrl });
    await newCard.save();
    res.status(201).json(newCard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Card
router.put('/cards/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'cardBackImage', maxCount: 1 }]), async (req, res) => {
  try {
    const { name, type, description, attack, defense, ability, rarity, existingCardBack } = req.body;
    const updateData = { name, type, description, attack, defense, ability, rarity };
    
    if (req.files && req.files['image']) {
      updateData.imageUrl = `/uploads/${req.files['image'][0].filename}`;
    }
    
    if (req.files && req.files['cardBackImage']) {
      updateData.cardBackImageUrl = `/uploads/${req.files['cardBackImage'][0].filename}`;
    } else if (existingCardBack) {
      updateData.cardBackImageUrl = existingCardBack;
    }

    const card = await Card.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all cards
router.get('/cards', async (req, res) => {
  try {
    const cards = await Card.find();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Card
router.delete('/cards/:id', async (req, res) => {
  try {
    await Card.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Carta eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Board
router.post('/boards', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'fieldImage', maxCount: 1 },
  { name: 'textureImage', maxCount: 1 },
  { name: 'cardBackImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, price, enabled } = req.body;
    const imageUrl = req.files && req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : '';
    const fieldImageUrl = req.files && req.files['fieldImage'] ? `/uploads/${req.files['fieldImage'][0].filename}` : '';
    const textureUrl = req.files && req.files['textureImage'] ? `/uploads/${req.files['textureImage'][0].filename}` : '';
    const cardBackUrl = req.files && req.files['cardBackImage'] ? `/uploads/${req.files['cardBackImage'][0].filename}` : '';
    
    const newBoard = new Board({ 
      name, price, 
      enabled: enabled === 'true' || enabled === true, 
      imageUrl, fieldImageUrl, textureUrl, cardBackUrl 
    });
    await newBoard.save();
    res.status(201).json(newBoard);
  } catch (err) {
    console.error("Board POST error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update Board
router.put('/boards/:id', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'fieldImage', maxCount: 1 },
  { name: 'textureImage', maxCount: 1 },
  { name: 'cardBackImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, price, enabled } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (enabled !== undefined) updateData.enabled = (enabled === 'true' || enabled === true);
    
    if (req.files) {
      if (req.files['image']) updateData.imageUrl = `/uploads/${req.files['image'][0].filename}`;
      if (req.files['fieldImage']) updateData.fieldImageUrl = `/uploads/${req.files['fieldImage'][0].filename}`;
      if (req.files['textureImage']) updateData.textureUrl = `/uploads/${req.files['textureImage'][0].filename}`;
      if (req.files['cardBackImage']) updateData.cardBackUrl = `/uploads/${req.files['cardBackImage'][0].filename}`;
    }
    
    const board = await Board.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(board);
  } catch (err) {
    console.error("Board PUT error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all boards
router.get('/boards', async (req, res) => {
  try {
    const boards = await Board.find();
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete board
router.delete('/boards/:id', async (req, res) => {
  try {
    await Board.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PACK ROUTES ---

// Create Pack
router.post('/packs', upload.single('image'), async (req, res) => {
  try {
    const { name, price, cardsPerPack, cardPool, enabled } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/default_pack.png';
    const parsedPool = cardPool ? JSON.parse(cardPool) : [];
    
    const newPack = new Pack({ name, price, cardsPerPack, cardPool: parsedPool, enabled: enabled === 'true' || enabled === true, imageUrl });
    await newPack.save();
    res.status(201).json(newPack);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Pack
router.put('/packs/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, price, cardsPerPack, cardPool, enabled } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (cardsPerPack) updateData.cardsPerPack = cardsPerPack;
    if (cardPool) updateData.cardPool = JSON.parse(cardPool);
    if (enabled !== undefined) updateData.enabled = (enabled === 'true' || enabled === true);
    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;
    
    const pack = await Pack.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(pack);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all packs
router.get('/packs', async (req, res) => {
  try {
    const packs = await Pack.find().populate('cardPool.cardId');
    res.json(packs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete pack
router.delete('/packs/:id', async (req, res) => {
  try {
    await Pack.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AVATAR ROUTES ---

// Create Avatar
router.post('/avatars', function(req, res, next) {
  upload.single('image')(req, res, function(err) {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { name, price, enabled } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '/default.png';
    const newAvatar = new Avatar({ name, price, enabled: enabled === 'true' || enabled === true, imageUrl });
    await newAvatar.save();
    res.status(201).json(newAvatar);
  } catch (err) {
    console.error("Avatar creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update Avatar
router.put('/avatars/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, price, enabled } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (enabled !== undefined) updateData.enabled = (enabled === 'true' || enabled === true);
    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;
    
    const avatar = await Avatar.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(avatar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all avatars
router.get('/avatars', async (req, res) => {
  try {
    const avatars = await Avatar.find();
    res.json(avatars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete avatar
router.delete('/avatars/:id', async (req, res) => {
  try {
    await Avatar.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CHEST CONFIG ROUTES ---

// Get all chest configs
router.get('/chests', async (req, res) => {
  try {
    const chests = await ChestConfig.find().populate('cardsPrizes');
    res.json(chests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or Update Chest Config
router.post('/chests', async (req, res) => {
  try {
    const { milestone, coinsPrizes, cardsPrizes } = req.body;
    const config = await ChestConfig.findOneAndUpdate(
      { milestone },
      { milestone, coinsPrizes, cardsPrizes, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed Chests
router.post('/seed-chests', async (req, res) => {
  const defaults = [
    { milestone: 5, coinsPrizes: 100, cardsPrizes: [] },
    { milestone: 7, coinsPrizes: 250, cardsPrizes: [] },
    { milestone: 9, coinsPrizes: 500, cardsPrizes: [] }
  ];
  try {
    for (const d of defaults) {
      await ChestConfig.findOneAndUpdate({ milestone: d.milestone }, d, { upsert: true });
    }
    res.json({ success: true, message: 'Chests seeded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
