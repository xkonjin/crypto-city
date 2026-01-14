'use client';

/**
 * CobieExpressions - Expression SVG variants for FloatingCobieHead
 * Issue #177
 * 
 * Provides SVG-based expressions by modifying eye, eyebrow, and mouth
 * configurations dynamically based on CobieBrain state.
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { CobieExpression, LookDirection } from '@/lib/cobie/types';
import {
  COBIE_ANIMATIONS,
  getExpressionConfig,
  getLookDirectionTransform,
  type ExpressionConfig,
  type LookDirectionTransform,
  type EyeConfig,
  type EyebrowConfig,
  type MouthConfig,
} from '@/lib/cobie/CobieHeadUtils';

// Re-export utilities for backward compatibility
export {
  COBIE_ANIMATIONS,
  getExpressionConfig,
  getLookDirectionTransform,
  type ExpressionConfig,
  type LookDirectionTransform,
  type EyeConfig,
  type EyebrowConfig,
  type MouthConfig,
};

// =============================================================================
// SVG COMPONENTS
// =============================================================================

interface CobieExpressionSVGProps {
  expression: CobieExpression;
  lookDirection: LookDirection;
  isSpeaking: boolean;
  size: number;
  className?: string;
}

/**
 * CobieExpressionSVG - Renders Cobie's head with dynamic expressions
 * Updated for Issue #200 - More distinctive, recognizable Cobie appearance
 * 
 * Cobie's signature look:
 * - Bald head
 * - Knowing smirk
 * - Dark clothing
 * - Sardonic/skeptical expression
 * - Distinctive raised eyebrow
 */
