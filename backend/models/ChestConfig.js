const mongoose = require('mongoose');

const ChestConfigSchema = new mongoose.Schema({
  milestone: { type: Number, required: true, unique: true }, // 5, 7, 9
  coinsPrizes: { type: Number, default: 0 },
  cardsPrizes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChestConfig', ChestConfigSchema);
