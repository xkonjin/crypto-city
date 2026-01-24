/**
 * Spatial Hashing for Efficient Tile Iteration
 * Issue #230: Optimize Inefficient Tile Iteration
 * 
 * Implements a spatial hash grid to quickly find tiles in a viewport
 * Reduces O(n²) iteration to O(k) where k is visible tiles
 */

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Spatial hash grid for fast spatial queries
 */
export class SpatialHash<T> {
  private cellSize: number;
  private cells: Map<string, Set<{ item: T; bounds: Bounds }>>;
  
  constructor(cellSize: number = 8) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }
  
  /**
   * Get cell key for coordinates
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
  
  /**
   * Get all cell keys that overlap with bounds
   */
  private getCellKeysForBounds(bounds: Bounds): string[] {
    const keys: string[] = [];
    const minCellX = Math.floor(bounds.minX / this.cellSize);
    const maxCellX = Math.floor(bounds.maxX / this.cellSize);
    const minCellY = Math.floor(bounds.minY / this.cellSize);
    const maxCellY = Math.floor(bounds.maxY / this.cellSize);
    
    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        keys.push(`${x},${y}`);
      }
    }
    
    return keys;
  }
  
  /**
   * Insert an item with its bounding box
   */
  insert(item: T, bounds: Bounds): void {
    const keys = this.getCellKeysForBounds(bounds);
    const entry = { item, bounds };
    
    for (const key of keys) {
      if (!this.cells.has(key)) {
        this.cells.set(key, new Set());
      }
      this.cells.get(key)!.add(entry);
    }
  }
  
  /**
   * Remove an item
   */
  remove(item: T): void {
    for (const cell of this.cells.values()) {
      for (const entry of cell) {
        if (entry.item === item) {
          cell.delete(entry);
        }
      }
    }
  }
  
  /**
   * Query items within bounds
   */
  query(bounds: Bounds): T[] {
    const keys = this.getCellKeysForBounds(bounds);
    const results = new Set<T>();
    
    for (const key of keys) {
      const cell = this.cells.get(key);
      if (!cell) continue;
      
      for (const entry of cell) {
        // Check if bounds actually overlap
        if (this.boundsOverlap(bounds, entry.bounds)) {
          results.add(entry.item);
        }
      }
    }
    
    return Array.from(results);
  }
  
  /**
   * Check if two bounds overlap
   */
  private boundsOverlap(a: Bounds, b: Bounds): boolean {
    return !(
      a.maxX < b.minX ||
      a.minX > b.maxX ||
      a.maxY < b.minY ||
      a.minY > b.maxY
    );
  }
  
  /**
   * Clear all items
   */
  clear(): void {
    this.cells.clear();
  }
  
  /**
   * Get statistics about the spatial hash
   */
  getStats(): { cellCount: number; itemCount: number; avgItemsPerCell: number } {
    const cellCount = this.cells.size;
    let totalItems = 0;
    
    for (const cell of this.cells.values()) {
      totalItems += cell.size;
    }
    
    return {
      cellCount,
      itemCount: totalItems,
      avgItemsPerCell: cellCount > 0 ? totalItems / cellCount : 0,
    };
  }
}

/**
 * Create a spatial hash for tiles in a grid
 */
export function createTileSpatialHash(gridSize: number): SpatialHash<Point> {
  const hash = new SpatialHash<Point>(8); // 8x8 cell size
  
  // Insert all tiles
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      hash.insert(
        { x, y },
        { minX: x, maxX: x, minY: y, maxY: y }
      );
    }
  }
  
  return hash;
}

/**
 * Get visible tiles using spatial hash (much faster than nested loops)
 */
export function getVisibleTiles(
  spatialHash: SpatialHash<Point>,
  viewportBounds: Bounds
): Point[] {
  return spatialHash.query(viewportBounds);
}
