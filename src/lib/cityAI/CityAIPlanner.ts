/**
 * City AI Planner
 * 
 * "I love deadlines. I love the whooshing noise they make as they go by."
 * - Douglas Adams
 * 
 * This module is responsible for taking a city assessment and planning
 * appropriate actions. It's like having a city planner who never sleeps,
 * never takes bribes, and always makes data-driven decisions.
 * 
 * The planner uses a utility AI approach:
 * 1. Evaluate each issue's priority
 * 2. Generate candidate actions for top issues
 * 3. Score each candidate action
 * 4. Return the best actions within budget
 */

import { GameState } from '@/games/isocity/types';
import { TOOL_INFO } from '@/games/isocity/types/game';
import {
  CityAssessment,
  CityAction,
  CityActionType,
  PrioritizedIssue,
  AIAggressiveness,
  AI_GOALS,
} from './types';

// =============================================================================
// PLANNER CONFIGURATION
// =============================================================================

/**
 * Action costs - pulled from game tool info where possible.
 */
const ACTION_COSTS: Record<CityActionType, number> = {
  zone_residential: TOOL_INFO.zone_residential.cost,
  zone_commercial: TOOL_INFO.zone_commercial.cost,
  zone_industrial: TOOL_INFO.zone_industrial.cost,
  build_road: TOOL_INFO.road.cost,
  build_power_plant: TOOL_INFO.power_plant.cost,
  build_water_tower: TOOL_INFO.water_tower.cost,
  build_police_station: TOOL_INFO.police_station.cost,
  build_fire_station: TOOL_INFO.fire_station.cost,
  build_hospital: TOOL_INFO.hospital.cost,
  build_school: TOOL_INFO.school.cost,
  build_park: TOOL_INFO.park.cost,
  bulldoze: TOOL_INFO.bulldoze.cost,
  adjust_tax_rate: 0, // Free to adjust
  place_crypto_building: 5000, // Average crypto building cost
};

/**
 * Aggressiveness multipliers.
 * Affects how many actions the AI plans per cycle.
 */
const AGGRESSIVENESS_MULTIPLIERS: Record<AIAggressiveness, number> = {
  conservative: 0.5,
  moderate: 1.0,
  aggressive: 2.0,
};

/**
 * Budget allocation percentages.
 * How much of available funds can be used for each action type.
 */
const BUDGET_ALLOCATION = {
  emergency: 0.5,    // Disasters, critical issues
  utilities: 0.3,    // Power, water
  services: 0.2,     // Police, fire, health, education
  growth: 0.15,      // Zoning, parks
  infrastructure: 0.1, // Roads
};

// =============================================================================
// MAIN PLANNER FUNCTION
// =============================================================================

let actionIdCounter = 0;

/**
 * Plan actions based on city assessment.
 * Returns a prioritized list of actions the AI should take.
 * 
 * @param assessment - Current city assessment
 * @param gameState - Full game state for additional context
 * @param aggressiveness - How aggressive the AI should be
 * @returns Array of planned actions, sorted by priority
 */
export function planActions(
  assessment: CityAssessment,
  gameState: GameState,
  aggressiveness: AIAggressiveness = 'moderate'
): CityAction[] {
  const actions: CityAction[] = [];
  const { money } = gameState.stats;
  
  // Calculate available budget based on aggressiveness
  const aggrMultiplier = AGGRESSIVENESS_MULTIPLIERS[aggressiveness];
  const baseBudget = Math.min(money * 0.5, money - AI_GOALS.treasuryBuffer);
  const availableBudget = Math.max(0, baseBudget * aggrMultiplier);
  
  if (availableBudget <= 0 && assessment.treasuryHealth === 'critical') {
    // Only action when broke is to raise taxes
    actions.push(createTaxAdjustmentAction(gameState.taxRate, 'increase'));
    return actions;
  }
  
  let spentBudget = 0;
  const maxActions = Math.ceil(5 * aggrMultiplier);
  
  // Process issues by priority
  for (const issue of assessment.prioritizedIssues) {
    if (actions.length >= maxActions) break;
    if (spentBudget >= availableBudget) break;
    
    const issueActions = planActionsForIssue(
      issue,
      assessment,
      gameState,
      availableBudget - spentBudget
    );
    
    for (const action of issueActions) {
      if (spentBudget + action.cost <= availableBudget) {
        actions.push(action);
        spentBudget += action.cost;
        
        if (actions.length >= maxActions) break;
      }
    }
  }
  
  return actions;
}

