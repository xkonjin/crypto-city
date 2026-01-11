/**
 * Canvas utility functions for isometric grid rendering
 * Issue #66 - Module extraction from CanvasIsometricGrid.tsx
 */

import { TILE_WIDTH, TILE_HEIGHT } from '@/components/game/types';
import { Tile, BuildingType } from '@/types/game';
import { getBuildingSize } from '@/lib/simulation';

// Re-export coordinate conversion utilities from the main utils file
export { gridToScreen, screenToGrid } from '@/components/game/utils';

/**
 * Build item for render queues with depth sorting
 */
export type BuildingDrawItem = {
  screenX: number;
  screenY: number;
  tile: Tile;
  depth: number;
};

/**
 * Overlay draw item
 */
export type OverlayDrawItem = {
  screenX: number;
  screenY: number;
  tile: Tile;
};

/**
 * Render queues for depth-sorted rendering
 */
export interface RenderQueues {
  buildingQueue: BuildingDrawItem[];
  waterQueue: BuildingDrawItem[];
  roadQueue: BuildingDrawItem[];
  bridgeQueue: BuildingDrawItem[];
  railQueue: BuildingDrawItem[];
  beachQueue: BuildingDrawItem[];
  baseTileQueue: BuildingDrawItem[];
  greenBaseTileQueue: BuildingDrawItem[];
  overlayQueue: OverlayDrawItem[];
}

/**
 * Create empty render queues
 */
export function createRenderQueues(): RenderQueues {
  return {
    buildingQueue: [],
    waterQueue: [],
    roadQueue: [],
    bridgeQueue: [],
    railQueue: [],
    beachQueue: [],
    baseTileQueue: [],
    greenBaseTileQueue: [],
    overlayQueue: [],
  };
}

/**
 * Clear all render queues (reuses arrays to avoid GC pressure)
 */
export function clearRenderQueues(queues: RenderQueues): void {
  queues.buildingQueue.length = 0;
  queues.waterQueue.length = 0;
  queues.roadQueue.length = 0;
  queues.bridgeQueue.length = 0;
  queues.railQueue.length = 0;
  queues.beachQueue.length = 0;
  queues.baseTileQueue.length = 0;
  queues.greenBaseTileQueue.length = 0;
  queues.overlayQueue.length = 0;
}

/**
 * PERF: Insertion sort for nearly-sorted arrays (O(n) vs O(n log n) for .sort())
 * Since tiles are iterated in diagonal order, queues are already nearly sorted
 */
export function insertionSortByDepth<T extends { depth: number }>(arr: T[]): void {
  for (let i = 1; i < arr.length; i++) {
    const current = arr[i];
    let j = i - 1;
    // Only move elements that are strictly greater (maintains stability)
    while (j >= 0 && arr[j].depth > current.depth) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = current;
  }
}

/**
 * Calculate depth value for a tile based on its position and building size
 * Larger buildings need higher depth to render on top of adjacent tiles
 */
export function calculateTileDepth(x: number, y: number, buildingType: BuildingType): number {
  const size = getBuildingSize(buildingType);
  return x + y + size.width + size.height - 2;
}

/**
 * Calculate view bounds for viewport culling
 */
export interface ViewBounds {
  viewLeft: number;
  viewTop: number;
  viewRight: number;
  viewBottom: number;
}

export function calculateViewBounds(
  canvasWidth: number,
  canvasHeight: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
  dpr: number
): ViewBounds {
  const viewWidth = canvasWidth / (dpr * zoom);
  const viewHeight = canvasHeight / (dpr * zoom);
  
  return {
    viewLeft: -offsetX / zoom - TILE_WIDTH,
    viewTop: -offsetY / zoom - TILE_HEIGHT * 2,
    viewRight: viewWidth - offsetX / zoom + TILE_WIDTH,
    viewBottom: viewHeight - offsetY / zoom + TILE_HEIGHT * 2,
  };
}

