/**
 * NPC Pathfinding System
 * 
 * Implements A* pathfinding algorithm for NPCs to navigate between buildings
 * on the isometric grid. Handles obstacle avoidance, road preference, and
 * building entrance detection.
 * 
 * The pathfinding system treats the isometric grid as a standard 2D grid
 * for calculation purposes - the isometric projection is purely visual
 * and doesn't affect the underlying pathfinding logic.
 */

import type { Tile } from '@/games/isocity/types/game';
import type { BuildingType } from '@/games/isocity/types/buildings';

/**
 * Represents a position on the grid
 */
export interface GridPosition {
  x: number;
  y: number;
}

/**
 * A* pathfinding node with cost and parent tracking
 */
export interface PathNode {
  /** Grid X coordinate */
  x: number;
  /** Grid Y coordinate */
  y: number;
  /** Cost from start node (g-score) */
  g: number;
  /** Heuristic estimate to end (h-score) */
  h: number;
  /** Total estimated cost (f = g + h) */
  f: number;
  /** Parent node for path reconstruction */
  parent: PathNode | null;
}

/**
 * Options for customizing pathfinding behavior
 */
export interface PathfindingOptions {
  /** Whether to prefer walking on roads (lower cost for road tiles) */
  preferRoads: boolean;
  /** Whether to avoid building tiles (should almost always be true) */
  avoidBuildings: boolean;
  /** Maximum iterations before giving up (prevents infinite loops) */
  maxIterations: number;
}

/**
 * Default pathfinding options - prefer roads, avoid buildings
 */
export const DEFAULT_PATHFINDING_OPTIONS: PathfindingOptions = {
  preferRoads: true,
  avoidBuildings: true,
  maxIterations: 5000,
};

/**
 * Tile types that NPCs can walk on
 */
const WALKABLE_TILE_TYPES: Set<BuildingType> = new Set([
  'empty',
  'grass',
  'road',
  'tree',
  'rail',
  'bridge',
]);

/**
 * Movement cost modifiers for different tile types
 * Lower = faster/preferred path
 */
const TILE_COSTS: Partial<Record<BuildingType, number>> = {
  road: 1,      // Roads are fastest
  bridge: 1,    // Bridges are like roads
  grass: 2,     // Grass is slower
  empty: 2,     // Empty is like grass
  tree: 3,      // Trees slow you down (dodging branches)
  rail: 4,      // Rail tracks are uncomfortable to walk on
};

/**
 * Calculate Manhattan distance between two points.
 * Used as the heuristic for A* on a grid where diagonal movement isn't allowed.
 * 
 * @param x1 Start X
 * @param y1 Start Y
 * @param x2 End X
 * @param y2 End Y
 * @returns Manhattan distance
 */
export function manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Check if a tile is walkable for NPC pathfinding.
 * 
 * @param x Grid X coordinate
 * @param y Grid Y coordinate
 * @param grid The game grid
 * @returns true if the tile can be walked on
 */
export function isWalkable(x: number, y: number, grid: Tile[][]): boolean {
  // Bounds check
  if (y < 0 || y >= grid.length) return false;
  if (x < 0 || x >= grid[0].length) return false;
  
  const tile = grid[y][x];
  if (!tile || !tile.building) return false;
  
  return WALKABLE_TILE_TYPES.has(tile.building.type);
}

/**
 * Get the movement cost for a tile.
 * Used to make NPCs prefer certain paths (like roads).
 * 
 * @param x Grid X coordinate
 * @param y Grid Y coordinate
 * @param grid The game grid
 * @param preferRoads Whether to give roads lower cost
 * @returns Movement cost (1-5, lower is better)
 */
function getTileCost(x: number, y: number, grid: Tile[][], preferRoads: boolean): number {
  if (!isWalkable(x, y, grid)) return Infinity;
  
  const tile = grid[y][x];
  const buildingType = tile.building.type;
  
  if (!preferRoads) {
    // All walkable tiles have same cost when not preferring roads
    return 1;
  }
  
  return TILE_COSTS[buildingType] ?? 2;
}

