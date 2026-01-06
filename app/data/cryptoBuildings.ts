// =============================================================================
// CRYPTO BUILDINGS REGISTRY
// =============================================================================
// Complete registry of all crypto-themed buildings for Pogicity.
// Buildings are organized by category: DeFi, Exchanges, Chains, CT Culture, Meme
//
// Each building includes:
// - Standard building definition (footprint, sprites, etc.)
// - Crypto metadata (tier, effects, protocol info)
//
// Sprites use procedural generation with crypto palettes until
// NanoBanana API generates custom sprites for landmarks.

import { BuildingDefinition } from './buildings';
import { CryptoBuildingMeta, CryptoTier, CryptoEffects } from '../components/game/types';

// =============================================================================
// EXTENDED BUILDING TYPE WITH CRYPTO METADATA
// =============================================================================

export interface CryptoBuildingDefinition extends BuildingDefinition {
  crypto: CryptoBuildingMeta;
}

// =============================================================================
// DEFI PROTOCOL BUILDINGS
// =============================================================================
// Major DeFi protocols represented as city landmarks.
// These generate yield, provide staking bonuses, and can trigger protocol events.

export const DEFI_BUILDINGS: Record<string, CryptoBuildingDefinition> = {
  // ---------------------------------------------------------------------------
  // AAVE - Leading lending protocol
  // ---------------------------------------------------------------------------
  "aave-lending-tower": {
    id: "aave-lending-tower",
    name: "Aave Lending Tower",
    category: "defi",
    footprint: { width: 6, height: 6 },
    sprites: { south: "" },  // Procedurally generated
    icon: "🏦",
    isProcedural: true,
    crypto: {
      tier: "institution",
      protocol: "Aave",
      chain: "ethereum",
      launchYear: 2020,
      tvlTier: "massive",
      description: "The iconic Aave Lending Tower dominates the DeFi district skyline. Depositors earn interest while borrowers access liquidity.",
      effects: {
        yieldRate: 15,
        stakingBonus: 1.15,
        volatility: 0.1,
        rugRisk: 0.001,
        populationBoost: 50,
        happinessEffect: 10,
        zoneRadius: 8,
        chainSynergy: ["ethereum", "arbitrum", "optimism", "polygon"],
        categorySynergy: ["defi"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // UNISWAP - Premier DEX
  // ---------------------------------------------------------------------------
  "uniswap-exchange": {
    id: "uniswap-exchange",
    name: "Uniswap Exchange",
    category: "defi",
    footprint: { width: 4, height: 4 },
    sprites: { south: "" },
    icon: "🦄",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Uniswap",
      chain: "ethereum",
      launchYear: 2018,
      tvlTier: "massive",
      description: "The pink unicorn-topped Uniswap Exchange processes millions in trades daily. LPs earn fees from every swap.",
      effects: {
        yieldRate: 12,
        tradingFees: 20,
        volatility: 0.2,
        rugRisk: 0.002,
        populationBoost: 40,
        happinessEffect: 8,
        zoneRadius: 6,
        chainSynergy: ["ethereum", "arbitrum", "base", "polygon"],
        categorySynergy: ["defi", "exchange"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // LIDO - Liquid staking giant
  // ---------------------------------------------------------------------------
  "lido-staking-hub": {
    id: "lido-staking-hub",
    name: "Lido Staking Hub",
    category: "defi",
    footprint: { width: 5, height: 5 },
    sprites: { south: "" },
    icon: "🌊",
    isProcedural: true,
    crypto: {
      tier: "institution",
      protocol: "Lido",
      chain: "ethereum",
      launchYear: 2020,
      tvlTier: "massive",
      description: "The serene Lido Staking Hub offers liquid staking for ETH. Stake and stay liquid with stETH.",
      effects: {
        yieldRate: 18,
        stakingBonus: 1.2,
        volatility: 0.05,
        rugRisk: 0.001,
        populationBoost: 35,
        happinessEffect: 12,
        zoneRadius: 7,
        chainSynergy: ["ethereum"],
        categorySynergy: ["defi", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // PENDLE - Yield trading protocol
  // ---------------------------------------------------------------------------
  "pendle-yield-factory": {
    id: "pendle-yield-factory",
    name: "Pendle Yield Factory",
    category: "defi",
    footprint: { width: 4, height: 3 },
    sprites: { south: "" },
    icon: "⚗️",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Pendle",
      chain: "ethereum",
      launchYear: 2021,
      tvlTier: "high",
      description: "The Pendle Yield Factory splits yield into principal and yield tokens. Advanced traders maximize returns here.",
      effects: {
        yieldRate: 25,
        stakingBonus: 1.1,
        volatility: 0.25,
        rugRisk: 0.005,
        airdropChance: 0.02,
        populationBoost: 25,
        happinessEffect: 5,
        zoneRadius: 5,
        chainSynergy: ["ethereum", "arbitrum"],
        categorySynergy: ["defi"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // CURVE - Stablecoin DEX
  // ---------------------------------------------------------------------------
  "curve-finance-pool": {
    id: "curve-finance-pool",
    name: "Curve Finance Pool",
    category: "defi",
    footprint: { width: 5, height: 4 },
    sprites: { south: "" },
    icon: "🌀",
    isProcedural: true,
    crypto: {
      tier: "institution",
      protocol: "Curve",
      chain: "ethereum",
      launchYear: 2020,
      tvlTier: "massive",
      description: "The curved, pool-like Curve Finance building specializes in stablecoin swaps with minimal slippage.",
      effects: {
        yieldRate: 10,
        stakingBonus: 1.08,
        volatility: 0.03,
        rugRisk: 0.001,
        populationBoost: 30,
        happinessEffect: 15,
        zoneRadius: 6,
        chainSynergy: ["ethereum", "arbitrum", "polygon"],
        categorySynergy: ["defi"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // MAKERDAO - DAI stablecoin issuer
  // ---------------------------------------------------------------------------
  "makerdao-vault": {
    id: "makerdao-vault",
    name: "MakerDAO Vault",
    category: "defi",
    footprint: { width: 6, height: 5 },
    sprites: { south: "" },
    icon: "🏛️",
    isProcedural: true,
    crypto: {
      tier: "institution",
      protocol: "MakerDAO",
      chain: "ethereum",
      launchYear: 2017,
      tvlTier: "massive",
      description: "The ancient-styled MakerDAO Vault issues DAI stablecoins. Lock collateral, mint DAI, govern the protocol.",
      effects: {
        yieldRate: 8,
        stakingBonus: 1.12,
        volatility: 0.02,
        rugRisk: 0.0005,
        populationBoost: 45,
        happinessEffect: 18,
        prestigeBonus: 25,
        zoneRadius: 8,
        chainSynergy: ["ethereum"],
        categorySynergy: ["defi", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // COMPOUND - Algorithmic money markets
  // ---------------------------------------------------------------------------
  "compound-treasury": {
    id: "compound-treasury",
    name: "Compound Treasury",
    category: "defi",
    footprint: { width: 4, height: 4 },
    sprites: { south: "" },
    icon: "💰",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Compound",
      chain: "ethereum",
      launchYear: 2018,
      tvlTier: "high",
      description: "The sleek Compound Treasury offers algorithmic interest rates. Supply assets, earn COMP, borrow at variable rates.",
      effects: {
        yieldRate: 11,
        stakingBonus: 1.1,
        volatility: 0.08,
        rugRisk: 0.002,
        airdropChance: 0.01,
        populationBoost: 28,
        happinessEffect: 8,
        zoneRadius: 5,
        chainSynergy: ["ethereum"],
        categorySynergy: ["defi"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // YEARN - Yield aggregator
  // ---------------------------------------------------------------------------
  "yearn-strategy-lab": {
    id: "yearn-strategy-lab",
    name: "Yearn Strategy Lab",
    category: "defi",
    footprint: { width: 3, height: 3 },
    sprites: { south: "" },
    icon: "🧪",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Yearn Finance",
      chain: "ethereum",
      launchYear: 2020,
      tvlTier: "high",
      description: "Andre Cronje's legendary Yearn Strategy Lab auto-compounds yields across DeFi. Set and forget.",
      effects: {
        yieldRate: 20,
        stakingBonus: 1.25,
        volatility: 0.15,
        rugRisk: 0.003,
        upgradeChance: 0.03,
        populationBoost: 20,
        happinessEffect: 6,
        zoneRadius: 4,
        chainSynergy: ["ethereum"],
        categorySynergy: ["defi"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // GMX - Perp DEX
  // ---------------------------------------------------------------------------
  "gmx-perps-arena": {
    id: "gmx-perps-arena",
    name: "GMX Perps Arena",
    category: "defi",
    footprint: { width: 5, height: 5 },
    sprites: { south: "" },
    icon: "📊",
    isProcedural: true,
    crypto: {
      tier: "degen",
      protocol: "GMX",
      chain: "arbitrum",
      launchYear: 2021,
      tvlTier: "high",
      description: "The GMX Perps Arena hosts leverage traders. Up to 50x leverage on crypto. Real yield from liquidations.",
      effects: {
        yieldRate: 30,
        tradingFees: 35,
        volatility: 0.5,
        rugRisk: 0.01,
        populationBoost: 35,
        happinessEffect: -5,  // Stressful for the city
        zoneRadius: 6,
        chainSynergy: ["arbitrum", "avalanche"],
        categorySynergy: ["defi", "exchange"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // HYPERLIQUID - High-performance perps
  // ---------------------------------------------------------------------------
  "hyperliquid-terminal": {
    id: "hyperliquid-terminal",
    name: "Hyperliquid Terminal",
    category: "defi",
    footprint: { width: 4, height: 4 },
    sprites: { south: "" },
    icon: "⚡",
    isProcedural: true,
    crypto: {
      tier: "degen",
      protocol: "Hyperliquid",
      chain: "hyperliquid",
      launchYear: 2023,
      tvlTier: "high",
      description: "The neon-lit Hyperliquid Terminal processes trades in milliseconds. The future of on-chain perps.",
      effects: {
        yieldRate: 35,
        tradingFees: 40,
        volatility: 0.6,
        rugRisk: 0.02,
        airdropChance: 0.05,
        populationBoost: 40,
        happinessEffect: -8,
        zoneRadius: 5,
        chainSynergy: ["hyperliquid"],
        categorySynergy: ["defi", "exchange"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // EIGENLAYER - Restaking protocol
  // ---------------------------------------------------------------------------
  "eigenlayer-restaking-hub": {
    id: "eigenlayer-restaking-hub",
    name: "EigenLayer Restaking Hub",
    category: "defi",
    footprint: { width: 5, height: 5 },
    sprites: { south: "" },
    icon: "🔄",
    isProcedural: true,
    crypto: {
      tier: "institution",
      protocol: "EigenLayer",
      chain: "ethereum",
      launchYear: 2023,
      tvlTier: "massive",
      description: "The EigenLayer Restaking Hub enables restaking of staked ETH. Secure multiple protocols with the same stake.",
      effects: {
        yieldRate: 22,
        stakingBonus: 1.3,
        volatility: 0.12,
        rugRisk: 0.005,
        airdropChance: 0.08,
        populationBoost: 45,
        happinessEffect: 10,
        zoneRadius: 7,
        chainSynergy: ["ethereum"],
        categorySynergy: ["defi", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // MORPHO - Lending optimizer
  // ---------------------------------------------------------------------------
  "morpho-optimizer": {
    id: "morpho-optimizer",
    name: "Morpho Optimizer",
    category: "defi",
    footprint: { width: 3, height: 4 },
    sprites: { south: "" },
    icon: "🦋",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Morpho",
      chain: "ethereum",
      launchYear: 2022,
      tvlTier: "high",
      description: "The Morpho Optimizer sits atop Aave and Compound, optimizing rates for better yields.",
      effects: {
        yieldRate: 14,
        stakingBonus: 1.18,
        volatility: 0.08,
        rugRisk: 0.003,
        populationBoost: 18,
        happinessEffect: 7,
        zoneRadius: 4,
        chainSynergy: ["ethereum", "base"],
        categorySynergy: ["defi"],
      },
    },
  },
};

// =============================================================================
// EXCHANGE BUILDINGS
// =============================================================================
// Major centralized and decentralized exchanges.
// High trading volume, institutional presence, but also hack/rug risks.

export const EXCHANGE_BUILDINGS: Record<string, CryptoBuildingDefinition> = {
  // ---------------------------------------------------------------------------
  // COINBASE - US regulated exchange
  // ---------------------------------------------------------------------------
  "coinbase-tower": {
    id: "coinbase-tower",
    name: "Coinbase Tower",
    category: "exchange",
    footprint: { width: 8, height: 8 },
    sprites: { south: "" },
    icon: "🏢",
    isProcedural: true,
    crypto: {
      tier: "institution",
      protocol: "Coinbase",
      chain: "base",
      launchYear: 2012,
      tvlTier: "massive",
      description: "The towering Coinbase headquarters brings institutional credibility. Publicly traded, regulated, trusted.",
      effects: {
        yieldRate: 5,
        tradingFees: 50,
        volatility: 0.05,
        rugRisk: 0.0001,
        hackRisk: 0.001,
        populationBoost: 100,
        happinessEffect: 25,
        prestigeBonus: 50,
        zoneRadius: 12,
        chainSynergy: ["ethereum", "base"],
        categorySynergy: ["exchange", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // BINANCE - Global exchange giant
  // ---------------------------------------------------------------------------
  "binance-megaplex": {
    id: "binance-megaplex",
    name: "Binance Megaplex",
    category: "exchange",
    footprint: { width: 10, height: 8 },
    sprites: { south: "" },
    icon: "🌐",
    isProcedural: true,
    crypto: {
      tier: "institution",
      protocol: "Binance",
      chain: "bnb",
      launchYear: 2017,
      tvlTier: "massive",
      description: "The massive Binance Megaplex dominates the exchange district. CZ built an empire here.",
      effects: {
        yieldRate: 8,
        tradingFees: 80,
        volatility: 0.15,
        rugRisk: 0.002,
        hackRisk: 0.005,
        dramaChance: 0.02,
        populationBoost: 120,
        happinessEffect: 15,
        prestigeBonus: 40,
        zoneRadius: 15,
        chainSynergy: ["bnb", "ethereum"],
        categorySynergy: ["exchange"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // KRAKEN - Security-focused exchange
  // ---------------------------------------------------------------------------
  "kraken-fortress": {
    id: "kraken-fortress",
    name: "Kraken Fortress",
    category: "exchange",
    footprint: { width: 6, height: 6 },
    sprites: { south: "" },
    icon: "🐙",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Kraken",
      chain: "ethereum",
      launchYear: 2011,
      tvlTier: "high",
      description: "The fortress-like Kraken exchange has never been hacked. Security is paramount in these halls.",
      effects: {
        yieldRate: 4,
        tradingFees: 35,
        volatility: 0.03,
        rugRisk: 0.0001,
        hackRisk: 0.0005,
        populationBoost: 60,
        happinessEffect: 20,
        prestigeBonus: 35,
        zoneRadius: 8,
        chainSynergy: ["ethereum", "bitcoin"],
        categorySynergy: ["exchange"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // FTX RUINS - Cautionary tale
  // ---------------------------------------------------------------------------
  "ftx-ruins": {
    id: "ftx-ruins",
    name: "FTX Ruins (Memorial)",
    category: "exchange",
    footprint: { width: 4, height: 4 },
    sprites: { south: "" },
    icon: "🏚️",
    isProcedural: true,
    crypto: {
      tier: "degen",
      protocol: "FTX",
      chain: "solana",
      launchYear: 2019,
      tvlTier: "low",
      description: "The crumbling FTX Ruins stand as a warning. $8B lost. Trust no one. DYOR.",
      effects: {
        yieldRate: 0,
        volatility: 0.0,
        rugRisk: 0.0,  // Already rugged
        populationBoost: -20,
        happinessEffect: -30,
        prestigeBonus: -50,
        zoneRadius: 6,
        chainSynergy: [],
        categorySynergy: [],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // dYdX - Decentralized perps
  // ---------------------------------------------------------------------------
  "dydx-trading-floor": {
    id: "dydx-trading-floor",
    name: "dYdX Trading Floor",
    category: "exchange",
    footprint: { width: 5, height: 4 },
    sprites: { south: "" },
    icon: "📈",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "dYdX",
      chain: "dydx",
      launchYear: 2019,
      tvlTier: "high",
      description: "The dYdX Trading Floor brings perpetual futures on-chain. True decentralization for derivatives.",
      effects: {
        yieldRate: 18,
        tradingFees: 30,
        volatility: 0.35,
        rugRisk: 0.005,
        airdropChance: 0.02,
        populationBoost: 35,
        happinessEffect: 5,
        zoneRadius: 6,
        chainSynergy: ["dydx", "ethereum"],
        categorySynergy: ["defi", "exchange"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // JUPITER - Solana DEX aggregator
  // ---------------------------------------------------------------------------
  "jupiter-aggregator": {
    id: "jupiter-aggregator",
    name: "Jupiter Aggregator",
    category: "exchange",
    footprint: { width: 3, height: 3 },
    sprites: { south: "" },
    icon: "🪐",
    isProcedural: true,
    crypto: {
      tier: "retail",
      protocol: "Jupiter",
      chain: "solana",
      launchYear: 2021,
      tvlTier: "high",
      description: "The Jupiter Aggregator finds the best swap rates across Solana. Meow's creation serves millions.",
      effects: {
        yieldRate: 8,
        tradingFees: 15,
        volatility: 0.2,
        rugRisk: 0.003,
        airdropChance: 0.04,
        populationBoost: 30,
        happinessEffect: 10,
        zoneRadius: 4,
        chainSynergy: ["solana"],
        categorySynergy: ["defi", "exchange"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // BYBIT - Major Asian exchange
  // ---------------------------------------------------------------------------
  "bybit-tower": {
    id: "bybit-tower",
    name: "Bybit Tower",
    category: "exchange",
    footprint: { width: 5, height: 5 },
    sprites: { south: "" },
    icon: "🏙️",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Bybit",
      chain: "ethereum",
      launchYear: 2018,
      tvlTier: "high",
      description: "The Bybit Tower caters to Asian markets with deep liquidity and leverage trading.",
      effects: {
        yieldRate: 6,
        tradingFees: 40,
        volatility: 0.25,
        rugRisk: 0.005,
        hackRisk: 0.008,
        populationBoost: 50,
        happinessEffect: 8,
        zoneRadius: 7,
        chainSynergy: ["ethereum"],
        categorySynergy: ["exchange"],
      },
    },
  },
};

// =============================================================================
// BLOCKCHAIN ECOSYSTEM BUILDINGS
// =============================================================================
// Headquarters for major blockchain ecosystems.
// Provide chain-specific synergies and attract chain-aligned population.

export const CHAIN_BUILDINGS: Record<string, CryptoBuildingDefinition> = {
  // ---------------------------------------------------------------------------
  // ETHEREUM FOUNDATION
  // ---------------------------------------------------------------------------
  "ethereum-foundation-hq": {
    id: "ethereum-foundation-hq",
    name: "Ethereum Foundation HQ",
    category: "chain",
    footprint: { width: 8, height: 6 },
    sprites: { south: "" },
    icon: "⟠",
    isProcedural: true,
    crypto: {
      tier: "institution",
      protocol: "Ethereum",
      chain: "ethereum",
      launchYear: 2014,
      tvlTier: "massive",
      description: "The stately Ethereum Foundation HQ coordinates the world computer. Vitalik walks these halls.",
      effects: {
        yieldRate: 5,
        stakingBonus: 1.2,
        volatility: 0.08,
        rugRisk: 0.0001,
        upgradeChance: 0.01,
        populationBoost: 80,
        happinessEffect: 25,
        prestigeBonus: 60,
        zoneRadius: 12,
        chainSynergy: ["ethereum", "arbitrum", "optimism", "base"],
        categorySynergy: ["defi", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // SOLANA LABS
  // ---------------------------------------------------------------------------
  "solana-labs-campus": {
    id: "solana-labs-campus",
    name: "Solana Labs Campus",
    category: "chain",
    footprint: { width: 7, height: 7 },
    sprites: { south: "" },
    icon: "◎",
    isProcedural: true,
    crypto: {
      tier: "institution",
      protocol: "Solana",
      chain: "solana",
      launchYear: 2020,
      tvlTier: "high",
      description: "The vibrant Solana Labs Campus pulses with 400ms block times. Speed and scale define this chain.",
      effects: {
        yieldRate: 10,
        stakingBonus: 1.15,
        volatility: 0.2,
        rugRisk: 0.005,
        airdropChance: 0.03,
        populationBoost: 70,
        happinessEffect: 18,
        prestigeBonus: 45,
        zoneRadius: 10,
        chainSynergy: ["solana"],
        categorySynergy: ["defi", "chain", "exchange"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // BASE CAMP
  // ---------------------------------------------------------------------------
  "base-camp": {
    id: "base-camp",
    name: "Base Camp",
    category: "chain",
    footprint: { width: 5, height: 5 },
    sprites: { south: "" },
    icon: "🔵",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Base",
      chain: "base",
      launchYear: 2023,
      tvlTier: "high",
      description: "Base Camp brings Coinbase's L2 vision to life. Onchain summer starts here.",
      effects: {
        yieldRate: 8,
        stakingBonus: 1.1,
        volatility: 0.1,
        rugRisk: 0.002,
        airdropChance: 0.02,
        populationBoost: 45,
        happinessEffect: 15,
        prestigeBonus: 30,
        zoneRadius: 7,
        chainSynergy: ["base", "ethereum"],
        categorySynergy: ["defi", "chain", "exchange"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // ARBITRUM TOWER
  // ---------------------------------------------------------------------------
  "arbitrum-tower": {
    id: "arbitrum-tower",
    name: "Arbitrum Tower",
    category: "chain",
    footprint: { width: 6, height: 6 },
    sprites: { south: "" },
    icon: "🔷",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Arbitrum",
      chain: "arbitrum",
      launchYear: 2021,
      tvlTier: "high",
      description: "The Arbitrum Tower scales Ethereum with optimistic rollups. The leading L2 by TVL.",
      effects: {
        yieldRate: 7,
        stakingBonus: 1.12,
        volatility: 0.12,
        rugRisk: 0.003,
        airdropChance: 0.015,
        populationBoost: 50,
        happinessEffect: 12,
        prestigeBonus: 35,
        zoneRadius: 8,
        chainSynergy: ["arbitrum", "ethereum"],
        categorySynergy: ["defi", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // OPTIMISM COLLECTIVE
  // ---------------------------------------------------------------------------
  "optimism-collective": {
    id: "optimism-collective",
    name: "Optimism Collective",
    category: "chain",
    footprint: { width: 5, height: 5 },
    sprites: { south: "" },
    icon: "🔴",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Optimism",
      chain: "optimism",
      launchYear: 2021,
      tvlTier: "high",
      description: "The Optimism Collective funds public goods through RetroPGF. Building optimistically for the future.",
      effects: {
        yieldRate: 6,
        stakingBonus: 1.1,
        volatility: 0.1,
        rugRisk: 0.002,
        airdropChance: 0.025,
        populationBoost: 40,
        happinessEffect: 20,  // High due to public goods
        prestigeBonus: 40,
        zoneRadius: 7,
        chainSynergy: ["optimism", "ethereum", "base"],
        categorySynergy: ["defi", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // POLYGON PLAZA
  // ---------------------------------------------------------------------------
  "polygon-plaza": {
    id: "polygon-plaza",
    name: "Polygon Plaza",
    category: "chain",
    footprint: { width: 4, height: 4 },
    sprites: { south: "" },
    icon: "🟣",
    isProcedural: true,
    crypto: {
      tier: "retail",
      protocol: "Polygon",
      chain: "polygon",
      launchYear: 2019,
      tvlTier: "high",
      description: "Polygon Plaza offers cheap and fast transactions. The scaling solution that brought DeFi to the masses.",
      effects: {
        yieldRate: 5,
        stakingBonus: 1.05,
        volatility: 0.15,
        rugRisk: 0.004,
        populationBoost: 60,
        happinessEffect: 10,
        prestigeBonus: 20,
        zoneRadius: 5,
        chainSynergy: ["polygon", "ethereum"],
        categorySynergy: ["defi", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // AVALANCHE SUMMIT
  // ---------------------------------------------------------------------------
  "avalanche-summit": {
    id: "avalanche-summit",
    name: "Avalanche Summit",
    category: "chain",
    footprint: { width: 5, height: 5 },
    sprites: { south: "" },
    icon: "🔺",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Avalanche",
      chain: "avalanche",
      launchYear: 2020,
      tvlTier: "high",
      description: "Avalanche Summit creates custom subnets for any use case. Consensus finality in under 2 seconds.",
      effects: {
        yieldRate: 9,
        stakingBonus: 1.12,
        volatility: 0.18,
        rugRisk: 0.004,
        populationBoost: 35,
        happinessEffect: 12,
        prestigeBonus: 30,
        zoneRadius: 6,
        chainSynergy: ["avalanche"],
        categorySynergy: ["defi", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // BITCOIN CITADEL
  // ---------------------------------------------------------------------------
  "bitcoin-citadel": {
    id: "bitcoin-citadel",
    name: "Bitcoin Citadel",
    category: "chain",
    footprint: { width: 8, height: 8 },
    sprites: { south: "" },
    icon: "₿",
    isProcedural: true,
    crypto: {
      tier: "institution",
      protocol: "Bitcoin",
      chain: "bitcoin",
      launchYear: 2009,
      tvlTier: "massive",
      description: "The ancient Bitcoin Citadel stores digital gold. No yield, only hodl. Laser eyes mandatory.",
      effects: {
        yieldRate: 0,  // Bitcoin doesn't yield
        stakingBonus: 1.0,
        volatility: 0.15,
        rugRisk: 0.0,  // Can't rug the OG
        populationBoost: 100,
        happinessEffect: 30,
        prestigeBonus: 100,  // Maximum prestige
        zoneRadius: 15,
        chainSynergy: ["bitcoin"],
        categorySynergy: ["chain"],
      },
    },
  },
};

// =============================================================================
// CT CULTURE / INFLUENCER BUILDINGS
// =============================================================================
// Buildings representing Crypto Twitter personalities and culture.
// Provide drama, alpha, sentiment effects, and population boosts.

export const CT_BUILDINGS: Record<string, CryptoBuildingDefinition> = {
  // ---------------------------------------------------------------------------
  // COBIE'S PENTHOUSE
  // ---------------------------------------------------------------------------
  "cobies-penthouse": {
    id: "cobies-penthouse",
    name: "Cobie's Penthouse",
    category: "ct",
    footprint: { width: 4, height: 4 },
    sprites: { south: "" },
    icon: "🎤",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "UpOnly",
      chain: "ethereum",
      description: "The legendary Cobie's Penthouse overlooks the city. Alpha leaks from the balcony. Echo launches here.",
      effects: {
        yieldRate: 5,
        airdropChance: 0.05,
        dramaChance: 0.02,
        populationBoost: 80,
        happinessEffect: 15,
        prestigeBonus: 40,
        zoneRadius: 8,
        chainSynergy: ["ethereum"],
        categorySynergy: ["ct"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // UPONLY PODCAST STUDIO
  // ---------------------------------------------------------------------------
  "uponly-studio": {
    id: "uponly-studio",
    name: "UpOnly Podcast Studio",
    category: "ct",
    footprint: { width: 3, height: 3 },
    sprites: { south: "" },
    icon: "🎙️",
    isProcedural: true,
    crypto: {
      tier: "retail",
      protocol: "UpOnly",
      chain: "ethereum",
      description: "The UpOnly Podcast Studio hosts legendary interviews. Su Zhu's famous episode was recorded here.",
      effects: {
        yieldRate: 3,
        dramaChance: 0.03,
        populationBoost: 50,
        happinessEffect: 20,
        prestigeBonus: 25,
        zoneRadius: 5,
        chainSynergy: ["ethereum"],
        categorySynergy: ["ct"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // GCR OBSERVATORY
  // ---------------------------------------------------------------------------
  "gcr-observatory": {
    id: "gcr-observatory",
    name: "GCR Observatory",
    category: "ct",
    footprint: { width: 2, height: 3 },
    sprites: { south: "" },
    icon: "🔭",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "GCR",
      chain: "ethereum",
      description: "The mysterious GCR Observatory monitors markets 24/7. His calls move millions. Legend status.",
      effects: {
        yieldRate: 2,
        volatility: 0.3,
        airdropChance: 0.03,
        populationBoost: 40,
        happinessEffect: 10,
        prestigeBonus: 50,
        zoneRadius: 6,
        chainSynergy: ["ethereum", "bitcoin"],
        categorySynergy: ["ct"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // ANSEM'S SOL MANSION
  // ---------------------------------------------------------------------------
  "ansems-sol-mansion": {
    id: "ansems-sol-mansion",
    name: "Ansem's Sol Mansion",
    category: "ct",
    footprint: { width: 4, height: 4 },
    sprites: { south: "" },
    icon: "☀️",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Solana",
      chain: "solana",
      description: "Ansem's Sol Mansion champions the Solana ecosystem. The king of Sol CT holds court here.",
      effects: {
        yieldRate: 8,
        stakingBonus: 1.15,
        airdropChance: 0.04,
        dramaChance: 0.03,
        populationBoost: 60,
        happinessEffect: 12,
        prestigeBonus: 35,
        zoneRadius: 7,
        chainSynergy: ["solana"],
        categorySynergy: ["ct", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // HSAKA'S TRADING DEN
  // ---------------------------------------------------------------------------
  "hsakas-trading-den": {
    id: "hsakas-trading-den",
    name: "Hsaka's Trading Den",
    category: "ct",
    footprint: { width: 3, height: 3 },
    sprites: { south: "" },
    icon: "📉",
    isProcedural: true,
    crypto: {
      tier: "degen",
      protocol: "Trading",
      chain: "ethereum",
      description: "Hsaka's Trading Den runs 100x leverage. Liquidation alerts echo through the night. High risk, high reward.",
      effects: {
        yieldRate: 20,
        volatility: 0.6,
        rugRisk: 0.02,
        populationBoost: 30,
        happinessEffect: -5,  // Stressful
        zoneRadius: 4,
        chainSynergy: ["ethereum"],
        categorySynergy: ["ct", "exchange"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // LOOMDART'S LAB
  // ---------------------------------------------------------------------------
  "loomdarts-lab": {
    id: "loomdarts-lab",
    name: "Loomdart's Lab",
    category: "ct",
    footprint: { width: 3, height: 3 },
    sprites: { south: "" },
    icon: "🎯",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "Research",
      chain: "ethereum",
      description: "Loomdart's Lab produces deep dives on protocols. The research alpha is unmatched.",
      effects: {
        yieldRate: 4,
        stakingBonus: 1.1,
        airdropChance: 0.02,
        populationBoost: 25,
        happinessEffect: 12,
        prestigeBonus: 30,
        zoneRadius: 4,
        chainSynergy: ["ethereum"],
        categorySynergy: ["ct", "defi"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // ANDREW KANG CAPITAL
  // ---------------------------------------------------------------------------
  "andrew-kang-capital": {
    id: "andrew-kang-capital",
    name: "Andrew Kang Capital",
    category: "ct",
    footprint: { width: 5, height: 5 },
    sprites: { south: "" },
    icon: "📊",
    isProcedural: true,
    crypto: {
      tier: "institution",
      protocol: "Mechanism Capital",
      chain: "ethereum",
      description: "Andrew Kang Capital moves markets with macro calls. Mechanism Capital's influence is legendary.",
      effects: {
        yieldRate: 10,
        stakingBonus: 1.2,
        volatility: 0.25,
        dramaChance: 0.04,
        populationBoost: 55,
        happinessEffect: 8,
        prestigeBonus: 45,
        zoneRadius: 8,
        chainSynergy: ["ethereum", "bitcoin"],
        categorySynergy: ["ct", "exchange"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // ARTHUR HAYES' HIDEOUT
  // ---------------------------------------------------------------------------
  "arthur-hayes-hideout": {
    id: "arthur-hayes-hideout",
    name: "Arthur Hayes' Hideout",
    category: "ct",
    footprint: { width: 4, height: 3 },
    sprites: { south: "" },
    icon: "🎰",
    isProcedural: true,
    crypto: {
      tier: "whale",
      protocol: "BitMEX",
      chain: "bitcoin",
      description: "Arthur Hayes' Hideout plots the next 100x trade. The BitMEX legend's essays move markets.",
      effects: {
        yieldRate: 15,
        volatility: 0.4,
        dramaChance: 0.05,
        populationBoost: 45,
        happinessEffect: 5,
        prestigeBonus: 40,
        zoneRadius: 6,
        chainSynergy: ["bitcoin", "ethereum"],
        categorySynergy: ["ct", "exchange"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // DEFILLAMA WATCHTOWER
  // ---------------------------------------------------------------------------
  "defillama-watchtower": {
    id: "defillama-watchtower",
    name: "DefiLlama Watchtower",
    category: "ct",
    footprint: { width: 3, height: 4 },
    sprites: { south: "" },
    icon: "🦙",
    isProcedural: true,
    crypto: {
      tier: "retail",
      protocol: "DefiLlama",
      chain: "ethereum",
      description: "The DefiLlama Watchtower tracks TVL across all chains. Open source, no ads, based llamas.",
      effects: {
        yieldRate: 2,
        stakingBonus: 1.05,
        populationBoost: 35,
        happinessEffect: 18,
        prestigeBonus: 30,
        zoneRadius: 6,
        chainSynergy: ["ethereum", "solana", "arbitrum", "optimism", "base"],
        categorySynergy: ["ct", "defi"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // BANKLESS HQ
  // ---------------------------------------------------------------------------
  "bankless-hq": {
    id: "bankless-hq",
    name: "Bankless HQ",
    category: "ct",
    footprint: { width: 4, height: 4 },
    sprites: { south: "" },
    icon: "🏴",
    isProcedural: true,
    crypto: {
      tier: "retail",
      protocol: "Bankless",
      chain: "ethereum",
      description: "Bankless HQ spreads the crypto gospel. Ryan and David educate millions on going bankless.",
      effects: {
        yieldRate: 3,
        airdropChance: 0.02,
        populationBoost: 70,
        happinessEffect: 22,
        prestigeBonus: 35,
        zoneRadius: 7,
        chainSynergy: ["ethereum"],
        categorySynergy: ["ct"],
      },
    },
  },
};

// =============================================================================
// MEME CULTURE PROPS
// =============================================================================
// Props and decorations representing crypto meme culture.
// Smaller footprints, various happiness/sentiment effects.

export const MEME_PROPS: Record<string, CryptoBuildingDefinition> = {
  // ---------------------------------------------------------------------------
  // PEPE STATUE
  // ---------------------------------------------------------------------------
  "pepe-statue": {
    id: "pepe-statue",
    name: "Pepe Statue",
    category: "meme",
    footprint: { width: 2, height: 2 },
    sprites: { south: "" },
    icon: "🐸",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "degen",
      description: "The legendary Pepe Statue brings meme magic to your city. Feels good man.",
      effects: {
        yieldRate: 2,
        volatility: 0.3,
        airdropChance: 0.02,
        populationBoost: 20,
        happinessEffect: 10,
        zoneRadius: 3,
        categorySynergy: ["meme"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // WOJAK MEMORIAL
  // ---------------------------------------------------------------------------
  "wojak-memorial": {
    id: "wojak-memorial",
    name: "Wojak Memorial",
    category: "meme",
    footprint: { width: 1, height: 2 },
    sprites: { south: "" },
    icon: "😢",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "degen",
      description: "The Wojak Memorial honors all those who bought the top. Despair in dumps, joy in pumps.",
      effects: {
        volatility: 0.2,
        populationBoost: 10,
        happinessEffect: -5,  // Reminder of losses
        zoneRadius: 2,
        categorySynergy: ["meme"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // DIAMOND HANDS MONUMENT
  // ---------------------------------------------------------------------------
  "diamond-hands-monument": {
    id: "diamond-hands-monument",
    name: "Diamond Hands Monument",
    category: "meme",
    footprint: { width: 2, height: 2 },
    sprites: { south: "" },
    icon: "💎",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "retail",
      description: "The Diamond Hands Monument inspires hodlers to never sell. Reduces panic during crashes.",
      effects: {
        volatility: -0.15,  // Reduces volatility!
        populationBoost: 25,
        happinessEffect: 15,
        zoneRadius: 4,
        categorySynergy: ["meme"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // PAPER HANDS FOUNTAIN
  // ---------------------------------------------------------------------------
  "paper-hands-fountain": {
    id: "paper-hands-fountain",
    name: "Paper Hands Fountain",
    category: "meme",
    footprint: { width: 2, height: 2 },
    sprites: { south: "" },
    icon: "📄",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "degen",
      description: "The Paper Hands Fountain commemorates panic sellers. Water flows like weak hands selling.",
      effects: {
        volatility: 0.25,  // Increases volatility
        populationBoost: 5,
        happinessEffect: -10,
        zoneRadius: 3,
        categorySynergy: ["meme"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // RUG PULL CRATER
  // ---------------------------------------------------------------------------
  "rug-pull-crater": {
    id: "rug-pull-crater",
    name: "Rug Pull Crater",
    category: "meme",
    footprint: { width: 3, height: 3 },
    sprites: { south: "" },
    icon: "🕳️",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "degen",
      description: "The Rug Pull Crater marks where a project once stood. A warning to all who enter.",
      effects: {
        rugRisk: -0.02,  // Actually reduces rug risk in zone (lesson learned)
        populationBoost: -15,
        happinessEffect: -25,
        prestigeBonus: -30,
        zoneRadius: 5,
        categorySynergy: ["meme"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // TO THE MOON ROCKET
  // ---------------------------------------------------------------------------
  "moon-rocket": {
    id: "moon-rocket",
    name: "To The Moon Rocket",
    category: "meme",
    footprint: { width: 2, height: 3 },
    sprites: { south: "" },
    icon: "🚀",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "retail",
      description: "The To The Moon Rocket stands ready for liftoff. Wen moon? Soon™.",
      effects: {
        yieldRate: 5,
        volatility: 0.2,
        airdropChance: 0.03,
        populationBoost: 30,
        happinessEffect: 20,
        zoneRadius: 4,
        categorySynergy: ["meme"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // WAGMI BANNER
  // ---------------------------------------------------------------------------
  "wagmi-banner": {
    id: "wagmi-banner",
    name: "WAGMI Banner",
    category: "meme",
    footprint: { width: 1, height: 1 },
    sprites: { south: "" },
    icon: "🏳️",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "retail",
      description: "The WAGMI Banner spreads optimism. We're All Gonna Make It.",
      effects: {
        populationBoost: 10,
        happinessEffect: 8,
        zoneRadius: 2,
        categorySynergy: ["meme"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // NGMI GRAFFITI
  // ---------------------------------------------------------------------------
  "ngmi-graffiti": {
    id: "ngmi-graffiti",
    name: "NGMI Graffiti",
    category: "meme",
    footprint: { width: 1, height: 1 },
    sprites: { south: "" },
    icon: "🎨",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "degen",
      description: "Vandals sprayed NGMI on this wall. A reminder that not everyone makes it.",
      effects: {
        populationBoost: -5,
        happinessEffect: -5,
        zoneRadius: 2,
        categorySynergy: ["meme"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // DEGEN APE STATUE
  // ---------------------------------------------------------------------------
  "degen-ape-statue": {
    id: "degen-ape-statue",
    name: "Degen Ape Statue",
    category: "meme",
    footprint: { width: 2, height: 2 },
    sprites: { south: "" },
    icon: "🦍",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "degen",
      description: "The Degen Ape Statue honors NFT culture. Apes together strong.",
      effects: {
        yieldRate: 3,
        volatility: 0.35,
        airdropChance: 0.025,
        populationBoost: 25,
        happinessEffect: 8,
        zoneRadius: 3,
        categorySynergy: ["meme"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // LASER EYES BILLBOARD
  // ---------------------------------------------------------------------------
  "laser-eyes-billboard": {
    id: "laser-eyes-billboard",
    name: "Laser Eyes Billboard",
    category: "meme",
    footprint: { width: 2, height: 1 },
    sprites: { south: "" },
    icon: "👀",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "retail",
      description: "The Laser Eyes Billboard shows a Bitcoin maxi staring into the future. HODL.",
      effects: {
        populationBoost: 15,
        happinessEffect: 5,
        prestigeBonus: 10,
        zoneRadius: 3,
        chainSynergy: ["bitcoin"],
        categorySynergy: ["meme", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // GM CAFE
  // ---------------------------------------------------------------------------
  "gm-cafe": {
    id: "gm-cafe",
    name: "GM Cafe",
    category: "meme",
    footprint: { width: 2, height: 2 },
    sprites: { south: "" },
    icon: "☕",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "retail",
      description: "The GM Cafe opens every morning with 'gm' greetings. Good vibes only.",
      effects: {
        populationBoost: 20,
        happinessEffect: 15,
        zoneRadius: 3,
        categorySynergy: ["meme", "ct"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // VITALIK BUST
  // ---------------------------------------------------------------------------
  "vitalik-bust": {
    id: "vitalik-bust",
    name: "Vitalik Bust",
    category: "meme",
    footprint: { width: 1, height: 2 },
    sprites: { south: "" },
    icon: "🗿",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "retail",
      description: "A bust of Vitalik Buterin, Ethereum's co-founder. The boy genius who changed everything.",
      effects: {
        stakingBonus: 1.05,
        populationBoost: 25,
        happinessEffect: 12,
        prestigeBonus: 20,
        zoneRadius: 3,
        chainSynergy: ["ethereum"],
        categorySynergy: ["meme", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // SATOSHI SHRINE
  // ---------------------------------------------------------------------------
  "satoshi-shrine": {
    id: "satoshi-shrine",
    name: "Satoshi Shrine",
    category: "meme",
    footprint: { width: 2, height: 2 },
    sprites: { south: "" },
    icon: "⛩️",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "institution",
      description: "The mysterious Satoshi Shrine honors Bitcoin's anonymous creator. 21 million and no more.",
      effects: {
        populationBoost: 40,
        happinessEffect: 20,
        prestigeBonus: 50,
        zoneRadius: 5,
        chainSynergy: ["bitcoin"],
        categorySynergy: ["meme", "chain"],
      },
    },
  },
  
  // ---------------------------------------------------------------------------
  // PROBABLY NOTHING SIGN
  // ---------------------------------------------------------------------------
  "probably-nothing-sign": {
    id: "probably-nothing-sign",
    name: "Probably Nothing Sign",
    category: "meme",
    footprint: { width: 1, height: 1 },
    sprites: { south: "" },
    icon: "🪧",
    isProcedural: true,
    isDecoration: true,
    crypto: {
      tier: "degen",
      description: "A cryptic sign reading 'Probably Nothing'. When you see it, you know something's happening.",
      effects: {
        airdropChance: 0.04,
        populationBoost: 8,
        happinessEffect: 5,
        zoneRadius: 2,
        categorySynergy: ["meme"],
      },
    },
  },
};

// =============================================================================
// PLASMA PARTNER BUILDINGS
// =============================================================================
// Plasma network partner buildings - representing real crypto entities
// that work with Plasma for stablecoin infrastructure.
// Each building has AI-generated sprites and unique gameplay effects.

export const PLASMA_PARTNER_BUILDINGS: Record<string, CryptoBuildingDefinition> = {
  // ---------------------------------------------------------------------------
  // AAVE x PLASMA - DeFi Credit Layer
  // ---------------------------------------------------------------------------
  "plasma-aave": {
    id: "plasma-aave",
    name: "Aave Credit Tower",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_aave.png" },
    icon: "👻",
    isProcedural: false,
    crypto: {
      tier: "whale",
      protocol: "Aave",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "massive",
      description: "The Aave Credit Tower brings decentralized lending to Plasma.",
      effects: {
        yieldRate: 15,
        stakingBonus: 1.15,
        volatility: 0.1,
        rugRisk: 0.001,
        populationBoost: 50,
        happinessEffect: 10,
        zoneRadius: 8,
        landValueBonus: 15,
        incomePerTick: 50,
        chainSynergy: ["plasma", "ethereum"],
        categorySynergy: ["defi", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // BINANCE x PLASMA - Exchange Hub
  // ---------------------------------------------------------------------------
  "plasma-binance": {
    id: "plasma-binance",
    name: "Binance Exchange Hub",
    category: "plasma",
    footprint: { width: 3, height: 3 },
    sprites: { south: "/assets/buildings/partners/partner_binance.png" },
    icon: "💛",
    isProcedural: false,
    crypto: {
      tier: "institution",
      protocol: "Binance",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "massive",
      description: "The world's largest exchange on Plasma. Major trading volume hub.",
      effects: {
        yieldRate: 20,
        tradingFees: 25,
        volatility: 0.15,
        rugRisk: 0.001,
        populationBoost: 100,
        happinessEffect: 15,
        zoneRadius: 12,
        landValueBonus: 25,
        incomePerTick: 150,
        chainSynergy: ["plasma", "bnb"],
        categorySynergy: ["exchange", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // TETHER x PLASMA - USDT Tower
  // ---------------------------------------------------------------------------
  "plasma-tether": {
    id: "plasma-tether",
    name: "Tether USDT Tower",
    category: "plasma",
    footprint: { width: 2, height: 3 },
    sprites: { south: "/assets/buildings/partners/partner_tether.png" },
    icon: "💵",
    isProcedural: false,
    crypto: {
      tier: "institution",
      protocol: "Tether",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "massive",
      description: "The iconic USDT Tower - world's largest stablecoin HQ.",
      effects: {
        yieldRate: 10,
        stakingBonus: 1.2,
        volatility: 0.02,
        rugRisk: 0.0001,
        populationBoost: 80,
        happinessEffect: 12,
        zoneRadius: 12,
        landValueBonus: 20,
        incomePerTick: 100,
        crimeReduction: 10,
        chainSynergy: ["plasma", "ethereum", "tron"],
        categorySynergy: ["stablecoin", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // ETHERFI x PLASMA - Staking Center
  // ---------------------------------------------------------------------------
  "plasma-etherfi": {
    id: "plasma-etherfi",
    name: "EtherFi Staking Center",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_etherfi.png" },
    icon: "💎",
    isProcedural: false,
    crypto: {
      tier: "whale",
      protocol: "EtherFi",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "large",
      description: "Non-custodial staking protocol on Plasma.",
      effects: {
        yieldRate: 12,
        stakingBonus: 1.18,
        volatility: 0.08,
        rugRisk: 0.002,
        populationBoost: 35,
        happinessEffect: 8,
        zoneRadius: 6,
        landValueBonus: 12,
        incomePerTick: 35,
        chainSynergy: ["plasma", "ethereum"],
        categorySynergy: ["defi", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // ETHENA x PLASMA - USDe Hub
  // ---------------------------------------------------------------------------
  "plasma-ethena": {
    id: "plasma-ethena",
    name: "Ethena USDe Hub",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_ethena.png" },
    icon: "🟢",
    isProcedural: false,
    crypto: {
      tier: "whale",
      protocol: "Ethena",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "large",
      description: "Synthetic dollar protocol headquarters.",
      effects: {
        yieldRate: 14,
        stakingBonus: 1.12,
        volatility: 0.05,
        rugRisk: 0.003,
        populationBoost: 40,
        happinessEffect: 10,
        zoneRadius: 7,
        landValueBonus: 14,
        incomePerTick: 40,
        chainSynergy: ["plasma", "ethereum"],
        categorySynergy: ["stablecoin", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // PENDLE x PLASMA - Yield Tower
  // ---------------------------------------------------------------------------
  "plasma-pendle": {
    id: "plasma-pendle",
    name: "Pendle Yield Tower",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_pendle.png" },
    icon: "⏰",
    isProcedural: false,
    crypto: {
      tier: "whale",
      protocol: "Pendle",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "large",
      description: "Yield trading protocol. Trade future yield on Plasma.",
      effects: {
        yieldRate: 18,
        stakingBonus: 1.1,
        volatility: 0.12,
        rugRisk: 0.002,
        populationBoost: 35,
        happinessEffect: 8,
        zoneRadius: 6,
        landValueBonus: 12,
        incomePerTick: 45,
        chainSynergy: ["plasma", "ethereum", "arbitrum"],
        categorySynergy: ["defi", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // ROBINHOOD x PLASMA - Trading Tower
  // ---------------------------------------------------------------------------
  "plasma-robinhood": {
    id: "plasma-robinhood",
    name: "Robinhood Trading Tower",
    category: "plasma",
    footprint: { width: 2, height: 3 },
    sprites: { south: "/assets/buildings/partners/partner_robinhood.png" },
    icon: "🪶",
    isProcedural: false,
    crypto: {
      tier: "whale",
      protocol: "Robinhood",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "massive",
      description: "Commission-free trading on Plasma.",
      effects: {
        yieldRate: 8,
        tradingFees: 15,
        volatility: 0.1,
        rugRisk: 0.001,
        populationBoost: 60,
        happinessEffect: 12,
        zoneRadius: 10,
        landValueBonus: 18,
        incomePerTick: 80,
        chainSynergy: ["plasma"],
        categorySynergy: ["exchange", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // TRUSTWALLET x PLASMA - Wallet Center
  // ---------------------------------------------------------------------------
  "plasma-trustwallet": {
    id: "plasma-trustwallet",
    name: "Trust Wallet Center",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_trustwallet.png" },
    icon: "🛡️",
    isProcedural: false,
    crypto: {
      tier: "shark",
      protocol: "Trust Wallet",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "medium",
      description: "Multi-chain crypto wallet headquarters.",
      effects: {
        yieldRate: 5,
        volatility: 0.05,
        rugRisk: 0.001,
        populationBoost: 25,
        happinessEffect: 8,
        zoneRadius: 5,
        landValueBonus: 8,
        incomePerTick: 25,
        crimeReduction: 15,
        chainSynergy: ["plasma", "ethereum", "bnb"],
        categorySynergy: ["wallet", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // BRIDGE x PLASMA - Infrastructure Gateway
  // ---------------------------------------------------------------------------
  "plasma-bridge": {
    id: "plasma-bridge",
    name: "Bridge Gateway",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_bridge.png" },
    icon: "🌉",
    isProcedural: false,
    crypto: {
      tier: "shark",
      protocol: "Bridge",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "medium",
      description: "Stablecoin infrastructure gateway.",
      effects: {
        yieldRate: 8,
        volatility: 0.03,
        rugRisk: 0.001,
        populationBoost: 30,
        happinessEffect: 6,
        zoneRadius: 8,
        landValueBonus: 10,
        incomePerTick: 30,
        trafficReduction: 10,
        chainSynergy: ["plasma", "ethereum", "solana"],
        categorySynergy: ["infrastructure", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // RAIN x PLASMA - MENA Exchange
  // ---------------------------------------------------------------------------
  "plasma-rain": {
    id: "plasma-rain",
    name: "Rain Finance Tower",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_rain.png" },
    icon: "🌧️",
    isProcedural: false,
    crypto: {
      tier: "shark",
      protocol: "Rain",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "medium",
      description: "Middle East & North Africa's premier crypto exchange.",
      effects: {
        yieldRate: 10,
        tradingFees: 12,
        volatility: 0.08,
        rugRisk: 0.002,
        populationBoost: 45,
        happinessEffect: 10,
        zoneRadius: 8,
        landValueBonus: 14,
        incomePerTick: 55,
        chainSynergy: ["plasma"],
        categorySynergy: ["exchange", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // MAPLE x PLASMA - Institutional Lending
  // ---------------------------------------------------------------------------
  "plasma-maple": {
    id: "plasma-maple",
    name: "Maple Lending Center",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_maple.png" },
    icon: "🍁",
    isProcedural: false,
    crypto: {
      tier: "whale",
      protocol: "Maple",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "large",
      description: "Institutional lending protocol.",
      effects: {
        yieldRate: 15,
        stakingBonus: 1.12,
        volatility: 0.06,
        rugRisk: 0.003,
        populationBoost: 40,
        happinessEffect: 8,
        zoneRadius: 7,
        landValueBonus: 15,
        incomePerTick: 45,
        chainSynergy: ["plasma", "ethereum"],
        categorySynergy: ["defi", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // YELLOW CARD x PLASMA - Africa Exchange
  // ---------------------------------------------------------------------------
  "plasma-yellowcard": {
    id: "plasma-yellowcard",
    name: "Yellow Card Exchange",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_yellowcard.png" },
    icon: "🟨",
    isProcedural: false,
    crypto: {
      tier: "shark",
      protocol: "Yellow Card",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "medium",
      description: "Africa's largest crypto exchange.",
      effects: {
        yieldRate: 8,
        tradingFees: 10,
        volatility: 0.1,
        rugRisk: 0.003,
        populationBoost: 35,
        happinessEffect: 8,
        zoneRadius: 7,
        landValueBonus: 10,
        incomePerTick: 40,
        chainSynergy: ["plasma"],
        categorySynergy: ["exchange", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // ZEROHASH x PLASMA - B2B Infrastructure
  // ---------------------------------------------------------------------------
  "plasma-zerohash": {
    id: "plasma-zerohash",
    name: "Zero Hash Infrastructure",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_zerohash.png" },
    icon: "⚫",
    isProcedural: false,
    crypto: {
      tier: "shark",
      protocol: "Zero Hash",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "medium",
      description: "B2B crypto infrastructure powering fintech.",
      effects: {
        yieldRate: 6,
        volatility: 0.04,
        rugRisk: 0.001,
        populationBoost: 25,
        happinessEffect: 5,
        zoneRadius: 10,
        landValueBonus: 12,
        incomePerTick: 30,
        trafficReduction: 5,
        chainSynergy: ["plasma"],
        categorySynergy: ["infrastructure", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // BILIRA x PLASMA - Turkish Lira Stablecoin
  // ---------------------------------------------------------------------------
  "plasma-bilira": {
    id: "plasma-bilira",
    name: "BiLira TRYB Center",
    category: "plasma",
    footprint: { width: 1, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_bilira.png" },
    icon: "🇹🇷",
    isProcedural: false,
    crypto: {
      tier: "fish",
      protocol: "BiLira",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "small",
      description: "Turkish Lira stablecoin TRYB headquarters.",
      effects: {
        yieldRate: 8,
        volatility: 0.08,
        rugRisk: 0.004,
        populationBoost: 15,
        happinessEffect: 5,
        zoneRadius: 5,
        landValueBonus: 8,
        incomePerTick: 20,
        chainSynergy: ["plasma", "ethereum"],
        categorySynergy: ["stablecoin", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // WILDCAT x PLASMA - Credit Protocol
  // ---------------------------------------------------------------------------
  "plasma-wildcat": {
    id: "plasma-wildcat",
    name: "Wildcat Credit Facility",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_wildcat.png" },
    icon: "🐱",
    isProcedural: false,
    crypto: {
      tier: "shark",
      protocol: "Wildcat",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "medium",
      description: "On-chain credit protocol for permissioned markets.",
      effects: {
        yieldRate: 12,
        stakingBonus: 1.1,
        volatility: 0.08,
        rugRisk: 0.004,
        populationBoost: 30,
        happinessEffect: 6,
        zoneRadius: 6,
        landValueBonus: 12,
        incomePerTick: 35,
        chainSynergy: ["plasma", "ethereum"],
        categorySynergy: ["defi", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // USDAI x PLASMA - AI Stablecoin
  // ---------------------------------------------------------------------------
  "plasma-usdai": {
    id: "plasma-usdai",
    name: "USDAI AI Center",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_usdai.png" },
    icon: "🤖",
    isProcedural: false,
    crypto: {
      tier: "shark",
      protocol: "USDAI",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "small",
      description: "AI-powered stablecoin R&D center.",
      effects: {
        yieldRate: 10,
        volatility: 0.1,
        rugRisk: 0.005,
        populationBoost: 30,
        happinessEffect: 8,
        zoneRadius: 6,
        landValueBonus: 14,
        incomePerTick: 40,
        chainSynergy: ["plasma"],
        categorySynergy: ["stablecoin", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // ALIXPAY x PLASMA - Payment Center
  // ---------------------------------------------------------------------------
  "plasma-alixpay": {
    id: "plasma-alixpay",
    name: "AlixPay Payment Center",
    category: "plasma",
    footprint: { width: 1, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_alixpay.png" },
    icon: "💳",
    isProcedural: false,
    crypto: {
      tier: "fish",
      protocol: "AlixPay",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "small",
      description: "Crypto payment solutions for merchants.",
      effects: {
        yieldRate: 5,
        tradingFees: 8,
        volatility: 0.05,
        rugRisk: 0.003,
        populationBoost: 15,
        happinessEffect: 5,
        zoneRadius: 4,
        landValueBonus: 6,
        incomePerTick: 20,
        chainSynergy: ["plasma"],
        categorySynergy: ["payment", "plasma"],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // MASSPAY x PLASMA - Payment Hub
  // ---------------------------------------------------------------------------
  "plasma-masspay": {
    id: "plasma-masspay",
    name: "MassPay Payment Hub",
    category: "plasma",
    footprint: { width: 2, height: 2 },
    sprites: { south: "/assets/buildings/partners/partner_masspay.png" },
    icon: "🌐",
    isProcedural: false,
    crypto: {
      tier: "fish",
      protocol: "MassPay",
      chain: "plasma",
      launchYear: 2024,
      tvlTier: "small",
      description: "Global mass payment infrastructure.",
      effects: {
        yieldRate: 6,
        tradingFees: 10,
        volatility: 0.04,
        rugRisk: 0.002,
        populationBoost: 25,
        happinessEffect: 6,
        zoneRadius: 6,
        landValueBonus: 8,
        incomePerTick: 35,
        chainSynergy: ["plasma"],
        categorySynergy: ["payment", "plasma"],
      },
    },
  },
};

// =============================================================================
// COMBINED EXPORTS
// =============================================================================

/**
 * All crypto buildings combined into a single registry
 * This can be merged with the main BUILDINGS registry
 */
export const ALL_CRYPTO_BUILDINGS: Record<string, CryptoBuildingDefinition> = {
  ...DEFI_BUILDINGS,
  ...EXCHANGE_BUILDINGS,
  ...CHAIN_BUILDINGS,
  ...CT_BUILDINGS,
  ...MEME_PROPS,
  ...PLASMA_PARTNER_BUILDINGS,
};

/**
 * Get all crypto buildings for a specific category
 */
export function getCryptoBuildingsByCategory(category: string): CryptoBuildingDefinition[] {
  return Object.values(ALL_CRYPTO_BUILDINGS).filter(b => b.category === category);
}

/**
 * Get all crypto buildings for a specific tier
 */
export function getCryptoBuildingsByTier(tier: CryptoTier): CryptoBuildingDefinition[] {
  return Object.values(ALL_CRYPTO_BUILDINGS).filter(b => b.crypto.tier === tier);
}

/**
 * Get all crypto buildings that synergize with a specific chain
 */
export function getCryptoBuildingsByChain(chain: string): CryptoBuildingDefinition[] {
  return Object.values(ALL_CRYPTO_BUILDINGS).filter(
    b => b.crypto.chain === chain || b.crypto.effects.chainSynergy?.includes(chain)
  );
}

/**
 * Get total count of crypto buildings by category
 */
export function getCryptoBuildingCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const building of Object.values(ALL_CRYPTO_BUILDINGS)) {
    counts[building.category] = (counts[building.category] || 0) + 1;
  }
  return counts;
}

// Log building counts for reference
console.log('Crypto Buildings Loaded:', getCryptoBuildingCounts());

