/**
 * NPC Profiler - Performance Measurement Utilities for Scale Testing
 * 
 * GitHub Issue #198: Verify the system handles 200+ NPCs at 60fps.
 * Part of Phase 8: Polish & Scale.
 * 
 * Provides:
 * - Performance metrics collection (fps, frame time, memory)
 * - Function benchmarking with statistics
 * - Memory leak detection
 * - Performance regression comparison
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Performance metrics captured during profiling
 */
export interface PerformanceMetrics {
  /** Frames per second achieved */
  fps: number;
  /** Average frame time in milliseconds */
  frameTime: number;
  /** Current memory usage in bytes */
  memoryUsage: number;
  /** Number of NPCs being simulated */
  npcCount: number;
  /** Time spent in update logic in milliseconds */
  updateTime: number;
}

/**
 * Benchmark results for a measured function
 */
export interface Benchmark {
  /** Name/identifier for the benchmark */
  name: string;
  /** Number of iterations run */
  iterations: number;
  /** Average execution time in milliseconds */
  avgTime: number;
  /** Minimum execution time in milliseconds */
  minTime: number;
  /** Maximum execution time in milliseconds */
  maxTime: number;
  /** Standard deviation of execution times */
  stdDev: number;
}

/**
 * Hotspot report identifying performance-critical functions
 */
export interface HotspotReport {
  /** Function or code section name */
  function: string;
  /** Total time spent in this function */
  totalTime: number;
  /** Number of times the function was called */
  callCount: number;
  /** Average time per call */
  avgTime: number;
}

/**
 * Comparison result between current and baseline metrics
 */
export interface BaselineComparison {
  /** Whether a regression was detected */
  hasRegression: boolean;
  /** FPS change (positive = improvement) */
  fpsChange: number;
  /** Frame time change (negative = improvement) */
  frameTimeChange: number;
  /** Memory change in bytes */
  memoryChange: number;
  /** Update time change */
  updateTimeChange: number;
  /** Detailed breakdown by metric */
  details: {
    metric: string;
    baseline: number;
    current: number;
    change: number;
    changePercent: number;
    isRegression: boolean;
  }[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Frame budget for 60fps in milliseconds
 */
const FRAME_BUDGET_60FPS = 16.67;

/**
 * Memory leak threshold (1MB)
 */
const MEMORY_LEAK_THRESHOLD = 1024 * 1024;

/**
 * Regression threshold percentages
 */
const REGRESSION_THRESHOLDS = {
  fps: -10,           // 10% fps drop is a regression
  frameTime: 20,      // 20% frame time increase is a regression
  memoryUsage: 50,    // 50% memory increase is a regression
  updateTime: 30,     // 30% update time increase is a regression
};

// =============================================================================
// NPCProfiler CLASS
// =============================================================================

/**
 * NPCProfiler - Main profiling class for performance measurement
 */
export class NPCProfiler {
  private profilingActive: boolean = false;
  private startTime: number = 0;
  private frameTimes: number[] = [];
  private memorySamples: number[] = [];
  private lastFrameTime: number = 0;
  private hotspots: Map<string, { totalTime: number; callCount: number }> = new Map();
  private lastMetrics: PerformanceMetrics | null = null;

  /**
   * Create a new profiler instance
   */
  constructor() {
    this.reset();
  }

  /**
   * Reset profiler state
   */
  reset(): void {
    this.profilingActive = false;
    this.startTime = 0;
    this.frameTimes = [];
    this.memorySamples = [];
    this.lastFrameTime = 0;
    this.hotspots.clear();
    this.lastMetrics = null;
  }

  /**
   * Check if profiling is currently active
   */
  isProfiling(): boolean {
    return this.profilingActive;
  }

  /**
   * Begin performance recording
   */
  startProfiling(): void {
    this.reset();
    this.profilingActive = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.memorySamples.push(this.trackMemory());
  }

  /**
   * End recording and return collected metrics
   */
  stopProfiling(): PerformanceMetrics {
    if (!this.profilingActive) {
      return this.getDefaultMetrics();
    }

    const endTime = performance.now();
    this.profilingActive = false;

    // Calculate final metrics
    const totalTime = endTime - this.startTime;
    const frameCount = this.frameTimes.length || 1;
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : totalTime;
    
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    
    this.lastMetrics = {
      fps,
      frameTime: avgFrameTime,
      memoryUsage: this.trackMemory(),
      npcCount: this.getCurrentNPCCount(),
      updateTime: avgFrameTime * 0.8, // Estimate update time as 80% of frame time
    };

    return this.lastMetrics;
  }

  /**
   * Record a frame time measurement
   */
  recordFrame(): void {
    if (!this.profilingActive) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.frameTimes.push(frameTime);
    this.lastFrameTime = now;
  }

  /**
   * Benchmark a function with multiple iterations
   * 
   * @param fn Function to benchmark
   * @param iterations Number of times to run the function
   * @param name Optional name for the benchmark
   */
  measureFunction<T>(
    fn: () => T,
    iterations: number = 100,
    name: string = 'anonymous'
  ): Benchmark {
    const times: number[] = [];

    // Warm up
    for (let i = 0; i < Math.min(5, iterations); i++) {
      fn();
    }

    // Measure
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
    }

    // Calculate statistics
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    // Calculate standard deviation
    const variance = times.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);

    return {
      name,
      iterations,
      avgTime,
      minTime,
      maxTime,
      stdDev,
    };
  }

