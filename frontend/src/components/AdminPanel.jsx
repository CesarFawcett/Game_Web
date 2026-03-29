import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, Trash2, Upload, Layout, Shield, Edit3, X, Package } from 'lucide-react';
import { ABILITY_ICONS } from '../constants.jsx';

function AdminPanel({ onUpdate, cards, apiUrl, baseUrl }) {
  const [activeTab, setActiveTab] = useState('cards');

  // Cards State
  const [newCard, setNewCard] = useState({ name: '', type: 'Monster', description: '', attack: 0, defense: 0, ability: 'Ninguno', rarity: 'Común' });
  const [editingCard, setEditingCard] = useState(null);
  const [file, setFile] = useState(null);
  const [cbFileCard, setCbFileCard] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cbPreviewUrl, setCbPreviewUrl] = useState(null);
  const [cardBacks, setCardBacks] = useState([]);
  const [useExistingBack, setUseExistingBack] = useState(false);
  const [selectedBack, setSelectedBack] = useState('');

  // Story State
  const [enemies, setEnemies] = useState([]);
  const [selectedEnemy, setSelectedEnemy] = useState(null);
  const [enemyFile, setEnemyFile] = useState(null);
  const [cbFile, setCbFile] = useState(null);
  const [fieldFile, setFieldFile] = useState(null);
  const [textureFile, setTextureFile] = useState(null);
  const [enemyPreview, setEnemyPreview] = useState(null);

  // Packs State
  const [packs, setPacks] = useState([]);
  const [selectedPack, setSelectedPack] = useState(null);
  const [packFile, setPackFile] = useState(null);

  // Avatars State
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Boards State
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [boardFile, setBoardFile] = useState(null);
  const [boardFieldFile, setBoardFieldFile] = useState(null);
  const [boardTextureFile, setBoardTextureFile] = useState(null);
  const [boardBackFile, setBoardBackFile] = useState(null);

  useEffect(() => {
    fetchEnemies();
    fetchPacks();
    fetchAvatars();
    fetchBoards();
    fetchChests();
    fetchCardBacks();
  }, []);

  const [chests, setChests] = useState([]);
  const fetchChests = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/admin/chests`);
      setChests(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchPacks = async () => {
    try {
      const res = await axios.get(`${apiUrl}/packs`);
      setPacks(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchAvatars = async () => {
    try {
      const res = await axios.get(`${apiUrl}/avatars`);
      setAvatars(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchBoards = async () => {
    try {
      const res = await axios.get(`${apiUrl}/boards`);
      setBoards(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchEnemies = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/story/enemies?role=admin`);
      setEnemies(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchCardBacks = async () => {
    try {
      const res = await axios.get(`${apiUrl}/card-backs`);
      setCardBacks(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const data = editingCard || newCard;
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    if (file) formData.append('image', file);
    if (useExistingBack && selectedBack) {
      formData.append('existingCardBack', selectedBack);
    } else if (cbFileCard) {
      formData.append('cardBackImage', cbFileCard);
    }

    try {
      if (editingCard) await axios.put(`${apiUrl}/cards/${editingCard._id}`, formData);
      else await axios.post(`${apiUrl}/cards`, formData);
      resetCardForm();
      fetchCardBacks();
      onUpdate();
      alert(editingCard ? "Carta actualizada" : "Carta creada");
    } catch (err) { alert("Error al guardar carta"); }
  };

  const handleDeleteCard = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta carta?")) return;
    try {
      await axios.delete(`${apiUrl}/cards/${id}`);
      onUpdate();
    } catch (err) { alert("Error al eliminar carta"); }
  };

  const resetCardForm = () => {
    setNewCard({ name: '', type: 'Monster', description: '', attack: 0, defense: 0, ability: 'Ninguno', rarity: 'Común' });
    setEditingCard(null);
    setFile(null);
    setCbFileCard(null);
    setPreviewUrl(null);
    setCbPreviewUrl(null);
    setUseExistingBack(false);
    setSelectedBack('');
  };

  const handleEnemySubmit = async (e) => {
    e.preventDefault();
    if (!selectedEnemy.name) return alert("Nombre requerido");

    const formData = new FormData();
    formData.append('name', selectedEnemy.name);
    formData.append('hp', selectedEnemy.hp || 2000);
    formData.append('rankIndex', selectedEnemy.rankIndex ?? enemies.length);
    formData.append('enabled', selectedEnemy.enabled);
    formData.append('deck', JSON.stringify(selectedEnemy.deck || []));

    if (enemyFile) formData.append('image', enemyFile);
    if (cbFile) formData.append('cardBack', cbFile);
    if (fieldFile) formData.append('field', fieldFile);
    if (textureFile) formData.append('fieldTexture', textureFile);
    if (selectedEnemy.imageString) formData.append('imageString', selectedEnemy.imageString);
    if (selectedEnemy.cardBackString) formData.append('cardBackString', selectedEnemy.cardBackString);
    if (selectedEnemy.fieldString) formData.append('fieldString', selectedEnemy.fieldString);
    if (selectedEnemy.fieldTextureString) formData.append('fieldTextureString', selectedEnemy.fieldTextureString);

    try {
      if (selectedEnemy._id) await axios.put(`${baseUrl}/api/story/enemies/${selectedEnemy._id}`, formData);
      else await axios.post(`${baseUrl}/api/story/enemies`, formData);

      setEnemyFile(null); setCbFile(null); setFieldFile(null); setTextureFile(null); setEnemyPreview(null);
      fetchEnemies();
      alert("Enemigo guardado correctamente");
    } catch (err) { alert("Error al guardar enemigo"); }
  };

  const handleDeleteEnemy = async (id) => {
    if (!window.confirm("¿Eliminar este enemigo permanentemente?")) return;
    try {
      await axios.delete(`${baseUrl}/api/story/enemies/${id}`);
      setSelectedEnemy(null);
      fetchEnemies();
    } catch (err) { alert("Error al eliminar"); }
  };

  const toggleCardInEnemyDeck = (cardId) => {
    if (!selectedEnemy) return;
    const currentDeck = [...(selectedEnemy.deck || [])];
    currentDeck.push(cardId);
    setSelectedEnemy({ ...selectedEnemy, deck: currentDeck });
  };

  const removeCardFromEnemyDeck = (idx) => {
    const currentDeck = [...selectedEnemy.deck];
    currentDeck.splice(idx, 1);
    setSelectedEnemy({ ...selectedEnemy, deck: currentDeck });
  };

  const handlePackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPack.name) return alert("Nombre requerido");

    const formData = new FormData();
    formData.append('name', selectedPack.name);
    formData.append('price', selectedPack.price || 250);
    formData.append('cardsPerPack', selectedPack.cardsPerPack || 3);
    formData.append('enabled', selectedPack.enabled);
    formData.append('cardPool', JSON.stringify(selectedPack.cardPool || []));

    if (packFile) formData.append('image', packFile);
    if (selectedPack.imageString) formData.append('imageString', selectedPack.imageString);

    try {
      if (selectedPack._id) await axios.put(`${apiUrl}/packs/${selectedPack._id}`, formData);
      else await axios.post(`${apiUrl}/packs`, formData);

      setPackFile(null);
      fetchPacks();
      alert("Sobre guardado correctamente");
    } catch (err) { alert("Error al guardar sobre"); }
  };

  const handleDeletePack = async (id) => {
    if (!window.confirm("¿Eliminar este sobre permanentemente?")) return;
    try {
      await axios.delete(`${apiUrl}/packs/${id}`);
      setSelectedPack(null);
      fetchPacks();
    } catch (err) { alert("Error al eliminar"); }
  };

  // Auto-calculate drop rates based on card rarity
  const calcDropRates = (pool) => {
    if (!pool || pool.length === 0) return pool;
    
    // Get rarity for each card in pool
    const withRarity = pool.map(item => {
      const cId = item.cardId?._id || item.cardId;
      const card = cards.find(c => c._id === cId);
      return { ...item, rarity: card?.rarity || 'Común' };
    });

    // Check which rarity tiers exist
    const hasLegendary = withRarity.some(c => c.rarity === 'Legendaria' || c.rarity === 'Mítica' || c.rarity === 'Divina' || c.rarity === 'Ancestral' || c.rarity === 'Inmortal' || c.rarity === 'Cósmica');
    const hasEpic = withRarity.some(c => c.rarity === 'Épica');

    // Determine the rate per rarity tier
    let rates;
    if (hasLegendary) {
      rates = { 'Común': 70, 'Rara': 25, 'Épica': 4, 'Legendaria': 1 };
    } else if (hasEpic) {
      rates = { 'Común': 80, 'Rara': 15, 'Épica': 5 };
    } else {
      rates = { 'Común': 80, 'Rara': 20 };
    }

    // Map rarities to tier keys
    const toTier = (rarity) => {
      if (['Legendaria', 'Mítica', 'Divina', 'Ancestral', 'Inmortal', 'Cósmica'].includes(rarity)) return 'Legendaria';
      if (rarity === 'Épica') return 'Épica';
      if (rarity === 'Rara') return 'Rara';
      return 'Común';
    };

    // Count cards per tier
    const tierCounts = {};
    withRarity.forEach(c => {
      const tier = toTier(c.rarity);
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    });

    // Redistribute unused tier budget
    let totalUsed = 0;
    let activeTiers = 0;
    for (const tier in rates) {
      if (tierCounts[tier]) { totalUsed += rates[tier]; activeTiers++; }
    }
    // If some tiers have no cards, redistribute proportionally
    if (totalUsed < 100 && activeTiers > 0) {
      const factor = 100 / totalUsed;
      for (const tier in rates) {
        if (tierCounts[tier]) rates[tier] = rates[tier] * factor;
      }
    }

    // Assign per-card rate = tier rate / count in tier
    return withRarity.map(item => {
      const tier = toTier(item.rarity);
      const rate = (rates[tier] || 0) / (tierCounts[tier] || 1);
      return { cardId: item.cardId, dropRate: Math.round(rate * 100) / 100 };
    });
  };

  const addCardToPackPool = (cardId) => {
    if (!selectedPack) return;
    if (selectedPack.cardPool?.find(c => c.cardId === cardId || c.cardId?._id === cardId)) return;
    const newPool = [...(selectedPack.cardPool || []), { cardId: cardId, dropRate: 0 }];
    setSelectedPack({ ...selectedPack, cardPool: calcDropRates(newPool) });
  };

  const removeCardFromPackPool = (idx) => {
    const newPool = [...selectedPack.cardPool];
    newPool.splice(idx, 1);
    setSelectedPack({ ...selectedPack, cardPool: calcDropRates(newPool) });
  };

  const handleAvatarSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAvatar.name) return alert("Nombre requerido");

    const formData = new FormData();
    formData.append('name', selectedAvatar.name);
    formData.append('price', selectedAvatar.price || 100);
    formData.append('enabled', selectedAvatar.enabled !== false); // default true

    if (avatarFile) formData.append('image', avatarFile);
    if (selectedAvatar.imageString) formData.append('imageString', selectedAvatar.imageString);

    try {
      if (selectedAvatar._id) await axios.put(`${apiUrl}/avatars/${selectedAvatar._id}`, formData);
      else await axios.post(`${apiUrl}/avatars`, formData);

      setAvatarFile(null);
      fetchAvatars();
      alert("Avatar guardado correctamente");
    } catch (err) {
      console.error(err.response || err);
      alert("Error al guardar avatar: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteAvatar = async (id) => {
    if (!window.confirm("¿Eliminar este avatar permanentemente?")) return;
    try {
      await axios.delete(`${apiUrl}/avatars/${id}`);
      setSelectedAvatar(null);
      fetchAvatars();
    } catch (err) { alert("Error al eliminar"); }
  };

  const handleBoardSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBoard.name) return alert("Nombre requerido");

    const formData = new FormData();
    formData.append('name', selectedBoard.name);
    formData.append('price', selectedBoard.price || 500);
    formData.append('enabled', selectedBoard.enabled !== false); // default true

      if (boardFile) formData.append('image', boardFile);
      if (boardFieldFile) formData.append('fieldImage', boardFieldFile);
      if (boardTextureFile) formData.append('textureImage', boardTextureFile);
      if (boardBackFile) formData.append('cardBackImage', boardBackFile);
      
      if (selectedBoard.imageString) formData.append('imageString', selectedBoard.imageString);
      if (selectedBoard.fieldImageString) formData.append('fieldImageString', selectedBoard.fieldImageString);
      if (selectedBoard.textureImageString) formData.append('textureImageString', selectedBoard.textureImageString);
      if (selectedBoard.cardBackImageString) formData.append('cardBackImageString', selectedBoard.cardBackImageString);

      try {
        if (selectedBoard._id) await axios.put(`${apiUrl}/boards/${selectedBoard._id}`, formData);
        else await axios.post(`${apiUrl}/boards`, formData);

        setBoardFile(null);
        setBoardFieldFile(null);
        setBoardTextureFile(null);
        setBoardBackFile(null);
        fetchBoards();
        alert("Tablero guardado correctamente");
    } catch (err) {
      console.error(err.response || err);
      const errorMsg = err.response?.data?.error || JSON.stringify(err.response?.data) || err.message;
      alert("Error al guardar tablero: " + errorMsg);
    }
  };

  const handleDeleteBoard = async (id) => {
    if (!window.confirm("¿Eliminar este tablero permanentemente?")) return;
    try {
      await axios.delete(`${apiUrl}/boards/${id}`);
      setSelectedBoard(null);
      fetchBoards();
    } catch (err) { alert("Error al eliminar"); }
  };

  return (
    <div className="admin-container">
      <div className="admin-sidebar glass-panel">
        <h2 className="gradient-text">ADMIN</h2>
        <div className="admin-tabs">
          <button className={`tab-btn ${activeTab === 'cards' ? 'active' : ''}`} onClick={() => setActiveTab('cards')}>
            <Layout size={20} /> Cartas
          </button>
          <button className={`tab-btn ${activeTab === 'story' ? 'active' : ''}`} onClick={() => setActiveTab('story')}>
            <Shield size={20} /> Historia
          </button>
          <button className={`tab-btn ${activeTab === 'packs' ? 'active' : ''}`} onClick={() => setActiveTab('packs')}>
            <Upload size={20} /> Sobres
          </button>
          <button className={`tab-btn ${activeTab === 'avatars' ? 'active' : ''}`} onClick={() => setActiveTab('avatars')}>
            <Shield size={20} /> Avatares
          </button>
          <button className={`tab-btn ${activeTab === 'boards' ? 'active' : ''}`} onClick={() => setActiveTab('boards')}>
            <Layout size={20} /> Tableros
          </button>
          <button className={`tab-btn ${activeTab === 'chests' ? 'active' : ''}`} onClick={() => setActiveTab('chests')}>
            <Package size={20} /> Cofres Semanales
          </button>
        </div>
      </div>

      <div className="admin-main">
        <AnimatePresence mode="wait">
          {activeTab === 'cards' ? (
            <motion.div key="cards" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="admin-content-grid">

            {/* Form & Preview Section */}
            <div className="form-preview-card glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>{editingCard ? 'EDITANDO CARTA' : 'CREAR NUEVA CARTA'}</h3>
                {editingCard && <button className="arcade-btn" onClick={resetCardForm}><X size={16} /></button>}
              </div>

              <div className="admin-card-layout">
                <form onSubmit={handleCardSubmit} className="admin-form">
                  <div className="field-group">
                    <label>NOMBRE</label>
                    <input type="text" value={editingCard ? editingCard.name : newCard.name} onChange={e => editingCard ? setEditingCard({ ...editingCard, name: e.target.value }) : setNewCard({ ...newCard, name: e.target.value })} placeholder="Ej: Dragón de Fuego" required />
                  </div>
                  <div className="stats-row">
                    <div className="field-group">
                      <label>TIPO</label>
                      <select value={editingCard ? editingCard.type : newCard.type} onChange={e => editingCard ? setEditingCard({ ...editingCard, type: e.target.value }) : setNewCard({ ...newCard, type: e.target.value })}>
                        <option value="Monster">Monstruo</option>
                        <option value="Spell">Hechizo</option>
                        <option value="Trap">Trampa</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label>HABILIDAD ESPECIAL</label>
                      <select value={editingCard ? editingCard.ability : newCard.ability} onChange={e => editingCard ? setEditingCard({ ...editingCard, ability: e.target.value }) : setNewCard({ ...newCard, ability: e.target.value })}>
                        <option value="Ninguno">Ninguna</option>
                        <option value="Doble Ataque">Doble Ataque (x2 Golpes)</option>
                        <option value="Veneno">Veneno (-20% HP Enemigo/Turno)</option>
                        <option value="Hielo">Hielo (Congela 1 Turno)</option>
                        <option value="Fuego">Fuego (+200 Daño Quemadura)</option>
                        <option value="Daño Perforante">Daño Perforante (Lanza daño remanente al HP)</option>
                        <option value="Robo de Vida">Robo de Vida (Cura ATK/DEF al atacar)</option>
                        <option value="Putrefacción">Putrefacción (Daño directo al HP cada turno)</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label>RAREZA</label>
                      <select value={editingCard ? editingCard.rarity : newCard.rarity} onChange={e => editingCard ? setEditingCard({ ...editingCard, rarity: e.target.value }) : setNewCard({ ...newCard, rarity: e.target.value })}>
                        <option value="Común">Común</option>
                        <option value="Rara">Rara</option>
                        <option value="Épica">Épica</option>
                        <option value="Legendaria">Legendaria</option>
                        <option value="Mítica">Mítica</option>
                        <option value="Divina">Divina</option>
                        <option value="Ancestral">Ancestral</option>
                        <option value="Inmortal">Inmortal</option>
                        <option value="Cósmica">Cósmica</option>
                      </select>
                    </div>
                  </div>
                  <div className="stats-row">
                    <div className="field-group">
                      <label>ATAQUE</label>
                      <input type="number" value={editingCard ? editingCard.attack : newCard.attack} onChange={e => editingCard ? setEditingCard({ ...editingCard, attack: e.target.value }) : setNewCard({ ...newCard, attack: e.target.value })} />
                    </div>
                    <div className="field-group">
                      <label>DEFENSA</label>
                      <input type="number" value={editingCard ? editingCard.defense : newCard.defense} onChange={e => editingCard ? setEditingCard({ ...editingCard, defense: e.target.value }) : setNewCard({ ...newCard, defense: e.target.value })} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>DESCRIPCIÓN (Opcional)</label>
                    <textarea
                      value={editingCard ? editingCard.description : newCard.description}
                      onChange={e => editingCard ? setEditingCard({ ...editingCard, description: e.target.value }) : setNewCard({ ...newCard, description: e.target.value })}
                      placeholder="Breve historia o efecto de la carta..."
                      rows="2"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.8rem' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="field-group">
                      <label>IMAGEN FRONTAL (500x700)</label>
                      <div className="file-input-wrapper">
                        <input type="file" onChange={e => {
                          setFile(e.target.files[0]);
                          if (e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onloadend = () => setPreviewUrl(reader.result);
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }} accept="image/*" />
                        <input type="text" placeholder="O link (URL de internet)" className="neon-input" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.65rem' }} value={editingCard ? (editingCard.imageUrlString || '') : (newCard.imageUrlString || '')} onChange={e => { const val = e.target.value; if (editingCard) setEditingCard({...editingCard, imageUrlString: val}); else setNewCard({...newCard, imageUrlString: val}); setPreviewUrl(val); }} />
                      </div>
                    </div>
                  <div className="field-group" style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label style={{ margin: 0 }}>IMAGEN REVERSO (OPCIONAL)</label>
                      <div className="toggle-container" onClick={() => setUseExistingBack(!useExistingBack)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: useExistingBack ? 'var(--primary)' : '#888' }}>REUTILIZAR</span>
                        <div className={`mini-toggle ${useExistingBack ? 'active' : ''}`} style={{ width: '24px', height: '12px', background: useExistingBack ? 'var(--primary)' : '#444', borderRadius: '10px', position: 'relative' }}>
                           <div style={{ width: '10px', height: '10px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '1px', left: useExistingBack ? '13px' : '1px', transition: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>

                    {!useExistingBack ? (
                      <div className="file-input-wrapper">
                        <input type="file" onChange={e => {
                          setCbFileCard(e.target.files[0]);
                          if (e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onloadend = () => setCbPreviewUrl(reader.result);
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }} accept="image/*" />
                        <input type="text" placeholder="O link (URL de internet)" className="neon-input" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.65rem' }} value={editingCard ? (editingCard.cardBackImageString || '') : (newCard.cardBackImageString || '')} onChange={e => { const val = e.target.value; if (editingCard) setEditingCard({...editingCard, cardBackImageString: val}); else setNewCard({...newCard, cardBackImageString: val}); setCbPreviewUrl(val); }} />
                      </div>
                    ) : (
                      <div className="existing-backs-container">
                        {cardBacks.length > 0 ? (
                          <div className="backs-gallery scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '5px' }}>
                            {cardBacks.map((back, idx) => (
                              <div
                                key={idx}
                                className={`back-option ${selectedBack === back ? 'selected' : ''}`}
                                onClick={() => {
                                  setSelectedBack(back);
                                  setCbPreviewUrl(`${back && typeof back === 'string' && back.startsWith('http') ? '' : baseUrl}${back}`);
                                }}
                                style={{
                                  width: '50px',
                                  height: '70px',
                                  flexShrink: 0,
                                  borderRadius: '4px',
                                  border: `2px solid ${selectedBack === back ? 'var(--primary)' : 'transparent'}`,
                                  background: `url(${back && typeof back === 'string' && back.startsWith('http') ? '' : baseUrl}${back}) center/cover`,
                                  cursor: 'pointer',
                                  transition: '0.2s',
                                  boxShadow: selectedBack === back ? '0 0 10px var(--primary)' : 'none'
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.7rem', color: '#888', fontStyle: 'italic' }}>No hay respaldos previos disponibles.</p>
                        )}
                      </div>
                    )}
                  </div>
                  </div>
                  <button type="submit" className="arcade-btn green" style={{ width: '100%', marginTop: '1rem', height: '50px' }}>
                    <Save size={20} /> {editingCard ? 'ACTUALIZAR' : 'GUARDAR CARTA'}
                  </button>
                </form>

                <div className="live-preview-box">
                  <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textAlign: 'center', marginBottom: '10px' }}>VISTA PREVIA</p>
                  <div className="card-item-preview">
                    <div className="preview-art" style={{ background: `url(${previewUrl || (editingCard ? `${editingCard.imageUrl && typeof editingCard.imageUrl === 'string' && editingCard.imageUrl.startsWith('http') ? '' : baseUrl}${editingCard.imageUrl}` : '')}) center/cover, #000` }}>
                      <div className="preview-ability">{ABILITY_ICONS[(editingCard || newCard).ability] || ABILITY_ICONS['Ninguno']}</div>
                    </div>
                    <div className="preview-info">
                      <p className="preview-name">{(editingCard || newCard).name || 'Nombre...'}</p>
                      <div className="preview-stats">
                        <span>⚔️ {(editingCard || newCard).attack}</span>
                        <span>🛡️ {(editingCard || newCard).defense}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Management List */}
            <div className="admin-list-section glass-panel">
              <h3>COLECCIÓN TOTAL ({cards.length})</h3>
              <div className="admin-cards-grid scrollbar">
                {cards.map(card => (
                  <div
                    key={card._id}
                    onClick={() => {
                      setEditingCard({ 
                        ...card, 
                        type: card.type || 'Monster',
                        ability: card.ability || 'Ninguno',
                        rarity: card.rarity || 'Común' 
                      });
                      setPreviewUrl(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{ position: 'relative' }}
                  >
                    <img src={`${card.imageUrl && typeof card.imageUrl === 'string' && card.imageUrl.startsWith('http') ? '' : baseUrl}${card.imageUrl}`} alt={card.name} />

                    <button
                      className="arcade-btn"
                      style={{ position: 'absolute', top: '5px', right: '5px', padding: '6px', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', zIndex: 10 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(card._id);
                      }}
                      title="Eliminar Carta"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="mini-card-info">
                      <p>{card.name}</p>
                      <div className="mini-card-actions">
                        <button className="edit-indicator" style={{ width: '100%' }}><Edit3 size={14} /> EDITAR </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
          ) : activeTab === 'story' ? (
          <motion.div key="story" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="story-admin-container">
            <div className="admin-content-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
              {/* Left: Enemy List */}
              <div className="glass-panel admin-list-section">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                  <h3>LISTA DE ENEMIGOS</h3>
                  <button className="arcade-btn" onClick={() => setSelectedEnemy({ name: '', hp: 2000, enabled: true, deck: [], rankIndex: enemies.length })}>+ NUEVO</button>
                </div>
                <div className="enemy-admin-list scrollbar">
                  {enemies.sort((a, b) => a.rankIndex - b.rankIndex).map(e => (
                    <div key={e._id} className={`enemy-item-admin ${selectedEnemy?._id === e._id ? 'active' : ''}`} onClick={() => setSelectedEnemy(e)}>
                      <img src={`${e.imageUrl && typeof e.imageUrl === 'string' && e.imageUrl.startsWith('http') ? '' : baseUrl}${e.imageUrl}`} alt={e.name} />
                      <div className="enemy-item-details">
                        <p className="e-name">{e.name}</p>
                        <p className="e-meta">Rank: {e.rankIndex} • {e.hp} HP • {e.deck?.length || 0} Cartas</p>
                      </div>
                      <span className={`status-pill ${e.enabled ? 'active' : ''}`}>{e.enabled ? 'ON' : 'OFF'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Enemy Form */}
              {selectedEnemy ? (
                <div className="glass-panel enemy-editor-form scrollbar">
                  <div className="editor-header">
                    <h3>CONFIGURAR: {selectedEnemy.name || 'NUEVO ENEMIGO'}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {selectedEnemy._id && <button className="arcade-btn red" onClick={() => handleDeleteEnemy(selectedEnemy._id)}><Trash2 size={16} /></button>}
                      <button className="arcade-btn" onClick={() => setSelectedEnemy(null)}><X size={16} /></button>
                    </div>
                  </div>

                  <form onSubmit={handleEnemySubmit} className="admin-form extended">
                    <div className="form-sections-grid">
                      <div className="basic-info-section">
                        <div className="field-group">
                          <label>NOMBRE DEL DESAFÍO</label>
                          <input type="text" value={selectedEnemy.name} onChange={e => setSelectedEnemy({ ...selectedEnemy, name: e.target.value })} placeholder="Ej: Kaiba Jr." required />
                        </div>
                        <div className="stats-row">
                          <div className="field-group">
                            <label>PUNTOS DE VIDA (HP)</label>
                            <input type="number" value={selectedEnemy.hp} onChange={e => setSelectedEnemy({ ...selectedEnemy, hp: e.target.value })} />
                          </div>
                          <div className="field-group">
                            <label>RANKING / ORDEN</label>
                            <input type="number" value={selectedEnemy.rankIndex} onChange={e => setSelectedEnemy({ ...selectedEnemy, rankIndex: e.target.value })} />
                          </div>
                        </div>
                        <div className="field-group checkbox-group">
                          <label className="toggle">
                            <input type="checkbox" checked={selectedEnemy.enabled} onChange={e => setSelectedEnemy({ ...selectedEnemy, enabled: e.target.checked })} />
                            <span className="slider"></span>
                            <span className="label-text">ENEMIGO HABILITADO</span>
                          </label>
                        </div>

                        <div className="assets-upload-grid">
                          <div className="upload-box">
                            <label>AVATAR</label>
                            <input type="file" onChange={e => setEnemyFile(e.target.files[0])} accept="image/*" />
                            <input type="text" placeholder="O link (URL)" className="neon-input" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.65rem' }} value={selectedEnemy?.imageString || ''} onChange={e => setSelectedEnemy({...selectedEnemy, imageString: e.target.value})} />
                          </div>
                          <div className="upload-box">
                            <label>DORSO CARTA</label>
                            <input type="file" onChange={e => setCbFile(e.target.files[0])} accept="image/*" />
                            <input type="text" placeholder="O link (URL)" className="neon-input" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.65rem' }} value={selectedEnemy?.cardBackString || ''} onChange={e => setSelectedEnemy({...selectedEnemy, cardBackString: e.target.value})} />
                          </div>
                          <div className="upload-box">
                            <label>FONDO CAMPO</label>
                            <input type="file" onChange={e => setFieldFile(e.target.files[0])} accept="image/*" />
                            <input type="text" placeholder="O link (URL)" className="neon-input" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.65rem' }} value={selectedEnemy?.fieldString || ''} onChange={e => setSelectedEnemy({...selectedEnemy, fieldString: e.target.value})} />
                          </div>
                          <div className="upload-box">
                            <label>TEXTURA CAMPO</label>
                            <input type="file" onChange={e => setTextureFile(e.target.files[0])} accept="image/*" />
                            <input type="text" placeholder="O link (URL)" className="neon-input" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.65rem' }} value={selectedEnemy?.fieldTextureString || ''} onChange={e => setSelectedEnemy({...selectedEnemy, fieldTextureString: e.target.value})} />
                          </div>
                        </div>
                      </div>

                      <div className="deck-builder-section">
                        <label>MAZO DEL ENEMIGO ({selectedEnemy.deck?.length || 0} CARTAS)</label>
                        <div className="enemy-current-deck-scroll scrollbar">
                          {selectedEnemy.deck?.map((cardId, idx) => {
                            const card = cards.find(c => c._id === cardId);
                            return card ? (
                              <div key={`ed-${idx}`} className="deck-card-mini">
                                <span>{card.name}</span>
                                <button type="button" onClick={() => removeCardFromEnemyDeck(idx)}><X size={12} /></button>
                              </div>
                            ) : null;
                          })}
                        </div>

                        <label style={{ marginTop: '1rem' }}>AGREGAR CARTAS (CARPETAS DISPONIBLES)</label>
                        <div className="available-cards-mini-grid scrollbar">
                          {cards.map(card => (
                            <div key={`av-${card._id}`} className="card-selector-item" onClick={() => toggleCardInEnemyDeck(card._id)}>
                              <img src={`${card.imageUrl && typeof card.imageUrl === 'string' && card.imageUrl.startsWith('http') ? '' : baseUrl}${card.imageUrl}`} alt={card.name} title={card.name} />
                              <div className="card-count-badge">
                                {selectedEnemy.deck?.filter(id => id === card._id).length || 0}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="arcade-btn green" style={{ width: '100%', marginTop: '2rem', height: '60px', fontSize: '1.1rem' }}>
                      <Save size={20} style={{ marginRight: '10px' }} /> GUARDAR CONFIGURACIÓN DEL ENEMIGO
                    </button>
                  </form>
                </div>
              ) : (
                <div className="glass-panel empty-editor-state">
                  <Shield size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Selecciona un enemigo de la lista para editar su configuración o crea uno nuevo.</p>
                </div>
              )}
            </div>
          </motion.div>
          ) : activeTab === 'packs' ? (
          <motion.div key="packs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="story-admin-container">
            <div className="admin-content-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
              {/* Left: Packs List */}
              <div className="glass-panel admin-list-section">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                  <h3>LISTA DE SOBRES</h3>
                  <button className="arcade-btn" onClick={() => setSelectedPack({ name: '', price: 250, cardsPerPack: 3, enabled: true, cardPool: [] })}>+ NUEVO</button>
                </div>
                <div className="enemy-admin-list scrollbar">
                  {packs.map(p => (
                    <div key={p._id} className={`enemy-item-admin ${selectedPack?._id === p._id ? 'active' : ''}`} onClick={() => setSelectedPack(p)}>
                      <div style={{ width: '40px', height: '60px', background: p.imageUrl ? `url(${p.imageUrl && typeof p.imageUrl === 'string' && p.imageUrl.startsWith('http') ? '' : baseUrl}${p.imageUrl}) center/cover` : '#000', borderRadius: '4px' }}></div>
                      <div className="enemy-item-details">
                        <p className="e-name">{p.name}</p>
                        <p className="e-meta">{p.price} 🪙 • {p.cardsPerPack} Cartas</p>
                      </div>
                      <span className={`status-pill ${p.enabled ? 'active' : ''}`}>{p.enabled ? 'ON' : 'OFF'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Pack Form */}
              {selectedPack ? (
                <div className="glass-panel enemy-editor-form scrollbar">
                  <div className="editor-header">
                    <h3>CONFIGURAR: {selectedPack.name || 'NUEVO SOBRE'}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {selectedPack._id && <button className="arcade-btn red" onClick={() => handleDeletePack(selectedPack._id)}><Trash2 size={16} /></button>}
                      <button className="arcade-btn" onClick={() => setSelectedPack(null)}><X size={16} /></button>
                    </div>
                  </div>

                  <form onSubmit={handlePackSubmit} className="admin-form extended">
                    <div className="form-sections-grid">
                      <div className="basic-info-section">
                        <div className="field-group">
                          <label>NOMBRE DEL SOBRE</label>
                          <input type="text" value={selectedPack.name} onChange={e => setSelectedPack({ ...selectedPack, name: e.target.value })} placeholder="Ej: Sobre Épico del Caos" required />
                        </div>
                        <div className="stats-row">
                          <div className="field-group">
                            <label>PRECIO (Monedas)</label>
                            <input type="number" value={selectedPack.price} onChange={e => setSelectedPack({ ...selectedPack, price: e.target.value })} />
                          </div>
                          <div className="field-group">
                            <label>CARTAS AL ABRIR</label>
                            <input type="number" value={selectedPack.cardsPerPack} onChange={e => setSelectedPack({ ...selectedPack, cardsPerPack: e.target.value })} />
                          </div>
                        </div>
                        <div className="field-group checkbox-group">
                          <label className="toggle">
                            <input type="checkbox" checked={selectedPack.enabled} onChange={e => setSelectedPack({ ...selectedPack, enabled: e.target.checked })} />
                            <span className="slider"></span>
                            <span className="label-text">SOBRE HABILITADO EN TIENDA</span>
                          </label>
                        </div>

                        <div className="assets-upload-grid">
                          <div className="upload-box" style={{ gridColumn: '1 / -1' }}>
                            <label>IMAGEN DEL SOBRE (500x700)</label>
                            <input type="file" onChange={e => setPackFile(e.target.files[0])} accept="image/*" />
                            <input type="text" placeholder="O link de internet (URL)..." className="neon-input" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.65rem' }} value={selectedPack?.imageString || ''} onChange={e => setSelectedPack({...selectedPack, imageString: e.target.value})} />
                          </div>
                        </div>
                      </div>

                      <div className="deck-builder-section">
                        <label>CARTAS EN EL SOBRE ({selectedPack.cardPool?.length || 0}) — PROBABILIDADES AUTO-CALCULADAS</label>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          {(() => {
                            const pool = selectedPack.cardPool || [];
                            const toTier = (r) => ['Legendaria','Mítica','Divina','Ancestral','Inmortal','Cósmica'].includes(r) ? 'Legendaria' : r;
                            const tiers = {};
                            pool.forEach(item => {
                              const card = cards.find(c => c._id === (item.cardId?._id || item.cardId));
                              const tier = toTier(card?.rarity || 'Común');
                              tiers[tier] = (tiers[tier] || 0) + item.dropRate;
                            });
                            return Object.entries(tiers).map(([t, r]) => `${t}: ${Math.round(r)}%`).join(' • ');
                          })()}
                        </div>
                        <div className="enemy-current-deck-scroll scrollbar" style={{ minHeight: '150px' }}>
                          {selectedPack.cardPool?.map((poolItem, idx) => {
                            const cId = poolItem.cardId?._id || poolItem.cardId;
                            const card = cards.find(c => c._id === cId);
                            return card ? (
                              <div key={`pd-${idx}`} className="deck-card-mini" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px' }}>
                                <span style={{ fontSize: '0.8rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: 700 }}>{card.rarity}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, minWidth: '50px', textAlign: 'right' }}>{poolItem.dropRate}%</span>
                                  <button type="button" onClick={() => removeCardFromPackPool(idx)}><X size={12} /></button>
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>

                        <label style={{ marginTop: '1rem' }}>AGREGAR CARTAS (CARPETAS DISPONIBLES)</label>
                        <div className="available-cards-mini-grid scrollbar">
                          {cards.map(card => {
                            const inPool = selectedPack.cardPool?.find(p => (p.cardId?._id || p.cardId) === card._id);
                            return (
                              <div key={`ap-${card._id}`} className={`card-selector-item ${inPool ? 'selected' : ''}`} onClick={() => addCardToPackPool(card._id)}>
                                <img src={`${card.imageUrl && typeof card.imageUrl === 'string' && card.imageUrl.startsWith('http') ? '' : baseUrl}${card.imageUrl}`} alt={card.name} title={card.name} style={{ opacity: inPool ? 0.3 : 1 }} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="arcade-btn green" style={{ width: '100%', marginTop: '2rem', height: '60px', fontSize: '1.1rem' }}>
                      <Save size={20} style={{ marginRight: '10px' }} /> GUARDAR SOBRE
                    </button>
                  </form>
                </div>
              ) : (
                <div className="glass-panel empty-editor-state">
                  <Upload size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Selecciona un sobre de la lista para editar su configuración o crea uno nuevo.</p>
                </div>
              )}
            </div>
          </motion.div>
          ) : activeTab === 'avatars' ? (
          <motion.div key="avatars" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="story-admin-container">
            <div className="admin-content-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
              <div className="glass-panel admin-list-section">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                  <h3>LISTA DE AVATARES ({avatars.length})</h3>
                  <button className="arcade-btn" onClick={() => setSelectedAvatar({ name: '', price: 100, enabled: true })}>+ NUEVO</button>
                </div>
                <div className="enemy-admin-list scrollbar">
                  {avatars.map(a => (
                    <div key={a._id} className={`enemy-item-admin ${selectedAvatar?._id === a._id ? 'active' : ''}`} onClick={() => setSelectedAvatar(a)}>
                      <div style={{ width: '40px', height: '40px', background: a.imageUrl ? `url(${a.imageUrl && typeof a.imageUrl === 'string' && a.imageUrl.startsWith('http') ? '' : baseUrl}${a.imageUrl}) center/cover` : '#000', borderRadius: '4px' }}></div>
                      <div className="enemy-item-details">
                        <p className="e-name">{a.name}</p>
                        <p className="e-meta">{a.price} 🪙</p>
                      </div>
                      <span className={`status-pill ${a.enabled ? 'active' : ''}`}>{a.enabled ? 'ON' : 'OFF'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedAvatar ? (
                <div className="glass-panel enemy-editor-form scrollbar">
                  <div className="editor-header">
                    <h3>CONFIGURAR: {selectedAvatar.name || 'NUEVO AVATAR'}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {selectedAvatar._id && <button className="arcade-btn red" onClick={() => handleDeleteAvatar(selectedAvatar._id)}><Trash2 size={16} /></button>}
                      <button className="arcade-btn" onClick={() => setSelectedAvatar(null)}><X size={16} /></button>
                    </div>
                  </div>
                  <form onSubmit={handleAvatarSubmit} className="admin-form extended">
                    <div className="form-sections-grid">
                      <div className="basic-info-section" style={{ gridColumn: '1 / -1' }}>
                        <div className="field-group">
                          <label>NOMBRE DEL AVATAR</label>
                          <input type="text" value={selectedAvatar.name} onChange={e => setSelectedAvatar({ ...selectedAvatar, name: e.target.value })} placeholder="Ej: Guerrero del Norte" required />
                        </div>
                        <div className="stats-row">
                          <div className="field-group">
                            <label>PRECIO (Créditos)</label>
                            <input type="number" value={selectedAvatar.price} onChange={e => setSelectedAvatar({ ...selectedAvatar, price: e.target.value })} />
                          </div>
                        </div>
                        <div className="field-group checkbox-group">
                          <label className="toggle">
                            <input type="checkbox" checked={selectedAvatar.enabled} onChange={e => setSelectedAvatar({ ...selectedAvatar, enabled: e.target.checked })} />
                            <span className="slider"></span>
                            <span className="label-text">COMPRABLE EN TIENDA</span>
                          </label>
                        </div>
                        <div className="assets-upload-grid">
                          <div className="upload-box" style={{ gridColumn: '1 / -1' }}>
                            <label>IMAGEN DEL AVATAR</label>
                            <input type="file" onChange={e => setAvatarFile(e.target.files[0])} accept="image/*" />
                            <input type="text" placeholder="O link de internet (URL)..." className="neon-input" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.65rem' }} value={selectedAvatar?.imageString || ''} onChange={e => setSelectedAvatar({...selectedAvatar, imageString: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <button type="submit" className="arcade-btn green" style={{ width: '100%', marginTop: '2rem', height: '60px' }}>
                      <Save size={20} /> GUARDAR AVATAR
                    </button>
                  </form>
                </div>
              ) : (
                <div className="glass-panel empty-editor-state">
                  <Shield size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Selecciona un avatar para editar.</p>
                </div>
              )}
            </div>
          </motion.div>
          ) : activeTab === 'boards' ? (
          <motion.div key="boards" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="story-admin-container">
            <div className="admin-content-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
              <div className="glass-panel admin-list-section">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                  <h3>LISTA DE TABLEROS ({boards.length})</h3>
                  <button className="arcade-btn" onClick={() => setSelectedBoard({ name: '', price: 500, enabled: true })}>+ NUEVO</button>
                </div>
                <div className="enemy-admin-list scrollbar">
                  {boards.map(b => (
                    <div key={b._id} className={`enemy-item-admin ${selectedBoard?._id === b._id ? 'active' : ''}`} onClick={() => setSelectedBoard(b)}>
                      <div style={{ width: '60px', height: '40px', background: b.imageUrl ? `url(${b.imageUrl && typeof b.imageUrl === 'string' && b.imageUrl.startsWith('http') ? '' : baseUrl}${b.imageUrl}) center/cover` : '#000', borderRadius: '4px' }}></div>
                      <div className="enemy-item-details">
                        <p className="e-name">{b.name}</p>
                        <p className="e-meta">{b.price} 🪙</p>
                      </div>
                      <span className={`status-pill ${b.enabled ? 'active' : ''}`}>{b.enabled ? 'ON' : 'OFF'}</span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedBoard ? (
                <div className="glass-panel enemy-editor-form scrollbar">
                  <div className="editor-header">
                    <h3>CONFIGURAR: {selectedBoard.name || 'NUEVO TABLERO'}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {selectedBoard._id && <button className="arcade-btn red" onClick={() => handleDeleteBoard(selectedBoard._id)}><Trash2 size={16} /></button>}
                      <button className="arcade-btn" onClick={() => setSelectedBoard(null)}><X size={16} /></button>
                    </div>
                  </div>
                  <form onSubmit={handleBoardSubmit} className="admin-form extended">
                    <div className="form-sections-grid">
                      <div className="basic-info-section" style={{ gridColumn: '1 / -1' }}>
                        <div className="field-group">
                          <label>NOMBRE DEL TABLERO</label>
                          <input type="text" value={selectedBoard.name} onChange={e => setSelectedBoard({ ...selectedBoard, name: e.target.value })} placeholder="Ej: Arena de Fuego" required />
                        </div>
                        <div className="stats-row">
                          <div className="field-group">
                            <label>PRECIO (Créditos)</label>
                            <input type="number" value={selectedBoard.price} onChange={e => setSelectedBoard({ ...selectedBoard, price: e.target.value })} />
                          </div>
                        </div>
                        <div className="field-group checkbox-group">
                          <label className="toggle">
                            <input type="checkbox" checked={selectedBoard.enabled} onChange={e => setSelectedBoard({ ...selectedBoard, enabled: e.target.checked })} />
                            <span className="slider"></span>
                            <span className="label-text">COMPRABLE EN TIENDA</span>
                          </label>
                        </div>
                        <div className="assets-upload-grid">
                          <div className="upload-box">
                            <label>ICONO (MERCADO)</label>
                            <input type="file" onChange={e => setBoardFile(e.target.files[0])} accept="image/*" />
                            <input type="text" placeholder="O link (URL)..." className="neon-input" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.65rem' }} value={selectedBoard?.imageString || ''} onChange={e => setSelectedBoard({...selectedBoard, imageString: e.target.value})} />
                          </div>
                          <div className="upload-box">
                            <label>FONDO CAMPO</label>
                            <input type="file" onChange={e => setBoardFieldFile(e.target.files[0])} accept="image/*" />
                            <input type="text" placeholder="O link (URL)..." className="neon-input" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.65rem' }} value={selectedBoard?.fieldImageString || ''} onChange={e => setSelectedBoard({...selectedBoard, fieldImageString: e.target.value})} />
                          </div>
                          <div className="upload-box">
                            <label>TEXTURA CAMPO</label>
                            <input type="file" onChange={e => setBoardTextureFile(e.target.files[0])} accept="image/*" />
                            <input type="text" placeholder="O link (URL)..." className="neon-input" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.65rem' }} value={selectedBoard?.textureImageString || ''} onChange={e => setSelectedBoard({...selectedBoard, textureImageString: e.target.value})} />
                          </div>
                          <div className="upload-box">
                            <label>DORSO PERSONALIZADO</label>
                            <input type="file" onChange={e => setBoardBackFile(e.target.files[0])} accept="image/*" />
                            <input type="text" placeholder="O link (URL)..." className="neon-input" style={{ width: '100%', marginTop: '5px', padding: '6px', fontSize: '0.65rem' }} value={selectedBoard?.cardBackImageString || ''} onChange={e => setSelectedBoard({...selectedBoard, cardBackImageString: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <button type="submit" className="arcade-btn green" style={{ width: '100%', marginTop: '2rem', height: '60px' }}>
                      <Save size={20} /> GUARDAR TABLERO
                    </button>
                  </form>
                </div>
              ) : (
                <div className="glass-panel empty-editor-state">
                  <Layout size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Selecciona un tablero para editar.</p>
                </div>
              )}
            </div>
          </motion.div>
          ) : (
          <motion.div key="chests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="story-admin-container">
            <div className="glass-panel" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3>CONFIGURACIÓN DE COFRES SEMANALES</h3>
                <button className="arcade-btn green" onClick={async () => {
                  if (window.confirm("¿Inicializar configuraciones de cofres por defecto?")) {
                    await axios.post(`${baseUrl}/api/admin/seed-chests`);
                    fetchChests();
                  }
                }}>SEMBRAR COFRES (RESET)</button>
              </div>
              <div className="chests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                {[5, 7, 9].map(m => {
                  const config = chests.find(c => c.milestone === m) || { milestone: m, coinsPrizes: 0, cardsPrizes: [] };
                  return (
                    <div key={m} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--accent-gold)' }}>
                      <h4>Hito: {m} Puntos</h4>
                      <div className="field-group">
                        <label>MONEDAS</label>
                        <input type="number" value={config.coinsPrizes} onChange={async (e) => {
                          const val = Number(e.target.value);
                          await axios.post(`${baseUrl}/api/admin/chests`, { milestone: m, coinsPrizes: val, cardsPrizes: config.cardsPrizes });
                          fetchChests();
                        }} />
                      </div>
                      <div className="field-group" style={{ marginTop: '1rem' }}>
                        <label>CARTAS DE RECOMPENSA ({config.cardsPrizes?.length || 0})</label>
                        <div className="enemy-current-deck-scroll scrollbar" style={{ maxHeight: '120px', minHeight: '80px' }}>
                          {config.cardsPrizes?.map((cardId, idx) => {
                            const cId = cardId?._id || cardId;
                            const card = cards.find(c => c._id === cId);
                            return card ? (
                              <div key={idx} className="deck-card-mini">
                                <span>{card.name}</span>
                                <button onClick={async () => {
                                  const newCards = [...config.cardsPrizes];
                                  newCards.splice(idx, 1);
                                  await axios.post(`${baseUrl}/api/admin/chests`, { milestone: m, coinsPrizes: config.coinsPrizes, cardsPrizes: newCards });
                                  fetchChests();
                                }}><X size={12} /></button>
                              </div>
                            ) : null;
                          })}
                        </div>
                        <div className="available-cards-mini-grid scrollbar" style={{ maxHeight: '200px', marginTop: '1rem' }}>
                          {cards.map(card => (
                            <div key={card._id} className="card-selector-item" onClick={async () => {
                              const newCards = [...(config.cardsPrizes || []), card._id];
                              await axios.post(`${baseUrl}/api/admin/chests`, { milestone: m, coinsPrizes: config.coinsPrizes, cardsPrizes: newCards });
                              fetchChests();
                            }}>
                              <img src={`${card.imageUrl && typeof card.imageUrl === 'string' && card.imageUrl.startsWith('http') ? '' : baseUrl}${card.imageUrl}`} alt={card.name} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminPanel;
