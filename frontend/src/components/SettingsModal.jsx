import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Sliders, User as UserIcon, Layout, CreditCard } from 'lucide-react';
import { getVolume, setVolume, toggleMute, getMuteStatus } from '../utils/sound';
import axios from 'axios';
import logoG from '../utils/img/IconoG.png';

function SettingsModal({ onClose, user, setUser, baseUrl, onLogout }) {
  const [vol, setVol] = useState(getVolume());
  const [muted, setMuted] = useState(getMuteStatus());
  const [avatars, setAvatars] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [avRes, brRes] = await Promise.all([
          axios.get(`${baseUrl}/api/shop/avatars`),
          axios.get(`${baseUrl}/api/shop/boards`)
        ]);
        setAvatars(avRes.data);
        setBoards(brRes.data);
      } catch (err) { console.error(err); }
    };
    if (user) fetchData();
  }, [baseUrl, user]);

  const handleEquip = async (avatarUrl) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/api/shop/equip-avatar`, { username: user.username, avatarUrl });
      if (res.data.success) {
        setUser({ ...user, equippedAvatar: res.data.equippedAvatar });
      }
    } catch (err) { console.error("Error equipping avatar:", err); }
    finally { setLoading(false); }
  };

  const handleEquipBoard = async (payload) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/api/shop/equip-board`, { username: user.username, ...payload });
      if (res.data.success) {
        setUser({ 
          ...user, 
          equippedBoard: res.data.equippedBoard,
          equippedFieldImage: res.data.equippedFieldImage,
          equippedTexture: res.data.equippedTexture,
          equippedCardBack: res.data.equippedCardBack
        });
      }
    } catch (err) { console.error("Error equipping board:", err); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const res = await axios.delete(`${cleanBaseUrl}/api/shop/delete-account/${user.username}`);
      if (res.data.success) {
        alert("Tu cuenta ha sido eliminada permanentemente.");
        onClose();
        onLogout();
      }
    } catch (err) {
      console.error("Error al eliminar cuenta:", err);
      alert(err.response?.data?.message || "Error al eliminar la cuenta");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVolChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVol(newVol);
    setVolume(newVol);
  };

  const handleMute = () => {
    const next = toggleMute();
    setMuted(next);
  };

  // Sections Renderers
  const renderAvatars = () => (
    <div className="collection-row scrollbar" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.8rem' }}>
        <div
            onClick={() => handleEquip('/default.png')}
            style={{
                minWidth: '65px', height: '80px', cursor: 'pointer', borderRadius: '12px',
                border: user.equippedAvatar === '/default.png' ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                boxShadow: user.equippedAvatar === '/default.png' ? '0 0 15px rgba(212,175,55,0.4)' : 'none',
                background: `url(${baseUrl}/default.png) center/cover`, transition: 'all 0.2s ease'
            }}
            title="Predeterminado"
        />
        {avatars.filter(a => user.ownedAvatars?.includes(a._id)).map(a => (
            <div
                key={a._id}
                onClick={() => handleEquip(a.imageUrl)}
                style={{
                    minWidth: '65px', height: '80px', cursor: 'pointer', borderRadius: '12px',
                    border: user.equippedAvatar === a.imageUrl ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                    boxShadow: user.equippedAvatar === a.imageUrl ? '0 0 15px rgba(212,175,55,0.4)' : 'none',
                    background: `url(${a.imageUrl && typeof a.imageUrl === 'string' && a.imageUrl.startsWith('http') ? '' : baseUrl}${a.imageUrl}) center/cover`,
                    transition: 'all 0.2s ease'
                }}
            />
        ))}
        {(user.unlockedEnemyAvatars || []).map((url, idx) => (
            <div
                key={`enemy-avatar-${idx}`}
                onClick={() => handleEquip(url)}
                style={{
                    minWidth: '65px', height: '80px', cursor: 'pointer', borderRadius: '12px', position: 'relative',
                    border: user.equippedAvatar === url ? '3px solid var(--accent-gold)' : '2px solid rgba(239, 68, 68, 0.4)',
                    background: `url(${url && typeof url === 'string' && url.startsWith('http') ? '' : baseUrl}${url}) center/cover`
                }}
            >
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', fontSize: '14px', filter: 'drop-shadow(0 0 4px gold)' }}>🏆</span>
            </div>
        ))}
    </div>
  );

  const renderFields = () => (
    <div className="collection-row scrollbar" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.8rem' }}>
        <div
            onClick={() => handleEquipBoard({ boardUrl: '', fieldImageUrl: '', textureUrl: '' })}
            style={{
                minWidth: '120px', height: '70px', cursor: 'pointer', borderRadius: '12px',
                border: !user.equippedBoard ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '1px'
            }}
        >ESTÁNDAR</div>
        {boards.filter(b => user.ownedBoards?.includes(b._id)).map(b => (
            <div
                key={`field-${b._id}`}
                onClick={() => handleEquipBoard({ boardUrl: b.imageUrl, fieldImageUrl: b.fieldImageUrl, textureUrl: b.textureUrl })}
                style={{
                    minWidth: '120px', height: '70px', cursor: 'pointer', borderRadius: '12px',
                    border: user.equippedBoard === b.imageUrl ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                    boxShadow: user.equippedBoard === b.imageUrl ? '0 0 15px rgba(212,175,55,0.3)' : 'none',
                    background: `url(${b.imageUrl && typeof b.imageUrl === 'string' && b.imageUrl.startsWith('http') ? '' : baseUrl}${b.imageUrl}) center/cover`,
                    transition: 'all 0.2s ease'
                }}
                title={b.name}
            />
        ))}
    </div>
  );

  const renderCardBacks = () => (
    <div className="collection-row scrollbar" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.8rem' }}>
        <div
            onClick={() => handleEquipBoard({ cardBackUrl: '' })}
            style={{
                minWidth: '60px', height: '80px', cursor: 'pointer', borderRadius: '10px',
                border: !user.equippedCardBack ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                background: 'var(--primary)', opacity: 0.8, position: 'relative'
            }}
        >
             <CreditCard size={18} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.3 }} />
        </div>
        {boards.filter(b => user.ownedBoards?.includes(b._id) && b.cardBackUrl).map(b => (
            <div
                key={`back-${b._id}`}
                onClick={() => handleEquipBoard({ cardBackUrl: b.cardBackUrl })}
                style={{
                    minWidth: '60px', height: '80px', cursor: 'pointer', borderRadius: '10px',
                    border: user.equippedCardBack === b.cardBackUrl ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                    boxShadow: user.equippedCardBack === b.cardBackUrl ? '0 0 15px rgba(212,175,55,0.3)' : 'none',
                    background: `url(${b.cardBackUrl && typeof b.cardBackUrl === 'string' && b.cardBackUrl.startsWith('http') ? '' : baseUrl}${b.cardBackUrl}) center/cover`,
                    transition: 'all 0.2s ease'
                }}
                title={`Respaldo ${b.name}`}
            />
        ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="modal-overlay"
      style={{ zIndex: 1100 }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
        className="settings-card glass-panel"
        style={{ width: '90%', maxWidth: '500px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="settings-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sliders size={22} className="text-gold" />
            <h3 style={{ margin: 0, letterSpacing: '2px', fontWeight: 900, color: 'var(--accent-gold)' }}>PERSONALIZACIÓN</h3>
          </div>
          <button className="close-btn" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div className="settings-body scrollbar" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Audio Section */}
          <div className="setting-item" style={{ marginBottom: '2.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.6, letterSpacing: '1px' }}>AUDIO PRINCIPAL</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 900 }}>{Math.round(vol * 100)}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button className="mute-btn-mini" onClick={handleMute} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', color: muted ? '#ef4444' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input type="range" min="0" max="1" step="0.01" value={vol} onChange={handleVolChange} className="pixel-slider" style={{ flex: 1 }} />
            </div>
          </div>

          {user && (
            <>
              {/* Category: Avatar */}
              <div className="cosmetic-section" style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                      <UserIcon size={18} className="text-gold" />
                      <label style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '1px' }}>PERSONAJE (AVATAR)</label>
                  </div>
                  {renderAvatars()}
              </div>

              {/* Category: Fields */}
              <div className="cosmetic-section" style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                      <Layout size={18} className="text-gold" />
                      <label style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '1px' }}>CAMPO DE BATALLA</label>
                  </div>
                  {renderFields()}
              </div>

              {/* Category: Card Backs */}
              <div className="cosmetic-section" style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                      <CreditCard size={18} className="text-gold" />
                      <label style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '1px' }}>RESPALDO DE CARTAS</label>
                  </div>
                  {renderCardBacks()}
              </div>
            </>
          )}

          {/* Account Management */}
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {!showConfirmDelete ? (
              <button
                className="btn-danger-outline"
                onClick={() => setShowConfirmDelete(true)}
                style={{ width: '100%', padding: '1rem', fontSize: '0.8rem', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', background: 'rgba(239,68,68,0.02)', cursor: 'pointer', fontWeight: 800, letterSpacing: '1px' }}
              >
                ELIMINAR MI CUENTA
              </button>
            ) : (
              <div style={{ textAlign: 'center', background: 'rgba(239,68,68,0.05)', padding: '1.5rem', borderRadius: '15px', border: '1px solid rgba(239,68,68,0.1)' }}>
                <p style={{ color: '#ef4444', fontWeight: 900, fontSize: '0.85rem', marginBottom: '1.5rem', letterSpacing: '1px' }}>
                  ¿ESTÁS COMPLETAMENTE SEGURO?
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="arcade-btn small-btn red-btn" onClick={handleDeleteAccount} disabled={isDeleting} style={{ flex: 1, padding: '10px' }}>
                    {isDeleting ? 'ELIMINANDO...' : 'SÍ, BORRAR'}
                  </button>
                  <button className="arcade-btn small-btn black-btn" onClick={() => setShowConfirmDelete(false)} style={{ flex: 1, padding: '10px' }}>
                    CANCELAR
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Versión info */}
          <div style={{ marginTop: '2.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: 0.4 }}>
            <p style={{ fontSize: '0.55rem', letterSpacing: '3px', fontWeight: 900 }}>DESIGNED BY</p>
            <img src={logoG} alt="Designer Logo" style={{ width: '35px', height: 'auto', filter: 'grayscale(1) brightness(1.5)' }} />
            <p style={{ fontSize: '0.65rem', marginTop: '0.3rem', fontWeight: 800 }}>VERSIÓN 1.2.5</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SettingsModal;
