import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useMatchStore from '../../store/useMatchStore';
import CardEntity from './CardEntity';

const FieldSlot = ({ side, index, baseUrl }) => {
  const store = useMatchStore();
  
  // Use POV helpers for absolute P1/P2 mapping
  const prefix = store.getPOVPrefix(side); // 'p1' or 'p2'
  const myPrefix = store.getPOVPrefix('player');
  const field = store[prefix + 'Field'];
  const cardBase = field[index];
  const card = cardBase ? store.getEffectiveStats(cardBase, prefix === 'p1' ? 'player1' : 'player2') : null;
  const myHand = store[myPrefix + 'Hand'];

  const isBATTLE = store.phase === 'BATTLE';
  const isMe = side === 'player';
  
  // Attacking/Defending indicators (absolute)
  const isAttacking = store.attackingIdx === `${prefix}-${index}`;
  const isDefending = store.defendingIdx === `${prefix}-${index}`;
  
  // Attacker selected (only for 'player' side)
  const isAttackerSelected = isMe && store.selectedAttackerIdx === index;

  const isTargetable = !isMe && store.selectedAttackerIdx !== null && isBATTLE;
  
  const isActionable = isMe && (
    (isBATTLE && card && card.attacksThisTurn === 0) ||
    (store.selectedHandIdx !== null && myHand[store.selectedHandIdx]?.type === 'Monster' && !card) ||
    (store.selectedHandIdx !== null && myHand[store.selectedHandIdx]?.type === 'Spell' && card)
  );

  const handleClick = () => {
    const isMobile = window.innerWidth < 1024;
    
    if (isMe) {
      if (store.selectedHandIdx !== null) {
        store.placeCard(store.selectedHandIdx, index);
      } else {
        if (isMobile && card) store.setSetter('hoveredCard', card);
        store.handleCardClick(index, store.myRole);
      }
    } else {
      if (isMobile && card && store.selectedAttackerIdx === null) {
        store.setSetter('hoveredCard', card);
      } else {
        store.handleCardClick(index, prefix === 'p1' ? 'player1' : 'player2');
      }
    }
  };

  return (
    <div
      className={`slot glass-panel ${isTargetable ? 'targetable' : ''} ${isActionable ? 'actionable-slot' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => store.setSetter('hoveredCard', card)}
      onMouseLeave={() => store.setSetter('hoveredCard', null)}
      style={{ position: 'relative' }}
    >
      <AnimatePresence>
        {card ? (
          <motion.div
            key={card._id + index}
            layoutId={`${prefix}-card-${index}`}
            initial={isMe ? { opacity: 0, y: -200, scale: 2 } : { opacity: 0, y: -50 }}
            animate={{
              opacity: 1,
              y: isAttacking ? (isMe ? -150 : 150) : 0,
              x: isDefending ? [0, -10, 10, -10, 10, 0] : 0,
              scale: isAttackerSelected ? 1.05 : (isDefending ? 0.95 : 1),
              zIndex: (isAttacking || isAttackerSelected) ? 100 : 1,
              filter: isDefending ? 'brightness(1.8) sepia(0.5) hue-rotate(-50deg)' : 'brightness(1)'
            }}
            exit={{ opacity: 0, scale: 0, rotate: isMe ? -15 : 15 }}
            transition={{ duration: 0.4 }}
            className={`arena-card ${!isMe ? 'card-enemy' : ''} ${card.attacksThisTurn > 0 ? 'exhausted' : ''} ${card.frozen > 0 ? 'frozen-card' : ''} ability-${(card.ability || '').toLowerCase().replace(/\s+/g, '-')}`}
          >
            <CardEntity card={card} baseUrl={baseUrl} />
          </motion.div>
        ) : (
          isMe && <div className="slot-placeholder" style={{ opacity: (store.phase.includes('MAIN')) ? 0.5 : 0.1 }}>D&D</div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FieldSlot;
