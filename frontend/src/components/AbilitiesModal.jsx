import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Snowflake, Skull, Swords, Heart, Shield, Info } from 'lucide-react';

const abilities = [
  { 
    name: 'Fuego', 
    icon: <Flame className="text-orange-500" />, 
    desc: 'Inflige un 50% de daño adicional al atacar. El calor abrasador reduce la moral del enemigo.',
    color: '#f97316'
  },
  { 
    name: 'Hielo', 
    icon: <Snowflake className="text-blue-400" />, 
    desc: 'Congela al oponente. La carta enemiga no podrá atacar ni activar efectos durante su próximo turno.',
    color: '#38bdf8'
  },
  { 
    name: 'Veneno', 
    icon: <Skull className="text-green-500" />, 
    desc: 'Envenena al rival. El héroe enemigo pierde una cantidad fija de HP al final de cada turno suyo.',
    color: '#22c55e'
  },
  { 
    name: 'Daño Perforante', 
    icon: <Swords className="text-yellow-500" />, 
    desc: 'Ignora la defensa enemiga. Si el ataque es mayor que la defensa, el daño restante va directo al HP del héroe.',
    color: '#eab308'
  },
  { 
    name: 'Robo de Vida', 
    icon: <Heart className="text-red-500" />, 
    desc: 'Sana a tu héroe. Recuperas una porción del daño infligido a la carta o al héroe enemigo como vida propia.',
    color: '#ef4444'
  },
  { 
    name: 'Escudo', 
    icon: <Shield className="text-blue-600" />, 
    desc: 'Protección divina. La carta ignora el primer ataque que reciba sin perder vida.',
    color: '#2563eb'
  },
  { 
    name: 'Putrefacción', 
    icon: <Info className="text-emerald-600" />, 
    desc: 'Efecto corrosivo. Reduce el ATK y DEF de la carta enemiga gradualmente en cada turno.',
    color: '#059669'
  }
];

const AbilitiesModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="modal-overlay" style={{ zIndex: 5000 }} onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="glass-panel" 
            style={{ width: '90%', maxWidth: '600px', padding: '2rem', position: 'relative', background: 'rgba(10, 15, 28, 0.98)' }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={onClose} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
                <Info size={40} className="text-gold" />
              </div>
              <h2 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 900 }}>MANUAL DE HABILIDADES</h2>
              <p style={{ color: 'var(--text-muted)' }}>Entiende los efectos especiales de tus cartas para dominar el duelo.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {abilities.map((ability, idx) => (
                <div key={idx} className="glass-panel" style={{ display: 'flex', gap: '1.5rem', padding: '1.2rem', alignItems: 'center', border: `1px solid ${ability.color}44` }}>
                  <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center' }}>{ability.icon}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: ability.color, fontWeight: 900, fontSize: '1.1rem', marginBottom: '0.3rem', textTransform: 'uppercase' }}>{ability.name}</h3>
                    <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: '1.4' }}>{ability.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-epic-cta" style={{ marginTop: '2rem', width: '100%' }} onClick={onClose}> ENTENDIDO </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AbilitiesModal;
