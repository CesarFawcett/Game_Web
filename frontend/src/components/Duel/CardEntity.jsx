import React from 'react';

const CardEntity = ({ card, baseUrl }) => {
  return (
    <div className={`card-inner rarity-${(card.rarity || 'Común').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}>
      {card.frozen > 0 && <div className="frozen-overlay" />}
      {card.equippedSpells && card.equippedSpells.length > 0 && <div className="spell-equip-badge">+{card.equippedSpells.length}</div>}
      
      <img src={`${baseUrl}${card.imageUrl}`} alt={card.name} draggable="false" />
      
      <div className="card-stats">
        <div className="stat-item"><span className="stat-atk">{card.attack}</span>ATK</div>
        <div className="stat-item"><span className="stat-def">{card.defense}</span>DEF</div>
      </div>
    </div>
  );
};

export default CardEntity;
