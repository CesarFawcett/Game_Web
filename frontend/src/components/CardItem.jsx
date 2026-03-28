import React from 'react';
import { motion } from 'framer-motion';
import { ABILITY_ICONS } from '../constants.jsx';

function CardItem({ info, count, inDeckCount, onAdd, onRemove, onSell, baseUrl }) {
  return (
    <motion.div
      className="card-pixel"
      whileHover={{ y: -10, scale: 1.02 }}
      layoutId={info._id}
    >
      <div style={{ height: '70%', background: `url(${baseUrl}${info.imageUrl}) center/cover`, position: 'relative' }}>
        {/* Count Badge */}
        {count > 1 && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'var(--primary)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 900,
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            zIndex: 10
          }}>
            x{count}
          </div>
        )}
        {/* In Deck Badge */}
        {inDeckCount > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'var(--accent-gold)',
            color: 'var(--background)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 900,
            zIndex: 10
          }}>
            EN MAZO ({inDeckCount})
          </div>
        )}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '32px',
          height: '32px',
          background: 'rgba(15, 23, 42, 0.9)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 10px rgba(0,0,0,0.5)',
          border: '1px solid var(--glass-border)',
          zIndex: 5
        }}>
          {ABILITY_ICONS[info.ability] || ABILITY_ICONS['Ninguno']}
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        <p style={{ fontSize: '1rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.5px' }}>{info.name}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>⚔️ {info.attack}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>🛡️ {info.defense}</span>
        </div>
      </div>

      <div className="deck-controls" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', padding: '0 10px 10px' }}>
        {onAdd && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            style={{
              background: (count > inDeckCount) ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255,255,255,0.05)',
              color: (count > inDeckCount) ? 'white' : 'var(--text-muted)',
              fontSize: '0.7rem',
              fontWeight: 900,
              borderRadius: '8px',
              padding: '0.5rem',
              border: 'none',
              cursor: (count > inDeckCount) ? 'pointer' : 'not-allowed'
            }}
            disabled={count <= inDeckCount}
          >
            AGREGAR
          </button>
        )}
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{
              background: inDeckCount > 0 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255,255,255,0.05)',
              color: inDeckCount > 0 ? 'white' : 'var(--text-muted)',
              fontSize: '0.7rem',
              fontWeight: 900,
              borderRadius: '8px',
              padding: '0.5rem',
              border: 'none',
              cursor: inDeckCount > 0 ? 'pointer' : 'not-allowed'
            }}
            disabled={inDeckCount === 0}
          >
            QUITAR
          </button>
        )}
        {onSell && (
          <button
            onClick={(e) => { e.stopPropagation(); onSell(); }}
            style={{
              gridColumn: '1 / span 2',
              background: 'rgba(34, 197, 94, 0.6)',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 900,
              borderRadius: '8px',
              padding: '0.4rem',
              border: 'none',
              marginTop: '5px'
            }}
          >
            VENDER (100)
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default CardItem;
