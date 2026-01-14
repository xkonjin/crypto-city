/**
 * Building Placer AI
 * 
 * "Time is an illusion. Lunchtime doubly so."
 * 
 * This module scores potential building placements and finds the best
 * locations for new buildings. It considers:
 * - Synergy with nearby buildings
 * - Road access (required for most buildings)
 * - Service coverage (power, water, police, etc.)
 * - Land value appropriateness
 * - Zone compatibility
 * - Demand from NPCs
 */

import { GameState, Tile, BuildingType, ZoneType, ServiceCoverage } from '@/games/isocity/types';
import { 
  getCryptoBuilding, 
} from '@/games/isocity/crypto/buildings';
import { CryptoCategory, CryptoChain, CryptoBuildingDefinition } from '@/games/isocity/crypto/types';
import {
  PlacementScore,
  PlacementConfig,
} from './types';

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default weights for placement scoring.
 * These can be adjusted to change AI behavior.
 */
export const DEFAULT_PLACEMENT_CONFIG: PlacementConfig = {
  synergyWeight: 10,
  roadAccessWeight: 25,
  serviceCoverageWeight: 15,
  landValueWeight: 8,
  demandWeight: 12,
  zoneCompatibilityWeight: 20,
};

// =============================================================================
// SYNERGY DEFINITIONS
// =============================================================================

/**
 * Building synergies - which buildings benefit from being near each other.
 * Positive values = bonus, negative = penalty.
 */
const BUILDING_SYNERGIES: Record<string, Record<string, number>> = {
  // Residential likes parks, schools, away from industry
  house_small: { park: 5, school: 4, hospital: 3, factory_small: -5, power_plant: -8 },
  house_medium: { park: 5, school: 4, hospital: 3, factory_medium: -6, power_plant: -8 },
  apartment_low: { park: 4, school: 3, shop_small: 3, factory_small: -4 },
  apartment_high: { park: 3, museum: 4, shop_medium: 4, office_low: 3 },
  
  // Commercial likes residential density, roads
  shop_small: { house_small: 3, apartment_low: 4, road: 2 },
  shop_medium: { apartment_low: 4, apartment_high: 5, office_low: 3 },
  office_low: { office_high: 3, shop_medium: 2, university: 4 },
  office_high: { office_low: 3, museum: 3, stadium: 4 },
  
  // Industrial likes other industry, away from residential
  factory_small: { factory_medium: 3, warehouse: 4, rail_station: 5, house_small: -5 },
  factory_medium: { factory_small: 3, warehouse: 5, power_plant: 3 },
  warehouse: { factory_medium: 4, rail_station: 6, road: 3 },
  
  // Services like being spread out
  police_station: { police_station: -10 },
  fire_station: { fire_station: -10 },
  hospital: { hospital: -8, school: 3 },
  school: { school: -6, university: 3, park: 4 },
  
  // Crypto buildings synergies (generic, more specific in crypto module)
  crypto_building: { road: 3, power_plant: 2 },
};

// =============================================================================
// MAIN SCORING FUNCTION
// =============================================================================

/**
 * Score a potential building placement.
 * Returns a detailed score breakdown.
 * 
 * @param gameState - Current game state
 * @param position - Grid position to evaluate
 * @param buildingType - Type of building to place
 * @param config - Optional scoring configuration
 * @returns Detailed placement score
 */
export function scorePlacement(
  gameState: GameState,
  position: { x: number; y: number },
  buildingType: BuildingType,
  config: PlacementConfig = DEFAULT_PLACEMENT_CONFIG
): PlacementScore {
  const { grid, gridSize, services, stats } = gameState;
  const { x, y } = position;
  
  // First check if placement is valid at all
  const validityCheck = checkPlacementValidity(grid, gridSize, x, y, buildingType);
  if (!validityCheck.isValid) {
    return {
      position,
      totalScore: -1000,
      factors: {
        synergy: 0,
        roadAccess: 0,
        serviceCoverage: 0,
        landValue: 0,
        demand: 0,
        zoneCompatibility: 0,
      },
      isValid: false,
      invalidReason: validityCheck.reason,
    };
  }
  
  // Calculate individual factors
  const synergyScore = calculateSynergyScore(grid, gridSize, x, y, buildingType);
  const roadAccessScore = calculateRoadAccessScore(grid, gridSize, x, y);
  const serviceCoverageScore = calculateServiceCoverageScore(services, x, y);
  const landValueScore = calculateLandValueScore(grid, x, y, buildingType);
  const demandScore = calculateDemandScore(stats, buildingType);
  const zoneCompatibilityScore = calculateZoneCompatibilityScore(grid, x, y, buildingType);
  
  // Weighted total
  const totalScore = 
    synergyScore * config.synergyWeight +
    roadAccessScore * config.roadAccessWeight +
    serviceCoverageScore * config.serviceCoverageWeight +
    landValueScore * config.landValueWeight +
    demandScore * config.demandWeight +
    zoneCompatibilityScore * config.zoneCompatibilityWeight;
  
  return {
    position,
    totalScore,
    factors: {
      synergy: synergyScore,
      roadAccess: roadAccessScore,
      serviceCoverage: serviceCoverageScore,
      landValue: landValueScore,
      demand: demandScore,
      zoneCompatibility: zoneCompatibilityScore,
    },
    isValid: true,
  };
}

