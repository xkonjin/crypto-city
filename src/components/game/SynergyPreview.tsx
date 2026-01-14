'use client';

import React, { useMemo } from 'react';
import {
  findSynergyBuildings,
  calculateSynergyBonus,
  SynergyBuilding,
  SynergyResult,
  SYNERGY_GLOW_COLORS,
  formatSynergyBonus,
} from '@/lib/synergyCalculation';
import { PlacedCryptoBuilding } from '@/games/isocity/crypto/types';
import { TILE_WIDTH, TILE_HEIGHT } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface SynergyPreviewProps {
  /** ID of the building being placed */
  selectedBuildingId: string | null;
  /** Array of placed crypto buildings */
  placedBuildings: PlacedCryptoBuilding[];
  /** Current hover position on grid */
  hoverPosition: { x: number; y: number } | null;
  /** Whether synergy preview is enabled */
  enabled?: boolean;
}

export interface SynergyBonusPreviewProps {
  /** Synergy calculation result */
  result: SynergyResult;
  /** Screen X position for display */
  screenX: number;
  /** Screen Y position for display */
  screenY: number;
  /** Whether preview is visible */
  isVisible: boolean;
}

// =============================================================================
// SYNERGY BONUS PREVIEW COMPONENT (HTML overlay)
// =============================================================================

/**
 * Displays the synergy bonus preview near the cursor
 */
