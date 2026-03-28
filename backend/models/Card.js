const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Monster', 'Spell', 'Trap'], default: 'Monster' },
  description: { type: String },
  attack: { type: Number, default: 0 },
  defense: { type: Number, default: 0 },
  ability: { 
    type: String, 
    enum: ['Veneno', 'Fuego', 'Hielo', 'Ninguno', 'Doble Ataque', 'Daño Perforante', 'Robo de Vida', 'Putrefacción'], 
    default: 'Ninguno' 
  },
  imageUrl: { type: String },
  rarity: { 
    type: String, 
    enum: ['Común', 'Rara', 'Épica', 'Legendaria', 'Mítica', 'Divina', 'Ancestral', 'Inmortal', 'Cósmica'], 
    default: 'Común' 
  },
  cardBackImageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Card', CardSchema);
