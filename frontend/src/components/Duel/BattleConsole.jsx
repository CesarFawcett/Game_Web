import React, { useState } from 'react';
import { Volume2, VolumeX, FastForward, X } from 'lucide-react';
import useMatchStore from '../../store/useMatchStore';
import { toggleMute, getMuteStatus } from '../../utils/sound';

const BattleConsole = ({ onExit }) => {
  const store = useMatchStore();
  const [muted, setMuted] = useState(getMuteStatus());

  const handleMute = () => { setMuted(toggleMute()); };
  const isMyTurn = store.turn === store.myRole;

  const getLogClass = (m) => {
    let classes = '';
    const low = m.toLowerCase();
    if (low.includes('daño') || low.includes('destruida') || low.includes('derrota')) classes = 'text-red-400 font-bold';
    else if (low.includes('victoria') || low.includes('sanar')) classes = 'text-green-400 font-bold';
    else if (low.includes('equipas') || low.includes('trampa')) classes = 'text-blue-300';
    return classes;
  };

  return (
    <div className="battle-console-mockup" style={{ zIndex: 100 }}>
      <div className="log-entries" style={{ padding: '0 15px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span className={getLogClass(store.log[0] || '')} style={{ fontWeight: 'bold', color: '#cbd5e1' }}>
            {store.log[0] || ''}
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button className="icon-btn purple" onClick={handleMute}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {store.selectedAttackerIdx !== null ? (
          <button className="pill-btn purple" onClick={() => store.setSetter('selectedAttackerIdx', null)}>
            CANCELAR
          </button>
        ) : (
          <button 
            className="pill-btn purple" 
            onClick={() => { if(isMyTurn && !store.winner && store.phase !== 'END' && !store.isProcessing) store.advancePhase() }} 
            disabled={!isMyTurn || store.winner || store.phase === 'END' || store.isProcessing}
          >
            <FastForward size={16} />
            {store.phase === 'MAIN 1' && store.turnCount === 1 && store.turn === 'player1' ? 'TERMINAR' : store.phase === 'MAIN 1' ? 'IR A BATALLA' : store.phase === 'BATTLE' ? 'MAIN 2' : 'TERMINAR'}
          </button>
        )}
        
        {store.isPvP && !store.winner && (
          <button 
            className="pill-btn danger" 
            onClick={() => store.surrender()}
            style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}
          >
            RENDIRSE
          </button>
        )}
        
        <button className="icon-btn purple" onClick={onExit}><X size={16} /></button>
      </div>
    </div>
  );
};

export default BattleConsole;
