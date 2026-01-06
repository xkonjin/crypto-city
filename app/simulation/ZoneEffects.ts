// =============================================================================
// ZONE EFFECTS SYSTEM
// =============================================================================
// Manages the spatial influence that crypto buildings have on surrounding tiles.
// Buildings create "zones of influence" that affect nearby structures.
//
// Zone effects include:
// - Yield multipliers (DeFi buildings boost nearby DeFi)
// - Happiness modifiers (Positive/negative mood effects)
// - Chain bonuses (Same-chain buildings get synergy)
// - Population attraction (Different tiers attract different populations)
//
// This follows the Roadmap's simulation philosophy:
// "Abstract determines outcome" - zone effects are calculated from
// building presence, not from individual agent behavior.

import {
  ZoneEffect,
  GridCell,
  CryptoTier,
} from '../components/game/types';
import { CryptoBuildingDefinition, ALL_CRYPTO_BUILDINGS } from '../data/cryptoBuildings';

// =============================================================================
// ZONE CALCULATION
// =============================================================================

/**
 * Calculate all zone effects from placed crypto buildings
 *
 * @param grid - The game grid
 * @returns Array of all active zone effects
 */
export function calculateZoneEffects(grid: GridCell[][]): ZoneEffect[] {
  const effects: ZoneEffect[] = [];
  
  // Scan grid for crypto buildings with zone effects
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      
      // Only process origin cells of buildings
      if (!cell.buildingId || !cell.isOrigin) continue;
      
      const building = ALL_CRYPTO_BUILDINGS[cell.buildingId];
      if (!building) continue;
      
      const cryptoEffects = building.crypto.effects;
      const radius = cryptoEffects.zoneRadius || 0;
      
      // Skip buildings with no zone radius
      if (radius === 0) continue;
      
      // Create zone effect for this building
      const zoneEffect: ZoneEffect = {
        sourceBuilding: building.id,
        sourceTile: { x, y },
        radius,
        effects: {
          yieldMultiplier: cryptoEffects.stakingBonus || 1.0,
          happinessModifier: cryptoEffects.happinessEffect || 0,
          volatilityModifier: cryptoEffects.volatility || 0,
          populationType: building.crypto.tier,
          chainBonus: building.crypto.chain,
        },
      };
      
      effects.push(zoneEffect);
    }
  }
  
  return effects;
}

/**
 * Get all zone effects that affect a specific tile
 *
 * @param x - Tile X coordinate
 * @param y - Tile Y coordinate
 * @param allEffects - All zone effects in the city
 * @returns Array of effects affecting this tile
 */
export function getZoneEffectsAtTile(
  x: number,
  y: number,
  allEffects: ZoneEffect[]
): ZoneEffect[] {
  return allEffects.filter(effect => {
    const dx = x - effect.sourceTile.x;
    const dy = y - effect.sourceTile.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= effect.radius;
  });
}

/**
 * Calculate combined effects at a specific tile
 *
 * @param x - Tile X coordinate
 * @param y - Tile Y coordinate
 * @param allEffects - All zone effects
 * @returns Combined effect values
 */
export function getCombinedEffectsAtTile(
  x: number,
  y: number,
  allEffects: ZoneEffect[]
): {
  yieldMultiplier: number;
  happinessModifier: number;
  volatilityModifier: number;
  dominantTier: CryptoTier | null;
  chainBonuses: string[];
} {
  const effectsAtTile = getZoneEffectsAtTile(x, y, allEffects);
  
  let yieldMultiplier = 1.0;
  let happinessModifier = 0;
  let volatilityModifier = 0;
  const tierCounts: Record<CryptoTier, number> = { degen: 0, retail: 0, whale: 0, institution: 0 };
  const chainBonuses = new Set<string>();
  
  for (const effect of effectsAtTile) {
    // Calculate distance-based falloff
    const dx = x - effect.sourceTile.x;
    const dy = y - effect.sourceTile.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const falloff = 1 - (distance / effect.radius);  // 1 at center, 0 at edge
    
    // Apply effects with falloff
    if (effect.effects.yieldMultiplier) {
      // Yield multipliers stack multiplicatively
      const bonus = (effect.effects.yieldMultiplier - 1) * falloff;
      yieldMultiplier *= (1 + bonus);
    }
    
    if (effect.effects.happinessModifier) {
      happinessModifier += effect.effects.happinessModifier * falloff;
    }
    
    if (effect.effects.volatilityModifier) {
      volatilityModifier += effect.effects.volatilityModifier * falloff;
    }
    
    if (effect.effects.populationType) {
      tierCounts[effect.effects.populationType]++;
    }
    
    if (effect.effects.chainBonus) {
      chainBonuses.add(effect.effects.chainBonus);
    }
  }
  
  // Determine dominant tier
  let dominantTier: CryptoTier | null = null;
  let maxCount = 0;
  for (const [tier, count] of Object.entries(tierCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantTier = tier as CryptoTier;
    }
  }
  
  return {
    yieldMultiplier,
    happinessModifier: Math.round(happinessModifier),
    volatilityModifier,
    dominantTier: maxCount > 0 ? dominantTier : null,
    chainBonuses: Array.from(chainBonuses),
  };
}

