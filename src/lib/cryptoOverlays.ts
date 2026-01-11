/**
 * Crypto Overlay System (Issue #58)
 *
 * Provides visual overlays for crypto building metrics:
 * - Yield: Shows income per tile based on building yields
 * - Risk: Shows rug pull probability per tile
 * - Protection: Shows coverage from Auditor and Insurance buildings
 * - Density: Shows building density per area (crypto-specific)
 *
 * The synergy overlay is handled separately in synergySystem.ts
 */

import {
  PlacedCryptoBuilding,
  CryptoEffects,
} from "@/games/isocity/crypto/types";
import { getCryptoBuilding } from "@/games/isocity/crypto";

// =============================================================================
// TYPES
// =============================================================================

/** Types of crypto overlays available */
export type CryptoOverlayType =
  | "yield"
  | "risk"
  | "protection"
  | "crypto_density"
  | "none";

/** Color scale point for gradient generation */
export interface ColorScalePoint {
  /** Value from 0 to 1 */
  value: number;
  /** CSS color string */
  color: string;
}

/** Configuration for a crypto overlay type */
export interface CryptoOverlayConfig {
  /** Overlay type identifier */
  type: CryptoOverlayType;
  /** Display label */
  label: string;
  /** Description for tooltips */
  description: string;
  /** Minimum value for the scale */
  minValue: number;
  /** Maximum value for the scale */
  maxValue: number;
  /** Color gradient scale */
  colorScale: ColorScalePoint[];
  /** Icon emoji for UI */
  icon: string;
  /** Active button color (Tailwind class) */
  activeColor: string;
}

/** Computed overlay data for a single tile */
export interface TileOverlay {
  /** Grid X coordinate */
  x: number;
  /** Grid Y coordinate */
  y: number;
  /** Computed value (0 to 1, normalized) */
  value: number;
  /** CSS color string */
  color: string;
  /** Raw value before normalization */
  rawValue: number;
}

/** Cached overlay calculation result */
export interface OverlayCache {
  /** Type of overlay */
  type: CryptoOverlayType;
  /** Grid version when calculated */
  gridVersion: number;
  /** Tile overlay data */
  tiles: TileOverlay[];
  /** Timestamp when cached */
  timestamp: number;
}

// =============================================================================
// OVERLAY CONFIGURATIONS
// =============================================================================

