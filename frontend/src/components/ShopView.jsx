import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Plus, Shield, ShoppingBag, Check, Lock, Gift, Trophy, Eye, X } from 'lucide-react';
import CardItem from './CardItem';
import { playSound } from '../utils/sound';

function ShopView({ user, setUser, cards, onUpdate, baseUrl, isOnboarding }) {
  const [packs, setPacks] = useState([]);
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openingPackId, setOpeningPackId] = useState(null);
  const [avatars, setAvatars] = useState([]);
  const [shopBoards, setShopBoards] = useState([]);
  const [previewPack, setPreviewPack] = useState(null);

  React.useEffect(() => {
    fetchPacks();
    fetchAvatars();
    fetchShopBoards();
  }, []);

  const fetchPacks = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/shop/packs`);
      setPacks(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchAvatars = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/shop/avatars`);
      setAvatars(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchShopBoards = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/shop/boards`);
      setShopBoards(res.data);
    } catch (err) { console.error(err); }
  };

  const handleClaimFreePack = async () => {
    if (!user.freePacksCount || user.freePacksCount <= 0) return;

    setLoading(true);
    setOpeningPackId('free');
    try {
      const res = await axios.post(`${baseUrl}/api/shop/claim-free-pack`, { username: user.username });
      
      if (res.data.success) {
        setIsOpening(true);
        playSound('open');
        setTimeout(() => {
          setReward(res.data.rewardCards);
          setIsOpening(false);
          setOpeningPackId(null);
          const updatedUser = { 
            ...user, 
            freePacksCount: res.data.freePacksCount,
            inventory: [...(user.inventory || []), ...res.data.rewardCards.map(c => c._id)],
            discoveredCards: [...new Set([...(user.discoveredCards || []), ...res.data.rewardCards.map(c => c._id)])]
          };
          setUser(updatedUser);
          sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
          onUpdate();
        }, 2000);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Error al reclamar el sobre");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packId, price) => {
    if (user.credits < price) {
      alert("¡No tienes suficientes créditos!");
      return;
    }

    setLoading(true);
    setOpeningPackId(packId);
    try {
      const res = await axios.post(`${baseUrl}/api/shop/purchase`, { username: user.username, packId });
      
      if (res.data.success) {
        setIsOpening(true);
        playSound('open');
        setTimeout(() => {
          setReward(res.data.rewardCards);
          setIsOpening(false);
          setOpeningPackId(null);
          const updatedUser = { 
            ...user, 
            credits: res.data.newCredits,
            inventory: [...(user.inventory || []), ...res.data.rewardCards.map(c => c._id)],
            discoveredCards: [...new Set([...(user.discoveredCards || []), ...res.data.rewardCards.map(c => c._id)])]
          };
          setUser(updatedUser);
          sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
          onUpdate();
        }, 2000);
      }
    } catch (err) {
      alert("Error al realizar la compra");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyAvatar = async (avatarId, price) => {
    if (user.credits < price) return alert("¡No tienes suficientes créditos!");
    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/api/shop/buy-avatar`, { username: user.username, avatarId });
      if (res.data.success) {
        playSound('open');
        const updatedUser = { 
          ...user, 
          credits: res.data.newCredits,
          ownedAvatars: res.data.ownedAvatars
        };
        setUser(updatedUser);
        sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
        alert("¡Avatar comprado con éxito!");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Error al comprar avatar");
    } finally {
      setLoading(false);
    }
  };

  const handleEquipAvatar = async (avatarUrl) => {
    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/api/shop/equip-avatar`, { username: user.username, avatarUrl });
      if (res.data.success) {
        const updatedUser = { ...user, equippedAvatar: res.data.equippedAvatar };
        setUser(updatedUser);
        sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
        onUpdate(); 
      }
    } catch (err) {
      alert("Error al equipar avatar");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyBoard = async (boardId, price) => {
    if (user.credits < price) return alert("¡No tienes suficientes créditos!");
    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/api/shop/buy-board`, { username: user.username, boardId });
      if (res.data.success) {
        playSound('open');
        const updatedUser = { 
          ...user, 
          credits: res.data.newCredits,
          ownedBoards: res.data.ownedBoards
        };
        setUser(updatedUser);
        sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
        alert("¡Tablero comprado con éxito!");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Error al comprar tablero");
    } finally {
      setLoading(false);
    }
  };

  const handleEquipBoard = async (board) => {
    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/api/shop/equip-board`, { 
        username: user.username, 
        boardUrl: board.imageUrl,
        fieldImageUrl: board.fieldImageUrl,
        textureUrl: board.textureUrl,
        cardBackUrl: board.cardBackUrl
      });
      if (res.data.success) {
        const updatedUser = { 
          ...user, 
          equippedBoard: res.data.equippedBoard,
          equippedFieldImage: res.data.equippedFieldImage,
          equippedTexture: res.data.equippedTexture,
          equippedCardBack: res.data.equippedCardBack
        };
        setUser(updatedUser);
        sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
        onUpdate(); 
      }
    } catch (err) {
      alert("Error al equipar tablero");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900 }}>TIENDA DE DUELISTAS</h2>
        <p style={{ color: 'var(--text-muted)' }}>Adquiere nuevos poderes para dominar el multiverso</p>
      </div>

      {user.freePacksCount > 0 && (
        <div style={{ marginBottom: '4rem', padding: '2rem', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '20px', border: '1px solid var(--accent-gold)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-gold)', marginBottom: '0.5rem', textShadow: '0 0 10px rgba(212,175,55,0.3)' }}>🎁 REGALO DE BIENVENIDA</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>¡Te quedan <strong>{user.freePacksCount}</strong> sobres gratuitos!</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
             <ChestCard 
                title="SOBRE DE INICIO"
                price={0}
                description="Contiene cartas básicas para empezar tu mazo."
                imageUrl={packs.find(p => p.packId === 1)?.imageUrl || "/uploads/default_pack.png"}
                onPurchase={handleClaimFreePack}
                onPreview={() => setPreviewPack(packs.find(p => p.packId === 1))}
                loading={loading || isOpening}
                userCredits={999999}
                isOpening={isOpening && openingPackId === 'free'}
                baseUrl={baseUrl}
             />
          </div>
        </div>
      )}

      <div className="chests-grid">
        {packs.length === 0 ? (
           <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center' }}>No hay sobres disponibles en la tienda en este momento.</p>
        ) : (isOnboarding ? packs.slice(0, 1) : packs).map(pack => (
          <ChestCard 
            key={pack._id}
            title={pack.name}
            price={pack.price}
            description={`Contiene ${pack.cardsPerPack} cartas.`}
            imageUrl={pack.imageUrl}
            onPurchase={() => handlePurchase(pack._id, pack.price)}
            onPreview={() => setPreviewPack(pack)}
            loading={loading || isOpening}
            userCredits={user.credits}
            isOpening={isOpening && openingPackId === pack._id}
            baseUrl={baseUrl}
          />
        ))}
      </div>

      {!isOnboarding && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '4rem' }}>
            <h2 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900 }}>COLECCIÓN DE AVATARES</h2>
            <p style={{ color: 'var(--text-muted)' }}>Personaliza tu perfil con avatares exclusivos</p>
          </div>

          <div className="chests-grid">
            {avatars.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center' }}>No hay avatares disponibles en la tienda en este momento.</p>
            ) : avatars.map(avatar => {
              const isOwned = user.ownedAvatars?.includes(avatar._id);
              const isEquipped = user.equippedAvatar === avatar.imageUrl;
              return (
                <AvatarCard 
                  key={avatar._id}
                  title={avatar.name}
                  price={avatar.price}
                  imageUrl={avatar.imageUrl}
                  onPurchase={() => handleBuyAvatar(avatar._id, avatar.price)}
                  onEquip={() => handleEquipAvatar(avatar.imageUrl)}
                  loading={loading}
                  userCredits={user.credits}
                  isOwned={isOwned}
                  isEquipped={isEquipped}
                  baseUrl={baseUrl}
                />
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '4rem' }}>
            <h2 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900 }}>FONDOS DE CAMPO</h2>
            <p style={{ color: 'var(--text-muted)' }}>Cambia la atmósfera de tus duelos legendarios</p>
          </div>

          <div className="chests-grid">
            {shopBoards.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center' }}>No hay tableros disponibles en la tienda en este momento.</p>
            ) : shopBoards.map(board => {
              const isOwned = user.ownedBoards?.includes(board._id);
              const isEquipped = user.equippedBoard === board.imageUrl;
              return (
                <BoardCard 
                  key={board._id}
                  title={board.name}
                  price={board.price}
                  imageUrl={board.imageUrl}
                  onPurchase={() => handleBuyBoard(board._id, board.price)}
                  onEquip={() => handleEquipBoard(board)}
                  loading={loading}
                  userCredits={user.credits}
                  isOwned={isOwned}
                  isEquipped={isEquipped}
                  baseUrl={baseUrl}
                />
              );
            })}
          </div>
        </>
      )}

      <AnimatePresence>
        {reward && (
          <motion.div className="reward-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.h2 initial={{ y: -50 }} animate={{ y: 0 }} className="gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900 }}>¡RECOMPENSA REVELADA!</motion.h2>
            <div className="reward-cards-grid">
              {reward.map((card, idx) => (
                <motion.div key={`${card._id}-${idx}`} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: idx * 0.2, type: 'spring' }}>
                  <CardItem info={card} baseUrl={baseUrl} />
                </motion.div>
              ))}
            </div>
            <button className="btn-claim-epic" onClick={() => setReward(null)}>
              <Trophy size={24} /> RECLAMAR CARTAS
            </button>
          </motion.div>
        )}

        {previewPack && (
          <motion.div className="reward-overlay preview-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewPack(null)}>
            <motion.div 
              className="pack-preview-modal glass-panel" 
              initial={{ scale: 0.9, y: 50 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2 className="gradient-text">{previewPack.name}</h2>
                  <p style={{ color: 'var(--text-muted)' }}>Contenido del sobre y probabilidades</p>
                </div>
                <button className="btn-close-modal" onClick={() => setPreviewPack(null)}><X /></button>
              </div>

              <div className="pack-cards-list">
                {previewPack.cardPool?.map((item, idx) => {
                  const card = item.cardId;
                  if (!card) return null;
                  return (
                    <div key={idx} className="preview-card-item">
                      <div className="preview-card-image">
                        <img src={`${card.imageUrl && typeof card.imageUrl === 'string' && card.imageUrl.startsWith('http') ? '' : baseUrl}${card.imageUrl}`} alt={card.name} />
                        <div className="card-drop-badge">{item.dropRate.toFixed(1)}%</div>
                      </div>
                      <div className="preview-card-info">
                        <p className="card-name">{card.name}</p>
                        <p className="card-stats">⚔️ {card.attack} | 🛡️ {card.defense}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="btn-shop-buy" style={{ marginTop: '2rem', width: 'auto', alignSelf: 'center', padding: '1rem 3rem' }} onClick={() => setPreviewPack(null)}>
                ENTENDIDO
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChestCard({ title, price, description, onPurchase, onPreview, loading, userCredits, disabled, isOpening, imageUrl, baseUrl }) {
  const isAffordable = userCredits >= price || price === 0;

  return (
    <div className={`chest-card ${disabled ? 'disabled' : ''}`}>
      <div className="chest-preview-btn-wrap">
         <button className="btn-view-contents" title="Ver Contenido" onClick={(e) => { e.stopPropagation(); onPreview(); }}>
            <Eye size={18} />
         </button>
      </div>
      <div className="chest-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '180px' }}>
        <motion.div 
          className="chest-visual"
          animate={isOpening ? { 
            rotate: [0, -5, 5, -5, 5, 0],
            scale: [1, 1.05, 1.05, 1],
            transition: { duration: 1.5, repeat: Infinity }
          } : {}}
          style={{
             width: '120px', 
             height: '168px', 
             background: `url(${imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') ? '' : baseUrl}${imageUrl}) center/cover`,
             borderRadius: '8px',
             boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
          }}
        />
      </div>
      <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', minHeight: '3rem' }}>{description}</p>
      </div>
      <div style={{ width: '100%', marginTop: 'auto' }}>
        {disabled ? (
          <div className="coming-soon-badge" style={{ textAlign: 'center', width: '100%', padding: '12px' }}>
            <Lock size={14} style={{ marginRight: '8px' }} /> PRÓXIMAMENTE
          </div>
        ) : (
          <button 
            className={`btn-shop-buy ${price === 0 ? 'btn-shop-free' : (!isAffordable ? 'btn-shop-locked' : '')}`} 
            onClick={onPurchase}
            disabled={loading || (!isAffordable && price > 0)}
          >
            {loading ? (
              'PROCESANDO...'
            ) : price === 0 ? (
              <><Gift size={20} /> ABRIR GRATIS</>
            ) : (
              <>
                {!isAffordable && <Lock size={18} />}
                <ShoppingBag size={18} /> {price} 🪙
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function AvatarCard({ title, price, onPurchase, onEquip, loading, userCredits, isOwned, isEquipped, imageUrl, baseUrl }) {
  const isAffordable = userCredits >= price;

  return (
    <div className={`chest-card ${isOwned && !isEquipped ? 'owned' : ''}`}>
      <div className="chest-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '180px' }}>
        <div 
          style={{
             width: '120px', 
             height: '150px', 
             background: `url(${imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') ? '' : baseUrl}${imageUrl}) center/cover`,
             borderRadius: '50%',
             border: isEquipped ? '4px solid #fbbf24' : '2px solid rgba(255,255,255,0.1)',
             boxShadow: isEquipped ? '0 0 20px rgba(251, 191, 36, 0.4)' : 'none',
             transition: 'all 0.3s ease'
          }}
        />
      </div>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{title}</h3>
      </div>
      <div style={{ width: '100%', marginTop: '1.2rem' }}>
        {isOwned ? (
           isEquipped ? (
             <div className="btn-shop-active">
               <Check size={18} /> EQUIPADO
             </div>
           ) : (
             <button 
                className="btn-shop-equip" 
                onClick={onEquip}
                disabled={loading}
             >
                {loading ? '...' : <><Plus size={18} /> EQUIPAR</>}
             </button>
           )
        ) : (
          <button 
            className={`btn-shop-buy ${!isAffordable ? 'btn-shop-locked' : ''}`} 
            onClick={onPurchase}
            disabled={loading || !isAffordable}
          >
            {loading ? '...' : <><ShoppingBag size={18} /> {price} 🪙</>}
          </button>
        )}
      </div>
    </div>
  );
}

function BoardCard({ title, price, onPurchase, onEquip, loading, userCredits, isOwned, isEquipped, imageUrl, baseUrl }) {
  const isAffordable = userCredits >= price;

  return (
    <div className={`chest-card ${isOwned && !isEquipped ? 'owned' : ''}`} style={{ gridColumn: 'span 1' }}>
      <div className="chest-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '180px' }}>
        <div 
          style={{
             width: '180px', 
             height: '110px', 
             background: `url(${imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http') ? '' : baseUrl}${imageUrl}) center/cover`,
             borderRadius: '12px',
             border: isEquipped ? '4px solid #fbbf24' : '2px solid rgba(255,255,255,0.1)',
             boxShadow: isEquipped ? '0 0 20px rgba(251, 191, 36, 0.4)' : 'none',
             transition: 'all 0.3s ease'
          }}
        />
      </div>
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>{title}</h3>
      </div>
      <div style={{ width: '100%', marginTop: '1.2rem' }}>
        {isOwned ? (
           isEquipped ? (
             <div className="btn-shop-active">
               <Check size={18} /> EQUIPADO
             </div>
           ) : (
             <button 
                className="btn-shop-equip" 
                onClick={onEquip}
                disabled={loading}
             >
                {loading ? '...' : <><Plus size={18} /> EQUIPAR</>}
             </button>
           )
        ) : (
          <button 
            className={`btn-shop-buy ${!isAffordable ? 'btn-shop-locked' : ''}`} 
            onClick={onPurchase}
            disabled={loading || !isAffordable}
          >
            {loading ? '...' : <><ShoppingBag size={18} /> {price} 🪙</>}
          </button>
        )}
      </div>
    </div>
  );
}

export default ShopView;