export function CobieExpressionSVG({
  expression,
  lookDirection,
  isSpeaking,
  size,
  className,
}: CobieExpressionSVGProps) {
  const config = useMemo(() => getExpressionConfig(expression), [expression]);
  const lookTransform = useMemo(() => getLookDirectionTransform(lookDirection), [lookDirection]);

  // Calculate eye positions with look direction offset
  const leftEyeX = 38 + lookTransform.eyeOffsetX;
  const rightEyeX = 62 + lookTransform.eyeOffsetX;
  const eyeY = 52 + lookTransform.eyeOffsetY;

  // Calculate pupil positions (pupils move more than eyes)
  const leftPupilX = 39 + lookTransform.eyeOffsetX * 1.5;
  const rightPupilX = 63 + lookTransform.eyeOffsetX * 1.5;
  const pupilY = 53 + lookTransform.eyeOffsetY * 1.5;

  // Eye scaling
  const eyeScaleY = config.eyes.closed ? 0.1 : (1 - (config.eyes.squintY ?? 0) * 0.5);
  const eyeScale = config.eyes.scale;

  // Eyebrow positions - enhanced for Cobie's signature skeptical look
  // Default has slight asymmetry (left slightly higher for signature look)
  const leftBrowY = 42 - config.eyebrows.leftRaise * 5;
  const rightBrowY = 44 - config.eyebrows.rightRaise * 5;

  // Mouth paths - enhanced for Cobie's knowing smirk
  const getMouthPath = () => {
    if (config.mouth.concerned) {
      return "M40 72 Q50 68, 60 72"; // Worried frown
    }
    if (config.mouth.smirk) {
      // Enhanced asymmetric smirk - Cobie's signature
      return "M38 73 Q46 76, 52 74 Q58 72, 64 69"; // More pronounced smirk
    }
    if (config.mouth.laughing || config.mouth.openAmount >= 3) {
      return "M38 70 Q50 82, 62 70"; // Wide open laugh
    }
    if (config.mouth.openAmount >= 2) {
      return "M42 70 Q50 78, 58 70"; // Open talking
    }
    if (config.mouth.openAmount >= 1) {
      return "M44 71 Q50 75, 56 71"; // Slightly open
    }
    // Default: subtle knowing smirk (Cobie's resting face)
    return "M40 72 Q48 76, 54 74 Q60 72, 64 70";
  };

  // Animation classes
  const animationClass = isSpeaking
    ? COBIE_ANIMATIONS.talk
    : expression === 'sleeping'
    ? COBIE_ANIMATIONS.sleep
    : COBIE_ANIMATIONS.bob;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn(animationClass, className)}
      style={{
        transform: `rotate(${lookTransform.headRotation}deg)`,
      }}
      role="img"
      aria-label={`Cobie with ${expression} expression`}
    >
      {/* Background circle - Purple/blue gradient (Cobie brand colors) */}
      <circle cx="50" cy="50" r="48" fill="url(#cobie-bg-gradient)" />

      {/* Background texture/pattern for depth */}
      <circle cx="50" cy="50" r="46" fill="url(#cobie-inner-gradient)" opacity="0.3" />

      {/* Head (bald) - More angular/stylized */}
      <ellipse cx="50" cy="52" rx="32" ry="35" fill="#F5D0B3" />
      
      {/* Subtle jaw definition for more angular look */}
      <path 
        d="M22 60 Q50 90 78 60" 
        fill="#F0C4A8" 
        opacity="0.6"
      />

      {/* Bald head shine - positioned for more realistic lighting */}
      <ellipse cx="40" cy="32" rx="14" ry="9" fill="#FFE8D5" opacity="0.7" />
      <ellipse cx="60" cy="35" rx="6" ry="4" fill="#FFE4D0" opacity="0.4" />

      {/* Beard stubble hint - subtle texture */}
      <ellipse cx="50" cy="75" rx="15" ry="8" fill="#8B7355" opacity="0.15" />
      <ellipse cx="35" cy="68" rx="8" ry="6" fill="#8B7355" opacity="0.1" />
      <ellipse cx="65" cy="68" rx="8" ry="6" fill="#8B7355" opacity="0.1" />

      {/* Ears - slightly more defined */}
      <ellipse cx="18" cy="54" rx="5" ry="7" fill="#F5D0B3" />
      <ellipse cx="18" cy="54" rx="3" ry="5" fill="#E8B89D" opacity="0.5" />
      <ellipse cx="82" cy="54" rx="5" ry="7" fill="#F5D0B3" />
      <ellipse cx="82" cy="54" rx="3" ry="5" fill="#E8B89D" opacity="0.5" />

      {/* Eyes - more expressive */}
      <g className={!config.eyes.closed && !isSpeaking ? COBIE_ANIMATIONS.blink : undefined}>
        {/* Left eye - slightly narrower for sardonic look */}
        <ellipse
          cx={leftEyeX}
          cy={eyeY}
          rx={5 * eyeScale}
          ry={5.5 * eyeScale * eyeScaleY}
          fill="white"
        />
        {/* Eye shadow for depth */}
        <ellipse
          cx={leftEyeX}
          cy={eyeY - 2}
          rx={5 * eyeScale}
          ry={2}
          fill="#C4A68A"
          opacity="0.3"
        />
        {!config.eyes.closed && (
          <>
            <circle cx={leftPupilX} cy={pupilY} r={3 * eyeScale} fill="#1A202C" />
            <circle cx={leftPupilX + 0.5} cy={pupilY - 0.5} r={1.2} fill="white" />
          </>
        )}

        {/* Right eye - matching asymmetric style */}
        <ellipse
          cx={rightEyeX}
          cy={eyeY}
          rx={5 * eyeScale}
          ry={5.5 * eyeScale * eyeScaleY}
          fill="white"
        />
        {/* Eye shadow for depth */}
        <ellipse
          cx={rightEyeX}
          cy={eyeY - 2}
          rx={5 * eyeScale}
          ry={2}
          fill="#C4A68A"
          opacity="0.3"
        />
        {!config.eyes.closed && (
          <>
            <circle cx={rightPupilX} cy={pupilY} r={3 * eyeScale} fill="#1A202C" />
            <circle cx={rightPupilX + 0.5} cy={pupilY - 0.5} r={1.2} fill="white" />
          </>
        )}
      </g>

      {/* Eyebrows - Cobie's signature skeptical raised eyebrow */}
      {/* Left eyebrow - default slightly raised (signature skeptical look) */}
      <path
        d={`M30 ${leftBrowY} Q36 ${leftBrowY - 4}, 44 ${leftBrowY + 1}`}
        stroke="#5D4E37"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Right eyebrow - straighter, less raised */}
      <path
        d={`M56 ${rightBrowY + 1} Q62 ${rightBrowY - 2}, 70 ${rightBrowY}`}
        stroke="#5D4E37"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Nose - more defined */}
      <path 
        d="M50 52 Q53 58, 52 64 L50 66 L48 64 Q47 58, 50 52" 
        fill="#E8B89D" 
        opacity="0.9"
      />
      {/* Nose highlight */}
      <path 
        d="M49 54 Q50 58, 49 62" 
        stroke="#F5D0B3" 
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />

      {/* Mouth - Cobie's knowing smirk */}
      <path
        d={getMouthPath()}
        stroke="#8B4513"
        strokeWidth="2.5"
        fill={config.mouth.openAmount >= 2 ? "#8B4513" : "none"}
        strokeLinecap="round"
      />

      {/* Enhanced smirk corner for signature look */}
      {(config.mouth.smirk || expression === 'idle' || expression === 'smirk') && (
        <>
          <path
            d="M60 69 Q64 70, 66 68"
            stroke="#8B4513"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Dimple hint */}
          <circle cx="66" cy="69" r="1" fill="#C4A68A" opacity="0.4" />
        </>
      )}

      {/* Dark collar/shirt - Cobie's signature dark clothing */}
      <path 
        d="M25 87 Q50 97, 75 87 L78 95 Q50 102, 22 95 Z" 
        fill="#1A202C" 
      />
      {/* Collar detail */}
      <path 
        d="M40 88 L50 92 L60 88" 
        stroke="#2D3748" 
        strokeWidth="2" 
        fill="none"
        strokeLinecap="round"
      />

      {/* Sleeping ZZZ effect */}
      {expression === 'sleeping' && (
        <g className={COBIE_ANIMATIONS.sleep}>
          <text x="70" y="30" fontSize="10" fill="#A78BFA" fontWeight="bold" opacity="0.9">
            Z
          </text>
          <text x="78" y="22" fontSize="8" fill="#A78BFA" fontWeight="bold" opacity="0.7">
            Z
          </text>
          <text x="84" y="16" fontSize="6" fill="#A78BFA" fontWeight="bold" opacity="0.5">
            Z
          </text>
        </g>
      )}

      {/* Gradient definitions */}
      <defs>
        {/* Main background - Purple to blue gradient (Cobie's brand) */}
        <linearGradient id="cobie-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        {/* Inner subtle gradient for depth */}
        <radialGradient id="cobie-inner-gradient" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
    </svg>
  );
}
