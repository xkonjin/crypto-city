/**
 * Building Placement Feedback System
 * 
 * Provides satisfying audio and visual feedback when placing buildings.
 * Includes sound effects, particle effects, and haptic feedback.
 * 
 * Issue #151: Improve building placement feedback
 */

// =============================================================================
// TYPES
// =============================================================================

export interface PlacementFeedback {
  success: boolean;
  buildingType: 'standard' | 'crypto' | 'service' | 'landmark';
  cost: number;
  position: { x: number; y: number };
}

export interface ParticleConfig {
  count: number;
  colors: string[];
  duration: number;
  spread: number;
  gravity: number;
  size: { min: number; max: number };
}

export type FeedbackType = 
  | 'place_small'
  | 'place_large'
  | 'place_crypto'
  | 'place_service'
  | 'place_landmark'
  | 'bulldoze'
  | 'error'
  | 'upgrade'
  | 'achievement';

// =============================================================================
// SOUND EFFECTS
// =============================================================================

// Sound effect URLs (relative to public folder)
export const SOUND_EFFECTS: Record<FeedbackType, string> = {
  place_small: '/sounds/place_small.mp3',
  place_large: '/sounds/place_large.mp3',
  place_crypto: '/sounds/place_crypto.mp3',
  place_service: '/sounds/place_service.mp3',
  place_landmark: '/sounds/place_landmark.mp3',
  bulldoze: '/sounds/bulldoze.mp3',
  error: '/sounds/error.mp3',
  upgrade: '/sounds/upgrade.mp3',
  achievement: '/sounds/achievement.mp3',
};

// Audio cache for preloaded sounds
const audioCache: Map<string, HTMLAudioElement> = new Map();

/**
 * Preload all sound effects
 */
export function preloadSounds(): void {
  if (typeof window === 'undefined') return;
  
  for (const [key, url] of Object.entries(SOUND_EFFECTS)) {
    try {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audioCache.set(key, audio);
    } catch (error) {
      console.warn(`Failed to preload sound: ${key}`, error);
    }
  }
}

/**
 * Play a sound effect
 */
export function playSound(type: FeedbackType, volume: number = 0.5): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Try cached audio first
    const cached = audioCache.get(type);
    if (cached) {
      const clone = cached.cloneNode() as HTMLAudioElement;
      clone.volume = Math.max(0, Math.min(1, volume));
      clone.play().catch(() => {});
      return;
    }
    
    // Fallback to creating new audio
    const url = SOUND_EFFECTS[type];
    if (url) {
      const audio = new Audio(url);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => {});
    }
  } catch (error) {
    console.warn(`Failed to play sound: ${type}`, error);
  }
}

// =============================================================================
// PARTICLE EFFECTS
// =============================================================================

export const PARTICLE_CONFIGS: Record<string, ParticleConfig> = {
  place_standard: {
    count: 8,
    colors: ['#a8a29e', '#78716c', '#57534e'], // Stone gray
    duration: 600,
    spread: 30,
    gravity: 0.3,
    size: { min: 3, max: 6 },
  },
  place_crypto: {
    count: 15,
    colors: ['#fbbf24', '#f59e0b', '#d97706', '#34d399'], // Gold + green
    duration: 1000,
    spread: 50,
    gravity: -0.1, // Float up
    size: { min: 4, max: 8 },
  },
  place_service: {
    count: 10,
    colors: ['#60a5fa', '#3b82f6', '#2563eb'], // Blue
    duration: 800,
    spread: 40,
    gravity: 0.2,
    size: { min: 3, max: 7 },
  },
  place_landmark: {
    count: 20,
    colors: ['#fbbf24', '#f59e0b', '#ffffff', '#fef3c7'], // Gold + white sparkle
    duration: 1200,
    spread: 60,
    gravity: -0.05,
    size: { min: 4, max: 10 },
  },
  bulldoze: {
    count: 12,
    colors: ['#78716c', '#57534e', '#44403c', '#292524'], // Dark dust
    duration: 800,
    spread: 40,
    gravity: 0.4,
    size: { min: 4, max: 8 },
  },
  coin_burst: {
    count: 5,
    colors: ['#fbbf24', '#f59e0b'], // Gold coins
    duration: 1000,
    spread: 80,
    gravity: 0.5,
    size: { min: 8, max: 12 },
  },
};

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

/**
 * Generate particles for an effect
 */
export function generateParticles(
  centerX: number,
  centerY: number,
  config: ParticleConfig
): Particle[] {
  const particles: Particle[] = [];
  
  for (let i = 0; i < config.count; i++) {
    const angle = (Math.PI * 2 * i) / config.count + Math.random() * 0.5;
    const speed = Math.random() * config.spread / 10;
    
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // Initial upward velocity
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      size: config.size.min + Math.random() * (config.size.max - config.size.min),
      life: config.duration,
      maxLife: config.duration,
    });
  }
  
  return particles;
}

