// =============================================================================
// VISUAL EFFECTS MANAGER
// =============================================================================
// Manages particle effects and visual feedback for the crypto city.
// Creates effects for yield generation, airdrops, rug pulls, and market events.
//
// Effect Types:
// - Yield particles: Token icons floating up from DeFi buildings
// - Airdrop shower: Coins falling from sky
// - Rug pull: Red explosion and smoke
// - Bull run: Green confetti and rockets
// - Bear market: Red rain and sad clouds
//
// Uses Phaser 3's particle system for performance.

import Phaser from 'phaser';
import { CryptoEventType } from '../types';
import { gridToIso, TILE_WIDTH, TILE_HEIGHT } from '../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Effect configuration for different effect types
 */
interface EffectConfig {
  // Particle texture key or color
  color?: number;
  // Particle scale
  scale?: { start: number; end: number };
  // Particle alpha
  alpha?: { start: number; end: number };
  // Particle lifespan in ms
  lifespan?: number;
  // Particle speed
  speed?: { min: number; max: number };
  // Gravity Y (positive = down)
  gravityY?: number;
  // Quantity of particles
  quantity?: number;
  // Emit zone size
  emitZone?: { width: number; height: number };
  // Angle of emission
  angle?: { min: number; max: number };
  // Blend mode (use Phaser.BlendModes enum values)
  blendMode?: Phaser.BlendModes;
}

// =============================================================================
// EFFECT PRESETS
// =============================================================================

/**
 * Preset configurations for different effect types
 */
const EFFECT_PRESETS: Record<string, EffectConfig> = {
  // Token yield floating up
  yield: {
    color: 0xFFD700,  // Gold
    scale: { start: 0.3, end: 0.1 },
    alpha: { start: 1, end: 0 },
    lifespan: 1500,
    speed: { min: 20, max: 40 },
    gravityY: -30,
    quantity: 1,
    angle: { min: 260, max: 280 },
    blendMode: Phaser.BlendModes.ADD,
  },
  
  // Airdrop shower
  airdrop: {
    color: 0x00FF88,  // Green
    scale: { start: 0.5, end: 0.2 },
    alpha: { start: 1, end: 0.5 },
    lifespan: 2000,
    speed: { min: 50, max: 100 },
    gravityY: 100,
    quantity: 20,
    emitZone: { width: 200, height: 10 },
    angle: { min: 80, max: 100 },
  },
  
  // Rug pull explosion
  rugPull: {
    color: 0xFF0000,  // Red
    scale: { start: 0.8, end: 0.1 },
    alpha: { start: 1, end: 0 },
    lifespan: 1000,
    speed: { min: 100, max: 200 },
    gravityY: 50,
    quantity: 50,
    angle: { min: 0, max: 360 },
    blendMode: Phaser.BlendModes.ADD,
  },
  
  // Bull run confetti
  bullRun: {
    color: 0x22C55E,  // Green
    scale: { start: 0.4, end: 0.2 },
    alpha: { start: 1, end: 0 },
    lifespan: 3000,
    speed: { min: 30, max: 80 },
    gravityY: 50,
    quantity: 5,
    emitZone: { width: 400, height: 10 },
    angle: { min: 60, max: 120 },
  },
  
  // Bear market rain
  bearMarket: {
    color: 0xEF4444,  // Red
    scale: { start: 0.3, end: 0.1 },
    alpha: { start: 0.7, end: 0 },
    lifespan: 2000,
    speed: { min: 80, max: 120 },
    gravityY: 200,
    quantity: 3,
    emitZone: { width: 500, height: 10 },
    angle: { min: 85, max: 95 },
  },
  
  // Meme rally (pepe particles)
  memeRally: {
    color: 0x3D9970,  // Pepe green
    scale: { start: 0.5, end: 0.3 },
    alpha: { start: 1, end: 0.5 },
    lifespan: 2500,
    speed: { min: 40, max: 80 },
    gravityY: -20,
    quantity: 3,
    angle: { min: 250, max: 290 },
  },
  
  // Whale entry splash
  whaleEntry: {
    color: 0x3B82F6,  // Blue
    scale: { start: 0.6, end: 0.1 },
    alpha: { start: 1, end: 0 },
    lifespan: 1200,
    speed: { min: 80, max: 150 },
    gravityY: 100,
    quantity: 30,
    angle: { min: 220, max: 320 },
  },
  
  // Hack warning
  hack: {
    color: 0xFF6600,  // Orange
    scale: { start: 0.5, end: 0.8 },
    alpha: { start: 1, end: 0 },
    lifespan: 800,
    speed: { min: 0, max: 10 },
    gravityY: 0,
    quantity: 1,
    blendMode: Phaser.BlendModes.ADD,
  },
  
  // Liquidation cascade
  liquidation: {
    color: 0xFF0000,
    scale: { start: 0.3, end: 0.5 },
    alpha: { start: 1, end: 0 },
    lifespan: 600,
    speed: { min: 100, max: 200 },
    gravityY: 300,
    quantity: 15,
    angle: { min: 0, max: 360 },
  },
  
  // Protocol upgrade sparkle
  upgrade: {
    color: 0x00FFFF,  // Cyan
    scale: { start: 0.4, end: 0.1 },
    alpha: { start: 1, end: 0 },
    lifespan: 1000,
    speed: { min: 30, max: 60 },
    gravityY: -50,
    quantity: 8,
    angle: { min: 0, max: 360 },
    blendMode: Phaser.BlendModes.ADD,
  },
};

