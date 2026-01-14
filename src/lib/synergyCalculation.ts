/**
 * Synergy Calculation System (GitHub Issue #209)
 *
 * Calculates synergy effects between crypto buildings for placement preview.
 * Shows predicted yield bonuses from chain and category synergies.
 */

import {
  PlacedCryptoBuilding,
  CryptoCategory,
  CryptoChain,
} from "@/games/isocity/crypto/types";
import { getCryptoBuilding } from "@/games/isocity/crypto";

// =============================================================================
// SYNERGY CONSTANTS
// =============================================================================

/** Chain synergy yield bonus (5% per synergy match) */
export const CHAIN_SYNERGY_BONUS = 0.05;

/** Category synergy yield bonus (3% per synergy match) */
export const CATEGORY_SYNERGY_BONUS = 0.03;

/** Maximum total synergy bonus (50%) */
export const MAX_SYNERGY_BONUS = 0.50;

/** Synergy glow colors */
export const SYNERGY_GLOW_COLORS = {
  chain: "rgba(34, 197, 94, 0.6)", // Green for chain synergy
  category: "rgba(59, 130, 246, 0.6)", // Blue for category synergy
  combined: "rgba(168, 85, 247, 0.6)", // Purple for both
};

// =============================================================================
// TYPES
// =============================================================================

/** Synergy type */
export type SynergyType = "chain" | "category";

/** Building that would synergize with selected building */
export interface SynergyBuilding {
  /** Building instance */
  building: PlacedCryptoBuilding;
  /** Building definition ID */
  buildingId: string;
  /** Building name */
  name: string;
  /** Grid position */
  gridX: number;
  gridY: number;
  /** Distance from placement position */
  distance: number;
  /** Synergy type (chain or category) */
  synergyType: SynergyType;
  /** What's synergizing (chain name or category name) */
  synergyWith: string;
  /** Bonus contribution (0-1, distance-scaled) */
  bonusContribution: number;
  /** Glow color to use */
  glowColor: string;
}

/** Complete synergy calculation result */
export interface SynergyResult {
  /** Buildings that would provide synergy */
  synergyBuildings: SynergyBuilding[];
  /** Total chain synergy bonus (0-1) */
  chainSynergyBonus: number;
  /** Total category synergy bonus (0-1) */
  categorySynergyBonus: number;
  /** Total combined bonus (0-1, capped at MAX_SYNERGY_BONUS) */
  totalBonus: number;
  /** Total bonus as percentage (0-50) */
  totalBonusPercent: number;
  /** Count of chain synergies */
  chainSynergyCount: number;
  /** Count of category synergies */
  categorySynergyCount: number;
}

// =============================================================================
// SYNERGY CALCULATION
// =============================================================================

/**
 * Calculate Chebyshev distance between two grid positions
 */
function chebyshevDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
}

/**
 * Find all buildings that would synergize with a selected building at a position
 *
 * @param selectedBuildingId - ID of the building being placed
 * @param placedBuildings - Array of existing placed buildings
 * @param positionX - Grid X position where building would be placed
 * @param positionY - Grid Y position where building would be placed
 * @returns Array of synergy buildings
 */
