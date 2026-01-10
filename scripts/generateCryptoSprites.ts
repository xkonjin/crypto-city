/**
 * CRYPTO BUILDING SPRITE GENERATOR
 * 
 * Uses Gemini API (Nano Banana) to generate isometric building sprites
 * matching the ISOCITY pixel art style. Uses reference images from existing
 * game assets to maintain visual consistency.
 * 
 * Usage:
 *   GEMINI_API_KEY=your_key node --loader ts-node/esm scripts/generateCryptoSprites.ts
 *   Or with npx: npx ts-node --esm scripts/generateCryptoSprites.ts
 * 
 * Options:
 *   --building <id>   Generate specific building
 *   --category <cat>  Generate all buildings in category
 *   --limit <n>       Limit number of buildings
 *   --dry-run         Show prompts without generating
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  console.error('Usage: GEMINI_API_KEY=your_key npx ts-node --esm scripts/generateCryptoSprites.ts');
  process.exit(1);
}
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
const SCRIPT_DIR = __dirname || process.cwd();
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'Building', 'crypto');
const REFERENCE_DIR = path.join(PROJECT_ROOT, 'public', 'Building');

// Reference images for style consistency
const STYLE_REFERENCES = {
  residential: '3x3limestones_south.png',
  commercial: '4x4bookstore_south.png', 
  landmark: '6x6internet_archive_south.png',
};

// Tile dimensions for isometric buildings (based on existing sprites)
const TILE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1x1': { width: 128, height: 160 },
  '1x2': { width: 128, height: 224 },
  '2x1': { width: 192, height: 160 },
  '2x2': { width: 192, height: 224 },
  '2x3': { width: 192, height: 288 },
  '3x2': { width: 256, height: 224 },
  '3x3': { width: 256, height: 288 },
  '3x4': { width: 256, height: 352 },
  '4x3': { width: 320, height: 288 },
  '4x4': { width: 320, height: 352 },
};

// Brand colors for each category
const CATEGORY_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  defi: { primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa' },
  exchange: { primary: '#22c55e', secondary: '#15803d', accent: '#4ade80' },
  chain: { primary: '#a855f7', secondary: '#7e22ce', accent: '#c084fc' },
  ct: { primary: '#06b6d4', secondary: '#0e7490', accent: '#22d3ee' },
  meme: { primary: '#f59e0b', secondary: '#b45309', accent: '#fbbf24' },
  plasma: { primary: '#ec4899', secondary: '#be185d', accent: '#f472b6' },
  stablecoin: { primary: '#10b981', secondary: '#047857', accent: '#34d399' },
  infrastructure: { primary: '#6366f1', secondary: '#4338ca', accent: '#818cf8' },
};

// =============================================================================
// BUILDING DEFINITIONS WITH BRAND DETAILS
// =============================================================================

interface BuildingSprite {
  id: string;
  name: string;
  category: string;
  footprint: string; // e.g., "2x2", "3x3"
  icon: string;
  brandColor: string;
  secondaryColor?: string;
  protocol?: string;
  description: string;
  styleHints: string; // Additional style guidance
}

const CRYPTO_BUILDINGS: BuildingSprite[] = [
  // ==========================================================================
  // DEFI BUILDINGS
  // ==========================================================================
  {
    id: 'aave_lending_tower',
    name: 'Aave Lending Tower',
    category: 'defi',
    footprint: '3x3',
    icon: '🏦',
    brandColor: '#B6509E',
    secondaryColor: '#2EBAC6',
    protocol: 'Aave',
    description: 'A tall futuristic lending tower with purple and teal gradient',
    styleHints: 'ghost-like ethereal glow, modern glass and steel, floating holographic displays',
  },
  {
    id: 'uniswap_exchange',
    name: 'Uniswap Exchange',
    category: 'defi',
    footprint: '2x2',
    icon: '🦄',
    brandColor: '#FF007A',
    protocol: 'Uniswap',
    description: 'A pink-magenta DEX building with unicorn horn spire on top',
    styleHints: 'swirling liquidity pool effect at base, pink glass reflections, modern sleek',
  },
  {
    id: 'lido_staking_hub',
    name: 'Lido Staking Hub',
    category: 'defi',
    footprint: '3x2',
    icon: '🌊',
    brandColor: '#00A3FF',
    secondaryColor: '#F69988',
    protocol: 'Lido',
    description: 'Ocean blue liquid staking facility with wave architecture',
    styleHints: 'flowing water features, coral accents, beacon tower with staking light',
  },
  {
    id: 'pendle_yield_factory',
    name: 'Pendle Yield Factory',
    category: 'defi',
    footprint: '2x2',
    icon: '⚗️',
    brandColor: '#24C4FF',
    protocol: 'Pendle',
    description: 'Industrial yield factory with cyan theme',
    styleHints: 'pipes and machinery, hourglasses and clocks, alchemist laboratory meets modern factory',
  },
  {
    id: 'curve_finance_pool',
    name: 'Curve Finance Pool',
    category: 'defi',
    footprint: '2x2',
    icon: '🌀',
    brandColor: '#0038FF',
    secondaryColor: '#FF0000',
    protocol: 'Curve',
    description: 'Curved organic building shape with deep blue and red accents',
    styleHints: 'flowing curved architecture, pool-like water features, stablecoin vault aesthetic',
  },
  {
    id: 'makerdao_vault',
    name: 'MakerDAO Vault',
    category: 'defi',
    footprint: '3x3',
    icon: '🏛️',
    brandColor: '#1AAB9B',
    secondaryColor: '#F4B731',
    protocol: 'MakerDAO',
    description: 'Ancient temple-styled bank vault with teal and gold',
    styleHints: 'classical columns with modern tech, massive vault doors, fortress appearance',
  },
  {
    id: 'compound_bank',
    name: 'Compound Bank',
    category: 'defi',
    footprint: '2x2',
    icon: '🏧',
    brandColor: '#00D395',
    protocol: 'Compound',
    description: 'Modern green bank building',
    styleHints: 'algorithmic money market aesthetic, clean geometric shapes',
  },
  {
    id: 'eigenlayer_restaking',
    name: 'EigenLayer Restaking',
    category: 'defi',
    footprint: '2x3',
    icon: '🔗',
    brandColor: '#1A1A2E',
    secondaryColor: '#6366F1',
    protocol: 'EigenLayer',
    description: 'Layered stacking building with purple glow',
    styleHints: 'multiple stacked layers, restaking visualization, futuristic',
  },
  {
    id: 'balancer_vault',
    name: 'Balancer Vault',
    category: 'defi',
    footprint: '2x2',
    icon: '⚖️',
    brandColor: '#1E1E1E',
    secondaryColor: '#FFFFFF',
    protocol: 'Balancer',
    description: 'Black and white balanced scale building',
    styleHints: 'balanced weights motif, minimalist modern design',
  },
  {
    id: 'yearn_vault',
    name: 'Yearn Vault',
    category: 'defi',
    footprint: '2x2',
    icon: '🏰',
    brandColor: '#006AE3',
    protocol: 'Yearn',
    description: 'Blue castle-style vault building',
    styleHints: 'automated yield visualization, fortress with blue accents',
  },
  {
    id: 'hyperliquid_vault',
    name: 'Hyperliquid Vault',
    category: 'defi',
    footprint: '3x3',
    icon: '💧',
    brandColor: '#00FF88',
    secondaryColor: '#1A1A2E',
    protocol: 'Hyperliquid',
    description: 'Ultra-modern neon green trading terminal',
    styleHints: 'high-speed data visualization, cyberpunk aesthetic, fastest perps exchange',
  },
  {
    id: 'jupiter_terminal',
    name: 'Jupiter Terminal',
    category: 'defi',
    footprint: '2x2',
    icon: '🪐',
    brandColor: '#FF8C00',
    secondaryColor: '#008080',
    protocol: 'Jupiter',
    description: 'Space station styled terminal with orange and teal',
    styleHints: 'planetary ring motifs, orbital trajectory, mission control center',
  },
  {
    id: 'raydium_pool',
    name: 'Raydium Pool',
    category: 'defi',
    footprint: '2x2',
    icon: '💧',
    brandColor: '#9400D3',
    secondaryColor: '#32CD32',
    protocol: 'Raydium',
    description: 'Radioactive purple and green industrial facility',
    styleHints: 'bubbling pool tanks, chemical plant aesthetic, glowing containers',
  },
  {
    id: 'orca_whirlpool',
    name: 'Orca Whirlpool',
    category: 'defi',
    footprint: '2x2',
    icon: '🐋',
    brandColor: '#0077BE',
    protocol: 'Orca',
    description: 'Ocean blue aquarium-styled building',
    styleHints: 'glass walls showing water, whirlpool fountain, marine design',
  },
  {
    id: 'kamino_finance',
    name: 'Kamino Finance',
    category: 'defi',
    footprint: '2x2',
    icon: '🎯',
    brandColor: '#DC143C',
    secondaryColor: '#FFFFFF',
    protocol: 'Kamino',
    description: 'Target/bullseye themed modern building',
    styleHints: 'red and white concentric ring patterns, precision engineering aesthetic',
  },
  // ==========================================================================
  // EXCHANGE BUILDINGS
  // ==========================================================================
  {
    id: 'binance_tower',
    name: 'Binance Tower',
    category: 'exchange',
    footprint: '4x4',
    icon: '🏢',
    brandColor: '#F0B90B',
    secondaryColor: '#1E2026',
    protocol: 'Binance',
    description: 'Massive yellow and black trading complex',
    styleHints: 'launchpad rocket on roof, BNB chain integration, empire-building aesthetic',
  },
  {
    id: 'coinbase_hq',
    name: 'Coinbase HQ',
    category: 'exchange',
    footprint: '3x3',
    icon: '🪙',
    brandColor: '#0052FF',
    protocol: 'Coinbase',
    description: 'Clean blue corporate headquarters',
    styleHints: 'institutional trust aesthetic, NYSE-listed company vibe, compliant appearance',
  },
  {
    id: 'kraken_exchange',
    name: 'Kraken Exchange',
    category: 'exchange',
    footprint: '2x3',
    icon: '🦑',
    brandColor: '#5741D9',
    protocol: 'Kraken',
    description: 'Purple fortress-like exchange with octopus motifs',
    styleHints: 'kraken tentacle architecture, security-focused, Nordic maritime influences',
  },
  {
    id: 'okx_center',
    name: 'OKX Center',
    category: 'exchange',
    footprint: '3x2',
    icon: '🅾️',
    brandColor: '#000000',
    secondaryColor: '#FFFFFF',
    protocol: 'OKX',
    description: 'Black and white modern exchange building',
    styleHints: 'global trading hub, sleek modern design',
  },
  {
    id: 'bybit_arena',
    name: 'Bybit Arena',
    category: 'exchange',
    footprint: '2x2',
    icon: '🎯',
    brandColor: '#F7A600',
    protocol: 'Bybit',
    description: 'Orange derivatives trading arena',
    styleHints: 'trading competition aesthetic, leverage indicators, stadium-like',
  },
  // ==========================================================================
  // CHAIN BUILDINGS
  // ==========================================================================
  {
    id: 'ethereum_beacon',
    name: 'Ethereum Beacon',
    category: 'chain',
    footprint: '4x4',
    icon: '⟠',
    brandColor: '#627EEA',
    secondaryColor: '#8A92B2',
    protocol: 'Ethereum',
    description: 'Majestic purple beacon tower symbolizing proof-of-stake',
    styleHints: 'octahedral diamond motifs, smart contract visualizations, world computer HQ',
  },
  {
    id: 'solana_tower',
    name: 'Solana Tower',
    category: 'chain',
    footprint: '3x3',
    icon: '◎',
    brandColor: '#9945FF',
    secondaryColor: '#14F195',
    protocol: 'Solana',
    description: 'Ultra-fast purple and green gradient tower',
    styleHints: '400ms block time lights, modern Silicon Valley aesthetic, tropical vibes',
  },
  {
    id: 'bitcoin_vault',
    name: 'Bitcoin Vault',
    category: 'chain',
    footprint: '3x3',
    icon: '₿',
    brandColor: '#F7931A',
    protocol: 'Bitcoin',
    description: 'Legendary orange citadel storing digital gold',
    styleHints: 'massive fortress walls, laser eyes from tower, 21 million commemorated',
  },
  {
    id: 'arbitrum_bridge',
    name: 'Arbitrum Bridge',
    category: 'chain',
    footprint: '2x3',
    icon: '🌉',
    brandColor: '#213147',
    secondaryColor: '#12AAFF',
    protocol: 'Arbitrum',
    description: 'Dark blue L2 bridge with light blue accents',
    styleHints: 'bridge connecting L1 to L2, fast execution visualization',
  },
  {
    id: 'optimism_hub',
    name: 'Optimism Hub',
    category: 'chain',
    footprint: '2x2',
    icon: '🔴',
    brandColor: '#FF0420',
    protocol: 'Optimism',
    description: 'Red optimistic hub spreading positive vibes',
    styleHints: 'public goods aesthetic, community-focused design',
  },
  {
    id: 'base_camp',
    name: 'Base Camp',
    category: 'chain',
    footprint: '2x2',
    icon: '🔵',
    brandColor: '#0052FF',
    protocol: 'Base',
    description: 'Blue onchain launchpad building',
    styleHints: 'startup HQ energy, Coinbase integration, builder-focused aesthetic',
  },
  {
    id: 'polygon_plaza',
    name: 'Polygon Plaza',
    category: 'chain',
    footprint: '2x2',
    icon: '💜',
    brandColor: '#8247E5',
    protocol: 'Polygon',
    description: 'Purple scaling solutions plaza',
    styleHints: 'cheap and fast visualization, geometric polygon shapes',
  },
  {
    id: 'zksync_tower',
    name: 'zkSync Era Tower',
    category: 'chain',
    footprint: '2x3',
    icon: '🔐',
    brandColor: '#8A2BE2',
    protocol: 'zkSync',
    description: 'Purple encryption-themed skyscraper',
    styleHints: 'zero-knowledge proof symbols, padlock motifs, secure data fortress',
  },
  // ==========================================================================
  // CT CULTURE BUILDINGS
  // ==========================================================================
  {
    id: 'ct_studio',
    name: 'CT Influencer Studio',
    category: 'ct',
    footprint: '2x2',
    icon: '🎙️',
    brandColor: '#1DA1F2',
    description: 'Blue Twitter/X themed podcast studio',
    styleHints: 'alpha broadcasting, microphone tower, social media aesthetic',
  },
  {
    id: 'vc_office',
    name: 'VC Office',
    category: 'ct',
    footprint: '2x2',
    icon: '💼',
    brandColor: '#2D3748',
    description: 'Dark corporate venture capital office',
    styleHints: 'fund the future aesthetic, institutional money flows',
  },
  {
    id: 'nft_gallery',
    name: 'NFT Gallery',
    category: 'ct',
    footprint: '2x2',
    icon: '🖼️',
    brandColor: '#FF6B6B',
    description: 'Colorful digital art gallery',
    styleHints: 'display frames showing art, modern museum aesthetic',
  },
  {
    id: 'dao_hq',
    name: 'DAO HQ',
    category: 'ct',
    footprint: '2x2',
    icon: '🏛️',
    brandColor: '#9B59B6',
    description: 'Purple decentralized governance headquarters',
    styleHints: 'voting visualization, community-owned aesthetic',
  },
  {
    id: 'degen_lounge',
    name: 'Degen Lounge',
    category: 'ct',
    footprint: '2x2',
    icon: '🎰',
    brandColor: '#FFD700',
    secondaryColor: '#8B0000',
    description: 'Gold and red trading casino lounge',
    styleHints: 'slot machine aesthetic, ape gathering spot, high-risk vibes',
  },
  // ==========================================================================
  // MEME BUILDINGS
  // ==========================================================================
  {
    id: 'pepe_statue',
    name: 'Pepe Statue',
    category: 'meme',
    footprint: '1x1',
    icon: '🐸',
    brandColor: '#3D9970',
    description: 'Green Pepe the Frog statue monument',
    styleHints: 'feels good man pose, golden pedestal, meme magic aesthetic',
  },
  {
    id: 'doge_fountain',
    name: 'Doge Fountain',
    category: 'meme',
    footprint: '2x2',
    icon: '🐕',
    brandColor: '#C2A633',
    description: 'Golden Shiba Inu themed fountain',
    styleHints: 'much wow, very fountain, OG meme coin celebration',
  },
  {
    id: 'shiba_shrine',
    name: 'Shiba Shrine',
    category: 'meme',
    footprint: '2x2',
    icon: '🐕‍🦺',
    brandColor: '#FFA409',
    description: 'Orange Shiba Inu army shrine',
    styleHints: 'Japanese shrine architecture, SHIB army honor',
  },
  {
    id: 'moon_monument',
    name: 'Moon Monument',
    category: 'meme',
    footprint: '2x3',
    icon: '🌙',
    brandColor: '#FFE4B5',
    secondaryColor: '#4169E1',
    description: 'Silver and blue moon-pointing monument',
    styleHints: 'to the moon rocket, optimistic bull market energy',
  },
  {
    id: 'lambo_dealership',
    name: 'Lambo Dealership',
    category: 'meme',
    footprint: '3x2',
    icon: '🏎️',
    brandColor: '#FFD700',
    secondaryColor: '#8B0000',
    description: 'Gold and red luxury car dealership',
    styleHints: 'every degens dream, showroom with supercars',
  },
  {
    id: 'diamond_hands_plaza',
    name: 'Diamond Hands Plaza',
    category: 'meme',
    footprint: '2x2',
    icon: '💎',
    brandColor: '#B9F2FF',
    description: 'Crystal cyan diamond hands monument',
    styleHints: 'sparkling diamonds holding crypto, HODL celebration',
  },
  {
    id: 'wif_temple',
    name: 'WIF Temple',
    category: 'meme',
    footprint: '2x2',
    icon: '🐕',
    brandColor: '#8B4513',
    secondaryColor: '#FFD700',
    description: 'Brown dog with hat temple',
    styleHints: 'dogwifhat legendary meme, Solana meme culture',
  },
  {
    id: 'bonk_arena',
    name: 'BONK Arena',
    category: 'meme',
    footprint: '2x2',
    icon: '🦴',
    brandColor: '#FFB347',
    description: 'Orange bone-themed arena',
    styleHints: 'Solana dog coin, playful bone architecture',
  },
  {
    id: 'brett_base',
    name: 'Brett Base',
    category: 'meme',
    footprint: '2x2',
    icon: '🔵',
    brandColor: '#0052FF',
    secondaryColor: '#90EE90',
    description: 'Blue Base chain frog building',
    styleHints: 'Base chains favorite frog, blue frog aesthetic',
  },
  // ==========================================================================
  // PLASMA BUILDINGS
  // ==========================================================================
  {
    id: 'plasma_hq',
    name: 'Plasma HQ',
    category: 'plasma',
    footprint: '4x4',
    icon: '🏢',
    brandColor: '#EC4899',
    secondaryColor: '#1E3A5F',
    description: 'Pink and navy corporate headquarters',
    styleHints: 'modern glass and steel, rooftop helipad, executive penthouse',
  },
  {
    id: 'plasma_node',
    name: 'Plasma Node',
    category: 'plasma',
    footprint: '1x1',
    icon: '⚡',
    brandColor: '#4A4A4A',
    secondaryColor: '#EC4899',
    description: 'Small pink-accented server node',
    styleHints: 'compact data center, ventilation grilles, status light',
  },
  {
    id: 'plasma_bridge',
    name: 'Plasma Bridge',
    category: 'plasma',
    footprint: '2x3',
    icon: '🌉',
    brandColor: '#D4A574',
    secondaryColor: '#EC4899',
    description: 'Sandstone bridge with pink accents',
    styleHints: 'Victorian-era bridge architecture, suspension cables',
  },
  {
    id: 'plasma_vault',
    name: 'Plasma Vault',
    category: 'plasma',
    footprint: '2x2',
    icon: '🔐',
    brandColor: '#5C5C5C',
    secondaryColor: '#EC4899',
    description: 'Gray vault with pink security accents',
    styleHints: 'massive circular vault door, art deco security aesthetic',
  },
  {
    id: 'plasma_reactor',
    name: 'Plasma Reactor',
    category: 'plasma',
    footprint: '3x3',
    icon: '⚛️',
    brandColor: '#EC4899',
    secondaryColor: '#808080',
    description: 'Pink energy reactor facility',
    styleHints: 'cooling towers with pink glow, industrial power plant',
  },
  {
    id: 'plasma_arena',
    name: 'Plasma Arena',
    category: 'plasma',
    footprint: '3x3',
    icon: '🏟️',
    brandColor: '#8B0000',
    secondaryColor: '#EC4899',
    description: 'Red and pink sports arena',
    styleHints: 'curved roof structure, stadium seating, event venue',
  },
  // ==========================================================================
  // STABLECOIN BUILDINGS
  // ==========================================================================
  {
    id: 'tether_hq',
    name: 'Tether HQ',
    category: 'stablecoin',
    footprint: '3x3',
    icon: '💵',
    brandColor: '#26A17B',
    description: 'Green financial institution headquarters',
    styleHints: 'neoclassical elements, bank-like architecture, Corinthian columns',
  },
  {
    id: 'circle_tower',
    name: 'Circle Tower',
    category: 'stablecoin',
    footprint: '3x3',
    icon: '🔵',
    brandColor: '#3773F5',
    protocol: 'Circle',
    description: 'Blue cylindrical modern tower',
    styleHints: 'rounded contemporary architecture, Silicon Valley aesthetic',
  },
  {
    id: 'dai_vault',
    name: 'DAI Vault',
    category: 'stablecoin',
    footprint: '2x2',
    icon: '🏛️',
    brandColor: '#F4B731',
    secondaryColor: '#1AAB9B',
    description: 'Gold and teal stablecoin vault',
    styleHints: 'MakerDAO DAI aesthetic, decentralized stablecoin',
  },
  // ==========================================================================
  // INFRASTRUCTURE BUILDINGS
  // ==========================================================================
  {
    id: 'chainlink_hub',
    name: 'Chainlink Hub',
    category: 'infrastructure',
    footprint: '3x3',
    icon: '🔗',
    brandColor: '#375BD2',
    protocol: 'Chainlink',
    description: 'Blue hexagonal oracle data center',
    styleHints: 'satellite dishes on roof, network operations center, antenna array',
  },
  {
    id: 'the_graph_indexer',
    name: 'The Graph Indexer',
    category: 'infrastructure',
    footprint: '2x2',
    icon: '📊',
    brandColor: '#6F4CFF',
    protocol: 'The Graph',
    description: 'Purple library-like data building',
    styleHints: 'visible server racks, rows of indexed data visualization',
  },
  {
    id: 'pyth_observatory',
    name: 'Pyth Observatory',
    category: 'infrastructure',
    footprint: '2x2',
    icon: '🔭',
    brandColor: '#6B00FF',
    secondaryColor: '#E6DAFE',
    protocol: 'Pyth',
    description: 'Purple observatory with rotating dome',
    styleHints: 'high-precision measurement facility, stargazing architecture',
  },
  {
    id: 'layerzero_bridge',
    name: 'LayerZero Bridge',
    category: 'infrastructure',
    footprint: '2x3',
    icon: '🌐',
    brandColor: '#CD7F32',
    protocol: 'LayerZero',
    description: 'Bronze suspension bridge gatehouse',
    styleHints: 'twin towers, Victorian engineering with modern elements',
  },
  {
    id: 'wormhole_portal',
    name: 'Wormhole Portal',
    category: 'infrastructure',
    footprint: '2x2',
    icon: '🌀',
    brandColor: '#00FFFF',
    secondaryColor: '#191970',
    protocol: 'Wormhole',
    description: 'Cyan portal structure with spinning ring',
    styleHints: 'sci-fi teleportation gate, interdimensional gateway, energy conduits',
  },
];

// =============================================================================
// ISOMETRIC STYLE PROMPT TEMPLATE
// =============================================================================

const BASE_STYLE_PROMPT = `
You are creating a pixel art isometric building sprite for a city-builder game called ISOCITY/CryptoCity.

CRITICAL STYLE REQUIREMENTS:
- Isometric projection with 2:1 pixel ratio (45-degree viewing angle)
- Clean, crisp pixel art style with visible pixels - NOT smooth vector art
- Single building isolated on TRANSPARENT background (PNG with alpha)
- Building should be positioned at bottom-center of the canvas
- Leave significant empty space above the building for the isometric perspective
- Rich, vibrant colors with clear outlines
- Consistent with retro city-builder games like SimCity 2000, OpenTTD
- NO anti-aliasing artifacts - pixel edges should be sharp
- NO shadows on the ground plane
- NO people, vehicles, trees, or other objects
- Building should have depth and 3D appearance in isometric view
`.trim();

const NEGATIVE_PROMPT = `
blurry, low quality, realistic, photorealistic, 3D render CGI,
people, characters, cars, trees, ground shadows, grass,
text, watermark, logo, signature, multiple buildings,
perspective distortion, non-isometric angle, flat 2D,
smooth gradients, vector art, soft edges, anti-aliased
`.trim();

// =============================================================================
// PROMPT GENERATION
// =============================================================================

function generatePrompt(building: BuildingSprite): string {
  const dims = TILE_DIMENSIONS[building.footprint] || TILE_DIMENSIONS['2x2'];
  const categoryColors = CATEGORY_COLORS[building.category] || CATEGORY_COLORS.defi;
  
  const colorDescription = building.secondaryColor 
    ? `Primary color: ${building.brandColor}, Secondary color: ${building.secondaryColor}`
    : `Primary brand color: ${building.brandColor}`;
  
  return `
${BASE_STYLE_PROMPT}

BUILDING SPECIFICATIONS:
- Name: ${building.name}
- Category: ${building.category.toUpperCase()}
- Grid footprint: ${building.footprint} tiles (${dims.width}x${dims.height} pixels)
- Icon/Theme: ${building.icon}
${building.protocol ? `- Protocol: ${building.protocol}` : ''}

COLOR PALETTE:
${colorDescription}
Category accent: ${categoryColors.accent}

BUILDING DESCRIPTION:
${building.description}

STYLE DETAILS:
${building.styleHints}

Generate a beautiful isometric pixel art building sprite. The building should:
1. Clearly represent a ${building.name} in a crypto/DeFi themed city
2. Use the specified brand colors prominently
3. Have interesting architectural details visible from the isometric angle
4. Look professional and polished like a game asset
5. Be on a completely transparent background

Output a ${dims.width}x${dims.height} pixel PNG image with transparency.
`.trim();
}

// =============================================================================
// API CLIENT
// =============================================================================

/**
 * Load a reference image and convert to base64
 */
