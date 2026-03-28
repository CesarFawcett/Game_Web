import React from 'react';
import { motion } from 'framer-motion';

function TabItem({ id, label, active, setActive, icon, disabled, badge }) {
  return (
    <button
      className={`nav-item ${active === id ? 'active' : ''}`}
      onClick={() => !disabled && setActive(id)}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer' }}
    >
      {icon} {label}
      {badge > 0 && (
        <motion.span
          key={badge}
          initial={{ scale: 1.5, bg: '#fff' }}
          animate={{ scale: 1, bg: 'rgba(255,255,255,0.2)' }}
          style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', marginLeft: '5px' }}
        >
          {badge}
        </motion.span>
      )}
      {disabled && <span className="coming-soon-badge">Próximamente</span>}
    </button>
  );
}

export default TabItem;