// =============================================================================
// EFFECTS MANAGER CLASS
// =============================================================================

export class EffectsManager {
  // Reference to the Phaser scene
  private scene: Phaser.Scene;
  
  // Particle emitter manager
  private particles: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
  
  // Persistent emitters (for ongoing effects like bull run)
  private persistentEmitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
  
  // Active screen flash effect
  private flashOverlay?: Phaser.GameObjects.Rectangle;

  // ---------------------------------------------------------------------------
  // CONSTRUCTOR
  // ---------------------------------------------------------------------------

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Create flash overlay (hidden by default)
    this.createFlashOverlay();
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  /**
   * Create the flash overlay used for screen effects
   */
  private createFlashOverlay(): void {
    const { width, height } = this.scene.cameras.main;
    
    this.flashOverlay = this.scene.add.rectangle(
      width / 2,
      height / 2,
      width * 2,
      height * 2,
      0xFFFFFF,
      0
    );
    
    this.flashOverlay.setScrollFactor(0);
    this.flashOverlay.setDepth(1000);
  }

  /**
   * Create a particle texture at runtime
   * Used when no sprite sheets are available
   */
  private getOrCreateParticleTexture(color: number, size: number = 8): string {
    const key = `particle_${color.toString(16)}_${size}`;
    
    if (!this.scene.textures.exists(key)) {
      // Create a simple circle texture
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(color, 1);
      graphics.fillCircle(size, size, size);
      graphics.generateTexture(key, size * 2, size * 2);
      graphics.destroy();
    }
    
    return key;
  }

  // ---------------------------------------------------------------------------
  // ONE-SHOT EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * Play a yield effect at a grid position
   * Called when a building generates tokens
   */
  playYieldEffect(gridX: number, gridY: number, amount: number = 1): void {
    const preset = EFFECT_PRESETS.yield;
    const isoPos = gridToIso(gridX, gridY);
    
    // Create particle texture if needed
    const textureKey = this.getOrCreateParticleTexture(preset.color || 0xFFD700);
    
    // Create emitter
    const emitter = this.scene.add.particles(
      isoPos.x,
      isoPos.y - 50,
      textureKey,
      {
        scale: preset.scale,
        alpha: preset.alpha,
        lifespan: preset.lifespan,
        speed: preset.speed,
        gravityY: preset.gravityY,
        quantity: Math.min(5, Math.ceil(amount / 10)),
        angle: preset.angle,
        blendMode: preset.blendMode,
        frequency: 200,
        emitting: true,
      }
    );
    
    emitter.setDepth(500);
    
    // Stop after a short time
    this.scene.time.delayedCall(1500, () => {
      emitter.stop();
      this.scene.time.delayedCall(2000, () => {
        emitter.destroy();
      });
    });
  }

