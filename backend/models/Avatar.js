const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  enabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('Avatar', avatarSchema);
