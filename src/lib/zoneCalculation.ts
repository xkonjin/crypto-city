/**
 * Zone Calculation System (GitHub Issue #208)
 *
 * Calculates building category zone influence across the city grid.
 * Each building radiates influence based on its zoneRadius, creating
 * colored zones that help players visualize building distribution.
 */

import {
  PlacedCryptoBuilding,
  CryptoCategory,
} from "@/games/isocity/crypto/types";
import { getCryptoBuilding } from "@/games/isocity/crypto";

// =============================================================================
// ZONE COLORS (30% opacity as per spec)
// =============================================================================

/** Zone colors for each building category */
export const ZONE_COLORS: Record<CryptoCategory, string> = {
  defi: "rgba(59, 130, 246, 0.3)", // Blue #3B82F6
  exchange: "rgba(16, 185, 129, 0.3)", // Green #10B981
  ct: "rgba(139, 92, 246, 0.3)", // Purple #8B5CF6
  meme: "rgba(245, 158, 11, 0.3)", // Yellow #F59E0B
  chain: "rgba(249, 115, 22, 0.3)", // Orange #F97316
  plasma: "rgba(236, 72, 153, 0.3)", // Pink #EC4899
  infrastructure: "rgba(107, 114, 128, 0.3)", // Gray #6B7280
  stablecoin: "rgba(34, 211, 238, 0.3)", // Cyan
  legends: "rgba(217, 70, 239, 0.3)", // Fuchsia
  titan: "rgba(124, 58, 237, 0.3)", // Violet
  ingested: "rgba(236, 72, 153, 0.3)", // Pink for user-generated
};

/** Solid zone colors (for legend display) */
export const ZONE_COLORS_SOLID: Record<CryptoCategory, string> = {
  defi: "#3B82F6", // Blue
  exchange: "#10B981", // Green
  ct: "#8B5CF6", // Purple
  meme: "#F59E0B", // Yellow
  chain: "#F97316", // Orange
  plasma: "#EC4899", // Pink
  infrastructure: "#6B7280", // Gray
  stablecoin: "#22D3EE", // Cyan
  legends: "#D946EF", // Fuchsia
  titan: "#7C3AED", // Violet
  ingested: "#EC4899", // Pink for user-generated
};

/** Category display names */
export const CATEGORY_NAMES: Record<CryptoCategory, string> = {
  defi: "DeFi",
  exchange: "Exchange",
  ct: "CT",
  meme: "Meme",
  chain: "Chain",
  plasma: "Plasma",
  infrastructure: "Infrastructure",
  stablecoin: "Stablecoin",
  legends: "Legends",
  titan: "Titan",
  ingested: "Custom",
};

// =============================================================================
// TYPES
// =============================================================================

/** Zone influence data for a single tile */
export interface ZoneTileInfluence {
  /** Grid X coordinate */
  x: number;
  /** Grid Y coordinate */
  y: number;
  /** Category influences (category -> influence strength 0-1) */
  influences: Map<CryptoCategory, number>;
  /** Dominant category (highest influence) */
  dominantCategory: CryptoCategory | null;
  /** Blended color based on all influences */
  color: string;
  /** Total influence strength */
  totalInfluence: number;
}

/** Complete zone influence map */
export interface ZoneInfluenceMap {
  /** Map of "x,y" -> zone influence data */
  tiles: Map<string, ZoneTileInfluence>;
  /** Categories present in the map */
  categories: Set<CryptoCategory>;
  /** Timestamp when calculated */
  timestamp: number;
}

// =============================================================================
// ZONE CALCULATION
// =============================================================================

/**
 * Parse RGBA color string into components
 */
function parseRgba(color: string): { r: number; g: number; b: number; a: number } {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1,
  };
}

/**
 * Blend multiple category colors based on their influences
 */
