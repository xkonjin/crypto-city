/**
 * Sprite Animation System
 * Handles sprite sheet animations for buildings and game objects
 */

export interface SpriteSheet {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  framesPerRow: number;
}

export interface AnimationConfig {
  spriteSheet: SpriteSheet;
  fps: number;
  loop: boolean;
  onComplete?: () => void;
}

export class SpriteAnimation {
  private spriteSheet: SpriteSheet;
  private currentFrame = 0;
  private fps: number;
  private loop: boolean;
  private onComplete?: () => void;
  private lastFrameTime = 0;
  private frameDuration: number;
  private isPlaying = false;

  constructor(config: AnimationConfig) {
    this.spriteSheet = config.spriteSheet;
    this.fps = config.fps;
    this.loop = config.loop;
    this.onComplete = config.onComplete;
    this.frameDuration = 1000 / this.fps; // milliseconds per frame
  }

  /**
   * Update animation
   */
  update(currentTime: number): void {
    if (!this.isPlaying) return;

    if (currentTime - this.lastFrameTime >= this.frameDuration) {
      this.currentFrame++;

      if (this.currentFrame >= this.spriteSheet.frameCount) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.spriteSheet.frameCount - 1;
          this.isPlaying = false;
          this.onComplete?.();
        }
      }

      this.lastFrameTime = currentTime;
    }
  }

  /**
   * Render current frame
   */
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number = 1
  ): void {
    const frameX = (this.currentFrame % this.spriteSheet.framesPerRow) * this.spriteSheet.frameWidth;
    const frameY = Math.floor(this.currentFrame / this.spriteSheet.framesPerRow) * this.spriteSheet.frameHeight;

    ctx.drawImage(
      this.spriteSheet.image,
      frameX,
      frameY,
      this.spriteSheet.frameWidth,
      this.spriteSheet.frameHeight,
      x,
      y,
      this.spriteSheet.frameWidth * scale,
      this.spriteSheet.frameHeight * scale
    );
  }

  /**
   * Play animation
   */
  play(): void {
    this.isPlaying = true;
  }

  /**
   * Pause animation
   */
  pause(): void {
    this.isPlaying = false;
  }

  /**
   * Stop and reset animation
   */
  stop(): void {
    this.isPlaying = false;
    this.currentFrame = 0;
  }

  /**
   * Set current frame
   */
  setFrame(frame: number): void {
    this.currentFrame = Math.max(0, Math.min(frame, this.spriteSheet.frameCount - 1));
  }

  /**
   * Get current frame
   */
  getCurrentFrame(): number {
    return this.currentFrame;
  }

  /**
   * Check if animation is playing
   */
  isAnimationPlaying(): boolean {
    return this.isPlaying;
  }
}

/**
 * Building Animation Manager
 * Manages all animations for a single building
 */
export class BuildingAnimationManager {
  private animations: Map<string, SpriteAnimation> = new Map();
  private buildingId: string;

  constructor(buildingId: string) {
    this.buildingId = buildingId;
  }

  /**
   * Add animation
   */
  addAnimation(name: string, animation: SpriteAnimation): void {
    this.animations.set(name, animation);
  }

  /**
   * Get animation
   */
  getAnimation(name: string): SpriteAnimation | undefined {
    return this.animations.get(name);
  }

  /**
   * Play animation
   */
  play(name: string): void {
    this.animations.get(name)?.play();
  }

  /**
   * Play all animations
   */
  playAll(): void {
    for (const animation of this.animations.values()) {
      animation.play();
    }
  }

  /**
   * Pause animation
   */
  pause(name: string): void {
    this.animations.get(name)?.pause();
  }

  /**
   * Pause all animations
   */
  pauseAll(): void {
    for (const animation of this.animations.values()) {
      animation.pause();
    }
  }

  /**
   * Update all animations
   */
  update(currentTime: number): void {
    for (const animation of this.animations.values()) {
      animation.update(currentTime);
    }
  }

  /**
   * Render all animations
   */
  render(ctx: CanvasRenderingContext2D, baseX: number, baseY: number): void {
    // Render animations at specific offsets relative to building position
    const windowGlow = this.animations.get('windowGlow');
    if (windowGlow) {
      // Render window glow overlay on building
      windowGlow.render(ctx, baseX, baseY);
    }

    const logoPulse = this.animations.get('logoPulse');
    if (logoPulse) {
      // Render logo pulse at building center
      logoPulse.render(ctx, baseX + 64, baseY + 32);
    }

    const satelliteRotation = this.animations.get('satelliteRotation');
    if (satelliteRotation) {
      // Render satellite on rooftop
      satelliteRotation.render(ctx, baseX + 96, baseY - 32);
    }
  }

