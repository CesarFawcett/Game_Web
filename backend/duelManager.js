const Enemy = require('./models/Enemy');
const User = require('./models/User');
const Card = require('./models/Card');

class DuelManager {
  constructor(io) {
    this.io = io;
    this.queue = []; // Array of { socket, user }
    this.activeDuels = new Map(); // roomID -> duelState
  }

  async addToQueue(socket, user) {
    // Debug log
    const username = (user && (user.username || user.name || user.id)) || 'UNKNOWN';
    console.log(`[DuelManager] join_queue from ${socket.id}. UserObj:`, JSON.stringify(user));
    
    if (!username || username === 'UNKNOWN') {
        socket.emit('error', 'Identidad de usuario no válida.');
        return;
    }

    // Check Cooldown
    try {
      const dbUser = await User.findOne({ username });
      if (dbUser && dbUser.duelCooldownUntil && dbUser.duelCooldownUntil > Date.now()) {
        const remaining = Math.ceil((dbUser.duelCooldownUntil - Date.now()) / 1000);
        socket.emit('error', `Estás penalizado por abandonar un duelo. Espera ${remaining} segundos.`);
        return;
      }
    } catch (e) { console.error("Cooldown check error:", e); }

    // Prevent duplicate entries
    this.queue = this.queue.filter(q => {
        const qUser = q.user.username || q.user.name || q.user.id;
        return qUser !== username;
    });

    this.queue.push({ socket, user: { ...user, username } });
    console.log(`[DuelManager] Lobby: ${username} joined. Total in queue: ${this.queue.length}`);
    this.checkMatchmaking();
  }

  removeFromQueue(socketId) {
    this.queue = this.queue.filter(q => q.socket.id !== socketId);
    this.handleDisconnect(socketId);
  }

  async handleDisconnect(socketId) {
    // Find if the user was in an active duel
    let roomIDFound = null;
    let duelFound = null;

    for (const [roomID, duel] of this.activeDuels.entries()) {
      if (duel.players.some(p => p.socketId === socketId)) {
        roomIDFound = roomID;
        duelFound = duel;
        break;
      }
    }

    if (duelFound && !duelFound.winner) {
      const leaver = duelFound.players.find(p => p.socketId === socketId);
      const winner = duelFound.players.find(p => p.socketId !== socketId);

      console.log(`[DuelManager] Player ${leaver.name} disconnected. Winner: ${winner.name}`);
      
      // Apply Penalty to leaver
      try {
        await User.findOneAndUpdate(
          { username: leaver.name },
          { duelCooldownUntil: new Date(Date.now() + 2 * 60 * 1000) }
        );
      } catch (e) { console.error("Penalty error:", e); }

      // Process rewards and end
      await this.processBetRewards(winner.name, leaver.name, leaver.bet?._id);
      
      this.io.to(winner.socketId).emit('remote_action', { 
        type: 'OPPONENT_DISCONNECTED', 
        payload: { winner: winner.name } 
      });

      this.endDuel(roomIDFound, winner.name);
    }
  }

  async processBetRewards(winnerName, loserName, loserBetId) {
    if (!loserBetId) return;
    console.log(`[DuelManager] Transferring card ${loserBetId} from ${loserName} to ${winnerName}`);

    try {
      // 1. Find loser and remove ONE copy
      const loser = await User.findOne({ username: loserName });
      if (loser) {
        if (loser.inventory && Array.isArray(loser.inventory)) {
          const invIdx = loser.inventory.findIndex(id => id.toString() === loserBetId.toString());
          if (invIdx !== -1) loser.inventory.splice(invIdx, 1);
        }
        if (loser.deck && Array.isArray(loser.deck)) {
          const deckIdx = loser.deck.findIndex(id => id.toString() === loserBetId.toString());
          if (deckIdx !== -1) loser.deck.splice(deckIdx, 1);
        }

        await User.findOneAndUpdate(
          { username: loserName },
          { inventory: loser.inventory, deck: loser.deck }
        );
      }

      // 2. Add ONE copy to winner
      await User.findOneAndUpdate(
        { username: winnerName },
        { 
          $push: { inventory: loserBetId },
          $addToSet: { discoveredCards: loserBetId },
          $inc: { credits: 200 } // Bonus for winning
        }
      );
    } catch (e) {
      console.error("Reward Processing Error:", e);
    }
  }

