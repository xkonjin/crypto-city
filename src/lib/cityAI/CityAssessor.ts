/**
 * City Assessor
 * 
 * "Space is big. You just won't believe how vastly, hugely, mind-bogglingly
 * big it is. I mean, you may think it's a long way down the road to the
 * chemist's, but that's just peanuts to space."
 * 
 * And so it is with city assessment - there's a lot to evaluate.
 * This module provides comprehensive city state analysis for the AI planner.
 */

import { GameState, Tile, Stats, ServiceCoverage } from '@/games/isocity/types';
import { CryptoEconomyState } from '@/games/isocity/crypto/types';
import {
  CityAssessment,
  PopulationTrend,
  TreasuryHealth,
  RCIDemandBalance,
  ServiceGap,
  HousingShortage,
  EmploymentStats,
  PrioritizedIssue,
  AI_GOALS,
} from './types';

// =============================================================================
// ASSESSMENT CONFIGURATION
// =============================================================================

/**
 * Priority weights for different issue types.
 * Higher weight = addressed first by the AI planner.
 */
const ISSUE_PRIORITY_WEIGHTS = {
  active_disaster: 100,      // Disasters are top priority
  critical_treasury: 90,     // Can't build without money
  power_shortage: 80,        // Buildings need power
  water_shortage: 75,        // Buildings need water
  declining_population: 70,  // People leaving is bad
  low_happiness: 65,         // Unhappy people leave
  high_unemployment: 60,     // No jobs = unhappy people
  housing_shortage: 55,      // Can't grow without housing
  rci_imbalance: 50,         // Demand balance affects growth
  service_gap: 40,           // Services improve quality of life
  low_treasury: 30,          // Low but not critical
};

// =============================================================================
// MAIN ASSESSMENT FUNCTION
// =============================================================================

/**
 * Assess the current state of the city.
 * Returns a comprehensive snapshot of everything the AI needs to make decisions.
 * 
 * @param gameState - Current game state
 * @param cryptoEconomy - Optional crypto economy state
 * @returns Complete city assessment
 */
export function assessCityState(
  gameState: GameState,
  cryptoEconomy?: CryptoEconomyState | null
): CityAssessment {
  const { stats, grid, gridSize, services, history } = gameState;
  
  // Calculate population trend from history
  const populationTrend = calculatePopulationTrend(stats.population, history);
  
  // Calculate employment statistics
  const employment = calculateEmploymentStats(stats);
  
  // Calculate housing shortage
  const housingShortage = calculateHousingShortage(grid, gridSize, stats);
  
  // Calculate RCI demand balance
  const demandBalance = calculateDemandBalance(stats);
  const isDemandBalanced = checkDemandBalance(demandBalance);
  
  // Assess treasury health
  const treasuryHealth = assessTreasuryHealth(stats);
  
  // Find service coverage gaps
  const serviceGaps = findServiceGaps(grid, gridSize, services);
  
  // Calculate power and water coverage
  const { powerCoverage, waterCoverage } = calculateUtilityCoverage(
    grid,
    gridSize,
    services
  );
  
  // Check happiness
  const isUnhappy = stats.happiness < AI_GOALS.minHappiness;
  
  // Count active disasters
  const activeDisasters = countActiveDisasters(grid, gridSize);
  
  // Build prioritized issues list
  const prioritizedIssues = buildPrioritizedIssues({
    populationTrend,
    employment,
    housingShortage,
    demandBalance,
    isDemandBalanced,
    treasuryHealth,
    serviceGaps,
    powerCoverage,
    waterCoverage,
    happiness: stats.happiness,
    isUnhappy,
    activeDisasters,
    stats,
  });
  
  return {
    timestamp: Date.now(),
    
    // Population & Economy
    population: stats.population,
    populationTrend,
    jobs: stats.jobs,
    employment,
    housingShortage,
    
    // Demand & Balance
    demandBalance,
    isDemandBalanced,
    
    // Treasury
    money: stats.money,
    income: stats.income,
    expenses: stats.expenses,
    treasuryHealth,
    
    // Services
    serviceGaps,
    powerCoverage,
    waterCoverage,
    
    // Happiness
    happiness: stats.happiness,
    isUnhappy,
    
    // Active Issues
    activeDisasters,
    prioritizedIssues,
    
    // Crypto Economy
    hasCryptoEconomy: !!cryptoEconomy,
    cryptoBuildingCount: cryptoEconomy?.buildingCount ?? 0,
    cryptoTreasury: cryptoEconomy?.treasury ?? 0,
    cryptoYield: cryptoEconomy?.dailyYield ?? 0,
  };
}

