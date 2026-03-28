import React, { useState } from 'react';
import SortButton from './SortButton';
import CardItem from './CardItem';

function CardsView({ cards, inventory, deck, onAdd, onRemove, onSell, baseUrl }) {
  const [sortKey, setSortKey] = useState('none'); 

  const cardCounts = inventory.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const deckCounts = deck.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const myCards = cards.filter(c => cardCounts[c._id] > 0);

  const sortedCards = [...myCards].sort((a, b) => {
    if (sortKey === 'ATK_DESC') return b.attack - a.attack;
    if (sortKey === 'ATK_ASC') return a.attack - b.attack;
    if (sortKey === 'DEF_DESC') return b.defense - a.defense;
    if (sortKey === 'DEF_ASC') return a.defense - b.defense;
    return 0;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Mi Colección Personal ({inventory.length} Cartas)</h2>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>ORDENAR POR:</span>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px' }}>
            <SortButton label="ATK" up={sortKey==='ATK_ASC'} active={sortKey.includes('ATK')} onClick={() => setSortKey(sortKey === 'ATK_DESC' ? 'ATK_ASC' : 'ATK_DESC')} />
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>
            <SortButton label="DEF" up={sortKey==='DEF_ASC'} active={sortKey.includes('DEF')} onClick={() => setSortKey(sortKey === 'DEF_DESC' ? 'DEF_ASC' : 'DEF_DESC')} />
          </div>
        </div>
      </div>
      
      <div className="board-grid">
        {sortedCards.length > 0 ? sortedCards.map(card => (
          <CardItem
            key={card._id}
            info={card}
            count={cardCounts[card._id]}
            inDeckCount={deckCounts[card._id] || 0}
            onAdd={() => onAdd(card._id)}
            onRemove={() => onRemove(card._id)}
            onSell={() => onSell(card._id)}
            baseUrl={baseUrl}
          />
        )) : (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Tu colección está vacía.</p>
            <p style={{ color: 'var(--primary)', fontWeight: 700, marginTop: '1rem' }}>¡Ve a la Tienda para conseguir tus primeras cartas!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CardsView;