  async checkMatchmaking() {
    if (this.queue.length >= 2) {
      const p1 = this.queue.shift();
      const p2 = this.queue.shift();
      const u1 = p1.user.username;
      const u2 = p2.user.username;
      const roomID = `duel_${Date.now()}_${u1}_${u2}`;

      p1.socket.join(roomID);
      p2.socket.join(roomID);

      try {
        const bet1 = await this.selectBetCard(p1.user);
        const bet2 = await this.selectBetCard(p2.user);

        const duelState = {
          roomID,
          players: [
            { name: u1, socketId: p1.socket.id, bet: bet1, hp: 0, deck: p1.user.deck, role: 'player1' },
            { name: u2, socketId: p2.socket.id, bet: bet2, hp: 0, deck: p2.user.deck, role: 'player2' }
          ],
          turn: 'player1', // Default first
          phase: 'MAIN 1',
          startTime: Date.now(),
          timer: 30
        };

        this.activeDuels.set(roomID, duelState);
        duelState.revealTimer = 10;

        this.io.to(roomID).emit('match_found', {
          roomID,
          opponent: {
              p1: { name: u1, avatar: (p1.user.equippedAvatar || p1.user.imageUrl || '/default.png'), bet: bet1, role: 'player1', deck: p1.user.deck.map(id => String(id._id || id)) },
              p2: { name: u2, avatar: (p2.user.equippedAvatar || p2.user.imageUrl || '/default.png'), bet: bet2, role: 'player2', deck: p2.user.deck.map(id => String(id._id || id)) }
          }
        });

        // Start 10s reveal timer
        const revealInterval = setInterval(() => {
          duelState.revealTimer--;
          this.io.to(roomID).emit('reveal_timer_tick', { timer: duelState.revealTimer });
          
          if (duelState.revealTimer <= 0) {
            clearInterval(revealInterval);
            this.startRPSPhase(roomID);
          }
        }, 1000);

      } catch (err) {
        console.error("Matchmaking error:", err);
        p1.socket.emit('error', 'Error al iniciar el duelo');
        p2.socket.emit('error', 'Error al iniciar el duelo');
      }
    }
  }

  async selectBetCard(user) {
    const username = user.username || user.name;
    // Populate full card details for the user's deck
    const dbUser = await User.findOne({ username }).populate('deck');
    if (!dbUser || !dbUser.deck || dbUser.deck.length === 0) return null;

    const deck = dbUser.deck;
    const weights = {
      'Épica': 0.02,
      'Legendaria': 0.01,
      'Mítica': 0.001,
      'Divina': 0.0001,
      'Ancestral': 0.00001,
      'Inmortal': 0.000001,
      'Cósmica': 0,
      'Común': 0.6,
      'Rara': 0.368889
    };

    // Filter out Cosmic cards (they can't be bet)
    const bettableCards = deck.filter(c => c.rarity !== 'Cósmica');
    if (bettableCards.length === 0) return deck[Math.floor(Math.random() * deck.length)];

    // Weighted random selection
    let totalWeight = 0;
    const candidates = bettableCards.map(card => {
        const w = weights[card.rarity] || 0.1;
        totalWeight += w;
        return { card, w };
    });

    let random = Math.random() * totalWeight;
    for (const cand of candidates) {
        if (random < cand.w) return cand.card;
        random -= cand.w;
    }

    return bettableCards[0];
  }

  startDuelTimer(roomID) {
    const duel = this.activeDuels.get(roomID);
    if (!duel) return;

    if (duel.interval) clearInterval(duel.interval);

    duel.timer = 30;
    duel.interval = setInterval(() => {
      duel.timer--;
      this.io.to(roomID).emit('timer_tick', { timer: duel.timer });

      if (duel.timer <= 0) {
        clearInterval(duel.interval);
        this.io.to(roomID).emit('timer_expired', { phase: duel.phase, turn: duel.turn });
      }
    }, 1000);
  }

  startRPSPhase(roomID) {
    const duel = this.activeDuels.get(roomID);
    if (!duel) return;

    duel.rpsTimer = 5;
    duel.rpsChoices = {}; // username -> choice

    this.io.to(roomID).emit('rps_phase_start', { timer: duel.rpsTimer });

    const rpsInterval = setInterval(() => {
      duel.rpsTimer--;
      this.io.to(roomID).emit('rps_timer_tick', { timer: duel.rpsTimer });

      if (duel.rpsTimer <= 0) {
        clearInterval(rpsInterval);
        this.finishRPS(roomID);
      }
    }, 1000);

    duel.rpsInterval = rpsInterval;
  }

