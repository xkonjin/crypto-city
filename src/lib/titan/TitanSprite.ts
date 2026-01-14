/**
 * Titan Sprite System
 *
 * Manages sprite loading, animation state, and rendering for the Titan Pet.
 *
 * This module provides:
 * - Animation type definitions and constants
 * - Sprite path generation following the convention:
 *   /public/Pet/[species]/[alignment]/[animation]_[direction].gif
 * - Sprite loading and caching
 * - Animation state machine with frame management
 * - Placeholder sprite generation for testing
 *
 * "Sprite management is 90% path generation and 10% praying the artist
 * followed the naming convention." - Ancient Web Dev Proverb
 *
 * @see specs/HERO_PET_SYSTEM.md for visual design documentation
 */

import type { TitanSpecies, AlignmentState } from "@/games/isocity/types/titan";

// ============================================================================
// ANIMATION TYPES
// ============================================================================

/**
 * All possible Titan animation states.
 *
 * Core Animations (4 directions each):
 * - idle, walk, run - Movement animations
 * - eat, sleep, sit - Basic needs animations
 *
 * Emotional Animations:
 * - happy, sad, angry, scared, curious - Expression animations
 *
 * Interaction Animations:
 * - pet_reaction, punish_reaction - God Hand responses
 * - learn, help_npc, attack - Action animations
 *
 * Special Animations:
 * - morph_good, morph_evil - Alignment transformation
 * - cast_miracle - Special ability usage
 */
export type TitanAnimation =
  | "idle"
  | "walk"
  | "run"
  | "eat"
  | "sleep"
  | "sit"
  | "happy"
  | "sad"
  | "angry"
  | "scared"
  | "curious"
  | "pet_reaction"
  | "punish_reaction"
  | "learn"
  | "help_npc"
  | "attack"
  | "morph_good"
  | "morph_evil"
  | "cast_miracle";

/**
 * Array of all Titan animations for iteration and validation.
 */
export const ALL_TITAN_ANIMATIONS: TitanAnimation[] = [
  "idle",
  "walk",
  "run",
  "eat",
  "sleep",
  "sit",
  "happy",
  "sad",
  "angry",
  "scared",
  "curious",
  "pet_reaction",
  "punish_reaction",
  "learn",
  "help_npc",
  "attack",
  "morph_good",
  "morph_evil",
  "cast_miracle",
];

/**
 * Essential animations that should be preloaded immediately.
 * Other animations are loaded on demand for performance.
 */
export const ESSENTIAL_ANIMATIONS: TitanAnimation[] = [
  "idle",
  "walk",
  "happy",
  "sad",
];

// ============================================================================
// DIRECTION TYPES
// ============================================================================

/**
 * Cardinal directions for Titan facing and movement.
 */
export type TitanDirection = "north" | "south" | "east" | "west";

/**
 * All directions for iteration.
 */
export const ALL_TITAN_DIRECTIONS: TitanDirection[] = [
  "north",
  "south",
  "east",
  "west",
];

// ============================================================================
// ANIMATION CATEGORIZATION
// ============================================================================

/**
 * Animations that have directional variants (4 directions each).
 * These use sprite paths like: idle_north.gif, walk_south.gif, etc.
 */
export const DIRECTIONAL_ANIMATIONS: TitanAnimation[] = [
  "idle",
  "walk",
  "run",
  "happy",
  "sad",
  "angry",
  "scared",
  "curious",
  "help_npc",
  "attack",
];

/**
 * Animations without directional variants.
 * These use sprite paths like: eat.gif, sleep.gif, etc.
 */
export const NON_DIRECTIONAL_ANIMATIONS: TitanAnimation[] = [
  "eat",
  "sleep",
  "sit",
  "pet_reaction",
  "punish_reaction",
  "learn",
  "morph_good",
  "morph_evil",
  "cast_miracle",
];

/**
 * Animations that loop continuously.
 */
export const LOOPING_ANIMATIONS: TitanAnimation[] = [
  "idle",
  "walk",
  "run",
  "eat",
  "sleep",
  "sit",
  "happy",
  "sad",
  "angry",
  "scared",
  "curious",
];

/**
 * Animations that play once and stop on the last frame.
 */
export const NON_LOOPING_ANIMATIONS: TitanAnimation[] = [
  "pet_reaction",
  "punish_reaction",
  "learn",
  "help_npc",
  "attack",
  "morph_good",
  "morph_evil",
  "cast_miracle",
];

