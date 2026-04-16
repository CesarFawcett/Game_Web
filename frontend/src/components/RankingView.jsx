import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Timer, CheckCircle, Gift, Flame, TrendingUp } from 'lucide-react';
import axios from 'axios';

function RankingView({ user, setUser, baseUrl }) {
    const [topPlayers, setTopPlayers] = useState([]);
    const [seasonDay, setSeasonDay] = useState(1);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [userRank, setUserRank] = useState(0);

    const fetchRanking = async () => {
        try {
            const res = await axios.get(`${baseUrl}/api/ranking/top`);
            setTopPlayers(res.data.topPlayers);
            setSeasonDay(res.data.day);
            
            // Optionally find user rank
            const idx = res.data.topPlayers.findIndex(p => p.username === user.username);
            if (idx !== -1) setUserRank(idx + 1);
        } catch (err) {
            console.error("Error fetching ranking:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRanking();
    }, [baseUrl, user.username]);

    const handleClaimDaily = async () => {
        if (claiming || seasonDay < 4) return;
        setClaiming(true);
        try {
            const res = await axios.post(`${baseUrl}/api/ranking/claim-daily`, { username: user.username });
            if (res.data.success) {
                alert(`¡Felicidades! Has reclamado ${res.data.reward} créditos por tu posición #${res.data.rank}.`);
                setUser({ ...user, credits: res.data.newCredits, lastRankingRewardClaimed: new Date() });
            }
        } catch (err) {
            alert(err.response?.data?.error || "Error al reclamar el premio.");
        } finally {
            setClaiming(false);
        }
    };

    const handleClaimStreak = async () => {
        if (claiming || user.connectionStreak < 5 || user.connectionStreak % 5 !== 0) return;
        setClaiming(true);
        try {
            const res = await axios.post(`${baseUrl}/api/ranking/claim-streak`, { username: user.username });
            if (res.data.success) {
                alert(`¡Excelente racha! Has recibido un Sobre Antigüedad gratuito. Las cartas se han añadido a tu inventario.`);
                // Refresh user data is handled by the calling component or we update local state
                // Since this is RankingView, we might need a full refresh or just update streak claim date
                setUser({ ...user, lastStreakRewardClaimedAt: new Date() });
            }
        } catch (err) {
            alert(err.response?.data?.error || "Error al reclamar el sobre.");
        } finally {
            setClaiming(false);
        }
    };

    const getPrizeForRank = (rank) => {
        if (rank === 1) return 2000;
        if (rank === 2) return 1200;
        if (rank === 3) return 600;
        if (rank >= 4 && rank <= 10) return 250;
        return 50;
    };

    const canClaimDaily = (!user.lastRankingRewardClaimed || new Date(user.lastRankingRewardClaimed).toDateString() !== new Date().toDateString());
    const canClaimStreak = (user.connectionStreak % 5 === 0) && (!user.lastStreakRewardClaimedAt || new Date(user.lastStreakRewardClaimedAt).toDateString() !== new Date().toDateString());

    return (
        <div className="ranking-container">
            <div className="ranking-header">
                <div>
                    <h2 className="gradient-text" style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Trophy size={32} className="text-gold" /> SALÓN DE LA FAMA
                    </h2>
                    <p className="text-muted">Asciende en el ranking ganando duelos PvP.</p>
                </div>
                
                <div className="season-timer-box glass-panel">
                    <Timer size={20} className="text-gold" />
                    <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.6 }}>TEMPORADA - DÍA</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 900 }}>{seasonDay} / 30</p>
                    </div>
                </div>
            </div>

            <div className="ranking-grid">
                {/* Board Section */}
                <div className="leaderboard-section glass-panel">
                    <div className="leaderboard-header">
                        <span>#</span>
                        <span>DUELISTA</span>
                        <span style={{ textAlign: 'right' }}>PUNTOS</span>
                    </div>

                    <div className="leaderboard-list scrollbar">
                        {loading ? (
                            <div className="loading-spinner">Cargando ranking...</div>
                        ) : (
                            topPlayers.map((player, idx) => (
                                <motion.div 
                                    key={player.username}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`leaderboard-item ${player.username === user.username ? 'me' : ''}`}
                                >
                                    <span className={`rank rank-${idx + 1}`}>{idx + 1}</span>
                                    <div className="player-info">
                                        <img src={`${player.equippedAvatar && typeof player.equippedAvatar === 'string' && player.equippedAvatar.startsWith('http') ? '' : baseUrl}${player.equippedAvatar || '/default.png'}`} alt="avatar" />
                                        <span className="username">{player.username}</span>
                                    </div>
                                    <span className="points">{player.rankingPoints} pts</span>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Rewards Section */}
                <div className="rewards-section">
                    <div className="reward-card glass-panel" style={{ marginBottom: '1.5rem' }}>
                        <div className="reward-icon-box">
                            <Flame size={40} className="text-orange" />
                            <div className="streak-badge">{user.connectionStreak} DÍAS</div>
                        </div>
                        <div className="reward-content">
                            <h3>RACHA DE CONEXIÓN</h3>
                            <p>¡Conéctate 5 días seguidos para ganar un sobre Antigüedad!</p>
                            
                            <div className="streak-progress">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`streak-dot ${i <= (user.connectionStreak % 5 === 0 ? 5 : user.connectionStreak % 5) ? 'active' : ''}`} />
                                ))}
                            </div>

                            <button 
                                className={`claim-btn ${canClaimStreak ? 'active' : 'disabled'}`}
                                onClick={handleClaimStreak}
                                disabled={!canClaimStreak || claiming}
                            >
                                {canClaimStreak ? <Gift size={18} /> : <CheckCircle size={18} />}
                                {canClaimStreak ? 'RECLAMAR SOBRE' : 'RECLAMADO'}
                            </button>
                        </div>
                    </div>

                    <div className="reward-card glass-panel">
                        <div className="reward-icon-box">
                            <Award size={40} className="text-gold" />
                        </div>
                        <div className="reward-content">
                            <h3>PREMIO DIARIO DE TEMPORADA</h3>
                            <p>Basado en tu posición actual en el ranking.</p>
                            
                            <div className="points-info">
                                <TrendingUp size={16} className="text-gold" />
                                <span>Premio estimado: <b>{getPrizeForRank(userRank || (topPlayers.length + 1))}</b> créditos</span>
                            </div>

                            <button 
                                className={`claim-btn ${canClaimDaily ? 'active' : 'disabled'}`}
                                onClick={handleClaimDaily}
                                disabled={!canClaimDaily || claiming}
                            >
                                {canClaimDaily ? <Gift size={18} /> : <CheckCircle size={18} />}
                                {canClaimDaily ? 'RECLAMAR CRÉDITOS' : 'YA RECLAMADO'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .ranking-container { padding: 1rem; }
                .ranking-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .season-timer-box { display: flex; align-items: center; gap: 15px; padding: 1rem 2rem; border-radius: 15px; }
                .ranking-grid { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; align-items: start; }
                
                .leaderboard-section { padding: 0; min-height: 500px; display: flex; flex-direction: column; }
                .leaderboard-header { display: grid; grid-template-columns: 50px 1fr 100px; padding: 1rem 2rem; background: rgba(255,255,255,0.05); font-weight: 800; font-size: 0.7rem; color: var(--text-muted); }
                .leaderboard-item { display: grid; grid-template-columns: 50px 1fr 100px; padding: 1rem 2rem; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.3s; }
                .leaderboard-item.me { background: rgba(99, 102, 241, 0.1); border-left: 4px solid var(--primary); }
                
                .rank { font-weight: 900; font-size: 1rem; color: var(--text-muted); }
                .rank-1 { color: #facc15; font-size: 1.4rem; }
                .rank-2 { color: #94a3b8; font-size: 1.2rem; }
                .rank-3 { color: #b45309; font-size: 1.1rem; }
                
                .player-info { display: flex; align-items: center; gap: 12px; }
                .player-info img { width: 35px; height: 35px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1); }
                .username { font-weight: 700; }
                .points { text-align: right; font-weight: 900; color: var(--primary); }

                .reward-card { display: flex; gap: 20px; padding: 1.5rem; }
                .reward-icon-box { position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px; }
                .streak-badge { background: #f97316; color: white; font-size: 0.6rem; font-weight: 900; padding: 4px 8px; border-radius: 10px; }
                
                .reward-content h3 { font-size: 0.8rem; font-weight: 900; letter-spacing: 1px; margin-bottom: 0.5rem; }
                .reward-content p { font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 1rem; }
                
                .streak-progress { display: flex; gap: 6px; margin-bottom: 1.5rem; }
                .streak-dot { width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.1); }
                .streak-dot.active { background: #f97316; box-shadow: 0 0 10px #f97316; }
                
                .claim-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 0.8rem; border-radius: 10px; border: none; font-weight: 800; text-transform: uppercase; cursor: pointer; transition: all 0.3s; }
                .claim-btn.active { background: var(--primary); color: white; }
                .claim-btn.active:hover { transform: translateY(-3px); box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.5); }
                .claim-btn.disabled { background: rgba(255,255,255,0.05); color: var(--text-muted); cursor: not-allowed; }
                
                .points-info { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; background: rgba(250, 204, 21, 0.05); padding: 8px; border-radius: 6px; margin-bottom: 1rem; }
                .day-lock { display: flex; align-items: center; justify-content: center; gap: 8px; color: #ef4444; font-size: 0.7rem; font-weight: 800; padding: 0.8rem; border: 1px dashed rgba(239, 68, 68, 0.3); border-radius: 10px; }
                
                .text-gold { color: #facc15; }
                .text-orange { color: #f97316; }

                @media (max-width: 900px) {
                    .ranking-grid { grid-template-columns: 1fr; }
                    .rewards-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
                    .reward-card { margin-bottom: 0 !important; }
                }

                @media (max-width: 600px) {
                    .ranking-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .season-timer-box { width: 100%; justify-content: center; }
                    .leaderboard-header, .leaderboard-item { grid-template-columns: 40px 1fr 80px; padding: 1rem; }
                    .player-info { gap: 8px; }
                    .player-info img { width: 28px; height: 28px; }
                    .username { font-size: 0.85rem; }
                    .points { font-size: 0.85rem; }
                    .reward-card { flex-direction: column; align-items: center; text-align: center; }
                    .reward-icon-box { margin-bottom: 0.5rem; }
                    .streak-progress { justify-content: center; }
                    .rewards-section { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
}

export default RankingView;
