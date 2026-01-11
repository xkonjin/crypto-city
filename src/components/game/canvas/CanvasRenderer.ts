/**
 * Canvas renderer utilities
 * Issue #66 - Module extraction from CanvasIsometricGrid.tsx
 */

import { TILE_WIDTH, TILE_HEIGHT, WorldRenderState, OverlayMode } from '@/components/game/types';
import { Tile } from '@/types/game';
import { getBuildingSize } from '@/lib/simulation';
import { gridToScreen } from '@/components/game/utils';
import {
  RenderQueues,
  BuildingDrawItem,
  OverlayDrawItem,
  createRenderQueues,
  clearRenderQueues,
  insertionSortByDepth,
  calculateViewBounds,
  isInViewport,
  calculateMapCorners,
  createMapClipPath,
  TILE_DIMENSIONS,
} from './CanvasUtils';
import { getVisibleTileRange, type Viewport } from '@/components/game/canvasOptimization';

/**
 * Background gradient cache to avoid recreating on every frame
 */
export interface BackgroundGradientCache {
  gradient: CanvasGradient | null;
  height: number;
}

/**
 * Create cached background gradient
 */
export function createOrGetBackgroundGradient(
  ctx: CanvasRenderingContext2D,
  cache: BackgroundGradientCache,
  canvasHeight: number
): CanvasGradient {
  if (!cache.gradient || cache.height !== canvasHeight) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#0f1419');
    gradient.addColorStop(0.5, '#141c24');
    gradient.addColorStop(1, '#1a2a1f');
    cache.gradient = gradient;
    cache.height = canvasHeight;
  }
  return cache.gradient;
}

/**
 * Clear canvas with background gradient
 */