  /**
   * Clear all animations
   */
  clear(): void {
    this.animations.clear();
  }
}

/**
 * Global Animation Manager
 * Manages animations for all buildings in the game
 */
export class GlobalAnimationManager {
  private buildingManagers: Map<string, BuildingAnimationManager> = new Map();
  private spriteSheets: Map<string, SpriteSheet> = new Map();
  private loadedImages: Map<string, HTMLImageElement> = new Map();

  /**
   * Load sprite sheet
   */
  async loadSpriteSheet(
    name: string,
    path: string,
    frameWidth: number,
    frameHeight: number,
    frameCount: number,
    framesPerRow: number
  ): Promise<SpriteSheet> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const spriteSheet: SpriteSheet = {
          image: img,
          frameWidth,
          frameHeight,
          frameCount,
          framesPerRow,
        };
        this.spriteSheets.set(name, spriteSheet);
        this.loadedImages.set(name, img);
        resolve(spriteSheet);
      };
      img.onerror = reject;
      img.src = path;
    });
  }

  /**
   * Get sprite sheet
   */
  getSpriteSheet(name: string): SpriteSheet | undefined {
    return this.spriteSheets.get(name);
  }

  /**
   * Create building animation manager
   */
  createBuildingManager(buildingId: string): BuildingAnimationManager {
    const manager = new BuildingAnimationManager(buildingId);
    this.buildingManagers.set(buildingId, manager);
    return manager;
  }

  /**
   * Get building animation manager
   */
  getBuildingManager(buildingId: string): BuildingAnimationManager | undefined {
    return this.buildingManagers.get(buildingId);
  }

  /**
   * Remove building manager
   */
  removeBuildingManager(buildingId: string): void {
    this.buildingManagers.delete(buildingId);
  }

  /**
   * Update all animations
   */
  update(currentTime: number): void {
    for (const manager of this.buildingManagers.values()) {
      manager.update(currentTime);
    }
  }

  /**
   * Render all building animations
   */
  render(ctx: CanvasRenderingContext2D, buildings: Array<{ id: string; x: number; y: number }>): void {
    for (const building of buildings) {
      const manager = this.buildingManagers.get(building.id);
      if (manager) {
        manager.render(ctx, building.x, building.y);
      }
    }
  }

  /**
   * Initialize default animations
   */
  async initializeDefaultAnimations(): Promise<void> {
    await Promise.all([
      this.loadSpriteSheet(
        'windowGlow',
        '/animations/window_glow_spritesheet.png',
        64,
        64,
        8,
        8
      ),
      this.loadSpriteSheet(
        'logoPulse',
        '/animations/logo_pulse_spritesheet.png',
        128,
        128,
        6,
        6
      ),
      this.loadSpriteSheet(
        'satelliteRotation',
        '/animations/satellite_rotation_spritesheet.png',
        64,
        64,
        12,
        12
      ),
    ]);
  }

  /**
   * Setup building animations
   */
  setupBuildingAnimations(buildingId: string, buildingType: string): void {
    const manager = this.createBuildingManager(buildingId);

    // Add window glow animation for all buildings
    const windowGlowSheet = this.getSpriteSheet('windowGlow');
    if (windowGlowSheet) {
      const windowGlowAnim = new SpriteAnimation({
        spriteSheet: windowGlowSheet,
        fps: 8,
        loop: true,
      });
      manager.addAnimation('windowGlow', windowGlowAnim);
      windowGlowAnim.play();
    }

    // Add logo pulse for crypto buildings
    if (buildingType.includes('crypto')) {
      const logoPulseSheet = this.getSpriteSheet('logoPulse');
      if (logoPulseSheet) {
        const logoPulseAnim = new SpriteAnimation({
          spriteSheet: logoPulseSheet,
          fps: 6,
          loop: true,
        });
        manager.addAnimation('logoPulse', logoPulseAnim);
        logoPulseAnim.play();
      }
    }

    // Add satellite rotation for tech buildings
    if (buildingType.includes('tech') || buildingType.includes('crypto')) {
      const satelliteSheet = this.getSpriteSheet('satelliteRotation');
      if (satelliteSheet) {
        const satelliteAnim = new SpriteAnimation({
          spriteSheet: satelliteSheet,
          fps: 12,
          loop: true,
        });
        manager.addAnimation('satelliteRotation', satelliteAnim);
        satelliteAnim.play();
      }
    }
  }

  /**
   * Clear all animations
   */
  clear(): void {
    this.buildingManagers.clear();
  }
}

/**
 * Preload all animation assets
 */
export async function preloadAnimations(): Promise<GlobalAnimationManager> {
  const manager = new GlobalAnimationManager();
  await manager.initializeDefaultAnimations();
  return manager;
}