export const CRYPTO_OVERLAY_CONFIGS: Record<CryptoOverlayType, CryptoOverlayConfig> = {
  yield: {
    type: "yield",
    label: "Yield",
    description: "Income generated per tile from crypto buildings",
    minValue: 0,
    maxValue: 1000, // $1000/day max display
    colorScale: [
      { value: 0, color: "rgba(0, 0, 0, 0)" },
      { value: 0.1, color: "rgba(34, 197, 94, 0.2)" },
      { value: 0.3, color: "rgba(34, 197, 94, 0.4)" },
      { value: 0.5, color: "rgba(34, 197, 94, 0.6)" },
      { value: 0.7, color: "rgba(74, 222, 128, 0.7)" },
      { value: 1.0, color: "rgba(134, 239, 172, 0.85)" },
    ],
    icon: "💰",
    activeColor: "bg-green-500",
  },
  risk: {
    type: "risk",
    label: "Risk",
    description: "Rug pull probability per tile",
    minValue: 0,
    maxValue: 0.5, // 50% max risk
    colorScale: [
      { value: 0, color: "rgba(0, 0, 0, 0)" },
      { value: 0.1, color: "rgba(239, 68, 68, 0.15)" },
      { value: 0.3, color: "rgba(239, 68, 68, 0.35)" },
      { value: 0.5, color: "rgba(239, 68, 68, 0.55)" },
      { value: 0.7, color: "rgba(220, 38, 38, 0.7)" },
      { value: 1.0, color: "rgba(185, 28, 28, 0.85)" },
    ],
    icon: "⚠️",
    activeColor: "bg-red-500",
  },
  protection: {
    type: "protection",
    label: "Protection",
    description: "Coverage from Auditor and Insurance buildings",
    minValue: 0,
    maxValue: 1, // 100% protection
    colorScale: [
      { value: 0, color: "rgba(0, 0, 0, 0)" },
      { value: 0.1, color: "rgba(59, 130, 246, 0.2)" },
      { value: 0.3, color: "rgba(59, 130, 246, 0.4)" },
      { value: 0.5, color: "rgba(59, 130, 246, 0.55)" },
      { value: 0.7, color: "rgba(96, 165, 250, 0.7)" },
      { value: 1.0, color: "rgba(147, 197, 253, 0.85)" },
    ],
    icon: "🛡️",
    activeColor: "bg-blue-500",
  },
  crypto_density: {
    type: "crypto_density",
    label: "Density",
    description: "Crypto building density per area",
    minValue: 0,
    maxValue: 10, // Max 10 buildings in radius
    colorScale: [
      { value: 0, color: "rgba(0, 0, 0, 0)" },
      { value: 0.1, color: "rgba(168, 85, 247, 0.15)" },
      { value: 0.3, color: "rgba(168, 85, 247, 0.35)" },
      { value: 0.5, color: "rgba(168, 85, 247, 0.5)" },
      { value: 0.7, color: "rgba(192, 132, 252, 0.65)" },
      { value: 1.0, color: "rgba(216, 180, 254, 0.8)" },
    ],
    icon: "🏙️",
    activeColor: "bg-purple-500",
  },
  none: {
    type: "none",
    label: "None",
    description: "No overlay",
    minValue: 0,
    maxValue: 0,
    colorScale: [],
    icon: "🚫",
    activeColor: "",
  },
};

// =============================================================================
// COLOR INTERPOLATION
// =============================================================================

/**
 * Parse an rgba color string into components
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
 * Interpolate between two colors
 */
function lerpColor(
  color1: { r: number; g: number; b: number; a: number },
  color2: { r: number; g: number; b: number; a: number },
  t: number
): string {
  const r = Math.round(color1.r + (color2.r - color1.r) * t);
  const g = Math.round(color1.g + (color2.g - color1.g) * t);
  const b = Math.round(color1.b + (color2.b - color1.b) * t);
  const a = color1.a + (color2.a - color1.a) * t;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

/**
 * Get color from a color scale based on normalized value (0-1)
 */
export function getColorFromScale(value: number, colorScale: ColorScalePoint[]): string {
  if (colorScale.length === 0) return "rgba(0, 0, 0, 0)";
  if (value <= 0) return colorScale[0].color;
  if (value >= 1) return colorScale[colorScale.length - 1].color;

  // Find the two scale points to interpolate between
  for (let i = 0; i < colorScale.length - 1; i++) {
    const current = colorScale[i];
    const next = colorScale[i + 1];

    if (value >= current.value && value <= next.value) {
      const t = (value - current.value) / (next.value - current.value);
      return lerpColor(parseRgba(current.color), parseRgba(next.color), t);
    }
  }

  return colorScale[colorScale.length - 1].color;
}

// =============================================================================
// OVERLAY CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate yield overlay for all tiles affected by crypto buildings
 */
export function calculateYieldOverlay(
  buildings: PlacedCryptoBuilding[],
  gridSize: number
): TileOverlay[] {
  const config = CRYPTO_OVERLAY_CONFIGS.yield;
  const yieldMap = new Map<string, number>();

  // Calculate yield contribution from each building
  for (const building of buildings) {
    const def = getCryptoBuilding(building.buildingId);
    if (!def?.crypto?.effects) continue;

    const effects = def.crypto.effects;
    const yieldRate = effects.yieldRate || 0;
    const radius = effects.zoneRadius || 3;

    // Add yield to tiles within radius
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = building.gridX + dx;
        const y = building.gridY + dy;

        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;

        // Chebyshev distance
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        if (distance > radius) continue;

        // Yield decreases with distance
        const falloff = 1 - distance / (radius + 1);
        const tileYield = yieldRate * falloff;

        const key = `${x},${y}`;
        yieldMap.set(key, (yieldMap.get(key) || 0) + tileYield);
      }
    }
  }

  // Convert map to tile overlay array
  const tiles: TileOverlay[] = [];
  for (const [key, rawValue] of yieldMap) {
    const [x, y] = key.split(",").map(Number);
    const normalizedValue = Math.min(rawValue / config.maxValue, 1);
    tiles.push({
      x,
      y,
      value: normalizedValue,
      rawValue,
      color: getColorFromScale(normalizedValue, config.colorScale),
    });
  }

  return tiles;
}

