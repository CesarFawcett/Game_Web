import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Archive, Layout } from 'lucide-react';
import CardsView from './CardsView';
import DeckView from './DeckView';
import AlbumView from './AlbumView';
import { useLocation, useNavigate } from 'react-router-dom';

function CollectionWrapper({ cards, user, deck, addCardToDeck, removeCardFromDeck, handleSellWrapper, BASE_URL }) {
  const location = useLocation();
  const navigate = useNavigate();
  // We use the URL path to determine which sub-tab is active so browser history works
  const [activeTab, setActiveTab] = useState(location.pathname === '/deck' ? 'deck' : location.pathname === '/album' ? 'album' : 'collection');

  useEffect(() => {
    setActiveTab(location.pathname === '/deck' ? 'deck' : location.pathname === '/album' ? 'album' : 'collection');
  }, [location.pathname]);

  const handleTab = (tab) => {
    setActiveTab(tab);
    navigate(`/${tab}`); // Keep URL in sync
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-navigation inside the unified Collection space */}
      <div className="collection-tabs">
        <button 
          onClick={() => handleTab('collection')}
          className="tab-button"
          style={{ 
            background: activeTab === 'collection' ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
            color: activeTab === 'collection' ? '#818cf8' : 'var(--text-muted)'
          }}
        >
          <Archive size={18} /> INVENTARIO
        </button>
        <button 
          onClick={() => handleTab('deck')}
          className="tab-button"
          style={{ 
            background: activeTab === 'deck' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: activeTab === 'deck' ? '#34d399' : 'var(--text-muted)'
          }}
        >
          <Shield size={18} /> MI DECK {deck && deck.length > 0 && <span style={{ background: '#10b981', color: '#000', padding: '2px 6px', borderRadius: '12px', fontSize: '0.8rem' }}>{deck.length}/30</span>}
        </button>
        <button 
          onClick={() => handleTab('album')}
          className="tab-button"
          style={{ 
            background: activeTab === 'album' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
            color: activeTab === 'album' ? '#a855f7' : 'var(--text-muted)'
          }}
        >
          <Layout size={18} /> ÁLBUM
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'collection' && (
          <motion.div key="inv" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <CardsView cards={cards} inventory={user.inventory || []} deck={deck} onAdd={(id) => addCardToDeck(id, BASE_URL)} onRemove={(id) => removeCardFromDeck(id, BASE_URL)} onSell={handleSellWrapper} baseUrl={BASE_URL} />
          </motion.div>
        )}
        {activeTab === 'deck' && (
          <motion.div key="deck" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <DeckView cards={cards.filter(c => deck.some(id => String(id) === String(c._id)))} deckInstances={deck} onRemove={(id) => removeCardFromDeck(id, BASE_URL)} baseUrl={BASE_URL} />
          </motion.div>
        )}
        {activeTab === 'album' && (
          <motion.div key="album" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {(() => {
              const allDiscovered = Array.from(new Set([
                ...(user.discoveredCards || []).map(id => String(id)),
                ...(user.inventory || []).map(id => String(id))
              ]));
              return <AlbumView cards={cards} discoveredIds={allDiscovered} baseUrl={BASE_URL} />;
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CollectionWrapper;