// =============================================================================
// POPULATION ANALYSIS
// =============================================================================

/**
 * Calculate population trend from history.
 * Looks at recent history to determine if population is growing, stable, or declining.
 */
function calculatePopulationTrend(
  currentPopulation: number,
  history: GameState['history']
): PopulationTrend {
  if (!history || history.length < 3) {
    return 'stable';
  }
  
  // Look at last 5 history entries (or fewer if not available)
  const recentHistory = history.slice(-5);
  
  if (recentHistory.length < 2) {
    return 'stable';
  }
  
  // Calculate average change
  let totalChange = 0;
  for (let i = 1; i < recentHistory.length; i++) {
    totalChange += recentHistory[i].population - recentHistory[i - 1].population;
  }
  const avgChange = totalChange / (recentHistory.length - 1);
  
  // Compare to current population for percentage change
  const percentChange = currentPopulation > 0 
    ? (avgChange / currentPopulation) * 100 
    : 0;
  
  if (percentChange > 1) {
    return 'growing';
  } else if (percentChange < -1) {
    return 'declining';
  }
  return 'stable';
}

/**
 * Calculate employment statistics.
 */
function calculateEmploymentStats(stats: Stats): EmploymentStats {
  const { population, jobs } = stats;
  
  // If no population, can't have unemployment
  if (population === 0) {
    return {
      population,
      jobs,
      unemploymentRate: 0,
      needsMoreJobs: false,
    };
  }
  
  // Approximate workforce as 60% of population
  const workforce = population * 0.6;
  const employed = Math.min(workforce, jobs);
  const unemployed = workforce - employed;
  const unemploymentRate = unemployed / workforce;
  
  return {
    population,
    jobs,
    unemploymentRate,
    needsMoreJobs: unemploymentRate > AI_GOALS.maxUnemploymentRate,
  };
}

// =============================================================================
// HOUSING ANALYSIS
// =============================================================================

/**
 * Calculate housing shortage.
 * Compares population to available residential capacity.
 */
function calculateHousingShortage(
  grid: Tile[][],
  gridSize: number,
  stats: Stats
): HousingShortage | null {
  let totalCapacity = 0;
  const emptyResidentialZones: { x: number; y: number }[] = [];
  
  // Scan grid for residential capacity and empty zones
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const tile = grid[y][x];
      
      // Count residential population capacity
      if (tile.building.population > 0) {
        totalCapacity += tile.building.population * 1.2; // Add 20% buffer
      }
      
      // Find empty residential zones that could be developed
      if (
        tile.zone === 'residential' &&
        (tile.building.type === 'grass' || tile.building.type === 'tree')
      ) {
        emptyResidentialZones.push({ x, y });
      }
    }
  }
  
  const shortage = stats.population - totalCapacity;
  
  if (shortage <= 0) {
    return null; // No shortage
  }
  
  // Calculate severity (0-1)
  const severity = Math.min(1, shortage / Math.max(1, stats.population));
  
  return {
    unhoused: Math.ceil(shortage),
    suggestedPositions: emptyResidentialZones.slice(0, 10), // Top 10 suggestions
    severity,
  };
}

// =============================================================================
// DEMAND BALANCE ANALYSIS
// =============================================================================

