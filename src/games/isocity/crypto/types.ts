/**
 * Crypto City Types
 * 
 * Extended types for crypto-themed buildings and economy system.
 * These integrate with IsoCity's base game types.
 */

import { BuildingType, Building } from '../types';

// =============================================================================
// CRYPTO TIERS
// =============================================================================
// Tier levels for crypto buildings, affects yield, risk, and influence.

export type CryptoTier = 'retail' | 'degen' | 'whale' | 'institution';

export const CRYPTO_TIER_MULTIPLIERS: Record<CryptoTier, number> = {
  retail: 1.0,
  degen: 1.5,
  whale: 2.0,
  institution: 3.0,
};

// =============================================================================
// CRYPTO CHAINS
// =============================================================================
// Supported blockchain networks for chain synergy bonuses.

export type CryptoChain = 
  | 'ethereum' | 'solana' | 'bitcoin' | 'arbitrum' | 'optimism' 
  | 'polygon' | 'base' | 'avalanche' | 'bnb' | 'sui' | 'aptos'
  | 'zksync' | 'scroll' | 'linea' | 'blast' | 'mantle' | 'hyperliquid';

// =============================================================================
// CRYPTO BUILDING CATEGORIES
// =============================================================================
// Categories for crypto-themed buildings.

export type CryptoCategory = 
  | 'defi'           // DeFi protocols (Uniswap, Aave, etc.)
  | 'exchange'       // Centralized exchanges (Binance, Coinbase)
  | 'chain'          // Blockchain-specific buildings (Ethereum HQ)
  | 'ct'             // Crypto Twitter culture (influencer studios, VC offices)
  | 'meme'           // Meme coin culture (Pepe statues, Doge fountains)
  | 'plasma'         // Custom themed buildings
  | 'stablecoin'     // Stablecoin issuers (Tether, Circle, Ethena)
  | 'infrastructure' // Oracles & bridges (Chainlink, LayerZero, Wormhole)
  | 'legends';       // Satirical crypto figure monuments (SBF Ruins, Vitalik Tower)

// =============================================================================
// TVL TIERS
// =============================================================================
// Total Value Locked tiers for DeFi protocol buildings.

export type TVLTier = 'low' | 'medium' | 'high' | 'massive';

export const TVL_TIER_VALUES: Record<TVLTier, number> = {
  low: 10000,
  medium: 100000,
  high: 1000000,
  massive: 10000000,
};

// =============================================================================
// CRYPTO EFFECTS
// =============================================================================
// Effects that crypto buildings have on the city economy.

export interface CryptoEffects {
  // Base yield generation (tokens per day)
  yieldRate: number;
  // Staking bonus multiplier (1.0 = no bonus)
  stakingBonus?: number;
  // Trading fee revenue
  tradingFees?: number;
  // Price volatility factor (0-1, higher = more volatile)
  volatility: number;
  // Risk of rug pull (0-1, probability)
  rugRisk: number;
  // Chance of receiving airdrop (0-1, probability per tick)
  airdropChance?: number;
  // Population boost to surrounding tiles
  populationBoost: number;
  // Happiness effect on surrounding tiles
  happinessEffect: number;
  // Zone of influence radius (in tiles)
  zoneRadius: number;
  // Chain synergy - bonus when near buildings on same chain
  chainSynergy: CryptoChain[];
  // Category synergy - bonus when near buildings in same category
  categorySynergy: CryptoCategory[];
}

// =============================================================================
// CRYPTO BUILDING METADATA
// =============================================================================
// Extended metadata for crypto-themed buildings.

export interface CryptoBuildingMeta {
  // Tier level
  tier: CryptoTier;
  // Protocol name (e.g., "Uniswap", "Aave")
  protocol?: string;
  // Primary blockchain
  chain: CryptoChain;
  // Launch year (for historical reference)
  launchYear?: number;
  // TVL tier for DeFi protocols
  tvlTier?: TVLTier;
  // Description text
  description: string;
  // Economic effects
  effects: CryptoEffects;
}

