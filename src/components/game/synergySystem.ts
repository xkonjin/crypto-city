/**
 * Synergy Visualization System
 * 
 * Handles calculation and rendering of crypto building synergy connections.
 * Provides visual feedback for chain and category synergies between buildings.
 */

import { TILE_WIDTH, TILE_HEIGHT } from './types';
import { SYNERGY_COLORS } from './overlays';
import { getCryptoBuilding, PlacedCryptoBuilding, CryptoChain, CryptoCategory } from '@/games/isocity/crypto';

// ============================================================================
// Types
// ============================================================================

/** Represents a synergy connection between two buildings */
export interface SynergyConnection {
  /** Source building position (screen coordinates) */
  from: { x: number; y: number };
  /** Target building position (screen coordinates) */
  to: { x: number; y: number };
  /** Type of synergy */
  type: 'chain' | 'category';
  /** Strength of synergy (0-1, based on distance) */
  strength: number;
  /** Source building ID */
  fromId: string;
  /** Target building ID */
  toId: string;
}

/** Building with screen position for rendering */
export interface BuildingWithPosition {
  building: PlacedCryptoBuilding;
  screenX: number;
  screenY: number;
  hasSynergy: boolean;
  synergyBonus: number;
}

// ============================================================================
// Synergy Calculation
// ============================================================================

/**
 * Calculate all synergy connections between placed crypto buildings
 * 
 * @param placedBuildings - Array of placed crypto buildings from CryptoEconomyManager
 * @param gridToScreen - Function to convert grid coordinates to screen coordinates
 * @returns Array of synergy connections to render
 */
export function calculateSynergyConnections(
  placedBuildings: PlacedCryptoBuilding[],
  gridToScreen: (x: number, y: number) => { screenX: number; screenY: number }
): SynergyConnection[] {
  const connections: SynergyConnection[] = [];
  const processedPairs = new Set<string>();

  for (const building of placedBuildings) {
    const def = getCryptoBuilding(building.buildingId);
    if (!def?.crypto?.effects) continue;

    const effects = def.crypto.effects;
    const radius = effects.zoneRadius || 5;
    const chainSynergies = effects.chainSynergy || [];
    const categorySynergies = effects.categorySynergy || [];

    // Get screen position for this building
    const fromPos = gridToScreen(building.gridX, building.gridY);

    // Check all other buildings for synergy
    for (const other of placedBuildings) {
      if (other.id === building.id) continue;

      // Create a unique key for this pair to avoid duplicate connections
      const pairKey = [building.id, other.id].sort().join('-');
      if (processedPairs.has(pairKey)) continue;

      // Calculate distance
      const dx = Math.abs(other.gridX - building.gridX);
      const dy = Math.abs(other.gridY - building.gridY);
      const distance = Math.max(dx, dy); // Chebyshev distance

      if (distance > radius) continue;

      const otherDef = getCryptoBuilding(other.buildingId);
      if (!otherDef?.crypto) continue;

      const toPos = gridToScreen(other.gridX, other.gridY);
      const strength = 1 - distance / radius;

      // Check chain synergy
      if (otherDef.crypto.chain && chainSynergies.includes(otherDef.crypto.chain)) {
        connections.push({
          from: { x: fromPos.screenX, y: fromPos.screenY },
          to: { x: toPos.screenX, y: toPos.screenY },
          type: 'chain',
          strength,
          fromId: building.id,
          toId: other.id,
        });
        processedPairs.add(pairKey);
      }
      // Check category synergy
      else if (categorySynergies.includes(otherDef.category)) {
        connections.push({
          from: { x: fromPos.screenX, y: fromPos.screenY },
          to: { x: toPos.screenX, y: toPos.screenY },
          type: 'category',
          strength,
          fromId: building.id,
          toId: other.id,
        });
        processedPairs.add(pairKey);
      }
    }
  }

  return connections;
}

/**
 * Calculate buildings with their synergy status for UI display
 * 
 * @param placedBuildings - Array of placed crypto buildings
 * @param gridToScreen - Function to convert grid coordinates to screen coordinates
 * @returns Buildings with position and synergy info
 */
export function getBuildingsWithSynergyStatus(
  placedBuildings: PlacedCryptoBuilding[],
  gridToScreen: (x: number, y: number) => { screenX: number; screenY: number }
): BuildingWithPosition[] {
  const connections = calculateSynergyConnections(placedBuildings, gridToScreen);
  const buildingsWithSynergy = new Set<string>();
  const buildingSynergyBonus = new Map<string, number>();

  // Track which buildings have synergies
  for (const conn of connections) {
    buildingsWithSynergy.add(conn.fromId);
    buildingsWithSynergy.add(conn.toId);
    
    // Accumulate synergy bonus (5% for chain, 3% for category)
    const bonus = conn.type === 'chain' ? 0.05 : 0.03;
    const scaledBonus = bonus * conn.strength;
    
    buildingSynergyBonus.set(
      conn.fromId, 
      (buildingSynergyBonus.get(conn.fromId) || 0) + scaledBonus
    );
    buildingSynergyBonus.set(
      conn.toId, 
      (buildingSynergyBonus.get(conn.toId) || 0) + scaledBonus
    );
  }

  return placedBuildings.map(building => {
    const pos = gridToScreen(building.gridX, building.gridY);
    const bonus = buildingSynergyBonus.get(building.id) || 0;
    return {
      building,
      screenX: pos.screenX,
      screenY: pos.screenY,
      hasSynergy: buildingsWithSynergy.has(building.id),
      synergyBonus: Math.min(bonus, 0.5), // Cap at 50%
    };
  });
}

