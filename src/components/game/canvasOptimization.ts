/**
 * Canvas Rendering Optimization Utilities
 * 
 * Issue #32: Optimize canvas rendering for large cities
 * 
 * This module provides:
 * 1. Viewport culling - only render tiles in the visible viewport
 * 2. Dirty rectangle tracking - only re-render changed tiles
 * 3. Layer caching - cache static layers to offscreen canvas
 * 4. Performance metrics - track fps, tilesRendered, drawCalls, frameTime
 */

import { TILE_WIDTH, TILE_HEIGHT } from './types';

// ============================================================================
// Types
// ============================================================================

/** Viewport dimensions and position */
export interface Viewport {
  x: number;       // Offset X in screen pixels
  y: number;       // Offset Y in screen pixels
  width: number;   // Canvas width in pixels
  height: number;  // Canvas height in pixels
}

/** Range of visible tiles in grid coordinates */
export interface VisibleTileRange {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  /** Diagonal sum range for optimized iteration */
  minSum: number;
  maxSum: number;
}

/** Dirty region tracking for incremental rendering */
export interface DirtyRegion {
  /** Set of tile keys in "x,y" format that need redrawing */
  tiles: Set<string>;
  /** If true, the entire canvas needs to be redrawn */
  needsFullRedraw: boolean;
  /** Timestamp of last change */
  lastModified: number;
}

/** Performance metrics for render monitoring */
export interface RenderMetrics {
  /** Frames per second */
  fps: number;
  /** Number of tiles rendered in last frame */
  tilesRendered: number;
  /** Number of draw calls in last frame */
  drawCalls: number;
  /** Time in milliseconds for last frame render */
  frameTime: number;
  /** Rolling average of frame times */
  avgFrameTime: number;
  /** Peak frame time in last second */
  peakFrameTime: number;
}

/** Layer cache for offscreen canvas rendering */
export interface LayerCache {
  /** The offscreen canvas */
  canvas: OffscreenCanvas | HTMLCanvasElement;
  /** Context for drawing */
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  /** Version number - incremented when layer content changes */
  version: number;
  /** Whether the cache is valid and can be used */
  valid: boolean;
  /** Last grid version this was rendered for */
  gridVersion: number;
  /** Viewport state when cache was created */
  viewport: Viewport | null;
  /** Zoom level when cache was created */
  zoom: number;
}

// ============================================================================
// Viewport Culling
// ============================================================================

/**
 * Calculate the range of tiles visible in the current viewport.
 * 
 * This function determines which grid tiles are potentially visible on screen,
 * allowing the renderer to skip tiles that are completely outside the viewport.
 * 
 * @param viewport - The current viewport dimensions and offset
 * @param zoom - Current zoom level (1 = 100%)
 * @param gridSize - Size of the grid (gridSize x gridSize tiles)
 * @returns Range of visible tiles and diagonal sum range for iteration
 */
export function getVisibleTileRange(
  viewport: Viewport,
  zoom: number,
  gridSize: number
): VisibleTileRange {
  // Calculate view bounds in world coordinates
  const viewLeft = -viewport.x / zoom - TILE_WIDTH;
  const viewTop = -viewport.y / zoom - TILE_HEIGHT * 2;
  const viewRight = (viewport.width / zoom) - (viewport.x / zoom) + TILE_WIDTH;
  const viewBottom = (viewport.height / zoom) - (viewport.y / zoom) + TILE_HEIGHT * 2;
  
  // In isometric rendering, screenY = (x + y) * (TILE_HEIGHT / 2)
  // So sum = x + y = screenY * 2 / TILE_HEIGHT
  // Add padding for tall buildings that may extend above their tile position
  const minSum = Math.max(0, Math.floor((viewTop - TILE_HEIGHT * 6) * 2 / TILE_HEIGHT));
  const maxSum = Math.min(gridSize * 2 - 2, Math.ceil((viewBottom + TILE_HEIGHT) * 2 / TILE_HEIGHT));
  
  // Calculate approximate tile bounds (used for quick rejection)
  // These are conservative estimates - actual visibility is checked per-tile
  const minX = Math.max(0, Math.floor((viewLeft + viewTop / 2) / TILE_WIDTH));
  const maxX = Math.min(gridSize - 1, Math.ceil((viewRight + viewBottom / 2) / TILE_WIDTH));
  const minY = Math.max(0, Math.floor((viewTop - viewLeft) / TILE_HEIGHT));
  const maxY = Math.min(gridSize - 1, Math.ceil((viewBottom - viewRight) / TILE_HEIGHT));
  
  return { minX, maxX, minY, maxY, minSum, maxSum };
}

