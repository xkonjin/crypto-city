/**
 * Rug Pull Effect System (Issue #47)
 * 
 * Handles the visual and audio effects for rug pull events.
 * Provides quips, types, and utility functions for rug pull animations.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface RugPullEvent {
  buildingName: string;
  position: { x: number; y: number };
  treasuryLoss: number;
  cobieQuip: string;
}

export interface RugPullAnimationState {
  phase: 'idle' | 'warning' | 'collapse' | 'aftermath' | 'complete';
  startTime: number;
  position: { x: number; y: number };
  buildingName: string;
  treasuryLoss: number;
}

// =============================================================================
// COBIE QUIPS
// =============================================================================

/**
 * Sardonic Cobie-style quips for rug pull events.
 * These provide dark humor commentary on the crypto space.
 */
export const RUG_QUIPS: string[] = [
  "Funds are safu... oh wait.",
  "The probability of that happening was supposed to be near zero.",
  "Risk management is for cowards, right?",
  "Another one bites the dust.",
  "NGMI.",
  "Have fun staying poor.",
  "This is good for Bitcoin, somehow.",
  "You were the exit liquidity.",
  "Diamond hands turned to dust.",
  "At least you learned something. Maybe.",
  "The devs did say 'trust us'.",
  "Audit? What audit?",
  "Anonymous team was actually a red flag. Who knew?",
  "Your $100k NFT is now a $100k lesson.",
  "To the moon was really to the floor.",
  "Smart contracts, dumb decisions.",
  "The roadmap led here. Surprise!",
  "Community-driven, straight into the ground.",
  "DYOR meant don't yolo on rugs.",
  "The whitepaper promised so much.",
  "Tokenomics: 100% to founder wallet.",
  "Liquidity? Gone. Hotel? Trivago.",
  "This wasn't the airdrop you expected.",
  "Buy the dip? There is no dip. Only void.",
  "Your portfolio speedran going to zero.",
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get a random Cobie quip for a rug pull event
 */
export function getRandomRugQuip(): string {
  const index = Math.floor(Math.random() * RUG_QUIPS.length);
  return RUG_QUIPS[index];
}

/**
 * Create a rug pull event from building data
 */
export function createRugPullEvent(
  buildingName: string,
  position: { x: number; y: number },
  treasuryLoss: number
): RugPullEvent {
  return {
    buildingName,
    position,
    treasuryLoss,
    cobieQuip: getRandomRugQuip(),
  };
}

/**
 * Calculate screen shake intensity based on treasury loss
 * Returns a value from 0 to 1 representing shake magnitude
 */
export function calculateShakeIntensity(treasuryLoss: number): number {
  // Scale: $1k = 0.2, $10k = 0.5, $50k = 0.8, $100k+ = 1.0
  const normalizedLoss = treasuryLoss / 100000;
  return Math.min(1, Math.max(0.2, normalizedLoss * 1.5 + 0.2));
}

/**
 * Get CSS transform for shake effect based on intensity
 */
export function getShakeTransform(intensity: number, time: number): string {
  const amplitude = intensity * 8;
  const frequency = 15;
  const x = Math.sin(time * frequency) * amplitude;
  const y = Math.cos(time * frequency * 1.3) * amplitude * 0.7;
  const rotation = Math.sin(time * frequency * 0.9) * intensity * 2;
  return `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
}

// =============================================================================
// ANIMATION PHASE DURATIONS
// =============================================================================

export const ANIMATION_PHASES = {
  warning: {
    duration: 1000, // 1 second
    description: 'Building flashes red, warning icon appears',
  },
  collapse: {
    duration: 1500, // 1.5 seconds
    description: 'Building shakes, then collapses/implodes',
  },
  aftermath: {
    duration: 2000, // 2 seconds
    description: 'Smoke particles, RUGGED! text',
  },
  screenShake: {
    duration: 500, // 0.5 seconds
    description: 'Brief screen shake based on treasury loss',
  },
  toastAutoClose: {
    duration: 5000, // 5 seconds
    description: 'Toast auto-dismisses after this time',
  },
} as const;

/**
 * Get total animation duration (all phases)
 */
export function getTotalAnimationDuration(): number {
  return (
    ANIMATION_PHASES.warning.duration +
    ANIMATION_PHASES.collapse.duration +
    ANIMATION_PHASES.aftermath.duration
  );
}

// =============================================================================
// EVENT QUEUE
// =============================================================================

/**
 * Manages a queue of rug pull events for sequential processing
 */
export class RugPullQueue {
  private queue: RugPullEvent[] = [];
  private processing = false;
  private onProcess: ((event: RugPullEvent) => Promise<void>) | null = null;

  /**
   * Set the callback for processing rug pull events
   */
  setProcessor(callback: (event: RugPullEvent) => Promise<void>): void {
    this.onProcess = callback;
  }

  /**
   * Add an event to the queue
   */
  enqueue(event: RugPullEvent): void {
    this.queue.push(event);
    this.processNext();
  }

  /**
   * Process the next event in the queue
   */
  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0 || !this.onProcess) {
      return;
    }

    this.processing = true;
    const event = this.queue.shift()!;

    try {
      await this.onProcess(event);
    } catch (error) {
      console.error('[RugPullQueue] Error processing event:', error);
    }

    this.processing = false;

    // Process next event after animation completes
    if (this.queue.length > 0) {
      setTimeout(() => this.processNext(), 500);
    }
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.processing = false;
  }

  /**
   * Get queue length
   */
  get length(): number {
    return this.queue.length;
  }
}

// Named exports are preferred - the default export below is for convenience
const rugPullEffectModule = {
  RUG_QUIPS,
  getRandomRugQuip,
  createRugPullEvent,
  calculateShakeIntensity,
  getShakeTransform,
  ANIMATION_PHASES,
  getTotalAnimationDuration,
  RugPullQueue,
};

export default rugPullEffectModule;
