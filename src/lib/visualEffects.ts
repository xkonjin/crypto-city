/**
 * Visual Effects System
 * Provides particle effects, lighting, and visual polish for the game
 */

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: ParticleType;
}

export type ParticleType = 
  | 'smoke'
  | 'sparkle'
  | 'coin'
  | 'construction'
  | 'fire'
  | 'water'
  | 'snow'
  | 'rain';

export class ParticleSystem {
  private particles: Particle[] = [];
  private nextId = 0;
  private maxParticles = 1000;

  /**
   * Emit particles from a source position
   */
  emit(
    x: number,
    y: number,
    count: number,
    type: ParticleType,
    options?: Partial<Particle>
  ): void {
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      
      this.particles.push({
        id: `particle_${this.nextId++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 60 + 30, // 30-90 frames
        size: Math.random() * 4 + 2,
        color: this.getColorForType(type),
        alpha: 1,
        type,
        ...options,
      });
    }
  }

  /**
   * Update all particles
   */
  update(deltaTime: number): void {
    this.particles = this.particles.filter(p => {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life += deltaTime;
      p.alpha = 1 - (p.life / p.maxLife);
      
      // Apply gravity for certain particle types
      if (p.type === 'smoke') {
        p.vy -= 0.1 * deltaTime; // Rise up
      } else if (p.type === 'rain' || p.type === 'snow') {
        p.vy += 0.2 * deltaTime; // Fall down
      }
      
      return p.life < p.maxLife;
    });
  }

  /**
   * Render all particles to canvas
   */
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      
      if (p.type === 'sparkle') {
        // Draw star shape for sparkles
        this.drawStar(ctx, p.x, p.y, p.size);
      } else {
        // Draw circle for other particles
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
  }

  /**
   * Get particle count
   */
  getCount(): number {
    return this.particles.length;
  }

  private getColorForType(type: ParticleType): string {
    switch (type) {
      case 'smoke': return '#888888';
      case 'sparkle': return '#FFD700';
      case 'coin': return '#F7931A';
      case 'construction': return '#8B4513';
      case 'fire': return '#FF4500';
      case 'water': return '#4169E1';
      case 'snow': return '#FFFFFF';
      case 'rain': return '#87CEEB';
      default: return '#FFFFFF';
    }
  }

  private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const px = x + Math.cos(angle) * size;
      const py = y + Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Lighting System
 * Provides dynamic lighting effects for buildings and environment
 */
export interface Light {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  flicker?: boolean;
}

export class LightingSystem {
  private lights: Map<string, Light> = new Map();

  /**
   * Add a light source
   */
  addLight(id: string, light: Light): void {
    this.lights.set(id, light);
  }

  /**
   * Remove a light source
   */
  removeLight(id: string): void {
    this.lights.delete(id);
  }

  /**
   * Update lighting (handle flickering, etc.)
   */
  update(deltaTime: number): void {
    for (const [id, light] of this.lights) {
      if (light.flicker) {
        // Random flicker effect
        light.intensity = 0.8 + Math.random() * 0.2;
      }
    }
  }

  /**
   * Render lighting overlay
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    
    // Create darkness overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, width, height);
    
    // Add lights
    ctx.globalCompositeOperation = 'lighter';
    
    for (const light of this.lights.values()) {
      const gradient = ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, light.radius
      );
      
      gradient.addColorStop(0, `${light.color}${Math.floor(light.intensity * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(
        light.x - light.radius,
        light.y - light.radius,
        light.radius * 2,
        light.radius * 2
      );
    }
    
    ctx.restore();
  }

  /**
   * Clear all lights
   */
  clear(): void {
    this.lights.clear();
  }
}

/**
 * Shadow System
 * Provides drop shadows for buildings and objects
 */
export class ShadowSystem {
  /**
   * Draw a drop shadow for an isometric building
   */
  drawBuildingShadow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: {
      opacity?: number;
      blur?: number;
      offsetX?: number;
      offsetY?: number;
    }
  ): void {
    const {
      opacity = 0.3,
      blur = 4,
      offsetX = 4,
      offsetY = 4,
    } = options || {};
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.filter = `blur(${blur}px)`;
    ctx.fillStyle = '#000000';
    
    // Draw isometric shadow shape
    ctx.beginPath();
    ctx.moveTo(x + offsetX, y + height / 2 + offsetY);
    ctx.lineTo(x + width / 2 + offsetX, y + height + offsetY);
    ctx.lineTo(x + width + offsetX, y + height / 2 + offsetY);
    ctx.lineTo(x + width / 2 + offsetX, y + offsetY);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * Draw ambient occlusion for tile edges
   */
  drawTileAO(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tileWidth: number,
    tileHeight: number
  ): void {
    ctx.save();
    ctx.globalAlpha = 0.2;
    
    // Draw darker edges on bottom and right
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x + tileWidth / 2, y + tileHeight);
    ctx.lineTo(x + tileWidth, y + tileHeight / 2);
    ctx.lineTo(x + tileWidth / 2, y + tileHeight - 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}

/**
 * Weather Effects
 * Provides rain, snow, and other weather effects
 */
export class WeatherSystem {
  private particleSystem: ParticleSystem;
  private weatherType: 'none' | 'rain' | 'snow' = 'none';
  private intensity = 0.5;

  constructor(particleSystem: ParticleSystem) {
    this.particleSystem = particleSystem;
  }

  /**
   * Set weather type
   */
  setWeather(type: 'none' | 'rain' | 'snow', intensity: number = 0.5): void {
    this.weatherType = type;
    this.intensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Update weather effects
   */
  update(width: number, height: number): void {
    if (this.weatherType === 'none') return;
    
    const particleCount = Math.floor(this.intensity * 5);
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = -10;
      
      if (this.weatherType === 'rain') {
        this.particleSystem.emit(x, y, 1, 'rain', {
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 5 + 5,
          size: 1,
          maxLife: 60,
        });
      } else if (this.weatherType === 'snow') {
        this.particleSystem.emit(x, y, 1, 'snow', {
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 2 + 1,
          size: Math.random() * 3 + 1,
          maxLife: 120,
        });
      }
    }
  }
}

/**
 * Building Effects
 * Provides visual effects for buildings (smoke, lights, etc.)
 */
export class BuildingEffects {
  private particleSystem: ParticleSystem;
  private lightingSystem: LightingSystem;

  constructor(particleSystem: ParticleSystem, lightingSystem: LightingSystem) {
    this.particleSystem = particleSystem;
    this.lightingSystem = lightingSystem;
  }

  /**
   * Add smoke effect for industrial buildings
   */
  addSmoke(buildingId: string, x: number, y: number): void {
    this.particleSystem.emit(x, y, 2, 'smoke', {
      vx: Math.random() * 0.5 - 0.25,
      vy: -1,
      maxLife: 90,
    });
  }

  /**
   * Add sparkle effect for commercial buildings
   */
  addSparkle(buildingId: string, x: number, y: number): void {
    if (Math.random() < 0.1) {
      this.particleSystem.emit(x, y, 1, 'sparkle', {
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
        maxLife: 30,
      });
    }
  }

  /**
   * Add building lights for night time
   */
  addBuildingLights(buildingId: string, x: number, y: number, color: string = '#FFD700'): void {
    this.lightingSystem.addLight(`building_${buildingId}`, {
      x,
      y,
      radius: 100,
      color,
      intensity: 0.8,
      flicker: Math.random() < 0.3, // 30% chance of flickering
    });
  }

  /**
   * Remove building effects
   */
  removeEffects(buildingId: string): void {
    this.lightingSystem.removeLight(`building_${buildingId}`);
  }
}

/**
 * Visual Effects Manager
 * Coordinates all visual effects systems
 */
export class VisualEffectsManager {
  public particles: ParticleSystem;
  public lighting: LightingSystem;
  public shadows: ShadowSystem;
  public weather: WeatherSystem;
  public buildings: BuildingEffects;

  private isNightTime = false;

  constructor() {
    this.particles = new ParticleSystem();
    this.lighting = new LightingSystem();
    this.shadows = new ShadowSystem();
    this.weather = new WeatherSystem(this.particles);
    this.buildings = new BuildingEffects(this.particles, this.lighting);
  }

  /**
   * Update all visual effects
   */
  update(deltaTime: number, width: number, height: number): void {
    this.particles.update(deltaTime);
    this.lighting.update(deltaTime);
    this.weather.update(width, height);
  }

  /**
   * Render all visual effects
   */
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Render particles
    this.particles.render(ctx);
    
    // Render lighting if night time
    if (this.isNightTime) {
      this.lighting.render(ctx, width, height);
    }
  }

  /**
   * Set day/night cycle
   */
  setNightTime(isNight: boolean): void {
    this.isNightTime = isNight;
    if (!isNight) {
      this.lighting.clear();
    }
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this.particles.clear();
    this.lighting.clear();
  }
}
