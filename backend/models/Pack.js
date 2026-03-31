const mongoose = require('mongoose');

const packSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true
  },
  price: { 
    type: Number, 
    required: true 
  },
  imageUrl: { 
    type: String, 
    default: '/uploads/default_pack.png' 
  },
  cardsPerPack: { 
    type: Number, 
    default: 3 
  },
  cardPool: [{
    cardId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Card',
      required: true
    },
    dropRate: { 
      type: Number,
      required: true
    }
  }],
  enabled: { 
    type: Boolean, 
    default: true 
  },
  packId: { 
    type: Number, 
    unique: true, 
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Pack', packSchema);
