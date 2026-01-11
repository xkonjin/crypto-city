/**
 * Canvas overlay rendering functions
 * Issue #66 - Module extraction from CanvasIsometricGrid.tsx
 */

import { Tile } from '@/types/game';
import { OverlayMode, TILE_WIDTH, TILE_HEIGHT } from '@/components/game/types';
import { SERVICE_CONFIG } from '@/lib/simulation';
import { gridToScreen } from '@/components/game/utils';
import {
  getOverlayFillStyle,
  OVERLAY_TO_BUILDING_TYPES,
  OVERLAY_CIRCLE_COLORS,
  OVERLAY_CIRCLE_FILL_COLORS,
  OVERLAY_HIGHLIGHT_COLORS,
} from '@/components/game/overlays';
import {
  calculateSynergyConnections,
  getBuildingsWithSynergyStatus,
  drawSynergyConnections,
  drawSynergyGlows,
  drawSynergyIndicators,
} from '@/components/game/synergySystem';
import {
  calculateOverlay,
  getCachedOverlay,
  CryptoOverlayType,
} from '@/lib/cryptoOverlays';
import { cryptoEconomy } from '@/games/isocity/crypto';
import type { OverlayDrawItem } from './CanvasUtils';

/**
 * Service coverage data for a tile
 */
export interface TileCoverage {
  fire: number;
  police: number;
  health: number;
  education: number;
}

/**
 * Render overlay tiles with fill colors
 */