/**
 * Calculate RCI demand balance.
 * Returns normalized demand values (-100 to 100) for each zone type.
 */
function calculateDemandBalance(stats: Stats): RCIDemandBalance {
  // Normalize demand values to -100 to 100 range
  // The game's internal demand is 0-100, we need to center it
  return {
    residential: (stats.demand.residential - 50) * 2,
    commercial: (stats.demand.commercial - 50) * 2,
    industrial: (stats.demand.industrial - 50) * 2,
  };
}

/**
 * Check if demand is balanced within threshold.
 */
function checkDemandBalance(demandBalance: RCIDemandBalance): boolean {
  const threshold = AI_GOALS.rciBalanceThreshold * 100; // Convert to same scale
  
  return (
    Math.abs(demandBalance.residential) < threshold &&
    Math.abs(demandBalance.commercial) < threshold &&
    Math.abs(demandBalance.industrial) < threshold
  );
}

// =============================================================================
// TREASURY ANALYSIS
// =============================================================================

/**
 * Assess treasury health.
 */
function assessTreasuryHealth(stats: Stats): TreasuryHealth {
  const { money, income, expenses } = stats;
  const monthlyBalance = income - expenses;
  
  // Critical: Less than 2 months of expenses and losing money
  if (money < expenses * 2 && monthlyBalance < 0) {
    return 'critical';
  }
  
  // Deficit: Losing money but have some buffer
  if (monthlyBalance < 0) {
    return 'deficit';
  }
  
  // Surplus: Making money and have good buffer
  if (monthlyBalance > 0 && money > AI_GOALS.treasuryBuffer * 10) {
    return 'surplus';
  }
  
  return 'balanced';
}

// =============================================================================
// SERVICE COVERAGE ANALYSIS
// =============================================================================

/**
 * Find gaps in service coverage.
 * Identifies areas that lack police, fire, health, or education coverage.
 */
function findServiceGaps(
  grid: Tile[][],
  gridSize: number,
  services: ServiceCoverage
): ServiceGap[] {
  const gaps: ServiceGap[] = [];
  const serviceTypes: Array<'police' | 'fire' | 'health' | 'education'> = [
    'police',
    'fire',
    'health',
    'education',
  ];
  
  // For each service type, find areas with low coverage
  for (const serviceType of serviceTypes) {
    const serviceGrid = services[serviceType];
    
    // Find the worst-covered areas
    const lowCoverageAreas: { x: number; y: number; coverage: number }[] = [];
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = grid[y][x];
        const coverage = serviceGrid[y][x];
        
        // Only care about developed tiles with low coverage
        if (
          tile.zone !== 'none' &&
          tile.building.type !== 'grass' &&
          tile.building.type !== 'water' &&
          coverage < 30 // Less than 30% coverage
        ) {
          lowCoverageAreas.push({ x, y, coverage });
        }
      }
    }
    
    // Sort by coverage (lowest first) and take top issues
    lowCoverageAreas.sort((a, b) => a.coverage - b.coverage);
    
    // Group nearby low coverage areas and report as single gaps
    const reportedGaps = groupNearbyAreas(lowCoverageAreas, 10);
    
    for (const gap of reportedGaps.slice(0, 3)) { // Max 3 gaps per service type
      gaps.push({
        serviceType,
        position: { x: gap.x, y: gap.y },
        severity: 1 - (gap.coverage / 100),
        affectedRadius: 5,
      });
    }
  }
  
  return gaps;
}

/**
 * Group nearby areas to avoid reporting same gap multiple times.
 */
