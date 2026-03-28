import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Package, Trophy, Coins } from 'lucide-react';
import useStore from '../../store';

const MissionsModal = ({ onClose, baseUrl }) => {
  const { user, missions, claimMission, claimChest, fetchMissions } = useStore();

  const handleClaimMission = async (id) => {
    const res = await claimMission(user.name, id, baseUrl);
    if (res.success) {
      alert("¡Recompensa reclamada!");
    } else {
      alert(res.error || "Error al reclamar");
    }
  };

  const handleClaimChest = async (milestone) => {
    const res = await claimChest(user.name, milestone, baseUrl);
    if (res.success) {
      let cardsMsg = res.rewardCards.length > 0 ? ` y ${res.rewardCards.length} cartas` : "";
      alert(`¡Cofre abierto! Ganaste créditos${cardsMsg}.`);
    } else {
      alert(res.error || "Error al abrir cofre");
    }
  };

  const weeklyMilestones = [5, 7, 9];
  const maxPoints = 21;
  const progressPercent = Math.min((missions.weeklyPoints / 9) * 100, 100);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.9 }}
        className="glass-panel modal-content missions-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '600px', width: '90%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Trophy className="text-gold" />
            <h2>Misiones y Recompensas</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="mission-section">
          <h3>Misiones Diarias (Historia)</h3>
          <div className="mission-list">
            {(missions.missions || []).map(m => {
              const isCompleted = missions.dailyWins >= m.goal;
              const isClaimed = missions.claimedMissions.includes(m.id);
              
              return (
                <div key={m.id} className={`mission-item glass-panel ${isClaimed ? 'claimed' : ''}`}>
                  <div className="mission-info">
                    <h4>{m.name}</h4>
                    <p>Gana {m.goal} veces en modo historia ({missions.dailyWins}/{m.goal})</p>
                    <div className="mission-prizes">
                      <span><Coins size={14} /> {m.prize}</span>
                      <span>•</span>
                      <span>+1 Punto Semanal</span>
                    </div>
                  </div>
                  <div className="mission-action">
                    {isClaimed ? (
                      <span className="text-success"><CheckCircle size={20} /></span>
                    ) : (
                      <button 
                        className={`btn-primary ${!isCompleted ? 'disabled' : ''}`}
                        onClick={() => isCompleted && handleClaimMission(m.id)}
                        disabled={!isCompleted}
                      >
                        Reclamar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="weekly-section">
          <h3>Progreso Semanal: {missions.weeklyPoints} Puntos</h3>
          <div className="progress-container">
            <div className="progress-bar">
              <motion.div 
                className="progress-fill" 
                initial={{ width: 0 }} 
                animate={{ width: `${progressPercent}%` }}
              />
              {weeklyMilestones.map(m => (
                <div 
                  key={m} 
                  className={`milestone-marker ${missions.weeklyPoints >= m ? 'active' : ''}`}
                  style={{ left: `${(m / 9) * 100}%` }}
                >
                  <div className="marker-poker">
                    <Package size={20} className={missions.claimedChests.includes(m) ? 'claimed' : ''} />
                    <span className="milestone-label">{m} pts</span>
                  </div>
                  {missions.weeklyPoints >= m && !missions.claimedChests.includes(m) && (
                    <button className="claim-chest-btn" onClick={() => handleClaimChest(m)}>Abrir</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MissionsModal;
