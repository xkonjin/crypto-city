/**
 * City Builder AI Module
 * 
 * "So long, and thanks for all the fish!"
 * 
 * This module provides autonomous city management AI for Crypto City.
 * When enabled, the AI will:
 * - Assess the city's current state
 * - Identify issues and prioritize them
 * - Plan and execute actions to improve the city
 * - Maintain goals: mood > 60, positive treasury, balanced RCI
 * 
 * Usage:
 * ```typescript
 * import { getCityAIManager } from '@/lib/cityAI';
 * 
 * const ai = getCityAIManager();
 * ai.enable();
 * 
 * // In game loop:
 * gameState = ai.tick(gameState, cryptoEconomy);
 * ```
 */

// Types
export * from './types';

// Assessment
export { 
  assessCityState, 
  getCityHealthSummary 
} from './CityAssessor';

// Planning
export { planActions } from './CityAIPlanner';

// Placement
export {
  scorePlacement,
  scoreCryptoPlacement,
  findBestLocation,
  findBestCryptoLocation,
  findBestLocations,
  DEFAULT_PLACEMENT_CONFIG,
} from './BuildingPlacer';

// Manager (singleton)
export {
  CityAIManager,
  getCityAIManager,
  resetCityAIManager,
} from './CityAIManager';
