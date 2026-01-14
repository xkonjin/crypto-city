/**
 * Disaster Visual Effects System
 * 
 * "The moment the alarms went off, the dolphins had a good laugh about it.
 * They knew all along that the humans would eventually find a way to
 * make things explode colorfully."
 * 
 * Provides visual effect definitions and utilities for disaster rendering.
 * Effects include screen shakes, color tints, particles, and building overlays.
 */

import type { DisasterDamageType } from './types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Screen-wide visual effect applied during disasters
 */
export interface DisasterScreenEffect {
  /** Type of screen effect */
  type: 'tint' | 'shake' | 'wave' | 'vignette';
  /** Effect color (for tint, vignette) */
  color: string;
  /** Effect intensity (0-1) */
  intensity: number;
  /** Duration in ms (0 = continuous) */
  duration: number;
  /** Effect-specific parameters */
  params?: {
    /** Shake amplitude in pixels */
    shakeAmplitude?: number;
    /** Shake frequency in Hz */
    shakeFrequency?: number;
    /** Wave speed multiplier */
    waveSpeed?: number;
    /** Wave direction (degrees) */
    waveDirection?: number;
  };
}

/**
 * Particle effect spawned during disasters
 */
export interface DisasterParticleConfig {
  /** Particle type */
  type: 'debris' | 'fire' | 'smoke' | 'chart' | 'coin' | 'water' | 'spark';
  /** Particle color */
  color: string;
  /** Number of particles */
  count: number;
  /** Particle speed (pixels/second) */
  speed: number;
  /** Particle lifetime (ms) */
  lifetime: number;
  /** Particle size (pixels) */
  size: number;
  /** Gravity multiplier (1 = normal, 0 = no gravity, -1 = float up) */
  gravity: number;
  /** Spread angle (degrees) */
  spread: number;
  /** Whether particles should fade out */
  fadeOut: boolean;
  /** Optional: spawn interval for continuous effects (ms) */
  spawnInterval?: number;
}

/**
 * Building overlay for damaged/affected buildings
 */
export interface DamagedBuildingOverlay {
  /** Icon to display */
  icon: '⚠️' | '🔥' | '💥' | '🌊' | '❌' | '🔧';
  /** Background color */
  backgroundColor: string;
  /** Border color */
  borderColor: string;
  /** Pulse animation speed (ms per cycle) */
  pulseSpeed: number;
  /** Glow color */
  glowColor: string;
  /** Glow intensity (0-1) */
  glowIntensity: number;
}

/**
 * Complete visual effect configuration for a disaster
 */