function loadReferenceImage(category: string): string | null {
  const refPaths: Record<string, string> = {
    residential: path.join(REFERENCE_DIR, 'residential', '3x3limestones_south.png'),
    commercial: path.join(REFERENCE_DIR, 'commercial', '4x4bookstore_south.png'),
    landmark: path.join(REFERENCE_DIR, 'landmark', '6x6internet_archive_south.png'),
  };
  
  // Map crypto categories to reference styles
  const categoryMapping: Record<string, string> = {
    defi: 'commercial',
    exchange: 'commercial',
    chain: 'landmark',
    ct: 'commercial',
    meme: 'residential',
    plasma: 'landmark',
    stablecoin: 'landmark',
    infrastructure: 'commercial',
  };
  
  const refCategory = categoryMapping[category] || 'commercial';
  const refPath = refPaths[refCategory];
  
  if (!refPath || !fs.existsSync(refPath)) {
    console.log(`  No reference image found for ${category}`);
    return null;
  }
  
  try {
    const imageBuffer = fs.readFileSync(refPath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.log(`  Could not load reference: ${(error as Error).message}`);
    return null;
  }
}

async function generateImage(prompt: string, category: string): Promise<Buffer | null> {
  console.log('  Calling Gemini API (Nano Banana)...');
  
  // Load reference image for style consistency
  const referenceBase64 = loadReferenceImage(category);
  
  // Build request parts
  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];
  
  // Add reference image if available for style guidance
  if (referenceBase64) {
    parts.push({
      inline_data: {
        mime_type: 'image/png',
        data: referenceBase64,
      }
    });
    parts.push({
      text: `Use this image as a style reference for the isometric pixel art style, perspective, and level of detail. Generate a NEW building in this EXACT same style:\n\n${prompt}`
    });
  } else {
    parts.push({ text: prompt });
  }
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: parts
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  API Error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
            inlineData?: {
              mimeType: string;
              data: string;
            };
          }>;
        };
      }>;
      error?: { message: string };
    };

    if (data.error) {
      console.error(`  API Error: ${data.error.message}`);
      return null;
    }

    // Extract image data from response
    const candidate = data.candidates?.[0];
    const responseParts = candidate?.content?.parts || [];
    
    for (const part of responseParts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64');
      }
    }
    
    console.error('  No image data in response');
    return null;
    
  } catch (error) {
    console.error(`  Error: ${(error as Error).message}`);
    return null;
  }
}

