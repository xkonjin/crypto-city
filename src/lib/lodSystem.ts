/**
 * Level-of-Detail (LOD) System
 * Final Optimization: Reduce detail for distant entities
 * 
 * Enables 2-3x more entities on screen
 */

export type LODLevel = 'ultra' | 'high' | 'medium' | 'low' | 'culled';

export interface LODConfig {
  ultraDistance: number;
  highDistance: number;
  mediumDistance: number;
  lowDistance: number;
  cullDistance: number;
}

export interface LODEntity {
  id: string;
  x: number;
  y: number;
  lodLevel?: LODLevel;
}

/**
 * Default LOD configuration
 */
export const DEFAULT_LOD_CONFIG: LODConfig = {
  ultraDistance: 50,   // Within 50 units: full detail
  highDistance: 100,   // 50-100 units: high detail
  mediumDistance: 200, // 100-200 units: medium detail
  lowDistance: 400,    // 200-400 units: low detail
  cullDistance: 600,   // Beyond 400 units: culled
};

/**
 * LOD manager
 */
export class LODManager {
  private config: LODConfig;
  private cameraPosition: { x: number; y: number };
  
  constructor(config: LODConfig = DEFAULT_LOD_CONFIG) {
    this.config = config;
    this.cameraPosition = { x: 0, y: 0 };
  }
  
  /**
   * Update camera position
   */
  setCameraPosition(x: number, y: number): void {
    this.cameraPosition.x = x;
    this.cameraPosition.y = y;
  }
  