/**
 * Score a crypto building placement with chain and category synergies.
 * 
 * @param gameState - Current game state
 * @param position - Grid position to evaluate
 * @param cryptoBuildingId - ID of the crypto building to place
 * @param config - Optional scoring configuration
 * @returns Detailed placement score
 */
export function scoreCryptoPlacement(
  gameState: GameState,
  position: { x: number; y: number },
  cryptoBuildingId: string,
  config: PlacementConfig = DEFAULT_PLACEMENT_CONFIG
): PlacementScore {
  const { grid, gridSize, services, stats } = gameState;
  const { x, y } = position;
  
  // Get crypto building definition
  const cryptoBuilding = getCryptoBuilding(cryptoBuildingId);
  if (!cryptoBuilding) {
    return {
      position,
      totalScore: -1000,
      factors: {
        synergy: 0,
        roadAccess: 0,
        serviceCoverage: 0,
        landValue: 0,
        demand: 0,
        zoneCompatibility: 0,
      },
      isValid: false,
      invalidReason: `Unknown crypto building: ${cryptoBuildingId}`,
    };
  }
  
  const { width, height } = cryptoBuilding.footprint;
  
  // Check validity for multi-tile building
  const validityCheck = checkMultiTilePlacementValidity(grid, gridSize, x, y, width, height);
  if (!validityCheck.isValid) {
    return {
      position,
      totalScore: -1000,
      factors: {
        synergy: 0,
        roadAccess: 0,
        serviceCoverage: 0,
        landValue: 0,
        demand: 0,
        zoneCompatibility: 0,
      },
      isValid: false,
      invalidReason: validityCheck.reason,
    };
  }
  
  // Calculate scores
  const synergyScore = calculateCryptoSynergyScore(grid, gridSize, x, y, cryptoBuilding);
  const roadAccessScore = calculateRoadAccessScore(grid, gridSize, x, y);
  const serviceCoverageScore = calculateServiceCoverageScore(services, x, y);
  const landValueScore = calculateCryptoLandValueScore(grid, x, y, width, height);
  const demandScore = 5; // Base demand for crypto buildings
  const zoneCompatibilityScore = 10; // Crypto buildings don't need zones
  
  const totalScore = 
    synergyScore * config.synergyWeight +
    roadAccessScore * config.roadAccessWeight +
    serviceCoverageScore * config.serviceCoverageWeight +
    landValueScore * config.landValueWeight +
    demandScore * config.demandWeight +
    zoneCompatibilityScore * config.zoneCompatibilityWeight;
  
  return {
    position,
    totalScore,
    factors: {
      synergy: synergyScore,
      roadAccess: roadAccessScore,
      serviceCoverage: serviceCoverageScore,
      landValue: landValueScore,
      demand: demandScore,
      zoneCompatibility: zoneCompatibilityScore,
    },
    isValid: true,
  };
}

// =============================================================================
// BEST LOCATION FINDER
// =============================================================================

/**
 * Find the best location for a building type.
 * Searches the entire grid and returns the highest-scoring valid position.
 * 
 * @param gameState - Current game state
 * @param buildingType - Type of building to place
 * @param config - Optional scoring configuration
 * @returns Best position or null if no valid placement
 */
