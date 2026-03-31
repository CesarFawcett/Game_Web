import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import logoG from '../utils/img/IconoG.png';

function Login({ onLogin, shopUrl }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isRegister ? 'register' : 'login';
      const payload = isRegister ? { username, email, password } : { username, password };
      
      const res = await axios.post(`${shopUrl}/${endpoint}`, payload);
      
      if (res.data.success) {
        const userData = {
          name: res.data.user.username,
          role: res.data.user.role,
          credits: res.data.user.credits || 2500,
          inventory: res.data.user.inventory || [],
          discoveredCards: res.data.user.discoveredCards || [],
          deck: res.data.user.deck || [],
          ownedAvatars: res.data.user.ownedAvatars || [],
          equippedAvatar: res.data.user.equippedAvatar || '/default.png',
          ownedBoards: res.data.user.ownedBoards || [],
          equippedBoard: res.data.user.equippedBoard || '',
          unlockedEnemyAvatars: res.data.user.unlockedEnemyAvatars || [],
          defeatedEnemies: res.data.user.defeatedEnemies || [],
          seenOnboarding: res.data.user.seenOnboarding || []
        };
        // Add a temporary flag if it's a new registration to trigger the specific redirect
        if (isRegister) {
          userData.justRegistered = true;
        }
        onLogin(userData);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || (isRegister ? 'ERROR EN EL REGISTRO' : 'ACCESO DENEGADO - VERIFICA TUS CREDENCIALES'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="arcade-container">
      <div className="arcade-overlay"></div>
      <div className="scanline"></div>

      <motion.div
        className="arcade-card"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="arcade-title">CARD BATTLE</h2>
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', margin: '1rem 0' }}></div>
          <p style={{ color: 'var(--text-muted)', letterSpacing: '3px', fontSize: '0.8rem', fontWeight: 600 }}>
            {isRegister ? 'JOIN THE MULTIVERSE' : 'ENTER THE MULTIVERSE'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem', marginBottom: '0.5rem', display: 'block', fontWeight: 800 }}>
              {isRegister ? 'NOMBRE DEL PERSONAJE' : 'NOMBRE DE DUELISTA'}
            </label>
            <input type="text" placeholder="Tu nombre de usuario" className="neon-input" value={username} onChange={e => setUsername(e.target.value)} required />
            
            {isRegister && (
              <>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem', display: 'block', fontWeight: 800 }}>CORREO ELECTRÓNICO</label>
                <input type="email" placeholder="duelista@multiverso.com" className="neon-input" value={email} onChange={e => setEmail(e.target.value)} required />
              </>
            )}

            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem', display: 'block', fontWeight: 800 }}>CÓDIGO SECRETO</label>
            <input type="password" placeholder="••••••••" className="neon-input" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 700 }}>{error.toUpperCase()}</p>}

          <button type="submit" className="arcade-btn" disabled={loading}>
            {loading ? 'PROCESANDO...' : (isRegister ? 'CREAR CUENTA' : 'INICIAR SESIÓN')}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta?'}
          <span 
            onClick={() => { setIsRegister(!isRegister); setError(''); }} 
            style={{ color: 'var(--primary)', cursor: 'pointer', marginLeft: '0.5rem', fontWeight: 800, textDecoration: 'underline' }}
          >
            {isRegister ? 'Inicia Sesión' : 'Regístrate aquí'}
          </span>
        </p>

        {!isRegister && (
          <div style={{ marginTop: '2rem', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ACCESO RÁPIDO</p>
            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>
              Duelo / 123 • Admin / 123
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', fontWeight: 800 }}>DISEÑADO POR</p>
          <img src={logoG} alt="Designer Logo" style={{ width: '40px', height: 'auto', filter: 'drop-shadow(0 0 5px var(--primary))' }} />
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
