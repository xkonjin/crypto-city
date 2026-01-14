/**
 * Dirty Region Tracker
 * 
 * Tracks which regions of the canvas need redrawing.
 * Optimizes rendering by only updating changed areas.
 * 
 * Issue #156: Implement dirty region tracking for canvas rendering
 */

// =============================================================================
// TYPES
// =============================================================================

export interface DirtyRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  layer: RenderLayer;
  priority: number; // Higher = render first
}

export type RenderLayer = 
  | 'ground'
  | 'roads'
  | 'buildings'
  | 'npcs'
  | 'vehicles'
  | 'effects'
  | 'ui';

export interface TilePosition {
  x: number;
  y: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Default tile dimensions for region calculation
const DEFAULT_TILE_WIDTH = 64;
const DEFAULT_TILE_HEIGHT = 38.4;

// Margin around dirty regions to ensure clean edges
const REGION_MARGIN = 2;

// Maximum regions before forcing full redraw
const MAX_DIRTY_REGIONS = 50;

// Layer priorities (higher = more important)
export const LAYER_PRIORITIES: Record<RenderLayer, number> = {
  ground: 1,
  roads: 2,
  buildings: 3,
  vehicles: 4,
  npcs: 5,
  effects: 6,
  ui: 7,
};

// =============================================================================
// DIRTY REGION TRACKER
// =============================================================================

export class DirtyRegionTracker {
  private dirtyRegions: Map<RenderLayer, DirtyRegion[]> = new Map();
  private tileWidth: number;
  private tileHeight: number;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private forceFullRedraw: boolean = false;
  private frameCount: number = 0;
  
  constructor(tileWidth: number = DEFAULT_TILE_WIDTH, tileHeight: number = DEFAULT_TILE_HEIGHT) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.initializeLayers();
  }
  
  private initializeLayers(): void {
    const layers: RenderLayer[] = ['ground', 'roads', 'buildings', 'npcs', 'vehicles', 'effects', 'ui'];
    for (const layer of layers) {
      this.dirtyRegions.set(layer, []);
    }
  }
  
  /**
   * Set canvas dimensions
   */
  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
  
  /**
   * Convert grid position to screen region
   */
  private gridToScreenRegion(gridX: number, gridY: number): { x: number; y: number } {
    // Standard isometric conversion
    const screenX = (gridX - gridY) * (this.tileWidth / 2);
    const screenY = (gridX + gridY) * (this.tileHeight / 2);
    return { x: screenX, y: screenY };
  }
  
  /**
   * Mark a tile as dirty
   */
  markTileDirty(gridX: number, gridY: number, layer: RenderLayer = 'buildings'): void {
    const screenPos = this.gridToScreenRegion(gridX, gridY);
    
    // Calculate region that covers the tile plus margin
    const region: DirtyRegion = {
      x: screenPos.x - this.tileWidth - REGION_MARGIN,
      y: screenPos.y - this.tileHeight * 3 - REGION_MARGIN, // Account for building height
      width: this.tileWidth * 2 + REGION_MARGIN * 2,
      height: this.tileHeight * 4 + REGION_MARGIN * 2,
      layer,
      priority: LAYER_PRIORITIES[layer],
    };
    
    this.addRegion(region);
  }
  
  /**
   * Mark a screen region as dirty
   */
  markRegionDirty(x: number, y: number, width: number, height: number, layer: RenderLayer = 'effects'): void {
    const region: DirtyRegion = {
      x: x - REGION_MARGIN,
      y: y - REGION_MARGIN,
      width: width + REGION_MARGIN * 2,
      height: height + REGION_MARGIN * 2,
      layer,
      priority: LAYER_PRIORITIES[layer],
    };
    
    this.addRegion(region);
  }
  
  /**
   * Mark an NPC position as dirty (previous and current)
   */
  markNPCDirty(oldPos: TilePosition, newPos: TilePosition): void {
    this.markTileDirty(oldPos.x, oldPos.y, 'npcs');
    if (oldPos.x !== newPos.x || oldPos.y !== newPos.y) {
      this.markTileDirty(newPos.x, newPos.y, 'npcs');
    }
  }
  
  /**
   * Mark a vehicle position as dirty
   */
  markVehicleDirty(oldPos: TilePosition, newPos: TilePosition): void {
    this.markTileDirty(oldPos.x, oldPos.y, 'vehicles');
    if (oldPos.x !== newPos.x || oldPos.y !== newPos.y) {
      this.markTileDirty(newPos.x, newPos.y, 'vehicles');
    }
  }
  
  /**
   * Add a region, merging with existing if overlapping
   */
  private addRegion(region: DirtyRegion): void {
    const layerRegions = this.dirtyRegions.get(region.layer) || [];
    
    // Check for overlapping regions to merge
    let merged = false;
    for (let i = 0; i < layerRegions.length; i++) {
      const existing = layerRegions[i];
      if (this.regionsOverlap(existing, region)) {
        layerRegions[i] = this.mergeRegions(existing, region);
        merged = true;
        break;
      }
    }
    
    if (!merged) {
      layerRegions.push(region);
    }
    
    this.dirtyRegions.set(region.layer, layerRegions);
    
    // Check if we have too many regions
    const totalRegions = this.getTotalRegionCount();
    if (totalRegions > MAX_DIRTY_REGIONS) {
      this.forceFullRedraw = true;
    }
  }
  
