// Animation System for Plasma-style smooth transitions and effects
// Handles building placement, tile changes, and particle effects

import Phaser from 'phaser';
import { PLASMA_COLORS } from './ColorPalette';

// Easing functions for smooth animations
export const Easings = {
  // Smooth ease out
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  
  // Bounce effect for placement
  easeOutBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  
  // Elastic bounce
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : 
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  
  // Smooth ease in-out
  easeInOutQuad: (t: number): number => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },
  
  // Spring effect
  spring: (t: number): number => {
    return 1 - Math.cos(t * Math.PI * 4.5) * Math.exp(-t * 6);
  },
};

export interface AnimationConfig {
  duration: number;
  easing?: (t: number) => number;
  delay?: number;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

export interface ParticleConfig {
  x: number;
  y: number;
  count: number;
  colors?: string[];
  spread?: number;
  lifetime?: number;
  size?: { min: number; max: number };
  speed?: { min: number; max: number };
  gravity?: number;
}

export class AnimationSystem {
  private scene: Phaser.Scene;
  private activeAnimations: Map<string, { cleanup: () => void }> = new Map();
  private particleEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * Animate a building placement with scale-in + bounce
   */
  animateBuildingPlacement(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    callback?: () => void
  ): void {
    const originalScaleX = sprite.scaleX;
    const originalScaleY = sprite.scaleY;
    const originalY = sprite.y;
    
    // Start scaled down and slightly offset
    sprite.setScale(0);
    sprite.setAlpha(0);
    sprite.y = originalY + 20;
    
    // Scale and fade in with bounce
    this.scene.tweens.add({
      targets: sprite,
      scaleX: originalScaleX,
      scaleY: originalScaleY,
      alpha: 1,
      y: originalY,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Add a subtle bounce at the end
        this.scene.tweens.add({
          targets: sprite,
          scaleX: originalScaleX * 1.05,
          scaleY: originalScaleY * 0.95,
          duration: 100,
          yoyo: true,
          onComplete: callback,
        });
      },
    });
    
    // Spawn placement particles
    this.spawnConstructionParticles(sprite.x, sprite.y);
  }
  
