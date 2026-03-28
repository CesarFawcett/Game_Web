const User = require('./models/User');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/game_web';

async function seedUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const users = [
      { username: 'Duelo', password: '123', role: 'player', credits: 1000 },
      { username: 'Admin', password: '123', role: 'admin', credits: 999999 }
    ];

    for (const u of users) {
      const exists = await User.findOne({ username: u.username });
      if (!exists) {
        await new User(u).save();
        console.log(`User ${u.username} created`);
      } else {
        console.log(`User ${u.username} already exists`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedUsers();