/**
 * Check if a tile at (x, y) is visible in the viewport.
 * 
 * @param screenX - Screen X coordinate of the tile
 * @param screenY - Screen Y coordinate of the tile
 * @param viewport - Current viewport
 * @param zoom - Current zoom level
 * @returns true if the tile is visible
 */
export function isTileVisible(
  screenX: number,
  screenY: number,
  viewport: Viewport,
  zoom: number
): boolean {
  const viewLeft = -viewport.x / zoom - TILE_WIDTH;
  const viewTop = -viewport.y / zoom - TILE_HEIGHT * 2;
  const viewRight = (viewport.width / zoom) - (viewport.x / zoom) + TILE_WIDTH;
  const viewBottom = (viewport.height / zoom) - (viewport.y / zoom) + TILE_HEIGHT * 2;
  
  // Account for buildings that extend above their base tile
  const tileTopWithBuffer = screenY - TILE_HEIGHT * 4;
  
  return (
    screenX + TILE_WIDTH >= viewLeft &&
    screenX <= viewRight &&
    tileTopWithBuffer <= viewBottom &&
    screenY + TILE_HEIGHT >= viewTop
  );
}

// ============================================================================
// Dirty Rectangle Tracking
// ============================================================================

/**
 * Create a new dirty region tracker.
 */
export function createDirtyRegion(): DirtyRegion {
  return {
    tiles: new Set<string>(),
    needsFullRedraw: true, // Start with full redraw
    lastModified: Date.now(),
  };
}

/**
 * Mark a single tile as dirty (needs redrawing).
 */
export function markTileDirty(region: DirtyRegion, x: number, y: number): void {
  region.tiles.add(`${x},${y}`);
  region.lastModified = Date.now();
}

/**
 * Mark multiple tiles as dirty.
 */
export function markTilesDirty(region: DirtyRegion, tiles: Array<{ x: number; y: number }>): void {
  for (const tile of tiles) {
    region.tiles.add(`${tile.x},${tile.y}`);
  }
  region.lastModified = Date.now();
}

/**
 * Mark a rectangular region as dirty.
 */
export function markRegionDirty(
  region: DirtyRegion,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): void {
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      region.tiles.add(`${x},${y}`);
    }
  }
  region.lastModified = Date.now();
}

/**
 * Request a full redraw of the canvas.
 */
export function requestFullRedraw(region: DirtyRegion): void {
  region.needsFullRedraw = true;
  region.lastModified = Date.now();
}

/**
 * Clear the dirty region after rendering.
 */
export function clearDirtyRegion(region: DirtyRegion): void {
  region.tiles.clear();
  region.needsFullRedraw = false;
}

/**
 * Check if a tile is marked as dirty.
 */
export function isTileDirty(region: DirtyRegion, x: number, y: number): boolean {
  return region.needsFullRedraw || region.tiles.has(`${x},${y}`);
}

/**
 * Check if there are any dirty tiles.
 */
export function hasDirtyTiles(region: DirtyRegion): boolean {
  return region.needsFullRedraw || region.tiles.size > 0;
}

// ============================================================================
// Layer Caching
// ============================================================================

/**
 * Create an offscreen canvas layer cache.
 * 
 * @param width - Canvas width
 * @param height - Canvas height
 * @returns Layer cache object
 */
export function createLayerCache(width: number, height: number): LayerCache {
  // Use OffscreenCanvas if available, fallback to HTMLCanvasElement
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(width, height)
    : document.createElement('canvas');
  
  if (!(canvas instanceof OffscreenCanvas)) {
    canvas.width = width;
    canvas.height = height;
  }
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2d context for layer cache');
  }
  
  return {
    canvas,
    ctx: ctx as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    version: 0,
    valid: false,
    gridVersion: -1,
    viewport: null,
    zoom: 1,
  };
}

/**
 * Resize a layer cache canvas.
 */
export function resizeLayerCache(cache: LayerCache, width: number, height: number): void {
  if (cache.canvas instanceof OffscreenCanvas) {
    cache.canvas.width = width;
    cache.canvas.height = height;
  } else {
    cache.canvas.width = width;
    cache.canvas.height = height;
  }
  cache.valid = false;
}

/**
 * Invalidate a layer cache, requiring re-render.
 */
export function invalidateLayerCache(cache: LayerCache): void {
  cache.valid = false;
}

/**
 * Check if a layer cache needs updating.
 */