export function findBestLocation(
  gameState: GameState,
  buildingType: BuildingType,
  config: PlacementConfig = DEFAULT_PLACEMENT_CONFIG
): { x: number; y: number } | null {
  const { gridSize } = gameState;
  
  let bestScore = -Infinity;
  let bestPosition: { x: number; y: number } | null = null;
  
  // Sample grid at intervals for efficiency
  const sampleRate = gridSize > 60 ? 2 : 1;
  
  for (let y = 0; y < gridSize; y += sampleRate) {
    for (let x = 0; x < gridSize; x += sampleRate) {
      const score = scorePlacement(gameState, { x, y }, buildingType, config);
      
      if (score.isValid && score.totalScore > bestScore) {
        bestScore = score.totalScore;
        bestPosition = { x, y };
      }
    }
  }
  
  return bestPosition;
}

/**
 * Find the best location for a crypto building.
 * 
 * @param gameState - Current game state
 * @param cryptoBuildingId - ID of the crypto building
 * @param config - Optional scoring configuration
 * @returns Best position or null if no valid placement
 */
export function findBestCryptoLocation(
  gameState: GameState,
  cryptoBuildingId: string,
  config: PlacementConfig = DEFAULT_PLACEMENT_CONFIG
): { x: number; y: number } | null {
  const { gridSize } = gameState;
  
  let bestScore = -Infinity;
  let bestPosition: { x: number; y: number } | null = null;
  
  const sampleRate = gridSize > 60 ? 2 : 1;
  
  for (let y = 0; y < gridSize; y += sampleRate) {
    for (let x = 0; x < gridSize; x += sampleRate) {
      const score = scoreCryptoPlacement(gameState, { x, y }, cryptoBuildingId, config);
      
      if (score.isValid && score.totalScore > bestScore) {
        bestScore = score.totalScore;
        bestPosition = { x, y };
      }
    }
  }
  
  return bestPosition;
}

/**
 * Find multiple good locations for a building type.
 * Returns top N positions sorted by score.
 * 
 * @param gameState - Current game state
 * @param buildingType - Type of building to place
 * @param count - Number of locations to return
 * @param config - Optional scoring configuration
 * @returns Array of positions sorted by score (best first)
 */
export function findBestLocations(
  gameState: GameState,
  buildingType: BuildingType,
  count: number = 5,
  config: PlacementConfig = DEFAULT_PLACEMENT_CONFIG
): { x: number; y: number; score: number }[] {
  const { gridSize } = gameState;
  const candidates: { x: number; y: number; score: number }[] = [];
  
  const sampleRate = gridSize > 60 ? 2 : 1;
  
  for (let y = 0; y < gridSize; y += sampleRate) {
    for (let x = 0; x < gridSize; x += sampleRate) {
      const result = scorePlacement(gameState, { x, y }, buildingType, config);
      
      if (result.isValid) {
        candidates.push({ x, y, score: result.totalScore });
      }
    }
  }
  
  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  
  // Return top N, ensuring they're not too close together
  const result: { x: number; y: number; score: number }[] = [];
  
  for (const candidate of candidates) {
    // Check if too close to already selected locations
    const tooClose = result.some(
      selected => 
        Math.abs(selected.x - candidate.x) < 5 && 
        Math.abs(selected.y - candidate.y) < 5
    );
    
    if (!tooClose) {
      result.push(candidate);
      if (result.length >= count) break;
    }
  }
  
  return result;
}

// =============================================================================
// VALIDITY CHECKS
// =============================================================================

/**
 * Check if a building can be placed at a position.
 */
function checkPlacementValidity(
  grid: Tile[][],
  gridSize: number,
  x: number,
  y: number,
  buildingType: BuildingType
): { isValid: boolean; reason?: string } {
  // Bounds check
  if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) {
    return { isValid: false, reason: 'Out of bounds' };
  }
  
  const tile = grid[y][x];
  
  // Water check
  if (tile.building.type === 'water') {
    return { isValid: false, reason: 'Cannot build on water' };
  }
  
  // Existing building check (allow grass and trees)
  if (tile.building.type !== 'grass' && tile.building.type !== 'tree') {
    return { isValid: false, reason: 'Tile is already occupied' };
  }
  
  return { isValid: true };
}

/**
 * Check validity for multi-tile buildings.
 */
function checkMultiTilePlacementValidity(
  grid: Tile[][],
  gridSize: number,
  x: number,
  y: number,
  width: number,
  height: number
): { isValid: boolean; reason?: string } {
  // Bounds check for full footprint
  if (x < 0 || y < 0 || x + width > gridSize || y + height > gridSize) {
    return { isValid: false, reason: 'Out of bounds' };
  }
  
  // Check all tiles in footprint
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const tile = grid[y + dy][x + dx];
      
      if (tile.building.type === 'water') {
        return { isValid: false, reason: 'Cannot build on water' };
      }
      
      if (tile.building.type !== 'grass' && tile.building.type !== 'tree') {
        return { isValid: false, reason: 'Some tiles are occupied' };
      }
    }
  }
  
  return { isValid: true };
}

