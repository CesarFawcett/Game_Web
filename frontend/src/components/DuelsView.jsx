import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Swords, X, Timer } from 'lucide-react';
import useStore from '../store';
import useMatchStore from '../store/useMatchStore';
import { socket } from '../utils/socket';

const DuelsView = () => {
    const { user, cards, deck, refreshUserData } = useStore();
    const { initPvPGame } = useMatchStore();
    const [searching, setSearching] = useState(false);
    const [searchTime, setSearchTime] = useState(0);

    useEffect(() => {
        socket.connect();

        socket.on('match_found', (data) => {
            // Pull LATEST state from the main store to avoid stale closure issues
            const { user: latestUser, cards: latestCards, deck: latestDeck } = useStore.getState();
            
            setSearching(false);
            const isLocalP1 = data.opponent.p1.name === (latestUser.username || latestUser.name);
            const opponent = isLocalP1 ? data.opponent.p2 : data.opponent.p1;
            const myBet = isLocalP1 ? data.opponent.p1.bet : data.opponent.p2.bet;
            const opponentBet = isLocalP1 ? data.opponent.p2.bet : data.opponent.p1.bet;
            const myRole = isLocalP1 ? 'player1' : 'player2';

            console.log(`[DuelsView] Match found! Room: ${data.roomID}, Role: ${myRole}`);

            // Initialize PvP Game
            initPvPGame(
                latestUser, 
                opponent, 
                latestDeck, 
                latestCards, 
                data.roomID,
                myBet,
                opponentBet,
                myRole
            );
        });

        socket.on('error', (msg) => {
            alert(msg);
            setSearching(false);
        });

        return () => {
            socket.off('match_found');
            socket.off('error');
            socket.disconnect();
        };
    }, [user, deck, cards]);

    useEffect(() => {
        let timer;
        if (searching) {
            timer = setInterval(() => setSearchTime(t => t + 1), 1000);
        } else {
            setSearchTime(0);
        }
        return () => clearInterval(timer);
    }, [searching]);

    const toggleSearch = () => {
        if (!searching) {
            if (deck.length < 10) {
                alert("Debes tener al menos 10 cartas en tu mazo para entrar en Duelos de alto riesgo.");
                return;
            }
            const joinData = {
                ...user,
                username: user?.username || user?.name
            };
            console.log("[DuelsView] Emitting join_queue with:", joinData);
            socket.emit('join_queue', joinData);
            setSearching(true);
        } else {
            socket.emit('leave_queue');
            setSearching(false);
        }
    };

    return (
        <div className="duels-container glass-panel" style={{ padding: '2rem', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <Swords size={64} className="text-gold" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 10px var(--accent-gold))' }} />
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>ARENA DE DUELOS</h1>
                <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 2rem' }}>
                    Aquí te enfrentarás a otros duelistas en tiempo real. ¡Cuidado! Estás apostando cartas de tu mazo con probabilidades de rareza.
                </p>

                <AnimatePresence mode="wait">
                    {!searching ? (
                        <motion.button
                            key="start-btn"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="arcade-btn"
                            onClick={toggleSearch}
                            disabled={!cards || cards.length === 0 || !deck || deck.length === 0}
                            style={{ padding: '1.2rem 3rem', fontSize: '1.2rem', opacity: (!cards || cards.length === 0 || !deck || deck.length === 0) ? 0.5 : 1 }}
                        >
                            {(!cards || cards.length === 0 || !deck || deck.length === 0) ? "CARGANDO DATOS..." : "BUSCAR OPONENTE"}
                        </motion.button>
                    ) : (
                        <motion.div
                            key="searching-ui"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}
                        >
                            <div className="searching-pulse">
                                <div className="pulse-ring"></div>
                                <Search size={48} className="text-gold" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-gold)' }}>BUSCANDO CONTRINCANTE...</h2>
                                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    <Timer size={16} /> Tiempo en espera: {searchTime}s
                                </p>
                            </div>
                            <button className="btn-secondary" onClick={toggleSearch} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                                <X size={18} /> CANCELAR BÚSQUEDA
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <style>{`
                .searching-pulse {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .pulse-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border: 4px solid var(--accent-gold);
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(0.8); opacity: 0.8; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default DuelsView;