  /**
   * Calculate distance from camera
   */
  private getDistance(x: number, y: number): number {
    const dx = x - this.cameraPosition.x;
    const dy = y - this.cameraPosition.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Get LOD level for entity
   */
  getLODLevel(entity: LODEntity): LODLevel {
    const distance = this.getDistance(entity.x, entity.y);
    
    if (distance > this.config.cullDistance) return 'culled';
    if (distance > this.config.lowDistance) return 'low';
    if (distance > this.config.mediumDistance) return 'medium';
    if (distance > this.config.highDistance) return 'high';
    return 'ultra';
  }
  
  /**
   * Update LOD levels for entities
   */
  updateLODLevels<T extends LODEntity>(entities: T[]): T[] {
    return entities.map(entity => ({
      ...entity,
      lodLevel: this.getLODLevel(entity),
    }));
  }
  
  /**
   * Filter entities by LOD level
   */
  filterByLOD<T extends LODEntity>(
    entities: T[],
    minLevel: LODLevel = 'low'
  ): T[] {
    const levelPriority: Record<LODLevel, number> = {
      ultra: 4,
      high: 3,
      medium: 2,
      low: 1,
      culled: 0,
    };
    
    const minPriority = levelPriority[minLevel];
    
    return entities.filter(entity => {
      const level = entity.lodLevel || this.getLODLevel(entity);
      return levelPriority[level] >= minPriority;
    });
  }
  
  /**
   * Get LOD statistics
   */
  getStats<T extends LODEntity>(entities: T[]): Record<LODLevel, number> {
    const stats: Record<LODLevel, number> = {
      ultra: 0,
      high: 0,
      medium: 0,
      low: 0,
      culled: 0,
    };
    
    for (const entity of entities) {
      const level = entity.lodLevel || this.getLODLevel(entity);
      stats[level]++;
    }
    
    return stats;
  }
  
  /**
   * Update LOD configuration
   */
  setConfig(config: Partial<LODConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * LOD rendering strategies
 */
export const LODRenderStrategies = {
  /**
   * Should render shadows at this LOD level
   */
  shouldRenderShadows(level: LODLevel): boolean {
    return level === 'ultra' || level === 'high';
  },
  
  /**
   * Should animate at this LOD level
   */
  shouldAnimate(level: LODLevel): boolean {
    return level === 'ultra' || level === 'high';
  },
  
  /**
   * Should render particles at this LOD level
   */
  shouldRenderParticles(level: LODLevel): boolean {
    return level === 'ultra';
  },
  
  /**
   * Get texture quality multiplier
   */
  getTextureQuality(level: LODLevel): number {
    switch (level) {
      case 'ultra': return 1.0;
      case 'high': return 0.75;
      case 'medium': return 0.5;
      case 'low': return 0.25;
      case 'culled': return 0;
    }
  },
  
  /**
   * Get update frequency multiplier
   */
  getUpdateFrequency(level: LODLevel): number {
    switch (level) {
      case 'ultra': return 1.0;   // Every frame
      case 'high': return 0.5;    // Every 2 frames
      case 'medium': return 0.25; // Every 4 frames
      case 'low': return 0.1;     // Every 10 frames
      case 'culled': return 0;    // Never
    }
  },
  
  /**
   * Should render details (windows, decorations, etc.)
   */
  shouldRenderDetails(level: LODLevel): boolean {
    return level === 'ultra' || level === 'high';
  },
};

/**
 * Adaptive LOD based on performance
 */
export class AdaptiveLODManager extends LODManager {
  private targetFPS: number;
  private currentFPS: number = 60;
  private adjustmentFactor: number = 1.0;
  
  constructor(config: LODConfig = DEFAULT_LOD_CONFIG, targetFPS: number = 60) {
    super(config);
    this.targetFPS = targetFPS;
  }
  
  /**
   * Update current FPS
   */
  updateFPS(fps: number): void {
    this.currentFPS = fps;
    this.adjustLODDistances();
  }
  
  /**
   * Adjust LOD distances based on performance
   */
  private adjustLODDistances(): void {
    const fpsRatio = this.currentFPS / this.targetFPS;
    
    if (fpsRatio < 0.9) {
      // Performance is poor, reduce LOD distances
      this.adjustmentFactor = Math.max(0.5, this.adjustmentFactor * 0.95);
    } else if (fpsRatio > 1.1) {
      // Performance is good, increase LOD distances
      this.adjustmentFactor = Math.min(1.5, this.adjustmentFactor * 1.02);
    }
    
    // Apply adjustment to config
    const baseConfig = DEFAULT_LOD_CONFIG;
    this.setConfig({
      ultraDistance: baseConfig.ultraDistance * this.adjustmentFactor,
      highDistance: baseConfig.highDistance * this.adjustmentFactor,
      mediumDistance: baseConfig.mediumDistance * this.adjustmentFactor,
      lowDistance: baseConfig.lowDistance * this.adjustmentFactor,
      cullDistance: baseConfig.cullDistance * this.adjustmentFactor,
    });
  }
  
  /**
   * Get adjustment factor
   */
  getAdjustmentFactor(): number {
    return this.adjustmentFactor;
  }
  
  /**
   * Reset adjustment
   */
  resetAdjustment(): void {
    this.adjustmentFactor = 1.0;
    this.setConfig(DEFAULT_LOD_CONFIG);
  }
}

/**
 * LOD transition smoothing
 */
export class LODTransition {
  private transitions: Map<string, {
    fromLevel: LODLevel;
    toLevel: LODLevel;
    startTime: number;
    duration: number;
  }> = new Map();
  
  private transitionDuration: number = 500; // ms
  
  /**
   * Start LOD transition for entity
   */
  startTransition(
    entityId: string,
    fromLevel: LODLevel,
    toLevel: LODLevel
  ): void {
    this.transitions.set(entityId, {
      fromLevel,
      toLevel,
      startTime: Date.now(),
      duration: this.transitionDuration,
    });
  }
  
  /**
   * Get transition progress (0-1)
   */
  getProgress(entityId: string): number {
    const transition = this.transitions.get(entityId);
    if (!transition) return 1;
    
    const elapsed = Date.now() - transition.startTime;
    const progress = Math.min(1, elapsed / transition.duration);
    
    if (progress >= 1) {
      this.transitions.delete(entityId);
    }
    
    return progress;
  }
  
  /**
   * Check if entity is transitioning
   */
  isTransitioning(entityId: string): boolean {
    return this.transitions.has(entityId);
  }
  
  /**
   * Clear all transitions
   */
  clear(): void {
    this.transitions.clear();
  }
}

/**
 * Global LOD manager instance
 */
export const lodManager = new AdaptiveLODManager();