// =============================================================================
// SCORE CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate synergy score with nearby buildings.
 */
function calculateSynergyScore(
  grid: Tile[][],
  gridSize: number,
  x: number,
  y: number,
  buildingType: BuildingType
): number {
  let score = 0;
  const synergies = BUILDING_SYNERGIES[buildingType] || {};
  
  // Check 5-tile radius
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        const neighborType = grid[ny][nx].building.type;
        
        if (synergies[neighborType]) {
          // Synergy decreases with distance
          const distance = Math.sqrt(dx * dx + dy * dy);
          score += synergies[neighborType] / distance;
        }
      }
    }
  }
  
  return Math.max(-10, Math.min(10, score)); // Clamp to [-10, 10]
}

/**
 * Calculate crypto building synergy including chain and category bonuses.
 */
function calculateCryptoSynergyScore(
  grid: Tile[][],
  gridSize: number,
  x: number,
  y: number,
  cryptoBuilding: CryptoBuildingDefinition
): number {
  let score = 0;
  const { crypto } = cryptoBuilding;
  
  // Check 8-tile radius for crypto-specific synergies
  for (let dy = -8; dy <= 8; dy++) {
    for (let dx = -8; dx <= 8; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        const tile = grid[ny][nx];
        
        // Check for other crypto buildings
        if (tile.building.type === 'crypto_building' && tile.building.cryptoBuildingId) {
          const neighbor = getCryptoBuilding(tile.building.cryptoBuildingId);
          
          if (neighbor) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Chain synergy
            if (crypto.effects.chainSynergy.includes(neighbor.crypto.chain)) {
              score += 3 / distance;
            }
            
            // Category synergy
            if (crypto.effects.categorySynergy.includes(neighbor.category)) {
              score += 2 / distance;
            }
          }
        }
        
        // Basic building synergies
        if (tile.building.type === 'road' || tile.building.type === 'bridge') {
          const distance = Math.sqrt(dx * dx + dy * dy);
          score += 2 / distance;
        }
      }
    }
  }
  
  return Math.max(-10, Math.min(10, score));
}

/**
 * Calculate road access score.
 */
function calculateRoadAccessScore(
  grid: Tile[][],
  gridSize: number,
  x: number,
  y: number
): number {
  // Check for roads in immediate vicinity
  let nearestRoad = Infinity;
  
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        const type = grid[ny][nx].building.type;
        if (type === 'road' || type === 'bridge') {
          const dist = Math.sqrt(dx * dx + dy * dy);
          nearestRoad = Math.min(nearestRoad, dist);
        }
      }
    }
  }
  
  if (nearestRoad === Infinity) {
    return -5; // No road nearby - bad
  }
  
  if (nearestRoad <= 1) {
    return 10; // Adjacent to road - excellent
  }
  
  // Score decreases with distance
  return Math.max(0, 10 - nearestRoad);
}

/**
 * Calculate service coverage score.
 */
function calculateServiceCoverageScore(
  services: ServiceCoverage,
  x: number,
  y: number
): number {
  let score = 0;
  
  // Power is critical
  if (services.power[y]?.[x]) {
    score += 4;
  } else {
    score -= 2;
  }
  
  // Water is important
  if (services.water[y]?.[x]) {
    score += 3;
  } else {
    score -= 1;
  }
  
  // Other services add minor bonuses
  const police = services.police[y]?.[x] ?? 0;
  const fire = services.fire[y]?.[x] ?? 0;
  const health = services.health[y]?.[x] ?? 0;
  
  score += (police + fire + health) / 100; // 0-3 bonus
  
  return Math.max(-5, Math.min(10, score));
}

/**
 * Calculate land value appropriateness score.
 */
