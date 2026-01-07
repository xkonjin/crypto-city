// =============================================================================
// BUILDING REGISTRY - Combined Access to All Buildings
// =============================================================================
// This file breaks the circular dependency between buildings.ts and cryptoBuildings.ts
// by importing from both and combining them here.

import { BUILDINGS, BuildingDefinition, BuildingCategory, getBuildingFootprint } from './buildings';
import { ALL_CRYPTO_BUILDINGS } from './cryptoBuildings';

// Re-export types from buildings.ts for convenience
export type { BuildingDefinition, BuildingCategory };
export { getBuildingFootprint };

// Combined registry of all buildings (standard + crypto)
// Crypto buildings are added to make them available in the game
export const ALL_BUILDINGS: Record<string, BuildingDefinition> = {
  ...BUILDINGS,
  // Cast crypto buildings to standard building definitions for compatibility
  // (they have extra crypto metadata that isn't needed for basic operations)
  ...Object.fromEntries(
    Object.entries(ALL_CRYPTO_BUILDINGS).map(([id, building]) => [
      id,
      {
        id: building.id,
        name: building.name,
        category: building.category,
        footprint: building.footprint,
        sprites: building.sprites,
        icon: building.icon,
        isProcedural: building.isProcedural,
        isDecoration: building.isDecoration,
        supportsRotation: building.supportsRotation,
      } as BuildingDefinition,
    ])
  ),
};

// Helper to get building by ID
// ALL_BUILDINGS already includes BUILDINGS, so just check ALL_BUILDINGS
export function getBuilding(id: string): BuildingDefinition | undefined {
  return ALL_BUILDINGS[id];
}

// Helper to get all buildings in a category (including crypto buildings)
export function getBuildingsByCategory(
  category: BuildingCategory
): BuildingDefinition[] {
  return Object.values(ALL_BUILDINGS).filter((b) => b.category === category);
}

// Category order for display
const CATEGORY_ORDER: BuildingCategory[] = [
  "procedural",
  "residential",
  "commercial",
  "props",
  "christmas",
  "civic",
  "landmark",
  "defi",
  "exchange",
  "chain",
  "ct",
  "meme",
  "plasma",
];

export function getOrderedCategories(): BuildingCategory[] {
  return CATEGORY_ORDER.filter((cat) =>
    Object.values(ALL_BUILDINGS).some((b) => b.category === cat)
  );
}

// Export everything that was previously exported from buildings.ts ALL_BUILDINGS section
export { BUILDINGS };

