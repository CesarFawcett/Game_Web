const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: false, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'player'], default: 'player' },
  credits: { type: Number, default: 2500 },
  inventory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  discoveredCards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  deck: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
  ownedAvatars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Avatar' }],
  equippedAvatar: { type: String, default: '/default.png' },
  ownedBoards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Board' }],
  equippedBoard: { type: String, default: '' },
  equippedFieldImage: { type: String, default: '' },
  equippedTexture: { type: String, default: '' },
  equippedCardBack: { type: String, default: '' },
  defeatedEnemies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enemy' }],
  unlockedEnemyAvatars: [{ type: String }],
  // Missions & Weekly Progress
  dailyWins: { type: Number, default: 0 },
  weeklyPoints: { type: Number, default: 0 },
  lastDailyReset: { type: Date, default: Date.now },
  lastWeeklyReset: { type: Date, default: Date.now },
  claimedMissions: [{ type: String }], // 'win1', 'win5', 'win15'
  claimedChests: [{ type: Number }],   // 5, 7, 9
  seenOnboarding: { type: [String], default: [] },
  duelsUnlocked: { type: Boolean, default: false },
  duelCooldownUntil: { type: Date, default: null },
  // Ranking & Streak
  rankingPoints: { type: Number, default: 0 },
  lastLogin: { type: Date, default: Date.now },
  connectionStreak: { type: Number, default: 1 },
  lastRankingRewardClaimed: { type: Date, default: null },
  lastStreakRewardClaimedAt: { type: Date, default: null },
  seasonRewardClaimed: { type: Boolean, default: false },
  freePacksCount: { type: Number, default: 0 },
});

module.exports = mongoose.model('User', UserSchema);
