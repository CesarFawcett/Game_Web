import { create } from 'zustand';

const useStore = create((set, get) => ({
  user: null,
  cards: [],
  boards: [],
  deck: [],
  globalConfig: null,
  activeDuel: null,
  missions: { dailyWins: 0, weeklyPoints: 0, claimedMissions: [], claimedChests: [], missions: [] },
  seenOnboarding: [],

  // Actions
  setMissions: (missions) => set({ missions }),
  setCards: (cards) => set({ cards }),
  setBoards: (boards) => set({ boards }),
  setGlobalConfig: (globalConfig) => set({ globalConfig }),
  setActiveDuel: (activeDuel) => set({ activeDuel }),
  setDeck: (deck) => set({ deck }),

  login: (userData) => {
    const normalizedUser = {
      ...userData,
      username: userData.username || userData.name
    };
    set({ user: normalizedUser, deck: normalizedUser.deck || [], seenOnboarding: normalizedUser.seenOnboarding || [] });
    sessionStorage.setItem('authUser', JSON.stringify(normalizedUser));
  },

  logout: () => {
    set({ user: null, deck: [], seenOnboarding: [] });
    sessionStorage.removeItem('authUser');
  },

  refreshUserData: async (username, SHOP_URL) => {
    try {

      const res = await fetch(`${SHOP_URL}/user/${username}`);
      const data = await res.json();
      if (res.ok) {
        const freshUser = {
          username: data.username,
          role: data.role,
          credits: data.credits,
          inventory: data.inventory,
          discoveredCards: data.discoveredCards,
          deck: data.deck || [],
          ownedAvatars: data.ownedAvatars || [],
          equippedAvatar: data.equippedAvatar || '/default.png',
          ownedBoards: data.ownedBoards || [],
          equippedBoard: data.equippedBoard || '',
          equippedFieldImage: data.equippedFieldImage || '',
          equippedTexture: data.equippedTexture || '',
          equippedCardBack: data.equippedCardBack || '',
          unlockedEnemyAvatars: data.unlockedEnemyAvatars || [],
          defeatedEnemies: data.defeatedEnemies || [],
          seenOnboarding: data.seenOnboarding || [],
          duelsUnlocked: data.duelsUnlocked || false,
          freePacksCount: data.freePacksCount || 0
        };
        set({ user: freshUser, deck: data.deck || [], seenOnboarding: data.seenOnboarding || [] });
        sessionStorage.setItem('authUser', JSON.stringify(freshUser));
        return freshUser;
      }
      return null;
    } catch (err) {
      console.error('Error refreshing user data:', err);
      return null;
    }
  },

  fetchConfig: async (BASE_URL) => {
    try {
      const res = await fetch(`${BASE_URL}/api/config`);
      const data = await res.json();
      set({ globalConfig: data });
    } catch (err) { console.error("Error fetching config:", err); }
  },

  fetchData: async (API_URL) => {
    try {
      const cardRes = await fetch(`${API_URL}/cards`);
      const cardsData = await cardRes.json();
      const boardRes = await fetch(`${API_URL}/boards`);
      const boardsData = await boardRes.json();
      set({ cards: cardsData, boards: boardsData });
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  },

  handleSell: async (cardId, BASE_URL) => {
    const { user, deck } = get();
    if (!window.confirm("¿Seguro que quieres vender esta carta por 100 créditos?")) return;
    try {
      const res = await fetch(`${BASE_URL}/api/shop/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, cardId })
      });
      const data = await res.json();
      if (data.success) {
        const updatedUser = { ...user, credits: data.newCredits };

        const invIndex = updatedUser.inventory.findIndex(id => String(id) === String(cardId));
        if (invIndex !== -1) updatedUser.inventory.splice(invIndex, 1);

        set({ user: updatedUser });
        sessionStorage.setItem('authUser', JSON.stringify(updatedUser));

        const remainingCopies = updatedUser.inventory.filter(id => String(id) === String(cardId)).length;
        const countInDeck = deck.filter(id => String(id) === String(cardId)).length;

        if (countInDeck > remainingCopies) {
          const newDeck = [...deck];
          const lastIdx = newDeck.lastIndexOf(String(cardId));
          if (lastIdx !== -1) {
            newDeck.splice(lastIdx, 1);
            set({ deck: newDeck });
          }
        }
      }
    } catch (err) {
      alert("Error al vender la carta");
    }
  },

  addCardToDeck: async (cardId, BASE_URL) => {
    const { user, deck } = get();
    if (!user) return;

    const countInInventory = user.inventory.filter(id => String(id) === String(cardId)).length;
    const countInDeck = deck.filter(id => String(id) === String(cardId)).length;

    if (deck.length >= 30) {
      alert("¡Tu mazo ya tiene el máximo de 30 cartas!");
      return;
    }
    if (countInDeck >= 4) {
      alert("¡No puedes tener más de 4 copias de la misma carta en tu mazo!");
      return;
    }
    if (countInDeck >= countInInventory) {
      alert("No tienes más copias de esta carta en tu inventario.");
      return;
    }

    const newDeck = [...deck, String(cardId)];

    try {
      const res = await fetch(`${BASE_URL}/api/shop/update-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, deck: newDeck })
      });
      if (res.ok) {
        const data = await res.json();
        set({ deck: data.deck });
      } else {
        const errData = await res.json();
        alert(`Error al actualizar mazo: ${errData.error}`);
      }
    } catch (e) {
      console.error('Error saving deck', e);
      alert("Error de conexión al guardar el mazo.");
    }
  },
  removeCardFromDeck: async (cardId, BASE_URL) => {
    const { user, deck } = get();
    if (!user) return;

    const idx = deck.lastIndexOf(String(cardId));
    if (idx === -1) return;

    const newDeck = [...deck];
    newDeck.splice(idx, 1);

    try {
      const res = await fetch(`${BASE_URL}/api/shop/update-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, deck: newDeck })
      });
      if (res.ok) {
        const data = await res.json();
        set({ deck: data.deck });
      } else {
        const errData = await res.json();
        alert(`Error al remover del mazo: ${errData.error}`);
      }
    } catch (e) {
      console.error('Error saving deck', e);
      alert("Error de conexión al remover del mazo.");
    }
  },

  fetchMissions: async (username, BASE_URL) => {
    try {
      const res = await fetch(`${BASE_URL}/api/missions/status/${username}`);
      const data = await res.json();
      if (res.ok) set({ missions: data });
    } catch (err) { console.error("Error fetching missions:", err); }
  },

  claimMission: async (username, missionId, BASE_URL) => {
    try {
      const res = await fetch(`${BASE_URL}/api/missions/claim-mission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, missionId })
      });
      const data = await res.json();
      if (data.success) {
        set(s => ({
          user: { ...s.user, credits: data.newCredits },
          missions: { ...s.missions, weeklyPoints: data.newPoints, claimedMissions: [...s.missions.claimedMissions, missionId] }
        }));
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) { return { success: false, error: 'Network error' }; }
  },

  claimChest: async (username, milestone, BASE_URL) => {
    try {
      const res = await fetch(`${BASE_URL}/api/missions/claim-chest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, milestone })
      });
      const data = await res.json();
      if (data.success) {
        set(s => ({
          user: { ...s.user, credits: data.newCredits },
          missions: { ...s.missions, claimedChests: data.claimedChests }
        }));
        return { success: true, rewardCards: data.rewardCards };
      }
      return { success: false, error: data.error };
    } catch (err) { return { success: false, error: 'Network error' }; }
  },

  markOnboardingSeen: async (feature, BASE_URL) => {
    const { user, seenOnboarding } = get();
    if (!user || seenOnboarding.includes(feature)) return;

    try {
      const res = await fetch(`${BASE_URL}/api/shop/mark-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, feature })
      });
      const data = await res.json();
      if (data.success) {
        set({ seenOnboarding: data.seenOnboarding });
        const updatedUser = { ...user, seenOnboarding: data.seenOnboarding };
        set({ user: updatedUser });
        sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
    } catch (err) { console.error("Error marking onboarding as seen:", err); }
  }
}));

export default useStore;
