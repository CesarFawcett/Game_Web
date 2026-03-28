const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String },
  fieldImageUrl: { type: String },
  textureUrl: { type: String },
  cardBackUrl: { type: String },
  price: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Board', BoardSchema);
