import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Volume2, VolumeX, Sliders, User as UserIcon, 
  ImageIcon, Grid, CreditCard, Layout, Trash2 
} from 'lucide-react';
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
    } catch (err) { console.error("Error equipping component:", err); }
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

  // --- COLLECTION RENDERERS ---

  const renderAvatars = () => {
    // Collect standard shop avatars + avatars included in owned boards
    const ownedBoardAvatars = boards
      .filter(b => user.ownedBoards?.includes(b._id) && b.avatarUrl)
      .map(b => ({ _id: `board-avatar-${b._id}`, imageUrl: b.avatarUrl, name: `Icono ${b.name}` }));

    const availableAvatars = [
      { _id: 'default', imageUrl: '/default.png', name: 'Predeterminado' },
      ...avatars.filter(a => user.ownedAvatars?.includes(a._id)),
      ...ownedBoardAvatars,
      ...(user.unlockedEnemyAvatars || []).map((url, i) => ({ _id: `enemy-${i}`, imageUrl: url, name: 'Trofeo', isTrophy: true }))
    ];

    return (
      <div className="collection-row scrollbar" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.8rem' }}>
        {availableAvatars.map(a => (
          <div
            key={a._id}
            onClick={() => handleEquip(a.imageUrl)}
            style={{
              minWidth: '65px', height: '80px', cursor: 'pointer', borderRadius: '12px', position: 'relative',
              border: user.equippedAvatar === a.imageUrl ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
              boxShadow: user.equippedAvatar === a.imageUrl ? '0 0 15px rgba(212,175,55,0.4)' : 'none',
              background: `url(${a.imageUrl?.startsWith('http') ? '' : baseUrl}${a.imageUrl}) center/cover`,
              transition: 'all 0.2s ease'
            }}
            title={a.name}
          >
            {a.isTrophy && <span style={{ position: 'absolute', top: '-6px', right: '-6px', fontSize: '14px', filter: 'drop-shadow(0 0 4px gold)' }}>🏆</span>}
          </div>
        ))}
      </div>
    );
  };

  const renderFieldImages = () => (
    <div className="collection-row scrollbar" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.8rem' }}>
        <div
            onClick={() => handleEquipBoard({ fieldImageUrl: '' })}
            style={{
                minWidth: '120px', height: '70px', cursor: 'pointer', borderRadius: '12px',
                border: !user.equippedFieldImage ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)', textAlign: 'center'
            }}
        >FONDO ESTÁNDAR</div>
        {boards.filter(b => user.ownedBoards?.includes(b._id)).map(b => (
            <div
                key={`field-img-${b._id}`}
                onClick={() => handleEquipBoard({ fieldImageUrl: b.fieldImageUrl || b.imageUrl })}
                style={{
                    minWidth: '120px', height: '70px', cursor: 'pointer', borderRadius: '12px',
                    border: user.equippedFieldImage === (b.fieldImageUrl || b.imageUrl) ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                    boxShadow: user.equippedFieldImage === (b.fieldImageUrl || b.imageUrl) ? '0 0 15px rgba(212,175,55,0.3)' : 'none',
                    background: `url(${(b.fieldImageUrl || b.imageUrl)?.startsWith('http') ? '' : baseUrl}${b.fieldImageUrl || b.imageUrl}) center/cover`,
                    transition: 'all 0.2s ease'
                }}
                title={b.name}
            />
        ))}
    </div>
  );

  const renderTextures = () => (
    <div className="collection-row scrollbar" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.8rem' }}>
        <div
            onClick={() => handleEquipBoard({ textureUrl: '' })}
            style={{
                minWidth: '100px', height: '70px', cursor: 'pointer', borderRadius: '12px',
                border: !user.equippedTexture ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: 'var(--text-muted)'
            }}
        >ÁREA LIMPIA</div>
        {boards.filter(b => user.ownedBoards?.includes(b._id) && b.textureUrl).map(b => (
            <div
                key={`texture-${b._id}`}
                onClick={() => handleEquipBoard({ textureUrl: b.textureUrl })}
                style={{
                    minWidth: '100px', height: '70px', cursor: 'pointer', borderRadius: '12px',
                    border: user.equippedTexture === b.textureUrl ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                    boxShadow: user.equippedTexture === b.textureUrl ? '0 0 15px rgba(212,175,55,0.3)' : 'none',
                    background: `url(${b.textureUrl?.startsWith('http') ? '' : baseUrl}${b.textureUrl}) center/cover`,
                    transition: 'all 0.2s ease'
                }}
                title={`Textura ${b.name}`}
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
                    background: `url(${b.cardBackUrl?.startsWith('http') ? '' : baseUrl}${b.cardBackUrl}) center/cover`,
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
        style={{ width: '95%', maxWidth: '550px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="settings-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sliders size={22} className="text-gold" />
            <h3 style={{ margin: 0, letterSpacing: '2px', fontWeight: 900, color: 'var(--accent-gold)' }}>CONFIGURACIÓN</h3>
          </div>
          <button className="close-btn" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div className="settings-body scrollbar" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          
          {/* Audio Section */}
          <div className="setting-item" style={{ marginBottom: '2.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.6, letterSpacing: '1px' }}>VOLUMEN {Math.round(vol * 100)}%</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button className="mute-btn-mini" onClick={handleMute} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', color: muted ? '#ef4444' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input type="range" min="0" max="1" step="0.01" value={vol} onChange={handleVolChange} className="pixel-slider" style={{ flex: 1 }} />
            </div>
          </div>

          <h4 style={{ fontSize: '0.65rem', letterSpacing: '3px', color: 'var(--accent-gold)', marginBottom: '1.5rem', opacity: 0.8, textAlign: 'center', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '0.5rem' }}>PERSONALIZACIÓN MODULAR</h4>

          {user && (
            <>
              {/* 1. ICONO (Avatar) */}
              <div className="cosmetic-section" style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                      <UserIcon size={18} className="text-gold" />
                      <label style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1px' }}>ICONO (AVATAR)</label>
                  </div>
                  {renderAvatars()}
              </div>

              {/* 2. FONDO CAMPO */}
              <div className="cosmetic-section" style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                      <ImageIcon size={18} className="text-gold" />
                      <label style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1px' }}>FONDO CAMPO</label>
                  </div>
                  {renderFieldImages()}
              </div>

              {/* 3. TEXTURA CAMPO */}
              <div className="cosmetic-section" style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                      <Grid size={18} className="text-gold" />
                      <label style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1px' }}>TEXTURA CAMPO</label>
                  </div>
                  {renderTextures()}
              </div>

              {/* 4. DORSO PERSONALIZADO */}
              <div className="cosmetic-section" style={{ marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                      <CreditCard size={18} className="text-gold" />
                      <label style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1px' }}>DORSO PERSONALIZADO</label>
                  </div>
                  {renderCardBacks()}
              </div>
            </>
          )}

          {/* Account Management */}
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {!showConfirmDelete ? (
              <button
                className="btn-danger-outline"
                onClick={() => setShowConfirmDelete(true)}
                style={{ width: '100%', padding: '1rem', fontSize: '0.75rem', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', background: 'transparent', cursor: 'pointer', fontWeight: 800, letterSpacing: '1px' }}
              >
                ELIMINAR MI CUENTA
              </button>
            ) : (
              <div style={{ textAlign: 'center', background: 'rgba(239,68,68,0.05)', padding: '1.5rem', borderRadius: '15px', border: '1px solid rgba(239,68,68,0.1)' }}>
                <p style={{ color: '#ef4444', fontWeight: 900, fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                  ¿ESTÁS COMPLETAMENTE SEGURO?
                </p>
                <div style={{ display: 'flex', gap: '1.2rem', marginTop: '1rem' }}>
                  <button className="btn-danger-epic" onClick={handleDeleteAccount} disabled={isDeleting} style={{ flex: 1.5 }}>
                    {isDeleting ? 'ELIMINANDO...' : <><Trash2 size={18} /> SÍ, BORRAR</>}
                  </button>
                  <button className="btn-cancel-epic" onClick={() => setShowConfirmDelete(false)} style={{ flex: 1 }}>
                    <X size={18} /> CANCELAR
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Versión info */}
          <div style={{ marginTop: '2.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: 0.3 }}>
            <img src={logoG} alt="Designer Logo" style={{ width: '35px', height: 'auto', filter: 'grayscale(1) brightness(1.5)' }} />
            <p style={{ fontSize: '0.6rem', fontWeight: 800 }}>VERSIÓN 1.3.0 • PREMIUM CUSTOM</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SettingsModal;