  /**
   * Animate a building being removed
   */
  animateBuildingRemoval(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    callback?: () => void
  ): void {
    // Spawn destruction particles first
    this.spawnDestructionParticles(sprite.x, sprite.y);
    
    // Scale down and fade out
    this.scene.tweens.add({
      targets: sprite,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      y: sprite.y + 30,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        sprite.destroy();
        callback?.();
      },
    });
  }
  
  /**
   * Animate a tile type change with morph effect
   */
  animateTileChange(
    sprite: Phaser.GameObjects.Image,
    newTexture: string,
    callback?: () => void
  ): void {
    // Flash white then change texture
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      onYoyo: () => {
        sprite.setTexture(newTexture);
      },
      onComplete: callback,
    });
  }
  
  /**
   * Create a pulsing highlight effect on a sprite
   */
  addPulseEffect(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    id: string
  ): void {
    // Remove existing animation if any
    this.removeAnimation(id);
    
    const tween = this.scene.tweens.add({
      targets: sprite,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    this.activeAnimations.set(id, {
      cleanup: () => {
        tween.stop();
        sprite.setAlpha(1);
      },
    });
  }
  
  /**
   * Create a hover highlight effect
   */
  addHoverEffect(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite
  ): void {
    const originalY = sprite.y;
    
    this.scene.tweens.add({
      targets: sprite,
      y: originalY - 3,
      duration: 200,
      ease: 'Sine.easeOut',
    });
  }
  
  /**
   * Remove hover effect
   */
  removeHoverEffect(
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite,
    originalY: number
  ): void {
    this.scene.tweens.add({
      targets: sprite,
      y: originalY,
      duration: 150,
      ease: 'Sine.easeIn',
    });
  }
  
  /**
   * Spawn construction sparkle particles
   */
  spawnConstructionParticles(x: number, y: number): void {
    this.spawnParticles({
      x,
      y: y - 20,
      count: 12,
      colors: [PLASMA_COLORS.gold, PLASMA_COLORS.light, PLASMA_COLORS.blueLight],
      spread: 40,
      lifetime: 600,
      size: { min: 2, max: 5 },
      speed: { min: 50, max: 150 },
      gravity: 200,
    });
  }
  
  /**
   * Spawn destruction dust particles
   */
  spawnDestructionParticles(x: number, y: number): void {
    this.spawnParticles({
      x,
      y: y - 10,
      count: 20,
      colors: [PLASMA_COLORS.lightGray, PLASMA_COLORS.midGray, '#B0B0B0'],
      spread: 60,
      lifetime: 800,
      size: { min: 3, max: 8 },
      speed: { min: 30, max: 100 },
      gravity: 150,
    });
  }
  
  /**
   * Spawn generic particles
   */
  spawnParticles(config: ParticleConfig): void {
    const {
      x, y, count,
      colors = [PLASMA_COLORS.light],
      spread = 30,
      lifetime = 500,
      size = { min: 2, max: 4 },
      speed = { min: 50, max: 100 },
      gravity = 100,
    } = config;
    
    // Create simple particle graphics
    for (let i = 0; i < count; i++) {
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * spread * 0.3,
        y + (Math.random() - 0.5) * spread * 0.3,
        size.min + Math.random() * (size.max - size.min),
        Phaser.Display.Color.HexStringToColor(colors[Math.floor(Math.random() * colors.length)]).color
      );
      
      particle.setDepth(10000);
      
      const angle = Math.random() * Math.PI * 2;
      const spd = speed.min + Math.random() * (speed.max - speed.min);
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd - 50; // Initial upward velocity
      
      const velocityX = vx;  // Fixed: velocityX never reassigned, use const
      let velocityY = vy;   // Mutable: gravity affects Y velocity
      let age = 0;          // Mutable: incremented each frame
      
      // Manual particle update
      const updateEvent = this.scene.time.addEvent({
        delay: 16, // ~60fps
        callback: () => {
          age += 16;
          velocityY += gravity * 0.016;
          particle.x += velocityX * 0.016;
          particle.y += velocityY * 0.016;
          particle.setAlpha(1 - (age / lifetime));
          particle.setScale(1 - (age / lifetime) * 0.5);
          
          if (age >= lifetime) {
            particle.destroy();
            updateEvent.destroy();
          }
        },
        loop: true,
      });
    }
  }
  
  /**
   * Create a floating text effect (like +100 or "Built!")
   */
  showFloatingText(
    x: number,
    y: number,
    text: string,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ): void {
    const floatingText = this.scene.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: PLASMA_COLORS.dark,
      stroke: PLASMA_COLORS.light,
      strokeThickness: 2,
      ...style,
    });
    
    floatingText.setOrigin(0.5);
    floatingText.setDepth(10000);
    
    this.scene.tweens.add({
      targets: floatingText,
      y: y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => floatingText.destroy(),
    });
  }
  
  /**
   * Animate camera to a position
   */
  panCamera(
    targetX: number,
    targetY: number,
    duration: number = 500,
    callback?: () => void
  ): void {
    this.scene.cameras.main.pan(targetX, targetY, duration, 'Cubic.easeInOut', false, (cam, progress) => {
      if (progress === 1) callback?.();
    });
  }
  
  /**
   * Zoom camera with animation
   */
  zoomCamera(
    targetZoom: number,
    duration: number = 300,
    callback?: () => void
  ): void {
    this.scene.cameras.main.zoomTo(targetZoom, duration, 'Cubic.easeInOut', false, (cam, progress) => {
      if (progress === 1) callback?.();
    });
  }
  
  /**
   * Remove a specific animation by ID
   */
  removeAnimation(id: string): void {
    const anim = this.activeAnimations.get(id);
    if (anim) {
      anim.cleanup();
      this.activeAnimations.delete(id);
    }
  }
  
  /**
   * Clean up all animations
   */
  destroy(): void {
    for (const [, anim] of this.activeAnimations) {
      anim.cleanup();
    }
    this.activeAnimations.clear();
    
    for (const emitter of this.particleEmitters) {
      emitter.destroy();
    }
    this.particleEmitters = [];
  }
  
  /**
   * Create ambient floating particles for atmosphere
   */
  createAmbientParticles(): void {
    // Create a slow-moving particle field for atmosphere
    const bounds = this.scene.cameras.main.worldView;
    
    for (let i = 0; i < 20; i++) {
      this.createAmbientParticle(
        bounds.x + Math.random() * bounds.width,
        bounds.y + Math.random() * bounds.height
      );
    }
  }
  
  private createAmbientParticle(x: number, y: number): void {
    const particle = this.scene.add.circle(
      x, y, 1.5,
      Phaser.Display.Color.HexStringToColor(PLASMA_COLORS.light).color,
      0.3
    );
    
    particle.setDepth(5);
    
    // Slow floating motion
    this.scene.tweens.add({
      targets: particle,
      x: x + (Math.random() - 0.5) * 100,
      y: y - 50 - Math.random() * 100,
      alpha: 0,
      duration: 5000 + Math.random() * 5000,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        particle.destroy();
        // Respawn at new location
        const bounds = this.scene.cameras.main.worldView;
        this.createAmbientParticle(
          bounds.x + Math.random() * bounds.width,
          bounds.y + bounds.height + 50
        );
      },
    });
  }
  
  /**
   * Create a ripple effect at a position
   */
  createRippleEffect(x: number, y: number, color: string = PLASMA_COLORS.blue): void {
    const ripple = this.scene.add.circle(x, y, 5, 
      Phaser.Display.Color.HexStringToColor(color).color, 0.5);
    ripple.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.8);
    ripple.setDepth(9999);
    
    this.scene.tweens.add({
      targets: ripple,
      radius: 40,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => ripple.destroy(),
    });
  }
  
  /**
   * Shake the camera for impact effects
   */
  shakeCamera(intensity: number = 0.005, duration: number = 100): void {
    this.scene.cameras.main.shake(duration, intensity);
  }
}

// Factory function to create AnimationSystem
export function createAnimationSystem(scene: Phaser.Scene): AnimationSystem {
  return new AnimationSystem(scene);
}