/**
 * Create a unique key for a grid position (for Set/Map lookups).
 */
function posKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Reconstruct the path from end node back to start.
 * 
 * @param endNode The final node in the path
 * @returns Array of grid positions from start to end
 */
export function reconstructPath(endNode: PathNode): GridPosition[] {
  const path: GridPosition[] = [];
  let current: PathNode | null = endNode;
  
  while (current !== null) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }
  
  return path;
}

/**
 * Get neighboring positions (4-directional: N, S, E, W).
 * Diagonal movement is not supported in this implementation.
 */
function getNeighbors(x: number, y: number): GridPosition[] {
  return [
    { x: x + 1, y: y },     // East
    { x: x - 1, y: y },     // West
    { x: x, y: y + 1 },     // South
    { x: x, y: y - 1 },     // North
  ];
}

/**
 * A* pathfinding algorithm implementation.
 * 
 * Finds the shortest path between two points on the grid while avoiding
 * obstacles (buildings, water, etc.) and optionally preferring roads.
 * 
 * @param startX Starting X coordinate
 * @param startY Starting Y coordinate
 * @param endX Target X coordinate
 * @param endY Target Y coordinate
 * @param grid The game grid
 * @param options Pathfinding options
 * @returns Array of positions forming the path, or null if no path exists
 */
export function findPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  grid: Tile[][],
  options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS
): GridPosition[] | null {
  // Handle same start and end
  if (startX === endX && startY === endY) {
    return [{ x: startX, y: startY }];
  }
  
  // Check if start is walkable
  if (!isWalkable(startX, startY, grid)) {
    return null;
  }
  
  // Check if end is walkable
  if (!isWalkable(endX, endY, grid)) {
    return null;
  }
  
  const { preferRoads, maxIterations } = options;
  
  // Open set - nodes to be evaluated (using array as priority queue)
  const openSet: PathNode[] = [];
  
  // Closed set - nodes already evaluated
  const closedSet = new Set<string>();
  
  // Node lookup for updating costs
  const nodeMap = new Map<string, PathNode>();
  
  // Create start node
  const startNode: PathNode = {
    x: startX,
    y: startY,
    g: 0,
    h: manhattanDistance(startX, startY, endX, endY),
    f: manhattanDistance(startX, startY, endX, endY),
    parent: null,
  };
  
  openSet.push(startNode);
  nodeMap.set(posKey(startX, startY), startNode);
  
  let iterations = 0;
  
  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Sort by f-score and get node with lowest f
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    
    // Check if we've reached the goal
    if (current.x === endX && current.y === endY) {
      return reconstructPath(current);
    }
    
    // Add to closed set
    closedSet.add(posKey(current.x, current.y));
    
    // Explore neighbors
    const neighbors = getNeighbors(current.x, current.y);
    
    for (const neighbor of neighbors) {
      const { x: nx, y: ny } = neighbor;
      const key = posKey(nx, ny);
      
      // Skip if already evaluated
      if (closedSet.has(key)) continue;
      
      // Skip if not walkable
      if (!isWalkable(nx, ny, grid)) continue;
      
      // Calculate tentative g-score
      const moveCost = getTileCost(nx, ny, grid, preferRoads);
      const tentativeG = current.g + moveCost;
      
      // Check if we have a better path to this neighbor
      const existingNode = nodeMap.get(key);
      
      if (!existingNode) {
        // New node - add to open set
        const h = manhattanDistance(nx, ny, endX, endY);
        const newNode: PathNode = {
          x: nx,
          y: ny,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current,
        };
        openSet.push(newNode);
        nodeMap.set(key, newNode);
      } else if (tentativeG < existingNode.g) {
        // Better path found - update existing node
        existingNode.g = tentativeG;
        existingNode.f = tentativeG + existingNode.h;
        existingNode.parent = current;
        
        // Re-add to open set if not already there
        if (!openSet.includes(existingNode)) {
          openSet.push(existingNode);
        }
      }
    }
  }
  
  // No path found
  return null;
}