export function clearCanvasWithBackground(
  ctx: CanvasRenderingContext2D,
  cache: BackgroundGradientCache,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.fillStyle = createOrGetBackgroundGradient(ctx, cache, canvasHeight);
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

/**
 * Setup canvas transform for isometric rendering
 */
export function setupCanvasTransform(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  zoom: number,
  offsetX: number,
  offsetY: number
): void {
  ctx.scale(dpr * zoom, dpr * zoom);
  ctx.translate(offsetX / zoom, offsetY / zoom);
}

/**
 * Options for collecting tiles into render queues
 */
export interface CollectTilesOptions {
  grid: Tile[][];
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;
  offsetX: number;
  offsetY: number;
  zoom: number;
  dpr: number;
  overlayMode: OverlayMode;
  showsDragGrid: boolean;
  dragStartTile: { x: number; y: number } | null;
  dragEndTile: { x: number; y: number } | null;
  getTileMetadata: (x: number, y: number) => {
    needsGreyBase: boolean;
    needsGreenBaseOverWater: boolean;
    needsGreenBaseForPark: boolean;
    isPartOfParkBuilding: boolean;
    isAdjacentToWater: boolean;
    hasAdjacentRoad: boolean;
    shouldFlipForRoad: boolean;
  } | null;
}

/**
 * Result of tile collection with metrics
 */
export interface CollectTilesResult {
  queues: RenderQueues;
  tilesRendered: number;
  visibleRange: { minSum: number; maxSum: number };
  viewBounds: { viewLeft: number; viewTop: number; viewRight: number; viewBottom: number };
}

/**
 * Collect visible tiles into render queues for depth-sorted rendering
 */
export function collectTilesIntoQueues(
  queues: RenderQueues,
  options: CollectTilesOptions,
  drawBaseTile: (
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    tile: Tile,
    highlight: boolean,
    zoom: number,
    skipGreyBase: boolean,
    skipGreenBase: boolean
  ) => void,
  ctx?: CanvasRenderingContext2D
): CollectTilesResult {
  const {
    grid,
    gridSize,
    canvasWidth,
    canvasHeight,
    offsetX,
    offsetY,
    zoom,
    dpr,
    overlayMode,
    showsDragGrid,
    dragStartTile,
    dragEndTile,
    getTileMetadata,
  } = options;

  // Clear existing queues
  clearRenderQueues(queues);

  // Calculate visible tile range
  const viewport: Viewport = {
    x: offsetX,
    y: offsetY,
    width: canvasWidth / dpr,
    height: canvasHeight / dpr,
  };
  const visibleRange = getVisibleTileRange(viewport, zoom, gridSize);
  const { minSum: visibleMinSum, maxSum: visibleMaxSum } = visibleRange;

  // Calculate view bounds for per-tile culling
  const viewBounds = calculateViewBounds(canvasWidth, canvasHeight, offsetX, offsetY, zoom, dpr);

  let tilesRendered = 0;

  // Iterate through visible diagonal bands
  for (let sum = visibleMinSum; sum <= visibleMaxSum; sum++) {
    for (let x = Math.max(0, sum - gridSize + 1); x <= Math.min(sum, gridSize - 1); x++) {
      const y = sum - x;
      if (y < 0 || y >= gridSize) continue;

      const { screenX, screenY } = gridToScreen(x, y, 0, 0);

      // Viewport culling
      if (!isInViewport(screenX, screenY, viewBounds)) {
        continue;
      }

      tilesRendered++;
      const tile = grid[y][x];

      // Check if tile is in drag selection rectangle
      const isInDragRect = showsDragGrid && dragStartTile && dragEndTile &&
        x >= Math.min(dragStartTile.x, dragEndTile.x) &&
        x <= Math.max(dragStartTile.x, dragEndTile.x) &&
        y >= Math.min(dragStartTile.y, dragEndTile.y) &&
        y <= Math.max(dragStartTile.y, dragEndTile.y);

      // Get pre-computed tile metadata
      const tileMetadata = getTileMetadata(x, y);
      const needsGreyBase = tileMetadata?.needsGreyBase ?? false;
      const needsGreenBaseOverWater = tileMetadata?.needsGreenBaseOverWater ?? false;
      const needsGreenBaseForPark = tileMetadata?.needsGreenBaseForPark ?? false;

      // Draw base tile if context provided
      if (ctx) {
        const isSubwayStationHighlight = overlayMode === 'subway' && tile.building.type === 'subway_station';
        drawBaseTile(
          ctx,
          screenX,
          screenY,
          tile,
          !!(isInDragRect || isSubwayStationHighlight),
          zoom,
          true,
          needsGreenBaseOverWater || needsGreenBaseForPark
        );
      }

      // Add to appropriate queue based on building type
      if (needsGreyBase) {
        queues.baseTileQueue.push({ screenX, screenY, tile, depth: x + y });
      }

      if (needsGreenBaseOverWater || needsGreenBaseForPark) {
        queues.greenBaseTileQueue.push({ screenX, screenY, tile, depth: x + y });
      }

      // Route to appropriate queue based on building type
      if (tile.building.type === 'water') {
        const size = getBuildingSize(tile.building.type);
        const depth = x + y + size.width + size.height - 2;
        queues.waterQueue.push({ screenX, screenY, tile, depth });
      } else if (tile.building.type === 'road') {
        queues.roadQueue.push({ screenX, screenY, tile, depth: x + y });
      } else if (tile.building.type === 'bridge') {
        queues.bridgeQueue.push({ screenX, screenY, tile, depth: x + y });
      } else if (tile.building.type === 'rail') {
        queues.railQueue.push({ screenX, screenY, tile, depth: x + y });
      } else if (
        (tile.building.type === 'grass' || tile.building.type === 'empty') &&
        (tileMetadata?.isAdjacentToWater ?? false)
      ) {
        queues.beachQueue.push({ screenX, screenY, tile, depth: x + y });
      } else {
        const isBuilding = tile.building.type !== 'grass' && tile.building.type !== 'empty';
        if (isBuilding) {
          const size = getBuildingSize(tile.building.type);
          const depth = x + y + size.width + size.height - 2;
          queues.buildingQueue.push({ screenX, screenY, tile, depth });
        }
      }

      // Add to overlay queue if applicable
      const showOverlay =
        overlayMode !== 'none' &&
        (overlayMode === 'subway'
          ? tile.building.type !== 'water'
          : tile.building.type !== 'grass' &&
            tile.building.type !== 'water' &&
            tile.building.type !== 'road');
      if (showOverlay) {
        queues.overlayQueue.push({ screenX, screenY, tile });
      }
    }
  }

  return { queues, tilesRendered, visibleRange, viewBounds };
}

/**
 * Sort all render queues by depth
 */
export function sortRenderQueues(queues: RenderQueues): void {
  insertionSortByDepth(queues.waterQueue);
  insertionSortByDepth(queues.roadQueue);
  insertionSortByDepth(queues.bridgeQueue);
  insertionSortByDepth(queues.railQueue);
  insertionSortByDepth(queues.baseTileQueue);
  insertionSortByDepth(queues.greenBaseTileQueue);
  insertionSortByDepth(queues.beachQueue);
  insertionSortByDepth(queues.buildingQueue);
}

/**
 * Canvas layer configuration
 */
export interface CanvasLayers {
  mainCanvas: HTMLCanvasElement;
  hoverCanvas: HTMLCanvasElement;
  carsCanvas: HTMLCanvasElement;
  buildingsCanvas: HTMLCanvasElement;
  airCanvas: HTMLCanvasElement;
  lightingCanvas: HTMLCanvasElement;
}

/**
 * Update canvas size for high-DPI support
 */
export function updateCanvasSize(
  container: HTMLDivElement,
  layers: CanvasLayers,
  setCanvasSize: (size: { width: number; height: number }) => void
): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();

  // Set display size for all canvases
  const canvases = [
    layers.mainCanvas,
    layers.hoverCanvas,
    layers.carsCanvas,
    layers.buildingsCanvas,
    layers.airCanvas,
    layers.lightingCanvas,
  ];

  for (const canvas of canvases) {
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  }

  // Set actual size in memory (scaled for DPI)
  setCanvasSize({
    width: Math.round(rect.width * dpr),
    height: Math.round(rect.height * dpr),
  });
}

// Re-export optimization utilities
export {
  createRenderMetrics,
  updateRenderMetrics,
  createDirtyRegion,
  requestFullRedraw,
  clearDirtyRegion,
  hasDirtyTiles,
  getVisibleTileRange,
  type RenderMetrics,
  type DirtyRegion,
  type Viewport,
} from '@/components/game/canvasOptimization';
