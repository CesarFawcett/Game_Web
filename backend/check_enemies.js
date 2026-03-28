const mongoose = require('mongoose');
const Enemy = require('./models/Enemy');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/game_web';

async function checkEnemies() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('--- ENEMIES LIST ---');
    const enemies = await Enemy.find().sort({ rankIndex: 1 });
    enemies.forEach(e => {
      console.log(`Name: ${e.name}, RankIndex: ${e.rankIndex}, ID: ${e._id}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkEnemies();