  /**
   * Snapshot current memory usage
   * 
   * Note: In browsers, this uses performance.memory if available (Chrome only)
   * In Node.js, this uses process.memoryUsage()
   */
  trackMemory(): number {
    // Try browser API first (Chrome-only)
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      if (memory && typeof memory.usedJSHeapSize === 'number') {
        return memory.usedJSHeapSize;
      }
    }

    // Try Node.js API
    if (typeof process !== 'undefined' && process.memoryUsage) {
      try {
        return process.memoryUsage().heapUsed;
      } catch {
        // Fall through to estimate
      }
    }

    // Return an estimate based on NPC count if we can't get real memory
    const npcCount = this.getCurrentNPCCount();
    // Estimate ~10KB per NPC as a rough baseline
    return npcCount * 10 * 1024 + 20 * 1024 * 1024; // Base 20MB + 10KB per NPC
  }

  /**
   * Detect memory leaks from a series of memory samples
   * 
   * A memory leak is detected if:
   * 1. Memory consistently grows across samples
   * 2. Total growth exceeds the threshold (1MB)
   * 
   * @param samples Array of memory measurements
   * @returns true if a memory leak is detected
   */
  detectMemoryLeak(samples: number[]): boolean {
    if (samples.length < 3) return false;

    // Calculate memory growth
    const firstSample = samples[0];
    const lastSample = samples[samples.length - 1];
    const totalGrowth = lastSample - firstSample;

    // Check if growth exceeds threshold
    if (totalGrowth > MEMORY_LEAK_THRESHOLD) {
      // Verify it's consistently growing (not just spikes)
      let growthCount = 0;
      for (let i = 1; i < samples.length; i++) {
        if (samples[i] > samples[i - 1]) {
          growthCount++;
        }
      }
      
      // If more than 70% of samples show growth, it's likely a leak
      const growthRatio = growthCount / (samples.length - 1);
      return growthRatio > 0.7;
    }

    return false;
  }

  /**
   * Generate a human-readable performance report
   */
  generateReport(): string {
    const metrics = this.lastMetrics || this.getDefaultMetrics();
    const hotspotData = this.getHotspotReport();

    let report = `=== NPC Performance Report ===\n\n`;
    
    report += `Performance Metrics:\n`;
    report += `  FPS: ${metrics.fps.toFixed(1)}\n`;
    report += `  Frame Time: ${metrics.frameTime.toFixed(2)}ms\n`;
    report += `  Memory Usage: ${(metrics.memoryUsage / (1024 * 1024)).toFixed(2)}MB\n`;
    report += `  NPC Count: ${metrics.npcCount}\n`;
    report += `  Update Time: ${metrics.updateTime.toFixed(2)}ms\n`;
    report += `\n`;

    report += `Frame Time Budget:\n`;
    const budgetUsage = (metrics.frameTime / FRAME_BUDGET_60FPS) * 100;
    report += `  Budget Used: ${budgetUsage.toFixed(1)}%\n`;
    report += `  Status: ${budgetUsage <= 100 ? '✓ Within Budget' : '✗ Over Budget'}\n`;
    report += `\n`;

    if (hotspotData.length > 0) {
      report += `Hotspots:\n`;
      for (const hotspot of hotspotData) {
        report += `  ${hotspot.function}: ${hotspot.totalTime.toFixed(2)}ms total, ${hotspot.callCount} calls, ${hotspot.avgTime.toFixed(3)}ms/call\n`;
      }
      report += `\n`;
    }

    if (this.frameTimes.length > 0) {
      const sortedTimes = [...this.frameTimes].sort((a, b) => a - b);
      const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
      const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
      
      report += `Frame Time Distribution:\n`;
      report += `  P50: ${p50?.toFixed(2) || 'N/A'}ms\n`;
      report += `  P95: ${p95?.toFixed(2) || 'N/A'}ms\n`;
      report += `  P99: ${p99?.toFixed(2) || 'N/A'}ms\n`;
    }

    return report;
  }

  /**
   * Compare current metrics against a baseline
   * 
   * @param current Current performance metrics
   * @param baseline Baseline metrics to compare against
   */
  compareBaselines(
    current: PerformanceMetrics,
    baseline: PerformanceMetrics
  ): BaselineComparison {
    const details: BaselineComparison['details'] = [];

    // FPS comparison (higher is better)
    const fpsChange = current.fps - baseline.fps;
    const fpsChangePercent = (fpsChange / baseline.fps) * 100;
    details.push({
      metric: 'fps',
      baseline: baseline.fps,
      current: current.fps,
      change: fpsChange,
      changePercent: fpsChangePercent,
      isRegression: fpsChangePercent < REGRESSION_THRESHOLDS.fps,
    });

    // Frame time comparison (lower is better)
    const frameTimeChange = current.frameTime - baseline.frameTime;
    const frameTimeChangePercent = (frameTimeChange / baseline.frameTime) * 100;
    details.push({
      metric: 'frameTime',
      baseline: baseline.frameTime,
      current: current.frameTime,
      change: frameTimeChange,
      changePercent: frameTimeChangePercent,
      isRegression: frameTimeChangePercent > REGRESSION_THRESHOLDS.frameTime,
    });

    // Memory comparison (lower is better)
    const memoryChange = current.memoryUsage - baseline.memoryUsage;
    const memoryChangePercent = (memoryChange / baseline.memoryUsage) * 100;
    details.push({
      metric: 'memoryUsage',
      baseline: baseline.memoryUsage,
      current: current.memoryUsage,
      change: memoryChange,
      changePercent: memoryChangePercent,
      isRegression: memoryChangePercent > REGRESSION_THRESHOLDS.memoryUsage,
    });

    // Update time comparison (lower is better)
    const updateTimeChange = current.updateTime - baseline.updateTime;
    const updateTimeChangePercent = (updateTimeChange / baseline.updateTime) * 100;
    details.push({
      metric: 'updateTime',
      baseline: baseline.updateTime,
      current: current.updateTime,
      change: updateTimeChange,
      changePercent: updateTimeChangePercent,
      isRegression: updateTimeChangePercent > REGRESSION_THRESHOLDS.updateTime,
    });

    // Check if any metric has regressed
    const hasRegression = details.some(d => d.isRegression);

    return {
      hasRegression,
      fpsChange,
      frameTimeChange,
      memoryChange,
      updateTimeChange,
      details,
    };
  }

  /**
   * Track a hotspot (performance-critical code section)
   */
  trackHotspot(name: string, time: number): void {
    const existing = this.hotspots.get(name);
    if (existing) {
      existing.totalTime += time;
      existing.callCount++;
    } else {
      this.hotspots.set(name, { totalTime: time, callCount: 1 });
    }
  }

  /**
   * Get hotspot report sorted by total time
   */
  getHotspotReport(): HotspotReport[] {
    const reports: HotspotReport[] = [];
    
    for (const [name, data] of this.hotspots.entries()) {
      reports.push({
        function: name,
        totalTime: data.totalTime,
        callCount: data.callCount,
        avgTime: data.totalTime / data.callCount,
      });
    }

    return reports.sort((a, b) => b.totalTime - a.totalTime);
  }

  /**
   * Get current NPC count from NPCManager if available
   */
  private getCurrentNPCCount(): number {
    try {
      // Dynamically import to avoid circular dependencies
      const { NPCManager } = require('./NPCManager');
      return NPCManager.getCount();
    } catch {
      return 0;
    }
  }

  /**
   * Get default metrics when profiling hasn't run
   */
  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      frameTime: 0,
      memoryUsage: this.trackMemory(),
      npcCount: this.getCurrentNPCCount(),
      updateTime: 0,
    };
  }
}

