import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

function SortButton({ label, up, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '5px', 
        background: active ? 'var(--primary)' : 'transparent',
        border: 'none',
        color: active ? 'white' : 'var(--text-muted)',
        padding: '5px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.7rem',
        fontWeight: 900,
        transition: 'all 0.3s'
      }}
    >
      {label} {active && (up ? <TrendingUp size={14}/> : <TrendingDown size={14}/>)}
    </button>
  );
}

export default SortButton;
