/**
 * Titan Visual Effects System
 *
 * Manages alignment-based visual morphing for the Titan Pet, including:
 * - Alignment visual properties (colors, glow, particles)
 * - Alignment transition management with smooth interpolation
 * - Particle effect system for alignment auras
 * - Canvas rendering helpers for glow and particle effects
 *
 * "Visual effects are like makeup for your Titan - they make it look
 * angelic or demonic depending on its life choices."
 *
 * @see specs/HERO_PET_SYSTEM.md Section 2.2 for visual morphing documentation
 */

import type { AlignmentState, TitanPet } from "@/games/isocity/types/titan";
import type { TitanAnimation } from "./TitanSprite";
import { getAlignmentState } from "./TitanAlignment";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Duration of alignment visual transitions in milliseconds.
 * This is how long it takes to morph between alignment states.
 */
export const TRANSITION_DURATION_MS = 1500;

/**
 * Maximum number of particles to maintain for performance.
 * Prevents particle explosion from tanking frame rate.
 */
export const MAX_PARTICLES = 100;

/**
 * Particle spawn rate (particles per second) for each alignment type.
 */
const PARTICLE_SPAWN_RATES: Record<AlignmentState, number> = {
  angelic: 8,
  good: 4,
  neutral: 0,
  evil: 6,
  demonic: 10,
};

/**
 * Particle lifetime in milliseconds.
 */
const PARTICLE_LIFETIME_MS = 2000;

/**
 * Particle decay rate per millisecond.
 */
const PARTICLE_DECAY_RATE = 1 / PARTICLE_LIFETIME_MS;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Visual properties for a specific alignment state.
 * Defines colors, glow effects, and particle characteristics.
 */
export interface AlignmentVisualProperties {
  /** Main tint color for the Titan */
  primaryColor: string;
  /** Accent color for highlights */
  secondaryColor: string;
  /** Aura/glow color */
  glowColor: string;
  /** Glow strength from 0 (none) to 1 (maximum) */
  glowIntensity: number;
  /** Particle effect color */
  particleColor: string;
  /** Type of particle effect */
  particleType: "sparkle" | "fire" | "none";
  /** CSS filter for tinting the sprite */
  spriteFilter: string;
}

/**
 * Represents an alignment transition in progress.
 */
export interface AlignmentTransition {
  /** Starting alignment state */
  fromState: AlignmentState;
  /** Target alignment state */
  toState: AlignmentState;
  /** Current progress from 0 to 1 */
  progress: number;
  /** Total duration in milliseconds */
  duration: number;
  /** Timestamp when transition started */
  startTime: number;
}

/**
 * A single alignment particle for visual effects.
 */
export interface AlignmentParticle {
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** X velocity */
  vx: number;
  /** Y velocity */
  vy: number;
  /** Life remaining from 0 (dead) to 1 (full) */
  life: number;
  /** Particle color */
  color: string;
  /** Particle size in pixels */
  size: number;
  /** Particle type determines rendering style */
  type: "sparkle" | "fire";
}

// ============================================================================
// ALIGNMENT VISUAL DEFINITIONS
// ============================================================================

/**
 * Visual properties for each alignment state.
 * Based on spec requirements in HERO_PET_SYSTEM.md Section 2.2.
 */