  /**
   * Check if two regions overlap
   */
  private regionsOverlap(a: DirtyRegion, b: DirtyRegion): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }
  
  /**
   * Merge two overlapping regions
   */
  private mergeRegions(a: DirtyRegion, b: DirtyRegion): DirtyRegion {
    const minX = Math.min(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxX = Math.max(a.x + a.width, b.x + b.width);
    const maxY = Math.max(a.y + a.height, b.y + b.height);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      layer: a.layer,
      priority: Math.max(a.priority, b.priority),
    };
  }
  
  /**
   * Get total number of dirty regions
   */
  private getTotalRegionCount(): number {
    let count = 0;
    for (const regions of this.dirtyRegions.values()) {
      count += regions.length;
    }
    return count;
  }
  
  /**
   * Check if a full redraw is needed
   */
  needsFullRedraw(): boolean {
    return this.forceFullRedraw;
  }
  
  /**
   * Get dirty regions for a specific layer
   */
  getDirtyRegions(layer: RenderLayer): DirtyRegion[] {
    return this.dirtyRegions.get(layer) || [];
  }
  
  /**
   * Get all dirty regions merged across layers
   */
  getAllMergedRegions(): DirtyRegion[] {
    if (this.forceFullRedraw) {
      return [{
        x: 0,
        y: 0,
        width: this.canvasWidth,
        height: this.canvasHeight,
        layer: 'ground',
        priority: 0,
      }];
    }
    
    // Collect all regions
    const allRegions: DirtyRegion[] = [];
    for (const regions of this.dirtyRegions.values()) {
      allRegions.push(...regions);
    }
    
    // Merge overlapping regions
    return this.mergeAllOverlapping(allRegions);
  }
  
  /**
   * Merge all overlapping regions in a list
   */
  private mergeAllOverlapping(regions: DirtyRegion[]): DirtyRegion[] {
    if (regions.length <= 1) return regions;
    
    const merged: DirtyRegion[] = [];
    const used = new Set<number>();
    
    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue;
      
      let current = { ...regions[i] };
      used.add(i);
      
      // Keep merging until no more overlaps
      let didMerge = true;
      while (didMerge) {
        didMerge = false;
        for (let j = 0; j < regions.length; j++) {
          if (used.has(j)) continue;
          if (this.regionsOverlap(current, regions[j])) {
            current = this.mergeRegions(current, regions[j]);
            used.add(j);
            didMerge = true;
          }
        }
      }
      
      merged.push(current);
    }
    
    return merged;
  }
  
  /**
   * Clear all dirty regions after rendering
   */
  clear(): void {
    for (const layer of this.dirtyRegions.keys()) {
      this.dirtyRegions.set(layer, []);
    }
    this.forceFullRedraw = false;
    this.frameCount++;
  }
  
  /**
   * Force a full redraw on next frame
   */
  invalidateAll(): void {
    this.forceFullRedraw = true;
  }
  
  /**
   * Check if any regions are dirty
   */
  isDirty(): boolean {
    if (this.forceFullRedraw) return true;
    
    for (const regions of this.dirtyRegions.values()) {
      if (regions.length > 0) return true;
    }
    return false;
  }
  
  /**
   * Get rendering statistics
   */
  getStats(): {
    isDirty: boolean;
    forceFullRedraw: boolean;
    regionCount: number;
    frameCount: number;
    regionsByLayer: Record<RenderLayer, number>;
  } {
    const regionsByLayer: Record<RenderLayer, number> = {
      ground: 0,
      roads: 0,
      buildings: 0,
      npcs: 0,
      vehicles: 0,
      effects: 0,
      ui: 0,
    };
    
    for (const [layer, regions] of this.dirtyRegions) {
      regionsByLayer[layer] = regions.length;
    }
    
    return {
      isDirty: this.isDirty(),
      forceFullRedraw: this.forceFullRedraw,
      regionCount: this.getTotalRegionCount(),
      frameCount: this.frameCount,
      regionsByLayer,
    };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a clipping path for dirty regions
 */
export function applyDirtyRegionClip(
  ctx: CanvasRenderingContext2D,
  regions: DirtyRegion[]
): void {
  if (regions.length === 0) return;
  
  ctx.beginPath();
  for (const region of regions) {
    ctx.rect(region.x, region.y, region.width, region.height);
  }
  ctx.clip();
}

/**
 * Check if a point is within any dirty region
 */
export function isPointInDirtyRegion(
  x: number,
  y: number,
  regions: DirtyRegion[]
): boolean {
  for (const region of regions) {
    if (
      x >= region.x &&
      x <= region.x + region.width &&
      y >= region.y &&
      y <= region.y + region.height
    ) {
      return true;
    }
  }
  return false;
}

// =============================================================================
// SINGLETON
// =============================================================================

let trackerInstance: DirtyRegionTracker | null = null;

export function getDirtyRegionTracker(
  tileWidth?: number,
  tileHeight?: number
): DirtyRegionTracker {
  if (!trackerInstance) {
    trackerInstance = new DirtyRegionTracker(tileWidth, tileHeight);
  }
  return trackerInstance;
}

export function resetDirtyRegionTracker(): void {
  trackerInstance = null;
}
