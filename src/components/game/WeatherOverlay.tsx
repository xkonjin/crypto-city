/**
 * =============================================================================
 * WEATHER OVERLAY COMPONENT
 * =============================================================================
 * Visual weather effects based on market sentiment.
 * 
 * Effects:
 * - Rain: Animated rain drops during extreme fear
 * - Cloudy: Subtle cloud/mist overlay during fear
 * - Sunny: Warm glow effect during greed
 * - Perfect: Golden sparkle/confetti during extreme greed
 * 
 * Uses CSS animations for performance.
 */

'use client';

import React, { useMemo } from 'react';
import type { WeatherEffect } from '@/hooks/useSentimentVisuals';

// =============================================================================
// TYPES
// =============================================================================

interface WeatherOverlayProps {
  /** Weather effect type */
  effect: WeatherEffect;
  /** Overlay tint color */
  tint: string;
  /** Overlay opacity (0-1) */
  opacity: number;
  /** Additional CSS class */
  className?: string;
}

// =============================================================================
// SEEDED RANDOM HELPER
// =============================================================================

/**
 * Generate a deterministic pseudo-random number based on index
 * This ensures consistent rendering while avoiding the lint error for Math.random
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// =============================================================================
// RAIN EFFECT COMPONENT
// =============================================================================

function RainEffect() {
  // Generate rain drop positions using deterministic seeded random
  const rainDrops = useMemo(() => {
    const drops: { left: string; delay: string; duration: string }[] = [];
    for (let i = 0; i < 50; i++) {
      drops.push({
        left: `${seededRandom(i * 3) * 100}%`,
        delay: `${seededRandom(i * 3 + 1) * 2}s`,
        duration: `${0.5 + seededRandom(i * 3 + 2) * 0.5}s`,
      });
    }
    return drops;
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {rainDrops.map((drop, i) => (
        <div
          key={i}
          className="absolute w-[1px] h-[15px] bg-gradient-to-b from-transparent via-blue-400/30 to-blue-300/50 animate-rain"
          style={{
            left: drop.left,
            animationDelay: drop.delay,
            animationDuration: drop.duration,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes rain {
          0% {
            transform: translateY(-20px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
        .animate-rain {
          animation: rain linear infinite;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// CLOUDY EFFECT COMPONENT
// =============================================================================

function CloudyEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Animated cloud layers */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(156, 163, 175, 0.4) 0%, transparent 50%)',
          animation: 'cloudDrift1 30s linear infinite',
        }}
      />
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          background: 'radial-gradient(ellipse at 70% 40%, rgba(156, 163, 175, 0.3) 0%, transparent 45%)',
          animation: 'cloudDrift2 25s linear infinite',
        }}
      />
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(156, 163, 175, 0.35) 0%, transparent 55%)',
          animation: 'cloudDrift3 35s linear infinite',
        }}
      />
      <style jsx>{`
        @keyframes cloudDrift1 {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(20px) translateY(10px); }
        }
        @keyframes cloudDrift2 {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-15px) translateY(-5px); }
        }
        @keyframes cloudDrift3 {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(10px) translateY(15px); }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// SUNNY EFFECT COMPONENT
// =============================================================================

function SunnyEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Warm sun glow in corner */}
      <div 
        className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(253, 224, 71, 0.6) 0%, rgba(251, 191, 36, 0.3) 40%, transparent 70%)',
          animation: 'sunPulse 4s ease-in-out infinite',
        }}
      />
      {/* Light rays */}
      <div 
        className="absolute top-0 right-0 w-1/2 h-1/2 opacity-10"
        style={{
          background: 'linear-gradient(135deg, rgba(253, 224, 71, 0.3) 0%, transparent 60%)',
        }}
      />
      <style jsx>{`
        @keyframes sunPulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// PERFECT EFFECT COMPONENT (EXTREME GREED)
// =============================================================================

function PerfectEffect() {
  // Generate sparkle positions using deterministic seeded random
  const sparkles = useMemo(() => {
    const items: { left: string; top: string; delay: string; size: string }[] = [];
    for (let i = 0; i < 20; i++) {
      items.push({
        left: `${seededRandom(i * 4 + 100) * 100}%`,
        top: `${seededRandom(i * 4 + 101) * 100}%`,
        delay: `${seededRandom(i * 4 + 102) * 3}s`,
        size: `${4 + seededRandom(i * 4 + 103) * 4}px`,
      });
    }
    return items;
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Golden sun glow */}
      <div 
        className="absolute -top-10 -right-10 w-80 h-80 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.8) 0%, rgba(245, 158, 11, 0.4) 40%, transparent 70%)',
          animation: 'goldenPulse 3s ease-in-out infinite',
        }}
      />
      
      {/* Sparkles/confetti */}
      {sparkles.map((sparkle, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-yellow-300/60 animate-sparkle"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: sparkle.delay,
          }}
        />
      ))}
      
      {/* Subtle golden gradient overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, transparent 50%, rgba(245, 158, 11, 0.2) 100%)',
        }}
      />
      
      <style jsx>{`
        @keyframes goldenPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.08); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// MAIN WEATHER OVERLAY COMPONENT
// =============================================================================

export function WeatherOverlay({ 
  effect, 
  tint, 
  opacity, 
  className = '' 
}: WeatherOverlayProps) {
  // Don't render if no effect
  if (!effect && opacity === 0) {
    return null;
  }

  return (
    <div 
      data-testid="weather-overlay"
      data-sentiment={effect || 'neutral'}
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
      style={{
        backgroundColor: tint,
        opacity: effect ? 1 : opacity,
      }}
    >
      {/* Weather-specific effects */}
      {effect === 'rain' && <RainEffect />}
      {effect === 'cloudy' && <CloudyEffect />}
      {effect === 'sunny' && <SunnyEffect />}
      {effect === 'perfect' && <PerfectEffect />}
    </div>
  );
}

export default WeatherOverlay;
