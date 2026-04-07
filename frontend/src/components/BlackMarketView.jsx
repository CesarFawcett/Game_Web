import React from 'react';
import { motion } from 'framer-motion';
import { EyeOff, AlertTriangle, Lock, ShieldAlert } from 'lucide-react';

function BlackMarketView() {
  return (
    <div className="market-container" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '0.5rem', backgroundImage: 'linear-gradient(45deg, #ef4444, #7f1d1d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          MERCADO NEGRO
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Contactando con los sindicatos del bajo mundo...</p>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ duration: 0.5, type: 'spring' }}
        className="glass-panel" 
        style={{ 
          maxWidth: '700px', 
          width: '100%', 
          padding: '4rem 2rem', 
          textAlign: 'center', 
          position: 'relative',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(0, 0, 0, 0.95))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(239, 68, 68, 0.05)',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.1) 0%, transparent 60%)', pointerEvents: 'none' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: '2rem' }}>
          <motion.div 
            animate={{ opacity: [0.2, 0.6, 0.2] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: 'absolute' }}
          >
            <ShieldAlert size={120} color="#7f1d1d" />
          </motion.div>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)', 
            padding: '1.5rem', 
            borderRadius: '50%',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            backdropFilter: 'blur(10px)',
            zIndex: 2
          }}>
            <EyeOff size={60} color="#ef4444" style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))' }} />
          </div>
        </div>

        <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '3px', color: '#fca5a5' }}>
          MÓDULO RESTRINGIDO
        </h3>
        
        <div style={{ background: 'rgba(0,0,0,0.6)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', display: 'inline-block', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', textAlign: 'left' }}>
            <AlertTriangle className="text-red-500" size={24} style={{ marginTop: '0.2rem', color: '#ef4444' }} />
            <div>
              <h4 style={{ fontWeight: 800, margin: '0 0 0.5rem', color: '#f87171' }}>Desencantar y Sobrevivir</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: '450px' }}>
                Aquí podrás quemar tus cartas repetidas para obtener materiales clandestinos y comprar ofertas rotativas que las tiendas oficiales no se atreven a vender.
              </p>
            </div>
          </div>
        </div>

        <div>
          <button className="btn-shop-locked" style={{ padding: '1rem 3rem', cursor: 'not-allowed', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '10px', filter: 'grayscale(100%)' }} disabled>
            <Lock size={18} /> PRÓXIMAMENTE
          </button>
        </div>

      </motion.div>
    </div>
  );
}

export default BlackMarketView;
