const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const GlobalConfig = require('../models/GlobalConfig');

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, 'config_' + Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage });

// Get Global Config
router.get('/', async (req, res) => {
  try {
    let config = await GlobalConfig.findOne({ key: 'main' });
    if (!config) {
      config = new GlobalConfig({ key: 'main' });
      await config.save();
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Global Config
router.post('/update', upload.fields([
  { name: 'cardBack', maxCount: 1 },
  { name: 'playerField', maxCount: 1 }
]), async (req, res) => {
  try {
    let config = await GlobalConfig.findOne({ key: 'main' });
    if (!config) config = new GlobalConfig({ key: 'main' });

    if (req.files['cardBack']) {
      config.cardBackUrl = `/uploads/${req.files['cardBack'][0].filename}`;
    }
    if (req.files['playerField']) {
      config.playerFieldUrl = `/uploads/${req.files['playerField'][0].filename}`;
    }

    config.updatedAt = Date.now();
    await config.save();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
