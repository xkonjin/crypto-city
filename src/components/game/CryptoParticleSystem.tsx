'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  ParticleConfig,
  MAX_PARTICLES_PER_BUILDING,
  MAX_TOTAL_PARTICLES,
  TriggerEvent,
  getTriggerParticles,
} from '@/lib/buildingAnimations';

// =============================================================================
// TYPES
// =============================================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  type: ParticleConfig['type'];
  lifetime: number;
  maxLifetime: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

interface ParticleSource {
  buildingId: string;
  x: number;
  y: number;
  config: ParticleConfig;
  lastSpawn: number;
}

interface CryptoParticleSystemProps {
  /** Whether the particle system is enabled */
  enabled?: boolean;
  /** Viewport offset for screen space conversion */
  offset: { x: number; y: number };
  /** Current zoom level */
  zoom: number;
  /** Container dimensions */
  containerSize: { width: number; height: number };
}

// =============================================================================
// PARTICLE POOL
// =============================================================================

class ParticlePool {
  private pool: Particle[] = [];
  private activeParticles: Map<number, Particle> = new Map();
  private nextId = 0;

  constructor(initialSize: number = 100) {
    // Pre-allocate particles
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createEmptyParticle());
    }
  }

  private createEmptyParticle(): Particle {
    return {
      id: -1,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 4,
      color: '#fbbf24',
      type: 'coin',
      lifetime: 0,
      maxLifetime: 1500,
      opacity: 1,
      rotation: 0,
      rotationSpeed: 0,
    };
  }

  spawn(x: number, y: number, config: ParticleConfig): Particle | null {
    if (this.activeParticles.size >= MAX_TOTAL_PARTICLES) {
      return null;
    }

    // Get from pool or create new
    let particle = this.pool.pop();
    if (!particle) {
      particle = this.createEmptyParticle();
    }

    // Initialize particle
    const angle = Math.random() * Math.PI * 2;
    const speed = config.speed * (0.5 + Math.random() * 0.5);

    particle.id = this.nextId++;
    particle.x = x;
    particle.y = y;
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed - config.speed * 0.5; // Bias upward
    particle.size = config.size * (0.8 + Math.random() * 0.4);
    particle.color = config.color;
    particle.type = config.type;
    particle.lifetime = 0;
    particle.maxLifetime = config.lifetime * (0.8 + Math.random() * 0.4);
    particle.opacity = 1;
    particle.rotation = Math.random() * 360;
    particle.rotationSpeed = (Math.random() - 0.5) * 180;

    this.activeParticles.set(particle.id, particle);
    return particle;
  }

  update(deltaTime: number): void {
    const toRemove: number[] = [];

    this.activeParticles.forEach((particle, id) => {
      // Update position
      particle.x += particle.vx * (deltaTime / 1000);
      particle.y += particle.vy * (deltaTime / 1000);

      // Apply gravity for some particle types
      if (particle.type === 'coin' || particle.type === 'warning') {
        particle.vy += 50 * (deltaTime / 1000); // Gravity
      }

      // Update rotation
      particle.rotation += particle.rotationSpeed * (deltaTime / 1000);

      // Update lifetime
      particle.lifetime += deltaTime;

      // Calculate opacity based on lifetime
      const lifeProgress = particle.lifetime / particle.maxLifetime;
      if (lifeProgress > 0.7) {
        particle.opacity = 1 - (lifeProgress - 0.7) / 0.3;
      }

      // Mark for removal if expired
      if (particle.lifetime >= particle.maxLifetime) {
        toRemove.push(id);
      }
    });

    // Return expired particles to pool
    toRemove.forEach(id => {
      const particle = this.activeParticles.get(id);
      if (particle) {
        this.activeParticles.delete(id);
        this.pool.push(particle);
      }
    });
  }

  getActive(): Particle[] {
    return Array.from(this.activeParticles.values());
  }

  clear(): void {
    this.activeParticles.forEach(particle => {
      this.pool.push(particle);
    });
    this.activeParticles.clear();
  }

  get activeCount(): number {
    return this.activeParticles.size;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CryptoParticleSystem({
  enabled = true,
  offset,
  zoom,
  containerSize,
}: CryptoParticleSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const poolRef = useRef<ParticlePool>(new ParticlePool(MAX_TOTAL_PARTICLES));
  const sourcesRef = useRef<Map<string, ParticleSource>>(new Map());
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [renderKey, setRenderKey] = useState(0);

  // Spawn particles from a source
  const spawnFromSource = useCallback((source: ParticleSource, now: number) => {
    const spawnInterval = 1000 / (source.config.count || 5); // Particles per second
    
    if (now - source.lastSpawn >= spawnInterval) {
      poolRef.current.spawn(source.x, source.y, source.config);
      source.lastSpawn = now;
    }
  }, []);

  // Handle trigger events (yield collection, achievements, etc.)
  const handleTriggerEvent = useCallback((event: TriggerEvent) => {
    const particles = getTriggerParticles(event);
    if (!particles) return;

    // Spawn burst of particles at position
    for (let i = 0; i < particles.count; i++) {
      poolRef.current.spawn(event.position.x, event.position.y, particles);
    }
  }, []);

  // Animation loop
  useEffect(() => {
    if (!enabled) return;

    const animate = (time: number) => {
      const deltaTime = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;

      // Spawn from continuous sources
      sourcesRef.current.forEach(source => {
        spawnFromSource(source, time);
      });

      // Update all particles
      poolRef.current.update(deltaTime);

      // Trigger re-render if we have active particles
      if (poolRef.current.activeCount > 0) {
        setRenderKey(k => k + 1);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, spawnFromSource]);

  // Listen for custom events
  useEffect(() => {
    const handleYieldCollect = (e: CustomEvent) => {
      handleTriggerEvent({
        trigger: 'yield-collect',
        position: e.detail.position,
        buildingId: e.detail.buildingId,
        amount: e.detail.amount,
      });
    };

    const handleAchievement = (e: CustomEvent) => {
      handleTriggerEvent({
        trigger: 'achievement',
        position: e.detail.position,
      });
    };

    const handleRugPull = (e: CustomEvent) => {
      handleTriggerEvent({
        trigger: 'rug-pull',
        position: e.detail.position,
        buildingId: e.detail.buildingId,
      });
    };

    const handleAirdrop = (e: CustomEvent) => {
      handleTriggerEvent({
        trigger: 'airdrop',
        position: e.detail.position,
        buildingId: e.detail.buildingId,
      });
    };

    window.addEventListener('test-yield-collect' as keyof WindowEventMap, handleYieldCollect as EventListener);
    window.addEventListener('test-achievement-unlock' as keyof WindowEventMap, handleAchievement as EventListener);
    window.addEventListener('crypto-yield-collect' as keyof WindowEventMap, handleYieldCollect as EventListener);
    window.addEventListener('crypto-achievement' as keyof WindowEventMap, handleAchievement as EventListener);
    window.addEventListener('crypto-rug-pull' as keyof WindowEventMap, handleRugPull as EventListener);
    window.addEventListener('crypto-airdrop' as keyof WindowEventMap, handleAirdrop as EventListener);

    return () => {
      window.removeEventListener('test-yield-collect' as keyof WindowEventMap, handleYieldCollect as EventListener);
      window.removeEventListener('test-achievement-unlock' as keyof WindowEventMap, handleAchievement as EventListener);
      window.removeEventListener('crypto-yield-collect' as keyof WindowEventMap, handleYieldCollect as EventListener);
      window.removeEventListener('crypto-achievement' as keyof WindowEventMap, handleAchievement as EventListener);
      window.removeEventListener('crypto-rug-pull' as keyof WindowEventMap, handleRugPull as EventListener);
      window.removeEventListener('crypto-airdrop' as keyof WindowEventMap, handleAirdrop as EventListener);
    };
  }, [handleTriggerEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      poolRef.current.clear();
    };
  }, []);

  if (!enabled) return null;

  const activeParticles = poolRef.current.getActive();

  return (
    <div
      ref={containerRef}
      className="crypto-particles"
      data-testid="particle-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerSize.width,
        height: containerSize.height,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {activeParticles.map(particle => {
        // Convert world position to screen position
        const screenX = particle.x * zoom + offset.x;
        const screenY = particle.y * zoom + offset.y;

        // Skip if off-screen
        if (
          screenX < -50 ||
          screenX > containerSize.width + 50 ||
          screenY < -50 ||
          screenY > containerSize.height + 50
        ) {
          return null;
        }

        const particleClass = `particle particle-${particle.type}`;

        return (
          <div
            key={particle.id}
            className={particleClass}
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              width: particle.size * zoom,
              height: particle.size * zoom,
              opacity: particle.opacity,
              transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
              backgroundColor: particle.color,
              borderRadius: particle.type === 'sparkle' ? '0' : '50%',
              boxShadow: `0 0 ${particle.size}px ${particle.color}`,
              '--particle-lifetime': `${particle.maxLifetime}ms`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default CryptoParticleSystem;

// Export the pool class for testing
export { ParticlePool };

// Utility function to add a particle source
export function addParticleSource(
  buildingId: string,
  x: number,
  y: number,
  config: ParticleConfig
): void {
  // This will be called by the canvas renderer to register buildings
  window.dispatchEvent(new CustomEvent('crypto-particle-source-add', {
    detail: { buildingId, x, y, config },
  }));
}

// Utility function to remove a particle source
export function removeParticleSource(buildingId: string): void {
  window.dispatchEvent(new CustomEvent('crypto-particle-source-remove', {
    detail: { buildingId },
  }));
}

// Utility function to trigger a particle burst
export function triggerParticleBurst(
  trigger: TriggerEvent['trigger'],
  position: { x: number; y: number },
  buildingId?: string,
  amount?: number
): void {
  const eventName = trigger === 'yield-collect' 
    ? 'crypto-yield-collect'
    : trigger === 'achievement'
    ? 'crypto-achievement'
    : trigger === 'rug-pull'
    ? 'crypto-rug-pull'
    : 'crypto-airdrop';

  window.dispatchEvent(new CustomEvent(eventName, {
    detail: { position, buildingId, amount },
  }));
}
