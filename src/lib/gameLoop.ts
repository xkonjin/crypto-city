/**
 * Fixed Timestep Game Loop
 * Expert Optimization: Frame-rate independent gameplay
 * 
 * Ensures consistent behavior across all devices and refresh rates
 */

export interface GameLoopCallbacks {
  update: (deltaTime: number) => void;
  render: (interpolation: number) => void;
  onFPSUpdate?: (fps: number) => void;
}

export interface GameLoopOptions {
  targetFPS?: number;
  maxFrameSkip?: number;
  enableFPSCounter?: boolean;
}

/**
 * Fixed timestep game loop
 * 
 * Uses accumulator pattern to decouple update rate from render rate
 * Updates run at fixed 60 FPS, rendering runs as fast as possible
 */
export class GameLoop {
  private callbacks: GameLoopCallbacks;
  private targetFPS: number;
  private fixedDeltaTime: number;
  private maxFrameSkip: number;
  private enableFPSCounter: boolean;
  
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;
  
  // FPS tracking
  private frameCount: number = 0;
  private fpsTime: number = 0;
  private currentFPS: number = 0;
  
  // Frame timing stats
  private frameStartTime: number = 0;
  private updateTime: number = 0;
  private renderTime: number = 0;
  
  constructor(callbacks: GameLoopCallbacks, options: GameLoopOptions = {}) {
    this.callbacks = callbacks;
    this.targetFPS = options.targetFPS || 60;
    this.fixedDeltaTime = 1000 / this.targetFPS;
    this.maxFrameSkip = options.maxFrameSkip || 5;
    this.enableFPSCounter = options.enableFPSCounter ?? true;
  }
  
  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.fpsTime = this.lastTime;
    this.loop();
  }
  
  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Main loop
   */
  private loop = (): void => {
    if (!this.isRunning) return;
    
    this.frameStartTime = performance.now();
    const deltaTime = this.frameStartTime - this.lastTime;
    this.lastTime = this.frameStartTime;
    
    // Add frame time to accumulator
    this.accumulator += deltaTime;
    
    // Prevent spiral of death (too many updates)
    if (this.accumulator > this.fixedDeltaTime * this.maxFrameSkip) {
      this.accumulator = this.fixedDeltaTime * this.maxFrameSkip;
    }
    
    // Update at fixed timestep
    const updateStartTime = performance.now();
    let updateCount = 0;
    
    while (this.accumulator >= this.fixedDeltaTime) {
      this.callbacks.update(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
      updateCount++;
    }
    
    this.updateTime = performance.now() - updateStartTime;
    
    // Calculate interpolation for smooth rendering
    const interpolation = this.accumulator / this.fixedDeltaTime;
    
    // Render with interpolation
    const renderStartTime = performance.now();
    this.callbacks.render(interpolation);
    this.renderTime = performance.now() - renderStartTime;
    
    // Update FPS counter
    if (this.enableFPSCounter) {
      this.updateFPS();
    }
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  };
  
  /**
   * Update FPS counter
   */
  private updateFPS(): void {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.fpsTime;
    
    if (elapsed >= 1000) {
      this.currentFPS = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.fpsTime = now;
      
      if (this.callbacks.onFPSUpdate) {
        this.callbacks.onFPSUpdate(this.currentFPS);
      }
    }
  }
  
  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.currentFPS;
  }
  
  /**
   * Get frame timing statistics
   */
  getStats(): {
    fps: number;
    updateTime: number;
    renderTime: number;
    totalTime: number;
  } {
    return {
      fps: this.currentFPS,
      updateTime: this.updateTime,
      renderTime: this.renderTime,
      totalTime: this.updateTime + this.renderTime,
    };
  }
  
  /**
   * Check if loop is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
  
  /**
   * Set target FPS
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
    this.fixedDeltaTime = 1000 / fps;
  }
}

/**
 * Frame budget manager
 * Allocates time budget to different systems based on priority
 */
export class FrameBudgetManager {
  private budgets: Map<string, number> = new Map();
  private spent: Map<string, number> = new Map();
  private frameStartTime: number = 0;
  private targetFrameTime: number;
  
  constructor(targetFPS: number = 60) {
    this.targetFrameTime = 1000 / targetFPS;
  }
  
  /**
   * Start new frame
   */
  startFrame(): void {
    this.frameStartTime = performance.now();
    this.spent.clear();
  }
  
  /**
   * Set budget for a system (percentage of frame time)
   */
  setBudget(system: string, percentage: number): void {
    this.budgets.set(system, (percentage / 100) * this.targetFrameTime);
  }
  
  /**
   * Check if system has budget remaining
   */
  hasBudget(system: string): boolean {
    const budget = this.budgets.get(system) || 0;
    const spent = this.spent.get(system) || 0;
    return spent < budget;
  }
  
  /**
   * Record time spent by system
   */
  recordTime(system: string, time: number): void {
    const current = this.spent.get(system) || 0;
    this.spent.set(system, current + time);
  }
  
  /**
   * Get remaining frame time
   */
  getRemainingTime(): number {
    const elapsed = performance.now() - this.frameStartTime;
    return Math.max(0, this.targetFrameTime - elapsed);
  }
  
  /**
   * Check if frame budget is exceeded
   */
  isOverBudget(): boolean {
    return this.getRemainingTime() <= 0;
  }
  
  /**
   * Get budget statistics
   */
  getStats(): Record<string, { budget: number; spent: number; percentage: number }> {
    const stats: Record<string, { budget: number; spent: number; percentage: number }> = {};
    
    for (const [system, budget] of this.budgets) {
      const spent = this.spent.get(system) || 0;
      stats[system] = {
        budget,
        spent,
        percentage: (spent / budget) * 100,
      };
    }
    
    return stats;
  }
}

/**
 * Delta time utilities
 */
export const DeltaTime = {
  /**
   * Convert delta time to seconds
   */
  toSeconds(deltaMs: number): number {
    return deltaMs / 1000;
  },
  
  /**
   * Apply delta time to movement
   */
  applyToMovement(velocity: number, deltaMs: number): number {
    return velocity * (deltaMs / 1000);
  },
  
  /**
   * Clamp delta time to prevent large jumps
   */
  clamp(deltaMs: number, maxMs: number = 100): number {
    return Math.min(deltaMs, maxMs);
  },
  
  /**
   * Smooth delta time using exponential moving average
   */
  smooth(currentDelta: number, previousDelta: number, smoothing: number = 0.9): number {
    return previousDelta * smoothing + currentDelta * (1 - smoothing);
  },
};

/**
 * Interpolation utilities for smooth rendering
 */
export const Interpolation = {
  /**
   * Linear interpolation
   */
  lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  },
  
  /**
   * Interpolate position
   */
  lerpPosition(
    start: { x: number; y: number },
    end: { x: number; y: number },
    t: number
  ): { x: number; y: number } {
    return {
      x: this.lerp(start.x, end.x, t),
      y: this.lerp(start.y, end.y, t),
    };
  },
  
  /**
   * Smooth step interpolation (ease in/out)
   */
  smoothStep(t: number): number {
    return t * t * (3 - 2 * t);
  },
  
  /**
   * Exponential ease out
   */
  easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  },
};