/**
 * Parse a building ID to extract its grid position.
 * Building IDs follow the format: "type_x_y"
 * 
 * @param buildingId The building's ID
 * @returns Grid position or null if invalid format
 */
function parseBuildingId(buildingId: string): GridPosition | null {
  const parts = buildingId.split('_');
  if (parts.length < 3) return null;
  
  // Last two parts are x and y
  const y = parseInt(parts[parts.length - 1], 10);
  const x = parseInt(parts[parts.length - 2], 10);
  
  if (isNaN(x) || isNaN(y)) return null;
  
  return { x, y };
}

/**
 * Get the entrance position for a building.
 * The entrance is typically an adjacent walkable tile, preferring roads.
 * 
 * @param buildingId The building's identifier (format: "type_x_y")
 * @param grid The game grid
 * @returns Grid position of the entrance, or null if not found
 */
export function getBuildingEntrance(
  buildingId: string,
  grid: Tile[][]
): GridPosition | null {
  // Parse building position from ID
  const buildingPos = parseBuildingId(buildingId);
  if (!buildingPos) return null;
  
  const { x: bx, y: by } = buildingPos;
  
  // Verify the building exists at this position
  if (by < 0 || by >= grid.length || bx < 0 || bx >= grid[0].length) {
    return null;
  }
  
  const tile = grid[by][bx];
  if (!tile || WALKABLE_TILE_TYPES.has(tile.building?.type)) {
    // Not a building or is walkable - no entrance needed
    return null;
  }
  
  // Check adjacent tiles for entrance, preferring roads
  const adjacent = getNeighbors(bx, by);
  let roadEntrance: GridPosition | null = null;
  let anyEntrance: GridPosition | null = null;
  
  for (const pos of adjacent) {
    if (!isWalkable(pos.x, pos.y, grid)) continue;
    
    const adjTile = grid[pos.y][pos.x];
    
    // Prefer road entrances
    if (adjTile.building?.type === 'road' || adjTile.building?.type === 'bridge') {
      roadEntrance = pos;
      break; // Found best entrance
    }
    
    // Track any walkable entrance as fallback
    if (!anyEntrance) {
      anyEntrance = pos;
    }
  }
  
  return roadEntrance || anyEntrance;
}

/**
 * Path cache for frequently-used routes.
 * Key format: "startX,startY->endX,endY"
 */
const pathCache = new Map<string, GridPosition[] | null>();

/**
 * Maximum size of the path cache before clearing old entries.
 */
const MAX_CACHE_SIZE = 100;

/**
 * Get a cached path or compute and cache a new one.
 * Use this for common routes to improve performance.
 * 
 * @param startX Starting X coordinate
 * @param startY Starting Y coordinate
 * @param endX Target X coordinate
 * @param endY Target Y coordinate
 * @param grid The game grid
 * @param options Pathfinding options
 * @returns Array of positions forming the path, or null if no path exists
 */
export function findPathCached(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  grid: Tile[][],
  options: PathfindingOptions = DEFAULT_PATHFINDING_OPTIONS
): GridPosition[] | null {
  const cacheKey = `${startX},${startY}->${endX},${endY}`;
  
  // Check cache
  if (pathCache.has(cacheKey)) {
    const cached = pathCache.get(cacheKey);
    // Return a copy to prevent mutation
    return cached ? [...cached] : null;
  }
  
  // Compute path
  const path = findPath(startX, startY, endX, endY, grid, options);
  
  // Clear cache if too large
  if (pathCache.size >= MAX_CACHE_SIZE) {
    // Clear oldest half of cache
    const keys = Array.from(pathCache.keys());
    for (let i = 0; i < MAX_CACHE_SIZE / 2; i++) {
      pathCache.delete(keys[i]);
    }
  }
  
  // Cache result
  pathCache.set(cacheKey, path ? [...path] : null);
  
  return path;
}

/**
 * Clear the path cache.
 * Call this when the grid layout changes significantly.
 */
export function clearPathCache(): void {
  pathCache.clear();
}
