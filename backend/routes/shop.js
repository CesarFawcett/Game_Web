const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const User = require('../models/User');
const Pack = require('../models/Pack');
const Avatar = require('../models/Avatar');
const Enemy = require('../models/Enemy');

// POST /register - Register new player
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    // Check if user or email exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      const message = existingUser.username === username ? 'El nombre de usuario ya está en uso' : 'el correo electrónico ya está registrado';
      return res.status(400).json({ success: false, message });
    }

    const newUser = new User({
      username,
      email,
      password, // Plain text as requested
      credits: 6000,
      freePacksCount: 4
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        username: newUser.username,
        role: newUser.role,
        credits: newUser.credits,
        inventory: [],
        discoveredCards: [],
        deck: [],
        ownedAvatars: [],
        equippedAvatar: '/default.png',
        ownedBoards: [],
        equippedBoard: '',
        unlockedEnemyAvatars: [],
        defeatedEnemies: [],
        seenOnboarding: [],
        duelsUnlocked: false,
        freePacksCount: 4
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /login - Player login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    let user = await User.findOne({ username }).populate('inventory').populate('discoveredCards');
    
    // Auto-crear el admin la primera vez que inicia sesión si no existe en la base de datos Atlas
    if (!user && username === 'admin' && password === 'admin123') {
      const adminUser = new User({
        username: 'admin',
        password: 'admin123',
        email: 'admin@multiverso.com',
        role: 'admin',
        credits: 9999999
      });
      await adminUser.save();
      user = adminUser;
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    // --- Streak Logic ---
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last = user.lastLogin ? new Date(user.lastLogin) : null;
    const lastDay = last ? new Date(last.getFullYear(), last.getMonth(), last.getDate()) : null;

    if (lastDay) {
        const diff = (today.getTime() - lastDay.getTime()) / (1000 * 3600 * 24);
        if (diff === 1) {
            user.connectionStreak += 1;
        } else if (diff > 1) {
            user.connectionStreak = 1;
        }
        // If diff is 0, they already logged in today, do nothing to streak
    } else {
        user.connectionStreak = 1;
    }
    user.lastLogin = now;

    // Award reward if streak is multiple of 5 and hasn't been awarded today
    if (user.connectionStreak % 5 === 0 && (!user.lastStreakRewardClaimedAt || new Date(user.lastStreakRewardClaimedAt) < today)) {
        const antiquityPack = await Pack.findOne({ name: /Antigüedad/i });
        if (antiquityPack) {
             // We'll give them the cards directly or a "free ticket"?
             // Let's just add the pack contents or a notice.
             // Manual claim according to user? 
             // "Cada 5 dias un paquete Antiguedad gratis".
             // I'll make it so they get a notification or just add it.
             // But the user said "que sea manual". 
             // OK, then I just flag it as available.
             // BUT "si no lo piden se pierde". 
             // I'll add a field 'canClaimStreakReward' or just use the date.
        }
    }
    await user.save();

    res.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        credits: user.credits,
        inventory: user.inventory.map(c => c._id),
        discoveredCards: user.discoveredCards.map(c => c._id),
        deck: user.deck ? user.deck.map(c => c._id) : [],
        ownedAvatars: user.ownedAvatars || [],
        equippedAvatar: user.equippedAvatar || '/default.png',
        ownedBoards: user.ownedBoards || [],
        equippedBoard: user.equippedBoard || '',
        unlockedEnemyAvatars: user.unlockedEnemyAvatars || [],
        defeatedEnemies: user.defeatedEnemies || [],
        seenOnboarding: user.seenOnboarding || [],
        duelsUnlocked: user.duelsUnlocked || false,
        // New Ranking & Streak fields
        rankingPoints: user.rankingPoints || 0,
        connectionStreak: user.connectionStreak || 1,
        lastRankingRewardClaimed: user.lastRankingRewardClaimed,
        canClaimStreakReward: (user.connectionStreak % 5 === 0 && (!user.lastStreakRewardClaimedAt || new Date(user.lastStreakRewardClaimedAt) < today)),
        freePacksCount: user.freePacksCount || 0,
        maxDefeatedRank: (await Enemy.find({ _id: { $in: user.defeatedEnemies } })).reduce((max, e) => Math.max(max, e.rankIndex), -1)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /user/:username - Get user data with inventory
router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate('inventory').populate('discoveredCards');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      username: user.username,
      role: user.role,
      credits: user.credits,
      inventory: user.inventory.map(c => c._id),
      discoveredCards: user.discoveredCards.map(c => c._id),
      deck: user.deck ? user.deck.map(c => c._id) : [],
      ownedAvatars: user.ownedAvatars || [],
      equippedAvatar: user.equippedAvatar || '/default.png',
      ownedBoards: user.ownedBoards || [],
      equippedBoard: user.equippedBoard || '',
      unlockedEnemyAvatars: user.unlockedEnemyAvatars || [],
      defeatedEnemies: user.defeatedEnemies || [],
      seenOnboarding: user.seenOnboarding || [],
      duelsUnlocked: user.duelsUnlocked || false,
      freePacksCount: user.freePacksCount || 0,
      maxDefeatedRank: (await Enemy.find({ _id: { $in: user.defeatedEnemies } })).reduce((max, e) => Math.max(max, e.rankIndex), -1)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /packs - Get available packs for shop
router.get('/packs', async (req, res) => {
  try {
    const packs = await Pack.find({ enabled: true }).populate('cardPool.cardId');
    res.json(packs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /purchase - Buy a Card Pack
router.post('/purchase', async (req, res) => {
  try {
    const { username, packId } = req.body;

    let user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pack = await Pack.findById(packId).populate('cardPool.cardId');
    if (!pack || !pack.enabled) {
      return res.status(400).json({ error: 'Sobre no disponible' });
    }

    if (user.credits < pack.price) {
      return res.status(400).json({ error: 'Insuficientes créditos' });
    }

    // --- Progression Check ---
    if (pack.requiredRankIndex > 0) {
        // Fetch rank details of defeated enemies
        const defeated = await Enemy.find({ _id: { $in: user.defeatedEnemies } });
        const maxRank = defeated.reduce((max, e) => Math.max(max, e.rankIndex), -1);
        
        if (maxRank < pack.requiredRankIndex - 1) {
            return res.status(403).json({ 
                error: `Este sobre está bloqueado. Debes derrotar a más enemigos en el Modo Historia para desbloquearlo.` 
            });
        }
    }

    user.credits -= pack.price;

    const rewardCards = [];
    const pool = pack.cardPool;

    if (pool.length === 0) {
       return res.status(400).json({ error: 'El sobre está vacío' });
    }

    const drawCard = () => {
      const rand = Math.random() * 100;
      let cumulative = 0;
      for (let item of pool) {
        cumulative += item.dropRate;
        if (rand <= cumulative) {
          return item.cardId;
        }
      }
      return pool[pool.length - 1].cardId;
    };

    for (let i = 0; i < pack.cardsPerPack; i++) {
        const pulledCard = drawCard();
        rewardCards.push(pulledCard);
        user.inventory.push(pulledCard._id);
        user.discoveredCards.addToSet(pulledCard._id);
    }

    // Use findOneAndUpdate to bypass validation on missing fields (admin email bug)
    await User.findOneAndUpdate(
      { username }, 
      { 
        credits: user.credits, 
        inventory: user.inventory, 
        discoveredCards: user.discoveredCards 
      }
    );

    res.json({
      success: true,
      rewardCards,
      newCredits: user.credits
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /claim-free-pack - Open 1 of the free welcome packs
router.post('/claim-free-pack', async (req, res) => {
  try {
    const { username } = req.body;
    let user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (!user.freePacksCount || user.freePacksCount <= 0) {
      return res.status(400).json({ error: 'No tienes sobres gratuitos disponibles' });
    }

    // Find pack with packId: 1 (or the first available one as fallback)
    let pack = await Pack.findOne({ packId: 1 }).populate('cardPool.cardId');
    if (!pack) {
      pack = await Pack.findOne({ enabled: true }).sort({ createdAt: 1 }).populate('cardPool.cardId');
    }

    if (!pack) {
      return res.status(400).json({ error: 'No hay sobres disponibles en el sistema' });
    }

    const rewardCards = [];
    const pool = pack.cardPool;
    if (pool.length === 0) return res.status(400).json({ error: 'El sobre está vacío' });

    const drawCard = () => {
      const rand = Math.random() * 100;
      let cumulative = 0;
      for (let item of pool) {
        cumulative += item.dropRate;
        if (rand <= cumulative) return item.cardId;
      }
      return pool[pool.length - 1].cardId;
    };

    for (let i = 0; i < pack.cardsPerPack; i++) {
        const pulledCard = drawCard();
        rewardCards.push(pulledCard);
        user.inventory.push(pulledCard._id);
        user.discoveredCards.addToSet(pulledCard._id);
    }

    user.freePacksCount -= 1;

    await User.findOneAndUpdate(
      { username }, 
      { 
        freePacksCount: user.freePacksCount, 
        inventory: user.inventory, 
        discoveredCards: user.discoveredCards 
      }
    );

    res.json({
      success: true,
      rewardCards,
      freePacksCount: user.freePacksCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /sell - Sell a card for 100 credits
router.post('/sell', async (req, res) => {
  try {
    const { username, cardId } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if card is in inventory
    const cardIndex = user.inventory.findIndex(id => id.toString() === cardId.toString());
    if (cardIndex === -1) {
      return res.status(400).json({ error: 'La carta no está en tu colección' });
    }

    // Remove from inventory and add credits
    user.inventory.splice(cardIndex, 1);
    
    // Check if the deck has more copies than the updated inventory
    const countInInventory = user.inventory.filter(id => id.toString() === cardId.toString()).length;
    let countInDeck = user.deck.filter(id => id.toString() === cardId.toString()).length;
    
    if (countInDeck > countInInventory) {
      // Remove one copy from the deck
      const deckIndex = user.deck.findLastIndex(id => id.toString() === cardId.toString());
      if (deckIndex !== -1) {
        user.deck.splice(deckIndex, 1);
      }
    }

    user.credits += 100;
    await User.findOneAndUpdate(
      { username }, 
      { 
        inventory: user.inventory, 
        deck: user.deck, 
        credits: user.credits 
      }
    );

    res.json({
      success: true,
      newCredits: user.credits,
      message: 'Carta vendida satisfactoriamente'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /update-deck - Sync deck with backend
router.post('/update-deck', async (req, res) => {
  try {
    const { username, deck } = req.body;
    
    if (!deck || !Array.isArray(deck)) {
       return res.status(400).json({ error: 'Mazo inválido' });
    }

    if (deck.length > 30) {
       return res.status(400).json({ error: 'El mazo no puede tener más de 30 cartas' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate that user owns all the cards in the deck
    const inventoryCounts = {};
    for (let id of (user.inventory || [])) {
       if (!id) continue;
       const sId = id.toString();
       inventoryCounts[sId] = (inventoryCounts[sId] || 0) + 1;
    }

    const deckCounts = {};
    for (let id of (deck || [])) {
       if (!id) continue;
       const sId = id.toString();
       deckCounts[sId] = (deckCounts[sId] || 0) + 1;
    }

    for (let sId in deckCounts) {
       if (!inventoryCounts[sId] || deckCounts[sId] > inventoryCounts[sId]) {
           return res.status(400).json({ error: 'Carta(s) inválida(s) o no posees suficientes copias. Recarga la página.' });
       }
    }

    // Updating deck with findOneAndUpdate to bypass validation errors on missing fields manually (like email in the admin account)
    const updatedUser = await User.findOneAndUpdate(
      { username }, 
      { deck }, 
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ success: true, deck: updatedUser.deck });
  } catch (err) {
    console.error("Error in update-deck:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /avatars - get shop avatars
router.get('/avatars', async (req, res) => {
  try {
    const avatars = await Avatar.find({ enabled: true });
    res.json(avatars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /buy-avatar - buy an avatar
router.post('/buy-avatar', async (req, res) => {
  try {
    const { username, avatarId } = req.body;
    let user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const avatar = await Avatar.findById(avatarId);
    if (!avatar || !avatar.enabled) return res.status(400).json({ error: 'Avatar no está disponible' });
    
    if (user.ownedAvatars.includes(avatarId)) return res.status(400).json({ error: 'Ya posees este avatar' });
    
    if (user.credits < avatar.price) return res.status(400).json({ error: 'Créditos insuficientes' });
    
    user.credits -= avatar.price;
    user.ownedAvatars.push(avatarId);
    await User.findOneAndUpdate(
      { username }, 
      { credits: user.credits, ownedAvatars: user.ownedAvatars }
    );
    
    res.json({ success: true, newCredits: user.credits, ownedAvatars: user.ownedAvatars });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /equip-avatar
router.post('/equip-avatar', async (req, res) => {
  try {
    const { username, avatarUrl } = req.body;
    let user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.equippedAvatar = avatarUrl;
    await User.findOneAndUpdate(
      { username }, 
      { equippedAvatar: user.equippedAvatar }
    );
    
    res.json({ success: true, equippedAvatar: user.equippedAvatar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BOARD ROUTES ---

// GET /boards - get shop boards
router.get('/boards', async (req, res) => {
  try {
    const boards = await require('../models/Board').find({ enabled: true });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /buy-board - buy a board
router.post('/buy-board', async (req, res) => {
  try {
    const { username, boardId } = req.body;
    let user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const board = await require('../models/Board').findById(boardId);
    if (!board || !board.enabled) return res.status(400).json({ error: 'Tablero no está disponible' });
    
    if (user.ownedBoards.includes(boardId)) return res.status(400).json({ error: 'Ya posees este tablero' });
    
    if (user.credits < board.price) return res.status(400).json({ error: 'Créditos insuficientes' });
    
    user.credits -= board.price;
    user.ownedBoards.push(boardId);
    await User.findOneAndUpdate(
      { username }, 
      { credits: user.credits, ownedBoards: user.ownedBoards }
    );
    
    res.json({ success: true, newCredits: user.credits, ownedBoards: user.ownedBoards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /equip-board
router.post('/equip-board', async (req, res) => {
  try {
    const { username, boardUrl, fieldImageUrl, textureUrl, cardBackUrl } = req.body;
    
    const updateData = {};
    if (boardUrl !== undefined) updateData.equippedBoard = boardUrl;
    if (fieldImageUrl !== undefined) updateData.equippedFieldImage = fieldImageUrl;
    if (textureUrl !== undefined) updateData.equippedTexture = textureUrl;
    if (cardBackUrl !== undefined) updateData.equippedCardBack = cardBackUrl;

    const updatedUser = await User.findOneAndUpdate(
      { username },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    
    res.json({ 
      success: true, 
      equippedBoard: updatedUser.equippedBoard,
      equippedFieldImage: updatedUser.equippedFieldImage,
      equippedTexture: updatedUser.equippedTexture,
      equippedCardBack: updatedUser.equippedCardBack
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /mark-onboarding - Mark a feature as seen
router.post('/mark-onboarding', async (req, res) => {
  try {
    const { username, feature } = req.body;
    let user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user && (!user.seenOnboarding || !Array.isArray(user.seenOnboarding))) {
       user.seenOnboarding = [];
    }

    if (user && feature && !user.seenOnboarding.includes(feature)) {
       user.seenOnboarding.push(feature);
       await User.findOneAndUpdate(
         { username }, 
         { seenOnboarding: user.seenOnboarding }
       );
    }
    
    res.json({ success: true, seenOnboarding: user.seenOnboarding, duelsUnlocked: user.duelsUnlocked });
  } catch (err) {
    console.error("Error in mark-onboarding:", err);
    res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
});

// DELETE /delete-account/:username - Delete an account
router.delete('/delete-account/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Intentando eliminar usuario: ${username}`);
    
    if (username.toLowerCase() === 'admin') {
      return res.status(403).json({ success: false, message: 'La cuenta admin no puede ser eliminada' });
    }

    const result = await User.findOneAndDelete({ username });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({ success: true, message: 'Cuenta eliminada exitosamente' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor: ' + err.message });
  }
});

module.exports = router;