// =============================================================================
// FILE OPERATIONS
// =============================================================================

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function saveImage(imageBuffer: Buffer, building: BuildingSprite): Promise<string> {
  const categoryDir = path.join(OUTPUT_DIR, building.category);
  ensureDir(categoryDir);
  
  // Save with footprint in filename for clarity
  const filename = `${building.footprint}${building.id}_south.png`;
  const filepath = path.join(categoryDir, filename);
  
  fs.writeFileSync(filepath, imageBuffer);
  return filepath;
}

// =============================================================================
// MAIN GENERATION LOGIC
// =============================================================================

interface CLIOptions {
  buildingId?: string;
  category?: string;
  dryRun: boolean;
  limit?: number;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = { dryRun: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--building':
      case '-b':
        options.buildingId = args[++i];
        break;
      case '--category':
      case '-c':
        options.category = args[++i];
        break;
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--limit':
      case '-l':
        options.limit = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        console.log(`
Crypto Building Sprite Generator

Usage:
  npx ts-node scripts/generateCryptoSprites.ts [options]

Options:
  --building, -b <id>    Generate a specific building by ID
  --category, -c <name>  Generate all buildings in a category
  --limit, -l <n>        Limit number of buildings to generate
  --dry-run, -d          Show prompts without generating
  --help, -h             Show this help

Categories: defi, exchange, chain, ct, meme, plasma, stablecoin, infrastructure

Examples:
  npx ts-node scripts/generateCryptoSprites.ts --category defi --limit 5
  npx ts-node scripts/generateCryptoSprites.ts --building uniswap_exchange
  npx ts-node scripts/generateCryptoSprites.ts --dry-run
        `);
        process.exit(0);
    }
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs();
  
