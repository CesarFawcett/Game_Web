import React, { useEffect } from 'react';
import { Swords, Timer, Scissors, Hand, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useMatchStore from '../store/useMatchStore';

import PhaseIndicator from './Duel/PhaseIndicator';
import BattleConsole from './Duel/BattleConsole';
import FieldSlot from './Duel/FieldSlot';
import HandArea from './Duel/HandArea';
import CardEntity from './Duel/CardEntity';

import { socket } from '../utils/socket';

function DuelArena({ user, enemy, playerDeckIds, cardsPool, baseUrl, onExit }) {
  const store = useMatchStore();

  // 1. Setup & Initialization
  useEffect(() => {
    if (!user || !enemy || !cardsPool || cardsPool.length === 0) {
      console.log("[DuelArena] Waiting for data to initialize...", { user: !!user, enemy: !!enemy, pool: cardsPool?.length });
      return;
    }

    if (!store.isPvP) {
      console.log("[DuelArena] Calling initGame for story mode");
      store.initGame(user, enemy, playerDeckIds, cardsPool);
    }
    
    // Socket Listeners for PvP
    if (store.isPvP) {
      socket.on('timer_tick', (data) => store.setSetter('pvpTimer', data.timer));
      socket.on('timer_expired', () => store.advancePhase());
      socket.on('remote_action', (action) => store.processRemoteAction(action));
      
      socket.on('reveal_timer_tick', (data) => store.setSetter('revealTimer', data.timer));
      socket.on('rps_phase_start', (data) => {
        store.setSetter('rpsPhase', true);
        store.setSetter('rpsTimer', data.timer);
      });
      socket.on('rps_timer_tick', (data) => store.setSetter('rpsTimer', data.timer));
      
      socket.on('rps_result', (data) => {
        store.setSetter('rpsWinner', data.winner);
        const myChoice = data.choices[user.username] || data.choices[user.name];
        const oppChoice = data.choices[enemy.username] || data.choices[enemy.name];
        store.setSetter('myRpsChoice', myChoice);
        store.setSetter('opponentRpsChoice', oppChoice);
      });

      socket.on('game_start', (data) => {
        // Robust role detection: prefer server-assigned role for this socket, or derive from names
        let myAssignedRole = data.roles[socket.id];
        if (!myAssignedRole) {
          const amIP1 = data.p1Name === (user.username || user.name);
          myAssignedRole = amIP1 ? 'player1' : 'player2';
        }

        console.log(`[DuelArena] game_start. Assigned Role: ${myAssignedRole}`);
        store.setSetter('myRole', myAssignedRole);
        store.setSetter('rpsPhase', false);
        store.setSetter('isProcessing', false);
        
        const firstTurn = data.firstTurn || 'player1';
        store.setSetter('turn', firstTurn); 
        
        const isMeFirst = myAssignedRole === firstTurn;
        const turnOwnerName = isMeFirst ? 'Tú' : enemy.name;
        store.addLog(`¡El juego comienza! Turno de ${turnOwnerName}`);
        store.showSplash(`TURNO DE ${turnOwnerName.toUpperCase()}`);
        
        store.startTurn(firstTurn);
      });
    }

    store.setSetter('onVictory', async () => {
      try {
        if (store.isPvP) {
          if (!store.opponentBet?._id) {
            console.error("[DuelArena] No opponent bet ID found for result transfer.");
          } else {
            await fetch(`${baseUrl}/api/duels/bet-result`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                winnerName: user.username || user.name, 
                loserName: enemy.username || enemy.name,
                winnerBetId: store.myBet?._id,
                loserBetId: store.opponentBet?._id
              })
            });
            socket.emit('pvp_end', { roomID: store.pvpRoomID, winnerName: user.username });
            alert(`👑 ¡VICTORIA! Has ganado la carta: ${store.opponentBet?.name || '---'}`);
          }
        } else {
          await fetch(`${baseUrl}/api/missions/update-win`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username })
          });
          const victoryRes = await fetch(`${baseUrl}/api/story/victory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username, enemyId: enemy._id })
          });
          const victoryData = await victoryRes.json();
          if (victoryData.success) {
            const updatedUser = { 
              ...user, 
              credits: victoryData.newCredits, 
              defeatedEnemies: victoryData.defeatedEnemies || user.defeatedEnemies || [],
              duelsUnlocked: victoryData.duelsUnlocked || user.duelsUnlocked
            };
            const { login } = await import('../store.js').then(m => ({ login: m.default.getState().login }));
            login(updatedUser);
            if (victoryData.firstTime && victoryData.rewardAvatar) {
              setTimeout(() => alert(`🏆 ¡Primera victoria! Desbloqueaste el avatar de ${enemy.name}!`), 500);
            }
          }
        }
      } catch (e) { console.error("Win tracking error:", e); }
    });

    return () => {
      socket.off('timer_tick');
      socket.off('timer_expired');
      socket.off('remote_action');
      socket.off('reveal_timer_tick');
      socket.off('rps_phase_start');
      socket.off('rps_timer_tick');
      socket.off('rps_result');
      socket.off('game_start');
    };
  }, [store.isPvP, enemy?._id, user?.username, playerDeckIds?.length, cardsPool?.length, baseUrl]); // eslint-disable-line

  if (!user || !enemy) return <div className="loading-duel">Cargando Arena de Duelo...</div>;

  // POV States for rendering
  const pPOV = store.getPOVState('player');
  const ePOV = store.getPOVState('enemy');

  const enemyFieldTexture = ePOV.data?.fieldTextureUrl
    ? { backgroundImage: `url(${baseUrl}${ePOV.data.fieldTextureUrl})`, backgroundSize: 'cover' }
    : {};
  const playerFieldTexture = pPOV.data?.equippedTexture
    ? { backgroundImage: `url(${baseUrl}${pPOV.data.equippedTexture})`, backgroundSize: 'cover' }
    : (pPOV.data?.equippedBoard 
      ? { backgroundImage: `url(${baseUrl}${pPOV.data.equippedBoard})`, backgroundSize: 'cover' } 
      : {});

  const renderEnemySide = (profileProps, deckLimit, hp) => {
    const traps = ePOV.traps;
    return (
      <div className="board-side enemy-side">
        <div className="field-section" style={enemyFieldTexture}>
          <div className="trap-row enemy-traps">
            <div className="deck-box mini-deck" style={{ marginRight: '0.8rem' }}>
              <div className="deck-texture" style={{ background: ePOV.data?.cardBackUrl ? `url(${baseUrl}${ePOV.data.cardBackUrl}) center/cover` : (ePOV.data?.cardBackImageUrl ? `url(${baseUrl}${ePOV.data.cardBackImageUrl}) center/cover` : 'var(--accent-gold)') }}></div>
              <span className="deck-count">{deckLimit}</span>
            </div>
            {[2, 1, 0].map(i => (
              <div key={`trap-enemy-${i}`} className="side-trap-slot" onMouseEnter={() => traps[i] && store.setSetter('hoveredCard', traps[i])} onMouseLeave={() => store.setSetter('hoveredCard', null)}>
                {traps[i] ? <img src={`${baseUrl}${traps[i].imageUrl}`} alt="Trap" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="trap-text">TRAMPA</span>}
              </div>
            ))}
          </div>
          <div className="monster-row">
            <div className="side-trap-slot graveyard-slot enemy-graveyard" title="Cementerio Enemigo">
              {ePOV.graveyard.length > 0 ? (
                <div className="arena-card small-card">
                  <img src={`${baseUrl}${ePOV.graveyard[ePOV.graveyard.length - 1].imageUrl}`} alt="Grave" />
                </div>
              ) : <span className="trap-text">CEMENTERIO</span>}
            </div>
            {[2, 1, 0].map(i => <FieldSlot key={`enemy-${i}`} side="enemy" index={i} baseUrl={baseUrl} />)}
          </div>
        </div>
        {store.selectedAttackerIdx !== null && store.turn === store.myRole && (
          <div className="direct-attack-zone-new" onClick={() => store.executeAttack(store.selectedAttackerIdx, -1)}>ATAQUE DIRECTO</div>
        )}
      </div>
    );
  };

  const renderPlayerSide = (profileProps, deckLimit, hp) => {
    const traps = pPOV.traps;
    return (
      <div className="board-side player-side">
        <div className="field-section" style={playerFieldTexture}>
          <div className="monster-row">
            {[0, 1, 2].map(i => <FieldSlot key={`player-${i}`} side="player" index={i} baseUrl={baseUrl} />)}
            <div className="side-trap-slot graveyard-slot player-graveyard" title="Cementerio">
              {pPOV.graveyard.length > 0 ? (
                <div className="arena-card small-card">
                  <img src={`${baseUrl}${pPOV.graveyard[pPOV.graveyard.length - 1].imageUrl}`} alt="Grave" />
                </div>
              ) : <span className="trap-text" style={{ color: '#3b82f6' }}>CEMENTERIO</span>}
            </div>
          </div>
          <div className="trap-row player-traps" style={{ justifyContent: 'center', alignItems: 'center' }}>
            {[0, 1, 2].map(i => {
              const prefix = store.getPOVPrefix('player');
              const myHand = store[prefix + 'Hand'];
              const isTrapSelected = store.selectedHandIdx !== null && myHand[store.selectedHandIdx]?.type === 'Trap';
              const canPlace = isTrapSelected && !traps[i];
              return (
                <div key={`trap-player-${i}`} className={`side-trap-slot ${canPlace ? 'targetable' : ''}`} onClick={() => canPlace && store.activateTrap(store.selectedHandIdx)} onMouseEnter={() => traps[i] && store.setSetter('hoveredCard', traps[i])} onMouseLeave={() => store.setSetter('hoveredCard', null)}>
                  {traps[i] ? <img src={`${baseUrl}${traps[i].imageUrl}`} alt="Trap" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="trap-text">TRAMPA</span>}
                </div>
              );
            })}
            <div className="deck-box" style={{ marginLeft: '0.8rem' }}>
              <div className="deck-texture" style={{ 
                background: pPOV.data?.equippedCardBack 
                  ? `url(${baseUrl}${pPOV.data.equippedCardBack}) center/cover` 
                  : 'var(--primary)' 
              }}></div>
              <span className="deck-count">{deckLimit}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const arenaBgStyle = pPOV.data?.equippedFieldImage
    ? { background: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${baseUrl}${pPOV.data.equippedFieldImage}) center/cover no-repeat` }
    : (pPOV.data?.equippedBoard
      ? { background: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${baseUrl}${pPOV.data.equippedBoard}) center/cover no-repeat` }
      : (ePOV.data?.fieldImageUrl
        ? { background: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${baseUrl}${ePOV.data.fieldImageUrl}) center/cover no-repeat` }
        : {}));

  return (
    <div className={`duel-overlay ${store.isProcessing ? 'screenshake-active' : ''}`} style={arenaBgStyle}>
      <div className="duel-arena-layout">
        <AnimatePresence>
          {store.splashText && (
            <motion.div initial={{ opacity: 0, scale: 0.5, y: -50 }} animate={{ opacity: 0.5, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }} className="phase-splash-text gradient-text" style={{ position: 'fixed', top: '40%', left: '0', right: '0', textAlign: 'center', fontSize: '4rem', zIndex: 999, fontWeight: 900, pointerEvents: 'none' }}>
              {store.splashText}
            </motion.div>
          )}
        </AnimatePresence>

        <PhaseIndicator phase={store.phase} />

        {store.isPvP && (
          <div className="pvp-timer-container">
            <div className="pvp-timer-label">LÍMITE DE FASE: {store.pvpTimer}s</div>
            <div className="pvp-timer-bar">
              <motion.div className="pvp-timer-progress" animate={{ width: `${(store.pvpTimer / 30) * 100}%` }} style={{ background: store.pvpTimer < 10 ? '#ef4444' : 'var(--accent-gold)' }} />
            </div>
          </div>
        )}

        <AnimatePresence>
          {store.isPvP && store.revealTimer > 0 && (
            <div className="bet-reveal-overlay">
              <div className="bet-reveal-card glass-panel">
                <div className="reveal-header"><Timer size={24} className="text-gold" /><span className="reveal-timer">{store.revealTimer}s</span></div>
                <h2 className="gradient-text">CARTAS APOSTADAS</h2>
                <div className="bets-display">
                  <div className="bet-item">
                     <p>TU APUESTA</p> {store.myBet && <img src={`${baseUrl}${store.myBet.imageUrl}`} alt="My Bet" className="bet-img" />}
                  </div>
                  <Swords size={48} className="text-gold" />
                  <div className="bet-item">
                     <p>APUESTA RIVAL</p> {store.opponentBet && <img src={`${baseUrl}${store.opponentBet.imageUrl}`} alt="Opponent Bet" className="bet-img" />}
                  </div>
                </div>
              </div>
            </div>
          )}
          {store.isPvP && store.rpsPhase && (
             <div className="bet-reveal-overlay rps-overlay">
                <div className="bet-reveal-card glass-panel rps-card">
                   <h2 className="gradient-text">¿QUIÉN EMPIEZA?</h2>
                   <div className="rps-timer-ring"><div className="rps-timer-num">{store.rpsTimer}</div></div>
                   <div className="rps-options">
                      {['rock', 'paper', 'scissors'].map(choice => (
                         <button key={choice} className={`rps-btn ${store.myRpsChoice === choice ? 'selected' : ''}`} disabled={!!store.myRpsChoice || store.rpsWinner} onClick={() => {
                            store.setSetter('myRpsChoice', choice);
                            socket.emit('pvp_action', { roomID: store.pvpRoomID, action: { type: 'RPS_CHOICE', payload: { choice } } });
                         }}>
                            {choice === 'rock' ? <Circle size={32} /> : choice === 'paper' ? <Hand size={32} /> : <Scissors size={32} />}
                            <span>{choice.toUpperCase()}</span>
                         </button>
                      ))}
                   </div>
                   {store.rpsWinner && (
                      <div className="rps-result-announcement">
                         <div className="rps-reveal-reveal">
                           <div className="reveal-side">
                             <span>TÚ</span>
                             <div className="mini-choice-icon">
                               {store.myRpsChoice === 'rock' ? <Circle size={24} /> : store.myRpsChoice === 'paper' ? <Hand size={24} /> : <Scissors size={24} />}
                             </div>
                           </div>
                           <div className="reveal-side">
                             <span>RIVAL</span>
                             <div className="mini-choice-icon">
                               {store.opponentRpsChoice === 'rock' ? <Circle size={24} /> : store.opponentRpsChoice === 'paper' ? <Hand size={24} /> : <Scissors size={24} />}
                             </div>
                           </div>
                         </div>
                         <h3 className={store.rpsWinner === user.username ? 'text-gold' : 'text-danger'}>{store.rpsWinner === user.username ? '¡VAS PRIMERO!' : `EMPIEZA ${enemy.username || enemy.name.toUpperCase()}`}</h3>
                      </div>
                   )}
                </div>
             </div>
          )}
        </AnimatePresence>

        <div className="duel-character-container player-character">
          <div className="character-avatar-wrap">
            <img src={`${baseUrl}${pPOV.data?.equippedAvatar || pPOV.data?.imageUrl || '/default.png'}`} alt="Player Avatar" />
            <div className="character-stats-overlay">
              <p className="hero-label">{pPOV.data?.name} • {Math.max(0, pPOV.hp)} LP</p>
              <div className="hp-bar player-hp"><motion.div animate={{ width: `${Math.max(0, (pPOV.hp / (pPOV.maxHP || 1000)) * 100)}%` }} /></div>
            </div>
          </div>
        </div>
        <div className="duel-character-container enemy-character">
          <div className="character-avatar-wrap">
            <img src={`${baseUrl}${ePOV.data?.equippedAvatar || ePOV.data?.imageUrl || '/default.png'}`} alt="Enemy Avatar" />
            <div className="character-stats-overlay">
              <p className="hero-label" style={{ color: '#ef4444' }}>{ePOV.data?.name} • {Math.max(0, ePOV.hp)} LP</p>
              <div className="hp-bar enemy-hp"><motion.div animate={{ width: `${Math.max(0, (ePOV.hp / (ePOV.maxHP || 1000)) * 100)}%` }} /></div>
            </div>
          </div>
        </div>

        {renderEnemySide({}, ePOV.deck.length, ePOV.hp)}
        <BattleConsole onExit={onExit} />
        {renderPlayerSide({}, pPOV.deck.length, pPOV.hp)}
        <HandArea baseUrl={baseUrl} />

        <AnimatePresence>
          {store.winner && (
            <div className="winner-overlay">
              <div className="winner-card glass-panel">
                <h1 className={store.winner === 'VICTORIA' ? 'victory-text' : 'defeat-text'}>{store.winner}</h1>
                <button className="arcade-btn" onClick={async () => {
                   try {
                     const { refreshUserData } = await import('../store.js').then(m => m.default.getState());
                     if (refreshUserData) {
                       await refreshUserData(user.username || user.name, `${baseUrl}/api/shop`);
                     }
                   } catch(err) { console.error("Error refreshing after duel", err); }
                   onExit();
                }}>VOLVER AL MENÚ</button>
              </div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {store.hoveredCard && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="card-preview-sidebar">
               <div className="preview-container glass-panel">
                  <div className="preview-card-wrap"><CardEntity card={store.hoveredCard} baseUrl={baseUrl} /></div>
                  <div className="preview-details">
                     <h2 className="preview-name">{store.hoveredCard.name}</h2>
                     <p className="preview-desc">{store.hoveredCard.description}</p>
                     <div className="preview-stats-row"><div className="preview-stat-pill atk">⚔️ {store.hoveredCard.attack}</div><div className="preview-stat-pill def">🛡️ {store.hoveredCard.defense}</div></div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DuelArena;
