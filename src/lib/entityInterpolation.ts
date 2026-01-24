/**
 * Entity Interpolation System
 * Expert Optimization: Smooth entity movement between frames
 * 
 * Eliminates jittery movement on low-end devices
 */

export interface InterpolatedPosition {
  current: { x: number; y: number };
  previous: { x: number; y: number };
  target: { x: number; y: number };
}

/**
 * Entity interpolation manager
 */
export class EntityInterpolation {
  private positions: Map<string, InterpolatedPosition> = new Map();
  
  /**
   * Register entity for interpolation
   */
  register(entityId: string, x: number, y: number): void {
    this.positions.set(entityId, {
      current: { x, y },
      previous: { x, y },
      target: { x, y },
    });
  }
  
  /**
   * Update entity target position
   */
  updateTarget(entityId: string, x: number, y: number): void {
    const pos = this.positions.get(entityId);
    
    if (!pos) {
      this.register(entityId, x, y);
      return;
    }
    
    // Store previous position
    pos.previous.x = pos.current.x;
    pos.previous.y = pos.current.y;
    
    // Set new target
    pos.target.x = x;
    pos.target.y = y;
  }
  
  /**
   * Get interpolated position for rendering
   */
  getPosition(entityId: string, interpolation: number): { x: number; y: number } | null {
    const pos = this.positions.get(entityId);
    if (!pos) return null;
    
    // Interpolate between previous and target
    const x = pos.previous.x + (pos.target.x - pos.previous.x) * interpolation;
    const y = pos.previous.y + (pos.target.y - pos.previous.y) * interpolation;
    
    // Update current position
    pos.current.x = x;
    pos.current.y = y;
    
    return { x, y };
  }
  
  /**
   * Remove entity from interpolation
   */
  unregister(entityId: string): void {
    this.positions.delete(entityId);
  }
  
  /**
   * Clear all entities
   */
  clear(): void {
    this.positions.clear();
  }
  
  /**
   * Get number of tracked entities
   */
  getEntityCount(): number {
    return this.positions.size;
  }
}

/**
 * Smooth movement with velocity
 */
export class SmoothMovement {
  private velocity: { x: number; y: number } = { x: 0, y: 0 };
  private position: { x: number; y: number };
  private target: { x: number; y: number };
  private smoothing: number;
  
  constructor(x: number, y: number, smoothing: number = 0.1) {
    this.position = { x, y };
    this.target = { x, y };
    this.smoothing = smoothing;
  }
  
  /**
   * Set target position
   */
  setTarget(x: number, y: number): void {
    this.target.x = x;
    this.target.y = y;
  }
  
  /**
   * Update position (call every frame)
   */
  update(deltaTime: number): void {
    // Calculate velocity towards target
    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;
    
    // Apply smoothing
    const factor = 1 - Math.pow(1 - this.smoothing, deltaTime / 16.67); // Normalize to 60 FPS
    
    this.velocity.x = dx * factor;
    this.velocity.y = dy * factor;
    
    // Update position
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
  
  /**
   * Get current position
   */
  getPosition(): { x: number; y: number } {
    return { ...this.position };
  }
  
  /**
   * Get velocity
   */
  getVelocity(): { x: number; y: number } {
    return { ...this.velocity };
  }
  
  /**
   * Check if reached target
   */
  hasReachedTarget(threshold: number = 0.1): boolean {
    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < threshold;
  }
  
  /**
   * Snap to target immediately
   */
  snapToTarget(): void {
    this.position.x = this.target.x;
    this.position.y = this.target.y;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }
}

/**
 * Camera smoothing for viewport movement
 */
export class SmoothCamera {
  private position: { x: number; y: number };
  private target: { x: number; y: number };
  private velocity: { x: number; y: number } = { x: 0, y: 0 };
  private smoothing: number;
  private maxSpeed: number;
  
  constructor(x: number, y: number, smoothing: number = 0.08, maxSpeed: number = 50) {
    this.position = { x, y };
    this.target = { x, y };
    this.smoothing = smoothing;
    this.maxSpeed = maxSpeed;
  }
  
  /**
   * Set target position
   */
  setTarget(x: number, y: number): void {
    this.target.x = x;
    this.target.y = y;
  }
  
  /**
   * Update camera position
   */
  update(deltaTime: number): void {
    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;
    
    // Apply smoothing
    const factor = 1 - Math.pow(1 - this.smoothing, deltaTime / 16.67);
    
    this.velocity.x = dx * factor;
    this.velocity.y = dy * factor;
    
    // Clamp to max speed
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (speed > this.maxSpeed) {
      const scale = this.maxSpeed / speed;
      this.velocity.x *= scale;
      this.velocity.y *= scale;
    }
    
    // Update position
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
  
  /**
   * Get current position
   */
  getPosition(): { x: number; y: number } {
    return { ...this.position };
  }
  
  /**
   * Snap to target
   */
  snapToTarget(): void {
    this.position.x = this.target.x;
    this.position.y = this.target.y;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }
}

/**
 * Animation curve for smooth transitions
 */
export class AnimationCurve {
  private startValue: number;
  private endValue: number;
  private duration: number;
  private elapsed: number = 0;
  private easing: (t: number) => number;
  
  constructor(
    startValue: number,
    endValue: number,
    duration: number,
    easing: (t: number) => number = (t) => t
  ) {
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = duration;
    this.easing = easing;
  }
  
  /**
   * Update animation
   */
  update(deltaTime: number): number {
    this.elapsed += deltaTime;
    
    if (this.elapsed >= this.duration) {
      this.elapsed = this.duration;
    }
    
    const t = this.elapsed / this.duration;
    const easedT = this.easing(t);
    
    return this.startValue + (this.endValue - this.startValue) * easedT;
  }
  
  /**
   * Check if animation is complete
   */
  isComplete(): boolean {
    return this.elapsed >= this.duration;
  }
  
  /**
   * Reset animation
   */
  reset(): void {
    this.elapsed = 0;
  }
  
  /**
   * Get progress (0-1)
   */
  getProgress(): number {
    return Math.min(1, this.elapsed / this.duration);
  }
}

/**
 * Common easing functions
 */
export const Easing = {
  linear: (t: number) => t,
  
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  
  elastic: (t: number) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
  },
  
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
};
