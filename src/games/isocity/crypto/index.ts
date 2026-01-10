/**
 * Crypto City Module
 * 
 * Central exports for all crypto-related functionality.
 * This module extends IsoCity with crypto-themed buildings and economy simulation.
 */

// Types - export base types from types.ts
export type {
  CryptoTier,
  CryptoChain,
  CryptoCategory,
  TVLTier,
  CryptoEffects,
  CryptoBuildingMeta,
  CryptoBuildingDefinition,
  PlacedCryptoBuilding,
  MarketSentiment,
  CryptoEconomyState,
  CryptoEventType,
  CryptoEvent,
  CryptoEventDefinition,
} from './types';

export {
  CRYPTO_TIER_MULTIPLIERS,
  TVL_TIER_VALUES,
} from './types';

// Buildings
export {
  ALL_CRYPTO_BUILDINGS,
  DEFI_BUILDINGS,
  EXCHANGE_BUILDINGS,
  CHAIN_BUILDINGS,
  CT_BUILDINGS,
  MEME_BUILDINGS,
  PLASMA_BUILDINGS,
  getCryptoBuilding,
  getCryptoBuildingsByCategory,
  getCryptoBuildingTypes,
  CRYPTO_BUILDING_COUNT,
} from './buildings';

// Building Registry - includes the derived CryptoBuildingType and ExtendedBuildingType
export type { CryptoBuildingType, ExtendedBuildingType } from './buildingRegistry';
export {
  BUILDING_CATEGORIES,
  CRYPTO_CATEGORIES,
  EXTENDED_BUILDING_STATS,
  getUnifiedBuilding,
  getBuildingsInCategory,
  isCryptoBuilding,
} from './buildingRegistry';

// Economy Manager
export {
  CryptoEconomyManager,
  cryptoEconomy,
  createInitialEconomyState,
  ECONOMY_CONFIG,
} from './CryptoEconomyManager';

// Event Manager
export {
  CryptoEventManager,
  cryptoEvents,
  CRYPTO_EVENTS,
} from './CryptoEventManager';
export type { RugPullCallback } from './CryptoEventManager';

