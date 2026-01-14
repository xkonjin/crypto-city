/**
 * TitanTrainingFeedback - Visual and Audio Feedback for Training Interactions
 *
 * Provides clear feedback when praising or punishing the Titan:
 * - Floating text that rises and fades (+✓ Good [action]! / -✗ Bad [action]!)
 * - Particle effects (rainbow sparkles for praise, red angry for punish)
 * - Sound effect hooks (to be connected to actual sound files)
 * - Titan reaction animation triggers
 *
 * "When the divine hand touches the creature, let the heavens
 * rain sparkles of approval or the fires of disapproval."
 *
 * @see specs/HERO_PET_SYSTEM.md Section 3 and Section 10
 */

"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import type { TrainingResult } from "@/lib/titan/TitanTraining";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the TitanTrainingFeedback component
 */
export interface TrainingFeedbackProps {
  /** The training result to display feedback for, or null if none */
  result: TrainingResult | null;
  /** Screen position where the Titan is located */
  titanPosition: { x: number; y: number };
  /** Called when the feedback animation completes */
  onComplete?: () => void;
}

/**
 * Props for the ParticleSystem component
 */
export interface ParticleSystemProps {
  /** Type of particles to display */
  type: "praise" | "punish";
  /** Screen position to spawn particles from */
  position: { x: number; y: number };
  /** Whether the particle system is active */
  active: boolean;
  /** Called when all particles have finished animating */
  onComplete?: () => void;
}

/**
 * Individual particle data
 */
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
  lifetime: number;
}

/**
 * Titan reaction type
 */
export type TitanReactionType = "happy" | "sad";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Total duration for feedback display (2 seconds) */
export const FEEDBACK_DURATION = 2000;

/** When to start fading the text (1.5 seconds) */
export const TEXT_FADE_START = 1500;

/** Duration for particle effects (1 second) */
export const PARTICLE_DURATION = 1000;

/** Number of particles to spawn */
const PARTICLE_COUNT_MIN = 20;
const PARTICLE_COUNT_MAX = 30;

/** Rainbow colors for praise particles */
const PRAISE_COLORS = [
  "#FF0000", // Red
  "#FF7F00", // Orange
  "#FFFF00", // Yellow
  "#00FF00", // Green
  "#0000FF", // Blue
  "#8B00FF", // Purple
  "#FF69B4", // Pink
  "#FFD700", // Gold
];

/** Red shades for punish particles */
const PUNISH_COLORS = [
  "#FF0000", // Red
  "#DC143C", // Crimson
  "#B22222", // Firebrick
  "#8B0000", // Dark red
  "#FF6347", // Tomato
  "#FF4500", // Orange red
];

// =============================================================================
// SOUND EFFECT HOOKS
// =============================================================================

/**
 * Play praise sound effect
 * Placeholder - connects to actual sound system
 */
export const playPraiseSound = (): void => {
  // Sound files to be added later
  // Uses existing sound system from hooks/useSound.ts
  if (typeof window !== "undefined") {
    // Dispatch event for sound system to pick up
    window.dispatchEvent(
      new CustomEvent("titan:playSound", { detail: { sound: "praise_chime" } })
    );
  }
};

/**
 * Play punish sound effect
 * Placeholder - connects to actual sound system
 */
export const playPunishSound = (): void => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("titan:playSound", {
        detail: { sound: "punish_negative" },
      })
    );
  }
};

// =============================================================================
// TITAN REACTION TRIGGER
// =============================================================================

/** Store for last reaction triggered */
let lastTitanReaction: TitanReactionType | null = null;

/**
 * Signal to the game renderer to play Titan animation.
 * Dispatches a custom event that the canvas renderer can listen to.
 *
 * @param type - 'happy' for praise reaction, 'sad' for punish reaction
 */
export function triggerTitanReaction(type: TitanReactionType): void {
  lastTitanReaction = type;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("titan:reaction", { detail: { type } })
    );
  }
}

