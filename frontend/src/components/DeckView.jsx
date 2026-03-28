import React from 'react';
import CardItem from './CardItem';

function DeckView({ cards, deckInstances, onRemove, baseUrl }) {
  const cardCounts = deckInstances.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900 }}>MI MAZO</h2>
          <p style={{ color: 'var(--text-muted)' }}>Mínimo 10 cartas, Máximo 30 cartas</p>
        </div>
        <div className="glass-panel" style={{ padding: '0.8rem 1.5rem', borderRadius: '15px', border: deckInstances.length < 10 ? '1px solid #ef4444' : '1px solid var(--primary)' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: deckInstances.length < 10 ? '#ef4444' : 'var(--primary)' }}>
            CARTAS: {deckInstances.length} / 30
          </span>
          {deckInstances.length < 10 && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.2rem' }}>Se requieren al menos 10 cartas</p>}
        </div>
      </div>

      <div className="board-grid">
        {cards.map(card => {
           const count = cardCounts[card._id];
           if (!count) return null;
           return (
            <CardItem
                key={card._id}
                info={card}
                count={count}
                inDeckCount={count}
                onRemove={() => onRemove(card._id)}
                baseUrl={baseUrl}
            />
           )
        })}
        {deckInstances.length === 0 && (
           <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Tu mazo está vacío. ¡Agrega cartas desde tu colección!</p>
        )}
      </div>
    </div>
  );
}

export default DeckView;
