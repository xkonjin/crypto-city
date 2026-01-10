/**
 * Crypto Building Registry
 * 
 * Integrates crypto buildings with IsoCity's building system.
 * Provides unified access to both standard and crypto buildings.
 */

import { BuildingType, Building, BUILDING_STATS } from '../types/buildings';
import { 
  ALL_CRYPTO_BUILDINGS, 
  getCryptoBuilding,
  getCryptoBuildingsByCategory,
} from './buildings';
import {
  CryptoBuildingDefinition,
  CryptoCategory,
} from './types';

// =============================================================================
// EXTENDED BUILDING TYPE
// =============================================================================

// All crypto building IDs as a type (derived from building registry for type safety)
// Note: This is derived from the ALL_CRYPTO_BUILDINGS object keys rather than
// the manually typed union in types.ts to ensure they stay in sync.
export type CryptoBuildingType = keyof typeof ALL_CRYPTO_BUILDINGS;

// Combined building type (standard IsoCity buildings + crypto buildings)
export type ExtendedBuildingType = BuildingType | CryptoBuildingType;

// =============================================================================
// BUILDING CATEGORIES
// =============================================================================

export const BUILDING_CATEGORIES = {
  terrain: ['empty', 'grass', 'water', 'tree'],
  infrastructure: ['road', 'bridge', 'rail'],
  residential: ['house_small', 'house_medium', 'mansion', 'apartment_low', 'apartment_high'],
  commercial: ['shop_small', 'shop_medium', 'office_low', 'office_high', 'mall'],
  industrial: ['factory_small', 'factory_medium', 'factory_large', 'warehouse'],
  services: ['police_station', 'fire_station', 'hospital', 'school', 'university'],
  parks: ['park', 'park_large', 'tennis', 'basketball_courts', 'playground_small', 
          'playground_large', 'baseball_field_small', 'soccer_field_small', 
          'football_field', 'swimming_pool', 'skate_park', 'community_garden', 
          'pond_park', 'park_gate'],
  utilities: ['power_plant', 'water_tower'],
  transportation: ['subway_station', 'rail_station', 'airport'],
  special: ['stadium', 'museum', 'space_program', 'city_hall', 'amusement_park'],
  // Crypto categories
  defi: Object.keys(ALL_CRYPTO_BUILDINGS).filter(id => ALL_CRYPTO_BUILDINGS[id].category === 'defi'),
  exchange: Object.keys(ALL_CRYPTO_BUILDINGS).filter(id => ALL_CRYPTO_BUILDINGS[id].category === 'exchange'),
  chain: Object.keys(ALL_CRYPTO_BUILDINGS).filter(id => ALL_CRYPTO_BUILDINGS[id].category === 'chain'),
  ct: Object.keys(ALL_CRYPTO_BUILDINGS).filter(id => ALL_CRYPTO_BUILDINGS[id].category === 'ct'),
  meme: Object.keys(ALL_CRYPTO_BUILDINGS).filter(id => ALL_CRYPTO_BUILDINGS[id].category === 'meme'),
  plasma: Object.keys(ALL_CRYPTO_BUILDINGS).filter(id => ALL_CRYPTO_BUILDINGS[id].category === 'plasma'),
  stablecoin: Object.keys(ALL_CRYPTO_BUILDINGS).filter(id => ALL_CRYPTO_BUILDINGS[id].category === 'stablecoin'),
  crypto_infrastructure: Object.keys(ALL_CRYPTO_BUILDINGS).filter(id => ALL_CRYPTO_BUILDINGS[id].category === 'infrastructure'),
  legends: Object.keys(ALL_CRYPTO_BUILDINGS).filter(id => ALL_CRYPTO_BUILDINGS[id].category === 'legends'),
} as const;

// Crypto category list for UI
export const CRYPTO_CATEGORIES: CryptoCategory[] = [
  'defi', 'exchange', 'chain', 'ct', 'meme', 'plasma', 'stablecoin', 'infrastructure', 'legends'
];

// =============================================================================
// BUILDING STATS EXTENSION
// =============================================================================

/**
 * Generate building stats for crypto buildings
 */
function generateCryptoBuildingStats(def: CryptoBuildingDefinition): {
  maxPop: number;
  maxJobs: number;
  pollution: number;
  landValue: number;
} {
  const effects = def.crypto?.effects || {};
  const tier = def.crypto?.tier || 'retail';
  
  // Base values by tier
  const tierBases = {
    retail: { pop: 10, jobs: 5, value: 10 },
    degen: { pop: 20, jobs: 15, value: 25 },
    whale: { pop: 50, jobs: 40, value: 50 },
    institution: { pop: 100, jobs: 80, value: 100 },
  };
  
  const base = tierBases[tier];
  
  return {
    maxPop: effects.populationBoost || base.pop,
    maxJobs: Math.floor((effects.yieldRate || 5) * 2),
    pollution: effects.volatility ? Math.floor(effects.volatility * 10) : 0,
    landValue: base.value + (effects.happinessEffect || 0),
  };
}

// Extended building stats including crypto buildings
export const EXTENDED_BUILDING_STATS: Record<ExtendedBuildingType, {
  maxPop: number;
  maxJobs: number;
  pollution: number;
  landValue: number;
}> = {
  ...BUILDING_STATS,
  ...Object.fromEntries(
    Object.entries(ALL_CRYPTO_BUILDINGS).map(([id, def]) => [
      id,
      generateCryptoBuildingStats(def),
    ])
  ),
} as Record<ExtendedBuildingType, { maxPop: number; maxJobs: number; pollution: number; landValue: number }>;

