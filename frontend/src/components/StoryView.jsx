import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Play, Lock, X, Gift, Info } from 'lucide-react';

function StoryView({ user, baseUrl, onStartDuel }) {
  const [enemies, setEnemies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLootEnemy, setSelectedLootEnemy] = useState(null);
  const [showStoryInfo, setShowStoryInfo] = useState(false);

  useEffect(() => {
    fetchEnemies();
  }, []);

  const fetchEnemies = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/story/enemies?role=player`);
      setEnemies(res.data);
    } catch (err) {
      console.error("Error fetching story enemies:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDrops = (deck) => {
    if (!deck || deck.length === 0) return [];
    
    const RARITY_WEIGHTS = {
      'Común': 100,
      'Rara': 40,
      'Épica': 15,
      'Legendaria': 5,
      'Mítica': 2,
      'Divina': 1,
      'Ancestral': 0.5,
      'Inmortal': 0.2,
      'Cósmica': 0.1
    };

    // Find all UNIQUE cards
    const uniqueCardsMap = {};
    deck.forEach(c => {
      if (c && c._id && !uniqueCardsMap[c._id]) {
        uniqueCardsMap[c._id] = c;
      }
    });

    const uniqueList = Object.values(uniqueCardsMap);
    if (uniqueList.length === 0) return [];

    // Calculate total weight
    const totalWeight = uniqueList.reduce((sum, card) => {
      return sum + (RARITY_WEIGHTS[card.rarity] || 100);
    }, 0);

    // Calculate probabilities
    return uniqueList.map(card => {
        const weight = RARITY_WEIGHTS[card.rarity] || 100;
        return {
            ...card,
            relativeProb: (weight / totalWeight) * 100,
            absoluteProb: (weight / totalWeight) * 50
        };
    }).sort((a, b) => b.absoluteProb - a.absoluteProb);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Común': return '#94a3b8';
      case 'Rara': return '#3b82f6';
      case 'Épica': return '#a855f7';
      case 'Legendaria': return '#eab308';
      case 'Mítica': return '#ec4899';
      case 'Divina': return '#facc15';
      case 'Ancestral': return '#f97316';
      case 'Inmortal': return '#ef4444';
      case 'Cósmica': return '#06b6d4';
      default: return 'white';
    }
  };

  if (loading) return <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem' }}>CARGANDO HISTORIA...</div>;

  return (
    <div className="story-container">
      <header style={{ textAlign: 'center', marginBottom: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', width: '100%' }}>
            <h2 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>MODO HISTORIA: EL CAMINO DEL DUELISTA</h2>
            <button 
              onClick={() => setShowStoryInfo(true)}
              className="btn-view-contents"
              title="Manual de Combate"
            >
              <Info className="text-gold" size={24} />
            </button>
        </div>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Derrota a los guardianes de cada rango para alcanzar la gloria máxima.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
        {enemies.map((enemy, index) => {
          const prevEnemy = enemies.find(e => e.rankIndex === enemy.rankIndex - 1);
          const isPrevDefeated = !prevEnemy || (user.defeatedEnemies || []).includes(prevEnemy._id);
          const isRankUnlocked = enemy.rankIndex === 0 || isPrevDefeated;
          const isEnabled = enemy.enabled && enemy.deck && enemy.deck.length > 0 && isRankUnlocked;

          // Unique cards for drop preview
          const uniqueCards = [];
          const seen = new Set();
          (enemy.deck || []).forEach(card => {
            if (card && card._id && !seen.has(card._id)) {
              uniqueCards.push(card);
              seen.add(card._id);
            }
          });

          return (
            <motion.div 
              key={enemy._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-panel ${!isEnabled ? 'disabled' : ''}`}
              style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                position: 'relative',
                border: isEnabled ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                background: isEnabled ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)',
                overflow: 'hidden'
              }}
            >
              {isEnabled && uniqueCards.length > 0 && (
                <div 
                  className="possible-drops-container" 
                  onClick={() => setSelectedLootEnemy(enemy)}
                  style={{ 
                  position: 'absolute', 
                  top: '10px', 
                  left: '10px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '5px',
                  alignItems: 'flex-start',
                  zIndex: 10,
                  cursor: 'pointer'
                }}>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: 900, 
                    color: 'var(--accent-gold)', 
                    background: 'rgba(0,0,0,0.5)', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    letterSpacing: '1px' 
                  }}>POSIBLE BOTÍN</span>
                  <div style={{ display: 'flex', gap: '-5px' }}>
                    {uniqueCards.slice(0, 3).map((c, i) => (
                      <div 
                        key={c._id}
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          border: '2px solid var(--accent-gold)',
                          background: `url(${c.imageUrl && typeof c.imageUrl === 'string' && c.imageUrl.startsWith('http') ? '' : baseUrl}${c.imageUrl}) center/cover`,
                          marginLeft: i > 0 ? '-10px' : '0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                        }}
                      />
                    ))}
                    {uniqueCards.length > 3 && (
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: 'rgba(0,0,0,0.7)', 
                        border: '2px solid var(--glass-border)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        marginLeft: '-10px',
                        color: 'var(--text-muted)'
                      }}>+{uniqueCards.length - 3}</div>
                    )}
                  </div>
                </div>
              )}

              {!isEnabled && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)' }}>
                  <Lock size={20} />
                </div>
              )}
              
              <div style={{ 
                width: '120px', 
                height: '120px', 
                margin: '0 auto 1.5rem', 
                borderRadius: '50%', 
                background: `url(${enemy.imageUrl && typeof enemy.imageUrl === 'string' && enemy.imageUrl.startsWith('http') ? '' : baseUrl}${enemy.imageUrl}) center/cover`,
                backgroundSize: 'cover',
                border: `4px solid ${isEnabled ? 'var(--primary)' : 'var(--text-muted)'}`,
                boxShadow: isEnabled ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {!isEnabled && <Shield size={40} color="var(--text-muted)" style={{ filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))' }} />}
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>{enemy.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>Rango / Orden: {enemy.rankIndex}</p>
              {isEnabled ? (() => {
                const deckDefense = (enemy.deck || []).reduce((sum, c) => sum + (Number(c.defense) || 0), 0);
                const realHP = Math.floor(deckDefense / 3) || enemy.hp || 1000;
                return (
                <>
                  <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1.5rem' }}>HP: {realHP}</p>
                  <button 
                    className="btn-epic-cta" 
                    style={{ margin: '0 auto' }}
                    onClick={() => onStartDuel(enemy)}
                  >
                    <Play size={18} /> DESAFIAR
                  </button>
                </>
                );
              })() : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  {!isRankUnlocked ? 'Requiere vencer al enemigo anterior' : 'El guardián no está disponible'}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* DETAILED LOOT MODAL */}
      <AnimatePresence>
        {selectedLootEnemy && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{ zIndex: 2000, padding: '1rem' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}
              className="glass-panel"
              style={{ 
                maxWidth: '600px', 
                width: '100%', 
                maxHeight: '80vh', 
                display: 'flex', 
                flexDirection: 'column', 
                padding: '0',
                border: '1px solid var(--accent-gold)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Gift className="text-gold" size={24} />
                  <h3 style={{ margin: 0, letterSpacing: '2px', fontWeight: 900 }}>TABLA DE BOTÍN: {selectedLootEnemy.name}</h3>
                </div>
                <button 
                  onClick={() => setSelectedLootEnemy(null)}
                  style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                ><X size={24} /></button>
              </div>

              <div className="scrollbar" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(212,175,55,0.05)', padding: '0.8rem', borderRadius: '8px' }}>
                  Cada victoria otorga un <strong>50% de probabilidad</strong> de obtener una de las siguientes cartas:
                </p>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  {calculateDrops(selectedLootEnemy.deck).map(card => (
                    <div 
                      key={card._id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1.2rem', 
                        padding: '1rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)'
                      }}
                    >
                      <div style={{ 
                        width: '50px', 
                        height: '70px', 
                        borderRadius: '6px', 
                        background: `url(${card.imageUrl && typeof card.imageUrl === 'string' && card.imageUrl.startsWith('http') ? '' : baseUrl}${card.imageUrl}) center/cover`,
                        border: '1px solid var(--glass-border)'
                      }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 900 }}>{card.name}</h4>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 900, 
                            color: getRarityColor(card.rarity),
                            background: 'rgba(255,255,255,0.05)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: `1px solid ${getRarityColor(card.rarity)}33`
                          }}>{card.rarity?.toUpperCase() || 'COMÚN'}</span>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{card.type} | {card.attribute}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '1.2rem', 
                          fontWeight: 950, 
                          color: card.absoluteProb < 5 ? '#f87171' : 'var(--accent-gold)' 
                        }}>{card.absoluteProb.toFixed(1)}%</p>
                        <p style={{ margin: 0, fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>PROBABILIDAD</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMBAT MANUAL MODAL */}
      <AnimatePresence>
        {showStoryInfo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{ zIndex: 2000, padding: '1rem' }}
            onClick={() => setShowStoryInfo(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }}
              className="glass-panel"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                maxWidth: '700px', 
                width: '100%', 
                maxHeight: '80vh', 
                display: 'flex', 
                flexDirection: 'column', 
                padding: '0',
                border: '1px solid var(--primary)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Info className="text-primary" size={28} />
                  <h3 className="gradient-text" style={{ margin: 0, letterSpacing: '2px', fontWeight: 900 }}>MANUAL DE COMBATE</h3>
                </div>
                <button className="btn-close-modal" onClick={() => setShowStoryInfo(false)}><X size={24} /></button>
              </div>

              <div className="scrollbar" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, lineHeight: '1.6' }}>
                <h4 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 800 }}>Mecánicas contra el Jefe</h4>
                <p style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>
                  En el modo historia, te enfrentarás al Héroe enemigo. <strong>El objetivo es reducir la vitalidad (HP) del Héroe enemigo a 0.</strong> 
                </p>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                  Cada jefe tiene un nivel de defensa que bloquea ataques directos si hay cartas en su campo. Usa tus monstruos y trampas sabiamente. El HP del jefe se calcula en base a la defensa total de su mazo. Si derrotas una carta, el daño excedente <strong style={{color: 'var(--text-main)'}}>no se transfiere</strong> al jefe al menos que uses habilidades perforantes. Para atacarlo directo, su campo debe estar vacío.
                </p>

                <h4 style={{ color: '#38bdf8', marginBottom: '1rem', fontSize: '1.3rem', fontWeight: 800, marginTop: '2rem' }}>Fases de Batalla</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="glass-panel" style={{ padding: '1rem', border: '1px solid #eab30844' }}>
                    <h5 style={{ color: '#eab308', margin: '0 0 0.5rem', fontWeight: 900 }}>1. FASE DE ROBO Y STANDBY</h5>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>El sistema automáticamente resuelve los efectos pasivos vigentes (como Veneno) y robas una carta de tu mazo al inicio de tu turno.</p>
                  </div>
                  
                  <div className="glass-panel" style={{ padding: '1rem', border: '1px solid #3b82f644' }}>
                    <h5 style={{ color: '#3b82f6', margin: '0 0 0.5rem', fontWeight: 900 }}>2. FASE PRINCIPAL</h5>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Aquí puedes preparar el campo. Tienes derecho a <strong>colocar 1 Monstruo</strong> en el campo por turno, y colocar todas las <strong>cartas de Trampa</strong> que quieras (hasta un máximo de 3). Para usar habilidades pasivas de las cartas, asegúrate de colocarlas correctamente.</p>
                  </div>

                  <div className="glass-panel" style={{ padding: '1rem', border: '1px solid #ef444444' }}>
                    <h5 style={{ color: '#ef4444', margin: '0 0 0.5rem', fontWeight: 900 }}>3. FASE DE BATALLA</h5>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Selecciona tus cartas en el campo y haz clic en las cartas enemigas (o ataque directo al jugador si el campo enemigo está abierto). Cada carta solo puede atacar 1 vez por turno. Recuerda utilizar el botón de "Ataque Directo" cuando sea posible.</p>
                  </div>

                  <div className="glass-panel" style={{ padding: '1rem', border: '1px solid #8b5cf644' }}>
                    <h5 style={{ color: '#8b5cf6', margin: '0 0 0.5rem', fontWeight: 900 }}>4. FASE FINAL</h5>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Termina tu turno y cede el control. Las trampas del enemigo podrían revelarse ahora o durante tus ataques. ¡Mantente alerta!</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button className="btn-entendido" style={{ width: '100%' }} onClick={() => setShowStoryInfo(false)}>
                  ENTENDIDO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StoryView;