export function findSynergyBuildings(
  selectedBuildingId: string,
  placedBuildings: PlacedCryptoBuilding[],
  positionX: number,
  positionY: number
): SynergyBuilding[] {
  const selectedDef = getCryptoBuilding(selectedBuildingId);
  if (!selectedDef?.crypto?.effects) return [];

  const effects = selectedDef.crypto.effects;
  const radius = effects.zoneRadius || 5;
  const chainSynergies = effects.chainSynergy || [];
  const categorySynergies = effects.categorySynergy || [];

  const results: SynergyBuilding[] = [];

  for (const building of placedBuildings) {
    const distance = chebyshevDistance(
      positionX,
      positionY,
      building.gridX,
      building.gridY
    );

    // Skip if out of range
    if (distance > radius) continue;

    const otherDef = getCryptoBuilding(building.buildingId);
    if (!otherDef?.crypto) continue;

    const otherChain = otherDef.crypto.chain;
    const otherCategory = otherDef.category;

    // Calculate distance-based bonus falloff
    const strength = 1 - distance / (radius + 1);

    // Check chain synergy
    if (otherChain && chainSynergies.includes(otherChain)) {
      results.push({
        building,
        buildingId: building.buildingId,
        name: otherDef.name,
        gridX: building.gridX,
        gridY: building.gridY,
        distance,
        synergyType: "chain",
        synergyWith: otherChain,
        bonusContribution: CHAIN_SYNERGY_BONUS * strength,
        glowColor: SYNERGY_GLOW_COLORS.chain,
      });
    }
    // Check category synergy (only if not already a chain synergy)
    else if (categorySynergies.includes(otherCategory)) {
      results.push({
        building,
        buildingId: building.buildingId,
        name: otherDef.name,
        gridX: building.gridX,
        gridY: building.gridY,
        distance,
        synergyType: "category",
        synergyWith: otherCategory,
        bonusContribution: CATEGORY_SYNERGY_BONUS * strength,
        glowColor: SYNERGY_GLOW_COLORS.category,
      });
    }
  }

  return results;
}

/**
 * Calculate total synergy bonus for a building at a position
 *
 * @param selectedBuildingId - ID of the building being placed
 * @param placedBuildings - Array of existing placed buildings
 * @param positionX - Grid X position where building would be placed
 * @param positionY - Grid Y position where building would be placed
 * @returns Complete synergy calculation result
 */
export function calculateSynergyBonus(
  selectedBuildingId: string,
  placedBuildings: PlacedCryptoBuilding[],
  positionX: number,
  positionY: number
): SynergyResult {
  const synergyBuildings = findSynergyBuildings(
    selectedBuildingId,
    placedBuildings,
    positionX,
    positionY
  );

  let chainSynergyBonus = 0;
  let categorySynergyBonus = 0;
  let chainSynergyCount = 0;
  let categorySynergyCount = 0;

  for (const synergy of synergyBuildings) {
    if (synergy.synergyType === "chain") {
      chainSynergyBonus += synergy.bonusContribution;
      chainSynergyCount++;
    } else {
      categorySynergyBonus += synergy.bonusContribution;
      categorySynergyCount++;
    }
  }

  const totalBonus = Math.min(
    chainSynergyBonus + categorySynergyBonus,
    MAX_SYNERGY_BONUS
  );

  return {
    synergyBuildings,
    chainSynergyBonus,
    categorySynergyBonus,
    totalBonus,
    totalBonusPercent: Math.round(totalBonus * 100),
    chainSynergyCount,
    categorySynergyCount,
  };
}

/**
 * Get buildings grouped by synergy type for rendering
 *
 * @param synergyBuildings - Array of synergy buildings
 * @returns Object with chain and category synergy arrays
 */
export function groupSynergyBuildingsByType(synergyBuildings: SynergyBuilding[]): {
  chainSynergies: SynergyBuilding[];
  categorySynergies: SynergyBuilding[];
} {
  return {
    chainSynergies: synergyBuildings.filter((s) => s.synergyType === "chain"),
    categorySynergies: synergyBuildings.filter((s) => s.synergyType === "category"),
  };
}

// =============================================================================
// PREVIEW DISPLAY HELPERS
// =============================================================================

/**
 * Format synergy bonus for display
 *
 * @param bonus - Bonus value (0-1)
 * @returns Formatted string like "+15%"
 */
export function formatSynergyBonus(bonus: number): string {
  const percent = Math.round(bonus * 100);
  return percent > 0 ? `+${percent}%` : "";
}

/**
 * Get display text for synergy breakdown
 *
 * @param result - Synergy calculation result
 * @returns Array of display strings
 */