function groupNearbyAreas(
  areas: { x: number; y: number; coverage: number }[],
  radius: number
): { x: number; y: number; coverage: number }[] {
  const groups: { x: number; y: number; coverage: number }[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < areas.length; i++) {
    if (used.has(i)) continue;
    
    const area = areas[i];
    let avgX = area.x;
    let avgY = area.y;
    let minCoverage = area.coverage;
    let count = 1;
    
    // Find nearby areas
    for (let j = i + 1; j < areas.length; j++) {
      if (used.has(j)) continue;
      
      const other = areas[j];
      const dist = Math.sqrt(
        Math.pow(area.x - other.x, 2) + Math.pow(area.y - other.y, 2)
      );
      
      if (dist <= radius) {
        avgX += other.x;
        avgY += other.y;
        minCoverage = Math.min(minCoverage, other.coverage);
        count++;
        used.add(j);
      }
    }
    
    used.add(i);
    groups.push({
      x: Math.round(avgX / count),
      y: Math.round(avgY / count),
      coverage: minCoverage,
    });
  }
  
  return groups;
}

// =============================================================================
// UTILITY COVERAGE ANALYSIS
// =============================================================================

/**
 * Calculate power and water coverage percentages.
 */
function calculateUtilityCoverage(
  grid: Tile[][],
  gridSize: number,
  services: ServiceCoverage
): { powerCoverage: number; waterCoverage: number } {
  let developedTiles = 0;
  let poweredTiles = 0;
  let wateredTiles = 0;
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const tile = grid[y][x];
      
      // Only count developed tiles
      if (
        tile.zone !== 'none' &&
        tile.building.type !== 'grass' &&
        tile.building.type !== 'water' &&
        tile.building.type !== 'empty'
      ) {
        developedTiles++;
        
        if (services.power[y][x]) {
          poweredTiles++;
        }
        if (services.water[y][x]) {
          wateredTiles++;
        }
      }
    }
  }
  
  // Avoid division by zero
  if (developedTiles === 0) {
    return { powerCoverage: 1, waterCoverage: 1 };
  }
  
  return {
    powerCoverage: poweredTiles / developedTiles,
    waterCoverage: wateredTiles / developedTiles,
  };
}

// =============================================================================
// DISASTER ANALYSIS
// =============================================================================

/**
 * Count active disasters (fires, etc.) in the city.
 */
function countActiveDisasters(grid: Tile[][], gridSize: number): number {
  let count = 0;
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const tile = grid[y][x];
      
      if (tile.building.onFire) {
        count++;
      }
    }
  }
  
  return count;
}

// =============================================================================
// PRIORITY ISSUE BUILDER
// =============================================================================

interface IssueBuilderParams {
  populationTrend: PopulationTrend;
  employment: EmploymentStats;
  housingShortage: HousingShortage | null;
  demandBalance: RCIDemandBalance;
  isDemandBalanced: boolean;
  treasuryHealth: TreasuryHealth;
  serviceGaps: ServiceGap[];
  powerCoverage: number;
  waterCoverage: number;
  happiness: number;
  isUnhappy: boolean;
  activeDisasters: number;
  stats: Stats;
}

/**
 * Build prioritized list of issues for the AI to address.
 */