/**
 * Check if a screen position is within the view bounds (viewport culling)
 */
export function isInViewport(
  screenX: number,
  screenY: number,
  bounds: ViewBounds,
  extraHeight: number = TILE_HEIGHT * 4
): boolean {
  return !(
    screenX + TILE_WIDTH < bounds.viewLeft ||
    screenX > bounds.viewRight ||
    screenY + extraHeight < bounds.viewTop ||
    screenY > bounds.viewBottom
  );
}

/**
 * Calculate map bounds for camera panning limits
 */
export interface MapBounds {
  minOffsetX: number;
  maxOffsetX: number;
  minOffsetY: number;
  maxOffsetY: number;
}

export function calculateMapBounds(
  gridSize: number,
  zoom: number,
  canvasWidth: number,
  canvasHeight: number,
  padding: number = 100
): MapBounds {
  const n = gridSize;
  
  // Map bounds in world coordinates
  const mapLeft = -(n - 1) * TILE_WIDTH / 2;
  const mapRight = (n - 1) * TILE_WIDTH / 2;
  const mapTop = 0;
  const mapBottom = (n - 1) * TILE_HEIGHT;
  
  return {
    minOffsetX: padding - mapRight * zoom,
    maxOffsetX: canvasWidth - padding - mapLeft * zoom,
    minOffsetY: padding - mapBottom * zoom,
    maxOffsetY: canvasHeight - padding - mapTop * zoom,
  };
}

/**
 * Clamp offset to keep camera within map bounds
 */
export function clampOffset(
  offset: { x: number; y: number },
  bounds: MapBounds
): { x: number; y: number } {
  return {
    x: Math.max(bounds.minOffsetX, Math.min(bounds.maxOffsetX, offset.x)),
    y: Math.max(bounds.minOffsetY, Math.min(bounds.maxOffsetY, offset.y)),
  };
}

/**
 * Calculate the corner screen positions of the isometric map for clipping
 */
export interface MapCorners {
  topLeft: { screenX: number; screenY: number };
  topRight: { screenX: number; screenY: number };
  bottomRight: { screenX: number; screenY: number };
  bottomLeft: { screenX: number; screenY: number };
}

export function calculateMapCorners(
  gridSize: number,
  gridToScreen: (x: number, y: number, ox: number, oy: number) => { screenX: number; screenY: number }
): MapCorners {
  return {
    topLeft: gridToScreen(0, 0, 0, 0),
    topRight: gridToScreen(gridSize - 1, 0, 0, 0),
    bottomRight: gridToScreen(gridSize - 1, gridSize - 1, 0, 0),
    bottomLeft: gridToScreen(0, gridSize - 1, 0, 0),
  };
}

/**
 * Create a clipping path for the map diamond shape
 */
export function createMapClipPath(
  ctx: CanvasRenderingContext2D,
  corners: MapCorners
): void {
  const w = TILE_WIDTH;
  const h = TILE_HEIGHT;
  
  ctx.beginPath();
  // Start at top point (top-left tile's top corner)
  ctx.moveTo(corners.topLeft.screenX + w / 2, corners.topLeft.screenY);
  // Go to right point (top-right tile's right corner)
  ctx.lineTo(corners.topRight.screenX + w, corners.topRight.screenY + h / 2);
  // Go to bottom point (bottom-right tile's bottom corner)
  ctx.lineTo(corners.bottomRight.screenX + w / 2, corners.bottomRight.screenY + h);
  // Go to left point (bottom-left tile's left corner)
  ctx.lineTo(corners.bottomLeft.screenX, corners.bottomLeft.screenY + h / 2);
  // Close the path back to top
  ctx.closePath();
  ctx.clip();
}

/**
 * Pre-computed tile dimensions for performance
 */
export const TILE_DIMENSIONS = {
  width: TILE_WIDTH,
  height: TILE_HEIGHT,
  halfWidth: TILE_WIDTH / 2,
  halfHeight: TILE_HEIGHT / 2,
} as const;