/**
 * Calculate risk overlay for all tiles affected by crypto buildings
 */
export function calculateRiskOverlay(
  buildings: PlacedCryptoBuilding[],
  gridSize: number
): TileOverlay[] {
  const config = CRYPTO_OVERLAY_CONFIGS.risk;
  const riskMap = new Map<string, { risk: number; protection: number }>();

  // First pass: calculate base risk from risky buildings
  for (const building of buildings) {
    const def = getCryptoBuilding(building.buildingId);
    if (!def?.crypto?.effects) continue;

    const effects = def.crypto.effects;
    const rugRisk = effects.rugRisk || 0;
    const radius = effects.zoneRadius || 3;

    if (rugRisk > 0) {
      // Add risk to tiles within radius
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const x = building.gridX + dx;
          const y = building.gridY + dy;

          if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;

          const distance = Math.max(Math.abs(dx), Math.abs(dy));
          if (distance > radius) continue;

          // Risk is highest at building location, decreases outward
          const falloff = 1 - distance / (radius + 1);
          const tileRisk = rugRisk * falloff;

          const key = `${x},${y}`;
          const existing = riskMap.get(key) || { risk: 0, protection: 0 };
          // Take max risk (worst case)
          existing.risk = Math.max(existing.risk, tileRisk);
          riskMap.set(key, existing);
        }
      }
    }
  }

  // Second pass: apply protection from auditor/insurance buildings
  for (const building of buildings) {
    const def = getCryptoBuilding(building.buildingId);
    if (!def?.crypto?.effects) continue;

    const effects = def.crypto.effects;
    const protectionRadius = effects.protectionRadius || 0;
    const protectionBonus = effects.protectionBonus || 0;
    const insuranceRadius = effects.insuranceRadius || 0;
    const insuranceRecovery = effects.insuranceRecovery || 0;

    // Apply auditor protection
    if (protectionRadius > 0 && protectionBonus > 0) {
      for (let dx = -protectionRadius; dx <= protectionRadius; dx++) {
        for (let dy = -protectionRadius; dy <= protectionRadius; dy++) {
          const x = building.gridX + dx;
          const y = building.gridY + dy;

          if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;

          const distance = Math.max(Math.abs(dx), Math.abs(dy));
          if (distance > protectionRadius) continue;

          const key = `${x},${y}`;
          const existing = riskMap.get(key);
          if (existing) {
            // Protection reduces risk
            existing.protection = Math.min(1, existing.protection + protectionBonus);
          }
        }
      }
    }

    // Apply insurance coverage (different type of protection)
    if (insuranceRadius > 0 && insuranceRecovery > 0) {
      for (let dx = -insuranceRadius; dx <= insuranceRadius; dx++) {
        for (let dy = -insuranceRadius; dy <= insuranceRadius; dy++) {
          const x = building.gridX + dx;
          const y = building.gridY + dy;

          if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;

          const distance = Math.max(Math.abs(dx), Math.abs(dy));
          if (distance > insuranceRadius) continue;

          const key = `${x},${y}`;
          const existing = riskMap.get(key);
          if (existing) {
            // Insurance provides additional protection
            existing.protection = Math.min(1, existing.protection + insuranceRecovery * 0.5);
          }
        }
      }
    }
  }

  // Convert map to tile overlay array with effective risk
  const tiles: TileOverlay[] = [];
  for (const [key, { risk, protection }] of riskMap) {
    const [x, y] = key.split(",").map(Number);
    // Effective risk = base risk * (1 - protection)
    const effectiveRisk = risk * (1 - protection);
    const normalizedValue = Math.min(effectiveRisk / config.maxValue, 1);

    if (normalizedValue > 0) {
      tiles.push({
        x,
        y,
        value: normalizedValue,
        rawValue: effectiveRisk,
        color: getColorFromScale(normalizedValue, config.colorScale),
      });
    }
  }

  return tiles;
}