function blendZoneColors(influences: Map<CryptoCategory, number>): string {
  if (influences.size === 0) return "rgba(0, 0, 0, 0)";

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalWeight = 0;

  for (const [category, influence] of influences) {
    const color = parseRgba(ZONE_COLORS[category]);
    const weight = influence;
    totalR += color.r * weight;
    totalG += color.g * weight;
    totalB += color.b * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return "rgba(0, 0, 0, 0)";

  const r = Math.round(totalR / totalWeight);
  const g = Math.round(totalG / totalWeight);
  const b = Math.round(totalB / totalWeight);
  // Base opacity is 0.3, scale by total influence (capped at 0.6 for visibility)
  const a = Math.min(0.3 + totalWeight * 0.1, 0.6);

  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

/**
 * Calculate zone influence for all tiles affected by crypto buildings
 *
 * @param buildings - Array of placed crypto buildings
 * @param gridSize - Size of the grid (gridSize x gridSize)
 * @returns Zone influence map
 */
export function calculateZoneInfluence(
  buildings: PlacedCryptoBuilding[],
  gridSize: number
): ZoneInfluenceMap {
  const tiles = new Map<string, ZoneTileInfluence>();
  const categories = new Set<CryptoCategory>();

  // Calculate influence contribution from each building
  for (const building of buildings) {
    const def = getCryptoBuilding(building.buildingId);
    if (!def?.crypto?.effects) continue;

    const category = def.category;
    const radius = def.crypto.effects.zoneRadius || 3;

    categories.add(category);

    // Add influence to tiles within radius
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = building.gridX + dx;
        const y = building.gridY + dy;

        // Skip tiles outside grid
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;

        // Chebyshev distance for square zones
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        if (distance > radius) continue;

        // Influence falls off with distance
        const influence = 1 - distance / (radius + 1);

        const key = `${x},${y}`;
        let tileData = tiles.get(key);

        if (!tileData) {
          tileData = {
            x,
            y,
            influences: new Map(),
            dominantCategory: null,
            color: "rgba(0, 0, 0, 0)",
            totalInfluence: 0,
          };
          tiles.set(key, tileData);
        }

        // Add to existing influence for this category
        const existing = tileData.influences.get(category) || 0;
        tileData.influences.set(category, existing + influence);
      }
    }
  }

  // Calculate dominant category and blended color for each tile
  for (const [, tileData] of tiles) {
    let maxInfluence = 0;
    let totalInfluence = 0;

    for (const [category, influence] of tileData.influences) {
      totalInfluence += influence;
      if (influence > maxInfluence) {
        maxInfluence = influence;
        tileData.dominantCategory = category;
      }
    }

    tileData.totalInfluence = totalInfluence;
    tileData.color = blendZoneColors(tileData.influences);
  }

  return {
    tiles,
    categories,
    timestamp: Date.now(),
  };
}

/**
 * Get zone influence for a specific tile
 *
 * @param zoneMap - Zone influence map
 * @param x - Grid X coordinate
 * @param y - Grid Y coordinate
 * @returns Zone tile influence or null if not in any zone
 */
export function getZoneInfluenceAt(
  zoneMap: ZoneInfluenceMap,
  x: number,
  y: number
): ZoneTileInfluence | null {
  return zoneMap.tiles.get(`${x},${y}`) || null;
}

/**
 * Get all tiles with zone influence as an array
 *
 * @param zoneMap - Zone influence map
 * @returns Array of zone tile influences
 */
export function getZoneTileArray(zoneMap: ZoneInfluenceMap): ZoneTileInfluence[] {
  return Array.from(zoneMap.tiles.values());
}

// =============================================================================
// ZONE CACHE MANAGEMENT
// =============================================================================

let zoneCache: ZoneInfluenceMap | null = null;
let lastBuildingCount = 0;
let lastGridVersion = -1;

/**
 * Get cached zone influence or recalculate if needed
 *
 * @param buildings - Array of placed crypto buildings
 * @param gridSize - Size of the grid
 * @param gridVersion - Current grid version for cache invalidation
 * @returns Zone influence map
 */
export function getCachedZoneInfluence(
  buildings: PlacedCryptoBuilding[],
  gridSize: number,
  gridVersion: number
): ZoneInfluenceMap {
  // Check if cache is valid
  const isCacheValid =
    zoneCache &&
    lastGridVersion === gridVersion &&
    buildings.length === lastBuildingCount &&
    Date.now() - zoneCache.timestamp < 2000; // 2 second cache

  if (isCacheValid && zoneCache) {
    return zoneCache;
  }

  // Recalculate
  zoneCache = calculateZoneInfluence(buildings, gridSize);
  lastBuildingCount = buildings.length;
  lastGridVersion = gridVersion;

  return zoneCache;
}

/**
 * Invalidate the zone cache
 */
export function invalidateZoneCache(): void {
  zoneCache = null;
  lastBuildingCount = 0;
  lastGridVersion = -1;
}

// =============================================================================
// LEGEND DATA
// =============================================================================

/** Legend item for zone overlay display */
export interface ZoneLegendItem {
  category: CryptoCategory;
  name: string;
  color: string;
  solidColor: string;
}

/**
 * Get legend data for active categories
 *
 * @param activeCategories - Set of categories currently in the zone map
 * @returns Array of legend items for display
 */
export function getZoneLegend(
  activeCategories?: Set<CryptoCategory>
): ZoneLegendItem[] {
  const categories: CryptoCategory[] = [
    "defi",
    "exchange",
    "ct",
    "meme",
    "chain",
    "plasma",
    "infrastructure",
  ];

  return categories
    .filter((cat) => !activeCategories || activeCategories.has(cat))
    .map((category) => ({
      category,
      name: CATEGORY_NAMES[category],
      color: ZONE_COLORS[category],
      solidColor: ZONE_COLORS_SOLID[category],
    }));
}

/**
 * Get the full legend with all categories (for static display)
 */
export function getFullZoneLegend(): ZoneLegendItem[] {
  const categories: CryptoCategory[] = [
    "defi",
    "exchange",
    "ct",
    "meme",
    "chain",
    "plasma",
    "infrastructure",
  ];

  return categories.map((category) => ({
    category,
    name: CATEGORY_NAMES[category],
    color: ZONE_COLORS[category],
    solidColor: ZONE_COLORS_SOLID[category],
  }));
}
