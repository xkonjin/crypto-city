'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSound, SoundEffect, MusicCategory } from '@/hooks/useSound';

interface SoundContextValue {
  // Settings
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  musicCategory: MusicCategory;
  
  // Setters
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

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const sound = useSound();
  
  const value: SoundContextValue = {
    masterVolume: sound.settings.masterVolume,
    sfxVolume: sound.settings.sfxVolume,
    musicVolume: sound.settings.musicVolume,
    sfxEnabled: sound.settings.sfxEnabled,
    musicEnabled: sound.settings.musicEnabled,
    musicCategory: sound.settings.musicCategory,
    setMasterVolume: sound.setMasterVolume,
    setSfxVolume: sound.setSfxVolume,
    setMusicVolume: sound.setMusicVolume,
    setSfxEnabled: sound.setSfxEnabled,
    setMusicEnabled: sound.setMusicEnabled,
    setMusicCategory: sound.setMusicCategory,
    playSfx: sound.playSfx,
    playMusic: sound.playMusic,
    stopMusic: sound.stopMusic,
    isMusicPlaying: sound.isMusicPlaying,
    currentTrack: sound.currentTrack,
  };
  
  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext(): SoundContextValue {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundContext must be used within a SoundProvider');
  }
  return context;
}

// Optional hook that doesn't throw if context is missing
export function useSoundOptional(): SoundContextValue | null {
  return useContext(SoundContext);
}