/**
 * Calculate protection overlay showing auditor and insurance coverage
 */
export function calculateProtectionOverlay(
  buildings: PlacedCryptoBuilding[],
  gridSize: number
): TileOverlay[] {
  const config = CRYPTO_OVERLAY_CONFIGS.protection;
  const protectionMap = new Map<string, number>();

  for (const building of buildings) {
    const def = getCryptoBuilding(building.buildingId);
    if (!def?.crypto?.effects) continue;

    const effects = def.crypto.effects;

    // Auditor protection
    const protectionRadius = effects.protectionRadius || 0;
    const protectionBonus = effects.protectionBonus || 0;

    if (protectionRadius > 0 && protectionBonus > 0) {
      for (let dx = -protectionRadius; dx <= protectionRadius; dx++) {
        for (let dy = -protectionRadius; dy <= protectionRadius; dy++) {
          const x = building.gridX + dx;
          const y = building.gridY + dy;

          if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;

          const distance = Math.max(Math.abs(dx), Math.abs(dy));
          if (distance > protectionRadius) continue;

          const falloff = 1 - distance / (protectionRadius + 1);
          const tileProtection = protectionBonus * falloff;

          const key = `${x},${y}`;
          protectionMap.set(
            key,
            Math.min(1, (protectionMap.get(key) || 0) + tileProtection)
          );
        }
      }
    }

    // Insurance coverage
    const insuranceRadius = effects.insuranceRadius || 0;
    const insuranceRecovery = effects.insuranceRecovery || 0;

    if (insuranceRadius > 0 && insuranceRecovery > 0) {
      for (let dx = -insuranceRadius; dx <= insuranceRadius; dx++) {
        for (let dy = -insuranceRadius; dy <= insuranceRadius; dy++) {
          const x = building.gridX + dx;
          const y = building.gridY + dy;

          if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;

          const distance = Math.max(Math.abs(dx), Math.abs(dy));
          if (distance > insuranceRadius) continue;

          const falloff = 1 - distance / (insuranceRadius + 1);
          const tileProtection = insuranceRecovery * falloff;

          const key = `${x},${y}`;
          protectionMap.set(
            key,
            Math.min(1, (protectionMap.get(key) || 0) + tileProtection)
          );
        }
      }
    }
  }

  // Convert map to tile overlay array
  const tiles: TileOverlay[] = [];
  for (const [key, rawValue] of protectionMap) {
    const [x, y] = key.split(",").map(Number);
    tiles.push({
      x,
      y,
      value: rawValue,
      rawValue,
      color: getColorFromScale(rawValue, config.colorScale),
    });
  }

  return tiles;
}

/**
 * Calculate density overlay showing crypto building concentration
 */
