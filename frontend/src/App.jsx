import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Plus, Play, User as UserIcon, Shield, Archive, Layout, Trophy, Flame, Settings, Zap, EyeOff, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from './store'; // Zustand
import useMatchStore from './store/useMatchStore';
import './index.css';
import './duel.css';

// Components
import Login from './components/Login';
import TabItem from './components/TabItem';
import AdminPanel from './components/AdminPanel';
import CardsView from './components/CardsView';
import AlbumView from './components/AlbumView';
import DeckView from './components/DeckView';
import ShopView from './components/ShopView';
import StoryView from './components/StoryView';
import DuelsView from './components/DuelsView';
import DuelArena from './components/DuelArena';
import RankingView from './components/RankingView';
import SettingsModal from './components/SettingsModal';
import MissionsModal from './components/Missions/MissionsModal';
import ComingSoon from './components/ComingSoon';
import OnboardingModal from './components/OnboardingModal'; // NEW
import FusionsView from './components/FusionsView';
import CollectionWrapper from './components/CollectionWrapper';
import CombatsWrapper from './components/CombatsWrapper';
import { startAmbient, stopAmbient } from './utils/sound';
import logoG from './utils/img/IconoG.png';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/admin`;
const SHOP_URL = `${BASE_URL}/api/shop`;

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand State
  const { 
    user, login, logout, refreshUserData,
    cards, boards, fetchData,
    deck, addCardToDeck, removeCardFromDeck,
    activeDuel, setActiveDuel,
    globalConfig, fetchConfig,
    handleSell,
    missions, fetchMissions,
    seenOnboarding, markOnboardingSeen
  } = useStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [onboardingTarget, setOnboardingTarget] = useState(null);

  useEffect(() => {
    fetchData(API_URL);
    fetchConfig(BASE_URL);
    if (user) fetchMissions(user.username, BASE_URL);
    const savedUser = sessionStorage.getItem('authUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const usernameToFetch = parsedUser.username || parsedUser.name;
      refreshUserData(usernameToFetch, SHOP_URL).then(freshUser => {
        if (!freshUser) login(parsedUser); // fallback
      });
    }
  }, []);

  useEffect(() => {
    if (user && !activeDuel) startAmbient('menu');
    else if (user && activeDuel) startAmbient('battle');
    else stopAmbient();
  }, [user, activeDuel]);

  // ONBOARDING LOGIC
  useEffect(() => {
    if (!user || activeDuel) return;

    const path = location.pathname.replace('/', '') || 'collection';
    
    const messages = {
      'welcome': "¡Bienvenido! Para empezar deberíamos comprar algunos paquetes de cartas, con 4 estaríamos bien. Te dirigiremos al apartado de compras ahora mismo.",
      'shop': "Aquí puedes comprar paquetes de cartas, cartas especiales, Avatares y aspectos para tu campo de duelo. Recuerda armar tu mazo una vez tengas tus cartas.",
      'deck': "Aquí puedes armar tu Mazo con un mínimo de 10 cartas y un máximo de 30. Recuerda que tu vida depende de la defensa de tus cartas.",
      'album': "En el Álbum puedes ver todas las cartas que posees y las que aún no has descubierto; tendrás que adivinarlas.",
      'story': "¡Vaya! Aquí tienes muchos enemigos para empezar, ¡a por ellos!",
      'collection': "Aquí tienes todas tus cartas. Recuerda seleccionar un mínimo de 10 cartas para tu Deck para poder entrar en combate.",
      'duels': "¡Bienvenido a la Arena de Duelos! Aquí podrás probar tus habilidades contra otros duelistas reales. ¡Demuestra quién es el verdadero Rey del Tablero!"
    };

    // Special Trigger for Shop Onboarding after registration
    if (user.justRegistered && !seenOnboarding.includes('welcome')) {
      setOnboardingTarget({ id: 'welcome', msg: messages['welcome'] });
      // Remove flag to avoid re-triggering redirect
      const cleanUser = { ...user };
      delete cleanUser.justRegistered;
      useStore.setState({ user: cleanUser }); 
      return;
    }

    // Standard route-based triggers
    const triggerMap = {
      'shop': 'shop',
      'deck': 'deck',
      'album': 'album',
      'story': 'story',
      'collection': 'collection',
      'duels': 'duels'
    };

    const targetKey = triggerMap[path];
    if (targetKey && !seenOnboarding.includes(targetKey)) {
      setOnboardingTarget({ id: targetKey, msg: messages[targetKey] });
    }
  }, [location.pathname, user, seenOnboarding, activeDuel]);

  const closeOnboarding = () => {
    if (onboardingTarget) {
      markOnboardingSeen(onboardingTarget.id, BASE_URL);
      if (onboardingTarget.id === 'welcome') {
        navigate('/shop');
      }
      setOnboardingTarget(null);
    }
  };

  const onLogin = (userData) => {
    login(userData);
    if (userData.justRegistered) {
      navigate('/shop');
    } else {
      navigate('/collection');
    }
  };

  const onLogout = () => {
    logout();
    navigate('/');
  };

  const handleSellWrapper = (cardId) => {
    handleSell(cardId, BASE_URL);
  };

  if (!user) {
    return <Login onLogin={onLogin} shopUrl={SHOP_URL} />;
  }

  // Helper para derivar la ruta
  const currentPath = location.pathname.replace('/', '') || 'collection';

  return (
    <>
      {!activeDuel && (
        <button className="settings-trigger" onClick={() => setShowSettings(true)}>
          <Settings size={24} />
        </button>
      )}

      <AnimatePresence>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} user={user} setUser={(u) => useStore.getState().login(u)} baseUrl={BASE_URL} onLogout={onLogout} />}
      </AnimatePresence>

      <div className="app-container">
        <header className="app-header-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <img src={logoG} alt="Designer Logo" style={{ width: '60px', height: 'auto', filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.4))' }} />
            <div>
              <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 }}>CARD BATTLE UNIVERSE</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>EL Universo Te Saluda • Bienvenido {user.username}</p>
            </div>
          </div>
          <div className="header-actions-mobile" style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
            {!user.justRegistered && (
              <button className="glass-panel" onClick={() => setShowMissions(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1rem', border: '1px solid var(--accent-gold)', borderRadius: '20px', cursor: 'pointer' }}>
                <Trophy size={18} className="text-gold" />
                <span className="hide-on-mobile" style={{ fontWeight: 600 }}>Misiones</span>
                {missions.dailyWins > 0 && <span className="badge-dot" />}
              </button>
            )}
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 1.2rem', border: '1px solid #f97316', borderRadius: '20px', background: 'rgba(249, 115, 22, 0.05)' }} title="Racha de Conexión">
              <Flame size={20} color="#f97316" fill={user.canClaimStreakReward ? "#f97316" : "none"} />
              <span style={{ fontWeight: 900, color: '#f97316', fontSize: '1.1rem' }}>{user.connectionStreak || 1}</span>
            </div>
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 1.2rem', border: '1px solid var(--accent-gold)', borderRadius: '20px', background: 'rgba(212, 175, 55, 0.05)' }}>
              <CoinsIcon />
              <span style={{ fontWeight: 900, color: 'var(--accent-gold)', fontSize: '1.1rem' }}>{(user.credits || 0).toLocaleString()}</span>
            </div>
            {!user.justRegistered && (
              <>
                {user.role === 'admin' && (
                  <button className={`btn-primary ${currentPath === 'admin' ? 'active' : ''}`} onClick={() => navigate('/admin')}>
                    <Shield size={20} /> <span className="hide-on-mobile">Panel Admin</span>
                  </button>
                )}
                <button className={`btn-primary ${currentPath !== 'admin' ? 'active' : ''}`} onClick={() => navigate('/collection')}>
                  <Play size={20} /> <span className="hide-on-mobile">Mi Colección</span>
                </button>
              </>
            )}
            <button onClick={onLogout} className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <UserIcon size={20} /> <span className="hide-on-mobile">Salir</span>
            </button>
          </div>
        </header>

        <AnimatePresence>
          {showMissions && <MissionsModal onClose={() => setShowMissions(false)} baseUrl={BASE_URL} />}
        </AnimatePresence>

        <OnboardingModal 
          isOpen={!!onboardingTarget} 
          message={onboardingTarget?.msg} 
          onClose={closeOnboarding} 
          title={onboardingTarget?.id === 'welcome' ? "BIENVENIDO DUELISTA" : undefined}
        />

        {currentPath !== 'admin' && !user.justRegistered && (
          <nav className="nav-bar">
            {/* Nav item collection highlighting if we're on deck or collection */}
            <TabItem id="collection" label="Cartas" active={['collection', 'deck', 'album'].includes(currentPath) ? 'collection' : currentPath} setActive={(path) => navigate(`/${path}`)} icon={<Archive size={18} />} />
            {/* Nav item story highlighting if we're on story or duels */}
            <TabItem id="story" label="Combates" active={['story', 'duels'].includes(currentPath) ? 'story' : currentPath} setActive={(path) => navigate(`/${path}`)} icon={<Swords size={18} />} />
            
            <TabItem id="ranking" label="Ranking" active={currentPath} setActive={(path) => navigate(`/${path}`)} icon={<Trophy size={18} />} />
            <TabItem id="fusions" label="Fusiones" active={currentPath} setActive={(path) => navigate(`/${path}`)} icon={<Zap size={18} />} />
            <TabItem id="shop" label="Compras" active={currentPath} setActive={(path) => navigate(`/${path}`)} icon={<Plus size={18} />} />
          </nav>
        )}

        <main>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/admin" element={
                user.role === 'admin' ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <AdminPanel onUpdate={() => fetchData(API_URL)} cards={cards} apiUrl={API_URL} baseUrl={BASE_URL} />
                  </motion.div>
                ) : <Navigate to="/collection" />
              } />
              <Route path="/collection" element={<CollectionWrapper cards={cards} user={user} deck={deck} addCardToDeck={addCardToDeck} removeCardFromDeck={removeCardFromDeck} handleSellWrapper={handleSellWrapper} BASE_URL={BASE_URL} />} />
              <Route path="/deck" element={<CollectionWrapper cards={cards} user={user} deck={deck} addCardToDeck={addCardToDeck} removeCardFromDeck={removeCardFromDeck} handleSellWrapper={handleSellWrapper} BASE_URL={BASE_URL} />} />
              <Route path="/album" element={<CollectionWrapper cards={cards} user={user} deck={deck} addCardToDeck={addCardToDeck} removeCardFromDeck={removeCardFromDeck} handleSellWrapper={handleSellWrapper} BASE_URL={BASE_URL} />} />
              <Route path="/shop" element={
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {/* ShopView sets updated user data here to Zustand */}
                  <ShopView user={user} setUser={(u) => useStore.getState().login(u)} cards={cards} onUpdate={() => fetchData(API_URL)} baseUrl={BASE_URL} isOnboarding={user.justRegistered} />
                </motion.div>
              } />
              <Route path="/fusions" element={
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <FusionsView />
                </motion.div>
              } />
              <Route path="/story" element={<CombatsWrapper user={user} BASE_URL={BASE_URL} deck={deck} setActiveDuel={setActiveDuel} />} />
              <Route path="/duels" element={<CombatsWrapper user={user} BASE_URL={BASE_URL} deck={deck} setActiveDuel={setActiveDuel} />} />
              <Route path="/ranking" element={
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <RankingView user={user} setUser={(u) => useStore.getState().login(u)} baseUrl={BASE_URL} />
                </motion.div>
              } />
              <Route path="/" element={<Navigate to="/collection" />} />
            </Routes>
          </AnimatePresence>
        </main>

        <PvPArenaWrapper 
          user={user} 
          activeDuel={activeDuel} 
          setActiveDuel={setActiveDuel}
          deck={deck}
          cards={cards}
          BASE_URL={BASE_URL}
          SHOP_URL={SHOP_URL}
          globalConfig={globalConfig}
          fetchData={fetchData}
          API_URL={API_URL}
          refreshUserData={refreshUserData}
          login={login}
        />
      </div>
    </>
  );
}

// Wrapper component to use the match store reactively
function PvPArenaWrapper({ user, activeDuel, setActiveDuel, deck, cards, BASE_URL, SHOP_URL, globalConfig, fetchData, API_URL, refreshUserData, login }) {
  const store = useMatchStore();
  const { isPvP, p1Data, p2Data, myRole, setSetter } = store;

  if (!activeDuel && !isPvP) return null;
  
  // For Story Mode, activeDuel is truthy
  // For PvP, isPvP is truthy
  let pvpEnemy = null;
  if (isPvP) {
      pvpEnemy = myRole === 'player1' ? p2Data : p1Data;
      if (!pvpEnemy) return null; // Wait for initialization to complete
  }

  return (
    <DuelArena 
      key={isPvP ? `pvp-${store.pvpRoomID}` : `story-${activeDuel?._id}`}
      user={user} 
      enemy={activeDuel || pvpEnemy} 
      playerDeckIds={deck}
      cardsPool={cards}
      baseUrl={BASE_URL}
      globalConfig={globalConfig}
      login={login}
      onExit={() => { 
        setActiveDuel(null); 
        store.resetMatch();
        fetchData(API_URL); 
        refreshUserData(user.username, SHOP_URL);
      }}
    />
  );
}

function CoinsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4" />
      <path d="M17 14h.01" />
      <path d="M22 14v.01" />
      <path d="M17 19v.01" />
      <path d="M22 19v.01" />
    </svg>
  );
}

export default App;
