/**
 * X402 NPC Economy Module
 * 
 * Exports for the x402-enabled NPC economy system.
 */

// Constants
export * from './constants';

// Types
export type {
  NPCOnChainWallet,
  NPCService,
  NPCTransaction,
  X402PaymentRequest,
  X402PaymentOption,
  X402PaymentProof,
  NPCEconomyState,
  PaymentResult,
  NPCWalletManagerConfig,
  ServiceRequest,
  ServiceResponse,
} from './types';

// Wallet Manager
export { 
  NPCWalletManager, 
  getNPCWalletManager, 
  initNPCWalletManager 
} from './NPCWalletManager';

// Service Registry
export { 
  npcServiceRegistry, 
  OCCUPATION_SERVICES, 
  UNIVERSAL_SERVICES,
  formatServicePrice,
} from './NPCServiceRegistry';

// Items & Consumables
export type {
  Item,
  ItemCategory,
  ItemRarity,
  ItemEffect,
  InventoryItem,
  ConsumptionResult,
} from './items';
export {
  ITEMS,
  ITEM_MAP,
  getItem,
  getItemsByCategory,
  getItemsByRarity,
  getItemsByPriceRange,
  getItemsForNeed,
  getAffordableItems,
  getTotalNeedEffect,
  getBestItemForNeed,
  formatItemPrice,
  getRarityColor,
  getRarityMultiplier,
} from './items';

// Service Exchange
export type {
  ServiceExchangeResult,
  ItemPurchaseResult,
  ServiceExchangeRequest,
  DailyTransactionSummary,
} from './ServiceExchange';
export { ServiceExchange, serviceExchange } from './ServiceExchange';

// Gift System
export type {
  GiftReaction,
  GiftPreferenceProfile,
  GiftResult,
  GiftHistoryEntry,
} from './GiftSystem';
export { GiftSystem, giftSystem } from './GiftSystem';

// Integration Utilities
export type {
  EconomyTickResult,
  AutonomousEconomyOptions,
} from './X402Integration';
export {
  ensureNPCHasWallet,
  ensureNPCHasServices,
  initializeX402Economy,
  processNPCEconomyTick,
  getX402EconomyOverview,
  getNPCEconomicStatus,
  DEFAULT_ECONOMY_OPTIONS,
} from './X402Integration';