export function getSynergyBreakdownText(result: SynergyResult): string[] {
  const lines: string[] = [];

  if (result.chainSynergyCount > 0) {
    lines.push(
      `Chain: ${formatSynergyBonus(result.chainSynergyBonus)} (${result.chainSynergyCount} buildings)`
    );
  }

  if (result.categorySynergyCount > 0) {
    lines.push(
      `Category: ${formatSynergyBonus(result.categorySynergyBonus)} (${result.categorySynergyCount} buildings)`
    );
  }

  if (result.totalBonus > 0) {
    lines.push(`Total: ${formatSynergyBonus(result.totalBonus)} yield`);
  }

  return lines;
}

/**
 * Check if a building position would have any synergy
 *
 * @param selectedBuildingId - ID of the building being placed
 * @param placedBuildings - Array of existing placed buildings
 * @param positionX - Grid X position
 * @param positionY - Grid Y position
 * @returns True if there would be any synergy
 */
export function hasSynergyAtPosition(
  selectedBuildingId: string,
  placedBuildings: PlacedCryptoBuilding[],
  positionX: number,
  positionY: number
): boolean {
  const synergies = findSynergyBuildings(
    selectedBuildingId,
    placedBuildings,
    positionX,
    positionY
  );
  return synergies.length > 0;
}

// =============================================================================
// REVERSE SYNERGY LOOKUP
// =============================================================================

/**
 * Find what synergies would be gained by existing buildings if a new building is placed
 * (Useful for showing how the new building helps the city)
 *
 * @param selectedBuildingId - ID of the building being placed
 * @param placedBuildings - Array of existing placed buildings
 * @param positionX - Grid X position
 * @param positionY - Grid Y position
 * @returns Map of building IDs to their synergy gain
 */
export function findReverseSynergyGains(
  selectedBuildingId: string,
  placedBuildings: PlacedCryptoBuilding[],
  positionX: number,
  positionY: number
): Map<string, SynergyBuilding> {
  const selectedDef = getCryptoBuilding(selectedBuildingId);
  if (!selectedDef?.crypto) return new Map();

  const selectedChain = selectedDef.crypto.chain;
  const selectedCategory = selectedDef.category;

  const gains = new Map<string, SynergyBuilding>();

  for (const building of placedBuildings) {
    const otherDef = getCryptoBuilding(building.buildingId);
    if (!otherDef?.crypto?.effects) continue;

    const effects = otherDef.crypto.effects;
    const radius = effects.zoneRadius || 5;
    const chainSynergies = effects.chainSynergy || [];
    const categorySynergies = effects.categorySynergy || [];

    const distance = chebyshevDistance(
      positionX,
      positionY,
      building.gridX,
      building.gridY
    );

    // Skip if out of other building's range
    if (distance > radius) continue;

    const strength = 1 - distance / (radius + 1);

    // Check if existing building would get chain synergy from new building
    if (selectedChain && chainSynergies.includes(selectedChain)) {
      gains.set(building.id, {
        building,
        buildingId: building.buildingId,
        name: otherDef.name,
        gridX: building.gridX,
        gridY: building.gridY,
        distance,
        synergyType: "chain",
        synergyWith: selectedChain,
        bonusContribution: CHAIN_SYNERGY_BONUS * strength,
        glowColor: SYNERGY_GLOW_COLORS.chain,
      });
    }
    // Check category synergy
    else if (categorySynergies.includes(selectedCategory)) {
      gains.set(building.id, {
        building,
        buildingId: building.buildingId,
        name: otherDef.name,
        gridX: building.gridX,
        gridY: building.gridY,
        distance,
        synergyType: "category",
        synergyWith: selectedCategory,
        bonusContribution: CATEGORY_SYNERGY_BONUS * strength,
        glowColor: SYNERGY_GLOW_COLORS.category,
      });
    }
  }

  return gains;
}
