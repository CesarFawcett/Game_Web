import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Sliders, User as UserIcon } from 'lucide-react';
import { getVolume, setVolume, toggleMute, getMuteStatus } from '../utils/sound';
import axios from 'axios';
import logoG from '../utils/img/IconoG.png';

function SettingsModal({ onClose, user, setUser, baseUrl, onLogout }) {
  const [vol, setVol] = useState(getVolume());
  const [muted, setMuted] = useState(getMuteStatus());
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const res = await axios.get(`${baseUrl}/api/shop/avatars`);
        setAvatars(res.data);
      } catch (err) { console.error(err); }
    };
    if (user) fetchAvatars();
  }, [baseUrl, user]);

  const handleEquip = async (avatarUrl) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/api/shop/equip-avatar`, { username: user.username, avatarUrl });
      if (res.data.success) {
        const updatedUser = { ...user, equippedAvatar: res.data.equippedAvatar };
        setUser(updatedUser);
      }
    } catch (err) { alert("Error al equipar"); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) return;
    const username = user.username;
    if (!username) {
      alert("No se pudo identificar el usuario para eliminar.");
      return;
    }

    setIsDeleting(true);
    console.log(`Intentando eliminar cuenta: ${username}`);
    
    try {
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const res = await axios.delete(`${cleanBaseUrl}/api/shop/delete-account/${username}`);
      if (res.data.success) {
        alert("Tu cuenta ha sido eliminada permanentemente.");
        onClose();
        onLogout();
      }
    } catch (err) {
      console.error("Error al eliminar cuenta:", err);
      const msg = err.response?.data?.message || err.message || "Error al eliminar la cuenta";
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVolChange = (e) => {
    const newVol = e.target.value;
    setVol(newVol);
    setVolume(newVol);
  };

  const handleMute = () => {
    const next = toggleMute();
    setMuted(next);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="modal-overlay"
    >
      <motion.div 
        initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
        className="settings-card glass-panel"
      >
        <div className="settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} className="primary-text" />
            <h3>CONFIGURACIÓN</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="settings-body">
          <div className="setting-item">
            <div className="setting-info">
              <label>VOLUMEN GENERAL</label>
              <span>{Math.round(vol * 100)}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button className="mute-btn-mini" onClick={handleMute}>
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={vol} onChange={handleVolChange} 
                className="pixel-slider"
              />
            </div>
          </div>

          {user && (
            <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', marginTop: '2rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                 <UserIcon size={18} className="primary-text" />
                 <label>AVATAR EQUIPADO</label>
               </div>
               
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', width: '100%' }}>
                   <div 
                     onClick={() => handleEquip('/default.png')}
                     style={{ 
                         width: '60px', height: '75px', cursor: 'pointer', borderRadius: '8px', 
                         border: user.equippedAvatar === '/default.png' ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                         boxShadow: user.equippedAvatar === '/default.png' ? '0 0 10px rgba(212,175,55,0.5)' : 'none',
                         background: `url(${baseUrl}/default.png) center/cover`
                     }}
                     title="Predeterminado"
                   />
                   {avatars.filter(a => user.ownedAvatars?.includes(a._id)).map(a => (
                      <div 
                        key={a._id}
                        onClick={() => handleEquip(a.imageUrl)}
                        style={{ 
                            width: '60px', height: '75px', cursor: 'pointer', borderRadius: '8px', 
                            border: user.equippedAvatar === a.imageUrl ? '3px solid var(--accent-gold)' : '2px solid var(--glass-border)',
                            boxShadow: user.equippedAvatar === a.imageUrl ? '0 0 10px rgba(212,175,55,0.5)' : 'none',
                            background: `url(${baseUrl}${a.imageUrl}) center/cover`
                        }}
                        title={a.name}
                      />
                   ))}
                   {(user.unlockedEnemyAvatars || []).map((url, idx) => (
                      <div 
                        key={`enemy-avatar-${idx}`}
                        onClick={() => handleEquip(url)}
                        style={{ 
                            width: '60px', height: '75px', cursor: 'pointer', borderRadius: '8px', position: 'relative',
                            border: user.equippedAvatar === url ? '3px solid var(--accent-gold)' : '2px solid rgba(239, 68, 68, 0.4)',
                            boxShadow: user.equippedAvatar === url ? '0 0 10px rgba(212,175,55,0.5)' : '0 0 6px rgba(239, 68, 68, 0.2)',
                            background: `url(${baseUrl}${url}) center/cover`
                        }}
                        title="Avatar de Enemigo"
                      >
                        <span style={{ position: 'absolute', top: '-6px', right: '-6px', fontSize: '14px' }}>🏆</span>
                      </div>
                   ))}
               </div>
            </div>
          )}

          <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {!showConfirmDelete ? (
              <button 
                className="btn-danger-outline" 
                onClick={() => setShowConfirmDelete(true)}
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.8rem', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
              >
                ELIMINAR MI CUENTA
              </button>
            ) : (
              <div style={{ textAlign: 'center', background: 'rgba(239,68,68,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.1)' }}>
                <p style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.8rem', marginBottom: '1rem' }}>
                  ¿ESTÁS SEGURO? ESTA ACCIÓN ES PERMANENTE.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="arcade-btn small-btn red-btn" onClick={handleDeleteAccount} disabled={isDeleting} style={{ flex: 1 }}>
                    {isDeleting ? 'ELIMINANDO...' : 'SÍ, BORRAR'}
                  </button>
                  <button className="arcade-btn small-btn black-btn" onClick={() => setShowConfirmDelete(false)} style={{ flex: 1 }}>
                    CANCELAR
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', opacity: 0.5 }}>
          <p style={{ fontSize: '0.55rem', letterSpacing: '2px', fontWeight: 800 }}>GAME BY</p>
          <img src={logoG} alt="Designer Logo" style={{ width: '30px', height: 'auto', filter: 'grayscale(1) brightness(2)' }} />
          <p style={{ fontSize: '0.6rem', marginTop: '0.4rem' }}>
            VERSIÓN 1.2.1 • MADE BY AGENTS
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SettingsModal;
