'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Sound effect paths
export const SOUND_EFFECTS = {
  // UI sounds
  click: '/audio/click.mp3',
  doubleClick: '/audio/double_click.mp3',
  open: '/audio/open.mp3',
  
  // Building sounds
  build: '/audio/build.mp3',
  buildRoad: '/audio/buildroad.mp3',
  destruction: '/audio/destruction.mp3',
  
  // Crypto-specific sounds (we'll generate these)
  rugPull: '/audio/destruction.mp3', // Reuse destruction for now
  milestone: '/audio/open.mp3', // Reuse open for now
  cobie: '/audio/click.mp3', // Cobie message sound
} as const;

// Music tracks by category
export const MUSIC_TRACKS = {
  ambient: [
    '/audio/music/ambient/ambient_1.mp3',
    '/audio/music/ambient/ambient_2.mp3',
    '/audio/music/ambient/ambient_3.mp3',
    '/audio/music/ambient/ambient_4.mp3',
    '/audio/music/ambient/ambient_5.mp3',
  ],
  chill: [
    '/audio/music/chill/chill_1.mp3',
    '/audio/music/chill/chill_2.mp3',
    '/audio/music/chill/chill_3.mp3',
  ],
  jazz: [
    '/audio/music/jazz/pogicity_music_001.mp3',
    '/audio/music/jazz/pogicity_music_002.mp3',
    '/audio/music/jazz/pogicity_music_003.mp3',
    '/audio/music/jazz/pogicity_music_004.mp3',
    '/audio/music/jazz/pogicity_music_005.mp3',
    '/audio/music/jazz/pogicity_music_006.mp3',
    '/audio/music/jazz/pogicity_music_007.mp3',
  ],
} as const;

export type SoundEffect = keyof typeof SOUND_EFFECTS;
export type MusicCategory = keyof typeof MUSIC_TRACKS;

const STORAGE_KEY = 'cryptocity-sound-settings';

interface SoundSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  musicCategory: MusicCategory;
}

const DEFAULT_SETTINGS: SoundSettings = {
  masterVolume: 0.7,
  sfxVolume: 0.8,
  musicVolume: 0.3,
  sfxEnabled: true,
  musicEnabled: true,
  musicCategory: 'jazz',
};

// Audio cache to prevent reloading
const audioCache = new Map<string, HTMLAudioElement>();

function getAudio(src: string): HTMLAudioElement {
  if (!audioCache.has(src)) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audioCache.set(src, audio);
  }
  return audioCache.get(src)!;
}

interface UseSoundReturn {
  // Settings
  settings: SoundSettings;
  setMasterVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setMusicCategory: (category: MusicCategory) => void;
  
  // Playback
  playSfx: (effect: SoundEffect) => void;
  playMusic: () => void;
  stopMusic: () => void;
  
  // State
  isMusicPlaying: boolean;
  currentTrack: string | null;
}

export function useSound(): UseSoundReturn {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackIndexRef = useRef(0);
  
  // Load settings from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load sound settings:', e);
    }
    setHasLoadedSettings(true);
  }, []);
  
  // Save settings to localStorage
  useEffect(() => {
    if (!hasLoadedSettings || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save sound settings:', e);
    }
  }, [settings, hasLoadedSettings]);
  
  // Update music volume when settings change
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = settings.masterVolume * settings.musicVolume;
    }
  }, [settings.masterVolume, settings.musicVolume]);
  
  // Play sound effect
  const playSfx = useCallback((effect: SoundEffect) => {
    if (!settings.sfxEnabled || typeof window === 'undefined') return;
    
    const src = SOUND_EFFECTS[effect];
    try {
      const audio = getAudio(src);
      audio.volume = settings.masterVolume * settings.sfxVolume;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    } catch (e) {
      console.error('Failed to play sound effect:', e);
    }
  }, [settings.sfxEnabled, settings.masterVolume, settings.sfxVolume]);
  
  // Play next music track
  const playNextTrack = useCallback(() => {
    if (!settings.musicEnabled || typeof window === 'undefined') return;
    
    const tracks = MUSIC_TRACKS[settings.musicCategory];
    currentTrackIndexRef.current = (currentTrackIndexRef.current + 1) % tracks.length;
    const track = tracks[currentTrackIndexRef.current];
    
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.removeEventListener('ended', playNextTrack);
    }
    
    const audio = new Audio(track);
    audio.volume = settings.masterVolume * settings.musicVolume;
    audio.addEventListener('ended', playNextTrack);
    musicAudioRef.current = audio;
    setCurrentTrack(track);
    
    audio.play().catch(() => {
      // Autoplay blocked
      setIsMusicPlaying(false);
    });
  }, [settings.musicEnabled, settings.musicCategory, settings.masterVolume, settings.musicVolume]);
  
  // Start music
  const playMusic = useCallback(() => {
    if (!settings.musicEnabled || typeof window === 'undefined') return;
    
    const tracks = MUSIC_TRACKS[settings.musicCategory];
    currentTrackIndexRef.current = Math.floor(Math.random() * tracks.length);
    const track = tracks[currentTrackIndexRef.current];
    
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.removeEventListener('ended', playNextTrack);
    }
    
    const audio = new Audio(track);
    audio.volume = settings.masterVolume * settings.musicVolume;
    audio.addEventListener('ended', playNextTrack);
    musicAudioRef.current = audio;
    setCurrentTrack(track);
    
    audio.play()
      .then(() => setIsMusicPlaying(true))
      .catch(() => setIsMusicPlaying(false));
  }, [settings.musicEnabled, settings.musicCategory, settings.masterVolume, settings.musicVolume, playNextTrack]);
  
  // Stop music
  const stopMusic = useCallback(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.removeEventListener('ended', playNextTrack);
      musicAudioRef.current = null;
    }
    setIsMusicPlaying(false);
    setCurrentTrack(null);
  }, [playNextTrack]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
    };
  }, []);
  
  // Settings setters
  const setMasterVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, masterVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);
  
  const setSfxVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, sfxVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);
  
  const setMusicVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, musicVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);
  
  const setSfxEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, sfxEnabled: enabled }));
  }, []);
  
  const setMusicEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, musicEnabled: enabled }));
    if (!enabled && musicAudioRef.current) {
      musicAudioRef.current.pause();
      setIsMusicPlaying(false);
    }
  }, []);
  
  const setMusicCategory = useCallback((category: MusicCategory) => {
    setSettings(prev => ({ ...prev, musicCategory: category }));
    // Restart music with new category if playing
    if (isMusicPlaying) {
      stopMusic();
      setTimeout(() => playMusic(), 100);
    }
  }, [isMusicPlaying, stopMusic, playMusic]);
  
  return {
    settings,
    setMasterVolume,
    setSfxVolume,
    setMusicVolume,
    setSfxEnabled,
    setMusicEnabled,
    setMusicCategory,
    playSfx,
    playMusic,
    stopMusic,
    isMusicPlaying,
    currentTrack,
  };
}
