import React, { useEffect } from 'react';
import { Swords, Timer, Scissors, Hand, Circle, Crown, Disc, X, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useMatchStore from '../store/useMatchStore';

import PhaseIndicator from './Duel/PhaseIndicator';
import BattleConsole from './Duel/BattleConsole';
import FieldSlot from './Duel/FieldSlot';
import HandArea from './Duel/HandArea';
import CardEntity from './Duel/CardEntity';

import { socket } from '../utils/socket';

function DuelArena({ user, enemy, playerDeckIds, cardsPool, baseUrl, globalConfig, login, onExit }) {
  const store = useMatchStore();

  // COIN FLIP STATES
  const [coinFlipActive, setCoinFlipActive] = React.useState(false);
  const [coinResult, setCoinResult] = React.useState(null); // 'heads' or 'tails'
  const [coinAnimating, setCoinAnimating] = React.useState(false);
  const [showFinalMsg, setShowFinalMsg] = React.useState(false);
  const [victoryData, setVictoryData] = React.useState(null);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);

  // 1. Setup & Initialization
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    if (!user || !enemy || !cardsPool || cardsPool.length === 0) {
      console.log("[DuelArena] Waiting for data to initialize...", { user: !!user, enemy: !!enemy, pool: cardsPool?.length });
      return;
    }

    if (!store.isPvP) {
      console.log("[DuelArena] Calling initGame for story mode");
      store.initGame(user, enemy, playerDeckIds, cardsPool);
    }
    
    // ... (Socket listeners unchanged) ...
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
          let myAssignedRole = data.roles[socket.id];
          if (!myAssignedRole) {
            const amIP1 = data.p1Name === (user.username || user.name);
            myAssignedRole = amIP1 ? 'player1' : 'player2';
          }
          store.setSetter('myRole', myAssignedRole);
          store.setSetter('rpsPhase', false);
          store.setSetter('isProcessing', false);
          const firstTurn = data.firstTurn || 'player1';
          store.setSetter('turn', firstTurn); 
          const isMeFirst = myAssignedRole === firstTurn;
          const orderMsg = isMeFirst ? '¡VAS PRIMERO!' : 'VAS SEGUNDO';
          store.showSplash(orderMsg);
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
          const vData = await victoryRes.json();
          if (vData.success) {
            const updatedUser = { 
              ...user, 
              credits: vData.newCredits, 
              defeatedEnemies: vData.defeatedEnemies || user.defeatedEnemies || [],
              duelsUnlocked: vData.duelsUnlocked || user.duelsUnlocked,
              inventory: vData.rewardCard ? [...(user.inventory || []), vData.rewardCard._id] : (user.inventory || []),
              discoveredCards: vData.rewardCard ? [...new Set([...(user.discoveredCards || []), vData.rewardCard._id])] : (user.discoveredCards || [])
            };
            
            if (login) login(updatedUser);
            
            // --- INITIATE COIN FLIP SEQUENCE ---
            setVictoryData(vData);
            setCoinResult(vData.rewardCard ? 'heads' : 'tails');
            setCoinFlipActive(true);
            setCoinAnimating(true);
            
            // Stop animation and show result after 3s
            setTimeout(() => {
              setCoinAnimating(false);
              setShowFinalMsg(true);
            }, 3000);
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
      window.removeEventListener('resize', handleResize);
    };
  }, [store.isPvP, enemy?._id, user?.username, playerDeckIds?.length, cardsPool?.length, baseUrl]); // eslint-disable-line

  if (!user || !enemy) return <div className="loading-duel">Cargando Arena de Duelo...</div>;

  // POV States for rendering
  const pPOV = store.getPOVState('player');
  const ePOV = store.getPOVState('enemy');

  // MOBILE PREVIEW LOGIC
  const mobilePreviewCard = store.hoveredCard;
  const handPreviewCard = store.selectedHandIdx !== null ? pPOV.hand[store.selectedHandIdx] : null;

  const renderMobilePreview = () => {
    if (!isMobile) return null;
    return (
      <AnimatePresence>
        {handPreviewCard && (
           <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.35, scale: 1.1 }} exit={{ opacity: 0 }} className="mobile-hand-preview-bg">
              <img src={`${handPreviewCard.imageUrl && typeof handPreviewCard.imageUrl === 'string' && handPreviewCard.imageUrl.startsWith('http') ? '' : baseUrl}${handPreviewCard.imageUrl}`} alt="Hand Preview" />
           </motion.div>
        )}
        {mobilePreviewCard && (
           <div className="mobile-preview-overlay" onClick={() => store.setSetter('hoveredCard', null)}>
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="mobile-preview-card glass-panel" onClick={(e) => e.stopPropagation()}>
                 <div className="preview-card-wrap"><CardEntity card={mobilePreviewCard} baseUrl={baseUrl} /></div>
                 <div className="preview-details">
                    <h2 className="preview-name">{mobilePreviewCard.name}</h2>
                    <p className="preview-ability-label">{mobilePreviewCard.abilityName || mobilePreviewCard.ability}</p>
                    <p className="preview-desc">{mobilePreviewCard.description}</p>
                    <div className="preview-stats-row">
                      <div className="preview-stat-pill atk">⚔️ {mobilePreviewCard.attack}</div>
                      <div className="preview-stat-pill def">🛡️ {mobilePreviewCard.defense}</div>
                    </div>
                    <button className="btn-close-preview" onClick={() => store.setSetter('hoveredCard', null)}><X size={20} /> CERRAR</button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    );
  };

  const enemyFieldTexture = ePOV.data?.fieldTextureUrl
    ? { backgroundImage: `url(${ePOV.data.fieldTextureUrl && typeof ePOV.data.fieldTextureUrl === 'string' && ePOV.data.fieldTextureUrl.startsWith('http') ? '' : baseUrl}${ePOV.data.fieldTextureUrl})`, backgroundSize: 'cover' }
    : {};
  const playerFieldTexture = pPOV.data?.equippedTexture
    ? { backgroundImage: `url(${pPOV.data.equippedTexture && typeof pPOV.data.equippedTexture === 'string' && pPOV.data.equippedTexture.startsWith('http') ? '' : baseUrl}${pPOV.data.equippedTexture})`, backgroundSize: 'cover' }
    : {};

  const renderEnemySide = (profileProps, deckLimit, hp) => {
    const traps = ePOV.traps;
    return (
      <div className="board-side enemy-side">
        <div className="field-section" style={enemyFieldTexture}>
          <div className="trap-row enemy-traps">
            <div className="deck-box mini-deck" style={{ marginRight: '0.8rem' }}>
              <div className="deck-texture" style={{ background: ePOV.data?.cardBackUrl ? `url(${ePOV.data.cardBackUrl && typeof ePOV.data.cardBackUrl === 'string' && ePOV.data.cardBackUrl.startsWith('http') ? '' : baseUrl}${ePOV.data.cardBackUrl}) center/cover` : (ePOV.data?.cardBackImageUrl ? `url(${ePOV.data.cardBackImageUrl && typeof ePOV.data.cardBackImageUrl === 'string' && ePOV.data.cardBackImageUrl.startsWith('http') ? '' : baseUrl}${ePOV.data.cardBackImageUrl}) center/cover` : 'var(--accent-gold)') }}></div>
              <span className="deck-count">{deckLimit}</span>
            </div>
            {[2, 1, 0].map(i => (
              <div key={`trap-enemy-${i}`} className="side-trap-slot" onMouseEnter={() => traps[i] && store.setSetter('hoveredCard', traps[i])} onMouseLeave={() => store.setSetter('hoveredCard', null)}>
                {traps[i] ? <img src={`${traps[i].imageUrl && typeof traps[i].imageUrl === 'string' && traps[i].imageUrl.startsWith('http') ? '' : baseUrl}${traps[i].imageUrl}`} alt="Trap" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="trap-text">TRAMPA</span>}
              </div>
            ))}
          </div>
          <div className="monster-row">
            <div className="side-trap-slot graveyard-slot enemy-graveyard" title="Cementerio Enemigo">
              {ePOV.graveyard.length > 0 ? (
                <div className="arena-card small-card">
                  <img src={`${ePOV.graveyard[ePOV.graveyard.length - 1].imageUrl && typeof ePOV.graveyard[ePOV.graveyard.length - 1].imageUrl === 'string' && ePOV.graveyard[ePOV.graveyard.length - 1].imageUrl.startsWith('http') ? '' : baseUrl}${ePOV.graveyard[ePOV.graveyard.length - 1].imageUrl}`} alt="Grave" />
                </div>
              ) : <span className="trap-text">CEMENTERIO</span>}
            </div>
            {[2, 1, 0].map(i => <FieldSlot key={`enemy-${i}`} side="enemy" index={i} baseUrl={baseUrl} />)}
          </div>
        </div>
        {store.selectedAttackerIdx !== null && store.turn === store.myRole && ePOV.field.filter(slot => !slot).length > store.directAttacksThisTurn && (
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
                  <img src={`${pPOV.graveyard[pPOV.graveyard.length - 1].imageUrl && typeof pPOV.graveyard[pPOV.graveyard.length - 1].imageUrl === 'string' && pPOV.graveyard[pPOV.graveyard.length - 1].imageUrl.startsWith('http') ? '' : baseUrl}${pPOV.graveyard[pPOV.graveyard.length - 1].imageUrl}`} alt="Grave" />
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
                  {traps[i] ? <img src={`${traps[i].imageUrl && typeof traps[i].imageUrl === 'string' && traps[i].imageUrl.startsWith('http') ? '' : baseUrl}${traps[i].imageUrl}`} alt="Trap" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="trap-text">TRAMPA</span>}
                </div>
              );
            })}
            <div className="deck-box" style={{ marginLeft: '0.8rem' }}>
              <div className="deck-texture" style={{ 
                background: pPOV.data?.equippedCardBack 
                  ? `url(${pPOV.data.equippedCardBack && typeof pPOV.data.equippedCardBack === 'string' && pPOV.data.equippedCardBack.startsWith('http') ? '' : baseUrl}${pPOV.data.equippedCardBack}) center/cover` 
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
    ? { background: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${pPOV.data.equippedFieldImage && typeof pPOV.data.equippedFieldImage === 'string' && pPOV.data.equippedFieldImage.startsWith('http') ? '' : baseUrl}${pPOV.data.equippedFieldImage}) center/cover no-repeat` }
    : (ePOV.data?.fieldImageUrl
      ? { background: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${ePOV.data.fieldImageUrl && typeof ePOV.data.fieldImageUrl === 'string' && ePOV.data.fieldImageUrl.startsWith('http') ? '' : baseUrl}${ePOV.data.fieldImageUrl}) center/cover no-repeat` }
      : {});

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

        {/* GLOBAL VFX OVERLAYS */}
        {store.activeEffect && store.activeEffect.type === 'PutrefaccionGlobal' && (
          <div className="fx-rot-global" />
        )}

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
                     <p>TU APUESTA</p> {store.myBet && <img src={`${store.myBet.imageUrl && typeof store.myBet.imageUrl === 'string' && store.myBet.imageUrl.startsWith('http') ? '' : baseUrl}${store.myBet.imageUrl}`} alt="My Bet" className="bet-img" />}
                  </div>
                  <Swords size={48} className="text-gold" />
                  <div className="bet-item">
                     <p>APUESTA RIVAL</p> {store.opponentBet && <img src={`${store.opponentBet.imageUrl && typeof store.opponentBet.imageUrl === 'string' && store.opponentBet.imageUrl.startsWith('http') ? '' : baseUrl}${store.opponentBet.imageUrl}`} alt="Opponent Bet" className="bet-img" />}
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
            <img src={`${pPOV.data?.equippedAvatar || pPOV.data?.imageUrl || '/default.png' && typeof pPOV.data?.equippedAvatar || pPOV.data?.imageUrl || '/default.png' === 'string' && pPOV.data?.equippedAvatar || pPOV.data?.imageUrl || '/default.png'.startsWith('http') ? '' : baseUrl}${pPOV.data?.equippedAvatar || pPOV.data?.imageUrl || '/default.png'}`} alt="Player Avatar" />
            <div className="character-stats-overlay">
              <p className="hero-label">{pPOV.data?.name} • {Math.max(0, pPOV.hp)} LP</p>
              <div className="hp-bar player-hp"><motion.div animate={{ width: `${Math.max(0, (pPOV.hp / (pPOV.maxHP || 1000)) * 100)}%` }} /></div>
            </div>
          </div>
        </div>
        <div className="duel-character-container enemy-character">
          <div className="character-avatar-wrap">
            <img src={`${ePOV.data?.equippedAvatar || ePOV.data?.imageUrl || '/default.png' && typeof ePOV.data?.equippedAvatar || ePOV.data?.imageUrl || '/default.png' === 'string' && ePOV.data?.equippedAvatar || ePOV.data?.imageUrl || '/default.png'.startsWith('http') ? '' : baseUrl}${ePOV.data?.equippedAvatar || ePOV.data?.imageUrl || '/default.png'}`} alt="Enemy Avatar" />
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

        {renderMobilePreview()}

        <AnimatePresence>
          {coinFlipActive && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(15px)' }}
            >
              <div className="coin-container">
                <div 
                  className="coin-flip-card"
                  style={{ 
                    transform: coinAnimating 
                      ? 'rotateY(2520deg)' 
                      : (coinResult === 'heads' ? 'rotateY(0deg)' : 'rotateY(180deg)') 
                  }}
                >
                  <div className="coin-face face-front">
                    <div className="coin-shine"></div>
                    <div className="coin-symbol">
                      <Crown size={80} strokeWidth={2.5} fill="rgba(255,255,255,0.2)" />
                    </div>
                    <span className="coin-label">CARA</span>
                  </div>
                  <div className="coin-face face-back">
                    <div className="coin-shine"></div>
                    <div className="coin-symbol">
                      <Disc size={80} strokeWidth={2.5} fill="rgba(255,255,255,0.1)" />
                    </div>
                    <span className="coin-label">SELLO</span>
                  </div>
                </div>
              </div>

              {showFinalMsg && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', zIndex: 3005 }}>
                  <h2 className="gradient-text" style={{ fontSize: '3.5rem', fontWeight: 950, marginBottom: '0.5rem', textShadow: '0 0 30px rgba(99,102,241,0.5)' }}>
                    {coinResult === 'heads' ? '¡GANASTE CARTA!' : 'SUERTE LA PRÓXIMA VEZ'}
                  </h2>
                  
                  {coinResult === 'heads' && victoryData?.rewardCard && (
                    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 15 }}>
                       <div style={{ width: '180px', height: '250px', margin: '1.5rem auto', borderRadius: '16px', overflow: 'hidden', border: '5px solid var(--accent-gold)', boxShadow: '0 0 50px rgba(212,175,55,0.6)', transform: 'perspective(1000px) rotateX(10deg)' }}>
                          <img src={`${victoryData.rewardCard.imageUrl && typeof victoryData.rewardCard.imageUrl === 'string' && victoryData.rewardCard.imageUrl.startsWith('http') ? '' : baseUrl}${victoryData.rewardCard.imageUrl}`} alt="Reward" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       </div>
                       <p style={{ fontWeight: 950, fontSize: '1.5rem', color: 'var(--accent-gold)', letterSpacing: '2px', textTransform: 'uppercase' }}>{victoryData.rewardCard.name}</p>
                    </motion.div>
                  )}

                  <button className="btn-epic-cta" style={{ marginTop: '3rem', padding: '1rem 3rem', fontSize: '1.2rem' }} onClick={() => {
                     setCoinFlipActive(false);
                     onExit();
                  }}>RECLAMAR Y VOLVER</button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {store.winner && !coinFlipActive && (store.winner === 'DERROTA' || store.isPvP) && (
            <div className="winner-overlay" style={{ zIndex: 2500 }}>
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
          {(store.hoveredCard || (store.selectedHandIdx !== null && pPOV.hand[store.selectedHandIdx])) && (() => {
            const previewCard = store.hoveredCard || pPOV.hand[store.selectedHandIdx];
            return (
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="card-preview-sidebar">
                 <div className="preview-container glass-panel">
                    <div className="preview-card-wrap"><CardEntity card={previewCard} baseUrl={baseUrl} /></div>
                    <div className="preview-details">
                       <h2 className="preview-name">{previewCard.name}</h2>
                       <p className="preview-desc" style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem', fontWeight: 'bold' }}>{previewCard.abilityName || previewCard.ability}</p>
                       <p className="preview-desc">{previewCard.description}</p>
                       <div className="preview-stats-row">
                         <div className="preview-stat-pill atk">⚔️ {previewCard.attack}</div>
                         <div className="preview-stat-pill def">🛡️ {previewCard.defense}</div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DuelArena;