// ============================================================================
// ANIMATION FRAME CONFIGURATION
// ============================================================================

/**
 * Number of frames for each animation type.
 * Based on spec requirements.
 */
export const ANIMATION_FRAME_COUNTS: Record<TitanAnimation, number> = {
  idle: 8,
  walk: 8,
  run: 8,
  eat: 12,
  sleep: 4,
  sit: 4,
  happy: 8,
  sad: 8,
  angry: 8,
  scared: 6,
  curious: 6,
  pet_reaction: 8,
  punish_reaction: 8,
  learn: 6,
  help_npc: 8,
  attack: 10,
  morph_good: 16,
  morph_evil: 16,
  cast_miracle: 12,
};

/**
 * Duration of each frame in milliseconds.
 * Lower values = faster animation.
 */
export const ANIMATION_FRAME_DURATION: Record<TitanAnimation, number> = {
  idle: 150, // Slow breathing animation
  walk: 100, // Normal walking pace
  run: 75, // Fast running
  eat: 120, // Moderate eating pace
  sleep: 300, // Very slow, relaxed
  sit: 200, // Slow, settled
  happy: 80, // Bouncy, energetic
  sad: 150, // Slow, droopy
  angry: 80, // Fast, aggressive
  scared: 100, // Quick, nervous
  curious: 120, // Moderate, inquisitive
  pet_reaction: 100, // Responsive
  punish_reaction: 100, // Responsive
  learn: 120, // Moderate
  help_npc: 100, // Active
  attack: 60, // Very fast combat
  morph_good: 100, // Dramatic transformation
  morph_evil: 100, // Dramatic transformation
  cast_miracle: 80, // Flashy effect
};

// ============================================================================
// SPRITE PATH FUNCTIONS
// ============================================================================

/**
 * Generate the sprite path for a directional animation.
 *
 * Path format: /Pet/[species]/[alignment]/[animation]_[direction].gif
 *
 * @example
 * getTitanSpritePath('doge', 'neutral', 'idle', 'south')
 * // Returns: '/Pet/doge/neutral/idle_south.gif'
 */
export function getTitanSpritePath(
  species: TitanSpecies,
  alignment: AlignmentState,
  animation: TitanAnimation,
  direction: TitanDirection
): string {
  return `/Pet/${species}/${alignment}/${animation}_${direction}.gif`;
}

/**
 * Generate the sprite path for a non-directional animation.
 *
 * Path format: /Pet/[species]/[alignment]/[animation].gif
 *
 * @example
 * getTitanSpritePathNoDirection('doge', 'neutral', 'eat')
 * // Returns: '/Pet/doge/neutral/eat.gif'
 */
export function getTitanSpritePathNoDirection(
  species: TitanSpecies,
  alignment: AlignmentState,
  animation: TitanAnimation
): string {
  return `/Pet/${species}/${alignment}/${animation}.gif`;
}

/**
 * Check if an animation is directional.
 */
export function isDirectionalAnimation(animation: TitanAnimation): boolean {
  return DIRECTIONAL_ANIMATIONS.includes(animation);
}

/**
 * Get the appropriate sprite path based on whether the animation is directional.
 */
export function getSpritePath(
  species: TitanSpecies,
  alignment: AlignmentState,
  animation: TitanAnimation,
  direction: TitanDirection
): string {
  if (isDirectionalAnimation(animation)) {
    return getTitanSpritePath(species, alignment, animation, direction);
  }
  return getTitanSpritePathNoDirection(species, alignment, animation);
}

// ============================================================================
// DIRECTION CALCULATION
// ============================================================================

/**
 * Calculate direction based on movement delta.
 *
 * Uses the larger axis to determine primary direction.
 * Returns 'south' as default for no movement (standard facing direction).
 *
 * @param dx - Change in X position (positive = east, negative = west)
 * @param dy - Change in Y position (positive = south, negative = north)
 */
export function getDirectionFromDelta(
  dx: number,
  dy: number
): TitanDirection {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // No movement - default to south (standard facing direction)
  if (absDx === 0 && absDy === 0) {
    return "south";
  }

  // Horizontal movement is dominant
  if (absDx > absDy) {
    return dx > 0 ? "east" : "west";
  }

  // Vertical movement is dominant or equal
  return dy > 0 ? "south" : "north";
}

/**
 * Get direction from source to target position.
 *
 * @param from - Starting position
 * @param to - Target position
 */
