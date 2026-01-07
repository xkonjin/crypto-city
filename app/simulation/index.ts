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