export function SynergyBonusPreview({
  result,
  screenX,
  screenY,
  isVisible,
}: SynergyBonusPreviewProps) {
  if (!isVisible || result.totalBonus === 0) return null;

  return (
    <div
      data-testid="synergy-bonus-preview"
      className="absolute pointer-events-none z-40 transform -translate-x-1/2"
      style={{
        left: screenX,
        top: screenY - 60,
      }}
    >
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-500/50 shadow-lg">
        <div className="text-green-400 font-bold text-sm">
          {formatSynergyBonus(result.totalBonus)} yield
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {result.chainSynergyCount > 0 && (
            <span className="text-green-300 mr-2">
              ⚡ {result.chainSynergyCount} chain
            </span>
          )}
          {result.categorySynergyCount > 0 && (
            <span className="text-blue-300">
              🔗 {result.categorySynergyCount} category
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SYNERGY PREVIEW HOOK
// =============================================================================

/**
 * Hook to calculate synergy preview data
 */
export function useSynergyPreview(
  selectedBuildingId: string | null,
  placedBuildings: PlacedCryptoBuilding[],
  hoverX: number | null,
  hoverY: number | null,
  enabled: boolean = true
): SynergyResult | null {
  return useMemo(() => {
    if (!enabled || !selectedBuildingId || hoverX === null || hoverY === null) {
      return null;
    }

    return calculateSynergyBonus(
      selectedBuildingId,
      placedBuildings,
      hoverX,
      hoverY
    );
  }, [selectedBuildingId, placedBuildings, hoverX, hoverY, enabled]);
}

// =============================================================================
// CANVAS RENDERING HELPERS
// =============================================================================

/**
 * Draw synergy range circles around buildings
 *
 * @param ctx - Canvas 2D rendering context
 * @param synergyBuildings - Buildings with active synergies
 * @param gridToScreen - Function to convert grid coords to screen coords
 * @param offset - Viewport offset
 * @param zoom - Current zoom level
 */
export function drawSynergyRangeCircles(
  ctx: CanvasRenderingContext2D,
  synergyBuildings: SynergyBuilding[],
  gridToScreen: (x: number, y: number) => { screenX: number; screenY: number },
  offset: { x: number; y: number },
  zoom: number
): void {
  if (synergyBuildings.length === 0) return;

  ctx.save();

  for (const synergy of synergyBuildings) {
    const { screenX, screenY } = gridToScreen(synergy.gridX, synergy.gridY);

    const x = screenX * zoom + offset.x + (TILE_WIDTH * zoom) / 2;
    const y = screenY * zoom + offset.y + (TILE_HEIGHT * zoom) / 2;
    const radius = 25 * zoom * (1 + synergy.bonusContribution * 2);

    // Draw outer glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
    gradient.addColorStop(0, synergy.glowColor);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw inner circle
    ctx.strokeStyle = synergy.synergyType === 'chain'
      ? 'rgba(34, 197, 94, 0.8)'
      : 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 2 * zoom;
    ctx.setLineDash([4 * zoom, 2 * zoom]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

/**
 * Draw synergy connection lines from hover position to synergy buildings
 *
 * @param ctx - Canvas 2D rendering context
 * @param synergyBuildings - Buildings with active synergies
 * @param hoverGridX - Hover grid X position
 * @param hoverGridY - Hover grid Y position
 * @param gridToScreen - Function to convert grid coords to screen coords
 * @param offset - Viewport offset
 * @param zoom - Current zoom level
 */
export function drawSynergyConnectionLines(
  ctx: CanvasRenderingContext2D,
  synergyBuildings: SynergyBuilding[],
  hoverGridX: number,
  hoverGridY: number,
  gridToScreen: (x: number, y: number) => { screenX: number; screenY: number },
  offset: { x: number; y: number },
  zoom: number
): void {
  if (synergyBuildings.length === 0) return;

  ctx.save();

  const hoverPos = gridToScreen(hoverGridX, hoverGridY);
  const hoverX = hoverPos.screenX * zoom + offset.x + (TILE_WIDTH * zoom) / 2;
  const hoverY = hoverPos.screenY * zoom + offset.y + (TILE_HEIGHT * zoom) / 2;

  for (const synergy of synergyBuildings) {
    const { screenX, screenY } = gridToScreen(synergy.gridX, synergy.gridY);

    const targetX = screenX * zoom + offset.x + (TILE_WIDTH * zoom) / 2;
    const targetY = screenY * zoom + offset.y + (TILE_HEIGHT * zoom) / 2;

    // Draw gradient line
    const gradient = ctx.createLinearGradient(hoverX, hoverY, targetX, targetY);
    if (synergy.synergyType === 'chain') {
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
      gradient.addColorStop(0.5, 'rgba(34, 197, 94, 0.6)');
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0.2)');
    } else {
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.6)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
    }

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3 * zoom * synergy.bonusContribution + 1;
    ctx.setLineDash([6 * zoom, 4 * zoom]);

    ctx.beginPath();
    ctx.moveTo(hoverX, hoverY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  ctx.restore();
}

/**
 * Draw synergy building indicators (badges)
 *
 * @param ctx - Canvas 2D rendering context
 * @param synergyBuildings - Buildings with active synergies
 * @param gridToScreen - Function to convert grid coords to screen coords
 * @param offset - Viewport offset
 * @param zoom - Current zoom level
 */
export function drawSynergyBuildingIndicators(
  ctx: CanvasRenderingContext2D,
  synergyBuildings: SynergyBuilding[],
  gridToScreen: (x: number, y: number) => { screenX: number; screenY: number },
  offset: { x: number; y: number },
  zoom: number
): void {
  if (synergyBuildings.length === 0 || zoom < 0.5) return;

  ctx.save();

  for (const synergy of synergyBuildings) {
    const { screenX, screenY } = gridToScreen(synergy.gridX, synergy.gridY);

    const x = screenX * zoom + offset.x + TILE_WIDTH * zoom;
    const y = screenY * zoom + offset.y;
    const badgeRadius = 8 * zoom;

    // Draw badge background
    ctx.fillStyle = synergy.synergyType === 'chain'
      ? 'rgba(34, 197, 94, 1)'
      : 'rgba(59, 130, 246, 1)';
    ctx.beginPath();
    ctx.arc(x, y, badgeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw icon
    ctx.fillStyle = 'white';
    ctx.font = `bold ${8 * zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(synergy.synergyType === 'chain' ? '⚡' : '🔗', x, y);
  }

  ctx.restore();
}

/**
 * Draw complete synergy preview (combines all visual elements)
 *
 * @param ctx - Canvas 2D rendering context
 * @param result - Synergy calculation result
 * @param hoverGridX - Hover grid X position
 * @param hoverGridY - Hover grid Y position
 * @param gridToScreen - Function to convert grid coords to screen coords
 * @param offset - Viewport offset
 * @param zoom - Current zoom level
 */
export function drawSynergyPreview(
  ctx: CanvasRenderingContext2D,
  result: SynergyResult | null,
  hoverGridX: number,
  hoverGridY: number,
  gridToScreen: (x: number, y: number) => { screenX: number; screenY: number },
  offset: { x: number; y: number },
  zoom: number
): void {
  if (!result || result.synergyBuildings.length === 0) return;

  // Draw in order: connection lines, range circles, indicators
  drawSynergyConnectionLines(
    ctx,
    result.synergyBuildings,
    hoverGridX,
    hoverGridY,
    gridToScreen,
    offset,
    zoom
  );
  drawSynergyRangeCircles(
    ctx,
    result.synergyBuildings,
    gridToScreen,
    offset,
    zoom
  );
  drawSynergyBuildingIndicators(
    ctx,
    result.synergyBuildings,
    gridToScreen,
    offset,
    zoom
  );
}

// =============================================================================
// MAIN SYNERGY PREVIEW COMPONENT
// =============================================================================

/**
 * SynergyPreview Component
 *
 * Calculates and provides synergy preview data.
 * Canvas rendering helpers are provided separately.
 *
 * Usage:
 * 1. Use useSynergyPreview hook to get calculation result
 * 2. Render SynergyBonusPreview for UI tooltip
 * 3. Call drawSynergyPreview in canvas render loop
 */
export function SynergyPreview({
  selectedBuildingId,
  placedBuildings,
  hoverPosition,
  enabled = true,
}: SynergyPreviewProps) {
  const result = useSynergyPreview(
    selectedBuildingId,
    placedBuildings,
    hoverPosition?.x ?? null,
    hoverPosition?.y ?? null,
    enabled
  );

  // This component can render the bonus preview tooltip
  // Canvas rendering is handled separately

  if (!result || !hoverPosition) return null;

  // Note: Screen position would need to be provided by parent
  // This is a placeholder for the bonus preview
  return null;
}

export default SynergyPreview;
