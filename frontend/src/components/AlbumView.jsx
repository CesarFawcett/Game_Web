import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Search, Filter } from 'lucide-react';

function AlbumView({ cards, discoveredIds, baseUrl }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // ALL, DISCOVERED, UNDISCOVERED
  const [sortBy, setSortBy] = useState('DEFAULT'); // DEFAULT, ATK_DESC, DEF_DESC

  const filteredAndSortedCards = useMemo(() => {
    let result = [...cards];

    // Filter by Search Term
    if (searchTerm) {
      result = result.filter(card => card.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter by Mode
    if (filterMode === 'DISCOVERED') {
      result = result.filter(card => discoveredIds.some(id => String(id) === String(card._id)));
    } else if (filterMode === 'UNDISCOVERED') {
      result = result.filter(card => !discoveredIds.some(id => String(id) === String(card._id)));
    }

    // Sort
    if (sortBy === 'ATK_DESC') {
      result.sort((a, b) => (b.attack || 0) - (a.attack || 0));
    } else if (sortBy === 'DEF_DESC') {
      result.sort((a, b) => (b.defense || 0) - (a.defense || 0));
    }

    return result;
  }, [cards, discoveredIds, searchTerm, filterMode, sortBy]);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900 }}>MI ÁLBUM REALEZA</h2>
        <p style={{ color: 'var(--text-muted)' }}>Avance de la Colección: {discoveredIds.length} / {cards.length}</p>
      </div>

      <div className="filters-container glass-panel" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="nes-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '35px', width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select 
            className="nes-select" 
            value={filterMode} 
            onChange={(e) => setFilterMode(e.target.value)}
            style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white' }}
          >
            <option value="ALL">Todas las Cartas</option>
            <option value="DISCOVERED">Descubiertas</option>
            <option value="UNDISCOVERED">Por Descubrir</option>
          </select>

          <select 
            className="nes-select" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)', color: 'white' }}
          >
            <option value="DEFAULT">Orden por Defecto</option>
            <option value="ATK_DESC">Mayor Ataque</option>
            <option value="DEF_DESC">Mayor Defensa</option>
          </select>
        </div>
      </div>

      <motion.div layout className="board-grid">
        <AnimatePresence mode='popLayout'>
          {filteredAndSortedCards.map(card => {
            const isDiscovered = discoveredIds.some(id => String(id) === String(card._id));
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                key={card._id}
                className={`card-pixel almanac-card ${!isDiscovered ? 'undiscovered' : ''}`}
                whileHover={isDiscovered ? { scale: 1.05, y: -5 } : {}}
              >
                {isDiscovered ? (
                  <div style={{ height: '100%', position: 'relative' }}>
                    <div style={{ height: '70%', background: `url(${card.imageUrl && typeof card.imageUrl === 'string' && card.imageUrl.startsWith('http') ? '' : baseUrl}${card.imageUrl}) center/cover`, borderRadius: '8px 8px 0 0' }}></div>
                    <div style={{ padding: '1rem' }}>
                      <p style={{ fontSize: '1rem', fontWeight: 900, textAlign: 'center' }}>{card.name}</p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '0.5rem', color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 900 }}>
                         <span>⚔️ {card.attack}</span>
                         <span>🛡️ {card.defense}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    height: '100%', 
                    width: '100%', 
                    background: card.cardBackImageUrl 
                        ? `url(${card.cardBackImageUrl && typeof card.cardBackImageUrl === 'string' && card.cardBackImageUrl.startsWith('http') ? '' : baseUrl}${card.cardBackImageUrl}) center/cover` 
                        : 'repeating-linear-gradient(45deg, rgba(15,23,42,0.9), rgba(15,23,42,0.9) 10px, rgba(30,41,59,0.9) 10px, rgba(30,41,59,0.9) 20px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    border: '2px solid rgba(255,255,255,0.1)',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
                  }}>
                    {!card.cardBackImageUrl && <Skull size={64} color="rgba(255,255,255,0.05)" />}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default AlbumView;
