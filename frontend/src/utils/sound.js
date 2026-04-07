import attackSound from './sonidos/ataque_carta.mp3';
import defeatSound from './sonidos/pierdes.mp3';
import ambientSound from './sonidos/hambiente.mp3';
import openSound from './sonidos/abrir.mp3';

// ARCHIVOS NO ENCONTRADOS LOCALMENTE (Vite crashearía)
// El jugador necesita asegurarse de que estén en src/utils/sonidos/ con estos nombres exactos:
import battleAmbientSound from './sonidos/Fondo_Batalla.mp3';
import trapSound from './sonidos/Carta_Trampa.mp3';
import monsterSound from './sonidos/Carta_Moustruo.mp3';
import spellSound from './sonidos/Carta_Hechizo.mp3';

const sounds = {
  place: 'https://www.soundjay.com/buttons/sounds/button-20.mp3',
  place_trap: trapSound,
  place_monster: monsterSound,
  place_spell: spellSound,
  attack: attackSound,
  impact: 'https://www.soundjay.com/buttons/sounds/button-10.mp3',
  victory: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
  defeat: defeatSound,
  open: openSound,
};

const getInitialSettings = () => {
  const saved = localStorage.getItem('gameAudioSettings');
  if (saved) return JSON.parse(saved);
  return { mute: false, volume: 0.4 };
};

let settings = getInitialSettings();
let ambientAudio = null;
let currentAmbientType = null;

const saveSettings = () => {
  localStorage.setItem('gameAudioSettings', JSON.stringify(settings));
};

export const playSound = (name) => {
  if (settings.mute || !sounds[name]) return;
  const audio = new Audio(sounds[name]);
  audio.volume = settings.volume;
  audio.play().catch(err => console.log('Audio playback failed:', err));
};

export const startAmbient = (type = 'menu') => {
  if (settings.mute) return;

  const targetSound = type === 'battle' ? battleAmbientSound : ambientSound;

  if (!targetSound) return;
  if (ambientAudio) {
    if (currentAmbientType === type && !ambientAudio.paused) return; // already playing this type
    ambientAudio.pause();
  }

  ambientAudio = new Audio(targetSound);
  ambientAudio.loop = true;
  ambientAudio.volume = settings.volume * 0.5;
  ambientAudio.play().catch(err => console.log('Ambient audio failed:', err));
  currentAmbientType = type;
};

export const stopAmbient = () => {
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
    currentAmbientType = null;
  }
};

export const setVolume = (val) => {
  settings.volume = parseFloat(val);
  if (ambientAudio) {
    ambientAudio.volume = settings.volume * (currentAmbientType === 'battle' ? 0.5 : 0.5);
  }
  saveSettings();
};

export const getVolume = () => settings.volume;

export const toggleMute = () => {
  settings.mute = !settings.mute;
  if (settings.mute) {
     stopAmbient();
  } else {
     startAmbient(currentAmbientType || 'menu');
  }
  saveSettings();
  return settings.mute;
};

export const getMuteStatus = () => settings.mute;
