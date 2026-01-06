// =============================================================================
// CRYPTO SIMULATION MODULE
// =============================================================================
// Central exports for the crypto economy simulation system.
// Import from this file to access all simulation components.

// Core economy manager (class-based)
export { 
  CryptoEconomyManager,
  cryptoEconomy,
  createInitialEconomyState,
  type PlacedCryptoBuilding,
} from './CryptoEconomyManager';

// Event manager (class-based)
export { 
  CryptoEventManager,
} from './CryptoEventManager';

// Pure function economy calculations
export {
  DEFAULT_CRYPTO_ECONOMY,
  calculateDailyYield,
  calculatePopulationBoost,
  calculateHappinessEffect,
  calculatePrestigeBonus,
  updateMarketSentiment,
  getSentimentLabel,
  getSentimentColor,
  analyzeCryptoBuildings,
  economyTick,
  formatTokenAmount,
  calculatePortfolioRisk,
  getDashboardStats,
} from './CryptoEconomy';

// Pure function event system
export {
  tryTriggerEvent,
  processActiveEvents,
  calculateEventEffects,
  calculateTreasuryImpact,
  getEventIcon,
  getEventColor,
  formatEventDuration,
  getEventPriority,
  addToEventHistory,
  getRecentEventsByType,
  getEventStats,
} from './CryptoEvents';

// Zone effects system
export {
  calculateZoneEffects,
  getZoneEffectsAtTile,
  getCombinedEffectsAtTile,
  calculateChainSynergy,
  calculateCategorySynergy,
  generateZoneHeatmap,
  getZonePreviewData,
  calculateLandValueAtTile,
  generateLandValueMap,
  checkZoneConflicts,
} from './ZoneEffects';