export function needsLayerUpdate(
  cache: LayerCache,
  gridVersion: number,
  viewport: Viewport,
  zoom: number
): boolean {
  if (!cache.valid) return true;
  if (cache.gridVersion !== gridVersion) return true;
  if (cache.zoom !== zoom) return true;
  if (!cache.viewport) return true;
  
  // Check if viewport has changed significantly
  const viewportChanged = 
    cache.viewport.x !== viewport.x ||
    cache.viewport.y !== viewport.y ||
    cache.viewport.width !== viewport.width ||
    cache.viewport.height !== viewport.height;
  
  return viewportChanged;
}

/**
 * Update layer cache metadata after rendering.
 */
export function updateLayerCache(
  cache: LayerCache,
  gridVersion: number,
  viewport: Viewport,
  zoom: number
): void {
  cache.version++;
  cache.valid = true;
  cache.gridVersion = gridVersion;
  cache.viewport = { ...viewport };
  cache.zoom = zoom;
}

// ============================================================================
// Performance Metrics
// ============================================================================

/**
 * Create a new render metrics tracker.
 */
export function createRenderMetrics(): RenderMetrics {
  return {
    fps: 0,
    tilesRendered: 0,
    drawCalls: 0,
    frameTime: 0,
    avgFrameTime: 0,
    peakFrameTime: 0,
  };
}

// Frame time history for calculating averages
const FRAME_HISTORY_SIZE = 60;
const frameTimeHistory: number[] = [];
let lastFpsUpdate = 0;
let frameCountSinceLastFps = 0;

/**
 * Update render metrics after a frame.
 * 
 * @param metrics - Metrics object to update
 * @param frameTime - Time taken for this frame in milliseconds
 * @param tilesRendered - Number of tiles rendered
 * @param drawCalls - Number of draw calls made
 */
export function updateRenderMetrics(
  metrics: RenderMetrics,
  frameTime: number,
  tilesRendered: number,
  drawCalls: number
): void {
  const now = performance.now();
  
  // Update frame time
  metrics.frameTime = frameTime;
  metrics.tilesRendered = tilesRendered;
  metrics.drawCalls = drawCalls;
  
  // Track frame history for averaging
  frameTimeHistory.push(frameTime);
  if (frameTimeHistory.length > FRAME_HISTORY_SIZE) {
    frameTimeHistory.shift();
  }
  
  // Calculate average frame time
  const sum = frameTimeHistory.reduce((a, b) => a + b, 0);
  metrics.avgFrameTime = sum / frameTimeHistory.length;
  
  // Track peak frame time (reset every second)
  if (now - lastFpsUpdate > 1000) {
    metrics.peakFrameTime = Math.max(...frameTimeHistory.slice(-60));
    lastFpsUpdate = now;
    
    // Calculate FPS from frame count
    metrics.fps = frameCountSinceLastFps;
    frameCountSinceLastFps = 0;
  }
  
  frameCountSinceLastFps++;
}

/**
 * Reset metrics (useful when resetting game state).
 */
export function resetRenderMetrics(metrics: RenderMetrics): void {
  metrics.fps = 0;
  metrics.tilesRendered = 0;
  metrics.drawCalls = 0;
  metrics.frameTime = 0;
  metrics.avgFrameTime = 0;
  metrics.peakFrameTime = 0;
  frameTimeHistory.length = 0;
  lastFpsUpdate = 0;
  frameCountSinceLastFps = 0;
}

// ============================================================================
// RequestAnimationFrame Optimization
// ============================================================================

/** Frame scheduler state */
interface FrameScheduler {
  lastFrameTime: number;
  targetFrameTime: number;  // Target ms per frame (16.67 for 60fps)
  frameCallback: ((timestamp: number) => void) | null;
  animationFrameId: number | null;
  isRunning: boolean;
}

/**
 * Create a frame scheduler with FPS limiting.
 * 
 * @param targetFps - Target frames per second (default: 60)
 * @returns Frame scheduler object
 */
export function createFrameScheduler(targetFps: number = 60): FrameScheduler {
  return {
    lastFrameTime: 0,
    targetFrameTime: 1000 / targetFps,
    frameCallback: null,
    animationFrameId: null,
    isRunning: false,
  };
}

/**
 * Start the frame scheduler loop.
 * 
 * @param scheduler - The frame scheduler
 * @param callback - Function to call each frame
 */
export function startFrameScheduler(
  scheduler: FrameScheduler,
  callback: (timestamp: number, delta: number) => void
): void {
  if (scheduler.isRunning) return;
  
  scheduler.isRunning = true;
  scheduler.lastFrameTime = performance.now();
  
  const loop = (timestamp: number) => {
    if (!scheduler.isRunning) return;
    
    const elapsed = timestamp - scheduler.lastFrameTime;
    
    // Only render if enough time has passed (frame throttling)
    if (elapsed >= scheduler.targetFrameTime) {
      const delta = Math.min(elapsed / 1000, 0.1); // Cap delta to prevent huge jumps
      callback(timestamp, delta);
      scheduler.lastFrameTime = timestamp - (elapsed % scheduler.targetFrameTime);
    }
    
    scheduler.animationFrameId = requestAnimationFrame(loop);
  };
  
  scheduler.animationFrameId = requestAnimationFrame(loop);
}

