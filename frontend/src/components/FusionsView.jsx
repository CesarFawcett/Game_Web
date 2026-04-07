import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Info, Unlock, Settings } from 'lucide-react';

function FusionsView() {
  return (
    <div className="fusions-container" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>CÁMARA DE FUSIÓN</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Combina el poder de tus cartas duplicadas para crear deidades cósmicas.</p>
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
          border: '1px outset rgba(212, 175, 55, 0.5)',
          boxShadow: '0 0 40px rgba(212, 175, 55, 0.1), inset 0 0 20px rgba(212, 175, 55, 0.05)',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.05) 0%, transparent 60%)', pointerEvents: 'none' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: '2rem' }}>
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ position: 'absolute', opacity: 0.2 }}
          >
            <Settings size={120} color="var(--accent-gold)" />
          </motion.div>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)', 
            padding: '1.5rem', 
            borderRadius: '50%',
            border: '2px solid rgba(212,175,55,0.4)',
            backdropFilter: 'blur(10px)',
            zIndex: 2
          }}>
            <Zap size={60} color="var(--accent-gold)" style={{ filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.8))' }} />
          </div>
        </div>

        <h3 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '3px' }}>
          MÓDULO EN CONSTRUCCIÓN
        </h3>
        
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'inline-block', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', textAlign: 'left' }}>
            <Info className="text-primary" size={24} style={{ marginTop: '0.2rem' }} />
            <div>
              <h4 style={{ fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>¿En qué consiste?</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: '450px' }}>
                Reúne múltiples copias de una misma carta e invierte polvo cósmico para forjar una carta de rareza superior. Transforma tus cartas repetidas en reliquias imparables.
              </p>
            </div>
          </div>
        </div>

        <div>
          <button className="btn-shop-locked" style={{ padding: '1rem 3rem', cursor: 'not-allowed', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '10px' }} disabled>
            <Unlock size={18} /> PRÓXIMAMENTE
          </button>
        </div>

      </motion.div>
    </div>
  );
}

export default FusionsView;