export function getDirectionToTarget(
  from: { x: number; y: number },
  to: { x: number; y: number }
): TitanDirection {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return getDirectionFromDelta(dx, dy);
}

// ============================================================================
// SPRITE LOADER CLASS
// ============================================================================

/**
 * Manages sprite loading and caching for Titan rendering.
 *
 * Features:
 * - Asynchronous sprite loading
 * - In-memory caching of loaded sprites
 * - Preloading for alignment transitions
 * - Cache management for memory efficiency
 *
 * "Loading sprites is like loading promises - you never know
 * when they'll resolve, but you hope it's before render time."
 */
export class TitanSpriteLoader {
  /** Cache of loaded sprites keyed by path */
  private loadedSprites: Map<string, HTMLImageElement>;

  /** Promises for sprites currently being loaded */
  private loadingPromises: Map<string, Promise<HTMLImageElement>>;

  constructor() {
    this.loadedSprites = new Map();
    this.loadingPromises = new Map();
  }

  /**
   * Load a single sprite asynchronously.
   *
   * @param path - Sprite path (relative to public directory)
   * @returns Promise resolving to the loaded image element
   */
  async loadSprite(path: string): Promise<HTMLImageElement> {
    // Return cached sprite if already loaded
    const cached = this.loadedSprites.get(path);
    if (cached) {
      return cached;
    }

    // Return existing promise if already loading
    const loading = this.loadingPromises.get(path);
    if (loading) {
      return loading;
    }

    // Start new load
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.loadedSprites.set(path, img);
        this.loadingPromises.delete(path);
        resolve(img);
      };

      img.onerror = () => {
        this.loadingPromises.delete(path);
        reject(new Error(`Failed to load sprite: ${path}`));
      };

      img.src = path;
    });

    this.loadingPromises.set(path, promise);
    return promise;
  }

  /**
   * Preload all sprites for a species/alignment combination.
   *
   * Useful when Titan alignment is about to change or when
   * initially spawning a Titan.
   */
  async preloadForAlignment(
    species: TitanSpecies,
    alignment: AlignmentState
  ): Promise<void> {
    const loadPromises: Promise<HTMLImageElement>[] = [];

    for (const animation of ALL_TITAN_ANIMATIONS) {
      if (isDirectionalAnimation(animation)) {
        // Load all 4 directions for directional animations
        for (const direction of ALL_TITAN_DIRECTIONS) {
          const path = getTitanSpritePath(
            species,
            alignment,
            animation,
            direction
          );
          loadPromises.push(this.loadSprite(path).catch(() => {
            // Silently handle load failures - placeholder will be used
            return new Image();
          }));
        }
      } else {
        // Load single sprite for non-directional animations
        const path = getTitanSpritePathNoDirection(species, alignment, animation);
        loadPromises.push(this.loadSprite(path).catch(() => {
          return new Image();
        }));
      }
    }

    await Promise.all(loadPromises);
  }

  /**
   * Get a loaded sprite synchronously.
   *
   * @returns The loaded image, or null if not yet loaded
   */
  getSprite(path: string): HTMLImageElement | null {
    return this.loadedSprites.get(path) ?? null;
  }

  /**
   * Check if a sprite is loaded and ready.
   */
  isLoaded(path: string): boolean {
    return this.loadedSprites.has(path);
  }

  /**
   * Check if a sprite is currently being loaded.
   */
  isLoading(path: string): boolean {
    return this.loadingPromises.has(path);
  }

  /**
   * Clear all cached sprites.
   *
   * Useful for memory management when changing scenes or
   * when sprites need to be reloaded.
   */
  clearCache(): void {
    this.loadedSprites.clear();
    // Note: Loading promises are not cancelled, they will
    // simply not cache their results
  }

  /**
   * Clear cached sprites for a specific species/alignment.
   *
   * Useful when alignment changes and old sprites are no longer needed.
   */
  clearForAlignment(
    species: TitanSpecies,
    alignment: AlignmentState
  ): void {
    const prefix = `/Pet/${species}/${alignment}/`;

    for (const path of this.loadedSprites.keys()) {
      if (path.startsWith(prefix)) {
        this.loadedSprites.delete(path);
      }
    }
  }

  /**
   * Get the number of currently cached sprites.
   */
  getCacheSize(): number {
    return this.loadedSprites.size;
  }

  /**
   * Preload only essential animations for the current alignment.
   * Loads idle, walk, happy, sad animations for better performance.
   * Other animations are loaded on demand.
   * 
   * @param species - Titan species
   * @param alignment - Current alignment state
   */
  async preloadCurrentAlignment(
    species: TitanSpecies,
    alignment: AlignmentState
  ): Promise<void> {
    const loadPromises: Promise<HTMLImageElement>[] = [];

    for (const animation of ESSENTIAL_ANIMATIONS) {
      if (isDirectionalAnimation(animation)) {
        for (const direction of ALL_TITAN_DIRECTIONS) {
          const path = getTitanSpritePath(species, alignment, animation, direction);
          loadPromises.push(this.loadSprite(path).catch(() => {
            // Silent fail, use placeholder
            return new Image();
          }));
        }
      } else {
        const path = getTitanSpritePathNoDirection(species, alignment, animation);
        loadPromises.push(this.loadSprite(path).catch(() => {
          return new Image();
        }));
      }
    }

    await Promise.all(loadPromises);
  }

  /**
   * Load a sprite on demand with graceful fallback.
   * Returns cached sprite if available, null if still loading,
   * or starts loading and returns null.
   * 
   * @param path - Sprite path to load
   * @returns Loaded sprite, or null if not yet available
   */
  async loadOnDemand(path: string): Promise<HTMLImageElement | null> {
    // Return cached sprite immediately
    if (this.isLoaded(path)) {
      return this.getSprite(path);
    }

    // Return null if already loading (caller should use placeholder)
    if (this.isLoading(path)) {
      return null;
    }

    // Start loading
    try {
      return await this.loadSprite(path);
    } catch {
      // Use placeholder on failure
      return null;
    }
  }
}

