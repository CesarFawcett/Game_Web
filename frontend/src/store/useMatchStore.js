import { create } from 'zustand';
import { playSound } from '../utils/sound';
import { socket } from '../utils/socket';

const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

const useMatchStore = create((set, get) => ({
  emitAction: (type, payload) => {
    const { isPvP, pvpRoomID } = get();
    if (isPvP && pvpRoomID) {
      socket.emit('pvp_action', { roomID: pvpRoomID, action: { type, payload } });
    }
  },

  p1HP: 10000,
  p1MaxHP: 10000,
  p2HP: 2000,
  p2MaxHP: 2000,
  turn: 'player1',
  phase: 'MAIN 1',
  turnCount: 1,
  log: ['¡Duelo iniciado!'],
  winner: null,
  isProcessing: false,
  firstTurnRole: null,
  splashText: '¡Duelo Iniciado!',
  hoveredCard: null,


  myRole: 'player1',

  isPvP: false,
  pvpRoomID: null,
  pvpTimer: 30,
  myBet: null,
  opponentBet: null,
  revealTimer: 10,
  rpsPhase: false,
  rpsTimer: 5,
  myRpsChoice: null,
  opponentRpsChoice: null,
  rpsWinner: null,

  // Absolute Field State
  p1Field: [null, null, null],
  p2Field: [null, null, null],
  p1Traps: [],
  p2Traps: [],
  p1Graveyard: [],
  p2Graveyard: [],

  // Absolute Decks & Hands
  p1Deck: [], p2Deck: [], p1Hand: [], p2Hand: [],

  // Entities Data
  p1Data: null, p2Data: null,

  // POV Helpers (Point of View)
  getPOVPrefix: (side) => {
    const s = get();
    if (side === 'player') return s.myRole === 'player1' ? 'p1' : 'p2';
    return s.myRole === 'player1' ? 'p2' : 'p1';
  },

  getPOVState: (side) => {
    const s = get();
    const prefix = get().getPOVPrefix(side);
    return {
      hp: s[prefix + 'HP'],
      maxHP: s[prefix + 'MaxHP'],
      field: s[prefix + 'Field'],
      traps: s[prefix + 'Traps'],
      graveyard: s[prefix + 'Graveyard'],
      deck: s[prefix + 'Deck'],
      hand: s[prefix + 'Hand'],
      data: s[prefix + 'Data']
    };
  },

  addLog: (msg) => set(s => ({ log: [msg, ...s.log].slice(0, 3) })),
  showSplash: (text) => {
    set({ splashText: text });
    setTimeout(() => set({ splashText: null }), 1500);
  },

  setSetter: (key, val) => set({ [key]: val }),

  // --- INITIALIZATION ---

  initGame: (user, enemy, playerDeckIds, cardsPool) => {
    const getCardFromPool = (id) => {
      if (!id) return null;
      const targetId = String(id._id || id);
      return cardsPool.find(c => String(c._id || c.id || '') === targetId);
    };

    const sanitize = (deck) => deck.map(c => ({
      ...c, attack: Number(c.attack) || 0, defense: Number(c.defense) || 0,
    }));

    console.log(`[initGame] Initializing. user: ${user?.username}, enemy: ${enemy?.name}`);
    console.log(`[initGame] playerDeckIds:`, playerDeckIds?.length);
    console.log(`[initGame] cardsPool size:`, cardsPool?.length);

    const fullP1Deck = playerDeckIds.map(id => getCardFromPool(id)).filter(Boolean);
    const fullP2Deck = enemy.deck.map(item => {
      if (item && typeof item === 'object' && item.attack !== undefined) return { ...item };
      return getCardFromPool(item);
    }).filter(Boolean);

    console.log(`[initGame] P1 Final Deck: ${fullP1Deck.length}, P2 Final Deck: ${fullP2Deck.length}`);

    const shuffledP1 = shuffle(sanitize(fullP1Deck));
    const shuffledP2 = shuffle(sanitize(fullP2Deck));

    const p1TotalDef = shuffledP1.reduce((sum, c) => sum + (Number(c.defense) || 0), 0);
    const p2TotalDef = shuffledP2.reduce((sum, c) => sum + (Number(c.defense) || 0), 0);
    const p1HP = Math.floor(p1TotalDef / 3) || 1000;
    const p2HP = Math.floor(p2TotalDef / 3) || 1000;

    set({
      isPvP: false,
      myRole: 'player1',
      p1Data: user, p2Data: enemy,
      p1Deck: shuffledP1.slice(3), p2Deck: shuffledP2.slice(3),
      p1Hand: shuffledP1.slice(0, 3), p2Hand: shuffledP2.slice(0, 3),
      p1HP, p1MaxHP: p1HP, p2HP, p2MaxHP: p2HP,
      turn: 'player1', phase: 'MAIN 1', turnCount: 1,
      log: ['¡Duelo iniciado!'], winner: null, splashText: 'TURNO 1',
      p1Field: [null, null, null], p2Field: [null, null, null],
      p1Traps: [], p2Traps: [],
      p1Graveyard: [], p2Graveyard: [],
      isProcessing: false,
      placedThisTurn: 0,
      revealTimer: 0, rpsPhase: false,
      firstTurnRole: null
    });

    setTimeout(() => set({ splashText: null }), 1500);
  },

  initPvPGame: (user, opponent, myDeckIds, cardsPool, roomID, myBet, opponentBet, myRole) => {
    const isP1 = myRole === 'player1';
    const getCardFromPool = (id) => {
      if (!id) return null;
      const targetId = String(id._id || id);
      return cardsPool.find(c => String(c._id || c.id || '') === targetId);
    };

    // Sanitize function
    const sanitize = (deck) => deck.map(c => ({
      ...c, attack: Number(c.attack) || 0, defense: Number(c.defense) || 0,
    }));

    // Local Player HP Calculation
    console.log(`[initPvPGame] Initializing. Pool Size: ${cardsPool.length}, My Deck IDs: ${myDeckIds?.length}`);
    const myFullDeck = (myDeckIds || []).map(id => getCardFromPool(id)).filter(Boolean);
    console.log(`[initPvPGame] Found ${myFullDeck.length} cards for my deck.`);
    const shuffled = shuffle(sanitize(myFullDeck));
    const userHP = Math.floor(shuffled.reduce((sum, c) => sum + (Number(c.defense) || 0), 0) / 3) || 1000;

    let oppHP = 2000;
    if (opponent.deck && Array.isArray(opponent.deck)) {
      const oppFullDeck = opponent.deck.map(id => getCardFromPool(id)).filter(Boolean);
      const oppSanitized = sanitize(oppFullDeck);
      oppHP = Math.floor(oppSanitized.reduce((sum, c) => sum + (Number(c.defense) || 0), 0) / 3) || 2000;
    }

    set({
      isPvP: true, pvpRoomID: roomID, myBet, opponentBet,
      myRole,
      p1Data: isP1 ? user : opponent,
      p2Data: isP1 ? opponent : user,

      revealTimer: 10, rpsPhase: false, rpsTimer: 5,
      myRpsChoice: null, opponentRpsChoice: null, rpsWinner: null,

      [isP1 ? 'p1HP' : 'p2HP']: userHP,
      [isP1 ? 'p1MaxHP' : 'p2MaxHP']: userHP,
      [isP1 ? 'p1Hand' : 'p2Hand']: shuffled.slice(0, 3),
      [isP1 ? 'p1Deck' : 'p2Deck']: shuffled.slice(3),

      [isP1 ? 'p2HP' : 'p1HP']: oppHP,
      [isP1 ? 'p2MaxHP' : 'p1MaxHP']: oppHP,
      [isP1 ? 'p2Hand' : 'p1Hand']: [null, null, null],
      [isP1 ? 'p2Deck' : 'p1Deck']: [],

      turn: 'player1', phase: 'MAIN 1', turnCount: 1,
      p1Field: [null, null, null], p2Field: [null, null, null],
      p1Traps: [], p2Traps: [],
      p1Graveyard: [], p2Graveyard: [],
      log: ['¡Buscando determinar quién empieza!'],
      winner: null,
      splashText: '¡Buscando determinar quién empieza!',
      isProcessing: false,
      firstTurnRole: null
    });

    console.log(`[initPvPGame] Hand set for ${isP1 ? 'p1' : 'p2'}:`, shuffled.slice(0, 3).length, "cards.");
  },

  // --- TURN CONTROL ---

  startTurn: (role) => {
    const s = get();
    if (s.winner) return;
    const isMe = role === s.myRole;
    const prefix = role === 'player1' ? 'p1' : 'p2';
    const oppPrefix = role === 'player1' ? 'p2' : 'p1';

    // Track who went first if not set
    if (s.firstTurnRole === null) {
      set({ firstTurnRole: role });
      console.log(`[useMatchStore] First player of the game identified: ${role}`);
    }

    // Trap Bonuses for poison calculation
    const oppTraps = s[oppPrefix + 'Traps'] || [];
    const oppTrapBonusAtk = oppTraps.reduce((acc, t) => acc + (Number(t.attack) || 0), 0);

    // Effects
    const totalPoison = s[oppPrefix + 'Field'].reduce((acc, c) => {
      if (!c) return acc;
      const effectiveAtk = c.attack + oppTrapBonusAtk;
      return acc + (c?.ability === 'Veneno' ? Math.floor(effectiveAtk * 0.2) : 0);
    }, 0);

    const totalPutrefaction = s[oppPrefix + 'Field'].reduce((acc, c) => {
      if (!c) return acc;
      const effectiveAtk = c.attack + oppTrapBonusAtk;
      return acc + (c?.ability === 'Putrefacción' ? Math.floor(effectiveAtk * 0.3) : 0);
    }, 0);

    if (totalPoison > 0) {
      set(prev => ({
        [prefix + 'Field']: prev[prefix + 'Field'].map(c => {
          if (!c) return null;
          const ndef = c.defense - totalPoison;
          if (ndef <= 0) {
            set({ [prefix + 'Graveyard']: [...get()[prefix + 'Graveyard'], c] });
            return null;
          }
          return { ...c, defense: ndef };
        })
      }));
      get().addLog(`${isMe ? 'Tu' : 'Enemigo'} recibe ${totalPoison} daño de veneno en el campo.`);
    }

    if (totalPutrefaction > 0) {
      set(prev => ({ [prefix + 'HP']: Math.max(0, prev[prefix + 'HP'] - totalPutrefaction) }));
      get().addLog(`${isMe ? 'Tu HP' : 'HP Enemigo'} disminuye ${totalPutrefaction} por Putrefacción.`);
    }

    set(prev => ({
      [prefix + 'Field']: prev[prefix + 'Field'].map(c => c ? { ...c, attacksThisTurn: 0, frozen: Math.max(0, (c.frozen || 0) - 1) } : null),
      placedThisTurn: 0,
      phase: 'MAIN 1'
    }));

    // Draw card
    if (s.turnCount > 1 || role === 'player2') {
      get().drawCard(role);
    }

    if (isMe) {
      get().showSplash(`TU TURNO ${s.turnCount}`);
      get().addLog(`Inicia tu turno ${s.turnCount}`);
    } else if (!s.isPvP) {
      get().showSplash(`TURNO ENEMIGO`);
      setTimeout(() => get().aiTurn(), 1000);
    }
  },

  endTurn: () => {
    const s = get();
    if (s.isProcessing || s.winner) return;
    const nextRole = s.turn === 'player1' ? 'player2' : 'player1';
    set({
      turn: nextRole,
      turnCount: nextRole === 'player1' ? s.turnCount + 1 : s.turnCount
    });
    get().emitAction('END_TURN');
    get().startTurn(nextRole);
  },

  advancePhase: () => {
    const s = get();
    if (s.turn !== s.myRole || s.isProcessing || s.winner) return;
    if (s.phase === 'MAIN 1') {
      const isFirstTurnOfGame = s.turnCount === 1 && s.turn === s.firstTurnRole;
      if (isFirstTurnOfGame) {
        console.log(`[useMatchStore] Skipping Battle Phase for first turn of game (${s.turn})`);
        set({ phase: 'END' });
        get().endTurn();
      }
      else {
        set({ phase: 'BATTLE', isProcessing: false });
        get().addLog('Fase de Batalla');
        playSound('place');
      }
    } else if (s.phase === 'BATTLE') {
      set({ phase: 'MAIN 2' }); get().addLog('Main Phase 2'); playSound('place');
    } else if (s.phase === 'MAIN 2') {
      get().endTurn();
    }
    get().emitAction('ADVANCE_PHASE', { phase: get().phase });
  },

  surrender: () => {
    const s = get();
    if (s.winner || s.isProcessing) return;
    if (confirm("¿Estás seguro de que quieres rendirte? Perderás tu carta apostada.")) {
      get().emitAction('SURRENDER');
      set({ winner: 'DERROTA' });
      get().addLog('Te has rendido.');
    }
  },

  // --- COMBAT ACTIONS ---

  drawCard: (role) => {
    const prefix = role === 'player1' ? 'p1' : 'p2';
    set(s => {
      const deck = s[prefix + 'Deck'];
      if (deck.length > 0) {
        const count = Math.min(deck.length, 2);
        const drawn = deck.slice(0, count);
        return {
          [prefix + 'Hand']: [...s[prefix + 'Hand'], ...drawn],
          [prefix + 'Deck']: deck.slice(count)
        };
      }
      return {};
    });
  },

  placeCard: (handIdx, slotIdx) => {
    const s = get();
    if (s.turn !== s.myRole || s.winner || s.splashText || (s.phase !== 'MAIN 1' && s.phase !== 'MAIN 2')) return;

    const prefix = s.myRole === 'player1' ? 'p1' : 'p2';
    const card = s[prefix + 'Hand'][handIdx];
    const targetSlot = s[prefix + 'Field'][slotIdx];

    if (card.type === 'Spell') {
      if (!targetSlot) return get().addLog("Selecciona un monstruo aliado.");
      playSound('place');
      set(prev => {
        const nextF = [...prev[prefix + 'Field']];
        nextF[slotIdx] = { ...targetSlot, attack: targetSlot.attack + card.attack, defense: targetSlot.defense + card.defense };
        return { [prefix + 'Field']: nextF, [prefix + 'Hand']: prev[prefix + 'Hand'].filter((_, i) => i !== handIdx), selectedHandIdx: null };
      });
      get().emitAction('PLACE_CARD', { slotIdx, card, type: 'Spell' });
      return;
    }

    if (targetSlot) return get().addLog("Slot ocupado.");
    playSound('place');
    set(prev => {
      const nextF = [...prev[prefix + 'Field']];
      nextF[slotIdx] = { ...card, attacksThisTurn: 0, frozen: 0 };
      return { [prefix + 'Field']: nextF, [prefix + 'Hand']: prev[prefix + 'Hand'].filter((_, i) => i !== handIdx), selectedHandIdx: null, placedThisTurn: prev.placedThisTurn + 1 };
    });
    get().emitAction('PLACE_CARD', { slotIdx, card });
  },

  activateTrap: (handIdx) => {
    const s = get();
    if (s.turn !== s.myRole || s.winner || (s.phase !== 'MAIN 1' && s.phase !== 'MAIN 2')) return;
    const prefix = s.myRole === 'player1' ? 'p1' : 'p2';
    const card = s[prefix + 'Hand'][handIdx];
    if (!card || card.type !== 'Trap') return;
    if (s[prefix + 'Traps'].length >= 3) return get().addLog("Zona de trampas llena.");

    playSound('place');
    set(prev => ({
      [prefix + 'Traps']: [...prev[prefix + 'Traps'], card],
      [prefix + 'Hand']: prev[prefix + 'Hand'].filter((_, i) => i !== handIdx),
      selectedHandIdx: null
    }));
    get().emitAction('ACTIVATE_TRAP', { card });
    get().addLog(`Has activado una carta de Trampa.`);
  },

  handleCardClick: (i, role) => {
    const s = get();
    if (s.turn !== s.myRole || s.winner || s.isProcessing || s.splashText) return;

    const isFirstTurnOfGame = s.turnCount === 1 && s.turn === s.firstTurnRole;
    if (isFirstTurnOfGame && s.phase === 'BATTLE') {
      get().addLog("¡No se puede atacar en el primer turno!");
      return;
    }

    if (role === s.myRole) {
      if (s.phase !== 'BATTLE') return;
      const card = s[role === 'player1' ? 'p1Field' : 'p2Field'][i];
      if (card && card.frozen <= 0 && card.attacksThisTurn < (card.ability === 'Doble Ataque' ? 2 : 1)) {
        set({ selectedAttackerIdx: i === s.selectedAttackerIdx ? null : i });
      }
    } else if (s.selectedAttackerIdx !== null && s.phase === 'BATTLE') {
      get().executeAttack(s.selectedAttackerIdx, i);
    }
  },

  executeAttack: async (attackerIdx, targetIdx, isRemote = false) => {
    const s = get();

    const isFirstTurnOfGame = s.turnCount === 1 && s.turn === s.firstTurnRole;
    if (isFirstTurnOfGame) {
      console.error("[useMatchStore] Attempted attack on turn 1 blocked.");
      set({ isProcessing: false, selectedAttackerIdx: null });
      return;
    }

    const attackerRole = isRemote ? (s.myRole === 'player1' ? 'player2' : 'player1') : s.myRole;
    const defenderRole = attackerRole === 'player1' ? 'player2' : 'player1';
    const aPrefix = attackerRole === 'player1' ? 'p1' : 'p2';
    const dPrefix = defenderRole === 'player1' ? 'p1' : 'p2';

    set({
      isProcessing: true,
      attackingIdx: `${aPrefix}-${attackerIdx}`,
      defendingIdx: targetIdx === -1 ? `${dPrefix}-hero` : `${dPrefix}-${targetIdx}`
    });

    playSound('attack');
    await new Promise(r => setTimeout(r, 600));
    playSound('impact');

    const state = get();
    const aField = state[aPrefix + 'Field'];
    const dField = state[dPrefix + 'Field'];
    const aTraps = state[aPrefix + 'Traps'];
    const dTraps = state[dPrefix + 'Traps'];

    // Trap Bonuses
    const trapAtkBonus = aTraps.reduce((acc, t) => acc + (Number(t.attack) || 0), 0);
    const trapDefBonus = dTraps.reduce((acc, t) => acc + (Number(t.defense) || 0), 0);

    const attackerBase = aField[attackerIdx];
    if (!attackerBase) {
      set({ isProcessing: false, attackingIdx: null, selectedAttackerIdx: null, defendingIdx: null });
      return;
    }
    const attacker = { ...attackerBase, attack: attackerBase.attack + trapAtkBonus };
    const targetBase = targetIdx === -1 ? null : dField[targetIdx];
    const target = targetBase ? { ...targetBase, defense: targetBase.defense + trapDefBonus } : null;

    if (!isRemote) get().emitAction('EXECUTE_ATTACK', { attackerIdx, targetIdx });

    if (!target) {
      if (dField.every(slot => slot)) {
        get().addLog("¡No puedes atacar directo si el campo está lleno!");
        set({ isProcessing: false, attackingIdx: null, selectedAttackerIdx: null, defendingIdx: null });
        return;
      }

      set(p => {
        const nextF = [...p[aPrefix + 'Field']];
        if (nextF[attackerIdx]) {
          nextF[attackerIdx] = { ...nextF[attackerIdx], attacksThisTurn: (nextF[attackerIdx].attacksThisTurn || 0) + 1 };
        }
        return {
          [dPrefix + 'HP']: Math.max(0, p[dPrefix + 'HP'] - attacker.attack),
          [aPrefix + 'Field']: nextF
        };
      });
      get().addLog(`${attackerRole === 'player1' ? 'P1' : 'P2'} ataca directo con ${attacker.name} infligiendo ${attacker.attack} daño.`);
    } else {
      const damage = attacker.attack;

      // --- Habilidad: Daño Perforante ---
      if (attacker.ability === 'Daño Perforante' && damage > target.defense) {
        const extra = damage - target.defense;
        set(p => ({ [dPrefix + 'HP']: Math.max(0, p[dPrefix + 'HP'] - extra) }));
        get().addLog(`¡Daño Perforante inflige ${extra} al HP rival!`);
      }

      // --- Habilidad: Fuego (Splash Damage) ---
      if (attacker.ability === 'Fuego') {
        const splash = Math.floor(damage * 0.4);
        set(prev => {
          const nextF = [...prev[dPrefix + 'Field']];
          let splashCount = 0;
          [targetIdx - 1, targetIdx + 1].forEach(idx => {
            if (idx >= 0 && idx < 3 && nextF[idx]) {
              const currentT = nextF[idx];
              // Note: splash target also gets its own owner's trap bonus? Usually splash is direct damage to def.
              const currentTDef = currentT.defense + trapDefBonus; 
              const newDef = currentTDef - splash;
              
              if (newDef <= 0) {
                set({ [dPrefix + 'Graveyard']: [...get()[dPrefix + 'Graveyard'], currentT] });
                nextF[idx] = null;
              } else {
                nextF[idx] = { ...currentT, defense: newDef - trapDefBonus }; // Preserve base defense
              }
              splashCount++;
            }
          });
          if (splashCount > 0) get().addLog(`¡Fuego inflige ${splash} daño splash a los vecinos!`);
          return { [dPrefix + 'Field']: nextF };
        });
      }

      // Target Combat
      set(prev => {
        const nextF = [...prev[dPrefix + 'Field']];
        if (!nextF[targetIdx]) return {};
        const nextT = { ...nextF[targetIdx] };
        const effectiveTDef = nextT.defense + trapDefBonus;
        const newEffectiveDef = effectiveTDef - damage;
        
        if (newEffectiveDef <= 0) {
          set({ [dPrefix + 'Graveyard']: [...get()[dPrefix + 'Graveyard'], targetBase] });
          nextF[targetIdx] = null;
        } else {
          nextT.defense = newEffectiveDef - trapDefBonus; // Restore base
          nextF[targetIdx] = nextT;
        }
        return { [dPrefix + 'Field']: nextF };
      });

      // Attacker Combat
      if (target.defense > 0) {
        set(prev => {
          const nextF = [...prev[aPrefix + 'Field']];
          if (!nextF[attackerIdx]) return {};
          let nextA = { ...nextF[attackerIdx] };

          // --- Habilidad: Robo de Vida ---
          if (nextA.ability === 'Robo de Vida') {
            const boost = Math.floor((nextA.attack + trapAtkBonus) * 0.2);
            nextA.attack += boost;
            nextA.defense += boost;
            get().addLog(`¡Robo de Vida aumenta ATK/DEF de ${nextA.name} en ${boost}!`);
          }

          const effectiveAAtk = nextA.attack + trapAtkBonus;
          const newEffectiveAtk = Math.max(0, effectiveAAtk - target.defense);
          
          nextA.attacksThisTurn += 1;

          if (target.ability === 'Hielo') {
            nextA.frozen = 3;
            get().addLog(`¡${attacker.name} ha sido congelado por el Hielo de ${target.name}!`);
          }

          if (newEffectiveAtk <= 0 && target.defense > 0) {
            set({ [aPrefix + 'Graveyard']: [...get()[aPrefix + 'Graveyard'], attackerBase] });
            nextF[attackerIdx] = null;
          } else {
            nextA.attack = Math.max(0, newEffectiveAtk - trapAtkBonus); // Restore base
            nextF[attackerIdx] = nextA;
          }
          return { [aPrefix + 'Field']: nextF };
        });
      } else {
         // Attacker simply attacked successfully
         set(prev => {
            const nextF = [...prev[aPrefix + 'Field']];
            if (nextF[attackerIdx]) {
              nextF[attackerIdx] = { ...nextF[attackerIdx], attacksThisTurn: (nextF[attackerIdx].attacksThisTurn || 0) + 1 };
            }
            return { [aPrefix + 'Field']: nextF };
         });
      }

      if (attacker.ability === 'Hielo' && get()[dPrefix + 'Field'][targetIdx]) {
        set(prev => {
          const nextF = [...prev[dPrefix + 'Field']];
          if (nextF[targetIdx]) {
            nextF[targetIdx] = { ...nextF[targetIdx], frozen: 3 };
            get().addLog(`¡${target.name} ha sido congelado por el Hielo de ${attacker.name}!`);
          }
          return { [dPrefix + 'Field']: nextF };
        });
      }
    }

    await new Promise(r => setTimeout(r, 300));
    set({ defendingIdx: null, isProcessing: false, attackingIdx: null, selectedAttackerIdx: null });
    get().checkWinCon();
  },

  checkWinCon: () => {
    const s = get();
    if (s.p2HP <= 0) { set({ winner: s.myRole === 'player1' ? 'VICTORIA' : 'DERROTA' }); playSound(s.myRole === 'player1' ? 'victory' : 'defeat'); }
    else if (s.p1HP <= 0) { set({ winner: s.myRole === 'player2' ? 'VICTORIA' : 'DERROTA' }); playSound(s.myRole === 'player2' ? 'victory' : 'defeat'); }
    if (get().winner === 'VICTORIA' && s.onVictory) s.onVictory();
  },

  onVictory: null,

  processRemoteAction: (action) => {
    const { type, payload } = action;
    const s = get();
    const oppPrefix = s.myRole === 'player1' ? 'p2' : 'p1';

    console.log(`[useMatchStore] processRemoteAction: ${type}`, payload);

    if (type === 'PLACE_CARD') {
      set(p => {
        const nextF = [...p[oppPrefix + 'Field']];
        nextF[payload.slotIdx] = payload.card;
        return { [oppPrefix + 'Field']: nextF };
      });
    } else if (type === 'ACTIVATE_TRAP') {
      set(p => ({ [oppPrefix + 'Traps']: [...p[oppPrefix + 'Traps'], payload.card] }));
      get().addLog(`Oponente ha activado una carta de Trampa.`);
    } else if (type === 'END_TURN') {
      const nextRole = s.myRole;
      set(prev => ({
        turn: nextRole,
        turnCount: nextRole === 'player1' ? prev.turnCount + 1 : prev.turnCount
      }));
      get().startTurn(nextRole);
    } else if (type === 'ADVANCE_PHASE') {
      set({ phase: payload.phase });
    } else if (type === 'EXECUTE_ATTACK') {
      get().executeAttack(payload.attackerIdx, payload.targetIdx, true);
    } else if (type === 'SURRENDER_DETECTED') {
      const isMeWinner = s.myRole === (payload.winner === s.p1Data.username ? 'player1' : 'player2');
      set({ winner: isMeWinner ? 'VICTORIA' : 'DERROTA' });
      get().addLog(`${payload.leaver} se ha rendido.`);
      if (isMeWinner) playSound('victory');
    } else if (type === 'OPPONENT_DISCONNECTED') {
      set({ winner: 'VICTORIA' });
      get().addLog('¡Oponente desconectado! Ganas por abandono.');
      playSound('victory');
    }
  },

  aiTurn: async () => {
    set({ phase: 'ENEMIGO (Main)' });
    await new Promise(r => setTimeout(r, 1000));

    let s = get();
    let newHand = [...s.p2Hand];
    let newField = [...s.p2Field];
    let newTraps = [...s.p2Traps];
    let placed = 0;

    // 1. Activar Trampas
    for (let i = newHand.length - 1; i >= 0; i--) {
      const card = newHand[i];
      if (card && card.type === 'Trap' && newTraps.length < 3) {
        newTraps.push(newHand.splice(i, 1)[0]);
        get().addLog(`Enemigo coloca una Trampa.`);
      }
    }

    // 2. Invocar Monstruos (hasta 3 si hay espacio)
    for (let i = 0; i < 3; i++) {
      const emptySlot = newField.findIndex(slot => !slot);
      if (emptySlot === -1) break;

      const monsterIdx = newHand.findIndex(c => c && (c.type === 'Monster' || !c.type));
      if (monsterIdx === -1) break;

      placed++;
      playSound('place');
      const monster = newHand.splice(monsterIdx, 1)[0];
      newField[emptySlot] = { ...monster, attacksThisTurn: 0, frozen: 0 };
      get().addLog(`Enemigo invoca a ${monster.name}`);
    }

    set({ p2Hand: newHand, p2Field: newField, p2Traps: newTraps });
    await new Promise(r => setTimeout(r, 1000));

    // 3. Batalla
    set({ phase: 'ENEMIGO (Battle)' });
    for (let i = 0; i < newField.length; i++) {
      let card = get().p2Field[i];
      if (!card || card.frozen > 0) continue;

      const maxAttacks = card.ability === 'Doble Ataque' ? 2 : 1;

      for (let atkCount = 0; atkCount < maxAttacks; atkCount++) {
        card = get().p2Field[i];
        if (!card) break;

        const playerField = get().p1Field;
        const monstersOnField = playerField.filter(Boolean).length;
        const hasSpaces = playerField.some(slot => !slot);
        const monsterTargets = playerField.map((c, idx) => c ? idx : null).filter(idx => idx !== null);

        let targetIdx = -1;

        // Regla: Si no hay espacios vacíos (3 monstruos), DEBE atacar monstruo
        if (!hasSpaces) {
          if (monsterTargets.length > 0) {
            targetIdx = monsterTargets[Math.floor(Math.random() * monsterTargets.length)];
          } else {

            targetIdx = 0;
          }
        } else {
          if (monsterTargets.length > 0 && Math.random() > 0.6) {
            targetIdx = monsterTargets[Math.floor(Math.random() * monsterTargets.length)];
          } else {
            targetIdx = -1;
          }
        }

        await get().executeAttack(i, targetIdx, true);
        await new Promise(r => setTimeout(r, 800));
      }
    }

    await new Promise(r => setTimeout(r, 500));
    get().endTurn();
  },

  getEffectiveStats: (card, role) => {
    if (!card) return null;
    const s = get();
    const prefix = role === 'player1' ? 'p1' : 'p2';
    const traps = s[prefix + 'Traps'] || [];
    const trapAtkBonus = traps.reduce((acc, t) => acc + (Number(t.attack) || 0), 0);
    const trapDefBonus = traps.reduce((acc, t) => acc + (Number(t.defense) || 0), 0);
    return {
      ...card,
      attack: (Number(card.attack) || 0) + trapAtkBonus,
      defense: (Number(card.defense) || 0) + trapDefBonus
    };
  },

  resetMatch: () => {
    set({
      isPvP: false, pvpRoomID: null, winner: null, splashText: null,
      p1HP: 1000, p2HP: 1000, p1Field: [null, null, null], p2Field: [null, null, null],
      p1Hand: [], p2Hand: [], p1Deck: [], p2Deck: [],
      p1Traps: [], p2Traps: [], p1Graveyard: [], p2Graveyard: [],
      log: [], isProcessing: false, rpsPhase: false,
      myRole: 'player1',
      selectedHandIdx: null,
      selectedAttackerIdx: null,
      attackingIdx: null,
      defendingIdx: null,
      placedThisTurn: 0,
      turnCount: 1,
      turn: 'player1',
      firstTurnRole: null
    });
  }
}));

export default useMatchStore;