// =============================================================================
// ISSUE-SPECIFIC ACTION PLANNING
// =============================================================================

/**
 * Plan actions for a specific issue.
 */
function planActionsForIssue(
  issue: PrioritizedIssue,
  assessment: CityAssessment,
  gameState: GameState,
  budget: number
): CityAction[] {
  switch (issue.type) {
    case 'active_disaster':
      return planDisasterResponse(issue, gameState, budget);
    
    case 'power_shortage':
      return planPowerExpansion(assessment, gameState, budget);
    
    case 'water_shortage':
      return planWaterExpansion(assessment, gameState, budget);
    
    case 'low_happiness':
      return planHappinessImprovement(assessment, gameState, budget);
    
    case 'high_unemployment':
      return planJobCreation(assessment, gameState, budget);
    
    case 'housing_shortage':
      return planHousingExpansion(assessment, gameState, budget);
    
    case 'rci_imbalance':
      return planDemandBalance(assessment, gameState, budget);
    
    case 'service_gap':
      return planServiceExpansion(issue, gameState, budget);
    
    case 'low_treasury':
    case 'declining_population':
      // These issues are addressed indirectly by other actions
      // or by tax adjustment
      if (gameState.taxRate < 12 && assessment.happiness > 60) {
        return [createTaxAdjustmentAction(gameState.taxRate, 'increase')];
      }
      return [];
    
    default:
      return [];
  }
}

// =============================================================================
// DISASTER RESPONSE
// =============================================================================

/**
 * Plan response to active disasters (fires).
 * The AI doesn't directly fight fires but can build fire stations.
 */
function planDisasterResponse(
  issue: PrioritizedIssue,
  gameState: GameState,
  budget: number
): CityAction[] {
  const actions: CityAction[] = [];
  const cost = ACTION_COSTS.build_fire_station;
  
  if (budget < cost) return actions;
  
  // Find areas with fires that need coverage
  const { grid, gridSize, services } = gameState;
  
  for (let y = 0; y < gridSize && actions.length < 2; y++) {
    for (let x = 0; x < gridSize && actions.length < 2; x++) {
      const tile = grid[y][x];
      
      if (tile.building.onFire && services.fire[y][x] < 30) {
        // Find nearby valid placement for fire station
        const placement = findValidServicePlacement(
          grid,
          gridSize,
          x,
          y,
          1 // 1x1 building
        );
        
        if (placement) {
          actions.push({
            id: `action-${++actionIdCounter}`,
            type: 'build_fire_station',
            position: placement,
            buildingType: 'fire_station',
            cost,
            priority: issue.priority,
            reason: `Build fire station near active fire at (${x}, ${y})`,
            plannedAt: Date.now(),
          });
        }
      }
    }
  }
  
  return actions;
}

// =============================================================================
// UTILITY EXPANSION
// =============================================================================

/**
 * Plan power infrastructure expansion.
 */
function planPowerExpansion(
  assessment: CityAssessment,
  gameState: GameState,
  budget: number
): CityAction[] {
  const actions: CityAction[] = [];
  const cost = ACTION_COSTS.build_power_plant;
  
  if (budget < cost) return actions;
  
  const { grid, gridSize, services } = gameState;
  
  // Find area with most unpowered tiles
  let bestLocation: { x: number; y: number } | null = null;
  let maxUnpowered = 0;
  
  for (let y = 0; y < gridSize; y += 5) {
    for (let x = 0; x < gridSize; x += 5) {
      let unpoweredCount = 0;
      
      // Count unpowered tiles in 15x15 area
      for (let dy = -7; dy <= 7; dy++) {
        for (let dx = -7; dx <= 7; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            const tile = grid[ny][nx];
            if (
              tile.zone !== 'none' &&
              tile.building.type !== 'grass' &&
              !services.power[ny][nx]
            ) {
              unpoweredCount++;
            }
          }
        }
      }
      
      if (unpoweredCount > maxUnpowered) {
        maxUnpowered = unpoweredCount;
        bestLocation = { x, y };
      }
    }
  }
  
  if (bestLocation && maxUnpowered > 10) {
    // Find valid 2x2 placement near best location
    const placement = findValidServicePlacement(
      grid,
      gridSize,
      bestLocation.x,
      bestLocation.y,
      2
    );
    
    if (placement) {
      actions.push({
        id: `action-${++actionIdCounter}`,
        type: 'build_power_plant',
        position: placement,
        buildingType: 'power_plant',
        cost,
        priority: 80,
        reason: `Build power plant to cover ${maxUnpowered} unpowered buildings`,
        plannedAt: Date.now(),
      });
    }
  }
  
  return actions;
}