  /**
   * Play an airdrop effect at screen position
   * Creates a shower of coins
   */
  playAirdropEffect(screenX: number, screenY: number): void {
    const preset = EFFECT_PRESETS.airdrop;
    const textureKey = this.getOrCreateParticleTexture(preset.color || 0x00FF88);
    
    const emitter = this.scene.add.particles(
      screenX,
      screenY - 100,
      textureKey,
      {
        scale: preset.scale,
        alpha: preset.alpha,
        lifespan: preset.lifespan,
        speed: preset.speed,
        gravityY: preset.gravityY,
        quantity: preset.quantity,
        angle: preset.angle,
        emitting: true,
        frequency: 50,
      }
    );
    
    emitter.setScrollFactor(0);
    emitter.setDepth(500);
    
    // Flash screen green
    this.flashScreen(0x00FF00, 0.15, 200);
    
    this.scene.time.delayedCall(1500, () => {
      emitter.stop();
      this.scene.time.delayedCall(2500, () => {
        emitter.destroy();
      });
    });
  }

  /**
   * Play a rug pull effect at a building position
   * Red explosion and building darkening
   */
  playRugPullEffect(gridX: number, gridY: number): void {
    const preset = EFFECT_PRESETS.rugPull;
    const isoPos = gridToIso(gridX, gridY);
    const textureKey = this.getOrCreateParticleTexture(preset.color || 0xFF0000, 6);
    
    // Explosion particles
    const emitter = this.scene.add.particles(
      isoPos.x,
      isoPos.y - 30,
      textureKey,
      {
        scale: preset.scale,
        alpha: preset.alpha,
        lifespan: preset.lifespan,
        speed: preset.speed,
        gravityY: preset.gravityY,
        quantity: preset.quantity,
        angle: preset.angle,
        blendMode: preset.blendMode,
        emitting: false,
      }
    );
    
    emitter.setDepth(500);
    emitter.explode();
    
    // Flash screen red
    this.flashScreen(0xFF0000, 0.3, 300);
    
    // Screen shake
    this.scene.cameras.main.shake(500, 0.01);
    
    this.scene.time.delayedCall(2000, () => {
      emitter.destroy();
    });
  }

  /**
   * Play a hack effect at a building
   */
  playHackEffect(gridX: number, gridY: number): void {
    const preset = EFFECT_PRESETS.hack;
    const isoPos = gridToIso(gridX, gridY);
    const textureKey = this.getOrCreateParticleTexture(preset.color || 0xFF6600, 12);
    
    // Warning pulse effect
    const emitter = this.scene.add.particles(
      isoPos.x,
      isoPos.y - 40,
      textureKey,
      {
        scale: preset.scale,
        alpha: preset.alpha,
        lifespan: preset.lifespan,
        speed: preset.speed,
        quantity: 3,
        blendMode: preset.blendMode,
        frequency: 300,
        emitting: true,
      }
    );
    
    emitter.setDepth(500);
    
    // Flash screen orange
    this.flashScreen(0xFF6600, 0.2, 200);
    
    this.scene.time.delayedCall(3000, () => {
      emitter.stop();
      this.scene.time.delayedCall(1000, () => {
        emitter.destroy();
      });
    });
  }

  /**
   * Play a whale entry effect
   */
  playWhaleEntryEffect(screenX: number, screenY: number): void {
    const preset = EFFECT_PRESETS.whaleEntry;
    const textureKey = this.getOrCreateParticleTexture(preset.color || 0x3B82F6);
    
    const emitter = this.scene.add.particles(
      screenX,
      screenY,
      textureKey,
      {
        scale: preset.scale,
        alpha: preset.alpha,
        lifespan: preset.lifespan,
        speed: preset.speed,
        gravityY: preset.gravityY,
        quantity: preset.quantity,
        angle: preset.angle,
        emitting: false,
      }
    );
    
    emitter.setDepth(500);
    emitter.explode();
    
    this.scene.time.delayedCall(2000, () => {
      emitter.destroy();
    });
  }

  /**
   * Play a liquidation cascade effect
   */
  playLiquidationEffect(): void {
    const preset = EFFECT_PRESETS.liquidation;
    const { width, height } = this.scene.cameras.main;
    const textureKey = this.getOrCreateParticleTexture(preset.color || 0xFF0000, 4);
    
    // Multiple explosion points
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(100, width - 100);
      const y = Phaser.Math.Between(100, height - 100);
      
      this.scene.time.delayedCall(i * 100, () => {
        const emitter = this.scene.add.particles(
          x, y,
          textureKey,
          {
            scale: preset.scale,
            alpha: preset.alpha,
            lifespan: preset.lifespan,
            speed: preset.speed,
            gravityY: preset.gravityY,
            quantity: preset.quantity,
            angle: preset.angle,
            emitting: false,
          }
        );
        
        emitter.setScrollFactor(0);
        emitter.setDepth(500);
        emitter.explode();
        
        this.scene.time.delayedCall(1000, () => {
          emitter.destroy();
        });
      });
    }
    