// ============================================================================
// ANIMATION STATE CLASS
// ============================================================================

/**
 * Manages animation state for a Titan.
 *
 * Handles:
 * - Current animation and direction tracking
 * - Frame advancement based on time
 * - Animation looping for continuous animations
 * - Completion detection for one-shot animations
 *
 * "Animation state machines are like state machines,
 * but with more frames and less existential dread."
 */
export class TitanAnimationState {
  /** Current animation being played */
  private currentAnimation: TitanAnimation;

  /** Current facing direction */
  private currentDirection: TitanDirection;

  /** Current frame index (0-based) */
  private currentFrame: number;

  /** Accumulated time in current frame (ms) */
  private frameTime: number;

  /** Whether the animation has completed (for non-looping) */
  private completed: boolean;

  constructor(
    initialAnimation: TitanAnimation = "idle",
    initialDirection: TitanDirection = "south"
  ) {
    this.currentAnimation = initialAnimation;
    this.currentDirection = initialDirection;
    this.currentFrame = 0;
    this.frameTime = 0;
    this.completed = false;
  }

  /**
   * Set a new animation, resetting frame to 0.
   */
  setAnimation(animation: TitanAnimation): void {
    if (this.currentAnimation !== animation) {
      this.currentAnimation = animation;
      this.currentFrame = 0;
      this.frameTime = 0;
      this.completed = false;
    }
  }

  /**
   * Set the facing direction.
   */
  setDirection(direction: TitanDirection): void {
    this.currentDirection = direction;
  }

  /**
   * Update animation state based on elapsed time.
   *
   * @param deltaMs - Time elapsed since last update (milliseconds)
   */
  update(deltaMs: number): void {
    // Ignore negative delta (shouldn't happen but be safe)
    if (deltaMs <= 0) {
      return;
    }

    // Don't update if animation is complete (non-looping only)
    if (this.completed) {
      return;
    }

    const frameDuration = ANIMATION_FRAME_DURATION[this.currentAnimation];
    const totalFrames = ANIMATION_FRAME_COUNTS[this.currentAnimation];
    const isLooping = TitanAnimationState.isLoopingAnimation(
      this.currentAnimation
    );

    // Accumulate time
    this.frameTime += deltaMs;

    // Advance frames
    while (this.frameTime >= frameDuration) {
      this.frameTime -= frameDuration;
      this.currentFrame++;

      // Handle frame overflow
      if (this.currentFrame >= totalFrames) {
        if (isLooping) {
          // Loop back to start
          this.currentFrame = 0;
        } else {
          // Stop at last frame
          this.currentFrame = totalFrames - 1;
          this.completed = true;
          break;
        }
      }
    }
  }

  /**
   * Get the current frame index.
   */
  getCurrentFrame(): number {
    return this.currentFrame;
  }

  /**
   * Get the current animation type.
   */
  getCurrentAnimation(): TitanAnimation {
    return this.currentAnimation;
  }

