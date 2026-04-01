import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import logoG from '../utils/img/IconoG.png';

function Login({ onLogin, shopUrl }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // LOAD REMEMBERED DATA
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isRegister ? 'register' : 'login';
      const payload = isRegister ? { username, email, password } : { username, password };

      const res = await axios.post(`${shopUrl}/${endpoint}`, payload);

      if (res.data.success) {
        // SAVE OR CLEAR FROM LOCALSTORAGE
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username);
          localStorage.setItem('rememberedPassword', password);
        } else {
          localStorage.removeItem('rememberedUsername');
          localStorage.removeItem('rememberedPassword');
        }

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
    <div className="arcade-container full-bg">
      <div className="arcade-overlay dark-cinematic"></div>
      <div className="scanline"></div>

      <motion.div
        className="login-pedestal"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: "circOut" }}
      >
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h1 className="main-logo-text">CARD BATTLE UNIVERSE</h1>
        </div>

        <div className="login-dual-zone">
          <div className="zone-indicator light">LIGHT ZONE</div>
          <div className="zone-indicator dark">DARK ZONE</div>
          
          <form className="login-core-form" onSubmit={handleSubmit}>
            <div className="input-hex-container">
              <div className="input-wrapper">
                <label className="hex-label">NOMBRE DE DUELISTA</label>
                <input 
                  type="text" 
                  placeholder="USERNAME" 
                  className="hex-input" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                />
              </div>

              {isRegister && (
                <div className="input-wrapper">
                  <label className="hex-label">CORREO ELECTRÓNICO</label>
                  <input 
                    type="email" 
                    placeholder="EMAIL" 
                    className="hex-input" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              )}

              <div className="input-wrapper">
                <label className="hex-label">CÓDIGO SECRETO</label>
                <input 
                  type="password" 
                  placeholder="PASSWORD" 
                  className="hex-input" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
              </div>

              {/* REMEMBER ME BUTTON */}
              {!isRegister && (
                <div className="remember-row" onClick={() => setRememberMe(!rememberMe)}>
                   <div className={`hex-checkbox ${rememberMe ? 'checked' : ''}`}></div>
                   <span>RECORDAR CUENTA</span>
                </div>
              )}
            </div>

            {error && <p className="login-error-msg">{error.toUpperCase()}</p>}

            <button type="submit" className="hex-btn-main" disabled={loading}>
              <div className="btn-inner">
                {loading ? 'PROCESANDO...' : 'INGRESAR A LA BATALLA'}
              </div>
            </button>
          </form>
        </div>

        <div className="login-switch-option">
          <span>{isRegister ? '¿YA TIENES CUENTA?' : '¿ERES NUEVO DUELISTA?'}</span>
          <button 
            type="button"
            className="switch-btn"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
          >
            {isRegister ? 'INICIA SESIÓN' : 'REGÍSTRATE AQUÍ'}
          </button>
        </div>

        <div className="designer-footer">
          <span className="designer-label">DISEÑADO POR</span>
          <img src={logoG} alt="Designer Logo" className="designer-icon" />
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