export function calculateDensityOverlay(
  buildings: PlacedCryptoBuilding[],
  gridSize: number
): TileOverlay[] {
  const config = CRYPTO_OVERLAY_CONFIGS.crypto_density;
  const densityMap = new Map<string, number>();
  const DENSITY_RADIUS = 5; // Check density within 5-tile radius

  // For each tile in the grid, count nearby crypto buildings
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      let count = 0;

      for (const building of buildings) {
        const dx = Math.abs(building.gridX - x);
        const dy = Math.abs(building.gridY - y);
        const distance = Math.max(dx, dy);

        if (distance <= DENSITY_RADIUS) {
          // Weight by inverse distance
          count += 1 - distance / (DENSITY_RADIUS + 1);
        }
      }

      if (count > 0) {
        densityMap.set(`${x},${y}`, count);
      }
    }
  }

  // Convert map to tile overlay array
  const tiles: TileOverlay[] = [];
  for (const [key, rawValue] of densityMap) {
    const [x, y] = key.split(",").map(Number);
    const normalizedValue = Math.min(rawValue / config.maxValue, 1);
    tiles.push({
      x,
      y,
      value: normalizedValue,
      rawValue,
      color: getColorFromScale(normalizedValue, config.colorScale),
    });
  }

  return tiles;
}

/**
 * Main function to calculate overlay based on type
 */
export function calculateOverlay(
  type: CryptoOverlayType,
  buildings: PlacedCryptoBuilding[],
  gridSize: number
): TileOverlay[] {
  switch (type) {
    case "yield":
      return calculateYieldOverlay(buildings, gridSize);
    case "risk":
      return calculateRiskOverlay(buildings, gridSize);
    case "protection":
      return calculateProtectionOverlay(buildings, gridSize);
    case "crypto_density":
      return calculateDensityOverlay(buildings, gridSize);
    case "none":
    default:
      return [];
  }
}

// =============================================================================
// OVERLAY CACHE MANAGEMENT
// =============================================================================

let overlayCache: OverlayCache | null = null;
let lastBuildingCount = 0;

/**
 * Get cached overlay or recalculate if needed
 */
export function getCachedOverlay(
  type: CryptoOverlayType,
  buildings: PlacedCryptoBuilding[],
  gridSize: number,
  gridVersion: number
): TileOverlay[] {
  // Check if cache is valid
  const isCacheValid =
    overlayCache &&
    overlayCache.type === type &&
    overlayCache.gridVersion === gridVersion &&
    buildings.length === lastBuildingCount &&
    Date.now() - overlayCache.timestamp < 1000; // 1 second cache

  if (isCacheValid && overlayCache) {
    return overlayCache.tiles;
  }

  // Recalculate
  const tiles = calculateOverlay(type, buildings, gridSize);

  // Update cache
  overlayCache = {
    type,
    gridVersion,
    tiles,
    timestamp: Date.now(),
  };
  lastBuildingCount = buildings.length;

  return tiles;
}

/**
 * Invalidate the overlay cache
 */
export function invalidateOverlayCache(): void {
  overlayCache = null;
  lastBuildingCount = 0;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all available crypto overlay options for UI
 */
export function getCryptoOverlayOptions(): CryptoOverlayConfig[] {
  return [
    CRYPTO_OVERLAY_CONFIGS.none,
    CRYPTO_OVERLAY_CONFIGS.yield,
    CRYPTO_OVERLAY_CONFIGS.risk,
    CRYPTO_OVERLAY_CONFIGS.protection,
    CRYPTO_OVERLAY_CONFIGS.crypto_density,
  ];
}

/**
 * Get legend data for an overlay type
 */
export function getOverlayLegend(type: CryptoOverlayType): {
  title: string;
  description: string;
  colorScale: ColorScalePoint[];
  minLabel: string;
  maxLabel: string;
} {
  const config = CRYPTO_OVERLAY_CONFIGS[type];

  let minLabel = "Low";
  let maxLabel = "High";

  switch (type) {
    case "yield":
      minLabel = "$0/day";
      maxLabel = `$${config.maxValue}/day`;
      break;
    case "risk":
      minLabel = "0%";
      maxLabel = `${config.maxValue * 100}%`;
      break;
    case "protection":
      minLabel = "None";
      maxLabel = "Full";
      break;
    case "crypto_density":
      minLabel = "Sparse";
      maxLabel = "Dense";
      break;
  }

  return {
    title: config.label,
    description: config.description,
    colorScale: config.colorScale,
    minLabel,
    maxLabel,
  };
}
