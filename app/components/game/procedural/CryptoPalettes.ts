// =============================================================================
// CRYPTO PALETTES - Color schemes for crypto-themed buildings
// =============================================================================
// Each palette represents the visual identity of blockchain ecosystems,
// DeFi protocols, exchanges, and crypto culture elements.
//
// Color choices are based on actual brand colors from these protocols:
// - Ethereum: Purple/blue gradients (official brand)
// - Solana: Purple/green neon (official brand)
// - Bitcoin: Orange/gold (universally recognized)
// - DeFi protocols: Various blues/teals (trust/finance aesthetic)
// - Degen culture: Neon pink/green (meme energy)

import { ColorPalette, PLASMA_COLORS } from './ColorPalette';

// =============================================================================
// CRYPTO BRAND COLORS
// =============================================================================
// Actual hex codes from major crypto brands for authenticity

export const CRYPTO_COLORS = {
  // Ethereum ecosystem colors
  ethereum: {
    primary: '#627EEA',      // Ethereum blue-purple
    light: '#8A9FEE',
    dark: '#3C5BD8',
    accent: '#C9B8FF',       // Lighter purple for highlights
  },
  
  // Solana ecosystem colors
  solana: {
    primary: '#9945FF',      // Solana purple
    light: '#B86EFF',
    dark: '#7B2FD8',
    accent: '#14F195',       // Solana green (signature color)
    gradient: '#00FFA3',     // Gradient end
  },
  
  // Bitcoin colors
  bitcoin: {
    primary: '#F7931A',      // Bitcoin orange
    light: '#FFB347',
    dark: '#C77700',
    accent: '#FFD700',       // Gold accent
  },
  
  // Base (Coinbase L2) colors
  base: {
    primary: '#0052FF',      // Coinbase blue
    light: '#3373FF',
    dark: '#0041CC',
    accent: '#FFFFFF',
  },
  
  // Arbitrum colors
  arbitrum: {
    primary: '#28A0F0',      // Arbitrum blue
    light: '#4FB8FF',
    dark: '#1A7BC0',
    accent: '#213147',       // Dark blue accent
  },
  
  // Optimism colors
  optimism: {
    primary: '#FF0420',      // Optimism red
    light: '#FF4D5E',
    dark: '#CC0318',
    accent: '#FFFFFF',
  },
  
  // Polygon colors
  polygon: {
    primary: '#8247E5',      // Polygon purple
    light: '#A06FFF',
    dark: '#6530B8',
    accent: '#FFFFFF',
  },
  
  // Avalanche colors
  avalanche: {
    primary: '#E84142',      // Avalanche red
    light: '#FF6B6B',
    dark: '#B83232',
    accent: '#FFFFFF',
  },
  
  // Major DeFi protocols
  aave: {
    primary: '#B6509E',      // Aave purple-pink
    light: '#D070BE',
    dark: '#8A3078',
    accent: '#2EBAC6',       // Teal accent
  },
  
  uniswap: {
    primary: '#FF007A',      // Uniswap pink
    light: '#FF4D9E',
    dark: '#CC0062',
    accent: '#FFD6EA',
  },
  
  lido: {
    primary: '#00A3FF',      // Lido blue
    light: '#4DBFFF',
    dark: '#0082CC',
    accent: '#F69988',       // Coral accent
  },
  
  curve: {
    primary: '#0038FF',      // Curve blue
    light: '#4D6FFF',
    dark: '#002BCC',
    accent: '#FF0000',       // Red accent
  },
  
  maker: {
    primary: '#1AAB9B',      // MakerDAO teal
    light: '#3DCBB8',
    dark: '#148A7C',
    accent: '#F4B731',       // DAI yellow
  },
  
  compound: {
    primary: '#00D395',      // Compound green
    light: '#33E0AD',
    dark: '#00A877',
    accent: '#FFFFFF',
  },
  
  pendle: {
    primary: '#17E7D6',      // Pendle cyan
    light: '#5FFFEE',
    dark: '#12B8AA',
    accent: '#0A1628',       // Dark background
  },
  
  yearn: {
    primary: '#006AE3',      // Yearn blue
    light: '#3388FF',
    dark: '#0054B5',
    accent: '#FFFFFF',
  },
  
  gmx: {
    primary: '#3498DB',      // GMX blue
    light: '#5DADE2',
    dark: '#2980B9',
    accent: '#1A1A2E',
  },
  
  hyperliquid: {
    primary: '#00FF88',      // Hyperliquid green
    light: '#66FFBB',
    dark: '#00CC6D',
    accent: '#0A0F1A',
  },
  
  // Exchanges
  coinbase: {
    primary: '#0052FF',      // Coinbase blue
    light: '#3373FF',
    dark: '#0041CC',
    accent: '#FFFFFF',
  },
  
  binance: {
    primary: '#F0B90B',      // Binance yellow
    light: '#FFD54F',
    dark: '#C79700',
    accent: '#1E2026',       // Dark background
  },
  
  kraken: {
    primary: '#5741D9',      // Kraken purple
    light: '#7B61FF',
    dark: '#4530B0',
    accent: '#FFFFFF',
  },
  
  ftx: {
    primary: '#5DADE2',      // FTX light blue (now ruined)
    light: '#85C1E9',
    dark: '#3498DB',
    accent: '#000000',       // Black for the memorial
  },
  
  jupiter: {
    primary: '#C7F284',      // Jupiter lime green
    light: '#DEFFB0',
    dark: '#9FC266',
    accent: '#000000',
  },
  
  dydx: {
    primary: '#6966FF',      // dYdX purple
    light: '#9996FF',
    dark: '#5452CC',
    accent: '#FFFFFF',
  },
  
  // Meme/culture colors
  pepe: {
    primary: '#3D9970',      // Pepe green
    light: '#5DB890',
    dark: '#2D7A58',
    accent: '#FFFFFF',
  },
  
  degen: {
    primary: '#FF00FF',      // Neon magenta
    light: '#FF66FF',
    dark: '#CC00CC',
    accent: '#00FF00',       // Neon green
  },
  
  wojak: {
    primary: '#FFE4B5',      // Wojak skin tone
    light: '#FFF5DC',
    dark: '#D4B896',
    accent: '#000000',
  },
  
  diamond: {
    primary: '#B9F2FF',      // Diamond cyan
    light: '#E0FAFF',
    dark: '#8DE3F5',
    accent: '#4DD0E1',
  },
  
  moon: {
    primary: '#FFD700',      // Gold/moon
    light: '#FFEB3B',
    dark: '#C7A600',
    accent: '#FFF8E1',
  },
} as const;

