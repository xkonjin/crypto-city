/**
 * Graphics Settings and Performance Modes
 * Issue #248: Implement Reduced Graphics Mode for Low-End Devices
 * 
 * Provides adaptive graphics quality based on device capabilities
 */

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface GraphicsSettings {
  quality: GraphicsQuality;
  particleEffects: boolean;
  shadows: boolean;
  animations: boolean;
  weatherEffects: boolean;
  npcCount: number;
  maxBuildings: number;
  textureQuality: number; // 0.5, 0.75, 1.0
  targetFPS: number;
}

/**
 * Preset graphics configurations
 */
export const GRAPHICS_PRESETS: Record<GraphicsQuality, GraphicsSettings> = {
  low: {
    quality: 'low',
    particleEffects: false,
    shadows: false,
    animations: false,
    weatherEffects: false,
    npcCount: 10,
    maxBuildings: 100,
    textureQuality: 0.5,
    targetFPS: 30,
  },
  medium: {
    quality: 'medium',
    particleEffects: true,
    shadows: false,
    animations: true,
    weatherEffects: false,
    npcCount: 25,
    maxBuildings: 250,
    textureQuality: 0.75,
    targetFPS: 45,
  },
  high: {
    quality: 'high',
    particleEffects: true,
    shadows: true,
    animations: true,
    weatherEffects: true,
    npcCount: 50,
    maxBuildings: 500,
    textureQuality: 1.0,
    targetFPS: 60,
  },
  ultra: {
    quality: 'ultra',
    particleEffects: true,
    shadows: true,
    animations: true,
    weatherEffects: true,
    npcCount: 100,
    maxBuildings: 1000,
    textureQuality: 1.0,
    targetFPS: 60,
  },
};

/**
 * Detect device capabilities
 */
export function detectDeviceCapabilities(): {
  isMobile: boolean;
  isLowEnd: boolean;
  cpuCores: number;
  memory: number;
  gpu: string;
} {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  // @ts-ignore - Navigator properties may not be available
  const cpuCores = navigator.hardwareConcurrency || 4;
  
  // @ts-ignore - Navigator properties may not be available
  const memory = navigator.deviceMemory || 4; // GB
  
  // Detect GPU (basic detection)
  let gpu = 'unknown';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpu = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {
    // Ignore errors
  }
  
  // Determine if device is low-end
  const isLowEnd = isMobile || cpuCores < 4 || memory < 4;
  
  return {
    isMobile,
    isLowEnd,
    cpuCores,
    memory,
    gpu,
  };
}

/**
 * Automatically determine optimal graphics quality
 */
export function getRecommendedQuality(): GraphicsQuality {
  const capabilities = detectDeviceCapabilities();
  
  if (capabilities.isLowEnd) {
    return 'low';
  }
  
  if (capabilities.isMobile) {
    return 'medium';
  }
  
  if (capabilities.cpuCores >= 8 && capabilities.memory >= 8) {
    return 'ultra';
  }
  
  if (capabilities.cpuCores >= 4 && capabilities.memory >= 4) {
    return 'high';
  }
  
  return 'medium';
}

/**
 * Performance monitor for adaptive quality
 */
export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private maxSamples: number = 60;
  private lastFrameTime: number = performance.now();
  
  /**
   * Record a frame
   */
  recordFrame(): void {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    this.frameTimes.push(frameTime);
    
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
  }
  
  /**
   * Get average FPS
   */
  getAverageFPS(): number {
    if (this.frameTimes.length === 0) return 60;
    
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return Math.round(1000 / avgFrameTime);
  }
  
  /**
   * Get minimum FPS (1% low)
   */
  getMinimumFPS(): number {
    if (this.frameTimes.length === 0) return 60;
    
    const sorted = [...this.frameTimes].sort((a, b) => b - a);
    const onePercentIndex = Math.floor(sorted.length * 0.01);
    const worstFrameTime = sorted[onePercentIndex];
    
    return Math.round(1000 / worstFrameTime);
  }
  
  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable(targetFPS: number): boolean {
    const avgFPS = this.getAverageFPS();
    return avgFPS >= targetFPS * 0.9; // Allow 10% tolerance
  }
  
  /**
   * Reset statistics
   */
  reset(): void {
    this.frameTimes = [];
    this.lastFrameTime = performance.now();
  }
}

/**
 * Adaptive graphics quality manager
 */
export class AdaptiveGraphicsManager {
  private settings: GraphicsSettings;
  private monitor: PerformanceMonitor;
  private checkInterval: number = 5000; // 5 seconds
  private lastCheck: number = 0;
  
  constructor(initialQuality?: GraphicsQuality) {
    const quality = initialQuality || getRecommendedQuality();
    this.settings = { ...GRAPHICS_PRESETS[quality] };
    this.monitor = new PerformanceMonitor();
  }
  
  /**
   * Get current settings
   */
  getSettings(): GraphicsSettings {
    return { ...this.settings };
  }
  
  /**
   * Set graphics quality
   */
  setQuality(quality: GraphicsQuality): void {
    this.settings = { ...GRAPHICS_PRESETS[quality] };
  }
  
  /**
   * Update custom setting
   */
  updateSetting<K extends keyof GraphicsSettings>(
    key: K,
    value: GraphicsSettings[K]
  ): void {
    this.settings[key] = value;
  }
  
  /**
   * Record frame for performance monitoring
   */
  recordFrame(): void {
    this.monitor.recordFrame();
  }
  
  /**
   * Check performance and adapt quality if needed
   */
  checkAndAdapt(): boolean {
    const now = Date.now();
    
    if (now - this.lastCheck < this.checkInterval) {
      return false;
    }
    
    this.lastCheck = now;
    
    const avgFPS = this.monitor.getAverageFPS();
    const targetFPS = this.settings.targetFPS;
    
    // If FPS is too low, reduce quality
    if (avgFPS < targetFPS * 0.8) {
      return this.reduceQuality();
    }
    
    // If FPS is consistently high, we could increase quality
    // (but be conservative to avoid oscillation)
    if (avgFPS > targetFPS * 1.2) {
      return this.increaseQuality();
    }
    
    return false;
  }
  
  /**
   * Reduce graphics quality
   */
  private reduceQuality(): boolean {
    const currentQuality = this.settings.quality;
    
    if (currentQuality === 'ultra') {
      this.setQuality('high');
      return true;
    } else if (currentQuality === 'high') {
      this.setQuality('medium');
      return true;
    } else if (currentQuality === 'medium') {
      this.setQuality('low');
      return true;
    }
    
    return false;
  }
  
  /**
   * Increase graphics quality
   */
  private increaseQuality(): boolean {
    const currentQuality = this.settings.quality;
    
    if (currentQuality === 'low') {
      this.setQuality('medium');
      return true;
    } else if (currentQuality === 'medium') {
      this.setQuality('high');
      return true;
    } else if (currentQuality === 'high') {
      this.setQuality('ultra');
      return true;
    }
    
    return false;
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    avgFPS: number;
    minFPS: number;
    quality: GraphicsQuality;
  } {
    return {
      avgFPS: this.monitor.getAverageFPS(),
      minFPS: this.monitor.getMinimumFPS(),
      quality: this.settings.quality,
    };
  }
}

// Singleton instance
export const graphicsManager = new AdaptiveGraphicsManager();