function calculateLandValueScore(
  grid: Tile[][],
  x: number,
  y: number,
  buildingType: BuildingType
): number {
  const landValue = grid[y][x].landValue;
  
  // Different building types prefer different land values
  const preferences: Record<string, { min: number; max: number }> = {
    // Residential prefers mid-to-high
    house_small: { min: 30, max: 70 },
    house_medium: { min: 40, max: 80 },
    apartment_low: { min: 40, max: 80 },
    apartment_high: { min: 60, max: 100 },
    
    // Commercial prefers high
    shop_small: { min: 40, max: 80 },
    shop_medium: { min: 50, max: 90 },
    office_low: { min: 50, max: 90 },
    office_high: { min: 60, max: 100 },
    
    // Industrial prefers low
    factory_small: { min: 20, max: 50 },
    factory_medium: { min: 20, max: 50 },
    warehouse: { min: 20, max: 60 },
    
    // Services are flexible
    police_station: { min: 30, max: 80 },
    fire_station: { min: 30, max: 80 },
    hospital: { min: 40, max: 90 },
    school: { min: 40, max: 80 },
    park: { min: 30, max: 90 },
  };
  
  const pref = preferences[buildingType] || { min: 20, max: 80 };
  
  if (landValue >= pref.min && landValue <= pref.max) {
    return 10; // Perfect range
  }
  
  // Calculate how far outside the preferred range
  const distance = landValue < pref.min 
    ? pref.min - landValue 
    : landValue - pref.max;
  
  return Math.max(0, 10 - distance / 5);
}

/**
 * Calculate average land value for crypto building footprint.
 */
function calculateCryptoLandValueScore(
  grid: Tile[][],
  x: number,
  y: number,
  width: number,
  height: number
): number {
  let totalLandValue = 0;
  
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      totalLandValue += grid[y + dy][x + dx].landValue;
    }
  }
  
  const avgLandValue = totalLandValue / (width * height);
  
  // Crypto buildings prefer mid-to-high land value
  if (avgLandValue >= 40 && avgLandValue <= 80) {
    return 10;
  }
  
  const distance = avgLandValue < 40 ? 40 - avgLandValue : avgLandValue - 80;
  return Math.max(0, 10 - distance / 5);
}

/**
 * Calculate demand score based on RCI balance.
 */
function calculateDemandScore(
  stats: GameState['stats'],
  buildingType: BuildingType
): number {
  const { demand } = stats;
  
  // Map building types to zone demands
  const residentialBuildings = ['house_small', 'house_medium', 'apartment_low', 'apartment_high', 'mansion'];
  const commercialBuildings = ['shop_small', 'shop_medium', 'office_low', 'office_high', 'mall'];
  const industrialBuildings = ['factory_small', 'factory_medium', 'factory_large', 'warehouse'];
  
  let relevantDemand = 50; // Default neutral
  
  if (residentialBuildings.includes(buildingType)) {
    relevantDemand = demand.residential;
  } else if (commercialBuildings.includes(buildingType)) {
    relevantDemand = demand.commercial;
  } else if (industrialBuildings.includes(buildingType)) {
    relevantDemand = demand.industrial;
  }
  
  // Convert demand (0-100) to score (-5 to 10)
  return (relevantDemand - 50) / 10;
}

/**
 * Calculate zone compatibility score.
 */
function calculateZoneCompatibilityScore(
  grid: Tile[][],
  x: number,
  y: number,
  buildingType: BuildingType
): number {
  const tile = grid[y][x];
  const zone = tile.zone;
  
  // Map building types to preferred zones
  const zonePreferences: Record<string, ZoneType | 'none'> = {
    // Residential
    house_small: 'residential',
    house_medium: 'residential',
    apartment_low: 'residential',
    apartment_high: 'residential',
    mansion: 'residential',
    
    // Commercial
    shop_small: 'commercial',
    shop_medium: 'commercial',
    office_low: 'commercial',
    office_high: 'commercial',
    mall: 'commercial',
    
    // Industrial
    factory_small: 'industrial',
    factory_medium: 'industrial',
    factory_large: 'industrial',
    warehouse: 'industrial',
    
    // Services prefer unzoned
    police_station: 'none',
    fire_station: 'none',
    hospital: 'none',
    school: 'none',
    park: 'none',
    power_plant: 'none',
    water_tower: 'none',
  };
  
  const preferredZone = zonePreferences[buildingType];
  
  if (preferredZone === undefined) {
    return 5; // Unknown building, neutral score
  }
  
  if (zone === preferredZone) {
    return 10; // Perfect match
  }
  
  if (zone === 'none' && preferredZone !== 'none') {
    return 0; // Unzoned but needs zone
  }
  
  if (zone !== 'none' && preferredZone === 'none') {
    return 0; // Zoned but shouldn't be
  }
  
  return -5; // Wrong zone type
}