// =============================================================================
// SYNERGY CALCULATIONS
// =============================================================================

/**
 * Calculate chain synergy bonus for a building
 * Buildings on tiles with matching chain zones get bonuses
 *
 * @param building - The building to calculate bonus for
 * @param tileX - Building tile X
 * @param tileY - Building tile Y
 * @param allEffects - All zone effects
 * @returns Synergy multiplier (1.0 = no bonus, higher = bonus)
 */
export function calculateChainSynergy(
  building: CryptoBuildingDefinition,
  tileX: number,
  tileY: number,
  allEffects: ZoneEffect[]
): number {
  const buildingChain = building.crypto.chain;
  const chainSynergies = building.crypto.effects.chainSynergy || [];
  
  if (!buildingChain && chainSynergies.length === 0) {
    return 1.0;  // No chain = no synergy
  }
  
  const tileEffects = getCombinedEffectsAtTile(tileX, tileY, allEffects);
  let synergyBonus = 1.0;
  
  for (const chainBonus of tileEffects.chainBonuses) {
    // Same chain = 10% bonus
    if (chainBonus === buildingChain) {
      synergyBonus += 0.1;
    }
    
    // Synergy chain = 5% bonus
    if (chainSynergies.includes(chainBonus)) {
      synergyBonus += 0.05;
    }
  }
  
  return synergyBonus;
}

/**
 * Calculate category synergy bonus for a building
 *
 * @param building - The building to calculate bonus for
 * @param nearbyBuildings - Buildings in the same zone
 * @returns Synergy multiplier
 */
export function calculateCategorySynergy(
  building: CryptoBuildingDefinition,
  nearbyBuildings: CryptoBuildingDefinition[]
): number {
  const categorySynergies = building.crypto.effects.categorySynergy || [];
  
  if (categorySynergies.length === 0) {
    return 1.0;
  }
  
  let synergyCount = 0;
  
  for (const nearby of nearbyBuildings) {
    if (categorySynergies.includes(nearby.category)) {
      synergyCount++;
    }
  }
  
  // Each synergy = +5% bonus, max 50%
  return 1 + Math.min(0.5, synergyCount * 0.05);
}

// =============================================================================
// ZONE VISUALIZATION DATA
// =============================================================================

/**
 * Generate a heatmap of zone effects for visualization
 * Returns values 0-1 for each tile based on combined effects
 *
 * @param grid - Game grid
 * @param effectType - Which effect to map
 * @returns 2D array of effect intensities
 */
export function generateZoneHeatmap(
  grid: GridCell[][],
  effectType: 'yield' | 'happiness' | 'volatility' | 'chain'
): number[][] {
  const allEffects = calculateZoneEffects(grid);
  const heatmap: number[][] = [];
  
  for (let y = 0; y < grid.length; y++) {
    heatmap[y] = [];
    for (let x = 0; x < grid[y].length; x++) {
      const combined = getCombinedEffectsAtTile(x, y, allEffects);
      
      let value = 0;
      switch (effectType) {
        case 'yield':
          // Map multiplier to 0-1 (1.0 = 0, 2.0 = 1)
          value = Math.min(1, Math.max(0, (combined.yieldMultiplier - 1)));
          break;
        case 'happiness':
          // Map -50 to +50 to 0-1
          value = Math.min(1, Math.max(0, (combined.happinessModifier + 50) / 100));
          break;
        case 'volatility':
          // Map 0-1 directly
          value = Math.min(1, Math.max(0, combined.volatilityModifier));
          break;
        case 'chain':
          // 1 if any chain bonus, 0 otherwise
          value = combined.chainBonuses.length > 0 ? 1 : 0;
          break;
      }
      
      heatmap[y][x] = value;
    }
  }
  
  return heatmap;
}

/**
 * Get zone preview data for UI (when hovering over a building to place)
 *
 * @param building - Building being previewed
 * @param centerX - Proposed center X
 * @param centerY - Proposed center Y
 * @returns Preview data for visualization
 */
export function getZonePreviewData(
  building: CryptoBuildingDefinition,
  centerX: number,
  centerY: number
): {
  radius: number;
  tiles: { x: number; y: number; intensity: number }[];
  description: string;
} {
  const radius = building.crypto.effects.zoneRadius || 0;
  const tiles: { x: number; y: number; intensity: number }[] = [];
  
  if (radius === 0) {
    return { radius: 0, tiles: [], description: 'No zone effect' };
  }
  
  // Generate tiles within radius
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius) {
        const intensity = 1 - (distance / radius);
        tiles.push({
          x: centerX + dx,
          y: centerY + dy,
          intensity,
        });
      }
    }
  }
  
  // Generate description
  const effects = building.crypto.effects;
  const parts: string[] = [];
  
  if (effects.stakingBonus && effects.stakingBonus > 1) {
    parts.push(`+${Math.round((effects.stakingBonus - 1) * 100)}% yield`);
  }
  if (effects.happinessEffect) {
    const sign = effects.happinessEffect > 0 ? '+' : '';
    parts.push(`${sign}${effects.happinessEffect} happiness`);
  }
  if (effects.chainSynergy && effects.chainSynergy.length > 0) {
    parts.push(`${effects.chainSynergy.join('/')} synergy`);
  }
  
  return {
    radius,
    tiles,
    description: parts.length > 0 ? parts.join(', ') : 'Passive zone effect',
  };
}