export const ALIGNMENT_VISUALS: Record<AlignmentState, AlignmentVisualProperties> = {
  angelic: {
    primaryColor: "#FFD700", // Gold
    secondaryColor: "#FFFFFF", // White
    glowColor: "rgba(255, 215, 0, 0.5)",
    glowIntensity: 0.8,
    particleColor: "#FFD700",
    particleType: "sparkle",
    spriteFilter: "brightness(1.2) sepia(0.2)",
  },
  good: {
    primaryColor: "#90EE90", // Light green
    secondaryColor: "#98FB98",
    glowColor: "rgba(144, 238, 144, 0.3)",
    glowIntensity: 0.4,
    particleColor: "#90EE90",
    particleType: "sparkle",
    spriteFilter: "brightness(1.1)",
  },
  neutral: {
    primaryColor: "#808080", // Gray
    secondaryColor: "#A9A9A9",
    glowColor: "transparent",
    glowIntensity: 0,
    particleColor: "#808080",
    particleType: "none",
    spriteFilter: "none",
  },
  evil: {
    primaryColor: "#DC143C", // Crimson
    secondaryColor: "#8B0000",
    glowColor: "rgba(220, 20, 60, 0.3)",
    glowIntensity: 0.4,
    particleColor: "#DC143C",
    particleType: "fire",
    spriteFilter: "brightness(0.9) saturate(1.3)",
  },
  demonic: {
    primaryColor: "#1C1C1C", // Near black
    secondaryColor: "#8B0000", // Dark red accents
    glowColor: "rgba(139, 0, 0, 0.6)",
    glowIntensity: 0.7,
    particleColor: "#FF4500", // Orange-red fire
    particleType: "fire",
    spriteFilter: "brightness(0.7) contrast(1.2) saturate(1.5)",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get alignment visual properties based on numeric alignment value.
 *
 * @param alignment - Numeric alignment value from -1.0 to +1.0
 * @returns The visual properties for the corresponding alignment state
 */
export function getAlignmentVisualsForValue(
  alignment: number
): AlignmentVisualProperties {
  const state = getAlignmentState(alignment);
  return ALIGNMENT_VISUALS[state];
}

/**
 * Parse a hex color string to RGB components.
 *
 * @param hex - Hex color string like "#FF0000" or "#ff0000"
 * @returns Object with r, g, b values (0-255)
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace("#", "");
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

/**
 * Convert RGB components to hex color string.
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string like "#FF0000"
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Parse an rgba color string to components.
 *
 * @param rgba - rgba color string like "rgba(255, 0, 0, 0.5)"
 * @returns Object with r, g, b, a values
 */
function parseRgbaColor(
  rgba: string
): { r: number; g: number; b: number; a: number } | null {
  const match = rgba.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (!match) return null;
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1,
  };
}

/**
 * Convert RGBA components to rgba string.
 */
function rgbaToString(r: number, g: number, b: number, a: number): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(2)})`;
}

// ============================================================================
// INTERPOLATION FUNCTIONS
// ============================================================================

/**
 * Interpolate between two colors.
 *
 * Supports hex colors (#RRGGBB) and rgba colors.
 *
 * @param color1 - Starting color
 * @param color2 - Ending color
 * @param progress - Interpolation progress from 0 to 1
 * @returns Interpolated color string
 */
export function interpolateColor(
  color1: string,
  color2: string,
  progress: number
): string {
  // Clamp progress to 0-1
  const t = Math.max(0, Math.min(1, progress));

  // Return endpoints for 0 and 1
  if (t === 0) return color1;
  if (t === 1) return color2;

  // Check if rgba format
  const rgba1 = parseRgbaColor(color1);
  const rgba2 = parseRgbaColor(color2);

  if (rgba1 && rgba2) {
    // Interpolate rgba
    const r = rgba1.r + (rgba2.r - rgba1.r) * t;
    const g = rgba1.g + (rgba2.g - rgba1.g) * t;
    const b = rgba1.b + (rgba2.b - rgba1.b) * t;
    const a = rgba1.a + (rgba2.a - rgba1.a) * t;
    return rgbaToString(r, g, b, a);
  }

  // Handle hex colors
  if (color1.startsWith("#") && color2.startsWith("#")) {
    const hex1 = parseHexColor(color1);
    const hex2 = parseHexColor(color2);

    const r = hex1.r + (hex2.r - hex1.r) * t;
    const g = hex1.g + (hex2.g - hex1.g) * t;
    const b = hex1.b + (hex2.b - hex1.b) * t;

    return rgbToHex(r, g, b);
  }

  // Fallback: return target color at midpoint
  return t < 0.5 ? color1 : color2;
}

/**
 * Interpolate between two visual property sets.
 *
 * Colors are interpolated smoothly, while discrete properties (particleType,
 * spriteFilter) switch at the halfway point.
 *
 * @param from - Starting visual properties
 * @param to - Ending visual properties
 * @param progress - Interpolation progress from 0 to 1
 * @returns Interpolated visual properties
 */
export function interpolateVisuals(
  from: AlignmentVisualProperties,
  to: AlignmentVisualProperties,
  progress: number
): AlignmentVisualProperties {
  // Clamp progress
  const t = Math.max(0, Math.min(1, progress));

  return {
    primaryColor: interpolateColor(from.primaryColor, to.primaryColor, t),
    secondaryColor: interpolateColor(from.secondaryColor, to.secondaryColor, t),
    glowColor: interpolateColor(from.glowColor, to.glowColor, t),
    glowIntensity: from.glowIntensity + (to.glowIntensity - from.glowIntensity) * t,
    particleColor: interpolateColor(from.particleColor, to.particleColor, t),
    // Discrete properties switch at halfway point
    particleType: t < 0.5 ? from.particleType : to.particleType,
    spriteFilter: t < 0.5 ? from.spriteFilter : to.spriteFilter,
  };
}

// ============================================================================
// MORPH ANIMATION TRIGGERS
// ============================================================================

/**
 * Check if an alignment change should trigger a morph animation.
 *
 * Triggers when alignment crosses a threshold between states.
 *
 * @param oldAlignment - Previous alignment value
 * @param newAlignment - New alignment value
 * @returns Trigger info or null if no trigger needed
 */
export function shouldTriggerMorphAnimation(
  oldAlignment: number,
  newAlignment: number
): { trigger: boolean; direction: "good" | "evil" } | null {
  const oldState = getAlignmentState(oldAlignment);
  const newState = getAlignmentState(newAlignment);

  // No trigger if state hasn't changed
  if (oldState === newState) {
    return null;
  }

  // Determine direction based on alignment change
  const direction = newAlignment < oldAlignment ? "good" : "evil";

  return { trigger: true, direction };
}

/**
 * Get the appropriate morph animation for a direction.
 *
 * @param direction - Whether morphing toward good or evil
 * @returns The animation to play
 */
export function getMorphAnimation(direction: "good" | "evil"): TitanAnimation {
  return direction === "good" ? "morph_good" : "morph_evil";
}

// ============================================================================
// ALIGNMENT TRANSITION MANAGER CLASS
// ============================================================================

/**
 * Manages alignment visual transitions with smooth interpolation.
 *
 * Handles:
 * - Detecting when alignment crosses thresholds
 * - Managing transition progress over time
 * - Providing interpolated visual properties during transitions
 *
 * "Transitions are like metamorphosis - your Titan doesn't just flip
 * from good to evil, it slowly transforms before your eyes."
 */
export class AlignmentTransitionManager {
  private currentTransition: AlignmentTransition | null = null;
  private currentAlignmentState: AlignmentState = "neutral";
  private previousAlignmentValue: number = 0;

  constructor() {
    // Initialize with neutral state
  }

  /**
   * Set the current alignment state (for visuals when not transitioning).
   */
  setCurrentAlignment(state: AlignmentState): void {
    this.currentAlignmentState = state;
  }

  /**
   * Check if an alignment change requires a visual transition.
   *
   * @param oldAlignment - Previous alignment value
   * @param newAlignment - New alignment value
   * @returns Transition info or null if no transition needed
   */
  checkForTransition(
    oldAlignment: number,
    newAlignment: number
  ): AlignmentTransition | null {
    const oldState = getAlignmentState(oldAlignment);
    const newState = getAlignmentState(newAlignment);

    // No transition if state hasn't changed
    if (oldState === newState) {
      return null;
    }

    return {
      fromState: oldState,
      toState: newState,
      progress: 0,
      duration: TRANSITION_DURATION_MS,
      startTime: Date.now(),
    };
  }

  /**
   * Start a new visual transition.
   *
   * @param from - Starting alignment state
   * @param to - Target alignment state
   */
  startTransition(from: AlignmentState, to: AlignmentState): void {
    this.currentTransition = {
      fromState: from,
      toState: to,
      progress: 0,
      duration: TRANSITION_DURATION_MS,
      startTime: Date.now(),
    };
    this.currentAlignmentState = from;
  }

  /**
   * Update the transition progress.
   *
   * @param deltaMs - Time elapsed since last update in milliseconds
   */
  update(deltaMs: number): void {
    if (!this.currentTransition) {
      return;
    }

    // Ignore negative or zero delta
    if (deltaMs <= 0) {
      return;
    }

    // Update progress
    const progressDelta = deltaMs / this.currentTransition.duration;
    this.currentTransition.progress = Math.min(
      1,
      this.currentTransition.progress + progressDelta
    );

    // Complete transition if done
    if (this.currentTransition.progress >= 1) {
      this.currentAlignmentState = this.currentTransition.toState;
      this.currentTransition = null;
    }
  }

  /**
   * Get interpolated visual properties.
   *
   * @returns Current visual properties, interpolated if transitioning
   */
  getInterpolatedVisuals(): AlignmentVisualProperties {
    if (!this.currentTransition) {
      return ALIGNMENT_VISUALS[this.currentAlignmentState];
    }

    const from = ALIGNMENT_VISUALS[this.currentTransition.fromState];
    const to = ALIGNMENT_VISUALS[this.currentTransition.toState];

    return interpolateVisuals(from, to, this.currentTransition.progress);
  }

  /**
   * Check if a transition is currently in progress.
   */
  isTransitioning(): boolean {
    return this.currentTransition !== null;
  }

  /**
   * Get the current transition progress (0-1).
   */
  getProgress(): number {
    return this.currentTransition?.progress ?? 0;
  }

  /**
   * Get the current transition details.
   */
  getCurrentTransition(): AlignmentTransition | null {
    return this.currentTransition;
  }
}

// ============================================================================
// ALIGNMENT PARTICLE SYSTEM CLASS
// ============================================================================

/**
 * Manages particle effects for alignment auras.
 *
 * Creates sparkle particles for good alignments and fire particles
 * for evil alignments. Neutral alignment produces no particles.
 *
 * "Particles are the visual poetry of alignment - sparkles for saints,
 * flames for fiends, and nothing for those who can't make up their minds."
 */
export class AlignmentParticleSystem {
  private particles: AlignmentParticle[] = [];
  private alignment: AlignmentState;
  private spawnAccumulator: number = 0;
  private titanPosition: { x: number; y: number } = { x: 0, y: 0 };

  constructor(alignment: AlignmentState) {
    this.alignment = alignment;
  }

  /**
   * Update the alignment, which changes particle properties.
   */
  setAlignment(alignment: AlignmentState): void {
    this.alignment = alignment;
  }

  /**
   * Check if particles should be active for current alignment.
   */
  isActive(): boolean {
    return this.alignment !== "neutral";
  }

  /**
   * Update particle positions and lifecycle.
   *
   * @param deltaMs - Time elapsed since last update
   * @param titanPosition - Current Titan position for spawning
   */
  update(
    deltaMs: number,
    titanPosition: { x: number; y: number }
  ): void {
    this.titanPosition = titanPosition;

    // Spawn new particles based on spawn rate
    if (this.isActive()) {
      const spawnRate = PARTICLE_SPAWN_RATES[this.alignment];
      this.spawnAccumulator += (deltaMs / 1000) * spawnRate;

      while (this.spawnAccumulator >= 1 && this.particles.length < MAX_PARTICLES) {
        this.spawnParticle();
        this.spawnAccumulator -= 1;
      }
    }

    // Update existing particles
    const decayAmount = PARTICLE_DECAY_RATE * deltaMs;

    this.particles = this.particles.filter((particle) => {
      // Update position based on velocity
      particle.x += particle.vx * (deltaMs / 1000);
      particle.y += particle.vy * (deltaMs / 1000);

      // Decay life
      particle.life -= decayAmount;

      // Keep particle if still alive
      return particle.life > 0;
    });
  }

  /**
   * Get all current particles for rendering.
   */
  getParticles(): AlignmentParticle[] {
    return this.particles;
  }

  /**
   * Spawn a burst of particles (useful for transitions).
   *
   * @param count - Number of particles to spawn
   */
  spawnBurst(count: number): void {
    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      this.spawnParticle();
    }
  }

  /**
   * Spawn a single particle with properties based on alignment.
   */
  private spawnParticle(): void {
    if (!this.isActive()) {
      return;
    }

    const visuals = ALIGNMENT_VISUALS[this.alignment];
    const particleType = visuals.particleType;

    if (particleType === "none") {
      return;
    }

    // Random offset from titan center
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 40;

    // Velocity based on particle type
    let vx: number;
    let vy: number;

    if (particleType === "sparkle") {
      // Sparkles drift upward and outward
      vx = (Math.random() - 0.5) * 30;
      vy = -20 - Math.random() * 30; // Upward
    } else {
      // Fire rises quickly with more randomness
      vx = (Math.random() - 0.5) * 40;
      vy = -40 - Math.random() * 60; // Strong upward
    }

    const particle: AlignmentParticle = {
      x: this.titanPosition.x + offsetX,
      y: this.titanPosition.y + offsetY,
      vx,
      vy,
      life: 1.0,
      color: visuals.particleColor,
      size: particleType === "sparkle" ? 2 + Math.random() * 3 : 4 + Math.random() * 6,
      type: particleType,
    };

    this.particles.push(particle);
  }
}

// ============================================================================
// CANVAS RENDERING HELPERS
// ============================================================================

/**
 * Draw alignment glow effect around the Titan.
 *
 * Creates a radial gradient glow based on alignment visual properties.
 *
 * @param ctx - Canvas 2D rendering context
 * @param x - Center X position
 * @param y - Center Y position
 * @param radius - Glow radius
 * @param properties - Visual properties for glow styling
 */
export function drawAlignmentGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  properties: AlignmentVisualProperties
): void {
  if (properties.glowIntensity <= 0) {
    return;
  }

  ctx.save();

  // Create radial gradient for glow
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

  // Parse glow color to adjust alpha
  const rgba = parseRgbaColor(properties.glowColor);
  if (rgba) {
    const innerAlpha = rgba.a * properties.glowIntensity;
    gradient.addColorStop(0, rgbaToString(rgba.r, rgba.g, rgba.b, innerAlpha));
    gradient.addColorStop(0.5, rgbaToString(rgba.r, rgba.g, rgba.b, innerAlpha * 0.5));
    gradient.addColorStop(1, rgbaToString(rgba.r, rgba.g, rgba.b, 0));
  } else {
    // Fallback for non-rgba colors
    gradient.addColorStop(0, properties.glowColor);
    gradient.addColorStop(1, "transparent");
  }

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw alignment particles to canvas.
 *
 * Renders sparkle particles as circles and fire particles as gradients.
 *
 * @param ctx - Canvas 2D rendering context
 * @param particles - Array of particles to render
 */
export function drawAlignmentParticles(
  ctx: CanvasRenderingContext2D,
  particles: AlignmentParticle[]
): void {
  ctx.save();

  for (const particle of particles) {
    const alpha = particle.life;

    if (particle.type === "sparkle") {
      // Draw sparkle as a bright circle with glow
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.size * 2;
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw fire as a gradient blob
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.size
      );

      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(0.4, particle.color);
      gradient.addColorStop(1, "transparent");

      ctx.globalAlpha = alpha;
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Apply alignment filter to canvas context.
 *
 * Note: CSS filters on canvas have limited browser support.
 * This function sets the filter property if supported.
 *
 * @param ctx - Canvas 2D rendering context
 * @param properties - Visual properties with filter string
 */
export function applyAlignmentFilter(
  ctx: CanvasRenderingContext2D,
  properties: AlignmentVisualProperties
): void {
  if (properties.spriteFilter === "none") {
    ctx.filter = "none";
    return;
  }

  ctx.filter = properties.spriteFilter;
}

// ============================================================================
// INTEGRATION FUNCTION
// ============================================================================

// Module-level managers for persistent state
const transitionManager = new AlignmentTransitionManager();
const particleSystem = new AlignmentParticleSystem("neutral");
let lastUpdateTime = Date.now();

/**
 * Get complete visual state for Titan rendering.
 *
 * This function provides all visual information needed to render
 * the Titan with proper alignment effects.
 *
 * @param titan - The Titan Pet entity
 * @returns Complete visual state for rendering
 */
export function getTitanVisualState(titan: TitanPet): {
  visuals: AlignmentVisualProperties;
  isTransitioning: boolean;
  transitionProgress: number;
  particles: AlignmentParticle[];
  currentAnimation: TitanAnimation;
} {
  const currentTime = Date.now();
  const deltaMs = currentTime - lastUpdateTime;
  lastUpdateTime = currentTime;

  // Get current alignment state
  const alignmentState = getAlignmentState(titan.alignment);

  // Update particle system
  particleSystem.setAlignment(alignmentState);
  particleSystem.update(deltaMs, { x: titan.gridX, y: titan.gridY });

  // Update transition manager
  transitionManager.setCurrentAlignment(alignmentState);
  transitionManager.update(deltaMs);

  // Get visual properties (interpolated if transitioning)
  const visuals = transitionManager.isTransitioning()
    ? transitionManager.getInterpolatedVisuals()
    : ALIGNMENT_VISUALS[alignmentState];

  // Determine current animation (if transitioning, use morph animation)
  let currentAnimation: TitanAnimation = "idle";
  if (transitionManager.isTransitioning()) {
    const transition = transitionManager.getCurrentTransition();
    if (transition) {
      const direction =
        ALIGNMENT_VISUALS[transition.toState].glowIntensity >
        ALIGNMENT_VISUALS[transition.fromState].glowIntensity
          ? "evil"
          : "good";
      currentAnimation = getMorphAnimation(
        transition.toState === "angelic" ||
          transition.toState === "good" ||
          (transition.toState === "neutral" && transition.fromState !== "angelic" && transition.fromState !== "good")
          ? "good"
          : "evil"
      );
    }
  }

  return {
    visuals,
    isTransitioning: transitionManager.isTransitioning(),
    transitionProgress: transitionManager.getProgress(),
    particles: particleSystem.getParticles(),
    currentAnimation,
  };
}