/**
 * Stop the frame scheduler loop.
 */
export function stopFrameScheduler(scheduler: FrameScheduler): void {
  scheduler.isRunning = false;
  if (scheduler.animationFrameId !== null) {
    cancelAnimationFrame(scheduler.animationFrameId);
    scheduler.animationFrameId = null;
  }
}

/**
 * Update the target FPS for the scheduler.
 */
export function setTargetFps(scheduler: FrameScheduler, targetFps: number): void {
  scheduler.targetFrameTime = 1000 / targetFps;
}

// ============================================================================
// Memory Optimization - Canvas Context Pool
// ============================================================================

/** Pool of reusable canvas contexts */
interface CanvasPool {
  available: HTMLCanvasElement[];
  inUse: Set<HTMLCanvasElement>;
  maxSize: number;
}

/**
 * Create a canvas pool for reusing canvas elements.
 */
export function createCanvasPool(maxSize: number = 10): CanvasPool {
  return {
    available: [],
    inUse: new Set(),
    maxSize,
  };
}

/**
 * Acquire a canvas from the pool.
 */
export function acquireCanvas(pool: CanvasPool, width: number, height: number): HTMLCanvasElement {
  let canvas = pool.available.pop();
  
  if (!canvas) {
    canvas = document.createElement('canvas');
  }
  
  canvas.width = width;
  canvas.height = height;
  pool.inUse.add(canvas);
  
  return canvas;
}

/**
 * Release a canvas back to the pool.
 */
export function releaseCanvas(pool: CanvasPool, canvas: HTMLCanvasElement): void {
  if (!pool.inUse.has(canvas)) return;
  
  pool.inUse.delete(canvas);
  
  // Clear the canvas before returning to pool
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  // Only keep canvas if pool isn't full
  if (pool.available.length < pool.maxSize) {
    pool.available.push(canvas);
  }
}

/**
 * Clear and dispose all canvases in the pool.
 */
export function disposeCanvasPool(pool: CanvasPool): void {
  pool.available.length = 0;
  pool.inUse.clear();
}

// ============================================================================
// Batch Sprite Rendering
// ============================================================================

/** Sprite draw command for batching */
export interface SpriteDrawCommand {
  image: HTMLImageElement | ImageBitmap;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  depth: number;
}

/**
 * Group sprite draw commands by image source for batched rendering.
 * This reduces context state changes when drawing multiple sprites from the same texture.
 */
export function batchSpritesByTexture(commands: SpriteDrawCommand[]): Map<HTMLImageElement | ImageBitmap, SpriteDrawCommand[]> {
  const batches = new Map<HTMLImageElement | ImageBitmap, SpriteDrawCommand[]>();
  
  for (const cmd of commands) {
    let batch = batches.get(cmd.image);
    if (!batch) {
      batch = [];
      batches.set(cmd.image, batch);
    }
    batch.push(cmd);
  }
  
  return batches;
}

/**
 * Execute batched sprite draw commands.
 * Draws all sprites from each texture in order, minimizing context switches.
 */
export function drawBatchedSprites(
  ctx: CanvasRenderingContext2D,
  batches: Map<HTMLImageElement | ImageBitmap, SpriteDrawCommand[]>
): number {
  let drawCalls = 0;
  
  for (const [, commands] of batches) {
    // Sort commands by depth within each batch
    commands.sort((a, b) => a.depth - b.depth);
    
    for (const cmd of commands) {
      ctx.drawImage(
        cmd.image,
        cmd.sx, cmd.sy, cmd.sw, cmd.sh,
        cmd.dx, cmd.dy, cmd.dw, cmd.dh
      );
      drawCalls++;
    }
  }
  
  return drawCalls;
}

// ============================================================================
// Exports for window (for testing)
// ============================================================================

// Expose metrics on window for testing in development
if (typeof window !== 'undefined') {
  const metricsInstance = createRenderMetrics();
  const dirtyRegionInstance = createDirtyRegion();
  
  (window as unknown as { __RENDER_METRICS__: RenderMetrics }).__RENDER_METRICS__ = metricsInstance;
  (window as unknown as { __DIRTY_REGIONS__: DirtyRegion }).__DIRTY_REGIONS__ = dirtyRegionInstance;
}
