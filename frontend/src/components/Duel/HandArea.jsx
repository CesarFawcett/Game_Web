import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useMatchStore from '../../store/useMatchStore';

const HandArea = ({ baseUrl }) => {
  const store = useMatchStore();
  const prefix = store.getPOVPrefix('player');
  const myHand = store[prefix + 'Hand'];
  const isMyTurn = store.turn === store.myRole;

  if (store.isPvP) {
    console.log(`[HandArea] PvP Hand Debug: Role=${store.myRole}, Prefix=${prefix}, HandSize=${myHand?.length}`);
  }

  return (
    <div className="player-hand-container">
      <AnimatePresence>
        <div className="hand-cards">
          {myHand.map((card, idx) => {
            if (!card) return null; // In PvP, eHand might have nulls as placeholders if not P2
            return (
              <motion.div
                key={card._id + idx}
                className={`hand-card ${store.selectedHandIdx === idx ? 'selected' : ''}`}
                onClick={() => {
                  if (!isMyTurn || store.winner || store.splashText || (store.phase !== 'MAIN 1' && store.phase !== 'MAIN 2')) return;
                  store.setSetter('selectedAttackerIdx', null);
                  store.setSetter('selectedHandIdx', store.selectedHandIdx === idx ? null : idx);
                }}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: store.selectedHandIdx === idx ? -50 : 0, scale: store.selectedHandIdx === idx ? 1.2 : 1, zIndex: store.selectedHandIdx === idx ? 10 : 1 }}
                exit={{ opacity: 0, scale: 0.5 }} whileHover={{ y: store.selectedHandIdx === idx ? -50 : -20, scale: 1.1, zIndex: 10 }}
              >
                <img src={`${card.imageUrl && typeof card.imageUrl === 'string' && card.imageUrl.startsWith('http') ? '' : baseUrl}${card.imageUrl}`} alt={card.name} draggable="false" />
                {card.type !== 'Monster' && (
                  <div style={{ position: 'absolute', top: -10, left: -10, background: card.type === 'Spell' ? '#a855f7' : '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {card.type === 'Spell' ? 'Hechizo' : 'Trampa'}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
};

export default HandArea;
