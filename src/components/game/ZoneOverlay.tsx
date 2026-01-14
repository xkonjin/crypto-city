'use client';

import React, { useMemo } from 'react';
import {
  calculateZoneInfluence,
  getFullZoneLegend,
  ZoneTileInfluence,
  ZoneLegendItem,
  ZONE_COLORS_SOLID,
} from '@/lib/zoneCalculation';
import { PlacedCryptoBuilding } from '@/games/isocity/crypto/types';

// =============================================================================
// TYPES
// =============================================================================

export interface ZoneOverlayProps {
  /** Array of placed crypto buildings */
  buildings: PlacedCryptoBuilding[];
  /** Grid size (gridSize x gridSize) */
  gridSize: number;
  /** Whether the overlay is active */
  isActive: boolean;
}

export interface ZoneLegendProps {
  /** Whether the legend is visible */
  isVisible: boolean;
  /** Position ('bottom-right' | 'bottom-left' | 'top-right' | 'top-left') */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

// =============================================================================
// ZONE LEGEND COMPONENT
// =============================================================================

/**
 * Zone Overlay Legend
 * Displays category colors for zone interpretation
 */
export function ZoneLegend({ isVisible, position = 'bottom-right' }: ZoneLegendProps) {
  if (!isVisible) return null;

  const legendItems = getFullZoneLegend();

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div
      data-testid="zone-overlay-legend"
      className={`
        absolute ${positionClasses[position]} z-30
        bg-gray-900/90 backdrop-blur-sm rounded-lg p-3
        border border-gray-700 shadow-lg
        pointer-events-auto
      `}
    >
      <div className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">
        Zone Categories
      </div>
      <div className="space-y-1.5">
        {legendItems.map((item) => (
          <div key={item.category} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.solidColor, opacity: 0.8 }}
            />
            <span className="text-xs text-gray-200">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ZONE OVERLAY DATA HOOK
// =============================================================================

/**
 * Hook to calculate zone overlay data
 */
export function useZoneOverlay(
  buildings: PlacedCryptoBuilding[],
  gridSize: number,
  isActive: boolean
): ZoneTileInfluence[] {
  return useMemo(() => {
    if (!isActive || buildings.length === 0) return [];

    const zoneMap = calculateZoneInfluence(buildings, gridSize);
    return Array.from(zoneMap.tiles.values());
  }, [buildings, gridSize, isActive]);
}

// =============================================================================
// CANVAS RENDERING HELPERS
// =============================================================================

/**
 * Draw zone overlay tiles on a canvas context
 *
 * @param ctx - Canvas 2D rendering context
 * @param tiles - Array of zone tile influences
 * @param gridToScreen - Function to convert grid coords to screen coords
 * @param offset - Viewport offset
 * @param zoom - Current zoom level
 * @param tileWidth - Width of a tile in pixels
 * @param tileHeight - Height of a tile in pixels
 */
export function drawZoneOverlay(
  ctx: CanvasRenderingContext2D,
  tiles: ZoneTileInfluence[],
  gridToScreen: (x: number, y: number) => { screenX: number; screenY: number },
  offset: { x: number; y: number },
  zoom: number,
  tileWidth: number,
  tileHeight: number
): void {
  if (tiles.length === 0) return;

  ctx.save();

  for (const tile of tiles) {
    const { screenX, screenY } = gridToScreen(tile.x, tile.y);

    const x = screenX * zoom + offset.x;
    const y = screenY * zoom + offset.y;

    // Draw isometric diamond shape
    ctx.fillStyle = tile.color;
    ctx.beginPath();
    ctx.moveTo(x + (tileWidth * zoom) / 2, y); // Top
    ctx.lineTo(x + tileWidth * zoom, y + (tileHeight * zoom) / 2); // Right
    ctx.lineTo(x + (tileWidth * zoom) / 2, y + tileHeight * zoom); // Bottom
    ctx.lineTo(x, y + (tileHeight * zoom) / 2); // Left
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draw zone overlay with alpha sorting for proper depth
 *
 * @param ctx - Canvas 2D rendering context
 * @param tiles - Array of zone tile influences
 * @param gridToScreen - Function to convert grid coords to screen coords
 * @param offset - Viewport offset
 * @param zoom - Current zoom level
 * @param tileWidth - Width of a tile in pixels
 * @param tileHeight - Height of a tile in pixels
 */
export function drawZoneOverlaySorted(
  ctx: CanvasRenderingContext2D,
  tiles: ZoneTileInfluence[],
  gridToScreen: (x: number, y: number) => { screenX: number; screenY: number },
  offset: { x: number; y: number },
  zoom: number,
  tileWidth: number,
  tileHeight: number
): void {
  if (tiles.length === 0) return;

  // Sort by depth (back to front rendering)
  const sortedTiles = [...tiles].sort((a, b) => {
    const depthA = a.x + a.y;
    const depthB = b.x + b.y;
    return depthA - depthB;
  });

  drawZoneOverlay(ctx, sortedTiles, gridToScreen, offset, zoom, tileWidth, tileHeight);
}

// =============================================================================
// MAIN ZONE OVERLAY COMPONENT
// =============================================================================

/**
 * ZoneOverlay Component
 *
 * This component provides the data and legend for zone visualization.
 * The actual rendering happens in the canvas layer.
 *
 * Usage:
 * 1. Use useZoneOverlay hook to get tile data
 * 2. Render ZoneLegend when overlay is active
 * 3. Call drawZoneOverlay in canvas render loop
 */
export function ZoneOverlay({ buildings, gridSize, isActive }: ZoneOverlayProps) {
  // This component primarily provides the legend
  // The actual overlay rendering is done in canvas

  if (!isActive) return null;

  return <ZoneLegend isVisible={isActive} position="bottom-right" />;
}

export default ZoneOverlay;