/**
 * Get the last triggered reaction (for testing)
 */
export function getLastTitanReaction(): TitanReactionType | null {
  return lastTitanReaction;
}

// =============================================================================
// PARTICLE SYSTEM COMPONENT
// =============================================================================

/**
 * Generate initial particles based on type
 */
function generateParticles(type: "praise" | "punish"): Particle[] {
  const count =
    Math.floor(Math.random() * (PARTICLE_COUNT_MAX - PARTICLE_COUNT_MIN + 1)) +
    PARTICLE_COUNT_MIN;
  const colors = type === "praise" ? PRAISE_COLORS : PUNISH_COLORS;

  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = type === "praise" ? 2 + Math.random() * 3 : 1 + Math.random() * 2;

    return {
      id: i,
      x: 0,
      y: 0,
      vx: type === "praise" ? Math.cos(angle) * speed : (Math.random() - 0.5) * 4,
      vy: type === "praise" ? Math.sin(angle) * speed : (Math.random() - 0.5) * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6,
      opacity: 1,
      lifetime: PARTICLE_DURATION,
    };
  });
}

/**
 * ParticleSystem - Renders animated particles for training feedback
 *
 * For Praise: Rainbow sparkle particles that expand outward
 * For Punish: Red angry particles that shake erratically
 */