// =============================================================================
// MODULE-LEVEL SINGLETON & CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Global profiler instance for convenience functions
 */
let globalProfiler: NPCProfiler | null = null;

/**
 * Get the global profiler instance (creates one if needed)
 */
function getGlobalProfiler(): NPCProfiler {
  if (!globalProfiler) {
    globalProfiler = new NPCProfiler();
  }
  return globalProfiler;
}

/**
 * Reset the global profiler instance
 */
export function resetProfiler(): void {
  globalProfiler = null;
}

/**
 * Start profiling using the global profiler
 */
export function startProfiling(): void {
  getGlobalProfiler().startProfiling();
}

/**
 * Stop profiling and return metrics using the global profiler
 */
export function stopProfiling(): PerformanceMetrics {
  return getGlobalProfiler().stopProfiling();
}

/**
 * Measure a function using the global profiler
 */
export function measureFunction<T>(
  fn: () => T,
  iterations: number = 100,
  name?: string
): Benchmark {
  return getGlobalProfiler().measureFunction(fn, iterations, name);
}

/**
 * Track memory using the global profiler
 */
export function trackMemory(): number {
  return getGlobalProfiler().trackMemory();
}

/**
 * Detect memory leaks using the global profiler
 */
export function detectMemoryLeak(samples: number[]): boolean {
  return getGlobalProfiler().detectMemoryLeak(samples);
}

/**
 * Generate a report using the global profiler
 */
export function generateReport(): string {
  return getGlobalProfiler().generateReport();
}

/**
 * Compare baselines using the global profiler
 */
export function compareBaselines(
  current: PerformanceMetrics,
  baseline: PerformanceMetrics
): BaselineComparison {
  return getGlobalProfiler().compareBaselines(current, baseline);
}

// =============================================================================
// EXPORTS - NPCProfiler class is already exported at definition
// =============================================================================