export interface DisasterVisualEffect {
  /** Disaster type ID */
  disasterId: string;
  /** Screen-wide effects */
  screenEffects: DisasterScreenEffect[];
  /** Particle effects */
  particles: DisasterParticleConfig[];
  /** Damaged building overlay style */
  buildingOverlay: DamagedBuildingOverlay;
  /** Sound effect key */
  soundEffect?: string;
  /** Ambient sound key (looped during disaster) */
  ambientSound?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Duration of screen shake effect per shake cycle */
const SHAKE_CYCLE_MS = 50;

/** Default particle spawn interval for continuous effects */
const DEFAULT_SPAWN_INTERVAL = 200;

// =============================================================================
// DISASTER VISUAL EFFECTS DEFINITIONS
// =============================================================================

/**
 * Visual effects for each disaster type.
 * 
 * "The guide says that disasters are nature's way of reminding you
 * that you're not as in control as you thought. Player-triggered
 * disasters are humanity's way of saying 'hold my beer.'"
 */
export const DISASTER_VISUAL_EFFECTS: Record<string, DisasterVisualEffect> = {
  market_crash: {
    disasterId: 'market_crash',
    screenEffects: [
      {
        type: 'tint',
        color: 'rgba(239, 68, 68, 0.15)', // red-500 with low opacity
        intensity: 0.6,
        duration: 0, // Continuous
      },
      {
        type: 'vignette',
        color: 'rgba(220, 38, 38, 0.4)', // red-600
        intensity: 0.5,
        duration: 0,
      },
    ],
    particles: [
      {
        type: 'chart',
        color: '#ef4444', // red-500
        count: 15,
        speed: 80,
        lifetime: 2000,
        size: 16,
        gravity: 1.2,
        spread: 180,
        fadeOut: true,
        spawnInterval: 500,
      },
      {
        type: 'coin',
        color: '#fbbf24', // amber-400
        count: 10,
        speed: 60,
        lifetime: 1500,
        size: 8,
        gravity: 1.5,
        spread: 120,
        fadeOut: true,
        spawnInterval: 800,
      },
    ],
    buildingOverlay: {
      icon: '⚠️',
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderColor: '#ef4444',
      pulseSpeed: 1000,
      glowColor: '#ef4444',
      glowIntensity: 0.4,
    },
    soundEffect: 'market_crash',
    ambientSound: 'panic_crowd',
  },

  rug_pull: {
    disasterId: 'rug_pull',
    screenEffects: [
      {
        type: 'shake',
        color: 'transparent',
        intensity: 0.8,
        duration: 1000,
        params: {
          shakeAmplitude: 8,
          shakeFrequency: 20,
        },
      },
      {
        type: 'tint',
        color: 'rgba(168, 85, 247, 0.2)', // purple-500
        intensity: 0.5,
        duration: 2000,
      },
    ],
    particles: [
      {
        type: 'debris',
        color: '#78716c', // stone-500
        count: 30,
        speed: 120,
        lifetime: 1500,
        size: 6,
        gravity: 2.0,
        spread: 360,
        fadeOut: true,
      },
      {
        type: 'smoke',
        color: '#57534e', // stone-600
        count: 15,
        speed: 30,
        lifetime: 3000,
        size: 20,
        gravity: -0.3,
        spread: 90,
        fadeOut: true,
        spawnInterval: 200,
      },
    ],
    buildingOverlay: {
      icon: '💥',
      backgroundColor: 'rgba(168, 85, 247, 0.3)',
      borderColor: '#a855f7',
      pulseSpeed: 500,
      glowColor: '#a855f7',
      glowIntensity: 0.6,
    },
    soundEffect: 'destruction',
    ambientSound: 'rubble',
  },

  fire: {
    disasterId: 'fire',
    screenEffects: [
      {
        type: 'tint',
        color: 'rgba(249, 115, 22, 0.12)', // orange-500
        intensity: 0.4,
        duration: 0,
      },
      {
        type: 'vignette',
        color: 'rgba(234, 88, 12, 0.3)', // orange-600
        intensity: 0.4,
        duration: 0,
      },
    ],
    particles: [
      {
        type: 'fire',
        color: '#f97316', // orange-500
        count: 25,
        speed: 100,
        lifetime: 800,
        size: 12,
        gravity: -1.5, // Fire rises
        spread: 60,
        fadeOut: true,
        spawnInterval: 100,
      },
      {
        type: 'spark',
        color: '#fcd34d', // amber-300
        count: 10,
        speed: 150,
        lifetime: 600,
        size: 4,
        gravity: -0.5,
        spread: 120,
        fadeOut: true,
        spawnInterval: 150,
      },
      {
        type: 'smoke',
        color: '#44403c', // stone-700
        count: 8,
        speed: 40,
        lifetime: 2500,
        size: 24,
        gravity: -0.5,
        spread: 45,
        fadeOut: true,
        spawnInterval: 300,
      },
    ],
    buildingOverlay: {
      icon: '🔥',
      backgroundColor: 'rgba(249, 115, 22, 0.25)',
      borderColor: '#f97316',
      pulseSpeed: 300, // Fast flicker
      glowColor: '#f97316',
      glowIntensity: 0.7,
    },
    soundEffect: 'fire_alarm',
    ambientSound: 'fire_crackling',
  },

  earthquake: {
    disasterId: 'earthquake',
    screenEffects: [
      {
        type: 'shake',
        color: 'transparent',
        intensity: 1.0,
        duration: 0, // Continuous shake
        params: {
          shakeAmplitude: 12,
          shakeFrequency: 15,
        },
      },
      {
        type: 'tint',
        color: 'rgba(202, 138, 4, 0.1)', // yellow-600
        intensity: 0.3,
        duration: 0,
      },
    ],
    particles: [
      {
        type: 'debris',
        color: '#a8a29e', // stone-400
        count: 40,
        speed: 80,
        lifetime: 2000,
        size: 8,
        gravity: 2.5,
        spread: 360,
        fadeOut: true,
        spawnInterval: 300,
      },
      {
        type: 'smoke',
        color: '#78716c', // stone-500
        count: 12,
        speed: 25,
        lifetime: 3500,
        size: 30,
        gravity: -0.2,
        spread: 180,
        fadeOut: true,
        spawnInterval: 500,
      },
    ],
    buildingOverlay: {
      icon: '💥',
      backgroundColor: 'rgba(202, 138, 4, 0.2)',
      borderColor: '#ca8a04',
      pulseSpeed: 200, // Very fast shake pulse
      glowColor: '#ca8a04',
      glowIntensity: 0.5,
    },
    soundEffect: 'earthquake',
    ambientSound: 'rumble',
  },

  whale_dump: {
    disasterId: 'whale_dump',
    screenEffects: [
      {
        type: 'wave',
        color: 'rgba(59, 130, 246, 0.15)', // blue-500
        intensity: 0.6,
        duration: 0,
        params: {
          waveSpeed: 2.0,
          waveDirection: 270, // Coming from top
        },
      },
      {
        type: 'tint',
        color: 'rgba(37, 99, 235, 0.1)', // blue-600
        intensity: 0.4,
        duration: 0,
      },
    ],
    particles: [
      {
        type: 'water',
        color: '#3b82f6', // blue-500
        count: 20,
        speed: 90,
        lifetime: 1200,
        size: 10,
        gravity: 1.8,
        spread: 150,
        fadeOut: true,
        spawnInterval: 200,
      },
      {
        type: 'coin',
        color: '#60a5fa', // blue-400
        count: 15,
        speed: 70,
        lifetime: 1800,
        size: 12,
        gravity: 1.2,
        spread: 180,
        fadeOut: true,
        spawnInterval: 400,
      },
    ],
    buildingOverlay: {
      icon: '🌊',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: '#3b82f6',
      pulseSpeed: 1500,
      glowColor: '#3b82f6',
      glowIntensity: 0.5,
    },
    soundEffect: 'whale_dump',
    ambientSound: 'water_splash',
  },

  fifty_one_attack: {
    disasterId: 'fifty_one_attack',
    screenEffects: [
      {
        type: 'tint',
        color: 'rgba(185, 28, 28, 0.2)', // red-700
        intensity: 0.7,
        duration: 0,
      },
      {
        type: 'vignette',
        color: 'rgba(127, 29, 29, 0.5)', // red-900
        intensity: 0.6,
        duration: 0,
      },
    ],
    particles: [
      {
        type: 'spark',
        color: '#dc2626', // red-600
        count: 30,
        speed: 200,
        lifetime: 500,
        size: 3,
        gravity: 0,
        spread: 360,
        fadeOut: true,
        spawnInterval: 100,
      },
      {
        type: 'debris',
        color: '#1f2937', // gray-800
        count: 20,
        speed: 100,
        lifetime: 1500,
        size: 5,
        gravity: 1.0,
        spread: 360,
        fadeOut: true,
        spawnInterval: 300,
      },
    ],
    buildingOverlay: {
      icon: '❌',
      backgroundColor: 'rgba(185, 28, 28, 0.3)',
      borderColor: '#b91c1c',
      pulseSpeed: 400,
      glowColor: '#b91c1c',
      glowIntensity: 0.7,
    },
    soundEffect: 'hack_alarm',
    ambientSound: 'static_noise',
  },

  sec_raid: {
    disasterId: 'sec_raid',
    screenEffects: [
      {
        type: 'tint',
        color: 'rgba(107, 114, 128, 0.15)', // gray-500
        intensity: 0.5,
        duration: 0,
      },
      {
        type: 'vignette',
        color: 'rgba(31, 41, 55, 0.4)', // gray-800
        intensity: 0.4,
        duration: 0,
      },
    ],
    particles: [
      {
        type: 'debris',
        color: '#9ca3af', // gray-400
        count: 10,
        speed: 40,
        lifetime: 2000,
        size: 8,
        gravity: 0.5,
        spread: 90,
        fadeOut: true,
        spawnInterval: 600,
      },
    ],
    buildingOverlay: {
      icon: '⚠️',
      backgroundColor: 'rgba(107, 114, 128, 0.25)',
      borderColor: '#6b7280',
      pulseSpeed: 2000, // Slow ominous pulse
      glowColor: '#6b7280',
      glowIntensity: 0.3,
    },
    soundEffect: 'siren',
    ambientSound: 'radio_chatter',
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get visual effect config for a disaster type
 */
export function getDisasterVisualEffect(disasterId: string): DisasterVisualEffect | null {
  return DISASTER_VISUAL_EFFECTS[disasterId] || null;
}

/**
 * Get building overlay style for damaged buildings
 */
export function getDamagedBuildingOverlay(disasterId: string): DamagedBuildingOverlay | null {
  const effect = DISASTER_VISUAL_EFFECTS[disasterId];
  return effect?.buildingOverlay || null;
}

/**
 * Calculate screen shake offset for a given time
 */
export function calculateShakeOffset(
  effect: DisasterScreenEffect,
  timeMs: number
): { x: number; y: number } {
  if (effect.type !== 'shake' || !effect.params) {
    return { x: 0, y: 0 };
  }

  const { shakeAmplitude = 5, shakeFrequency = 10 } = effect.params;
  const phase = (timeMs / 1000) * shakeFrequency * Math.PI * 2;
  
  // Use slightly different frequencies for x and y to create more organic shake
  const x = Math.sin(phase) * shakeAmplitude * effect.intensity;
  const y = Math.cos(phase * 1.1) * shakeAmplitude * effect.intensity * 0.8;
  
  // Add some randomness for more natural feel
  const jitterX = (Math.random() - 0.5) * shakeAmplitude * 0.3;
  const jitterY = (Math.random() - 0.5) * shakeAmplitude * 0.3;
  
  return {
    x: x + jitterX,
    y: y + jitterY,
  };
}

/**
 * Calculate wave distortion for a given position and time
 */
export function calculateWaveOffset(
  effect: DisasterScreenEffect,
  x: number,
  y: number,
  timeMs: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  if (effect.type !== 'wave' || !effect.params) {
    return { x: 0, y: 0 };
  }

  const { waveSpeed = 1, waveDirection = 0 } = effect.params;
  const dirRad = (waveDirection * Math.PI) / 180;
  const time = timeMs / 1000;
  
  // Calculate wave phase based on position and direction
  const phase = (x * Math.cos(dirRad) + y * Math.sin(dirRad)) / 50 + time * waveSpeed;
  
  // Wave amplitude based on intensity
  const amplitude = 5 * effect.intensity;
  
  return {
    x: Math.sin(phase) * amplitude * Math.cos(dirRad),
    y: Math.sin(phase) * amplitude * Math.sin(dirRad),
  };
}

/**
 * Get combined screen tint color for active disasters
 */
export function getCombinedScreenTint(activeDisasterIds: string[]): string {
  if (activeDisasterIds.length === 0) {
    return 'transparent';
  }

  // Get tint effects from all active disasters
  const tints: { color: string; intensity: number }[] = [];
  
  for (const disasterId of activeDisasterIds) {
    const effect = DISASTER_VISUAL_EFFECTS[disasterId];
    if (!effect) continue;
    
    for (const screenEffect of effect.screenEffects) {
      if (screenEffect.type === 'tint' || screenEffect.type === 'vignette') {
        tints.push({
          color: screenEffect.color,
          intensity: screenEffect.intensity,
        });
      }
    }
  }

  if (tints.length === 0) {
    return 'transparent';
  }

  // For simplicity, return the first tint with highest intensity
  // A more sophisticated implementation would blend colors
  const strongest = tints.reduce((a, b) => a.intensity > b.intensity ? a : b);
  return strongest.color;
}

/**
 * Check if any active disaster has screen shake
 */
export function hasActiveScreenShake(activeDisasterIds: string[]): boolean {
  for (const disasterId of activeDisasterIds) {
    const effect = DISASTER_VISUAL_EFFECTS[disasterId];
    if (!effect) continue;
    
    for (const screenEffect of effect.screenEffects) {
      if (screenEffect.type === 'shake') {
        return true;
      }
    }
  }
  return false;
}

/**
 * Get the combined shake config from all active disasters
 */
export function getCombinedShakeConfig(activeDisasterIds: string[]): DisasterScreenEffect | null {
  let maxIntensity = 0;
  let maxShake: DisasterScreenEffect | null = null;

  for (const disasterId of activeDisasterIds) {
    const effect = DISASTER_VISUAL_EFFECTS[disasterId];
    if (!effect) continue;
    
    for (const screenEffect of effect.screenEffects) {
      if (screenEffect.type === 'shake' && screenEffect.intensity > maxIntensity) {
        maxIntensity = screenEffect.intensity;
        maxShake = screenEffect;
      }
    }
  }

  return maxShake;
}

/**
 * Default overlay for buildings damaged without a specific disaster effect
 */
export const DEFAULT_DAMAGED_OVERLAY: DamagedBuildingOverlay = {
  icon: '🔧',
  backgroundColor: 'rgba(234, 179, 8, 0.2)',
  borderColor: '#eab308',
  pulseSpeed: 1500,
  glowColor: '#eab308',
  glowIntensity: 0.4,
};

// =============================================================================
// EXPORTS
// =============================================================================

const disasterVisualEffects = {
  DISASTER_VISUAL_EFFECTS,
  DEFAULT_DAMAGED_OVERLAY,
  getDisasterVisualEffect,
  getDamagedBuildingOverlay,
  calculateShakeOffset,
  calculateWaveOffset,
  getCombinedScreenTint,
  hasActiveScreenShake,
  getCombinedShakeConfig,
};

export default disasterVisualEffects;