export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  type,
  position,
  active,
  onComplete,
}) => {
  // Use a key to force remount when becoming active
  const [instanceKey, setInstanceKey] = useState(0);
  const [particles, setParticles] = useState<Particle[]>(() => 
    active ? generateParticles(type) : []
  );
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // When active changes to true, generate new particles by incrementing key
  useEffect(() => {
    if (active) {
      setInstanceKey(k => k + 1);
    }
  }, [active]);

  // Initialize particles when key changes (component effectively remounts)
  useEffect(() => {
    if (!active) {
      return;
    }

    const initialParticles = generateParticles(type);
    setParticles(initialParticles);
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / PARTICLE_DURATION, 1);

      if (progress >= 1) {
        setParticles([]);
        onComplete?.();
        return;
      }

      setParticles((prevParticles) =>
        prevParticles.map((p) => {
          if (type === "praise") {
            // Expand outward animation
            return {
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              opacity: 1 - progress,
              size: p.size * (1 + progress * 0.5),
            };
          } else {
            // Shake animation
            const shakeX = (Math.random() - 0.5) * 10;
            const shakeY = (Math.random() - 0.5) * 10;
            return {
              ...p,
              x: p.x + shakeX,
              y: p.y + shakeY,
              opacity: 1 - progress,
            };
          }
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceKey]);

  if (!active || particles.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="particle-system"
      data-type={type}
      className="fixed pointer-events-none z-[9998]"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          data-testid="particle"
          className={`absolute rounded-full ${
            type === "praise" ? "animate-particle-expand" : "animate-particle-shake"
          }`}
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow:
              type === "praise"
                ? `0 0 ${particle.size}px ${particle.color}`
                : "none",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
};

// =============================================================================
// FLOATING TEXT COMPONENT
// =============================================================================

interface FloatingTextProps {
  text: string;
  type: "praise" | "punish";
  position: { x: number; y: number };
  onComplete?: () => void;
}

const FloatingText: React.FC<FloatingTextProps> = ({
  text,
  type,
  position,
  onComplete,
}) => {
  const [opacity, setOpacity] = useState(1);
  const [offset, setOffset] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Animation effect - runs once on mount
  useEffect(() => {
    startTimeRef.current = performance.now();
    let animationId: number;

    const animate = () => {
      if (startTimeRef.current === null) return;
      
      const elapsed = performance.now() - startTimeRef.current;

      // Float upward animation
      setOffset(Math.min(elapsed / FEEDBACK_DURATION, 1) * 50);

      // Fade out after TEXT_FADE_START
      if (elapsed > TEXT_FADE_START) {
        const fadeProgress =
          (elapsed - TEXT_FADE_START) / (FEEDBACK_DURATION - TEXT_FADE_START);
        setOpacity(Math.max(0, 1 - fadeProgress));
      }

      if (elapsed < FEEDBACK_DURATION) {
        animationId = requestAnimationFrame(animate);
      } else {
        onCompleteRef.current?.();
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const isPraise = type === "praise";

  return (
    <div
      data-testid="training-feedback-text"
      className={`fixed pointer-events-none z-[9999] font-bold text-lg md:text-xl whitespace-nowrap ${
        isPraise ? "text-green-500" : "text-red-500"
      }`}
      style={{
        left: position.x,
        top: position.y - offset,
        transform: "translate(-50%, -100%)",
        opacity,
        textShadow: isPraise
          ? "0 0 10px rgba(34, 197, 94, 0.5), 0 2px 4px rgba(0,0,0,0.3)"
          : "0 0 10px rgba(239, 68, 68, 0.5), 0 2px 4px rgba(0,0,0,0.3)",
      }}
      role="status"
      aria-live="polite"
    >
      {isPraise ? "+✓ " : "-✗ "}
      {text}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * TitanTrainingFeedback - Main feedback component
 *
 * Displays visual and triggers audio feedback when training occurs.
 * Integrates floating text, particle effects, and Titan reactions.
 */
export const TitanTrainingFeedback: React.FC<TrainingFeedbackProps> = ({
  result,
  titanPosition,
  onComplete,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [particlesActive, setParticlesActive] = useState(false);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const completedRef = useRef(false);
  const processedResultRef = useRef<TrainingResult | null>(null);

  // Format the display text based on result
  const displayText = useMemo(() => {
    if (!result?.success || !result.action) return "";

    if (result.type === "praise") {
      return `Good ${result.action}!`;
    } else {
      return `Bad ${result.action}!`;
    }
  }, [result]);

  // Handle new training result - trigger side effects when result changes
  useEffect(() => {
    if (!result?.success) {
      return;
    }

    // Only trigger if this is a new result (different reference)
    if (result !== processedResultRef.current) {
      processedResultRef.current = result;
      completedRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: animation state must sync with training result
      setFeedbackKey(k => k + 1); setShowFeedback(true); setParticlesActive(true);

      // Play sound effect
      if (result.type === "praise") {
        playPraiseSound();
        triggerTitanReaction("happy");
      } else {
        playPunishSound();
        triggerTitanReaction("sad");
      }
    }
  }, [result]);

  // Handle text animation complete
  const handleTextComplete = useCallback(() => {
    setShowFeedback(false);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [onComplete]);

  // Handle particle animation complete
  const handleParticlesComplete = useCallback(() => {
    setParticlesActive(false);
  }, []);

  // Don't render if no result or not successful
  if (!result?.success) {
    return null;
  }

  return (
    <>
      {/* Floating text feedback */}
      {showFeedback && (
        <FloatingText
          text={displayText}
          type={result.type}
          position={titanPosition}
          onComplete={handleTextComplete}
        />
      )}

      {/* Particle effects */}
      <ParticleSystem
        type={result.type}
        position={titanPosition}
        active={particlesActive}
        onComplete={handleParticlesComplete}
      />
    </>
  );
};

// =============================================================================
// TEST HOOKS
// =============================================================================

/**
 * Expose test hooks for Playwright tests
 */
if (typeof window !== "undefined") {
  // Internal state for test hooks
  let testFeedbackVisible = false;
  let testParticlesActive = false;
  let testParticleCount = 0;
  let testShowFeedbackCallback: ((result: TrainingResult, pos: { x: number; y: number }) => void) | null = null;
  let testShowParticlesCallback: ((type: "praise" | "punish", pos: { x: number; y: number }) => void) | null = null;

  // @ts-expect-error - Expose for testing
  window.__TRAINING_FEEDBACK_HOOKS__ = {
    // Show feedback manually (for testing)
    showFeedback: (
      result: TrainingResult | null,
      position: { x: number; y: number }
    ) => {
      if (!result?.success) {
        testFeedbackVisible = false;
        testParticlesActive = false;
        return;
      }

      testFeedbackVisible = true;
      testParticlesActive = true;
      testParticleCount =
        Math.floor(Math.random() * (PARTICLE_COUNT_MAX - PARTICLE_COUNT_MIN + 1)) +
        PARTICLE_COUNT_MIN;

      // Play sounds
      if (result.type === "praise") {
        playPraiseSound();
        triggerTitanReaction("happy");
      } else {
        playPunishSound();
        triggerTitanReaction("sad");
      }

      // Auto-clear after duration
      setTimeout(() => {
        testFeedbackVisible = false;
      }, FEEDBACK_DURATION);

      setTimeout(() => {
        testParticlesActive = false;
        testParticleCount = 0;
      }, PARTICLE_DURATION);

      testShowFeedbackCallback?.(result, position);
    },

    // Show feedback with callback
    showFeedbackWithCallback: (
      result: TrainingResult | null,
      position: { x: number; y: number },
      callback: () => void
    ) => {
      // @ts-expect-error - access test hooks
      window.__TRAINING_FEEDBACK_HOOKS__.showFeedback(result, position);
      setTimeout(callback, FEEDBACK_DURATION);
    },

    // Show particles manually (for testing)
    showParticles: (
      type: "praise" | "punish",
      position: { x: number; y: number }
    ) => {
      testParticlesActive = true;
      testParticleCount =
        Math.floor(Math.random() * (PARTICLE_COUNT_MAX - PARTICLE_COUNT_MIN + 1)) +
        PARTICLE_COUNT_MIN;

      setTimeout(() => {
        testParticlesActive = false;
        testParticleCount = 0;
      }, PARTICLE_DURATION);

      testShowParticlesCallback?.(type, position);
    },

    // Check if feedback is visible
    isFeedbackVisible: () => testFeedbackVisible,

    // Check if particles are active
    areParticlesActive: () => testParticlesActive,

    // Get current particle count
    getParticleCount: () => testParticleCount,

    // Get particle animation type
    getParticleAnimation: (type: "praise" | "punish") =>
      type === "praise" ? "expand" : "shake",

    // Trigger Titan reaction
    triggerTitanReaction,

    // Get last reaction
    getLastReaction: () => lastTitanReaction,

    // Sound functions
    playPraiseSound,
    playPunishSound,

    // Register callbacks
    onShowFeedback: (cb: typeof testShowFeedbackCallback) => {
      testShowFeedbackCallback = cb;
    },
    onShowParticles: (cb: typeof testShowParticlesCallback) => {
      testShowParticlesCallback = cb;
    },
  };
}

// =============================================================================
// CSS STYLES (Add to global CSS or use Tailwind)
// =============================================================================

/**
 * Required CSS animations (add to globals.css):
 *
 * @keyframes float-up-fade {
 *   0% { transform: translateY(0) translateX(-50%); opacity: 1; }
 *   100% { transform: translateY(-50px) translateX(-50%); opacity: 0; }
 * }
 *
 * @keyframes particle-expand {
 *   0% { transform: scale(0) translate(-50%, -50%); opacity: 1; }
 *   100% { transform: scale(2) translate(-50%, -50%); opacity: 0; }
 * }
 *
 * @keyframes particle-shake {
 *   0%, 100% { transform: translateX(0) translate(-50%, -50%); }
 *   25% { transform: translateX(-5px) translate(-50%, -50%); }
 *   75% { transform: translateX(5px) translate(-50%, -50%); }
 * }
 *
 * .animate-float-up-fade {
 *   animation: float-up-fade 2s ease-out forwards;
 * }
 *
 * .animate-particle-expand {
 *   animation: particle-expand 1s ease-out forwards;
 * }
 *
 * .animate-particle-shake {
 *   animation: particle-shake 0.1s ease-in-out infinite;
 * }
 */

export default TitanTrainingFeedback;