/**
 * Plan water infrastructure expansion.
 */
function planWaterExpansion(
  assessment: CityAssessment,
  gameState: GameState,
  budget: number
): CityAction[] {
  const actions: CityAction[] = [];
  const cost = ACTION_COSTS.build_water_tower;
  
  if (budget < cost) return actions;
  
  const { grid, gridSize, services } = gameState;
  
  // Similar logic to power, find area with most unwatered tiles
  let bestLocation: { x: number; y: number } | null = null;
  let maxUnwatered = 0;
  
  for (let y = 0; y < gridSize; y += 5) {
    for (let x = 0; x < gridSize; x += 5) {
      let unwateredCount = 0;
      
      for (let dy = -6; dy <= 6; dy++) {
        for (let dx = -6; dx <= 6; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            const tile = grid[ny][nx];
            if (
              tile.zone !== 'none' &&
              tile.building.type !== 'grass' &&
              !services.water[ny][nx]
            ) {
              unwateredCount++;
            }
          }
        }
      }
      
      if (unwateredCount > maxUnwatered) {
        maxUnwatered = unwateredCount;
        bestLocation = { x, y };
      }
    }
  }
  
  if (bestLocation && maxUnwatered > 10) {
    const placement = findValidServicePlacement(
      grid,
      gridSize,
      bestLocation.x,
      bestLocation.y,
      1
    );
    
    if (placement) {
      actions.push({
        id: `action-${++actionIdCounter}`,
        type: 'build_water_tower',
        position: placement,
        buildingType: 'water_tower',
        cost,
        priority: 75,
        reason: `Build water tower to serve ${maxUnwatered} buildings`,
        plannedAt: Date.now(),
      });
    }
  }
  
  return actions;
}

// =============================================================================
// HAPPINESS IMPROVEMENT
// =============================================================================

/**
 * Plan actions to improve city happiness.
 */
function planHappinessImprovement(
  assessment: CityAssessment,
  gameState: GameState,
  budget: number
): CityAction[] {
  const actions: CityAction[] = [];
  
  // Parks are the simplest happiness boost
  const parkCost = ACTION_COSTS.build_park;
  
  if (budget >= parkCost) {
    const { grid, gridSize } = gameState;
    
    // Find residential areas without nearby parks
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = grid[y][x];
        
        if (tile.zone === 'residential' && !hasNearbyPark(grid, x, y, gridSize)) {
          const placement = findValidServicePlacement(grid, gridSize, x, y, 1);
          
          if (placement && actions.length < 2) {
            actions.push({
              id: `action-${++actionIdCounter}`,
              type: 'build_park',
              position: placement,
              buildingType: 'park',
              cost: parkCost,
              priority: 65,
              reason: `Build park near residential area at (${x}, ${y})`,
              plannedAt: Date.now(),
            });
          }
        }
      }
    }
  }
  
  // If taxes are high and budget allows, consider lowering
  if (gameState.taxRate > 12 && assessment.treasuryHealth !== 'deficit') {
    actions.push(createTaxAdjustmentAction(gameState.taxRate, 'decrease'));
  }
  
  return actions;
}

/**
 * Check if there's a park within 5 tiles.
 */
function hasNearbyPark(
  grid: GameState['grid'],
  x: number,
  y: number,
  gridSize: number
): boolean {
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        const type = grid[ny][nx].building.type;
        if (type === 'park' || type === 'park_large') {
          return true;
        }
      }
    }
  }
  return false;
}

// =============================================================================
// JOB CREATION
// =============================================================================

/**
 * Plan actions to reduce unemployment.
 */