// =============================================================================
// ZONE-BASED LAND VALUE
// =============================================================================

/**
 * Calculate land value modifier at a tile based on zone effects
 * High-prestige buildings increase nearby land values
 *
 * @param x - Tile X
 * @param y - Tile Y
 * @param grid - Game grid
 * @returns Land value multiplier (1.0 = normal, higher = more valuable)
 */
export function calculateLandValueAtTile(
  x: number,
  y: number,
  grid: GridCell[][]
): number {
  let landValue = 1.0;
  
  // Scan for nearby crypto buildings with prestige
  const scanRadius = 10;
  
  for (let dy = -scanRadius; dy <= scanRadius; dy++) {
    for (let dx = -scanRadius; dx <= scanRadius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      // Bounds check
      if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) continue;
      
      const cell = grid[ny][nx];
      if (!cell.buildingId || !cell.isOrigin) continue;
      
      const building = ALL_CRYPTO_BUILDINGS[cell.buildingId];
      if (!building) continue;
      
      const prestige = building.crypto.effects.prestigeBonus || 0;
      if (prestige === 0) continue;
      
      // Calculate distance falloff
      const distance = Math.sqrt(dx * dx + dy * dy);
      const falloff = Math.max(0, 1 - (distance / scanRadius));
      
      // Add prestige bonus with falloff
      landValue += (prestige / 100) * falloff;
    }
  }
  
  return landValue;
}

/**
 * Generate a land value map for the entire grid
 *
 * @param grid - Game grid
 * @returns 2D array of land value multipliers
 */
export function generateLandValueMap(grid: GridCell[][]): number[][] {
  const valueMap: number[][] = [];
  
  for (let y = 0; y < grid.length; y++) {
    valueMap[y] = [];
    for (let x = 0; x < grid[y].length; x++) {
      valueMap[y][x] = calculateLandValueAtTile(x, y, grid);
    }
  }
  
  return valueMap;
}

// =============================================================================
// ZONE CONFLICT DETECTION
// =============================================================================

/**
 * Check if placing a building would create zone conflicts
 * (e.g., FTX Ruins near Coinbase Tower = bad vibes)
 *
 * @param building - Building to place
 * @param x - Tile X
 * @param y - Tile Y
 * @param grid - Game grid
 * @returns Array of conflict warnings
 */
export function checkZoneConflicts(
  building: CryptoBuildingDefinition,
  x: number,
  y: number,
  grid: GridCell[][]
): string[] {
  const conflicts: string[] = [];
  const buildingChain = building.crypto.chain;
  const scanRadius = 8;
  
  // Known conflicts
  const CONFLICTING_PAIRS: [string, string, string][] = [
    ['ftx-ruins', 'coinbase-tower', 'FTX Ruins near Coinbase creates regulatory concerns'],
    ['ftx-ruins', 'binance-megaplex', 'FTX Ruins near Binance stirs old drama'],
    ['ngmi-graffiti', 'wagmi-banner', 'NGMI and WAGMI banners cancel each other out'],
    ['rug-pull-crater', 'aave-lending-tower', 'Rug Pull Crater scares away Aave depositors'],
  ];
  
  // Scan for nearby buildings
  for (let dy = -scanRadius; dy <= scanRadius; dy++) {
    for (let dx = -scanRadius; dx <= scanRadius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) continue;
      
      const cell = grid[ny][nx];
      if (!cell.buildingId || !cell.isOrigin) continue;
      
      // Check for known conflicts
      for (const [id1, id2, warning] of CONFLICTING_PAIRS) {
        if ((building.id === id1 && cell.buildingId === id2) ||
            (building.id === id2 && cell.buildingId === id1)) {
          conflicts.push(warning);
        }
      }
      
      // Check for chain conflicts (competitor chains too close)
      const nearbyBuilding = ALL_CRYPTO_BUILDINGS[cell.buildingId];
      if (nearbyBuilding && nearbyBuilding.crypto.chain && buildingChain) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 3) {
          // Very close buildings of different major chains
          const competingChains: [string, string][] = [
            ['ethereum', 'solana'],
            ['bitcoin', 'ethereum'],
          ];
          
          for (const [chain1, chain2] of competingChains) {
            if ((buildingChain === chain1 && nearbyBuilding.crypto.chain === chain2) ||
                (buildingChain === chain2 && nearbyBuilding.crypto.chain === chain1)) {
              conflicts.push(`${chain1} and ${chain2} buildings very close - tribal tensions!`);
            }
          }
        }
      }
    }
  }
  
  return conflicts;
}

