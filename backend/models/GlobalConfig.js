const mongoose = require('mongoose');

const GlobalConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'main' }, // Single config entry
  cardBackUrl: { type: String, default: 'https://media.istockphoto.com/id/1310620227/vector/card-back-side-with-classic-pattern.jpg?s=612x612&w=0&k=20&c=K6q3X_F1m-6_7h8_K7t1fW3R_W_Jv7J_R0_V_CgYc_g=' },
  playerFieldUrl: { type: String, default: '' },
  enemyFieldUrl: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
  seasonStartDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GlobalConfig', GlobalConfigSchema);
