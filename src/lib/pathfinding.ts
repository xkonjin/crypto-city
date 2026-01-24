/**
 * Optimized Pathfinding with A* Algorithm
 * Issue #246: Optimize NPC Pathfinding Performance
 * 
 * Implements A* pathfinding with optimizations for game use
 */

export interface Point {
  x: number;
  y: number;
}

export interface PathNode extends Point {
  g: number; // Cost from start
  h: number; // Heuristic cost to end
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

/**
 * Calculate Manhattan distance heuristic
 */
function manhattanDistance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Calculate Euclidean distance heuristic
 */
function euclideanDistance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if two points are equal
 */
function pointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Get node key for hash map
 */
function getNodeKey(point: Point): string {
  return `${point.x},${point.y}`;
}

/**
 * A* pathfinding algorithm
 */
export function findPath(
  start: Point,
  end: Point,
  isWalkable: (x: number, y: number) => boolean,
  options: {
    maxIterations?: number;
    allowDiagonal?: boolean;
    heuristic?: 'manhattan' | 'euclidean';
  } = {}
): Point[] | null {
  const {
    maxIterations = 10000,
    allowDiagonal = false,
    heuristic = 'manhattan',
  } = options;
  
  const heuristicFn = heuristic === 'euclidean' ? euclideanDistance : manhattanDistance;
  
  // Early exit if start or end is not walkable
  if (!isWalkable(start.x, start.y) || !isWalkable(end.x, end.y)) {
    return null;
  }
  
  // Early exit if start equals end
  if (pointsEqual(start, end)) {
    return [start];
  }
  
  const openSet = new Map<string, PathNode>();
  const closedSet = new Set<string>();
  
  // Initialize start node
  const startNode: PathNode = {
    ...start,
    g: 0,
    h: heuristicFn(start, end),
    f: heuristicFn(start, end),
    parent: null,
  };
  
  openSet.set(getNodeKey(start), startNode);
  
  let iterations = 0;
  
  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++;
    
    // Find node with lowest f score
    let current: PathNode | null = null;
    let lowestF = Infinity;
    
    for (const node of openSet.values()) {
      if (node.f < lowestF) {
        lowestF = node.f;
        current = node;
      }
    }
    
    if (!current) break;
    
    // Check if we reached the goal
    if (pointsEqual(current, end)) {
      return reconstructPath(current);
    }
    
    // Move current from open to closed
    const currentKey = getNodeKey(current);
    openSet.delete(currentKey);
    closedSet.add(currentKey);
    
    // Check neighbors
    const neighbors = getNeighbors(current, allowDiagonal);
    
    for (const neighbor of neighbors) {
      const neighborKey = getNodeKey(neighbor);
      
      // Skip if not walkable or already evaluated
      if (!isWalkable(neighbor.x, neighbor.y) || closedSet.has(neighborKey)) {
        continue;
      }
      
      // Calculate tentative g score
      const moveCost = allowDiagonal && (neighbor.x !== current.x && neighbor.y !== current.y) 
        ? 1.414 // Diagonal cost (sqrt(2))
        : 1;     // Orthogonal cost
      
      const tentativeG = current.g + moveCost;
      
      const existingNode = openSet.get(neighborKey);
      
      if (!existingNode || tentativeG < existingNode.g) {
        const h = heuristicFn(neighbor, end);
        const node: PathNode = {
          ...neighbor,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current,
        };
        
        openSet.set(neighborKey, node);
      }
    }
  }
  
  // No path found
  return null;
}

/**
 * Get neighboring points
 */
function getNeighbors(point: Point, allowDiagonal: boolean): Point[] {
  const neighbors: Point[] = [
    { x: point.x - 1, y: point.y },     // Left
    { x: point.x + 1, y: point.y },     // Right
    { x: point.x, y: point.y - 1 },     // Up
    { x: point.x, y: point.y + 1 },     // Down
  ];
  
  if (allowDiagonal) {
    neighbors.push(
      { x: point.x - 1, y: point.y - 1 }, // Top-left
      { x: point.x + 1, y: point.y - 1 }, // Top-right
      { x: point.x - 1, y: point.y + 1 }, // Bottom-left
      { x: point.x + 1, y: point.y + 1 }, // Bottom-right
    );
  }
  
  return neighbors;
}

/**
 * Reconstruct path from end node
 */
function reconstructPath(endNode: PathNode): Point[] {
  const path: Point[] = [];
  let current: PathNode | null = endNode;
  
  while (current) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }
  
  return path;
}

/**
 * Smooth path by removing unnecessary waypoints
 */
export function smoothPath(
  path: Point[],
  isWalkable: (x: number, y: number) => boolean
): Point[] {
  if (path.length <= 2) return path;
  
  const smoothed: Point[] = [path[0]];
  let current = 0;
  
  while (current < path.length - 1) {
    let farthest = current + 1;
    
    // Find farthest visible point
    for (let i = current + 2; i < path.length; i++) {
      if (hasLineOfSight(path[current], path[i], isWalkable)) {
        farthest = i;
      } else {
        break;
      }
    }
    
    smoothed.push(path[farthest]);
    current = farthest;
  }
  
  return smoothed;
}

/**
 * Check if there's a clear line of sight between two points
 */
function hasLineOfSight(
  start: Point,
  end: Point,
  isWalkable: (x: number, y: number) => boolean
): boolean {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const sx = start.x < end.x ? 1 : -1;
  const sy = start.y < end.y ? 1 : -1;
  
  let err = dx - dy;
  let x = start.x;
  let y = start.y;
  
  while (true) {
    if (!isWalkable(x, y)) {
      return false;
    }
    
    if (x === end.x && y === end.y) {
      return true;
    }
    
    const e2 = 2 * err;
    
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

/**
 * Pathfinding cache for performance
 */
export class PathfindingCache {
  private cache = new Map<string, Point[] | null>();
  private maxSize: number;
  
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }
  
  private getCacheKey(start: Point, end: Point): string {
    return `${start.x},${start.y}->${end.x},${end.y}`;
  }
  
  get(start: Point, end: Point): Point[] | null | undefined {
    return this.cache.get(this.getCacheKey(start, end));
  }
  
  set(start: Point, end: Point, path: Point[] | null): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(this.getCacheKey(start, end), path);
  }
  
  clear(): void {
    this.cache.clear();
  }
}
