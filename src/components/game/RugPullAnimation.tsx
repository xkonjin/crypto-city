'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  RugPullEvent,
  ANIMATION_PHASES,
  calculateShakeIntensity,
} from '@/lib/rugPullEffect';

// =============================================================================
// TYPES
// =============================================================================

type AnimationPhase = 'idle' | 'warning' | 'collapse' | 'aftermath' | 'complete';

export interface RugPullAnimationProps {
  event: RugPullEvent | null;
  /** Screen position where the animation should appear */
  screenPosition: { x: number; y: number } | null;
  onComplete: () => void;
  onScreenShake?: (intensity: number, duration: number) => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Pre-generate random values for particles
function generateParticleRandoms(count: number, seed: number): { distance: number; size: number }[] {
  // Use a simple seeded random for deterministic results
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  
  return Array.from({ length: count }, (_, i) => ({
    distance: 40 + seededRandom(seed + i * 2) * 60,
    size: 10 + seededRandom(seed + i * 2 + 1) * 15,
  }));
}

function generateDebrisRandoms(count: number, seed: number): { x: number; y: number }[] {
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  
  return Array.from({ length: count }, (_, i) => ({
    x: (seededRandom(seed + i * 3) - 0.5) * 120,
    y: -seededRandom(seed + i * 3 + 1) * 100 - 20,
  }));
}

// =============================================================================
// SMOKE PARTICLE COMPONENT
// =============================================================================

interface SmokeParticleProps {
  index: number;
  centerX: number;
  centerY: number;
  distance: number;
  size: number;
}

function SmokeParticle({ index, centerX, centerY, distance, size }: SmokeParticleProps) {
  const angle = (index / 8) * Math.PI * 2;
  const delay = index * 0.1;
  
  return (
    <div
      data-testid="smoke-particle"
      className="smoke-particle absolute rounded-full pointer-events-none"
      style={{
        left: centerX,
        top: centerY,
        width: size,
        height: size,
        background: `radial-gradient(circle, rgba(128, 128, 128, 0.8) 0%, rgba(64, 64, 64, 0.4) 50%, transparent 100%)`,
        animation: `rugSmokeFloat 2s ease-out ${delay}s forwards`,
        '--smoke-x': `${Math.cos(angle) * distance}px`,
        '--smoke-y': `${Math.sin(angle) * distance - 50}px`,
        transform: 'translate(-50%, -50%)',
      } as React.CSSProperties}
    />
  );
}

// =============================================================================
// WARNING PHASE COMPONENT
// =============================================================================

interface WarningPhaseProps {
  centerX: number;
  centerY: number;
}

function WarningPhase({ centerX, centerY }: WarningPhaseProps) {
  return (
    <div
      data-testid="rug-warning"
      className="rug-warning absolute pointer-events-none"
      style={{
        left: centerX,
        top: centerY - 60,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Warning icon with bounce animation */}
      <div className="relative animate-bounce">
        <div className="text-4xl drop-shadow-lg">⚠️</div>
      </div>
      
      {/* Red flash overlay on building area */}
      <div
        className="absolute rounded-lg"
        style={{
          left: -50,
          top: 40,
          width: 100,
          height: 80,
          background: 'rgba(255, 0, 0, 0.3)',
          animation: 'rugFlash 0.2s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// =============================================================================
// COLLAPSE PHASE COMPONENT
// =============================================================================

interface CollapsePhaseProps {
  centerX: number;
  centerY: number;
}

function CollapsePhase({ centerX, centerY }: CollapsePhaseProps) {
  return (
    <div
      data-testid="rug-collapse"
      className="rug-collapse absolute pointer-events-none"
      style={{
        left: centerX,
        top: centerY,
        transform: 'translate(-50%, -50%)',
        animation: 'rugShake 0.1s ease-in-out infinite, rugImplode 1.5s ease-in forwards',
      }}
    >
      {/* Building shake indicator */}
      <div className="w-20 h-20 bg-gradient-to-b from-orange-500/60 to-red-600/60 rounded-lg border-2 border-red-500/80">
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-3xl animate-spin">💀</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// AFTERMATH PHASE COMPONENT
// =============================================================================

interface AftermathPhaseProps {
  centerX: number;
  centerY: number;
  particleRandoms: { distance: number; size: number }[];
  debrisRandoms: { x: number; y: number }[];
}

function AftermathPhase({ centerX, centerY, particleRandoms, debrisRandoms }: AftermathPhaseProps) {
  return (
    <div
      data-testid="rug-aftermath"
      className="rug-aftermath absolute pointer-events-none"
      style={{
        left: centerX,
        top: centerY,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Smoke particles */}
      {particleRandoms.map((randoms, i) => (
        <SmokeParticle 
          key={i} 
          index={i} 
          centerX={0} 
          centerY={0} 
          distance={randoms.distance}
          size={randoms.size}
        />
      ))}
      
      {/* RUGGED! text with dramatic entrance */}
      <div
        className="absolute text-center whitespace-nowrap"
        style={{
          left: '50%',
          top: '-40px',
          transform: 'translateX(-50%)',
          animation: 'rugTextReveal 0.5s ease-out forwards',
        }}
      >
        <span className="text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-500 drop-shadow-[0_2px_4px_rgba(255,0,0,0.5)]">
          RUGGED!
        </span>
      </div>
      
      {/* Debris particles */}
      {debrisRandoms.map((randoms, i) => (
        <div
          key={`debris-${i}`}
          className="absolute w-2 h-2 bg-gray-600 rounded-sm"
          style={{
            left: 0,
            top: 0,
            animation: `rugDebris 1s ease-out ${i * 0.1}s forwards`,
            '--debris-x': `${randoms.x}px`,
            '--debris-y': `${randoms.y}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// =============================================================================
// MAIN ANIMATION COMPONENT
// =============================================================================

function RugPullAnimationContent({
  event,
  screenPosition,
  onComplete,
  onScreenShake,
}: RugPullAnimationProps) {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [shouldRender, setShouldRender] = useState(false);
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-generate random values for particles (memoized based on event)
  const seed = event ? event.position.x + event.position.y * 1000 + event.treasuryLoss : 0;
  const particleRandoms = useMemo(() => generateParticleRandoms(8, seed), [seed]);
  const debrisRandoms = useMemo(() => generateDebrisRandoms(6, seed + 100), [seed]);

  // Cleanup function for timeouts
  const clearPhaseTimeout = useCallback(() => {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }
  }, []);

  // Start animation when event is provided
  useEffect(() => {
    if (!event || !screenPosition) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: animation state must sync with event presence
      setPhase('idle');
      setShouldRender(false);
      return;
    }

    // Start the animation sequence
     
    setShouldRender(true);
    setPhase('warning');

    // Trigger screen shake at the start
    if (onScreenShake) {
      const intensity = calculateShakeIntensity(event.treasuryLoss);
      onScreenShake(intensity, ANIMATION_PHASES.screenShake.duration);
    }

    // Phase 1: Warning
    phaseTimeoutRef.current = setTimeout(() => {
      setPhase('collapse');

      // Phase 2: Collapse
      phaseTimeoutRef.current = setTimeout(() => {
        setPhase('aftermath');

        // Phase 3: Aftermath
        phaseTimeoutRef.current = setTimeout(() => {
          setPhase('complete');
          setShouldRender(false);
          onComplete();
        }, ANIMATION_PHASES.aftermath.duration);
      }, ANIMATION_PHASES.collapse.duration);
    }, ANIMATION_PHASES.warning.duration);

    return clearPhaseTimeout;
  }, [event, screenPosition, onComplete, onScreenShake, clearPhaseTimeout]);

  // Listen for test events
  useEffect(() => {
    const handleTestAnimation = (e: CustomEvent) => {
      const { phase: testPhase, position } = e.detail || {};
      if (testPhase && position) {
        setPhase(testPhase);
        setShouldRender(true);
      }
    };

    window.addEventListener('test-rug-pull-animation', handleTestAnimation as EventListener);
    return () => {
      window.removeEventListener('test-rug-pull-animation', handleTestAnimation as EventListener);
    };
  }, []);

  if (!shouldRender || phase === 'idle' || phase === 'complete') {
    return null;
  }

  const centerX = screenPosition?.x ?? 0;
  const centerY = screenPosition?.y ?? 0;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9998]"
      data-testid="rug-pull-animation"
    >
      {phase === 'warning' && (
        <WarningPhase centerX={centerX} centerY={centerY} />
      )}
      {phase === 'collapse' && (
        <CollapsePhase centerX={centerX} centerY={centerY} />
      )}
      {phase === 'aftermath' && (
        <AftermathPhase 
          centerX={centerX} 
          centerY={centerY} 
          particleRandoms={particleRandoms}
          debrisRandoms={debrisRandoms}
        />
      )}
    </div>
  );
}

// =============================================================================
// PORTAL WRAPPER
// =============================================================================

export function RugPullAnimation(props: RugPullAnimationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: client-side portal mounting detection
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <RugPullAnimationContent {...props} />,
    document.body
  );
}

export default RugPullAnimation;