// =============================================================================
// BUILDING PALETTES FOR PROCEDURAL GENERATION
// =============================================================================
// These palettes are used by BuildingGenerator to create isometric buildings

export const CRYPTO_BUILDING_PALETTES: Record<string, ColorPalette> = {
  // -----------------------------
  // Ethereum Ecosystem
  // -----------------------------
  ethereum: {
    primary: CRYPTO_COLORS.ethereum.primary,
    primaryDark: CRYPTO_COLORS.ethereum.dark,
    primaryLight: CRYPTO_COLORS.ethereum.light,
    top: '#7B8FEE',
    accent: CRYPTO_COLORS.ethereum.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  ethereumInstitution: {
    primary: '#4A5899',
    primaryDark: '#3A4879',
    primaryLight: '#6A78B9',
    top: '#5A68A9',
    accent: CRYPTO_COLORS.ethereum.primary,
    outline: PLASMA_COLORS.dark,
  },
  
  // -----------------------------
  // Solana Ecosystem
  // -----------------------------
  solana: {
    primary: CRYPTO_COLORS.solana.primary,
    primaryDark: CRYPTO_COLORS.solana.dark,
    primaryLight: CRYPTO_COLORS.solana.light,
    top: '#AB6CFF',
    accent: CRYPTO_COLORS.solana.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  solanaGreen: {
    primary: '#0ACF83',
    primaryDark: '#08A369',
    primaryLight: '#3DE9A5',
    top: '#1DE098',
    accent: CRYPTO_COLORS.solana.primary,
    outline: PLASMA_COLORS.dark,
  },
  
  // -----------------------------
  // Bitcoin Ecosystem
  // -----------------------------
  bitcoin: {
    primary: CRYPTO_COLORS.bitcoin.primary,
    primaryDark: CRYPTO_COLORS.bitcoin.dark,
    primaryLight: CRYPTO_COLORS.bitcoin.light,
    top: '#FFAA40',
    accent: CRYPTO_COLORS.bitcoin.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  bitcoinCitadel: {
    primary: '#4A3520',
    primaryDark: '#3A2510',
    primaryLight: '#6A5540',
    top: '#5A4530',
    accent: CRYPTO_COLORS.bitcoin.primary,
    outline: PLASMA_COLORS.dark,
  },
  
  // -----------------------------
  // Layer 2 / Alt Chains
  // -----------------------------
  base: {
    primary: CRYPTO_COLORS.base.primary,
    primaryDark: CRYPTO_COLORS.base.dark,
    primaryLight: CRYPTO_COLORS.base.light,
    top: '#1A62FF',
    accent: CRYPTO_COLORS.base.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  arbitrum: {
    primary: CRYPTO_COLORS.arbitrum.primary,
    primaryDark: CRYPTO_COLORS.arbitrum.dark,
    primaryLight: CRYPTO_COLORS.arbitrum.light,
    top: '#3FB0FF',
    accent: CRYPTO_COLORS.arbitrum.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  optimism: {
    primary: CRYPTO_COLORS.optimism.primary,
    primaryDark: CRYPTO_COLORS.optimism.dark,
    primaryLight: CRYPTO_COLORS.optimism.light,
    top: '#FF2D44',
    accent: CRYPTO_COLORS.optimism.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  polygon: {
    primary: CRYPTO_COLORS.polygon.primary,
    primaryDark: CRYPTO_COLORS.polygon.dark,
    primaryLight: CRYPTO_COLORS.polygon.light,
    top: '#9A5FEE',
    accent: CRYPTO_COLORS.polygon.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  avalanche: {
    primary: CRYPTO_COLORS.avalanche.primary,
    primaryDark: CRYPTO_COLORS.avalanche.dark,
    primaryLight: CRYPTO_COLORS.avalanche.light,
    top: '#F05555',
    accent: CRYPTO_COLORS.avalanche.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  // -----------------------------
  // DeFi Protocols
  // -----------------------------
  aave: {
    primary: CRYPTO_COLORS.aave.primary,
    primaryDark: CRYPTO_COLORS.aave.dark,
    primaryLight: CRYPTO_COLORS.aave.light,
    top: '#C868B0',
    accent: CRYPTO_COLORS.aave.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  uniswap: {
    primary: CRYPTO_COLORS.uniswap.primary,
    primaryDark: CRYPTO_COLORS.uniswap.dark,
    primaryLight: CRYPTO_COLORS.uniswap.light,
    top: '#FF3399',
    accent: CRYPTO_COLORS.uniswap.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  lido: {
    primary: CRYPTO_COLORS.lido.primary,
    primaryDark: CRYPTO_COLORS.lido.dark,
    primaryLight: CRYPTO_COLORS.lido.light,
    top: '#33B5FF',
    accent: CRYPTO_COLORS.lido.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  curve: {
    primary: CRYPTO_COLORS.curve.primary,
    primaryDark: CRYPTO_COLORS.curve.dark,
    primaryLight: CRYPTO_COLORS.curve.light,
    top: '#1A50FF',
    accent: CRYPTO_COLORS.curve.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  maker: {
    primary: CRYPTO_COLORS.maker.primary,
    primaryDark: CRYPTO_COLORS.maker.dark,
    primaryLight: CRYPTO_COLORS.maker.light,
    top: '#2EBBA8',
    accent: CRYPTO_COLORS.maker.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  compound: {
    primary: CRYPTO_COLORS.compound.primary,
    primaryDark: CRYPTO_COLORS.compound.dark,
    primaryLight: CRYPTO_COLORS.compound.light,
    top: '#1AE8A6',
    accent: CRYPTO_COLORS.compound.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  pendle: {
    primary: CRYPTO_COLORS.pendle.primary,
    primaryDark: CRYPTO_COLORS.pendle.dark,
    primaryLight: CRYPTO_COLORS.pendle.light,
    top: '#4AEFE0',
    accent: CRYPTO_COLORS.pendle.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  yearn: {
    primary: CRYPTO_COLORS.yearn.primary,
    primaryDark: CRYPTO_COLORS.yearn.dark,
    primaryLight: CRYPTO_COLORS.yearn.light,
    top: '#1A7AEE',
    accent: CRYPTO_COLORS.yearn.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  gmx: {
    primary: CRYPTO_COLORS.gmx.primary,
    primaryDark: CRYPTO_COLORS.gmx.dark,
    primaryLight: CRYPTO_COLORS.gmx.light,
    top: '#4AA8E5',
    accent: CRYPTO_COLORS.gmx.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  hyperliquid: {
    primary: CRYPTO_COLORS.hyperliquid.primary,
    primaryDark: CRYPTO_COLORS.hyperliquid.dark,
    primaryLight: CRYPTO_COLORS.hyperliquid.light,
    top: '#33FF99',
    accent: CRYPTO_COLORS.hyperliquid.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  // -----------------------------
  // Exchanges
  // -----------------------------
  coinbase: {
    primary: CRYPTO_COLORS.coinbase.primary,
    primaryDark: CRYPTO_COLORS.coinbase.dark,
    primaryLight: CRYPTO_COLORS.coinbase.light,
    top: '#1A62FF',
    accent: CRYPTO_COLORS.coinbase.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  binance: {
    primary: CRYPTO_COLORS.binance.primary,
    primaryDark: CRYPTO_COLORS.binance.dark,
    primaryLight: CRYPTO_COLORS.binance.light,
    top: '#FFD01A',
    accent: CRYPTO_COLORS.binance.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  kraken: {
    primary: CRYPTO_COLORS.kraken.primary,
    primaryDark: CRYPTO_COLORS.kraken.dark,
    primaryLight: CRYPTO_COLORS.kraken.light,
    top: '#6F58E5',
    accent: CRYPTO_COLORS.kraken.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  ftxRuins: {
    primary: '#4A4A4A',      // Gray ruins
    primaryDark: '#2A2A2A',
    primaryLight: '#6A6A6A',
    top: '#5A5A5A',
    accent: CRYPTO_COLORS.ftx.primary,  // Hint of former glory
    outline: '#1A1A1A',
  },
  
  jupiter: {
    primary: CRYPTO_COLORS.jupiter.primary,
    primaryDark: CRYPTO_COLORS.jupiter.dark,
    primaryLight: CRYPTO_COLORS.jupiter.light,
    top: '#D5FF9A',
    accent: CRYPTO_COLORS.jupiter.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  dydx: {
    primary: CRYPTO_COLORS.dydx.primary,
    primaryDark: CRYPTO_COLORS.dydx.dark,
    primaryLight: CRYPTO_COLORS.dydx.light,
    top: '#7B78FF',
    accent: CRYPTO_COLORS.dydx.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  // -----------------------------
  // CT Culture / Influencer
  // -----------------------------
  ctInfluencer: {
    primary: '#1DA1F2',      // Twitter blue
    primaryDark: '#1A8CD8',
    primaryLight: '#4DBCFF',
    top: '#33B5FF',
    accent: '#FFFFFF',
    outline: PLASMA_COLORS.dark,
  },
  
  ctWhale: {
    primary: '#0A1628',      // Dark luxurious
    primaryDark: '#050D18',
    primaryLight: '#1A2A44',
    top: '#142238',
    accent: '#FFD700',       // Gold accents
    outline: '#050D18',
  },
  
  ctDegen: {
    primary: CRYPTO_COLORS.degen.primary,
    primaryDark: CRYPTO_COLORS.degen.dark,
    primaryLight: CRYPTO_COLORS.degen.light,
    top: '#FF33FF',
    accent: CRYPTO_COLORS.degen.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  podcast: {
    primary: '#6B21A8',      // Podcast purple
    primaryDark: '#581C87',
    primaryLight: '#8B5CF6',
    top: '#7C3AED',
    accent: '#FFFFFF',
    outline: PLASMA_COLORS.dark,
  },
  
  // -----------------------------
  // Meme Culture
  // -----------------------------
  pepe: {
    primary: CRYPTO_COLORS.pepe.primary,
    primaryDark: CRYPTO_COLORS.pepe.dark,
    primaryLight: CRYPTO_COLORS.pepe.light,
    top: '#4DAA82',
    accent: CRYPTO_COLORS.pepe.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  wojak: {
    primary: CRYPTO_COLORS.wojak.primary,
    primaryDark: CRYPTO_COLORS.wojak.dark,
    primaryLight: CRYPTO_COLORS.wojak.light,
    top: '#FFF0D0',
    accent: CRYPTO_COLORS.wojak.accent,
    outline: '#8B7355',
  },
  
  diamondHands: {
    primary: CRYPTO_COLORS.diamond.primary,
    primaryDark: CRYPTO_COLORS.diamond.dark,
    primaryLight: CRYPTO_COLORS.diamond.light,
    top: '#D0F8FF',
    accent: CRYPTO_COLORS.diamond.accent,
    outline: '#4DD0E1',
  },
  
  moon: {
    primary: CRYPTO_COLORS.moon.primary,
    primaryDark: CRYPTO_COLORS.moon.dark,
    primaryLight: CRYPTO_COLORS.moon.light,
    top: '#FFE34D',
    accent: CRYPTO_COLORS.moon.accent,
    outline: PLASMA_COLORS.dark,
  },
  
  rugPull: {
    primary: '#8B0000',      // Dark red for danger
    primaryDark: '#5C0000',
    primaryLight: '#B22222',
    top: '#A00000',
    accent: '#000000',
    outline: '#3A0000',
  },
  
  wagmi: {
    primary: '#00D4AA',      // Hopeful green
    primaryDark: '#00A888',
    primaryLight: '#33FFCC',
    top: '#1AE0BB',
    accent: '#FFFFFF',
    outline: PLASMA_COLORS.dark,
  },
  
  ngmi: {
    primary: '#FF4444',      // Warning red
    primaryDark: '#CC0000',
    primaryLight: '#FF7777',
    top: '#FF5555',
    accent: '#000000',
    outline: PLASMA_COLORS.dark,
  },
  
  nft: {
    primary: '#FF6B6B',      // NFT culture - varied/colorful
    primaryDark: '#EE5A5A',
    primaryLight: '#FF8C8C',
    top: '#FF7A7A',
    accent: '#FFD93D',
    outline: PLASMA_COLORS.dark,
  },
  
  laserEyes: {
    primary: CRYPTO_COLORS.bitcoin.primary,
    primaryDark: CRYPTO_COLORS.bitcoin.dark,
    primaryLight: CRYPTO_COLORS.bitcoin.light,
    top: '#FFAA40',
    accent: '#FF0000',       // Red laser eyes
    outline: PLASMA_COLORS.dark,
  },
  
  gm: {
    primary: '#87CEEB',      // Sky blue for morning
    primaryDark: '#6BB3D9',
    primaryLight: '#ADD8E6',
    top: '#98D8EB',
    accent: '#FFD700',       // Sunny gold
    outline: PLASMA_COLORS.dark,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a crypto palette by name, with fallback to default
 */
export function getCryptoPalette(name: string): ColorPalette {
  return CRYPTO_BUILDING_PALETTES[name] || CRYPTO_BUILDING_PALETTES.ethereum;
}

/**
 * Get the appropriate palette for a blockchain ecosystem
 */
export function getChainPalette(chain: string): ColorPalette {
  const chainPalettes: Record<string, string> = {
    ethereum: 'ethereum',
    solana: 'solana',
    bitcoin: 'bitcoin',
    base: 'base',
    arbitrum: 'arbitrum',
    optimism: 'optimism',
    polygon: 'polygon',
    avalanche: 'avalanche',
  };
  
  const paletteName = chainPalettes[chain.toLowerCase()] || 'ethereum';
  return CRYPTO_BUILDING_PALETTES[paletteName];
}

/**
 * Get the appropriate palette for a DeFi protocol
 */
export function getProtocolPalette(protocol: string): ColorPalette {
  const protocolPalettes: Record<string, string> = {
    aave: 'aave',
    uniswap: 'uniswap',
    lido: 'lido',
    curve: 'curve',
    maker: 'maker',
    compound: 'compound',
    pendle: 'pendle',
    yearn: 'yearn',
    gmx: 'gmx',
    hyperliquid: 'hyperliquid',
  };
  
  const paletteName = protocolPalettes[protocol.toLowerCase()] || 'ethereum';
  return CRYPTO_BUILDING_PALETTES[paletteName];
}

/**
 * Get the appropriate palette for an exchange
 */
export function getExchangePalette(exchange: string): ColorPalette {
  const exchangePalettes: Record<string, string> = {
    coinbase: 'coinbase',
    binance: 'binance',
    kraken: 'kraken',
    ftx: 'ftxRuins',
    jupiter: 'jupiter',
    dydx: 'dydx',
  };
  
  const paletteName = exchangePalettes[exchange.toLowerCase()] || 'coinbase';
  return CRYPTO_BUILDING_PALETTES[paletteName];
}

/**
 * Generate a random variation of a crypto palette for visual variety
 */
export function varyCryptoPalette(base: ColorPalette, variance: number = 0.05): ColorPalette {
  const vary = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const v = (val: number) => {
      const delta = Math.floor((Math.random() - 0.5) * 2 * variance * 255);
      return Math.max(0, Math.min(255, val + delta));
    };
    
    return `#${v(r).toString(16).padStart(2, '0')}${v(g).toString(16).padStart(2, '0')}${v(b).toString(16).padStart(2, '0')}`;
  };
  
  return {
    primary: vary(base.primary),
    primaryDark: vary(base.primaryDark),
    primaryLight: vary(base.primaryLight),
    top: vary(base.top),
    accent: base.accent,  // Keep accent consistent for brand recognition
    outline: base.outline,
  };
}

