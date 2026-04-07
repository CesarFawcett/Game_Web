import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Swords } from 'lucide-react';
import StoryView from './StoryView';
import DuelsView from './DuelsView';
import { useLocation, useNavigate } from 'react-router-dom';

function CombatsWrapper({ user, BASE_URL, deck, setActiveDuel }) {
  const location = useLocation();
  const navigate = useNavigate();
  // We use the URL path to determine which sub-tab is active
  const [activeTab, setActiveTab] = useState(location.pathname === '/duels' ? 'duels' : 'story');

  useEffect(() => {
    setActiveTab(location.pathname === '/duels' ? 'duels' : 'story');
  }, [location.pathname]);

  const handleTab = (tab) => {
    setActiveTab(tab);
    navigate(`/${tab}`);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-navigation inside the unified Combats space */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '1rem auto 2rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <button 
          onClick={() => handleTab('story')}
          style={{ 
            padding: '0.8rem 2rem', 
            borderRadius: '8px', border: 'none', 
            background: activeTab === 'story' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: activeTab === 'story' ? '#38bdf8' : 'var(--text-muted)',
            fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s'
          }}
        >
          <Play size={18} /> MODO HISTORIA
        </button>
        <button 
          onClick={() => handleTab('duels')}
          style={{ 
            padding: '0.8rem 2rem', 
            borderRadius: '8px', border: 'none', 
            background: activeTab === 'duels' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            color: activeTab === 'duels' ? '#ef4444' : 'var(--text-muted)',
            fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s'
          }}
        >
          <Swords size={18} /> ARENA PVP
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'story' ? (
          <motion.div key="story" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <StoryView user={user} baseUrl={BASE_URL} onStartDuel={(enemy) => { 
                if (deck.length < 10) {
                  alert("¡Tu mazo debe tener al menos 10 cartas para batallar!");
                  navigate('/deck');
                  return;
                }
                setActiveDuel(enemy); 
                console.log("Duel with", enemy.name); 
              }} 
            />
          </motion.div>
        ) : (
          <motion.div key="duels" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <DuelsView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CombatsWrapper;
