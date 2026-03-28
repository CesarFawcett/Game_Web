import React from 'react';

const PhaseIndicator = ({ phase }) => {
  return (
    <div className="phase-indicator-bar" style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 900 }}>
      {['MAIN 1', 'BATTLE', 'MAIN 2', 'END'].map(p => (
        <div key={p} className={`phase-badge ${phase === p ? 'active' : ''}`} style={{
          padding: '10px', background: phase === p ? 'var(--accent-gold)' : 'rgba(0,0,0,0.6)',
          color: phase === p ? '#000' : '#888', fontWeight: 'bold', border: phase === p ? '2px solid white' : '1px solid #444',
          borderRadius: '4px', textAlign: 'center', fontSize: '0.8rem', boxShadow: phase === p ? '0 0 15px var(--accent-gold)' : 'none'
        }}>
          {p}
        </div>
      ))}
    </div>
  );
};

export default PhaseIndicator;
