export const calculateSplashDamage = (attacker, field, targetIdx) => {
  let splashDmg = 0;
  if (attacker.ability === 'Fuego' || (attacker.effects && attacker.effects.some(e => e.type === 'splash'))) {
    splashDmg = Math.floor(attacker.attack * 0.4);
  }
  
  if (splashDmg === 0) return [];
  
  // Devuelve array de daños a aplicar al campo
  return field.map((card, i) => {
    if (i === targetIdx || !card) return 0;
    return splashDmg;
  });
};

export const applyPoison = (field) => {
  let poisonTotal = 0;
  field.forEach((card) => {
    if (card && (card.ability === 'Veneno' || (card.effects && card.effects.some(e => e.type === 'poison')))) {
      poisonTotal += Math.floor(card.attack * 0.2);
    }
  });
  return poisonTotal;
};

export const resolveAttack = (attacker, target, field, targetIdx) => {
  let result = {
    targetDefLeft: 0,
    destroyed: false,
    textLog: '',
    splashDamages: [],
    frozenVal: 0
  };

  if (!target) {
    result.textLog = `${attacker.name} realizó un ataque directo.`;
    return result; // Direct Attack
  }

  const defRemaining = target.defense - attacker.attack;
  result.targetDefLeft = defRemaining;
  result.destroyed = defRemaining <= 0;
  
  result.textLog = `${attacker.name} atacó a ${target.name}. ` + (result.destroyed ? `¡${target.name} destruida!` : '');

  result.splashDamages = calculateSplashDamage(attacker, field, targetIdx);
  
  if (attacker.ability === 'Hielo' || (attacker.effects && attacker.effects.some(e => e.type === 'freeze'))) {
    if (!result.destroyed) {
      result.frozenVal = 2;
      result.textLog += ` ¡${target.name} fue congelada!`;
    }
  }

  return result;
};

// Utilities you could expand to support generic `effects: [{ type: 'heal', amount: 500 }]`
