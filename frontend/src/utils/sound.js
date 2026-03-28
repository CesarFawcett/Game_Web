import attackSound from './sonidos/ataque_carta.mp3';
import defeatSound from './sonidos/pierdes.mp3';
import ambientSound from './sonidos/hambiente.mp3';
import openSound from './sonidos/abrir.mp3';

const sounds = {
  place: 'https://www.soundjay.com/buttons/sounds/button-20.mp3',
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

const saveSettings = () => {
  localStorage.setItem('gameAudioSettings', JSON.stringify(settings));
};

export const playSound = (name) => {
  if (settings.mute || !sounds[name]) return;
  const audio = new Audio(sounds[name]);
  audio.volume = settings.volume;
  audio.play().catch(err => console.log('Audio playback failed:', err));
};

export const startAmbient = () => {
  if (settings.mute) return;
  if (!ambientAudio) {
    ambientAudio = new Audio(ambientSound);
    ambientAudio.loop = true;
  }
  ambientAudio.volume = settings.volume * 0.5; // Ambient is always softer
  ambientAudio.play().catch(err => console.log('Ambient audio failed:', err));
};

export const stopAmbient = () => {
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
  }
};

export const setVolume = (val) => {
  settings.volume = parseFloat(val);
  if (ambientAudio) ambientAudio.volume = settings.volume * 0.5;
  saveSettings();
};

export const getVolume = () => settings.volume;

export const toggleMute = () => {
  settings.mute = !settings.mute;
  if (settings.mute) stopAmbient();
  else startAmbient();
  saveSettings();
  return settings.mute;
};

export const getMuteStatus = () => settings.mute;