  /**
   * Get the current facing direction.
   */
  getCurrentDirection(): TitanDirection {
    return this.currentDirection;
  }

  /**
   * Check if the animation has completed (non-looping only).
   *
   * Looping animations always return false.
   */
  isComplete(): boolean {
    if (TitanAnimationState.isLoopingAnimation(this.currentAnimation)) {
      return false;
    }
    return this.completed;
  }

  /**
   * Reset the animation to its initial state.
   */
  reset(): void {
    this.currentFrame = 0;
    this.frameTime = 0;
    this.completed = false;
  }

  /**
   * Get total number of frames for current animation.
   */
  getTotalFrames(): number {
    return ANIMATION_FRAME_COUNTS[this.currentAnimation];
  }

  /**
   * Get frame duration for current animation.
   */
  getFrameDuration(): number {
    return ANIMATION_FRAME_DURATION[this.currentAnimation];
  }

  /**
   * Check if an animation loops.
   *
   * @param animation - Animation to check
   * @returns true if the animation loops, false if it plays once
   */
  static isLoopingAnimation(animation: TitanAnimation): boolean {
    return LOOPING_ANIMATIONS.includes(animation);
  }

  /**
   * Check if an animation is directional.
   *
   * @param animation - Animation to check
   * @returns true if the animation has directional variants
   */
  static isDirectionalAnimation(animation: TitanAnimation): boolean {
    return DIRECTIONAL_ANIMATIONS.includes(animation);
  }
}

// ============================================================================
// PLACEHOLDER SPRITE GENERATION
// ============================================================================

/**
 * Color mapping for alignment-based placeholder sprites.
 *
 * These are used when actual sprites aren't available,
 * providing visual feedback during development and testing.
 */
export const ALIGNMENT_PLACEHOLDER_COLORS: Record<AlignmentState, string> = {
  angelic: "#ffd700", // Gold - divine radiance
  good: "#32cd32", // Green - natural goodness
  neutral: "#808080", // Gray - balanced, uncommitted
  evil: "#ff4500", // Red-orange - aggressive, dangerous
  demonic: "#1a1a1a", // Near-black - dark, malevolent
};

/**
 * Species initial letters for placeholder identification.
 */
const SPECIES_INITIALS: Record<TitanSpecies, string> = {
  doge: "D",
  bull: "B",
  bear: "R",
  ape: "A",
  whale: "W",
  phoenix: "P",
};

/**
 * Create a placeholder sprite for development/testing.
 *
 * Generates a simple canvas with:
 * - Circle shape representing the Titan
 * - Color based on alignment
 * - Species initial in the center
 *
 * @param species - Titan species
 * @param alignment - Current alignment state
 * @param size - Sprite size in pixels (default: 64)
 * @returns Canvas element with placeholder graphic
 */
export function createPlaceholderSprite(
  species: TitanSpecies,
  alignment: AlignmentState,
  size: number = 64
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;

  // Background color based on alignment
  const color = ALIGNMENT_PLACEHOLDER_COLORS[alignment];

  // Draw circle body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Add outline
  ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw species initial
  const initial = SPECIES_INITIALS[species];
  ctx.fillStyle = alignment === "demonic" ? "#ffffff" : "#000000";
  ctx.font = `bold ${size * 0.35}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initial, centerX, centerY);

  // Add alignment indicator ring
  if (alignment === "angelic") {
    // Halo effect
    ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - radius * 0.7, radius * 0.4, radius * 0.15, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (alignment === "demonic") {
    // Horns effect (simple triangles)
    ctx.fillStyle = "#8b0000";
    ctx.beginPath();
    ctx.moveTo(centerX - radius * 0.5, centerY - radius * 0.7);
    ctx.lineTo(centerX - radius * 0.3, centerY - radius);
    ctx.lineTo(centerX - radius * 0.2, centerY - radius * 0.6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(centerX + radius * 0.5, centerY - radius * 0.7);
    ctx.lineTo(centerX + radius * 0.3, centerY - radius);
    ctx.lineTo(centerX + radius * 0.2, centerY - radius * 0.6);
    ctx.fill();
  }

  return canvas;
}

/**
 * Convert a placeholder canvas to an Image element.
 *
 * Useful when the sprite system expects HTMLImageElement.
 */
export function placeholderToImage(canvas: HTMLCanvasElement): HTMLImageElement {
  const img = new Image();
  img.src = canvas.toDataURL();
  return img;
}
