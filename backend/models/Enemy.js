const mongoose = require('mongoose');

const enemySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true
  },
  rankIndex: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  deck: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Card' 
  }],
  hp: { 
    type: Number, 
    default: 2000 
  },
  imageUrl: { 
    type: String, 
    default: '/uploads/default_enemy.png' 
  },
  cardBackUrl: {
    type: String,
    default: ''
  },
  fieldImageUrl: {
    type: String,
    default: ''
  },
  fieldTextureUrl: {
    type: String,
    default: ''
  },
  enabled: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

module.exports = mongoose.model('Enemy', enemySchema);
