import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, Play, Lock } from 'lucide-react';

function StoryView({ user, baseUrl, onStartDuel }) {
  const [enemies, setEnemies] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem' }}>CARGANDO HISTORIA...</div>;

  return (
    <div className="story-container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900 }}>MODO HISTORIA: EL CAMINO DEL DUELISTA</h2>
        <p style={{ color: 'var(--text-muted)' }}>Derrota a los guardianes de cada rango para alcanzar la gloria máxima.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
        {enemies.map((enemy, index) => {
          const prevEnemy = enemies.find(e => e.rankIndex === enemy.rankIndex - 1);
          const isPrevDefeated = !prevEnemy || (user.defeatedEnemies || []).includes(prevEnemy._id);
          const isRankUnlocked = enemy.rankIndex === 0 || isPrevDefeated;
          const isEnabled = enemy.enabled && enemy.deck && enemy.deck.length > 0 && isRankUnlocked;

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
                background: isEnabled ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)'
              }}
            >
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
                background: `url(${baseUrl}${enemy.imageUrl}) center/cover`,
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
                    className="arcade-btn" 
                    style={{ margin: 0 }}
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
        
        {enemies.length === 0 && (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>No hay desafíos disponibles actualmente. Vuelve más tarde.</p>
            </div>
        )}
      </div>
    </div>
  );
}

export default StoryView;