  finishRPS(roomID) {
    const duel = this.activeDuels.get(roomID);
    if (!duel || duel.rpsFinished) return;
    
    if (duel.rpsInterval) clearInterval(duel.rpsInterval);
    duel.rpsFinished = true;

    const p1Obj = duel.players[0];
    const p2Obj = duel.players[1];
    const c1 = duel.rpsChoices[p1Obj.name]; 
    const c2 = duel.rpsChoices[p2Obj.name];

    let winnerName = null;
    if (c1 && !c2) winnerName = p1Obj.name;
    else if (!c1 && c2) winnerName = p2Obj.name;
    else if (c1 === c2) {
      winnerName = Math.random() > 0.5 ? p1Obj.name : p2Obj.name;
    } else {
      const wins = { 'rock': 'scissors', 'paper': 'rock', 'scissors': 'paper' };
      winnerName = wins[c1] === c2 ? p1Obj.name : p2Obj.name;
    }

    const winner = duel.players.find(p => p.name === winnerName);
    const loser = duel.players.find(p => p.name !== winnerName);

    duel.turn = winner.role;

    this.io.to(roomID).emit('rps_result', {
      winner: winnerName,
      choices: duel.rpsChoices,
      p1Role: winner.name, // Deprecated but left for compatibility
      p2Role: loser.name   // Deprecated
    });

    // Final delay before game officially starts
    setTimeout(() => {
      this.io.to(roomID).emit('game_start', { 
        firstTurn: duel.turn,
        roles: {
            [p1Obj.socketId]: p1Obj.role,
            [p2Obj.socketId]: p2Obj.role
        }
      });
      this.startDuelTimer(roomID);
    }, 2000);
  }

  handleAction(roomID, socketId, action) {
    const duel = this.activeDuels.get(roomID);
    if (!duel || duel.winner) return;

    if (action.type === 'RPS_CHOICE') {
      const player = duel.players.find(p => p.socketId === socketId);
      if (player && !duel.rpsChoices[player.name]) {
        duel.rpsChoices[player.name] = action.payload.choice;
        if (Object.keys(duel.rpsChoices).length === 2) {
          this.finishRPS(roomID);
        }
      }
      return;
    }

    // Advance turn/phase logic
    if (action.type === 'ADVANCE_PHASE' || action.type === 'END_TURN') {
      if (action.type === 'END_TURN') {
        duel.turn = duel.turn === 'player1' ? 'player2' : 'player1';
      }
      this.startDuelTimer(roomID);
    } else if (action.type === 'SURRENDER') {
      const leaver = duel.players.find(p => p.socketId === socketId);
      const winner = duel.players.find(p => p.socketId !== socketId);
      
      console.log(`[DuelManager] Player ${leaver.name} surrendered. Winner: ${winner.name}`);
      
      this.processBetRewards(winner.name, leaver.name, leaver.bet?._id);
      this.io.to(roomID).emit('remote_action', { type: 'SURRENDER_DETECTED', payload: { winner: winner.name, leaver: leaver.name } });
      this.endDuel(roomID, winner.name);
      return;
    }

    // Relay the action to the opponent
    const opponent = duel.players.find(p => p.socketId !== socketId);
    if (opponent) {
      this.io.to(opponent.socketId).emit('remote_action', action);
    }
  }

  async endDuel(roomID, winnerName) {
    const duel = this.activeDuels.get(roomID);
    if (!duel) return;

    if (winnerName) {
      try {
        const loser = duel.players.find(p => p.name !== winnerName);
        
        // Winner gets +15 pts (Case-insensitive search for robustness)
        await User.findOneAndUpdate(
            { username: { $regex: new RegExp(`^${winnerName}$`, 'i') } }, 
            { $inc: { rankingPoints: 15 } }
        );
        // Loser gets -5 pts (Case-insensitive search)
        const loserDoc = await User.findOne({ username: { $regex: new RegExp(`^${loser.name}$`, 'i') } });
        if (loserDoc) {
          loserDoc.rankingPoints = Math.max(0, (loserDoc.rankingPoints || 0) - 5);
          await loserDoc.save();
        }
      } catch (err) {
        console.error("Error updating ranking points:", err);
      }
    }
    
    clearInterval(duel.interval);
    if (duel.rpsInterval) clearInterval(duel.rpsInterval);
    this.activeDuels.delete(roomID);
    console.log(`Duel ${roomID} ended. Winner: ${winnerName}`);
  }
}

module.exports = DuelManager;