/**
 * Update particle physics for one frame
 */
export function updateParticle(particle: Particle, gravity: number, deltaMs: number): void {
  const dt = deltaMs / 16.67; // Normalize to 60fps
  
  particle.x += particle.vx * dt;
  particle.y += particle.vy * dt;
  particle.vy += gravity * dt;
  particle.life -= deltaMs;
}

/**
 * Render a particle to canvas
 */
export function renderParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  const alpha = Math.max(0, particle.life / particle.maxLife);
  const scale = 0.5 + alpha * 0.5;
  
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// =============================================================================
// HAPTIC FEEDBACK
// =============================================================================

/**
 * Trigger haptic feedback on mobile devices
 */
export function triggerHaptic(pattern: 'light' | 'medium' | 'heavy' | 'error'): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  
  try {
    switch (pattern) {
      case 'light':
        navigator.vibrate(30);
        break;
      case 'medium':
        navigator.vibrate(50);
        break;
      case 'heavy':
        navigator.vibrate([50, 30, 50]);
        break;
      case 'error':
        navigator.vibrate([100, 50, 100]);
        break;
    }
  } catch (error) {
    // Vibration API may be blocked
  }
}

// =============================================================================
// TREASURY ANIMATION
// =============================================================================

export interface TreasuryChange {
  amount: number;
  timestamp: number;
  id: string;
}

let treasuryChanges: TreasuryChange[] = [];

/**
 * Record a treasury change for animation
 */
export function recordTreasuryChange(amount: number): string {
  const id = `treasury-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  treasuryChanges.push({
    amount,
    timestamp: Date.now(),
    id,
  });
  
  // Clean up old changes
  const now = Date.now();
  treasuryChanges = treasuryChanges.filter(c => now - c.timestamp < 2000);
  
  return id;
}

/**
 * Get active treasury changes for display
 */
export function getActiveTreasuryChanges(): TreasuryChange[] {
  const now = Date.now();
  return treasuryChanges.filter(c => now - c.timestamp < 2000);
}

/**
 * Clear a specific treasury change
 */
export function clearTreasuryChange(id: string): void {
  treasuryChanges = treasuryChanges.filter(c => c.id !== id);
}

// =============================================================================
// MAIN FEEDBACK FUNCTION
// =============================================================================

/**
 * Trigger complete feedback for a building placement
 */
export function triggerPlacementFeedback(feedback: PlacementFeedback): {
  soundType: FeedbackType;
  particleConfig: ParticleConfig;
  hapticPattern: 'light' | 'medium' | 'heavy' | 'error';
  treasuryChangeId: string | null;
} {
  if (!feedback.success) {
    playSound('error', 0.4);
    triggerHaptic('error');
    return {
      soundType: 'error',
      particleConfig: PARTICLE_CONFIGS.bulldoze,
      hapticPattern: 'error',
      treasuryChangeId: null,
    };
  }
  
  let soundType: FeedbackType;
  let particleConfig: ParticleConfig;
  let hapticPattern: 'light' | 'medium' | 'heavy';
  
  switch (feedback.buildingType) {
    case 'crypto':
      soundType = 'place_crypto';
      particleConfig = PARTICLE_CONFIGS.place_crypto;
      hapticPattern = 'medium';
      break;
    case 'service':
      soundType = 'place_service';
      particleConfig = PARTICLE_CONFIGS.place_service;
      hapticPattern = 'medium';
      break;
    case 'landmark':
      soundType = 'place_landmark';
      particleConfig = PARTICLE_CONFIGS.place_landmark;
      hapticPattern = 'heavy';
      break;
    default:
      soundType = feedback.cost > 5000 ? 'place_large' : 'place_small';
      particleConfig = PARTICLE_CONFIGS.place_standard;
      hapticPattern = 'light';
  }
  
  // Trigger all feedback
  playSound(soundType, 0.5);
  triggerHaptic(hapticPattern);
  const treasuryChangeId = recordTreasuryChange(-feedback.cost);
  
  return {
    soundType,
    particleConfig,
    hapticPattern,
    treasuryChangeId,
  };
}

/**
 * Trigger feedback for bulldozing
 */
export function triggerBulldozeFeedback(position: { x: number; y: number }, refund: number): void {
  playSound('bulldoze', 0.4);
  triggerHaptic('medium');
  if (refund > 0) {
    recordTreasuryChange(refund);
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the feedback system
 * Should be called once when the game loads
 */
export function initializeFeedbackSystem(): void {
  preloadSounds();
}