// =============================================================================
// UNIFIED BUILDING ACCESS
// =============================================================================

export interface UnifiedBuildingDefinition {
  id: string;
  name: string;
  category: string;
  icon: string;
  footprint: { width: number; height: number };
  cost: number;
  isCrypto: boolean;
  cryptoData?: CryptoBuildingDefinition['crypto'];
  stats: {
    maxPop: number;
    maxJobs: number;
    pollution: number;
    landValue: number;
  };
}

/**
 * Get unified building definition by ID
 */
export function getUnifiedBuilding(id: string): UnifiedBuildingDefinition | undefined {
  // Check crypto buildings first
  const cryptoDef = getCryptoBuilding(id);
  if (cryptoDef) {
    return {
      id: cryptoDef.id,
      name: cryptoDef.name,
      category: cryptoDef.category,
      icon: cryptoDef.icon,
      footprint: cryptoDef.footprint,
      cost: cryptoDef.cost,
      isCrypto: true,
      cryptoData: cryptoDef.crypto,
      stats: generateCryptoBuildingStats(cryptoDef),
    };
  }
  
  // Check standard buildings
  const buildingType = id as BuildingType;
  const stats = BUILDING_STATS[buildingType];
  if (stats) {
    return {
      id: buildingType,
      name: formatBuildingName(buildingType),
      category: getBuildingCategory(buildingType),
      icon: getBuildingIcon(buildingType),
      footprint: getBuildingFootprint(buildingType),
      cost: getBuildingCost(buildingType),
      isCrypto: false,
      stats,
    };
  }
  
  return undefined;
}

/**
 * Get all buildings in a category
 */
export function getBuildingsInCategory(category: string): UnifiedBuildingDefinition[] {
  // Check if it's a crypto category
  if (CRYPTO_CATEGORIES.includes(category as CryptoCategory)) {
    return getCryptoBuildingsByCategory(category as CryptoCategory).map(def => ({
      id: def.id,
      name: def.name,
      category: def.category,
      icon: def.icon,
      footprint: def.footprint,
      cost: def.cost,
      isCrypto: true,
      cryptoData: def.crypto,
      stats: generateCryptoBuildingStats(def),
    }));
  }
  
  // Standard category
  const buildingIds = BUILDING_CATEGORIES[category as keyof typeof BUILDING_CATEGORIES] || [];
  return buildingIds
    .map(id => getUnifiedBuilding(id as string))
    .filter((b): b is UnifiedBuildingDefinition => b !== undefined);
}

/**
 * Check if a building ID is a crypto building
 */
export function isCryptoBuilding(id: string): boolean {
  return id in ALL_CRYPTO_BUILDINGS;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatBuildingName(type: BuildingType): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getBuildingCategory(type: BuildingType): string {
  for (const [category, buildings] of Object.entries(BUILDING_CATEGORIES)) {
    if ((buildings as readonly string[]).includes(type)) {
      return category;
    }
  }
  return 'special';
}

function getBuildingIcon(type: BuildingType): string {
  const icons: Partial<Record<BuildingType, string>> = {
    house_small: '🏠',
    house_medium: '🏡',
    mansion: '🏰',
    apartment_low: '🏢',
    apartment_high: '🏙️',
    shop_small: '🏪',
    shop_medium: '🛒',
    office_low: '🏬',
    office_high: '🏛️',
    mall: '🛍️',
    factory_small: '🏭',
    factory_medium: '⚙️',
    factory_large: '🔧',
    warehouse: '📦',
    police_station: '🚔',
    fire_station: '🚒',
    hospital: '🏥',
    school: '🏫',
    university: '🎓',
    park: '🌳',
    park_large: '🌲',
    power_plant: '⚡',
    water_tower: '💧',
    stadium: '🏟️',
    museum: '🏛️',
    airport: '✈️',
    road: '🛤️',
    tree: '🌴',
    water: '💧',
  };
  return icons[type] || '🏗️';
}

function getBuildingFootprint(type: BuildingType): { width: number; height: number } {
  const largeBuildings: BuildingType[] = [
    'apartment_high', 'office_high', 'mall', 'factory_large', 
    'hospital', 'university', 'stadium', 'airport', 'amusement_park',
    'park_large', 'space_program'
  ];
  const mediumBuildings: BuildingType[] = [
    'apartment_low', 'office_low', 'factory_medium', 'shop_medium',
    'police_station', 'fire_station', 'school', 'park'
  ];
  
  if (largeBuildings.includes(type)) {
    return { width: 3, height: 3 };
  } else if (mediumBuildings.includes(type)) {
    return { width: 2, height: 2 };
  }
  return { width: 1, height: 1 };
}

function getBuildingCost(type: BuildingType): number {
  const costs: Partial<Record<BuildingType, number>> = {
    house_small: 1000,
    house_medium: 2500,
    mansion: 8000,
    apartment_low: 5000,
    apartment_high: 12000,
    shop_small: 1500,
    shop_medium: 3500,
    office_low: 6000,
    office_high: 15000,
    mall: 25000,
    factory_small: 3000,
    factory_medium: 7000,
    factory_large: 15000,
    warehouse: 4000,
    police_station: 5000,
    fire_station: 5000,
    hospital: 20000,
    school: 8000,
    university: 25000,
    park: 2000,
    park_large: 5000,
    power_plant: 20000,
    water_tower: 8000,
    stadium: 50000,
    museum: 15000,
    airport: 100000,
    road: 50,
    tree: 100,
  };
  return costs[type] || 1000;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  getCryptoBuilding,
  getCryptoBuildingsByCategory,
  ALL_CRYPTO_BUILDINGS,
};