// ============================================================================
// Canvas Rendering
// ============================================================================

/**
 * Draw synergy connection lines on canvas
 * 
 * @param ctx - Canvas 2D rendering context
 * @param connections - Array of synergy connections to draw
 * @param offset - Current viewport offset
 * @param zoom - Current zoom level
 */
export function drawSynergyConnections(
  ctx: CanvasRenderingContext2D,
  connections: SynergyConnection[],
  offset: { x: number; y: number },
  zoom: number
): void {
  ctx.save();
  
  for (const conn of connections) {
    const fromX = conn.from.x * zoom + offset.x + (TILE_WIDTH * zoom) / 2;
    const fromY = conn.from.y * zoom + offset.y + (TILE_HEIGHT * zoom) / 2;
    const toX = conn.to.x * zoom + offset.x + (TILE_WIDTH * zoom) / 2;
    const toY = conn.to.y * zoom + offset.y + (TILE_HEIGHT * zoom) / 2;
    
    // Draw connection line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    
    // Style based on synergy type
    ctx.strokeStyle = conn.type === 'chain' 
      ? SYNERGY_COLORS.chain 
      : SYNERGY_COLORS.category;
    ctx.lineWidth = 2 * zoom * conn.strength + 1;
    ctx.setLineDash([5 * zoom, 3 * zoom]);
    ctx.stroke();
    
    // Draw endpoint dots
    ctx.setLineDash([]);
    ctx.fillStyle = ctx.strokeStyle;
    const dotRadius = 3 * zoom * conn.strength + 2;
    
    ctx.beginPath();
    ctx.arc(fromX, fromY, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(toX, toY, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Draw synergy glow effect around buildings with active synergies
 * 
 * @param ctx - Canvas 2D rendering context
 * @param buildings - Buildings with synergy status
 * @param offset - Current viewport offset
 * @param zoom - Current zoom level
 */
export function drawSynergyGlows(
  ctx: CanvasRenderingContext2D,
  buildings: BuildingWithPosition[],
  offset: { x: number; y: number },
  zoom: number
): void {
  ctx.save();
  
  for (const { screenX, screenY, hasSynergy, synergyBonus } of buildings) {
    if (!hasSynergy) continue;
    
    const x = screenX * zoom + offset.x + (TILE_WIDTH * zoom) / 2;
    const y = screenY * zoom + offset.y + (TILE_HEIGHT * zoom) / 2;
    const radius = 20 * zoom * (1 + synergyBonus);
    
    // Create radial gradient for glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, SYNERGY_COLORS.glow);
    gradient.addColorStop(1, 'rgba(217, 70, 239, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Draw mini synergy indicator badges on buildings
 * 
 * @param ctx - Canvas 2D rendering context
 * @param buildings - Buildings with synergy status
 * @param offset - Current viewport offset
 * @param zoom - Current zoom level
 */
export function drawSynergyIndicators(
  ctx: CanvasRenderingContext2D,
  buildings: BuildingWithPosition[],
  offset: { x: number; y: number },
  zoom: number
): void {
  ctx.save();
  
  for (const { screenX, screenY, hasSynergy, synergyBonus } of buildings) {
    if (!hasSynergy || zoom < 0.5) continue; // Don't show indicators when zoomed out
    
    const x = screenX * zoom + offset.x + (TILE_WIDTH * zoom) - 5 * zoom;
    const y = screenY * zoom + offset.y - 5 * zoom;
    const badgeRadius = 6 * zoom;
    
    // Draw badge circle
    ctx.fillStyle = SYNERGY_COLORS.badge;
    ctx.beginPath();
    ctx.arc(x, y, badgeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw synergy icon (lightning bolt)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5 * zoom;
    ctx.beginPath();
    ctx.moveTo(x - 2 * zoom, y - 3 * zoom);
    ctx.lineTo(x + 1 * zoom, y);
    ctx.lineTo(x - 1 * zoom, y);
    ctx.lineTo(x + 2 * zoom, y + 3 * zoom);
    ctx.stroke();
    
    // Show bonus percentage if zoomed in enough
    if (zoom >= 0.8 && synergyBonus > 0) {
      const bonusText = `+${Math.round(synergyBonus * 100)}%`;
      ctx.font = `bold ${10 * zoom}px sans-serif`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(bonusText, x, y + badgeRadius + 2 * zoom);
    }
  }
  
  ctx.restore();
}

/**
 * Calculate potential synergy connections for a building being placed
 * Used to show synergy preview during placement
 * 
 * @param buildingId - ID of the building being placed
 * @param gridX - Grid X position
 * @param gridY - Grid Y position
 * @param placedBuildings - Existing placed buildings
 * @param gridToScreen - Function to convert grid coordinates to screen coordinates
 * @returns Potential synergy connections
 */
export function calculatePlacementSynergyPreview(
  buildingId: string,
  gridX: number,
  gridY: number,
  placedBuildings: PlacedCryptoBuilding[],
  gridToScreen: (x: number, y: number) => { screenX: number; screenY: number }
): SynergyConnection[] {
  const def = getCryptoBuilding(buildingId);
  if (!def?.crypto?.effects) return [];

  const effects = def.crypto.effects;
  const radius = effects.zoneRadius || 5;
  const chainSynergies = effects.chainSynergy || [];
  const categorySynergies = effects.categorySynergy || [];
  
  const connections: SynergyConnection[] = [];
  const fromPos = gridToScreen(gridX, gridY);

  for (const other of placedBuildings) {
    // Calculate distance
    const dx = Math.abs(other.gridX - gridX);
    const dy = Math.abs(other.gridY - gridY);
    const distance = Math.max(dx, dy);

    if (distance > radius) continue;

    const otherDef = getCryptoBuilding(other.buildingId);
    if (!otherDef?.crypto) continue;

    const toPos = gridToScreen(other.gridX, other.gridY);
    const strength = 1 - distance / radius;

    // Check chain synergy
    if (otherDef.crypto.chain && chainSynergies.includes(otherDef.crypto.chain)) {
      connections.push({
        from: { x: fromPos.screenX, y: fromPos.screenY },
        to: { x: toPos.screenX, y: toPos.screenY },
        type: 'chain',
        strength,
        fromId: 'preview',
        toId: other.id,
      });
    }
    // Check category synergy
    else if (categorySynergies.includes(otherDef.category)) {
      connections.push({
        from: { x: fromPos.screenX, y: fromPos.screenY },
        to: { x: toPos.screenX, y: toPos.screenY },
        type: 'category',
        strength,
        fromId: 'preview',
        toId: other.id,
      });
    }
  }

  return connections;
}

/**
 * Get compatible building IDs for synergy highlighting in the panel
 * 
 * @param buildingId - ID of the building to check synergies for
 * @param placedBuildings - Existing placed buildings
 * @returns Set of building IDs that would synergize
 */
export function getCompatibleBuildingIds(
  buildingId: string,
  placedBuildings: PlacedCryptoBuilding[]
): Set<string> {
  const def = getCryptoBuilding(buildingId);
  if (!def?.crypto?.effects) return new Set();

  const effects = def.crypto.effects;
  const chainSynergies = effects.chainSynergy || [];
  const categorySynergies = effects.categorySynergy || [];
  
  const compatibleIds = new Set<string>();

  for (const other of placedBuildings) {
    const otherDef = getCryptoBuilding(other.buildingId);
    if (!otherDef?.crypto) continue;

    // Check chain synergy
    if (otherDef.crypto.chain && chainSynergies.includes(otherDef.crypto.chain)) {
      compatibleIds.add(other.id);
    }
    // Check category synergy
    else if (categorySynergies.includes(otherDef.category)) {
      compatibleIds.add(other.id);
    }
  }

  return compatibleIds;
}

/**
 * Calculate total synergy bonus for tooltip display
 * 
 * @param buildingId - ID of the building
 * @param gridX - Grid X position
 * @param gridY - Grid Y position  
 * @param placedBuildings - Existing placed buildings
 * @returns Total synergy bonus as a percentage (0-50)
 */
export function calculateTotalSynergyBonus(
  buildingId: string,
  gridX: number,
  gridY: number,
  placedBuildings: PlacedCryptoBuilding[]
): number {
  const def = getCryptoBuilding(buildingId);
  if (!def?.crypto?.effects) return 0;

  const effects = def.crypto.effects;
  const radius = effects.zoneRadius || 5;
  const chainSynergies = effects.chainSynergy || [];
  const categorySynergies = effects.categorySynergy || [];
  
  let totalBonus = 0;

  for (const other of placedBuildings) {
    // Calculate distance
    const dx = Math.abs(other.gridX - gridX);
    const dy = Math.abs(other.gridY - gridY);
    const distance = Math.max(dx, dy);

    if (distance > radius) continue;

    const otherDef = getCryptoBuilding(other.buildingId);
    if (!otherDef?.crypto) continue;

    const strength = 1 - distance / radius;

    // Chain synergy (5%)
    if (otherDef.crypto.chain && chainSynergies.includes(otherDef.crypto.chain)) {
      totalBonus += 0.05 * strength;
    }
    // Category synergy (3%)
    else if (categorySynergies.includes(otherDef.category)) {
      totalBonus += 0.03 * strength;
    }
  }

  return Math.min(totalBonus * 100, 50); // Cap at 50%
}