  console.log('🎨 Crypto Building Sprite Generator');
  console.log('====================================\n');
  
  // Filter buildings
  let buildings = CRYPTO_BUILDINGS;
  
  if (options.buildingId) {
    buildings = buildings.filter(b => b.id === options.buildingId);
    if (buildings.length === 0) {
      console.error(`❌ Building not found: ${options.buildingId}`);
      console.log('\nAvailable buildings:');
      CRYPTO_BUILDINGS.forEach(b => console.log(`  - ${b.id} (${b.category})`));
      process.exit(1);
    }
  }
  
  if (options.category) {
    buildings = buildings.filter(b => b.category === options.category);
    if (buildings.length === 0) {
      console.error(`❌ No buildings in category: ${options.category}`);
      const categories = [...new Set(CRYPTO_BUILDINGS.map(b => b.category))];
      console.log('\nAvailable categories:', categories.join(', '));
      process.exit(1);
    }
  }
  
  if (options.limit) {
    buildings = buildings.slice(0, options.limit);
  }
  
  console.log(`📦 Generating ${buildings.length} building sprite(s)\n`);
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN - Showing prompts only\n');
  }
  
  ensureDir(OUTPUT_DIR);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const building of buildings) {
    console.log(`🏗️  ${building.name} (${building.id})`);
    console.log(`   Category: ${building.category}`);
    console.log(`   Footprint: ${building.footprint}`);
    console.log(`   Color: ${building.brandColor}`);
    
    const prompt = generatePrompt(building);
    
    if (options.dryRun) {
      console.log(`\n   PROMPT:\n   ${prompt.split('\n').slice(0, 10).join('\n   ')}...`);
      console.log('   ✅ Would generate\n');
      continue;
    }
    
    const imageBuffer = await generateImage(prompt, building.category);
    
    if (imageBuffer) {
      const filepath = await saveImage(imageBuffer, building);
      console.log(`   ✅ Saved: ${filepath}\n`);
      successCount++;
    } else {
      console.log(`   ❌ Failed to generate\n`);
      failCount++;
    }
    
    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('====================================');
  console.log(`✨ Generation complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