// =============================================================================
// CRYPTO BUILDING DEFINITION
// =============================================================================
// Extended building definition with crypto metadata.

export interface CryptoBuildingDefinition {
  // Unique identifier
  id: string;
  // Display name
  name: string;
  // Building category
  category: CryptoCategory;
  // Footprint size
  footprint: { width: number; height: number };
  // Icon emoji for UI
  icon: string;
  // Whether sprite is procedurally generated (false = use sprite images)
  isProcedural: boolean;
  // Sprite images for non-procedural buildings
  sprites?: {
    south: string;
    north?: string;
    east?: string;
    west?: string;
  };
  // Crypto-specific metadata
  crypto: CryptoBuildingMeta;
  // Cost to build
  cost: number;
}

// =============================================================================
// CRYPTO BUILDING TYPE
// =============================================================================
// The actual CryptoBuildingType is derived from the building registry keys
// in buildingRegistry.ts to ensure type safety and avoid duplication.
// Import it from buildingRegistry.ts or the main crypto module index.
// 
// This file only defines the base interfaces and enums that don't depend on
// the building registry to avoid circular dependencies.

// =============================================================================
// PLACED CRYPTO BUILDING
// =============================================================================
// Instance of a placed crypto building in the city.

export interface PlacedCryptoBuilding {
  // Unique instance ID
  id: string;
  // Building definition ID
  buildingId: string;
  // Grid position
  gridX: number;
  gridY: number;
  // When placed
  placedAt: number;
  // Accumulated yield since placement
  yieldAccumulated: number;
}

// =============================================================================
// MARKET SENTIMENT
// =============================================================================
// Market sentiment labels for the Fear/Greed index.

export type MarketSentiment = 
  | 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';

// =============================================================================
// CRYPTO ECONOMY STATE
// =============================================================================
// State for the crypto economy simulation.

export interface CryptoEconomyState {
  // Treasury balance (in tokens)
  treasury: number;
  // Daily yield generation
  dailyYield: number;
  // Total yield accumulated
  totalYield: number;
  // Total Value Locked
  tvl: number;
  // Market sentiment (0-100, Fear/Greed index)
  marketSentiment: number;
  // Number of crypto buildings
  buildingCount: number;
  // Last update timestamp
  lastUpdate: number;
  // Tick count
  tickCount: number;
  // Bankruptcy state - consecutive ticks at zero treasury
  bankruptcyCounter: number;
  // Whether currently in bankruptcy mode (buildings decaying)
  isBankrupt: boolean;
  // IDs of buildings currently decaying due to bankruptcy
  decayingBuildings: string[];
}

// =============================================================================
// CRYPTO EVENT TYPES
// =============================================================================
// Types of crypto events that can affect the city.

export type CryptoEventType =
  | 'bull_run' | 'bear_market' | 'airdrop' | 'rug_pull'
  | 'hack' | 'protocol_upgrade' | 'whale_entry' | 'ct_drama'
  | 'liquidation_cascade' | 'merge' | 'halving' | 'airdrop_season' | 'regulatory_fud';

export interface CryptoEvent {
  id: string;
  type: CryptoEventType;
  name: string;
  description: string;
  icon: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  magnitude: number; // intensity multiplier
  active: boolean;
}

// Event definition (static configuration)
export interface CryptoEventDefinition {
  type: CryptoEventType;
  name: string;
  description: string;
  icon: string;
  rarity: number; // 0-1, probability of triggering per check
  duration: number; // in milliseconds
  effects: {
    yieldMultiplier?: number;
    sentimentChange?: number;
    treasuryChange?: number;
    treasuryMultiplier?: number;
    volatilitySpike?: boolean;
  };
  exclusive?: CryptoEventType[]; // mutually exclusive events
}