function planJobCreation(
  assessment: CityAssessment,
  gameState: GameState,
  budget: number
): CityAction[] {
  const actions: CityAction[] = [];
  
  // Zone more commercial or industrial based on demand
  const { demandBalance } = assessment;
  const zoneCost = ACTION_COSTS.zone_commercial;
  
  if (budget < zoneCost) return actions;
  
  // Prefer commercial if demand is higher
  const preferCommercial = demandBalance.commercial > demandBalance.industrial;
  const zoneType = preferCommercial ? 'zone_commercial' : 'zone_industrial';
  
  const { grid, gridSize } = gameState;
  
  // Find valid zoning locations near roads
  const candidates = findZoningCandidates(grid, gridSize, 5);
  
  for (const candidate of candidates.slice(0, 3)) {
    actions.push({
      id: `action-${++actionIdCounter}`,
      type: zoneType,
      position: candidate,
      zoneType: preferCommercial ? 'commercial' : 'industrial',
      cost: zoneCost,
      priority: 60,
      reason: `Zone ${preferCommercial ? 'commercial' : 'industrial'} to create jobs`,
      plannedAt: Date.now(),
    });
  }
  
  return actions;
}

// =============================================================================
// HOUSING EXPANSION
// =============================================================================

/**
 * Plan actions to address housing shortage.
 */
function planHousingExpansion(
  assessment: CityAssessment,
  gameState: GameState,
  budget: number
): CityAction[] {
  const actions: CityAction[] = [];
  const zoneCost = ACTION_COSTS.zone_residential;
  
  if (budget < zoneCost) return actions;
  
  const { grid, gridSize } = gameState;
  
  // Use suggested positions from assessment if available
  if (assessment.housingShortage?.suggestedPositions.length) {
    for (const pos of assessment.housingShortage.suggestedPositions.slice(0, 5)) {
      actions.push({
        id: `action-${++actionIdCounter}`,
        type: 'zone_residential',
        position: pos,
        zoneType: 'residential',
        cost: zoneCost,
        priority: 55,
        reason: `Zone residential to address housing shortage`,
        plannedAt: Date.now(),
      });
    }
  } else {
    // Find new areas to zone
    const candidates = findZoningCandidates(grid, gridSize, 5);
    
    for (const candidate of candidates.slice(0, 3)) {
      actions.push({
        id: `action-${++actionIdCounter}`,
        type: 'zone_residential',
        position: candidate,
        zoneType: 'residential',
        cost: zoneCost,
        priority: 55,
        reason: `Zone residential to increase housing capacity`,
        plannedAt: Date.now(),
      });
    }
  }
  
  return actions;
}

// =============================================================================
// DEMAND BALANCE
// =============================================================================

/**
 * Plan actions to balance RCI demand.
 */
function planDemandBalance(
  assessment: CityAssessment,
  gameState: GameState,
  budget: number
): CityAction[] {
  const actions: CityAction[] = [];
  const { demandBalance } = assessment;
  const zoneCost = ACTION_COSTS.zone_residential;
  
  if (budget < zoneCost) return actions;
  
  // Find which zone type has highest positive demand
  const demands = [
    { type: 'residential' as const, demand: demandBalance.residential },
    { type: 'commercial' as const, demand: demandBalance.commercial },
    { type: 'industrial' as const, demand: demandBalance.industrial },
  ];
  
  demands.sort((a, b) => b.demand - a.demand);
  
  const { grid, gridSize } = gameState;
  const candidates = findZoningCandidates(grid, gridSize, 3);
  
  // Zone for highest demand type
  const targetZone = demands[0];
  if (targetZone.demand > 20 && candidates.length > 0) {
    for (const candidate of candidates.slice(0, 2)) {
      actions.push({
        id: `action-${++actionIdCounter}`,
        type: `zone_${targetZone.type}` as CityActionType,
        position: candidate,
        zoneType: targetZone.type,
        cost: zoneCost,
        priority: 50,
        reason: `Zone ${targetZone.type} to meet demand (+${Math.round(targetZone.demand)})`,
        plannedAt: Date.now(),
      });
    }
  }
  
  return actions;
}

// =============================================================================
// SERVICE EXPANSION
// =============================================================================

/**
 * Plan actions to fill service coverage gaps.
 */