    // Flash red
    this.flashScreen(0xFF0000, 0.25, 400);
    this.scene.cameras.main.shake(600, 0.008);
  }

  /**
   * Play a protocol upgrade effect
   */
  playUpgradeEffect(gridX: number, gridY: number): void {
    const preset = EFFECT_PRESETS.upgrade;
    const isoPos = gridToIso(gridX, gridY);
    const textureKey = this.getOrCreateParticleTexture(preset.color || 0x00FFFF, 5);
    
    const emitter = this.scene.add.particles(
      isoPos.x,
      isoPos.y - 50,
      textureKey,
      {
        scale: preset.scale,
        alpha: preset.alpha,
        lifespan: preset.lifespan,
        speed: preset.speed,
        gravityY: preset.gravityY,
        quantity: preset.quantity,
        angle: preset.angle,
        blendMode: preset.blendMode,
        frequency: 100,
        emitting: true,
      }
    );
    
    emitter.setDepth(500);
    
    this.scene.time.delayedCall(2000, () => {
      emitter.stop();
      this.scene.time.delayedCall(1500, () => {
        emitter.destroy();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // PERSISTENT EFFECTS (for ongoing events)
  // ---------------------------------------------------------------------------

  /**
   * Start a bull run effect (continuous confetti)
   */
  startBullRunEffect(): void {
    if (this.persistentEmitters.has('bullRun')) return;
    
    const preset = EFFECT_PRESETS.bullRun;
    const { width } = this.scene.cameras.main;
    const textureKey = this.getOrCreateParticleTexture(preset.color || 0x22C55E, 6);
    
    const emitter = this.scene.add.particles(
      width / 2,
      -20,
      textureKey,
      {
        scale: preset.scale,
        alpha: preset.alpha,
        lifespan: preset.lifespan,
        speed: preset.speed,
        gravityY: preset.gravityY,
        quantity: preset.quantity,
        angle: preset.angle,
        frequency: 100,
        emitting: true,
        // Spread particles horizontally across the screen using random x offset
        x: { min: -width / 2, max: width / 2 },
      }
    );
    
    emitter.setScrollFactor(0);
    emitter.setDepth(400);
    
    this.persistentEmitters.set('bullRun', emitter);
  }

  /**
   * Stop the bull run effect
   */
  stopBullRunEffect(): void {
    const emitter = this.persistentEmitters.get('bullRun');
    if (emitter) {
      emitter.stop();
      this.scene.time.delayedCall(3000, () => {
        emitter.destroy();
      });
      this.persistentEmitters.delete('bullRun');
    }
  }

  /**
   * Start a bear market effect (red rain)
   */
  startBearMarketEffect(): void {
    if (this.persistentEmitters.has('bearMarket')) return;
    
    const preset = EFFECT_PRESETS.bearMarket;
    const { width } = this.scene.cameras.main;
    const textureKey = this.getOrCreateParticleTexture(preset.color || 0xEF4444, 4);
    
    const emitter = this.scene.add.particles(
      width / 2,
      -20,
      textureKey,
      {
        scale: preset.scale,
        alpha: preset.alpha,
        lifespan: preset.lifespan,
        speed: preset.speed,
        gravityY: preset.gravityY,
        quantity: preset.quantity,
        angle: preset.angle,
        frequency: 50,
        emitting: true,
        // Spread particles horizontally across the screen
        x: { min: -width / 2, max: width / 2 },
      }
    );
    
    emitter.setScrollFactor(0);
    emitter.setDepth(400);
    
    this.persistentEmitters.set('bearMarket', emitter);
    
    // Slight tint on camera
    this.scene.cameras.main.setBackgroundColor(0x1a0505);
  }

  /**
   * Stop the bear market effect
   */
  stopBearMarketEffect(): void {
    const emitter = this.persistentEmitters.get('bearMarket');
    if (emitter) {
      emitter.stop();
      this.scene.time.delayedCall(2500, () => {
        emitter.destroy();
      });
      this.persistentEmitters.delete('bearMarket');
    }
    
    // Reset camera background
    this.scene.cameras.main.setBackgroundColor(0x1a1a1a);
  }

  /**
   * Start meme rally effect
   */
  startMemeRallyEffect(): void {
    if (this.persistentEmitters.has('memeRally')) return;
    
    const preset = EFFECT_PRESETS.memeRally;
    const { width, height } = this.scene.cameras.main;
    const textureKey = this.getOrCreateParticleTexture(preset.color || 0x3D9970, 8);
    
    const emitter = this.scene.add.particles(
      width / 2,
      height + 20,
      textureKey,
      {
        scale: preset.scale,
        alpha: preset.alpha,
        lifespan: preset.lifespan,
        speed: preset.speed,
        gravityY: preset.gravityY,
        quantity: preset.quantity,
        angle: preset.angle,
        frequency: 200,
        emitting: true,
        // Spread particles horizontally across the screen
        x: { min: -width / 2, max: width / 2 },
      }
    );
    
    emitter.setScrollFactor(0);
    emitter.setDepth(400);
    
    this.persistentEmitters.set('memeRally', emitter);
  }

  /**
   * Stop meme rally effect
   */
  stopMemeRallyEffect(): void {
    const emitter = this.persistentEmitters.get('memeRally');
    if (emitter) {
      emitter.stop();
      this.scene.time.delayedCall(3000, () => {
        emitter.destroy();
      });
      this.persistentEmitters.delete('memeRally');
    }
  }

  // ---------------------------------------------------------------------------
  // SCREEN EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * Flash the screen with a color
   */
  flashScreen(color: number, alpha: number = 0.3, duration: number = 200): void {
    if (!this.flashOverlay) return;
    
    this.flashOverlay.setFillStyle(color, alpha);
    
    this.scene.tweens.add({
      targets: this.flashOverlay,
      alpha: { from: alpha, to: 0 },
      duration,
      ease: 'Power2',
    });
  }

  /**
   * Handle an event type and trigger appropriate effects
   */
  handleEventEffect(eventType: CryptoEventType, x?: number, y?: number): void {
    switch (eventType) {
      case 'bullRun':
        this.startBullRunEffect();
        this.flashScreen(0x22C55E, 0.2, 500);
        break;
        
      case 'bearMarket':
        this.startBearMarketEffect();
        this.flashScreen(0xEF4444, 0.2, 500);
        break;
        
      case 'airdrop':
      case 'airdropSeason':
        const { width, height } = this.scene.cameras.main;
        this.playAirdropEffect(width / 2, height / 4);
        break;
        
      case 'rugPull':
        if (x !== undefined && y !== undefined) {
          this.playRugPullEffect(x, y);
        }
        break;
        
      case 'hack':
        if (x !== undefined && y !== undefined) {
          this.playHackEffect(x, y);
        }
        break;
        
      case 'whaleEntry':
        const cam = this.scene.cameras.main;
        this.playWhaleEntryEffect(cam.width / 2, cam.height / 2);
        break;
        
      case 'liquidation':
        this.playLiquidationEffect();
        break;
        
      case 'memeRally':
        this.startMemeRallyEffect();
        break;
        
      case 'protocolUpgrade':
        if (x !== undefined && y !== undefined) {
          this.playUpgradeEffect(x, y);
        }
        break;
        
      case 'merge':
        this.flashScreen(0x00FFFF, 0.3, 1000);
        break;
        
      case 'halving':
        this.flashScreen(0xF7931A, 0.25, 800);
        break;
        
      case 'regulatoryFUD':
        this.flashScreen(0x666666, 0.2, 600);
        break;
    }
  }

  /**
   * Handle event ending and stop persistent effects
   */
  handleEventEnd(eventType: CryptoEventType): void {
    switch (eventType) {
      case 'bullRun':
        this.stopBullRunEffect();
        break;
      case 'bearMarket':
        this.stopBearMarketEffect();
        break;
      case 'memeRally':
        this.stopMemeRallyEffect();
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------

  /**
   * Stop all effects and clean up
   */
  destroy(): void {
    // Stop all persistent emitters
    for (const emitter of this.persistentEmitters.values()) {
      emitter.destroy();
    }
    this.persistentEmitters.clear();
    
    // Destroy flash overlay
    this.flashOverlay?.destroy();
  }
}