export function renderOverlayQueue(
  ctx: CanvasRenderingContext2D,
  overlayQueue: OverlayDrawItem[],
  overlayMode: OverlayMode,
  services: {
    fire: number[][];
    police: number[][];
    health: number[][];
    education: number[][];
  }
): void {
  const halfWidth = TILE_WIDTH / 2;
  const halfHeight = TILE_HEIGHT / 2;
  
  for (let i = 0; i < overlayQueue.length; i++) {
    const { tile, screenX, screenY } = overlayQueue[i];
    const coverage: TileCoverage = {
      fire: services.fire[tile.y][tile.x],
      police: services.police[tile.y][tile.x],
      health: services.health[tile.y][tile.x],
      education: services.education[tile.y][tile.x],
    };
    
    const fillStyle = getOverlayFillStyle(overlayMode, tile, coverage);
    
    if (fillStyle !== 'rgba(0, 0, 0, 0)') {
      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      ctx.moveTo(screenX + halfWidth, screenY);
      ctx.lineTo(screenX + TILE_WIDTH, screenY + halfHeight);
      ctx.lineTo(screenX + halfWidth, screenY + TILE_HEIGHT);
      ctx.lineTo(screenX, screenY + halfHeight);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/**
 * Draw service radius circles for a specific overlay mode
 */
export function renderServiceRadii(
  ctx: CanvasRenderingContext2D,
  grid: Tile[][],
  gridSize: number,
  overlayMode: OverlayMode,
  zoom: number
): void {
  if (overlayMode === 'none' || overlayMode === 'subway') return;
  
  const serviceBuildingTypes = OVERLAY_TO_BUILDING_TYPES[overlayMode];
  if (!serviceBuildingTypes) return;
  
  const circleColor = OVERLAY_CIRCLE_COLORS[overlayMode];
  const circleFillColor = OVERLAY_CIRCLE_FILL_COLORS[overlayMode];
  const highlightColor = OVERLAY_HIGHLIGHT_COLORS[overlayMode];
  
  const halfWidth = TILE_WIDTH / 2;
  const halfHeight = TILE_HEIGHT / 2;
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const tile = grid[y][x];
      if (!serviceBuildingTypes.includes(tile.building.type)) continue;
      
      // Skip buildings under construction
      if (tile.building.constructionProgress !== undefined && tile.building.constructionProgress < 100) continue;
      
      // Skip abandoned buildings
      if (tile.building.abandoned) continue;
      
      const config = SERVICE_CONFIG[tile.building.type as keyof typeof SERVICE_CONFIG];
      if (!config || !('range' in config)) continue;
      
      const range = config.range;
      
      const { screenX: bldgScreenX, screenY: bldgScreenY } = gridToScreen(x, y, 0, 0);
      const centerX = bldgScreenX + halfWidth;
      const centerY = bldgScreenY + halfHeight;
      
      // Draw isometric ellipse for the radius
      const radiusX = range * halfWidth;
      const radiusY = range * halfHeight;
      
      ctx.strokeStyle = circleColor;
      ctx.lineWidth = 2 / zoom;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = circleFillColor;
      ctx.fill();
      
      // Draw highlight glow around the service building
      ctx.strokeStyle = highlightColor;
      ctx.lineWidth = 3 / zoom;
      ctx.beginPath();
      ctx.moveTo(bldgScreenX + halfWidth, bldgScreenY);
      ctx.lineTo(bldgScreenX + TILE_WIDTH, bldgScreenY + halfHeight);
      ctx.lineTo(bldgScreenX + halfWidth, bldgScreenY + TILE_HEIGHT);
      ctx.lineTo(bldgScreenX, bldgScreenY + halfHeight);
      ctx.closePath();
      ctx.stroke();
      
      // Draw a dot at the building center
      ctx.fillStyle = highlightColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4 / zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Render synergy overlay for crypto buildings
 */
export function renderSynergyOverlay(ctx: CanvasRenderingContext2D): void {
  const placedBuildings = cryptoEconomy.getPlacedBuildings();
  if (placedBuildings.length === 0) return;
  
  const synergyGridToScreen = (gx: number, gy: number) => gridToScreen(gx, gy, 0, 0);
  
  const connections = calculateSynergyConnections(placedBuildings, synergyGridToScreen);
  const buildingsWithStatus = getBuildingsWithSynergyStatus(placedBuildings, synergyGridToScreen);
  
  // Draw synergy glows first (below connection lines)
  drawSynergyGlows(ctx, buildingsWithStatus, { x: 0, y: 0 }, 1);
  
  // Draw synergy connection lines
  drawSynergyConnections(ctx, connections, { x: 0, y: 0 }, 1);
  
  // Draw synergy indicator badges on buildings
  drawSynergyIndicators(ctx, buildingsWithStatus, { x: 0, y: 0 }, 1);
}

/**
 * Render synergy indicators (without full overlay) - used when synergy overlay is not active
 */
export function renderSynergyIndicatorsOnly(ctx: CanvasRenderingContext2D): void {
  const placedBuildings = cryptoEconomy.getPlacedBuildings();
  if (placedBuildings.length <= 1) return;
  
  const synergyGridToScreen = (gx: number, gy: number) => gridToScreen(gx, gy, 0, 0);
  const buildingsWithStatus = getBuildingsWithSynergyStatus(placedBuildings, synergyGridToScreen);
  
  drawSynergyIndicators(ctx, buildingsWithStatus, { x: 0, y: 0 }, 1);
}

/**
 * Render crypto-specific overlays (yield, risk, protection, density)
 */
export function renderCryptoOverlay(
  ctx: CanvasRenderingContext2D,
  overlayMode: OverlayMode,
  gridSize: number,
  gridVersion: number
): void {
  const cryptoOverlayModes = ['crypto_yield', 'crypto_risk', 'crypto_protection', 'crypto_density'];
  if (!cryptoOverlayModes.includes(overlayMode)) return;
  
  const placedBuildings = cryptoEconomy.getPlacedBuildings();
  if (placedBuildings.length === 0) return;
  
  const cryptoOverlayMap: Record<string, CryptoOverlayType> = {
    'crypto_yield': 'yield',
    'crypto_risk': 'risk',
    'crypto_protection': 'protection',
    'crypto_density': 'crypto_density',
  };
  const cryptoOverlayType = cryptoOverlayMap[overlayMode] || 'none';
  
  const overlayTiles = getCachedOverlay(
    cryptoOverlayType,
    placedBuildings,
    gridSize,
    gridVersion
  );
  
  const halfWidth = TILE_WIDTH / 2;
  const halfHeight = TILE_HEIGHT / 2;
  
  for (const overlayTile of overlayTiles) {
    const { screenX: osx, screenY: osy } = gridToScreen(overlayTile.x, overlayTile.y, 0, 0);
    
    ctx.fillStyle = overlayTile.color;
    ctx.beginPath();
    ctx.moveTo(osx + halfWidth, osy);
    ctx.lineTo(osx + TILE_WIDTH, osy + halfHeight);
    ctx.lineTo(osx + halfWidth, osy + TILE_HEIGHT);
    ctx.lineTo(osx, osy + halfHeight);
    ctx.closePath();
    ctx.fill();
  }
}

// Re-export overlay utilities
export { getOverlayFillStyle } from '@/components/game/overlays';
export { calculatePlacementSynergyPreview, drawSynergyConnections } from '@/components/game/synergySystem';