function buildPrioritizedIssues(params: IssueBuilderParams): PrioritizedIssue[] {
  const issues: PrioritizedIssue[] = [];
  
  // Active disasters - highest priority
  if (params.activeDisasters > 0) {
    issues.push({
      type: 'active_disaster',
      priority: ISSUE_PRIORITY_WEIGHTS.active_disaster + params.activeDisasters * 5,
      description: `${params.activeDisasters} active fires in the city`,
      data: { count: params.activeDisasters },
    });
  }
  
  // Critical treasury
  if (params.treasuryHealth === 'critical') {
    issues.push({
      type: 'low_treasury',
      priority: ISSUE_PRIORITY_WEIGHTS.critical_treasury,
      description: 'Treasury is critically low - city may go bankrupt',
      data: { money: params.stats.money },
    });
  } else if (params.treasuryHealth === 'deficit') {
    issues.push({
      type: 'low_treasury',
      priority: ISSUE_PRIORITY_WEIGHTS.low_treasury,
      description: 'City is running a budget deficit',
      data: { money: params.stats.money },
    });
  }
  
  // Power shortage
  if (params.powerCoverage < AI_GOALS.minPowerCoverage) {
    issues.push({
      type: 'power_shortage',
      priority: ISSUE_PRIORITY_WEIGHTS.power_shortage * (1 - params.powerCoverage),
      description: `Power coverage is only ${Math.round(params.powerCoverage * 100)}%`,
      data: { coverage: params.powerCoverage },
    });
  }
  
  // Water shortage
  if (params.waterCoverage < AI_GOALS.minWaterCoverage) {
    issues.push({
      type: 'water_shortage',
      priority: ISSUE_PRIORITY_WEIGHTS.water_shortage * (1 - params.waterCoverage),
      description: `Water coverage is only ${Math.round(params.waterCoverage * 100)}%`,
      data: { coverage: params.waterCoverage },
    });
  }
  
  // Declining population
  if (params.populationTrend === 'declining') {
    issues.push({
      type: 'declining_population',
      priority: ISSUE_PRIORITY_WEIGHTS.declining_population,
      description: 'Population is declining',
    });
  }
  
  // Low happiness
  if (params.isUnhappy) {
    issues.push({
      type: 'low_happiness',
      priority: ISSUE_PRIORITY_WEIGHTS.low_happiness * (1 - params.happiness / 100),
      description: `City happiness is low at ${Math.round(params.happiness)}%`,
      data: { happiness: params.happiness },
    });
  }
  
  // High unemployment
  if (params.employment.needsMoreJobs) {
    issues.push({
      type: 'high_unemployment',
      priority: ISSUE_PRIORITY_WEIGHTS.high_unemployment * params.employment.unemploymentRate,
      description: `Unemployment rate is ${Math.round(params.employment.unemploymentRate * 100)}%`,
      data: { rate: params.employment.unemploymentRate },
    });
  }
  
  // Housing shortage
  if (params.housingShortage) {
    issues.push({
      type: 'housing_shortage',
      priority: ISSUE_PRIORITY_WEIGHTS.housing_shortage * params.housingShortage.severity,
      description: `${params.housingShortage.unhoused} citizens need housing`,
      data: { unhoused: params.housingShortage.unhoused },
    });
  }
  
  // RCI imbalance
  if (!params.isDemandBalanced) {
    const { residential, commercial, industrial } = params.demandBalance;
    const mostUnbalanced = Math.max(
      Math.abs(residential),
      Math.abs(commercial),
      Math.abs(industrial)
    );
    
    issues.push({
      type: 'rci_imbalance',
      priority: ISSUE_PRIORITY_WEIGHTS.rci_imbalance * (mostUnbalanced / 100),
      description: 'Zone demand is unbalanced',
      data: { residential, commercial, industrial },
    });
  }
  
  // Service gaps
  for (const gap of params.serviceGaps) {
    issues.push({
      type: 'service_gap',
      priority: ISSUE_PRIORITY_WEIGHTS.service_gap * gap.severity,
      description: `${gap.serviceType} coverage gap near (${gap.position.x}, ${gap.position.y})`,
      data: { serviceType: gap.serviceType, position: gap.position },
    });
  }
  
  // Sort by priority (highest first)
  issues.sort((a, b) => b.priority - a.priority);
  
  return issues;
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Get a summary of the city's health.
 * Useful for UI display.
 */
export function getCityHealthSummary(assessment: CityAssessment): {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  score: number;
  mainIssues: string[];
} {
  let score = 100;
  const mainIssues: string[] = [];
  
  // Deduct for issues
  for (const issue of assessment.prioritizedIssues.slice(0, 5)) {
    score -= issue.priority * 0.2;
    mainIssues.push(issue.description);
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  if (score >= 80) status = 'excellent';
  else if (score >= 60) status = 'good';
  else if (score >= 40) status = 'fair';
  else if (score >= 20) status = 'poor';
  else status = 'critical';
  
  return { status, score, mainIssues };
}
