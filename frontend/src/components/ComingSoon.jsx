import React from 'react';
import { Play } from 'lucide-react';

function ComingSoon({ tab }) {
  return (
    <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <Play size={64} className="gradient-text" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
      <h2 style={{ textTransform: 'capitalize' }}>Módulo {tab}</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Esta funcionalidad estará disponible en futuras actualizaciones del reino.</p>
    </div>
  );
}

export default ComingSoon;