function planServiceExpansion(
  issue: PrioritizedIssue,
  gameState: GameState,
  budget: number
): CityAction[] {
  const actions: CityAction[] = [];
  
  const serviceType = issue.data?.serviceType as string;
  const position = issue.data?.position as { x: number; y: number };
  
  if (!serviceType || !position) return actions;
  
  // Map service type to building action
  const serviceMapping: Record<string, { action: CityActionType; building: string; size: number }> = {
    police: { action: 'build_police_station', building: 'police_station', size: 1 },
    fire: { action: 'build_fire_station', building: 'fire_station', size: 1 },
    health: { action: 'build_hospital', building: 'hospital', size: 2 },
    education: { action: 'build_school', building: 'school', size: 2 },
  };
  
  const mapping = serviceMapping[serviceType];
  if (!mapping) return actions;
  
  const cost = ACTION_COSTS[mapping.action];
  if (budget < cost) return actions;
  
  const { grid, gridSize } = gameState;
  const placement = findValidServicePlacement(grid, gridSize, position.x, position.y, mapping.size);
  
  if (placement) {
    actions.push({
      id: `action-${++actionIdCounter}`,
      type: mapping.action,
      position: placement,
      buildingType: mapping.building as GameState['grid'][0][0]['building']['type'],
      cost,
      priority: issue.priority,
      reason: `Build ${serviceType} service near (${position.x}, ${position.y})`,
      plannedAt: Date.now(),
    });
  }
  
  return actions;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a tax adjustment action.
 */
function createTaxAdjustmentAction(
  currentRate: number,
  direction: 'increase' | 'decrease'
): CityAction {
  const adjustment = direction === 'increase' ? 1 : -1;
  const newRate = Math.max(0, Math.min(20, currentRate + adjustment));
  
  return {
    id: `action-${++actionIdCounter}`,
    type: 'adjust_tax_rate',
    newTaxRate: newRate,
    cost: 0,
    priority: direction === 'increase' ? 85 : 35,
    reason: `${direction === 'increase' ? 'Raise' : 'Lower'} tax rate to ${newRate}%`,
    plannedAt: Date.now(),
  };
}

/**
 * Find valid placement for a service building near a target location.
 */
function findValidServicePlacement(
  grid: GameState['grid'],
  gridSize: number,
  targetX: number,
  targetY: number,
  buildingSize: number
): { x: number; y: number } | null {
  // Search in expanding circles from target
  for (let radius = 0; radius < 15; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        
        const x = targetX + dx;
        const y = targetY + dy;
        
        if (canPlaceBuilding(grid, gridSize, x, y, buildingSize)) {
          return { x, y };
        }
      }
    }
  }
  
  return null;
}

/**
 * Check if a building can be placed at a position.
 */
function canPlaceBuilding(
  grid: GameState['grid'],
  gridSize: number,
  x: number,
  y: number,
  size: number
): boolean {
  // Check bounds
  if (x < 0 || y < 0 || x + size > gridSize || y + size > gridSize) {
    return false;
  }
  
  // Check all tiles in footprint
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      const tile = grid[y + dy][x + dx];
      
      // Must be grass or tree (empty land)
      if (tile.building.type !== 'grass' && tile.building.type !== 'tree') {
        return false;
      }
      
      // Must not be in a zone (or be unzoned)
      if (tile.zone !== 'none') {
        return false;
      }
    }
  }
  
  // Check for road access
  if (!hasRoadNearby(grid, gridSize, x, y, size)) {
    return false;
  }
  
  return true;
}

/**
 * Check if there's a road within 2 tiles of a building footprint.
 */
function hasRoadNearby(
  grid: GameState['grid'],
  gridSize: number,
  x: number,
  y: number,
  size: number
): boolean {
  for (let dy = -2; dy < size + 2; dy++) {
    for (let dx = -2; dx < size + 2; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        const type = grid[ny][nx].building.type;
        if (type === 'road' || type === 'bridge') {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Find candidates for zoning near roads.
 */
function findZoningCandidates(
  grid: GameState['grid'],
  gridSize: number,
  maxCandidates: number
): { x: number; y: number }[] {
  const candidates: { x: number; y: number; score: number }[] = [];
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const tile = grid[y][x];
      
      // Must be unzoned grass
      if (tile.zone !== 'none' || tile.building.type !== 'grass') {
        continue;
      }
      
      // Must be near a road
      if (!hasRoadNearby(grid, gridSize, x, y, 1)) {
        continue;
      }
      
      // Score based on land value
      candidates.push({ x, y, score: tile.landValue });
    }
  }
  
  // Sort by land value (higher is better)
  candidates.sort((a, b) => b.score - a.score);
  
  return candidates.slice(0, maxCandidates);
}
