// =============================================================================
// NANOBANANA ASSET GENERATION SCRIPT
// =============================================================================
// This script generates isometric building assets using the Nanobanana API.
// It creates hero buildings for major crypto protocols that require unique
// artwork beyond what the procedural system can generate.
//
// Usage:
//   npx ts-node scripts/generateAssets.ts
//   npx ts-node scripts/generateAssets.ts --building aave-lending-tower
//   npx ts-node scripts/generateAssets.ts --category defi
//
// Requirements:
//   - NANOBANANA_API_KEY environment variable set
//   - Node.js with fetch support (Node 18+)
//
// The script will save generated images to /public/Building/[category]/

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Nanobanana API endpoint
 * This is a placeholder - replace with actual API endpoint when available
 */
const NANOBANANA_API_URL = 'https://api.nanobanana.ai/v1/generate';

/**
 * Default image size for generated assets
 */
const DEFAULT_SIZE = 512;

/**
 * Output directory for generated assets
 */
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'Building');

// =============================================================================
// HERO BUILDING DEFINITIONS
// =============================================================================
// These are the landmark buildings that need custom Nanobanana artwork

interface HeroBuildingPrompt {
  id: string;              // Building ID matching cryptoBuildings.ts
  name: string;            // Display name
  category: string;        // Category for folder organization
  prompt: string;          // Full prompt for Nanobanana
  negativePrompt?: string; // Things to avoid
  size?: string;           // Output size (e.g., "512x512")
  style?: string;          // Style preset
}

/**
 * Base prompt template for all isometric buildings
 * Ensures consistent style across all generated assets
 */
const BASE_PROMPT = `
Isometric game building asset, 2:1 pixel ratio projection, 45-degree viewing angle,
clean vector art style, crisp edges, no anti-aliasing artifacts,
single building isolated on transparent background,
professional game asset quality, vibrant colors,
`.trim().replace(/\n/g, ' ');

/**
 * Common negative prompts to ensure quality
 */
const NEGATIVE_PROMPT = `
blurry, low quality, realistic, photorealistic, 3D render,
people, characters, cars, trees, ground, shadows on ground,
text, watermark, logo, signature, multiple buildings,
perspective distortion, non-isometric angle
`.trim().replace(/\n/g, ' ');

// =============================================================================
// TOKEN ANIMATION DEFINITIONS
// =============================================================================
// Animated spinning token sprites for major cryptocurrencies.
// Each token has 60 frames (matching the existing coin animation).

/**
 * Token animation definition for spinning coin/token sprites
 */
interface TokenAnimationDef {
  symbol: string;           // Token symbol (BTC, ETH, etc.)
  name: string;             // Full name
  brandColor: string;       // Primary brand color (hex)
  secondaryColor?: string;  // Secondary color (hex)
  tier: 1 | 2 | 3;          // Priority tier (1 = must have, 2 = high priority, 3 = nice to have)
}

/**
 * Token base prompt for spinning token sprites
 */
const TOKEN_BASE_PROMPT = `
Spinning coin token game asset, isometric view, 45-degree angle,
metallic coin with embossed logo, shiny reflective surface,
professional game sprite quality, crisp edges, clean vector style,
single coin isolated on transparent background, circular coin shape,
`.trim().replace(/\n/g, ' ');

/**
 * Token animation definitions for major cryptocurrencies
 * Organized by priority tier based on market cap and importance
 */
const TOKEN_ANIMATIONS: TokenAnimationDef[] = [
  // ==========================================================================
  // TIER 1 - Must Have (10 tokens)
  // ==========================================================================
  // Top cryptocurrencies by market cap and importance
  { symbol: 'BTC', name: 'Bitcoin', brandColor: '#F7931A', tier: 1 },
  { symbol: 'ETH', name: 'Ethereum', brandColor: '#627EEA', secondaryColor: '#8A92B2', tier: 1 },
  { symbol: 'SOL', name: 'Solana', brandColor: '#9945FF', secondaryColor: '#14F195', tier: 1 },
  { symbol: 'BNB', name: 'BNB', brandColor: '#F3BA2F', tier: 1 },
  { symbol: 'USDT', name: 'Tether', brandColor: '#26A17B', tier: 1 },
  { symbol: 'USDC', name: 'USD Coin', brandColor: '#2775CA', tier: 1 },
  { symbol: 'LINK', name: 'Chainlink', brandColor: '#375BD2', tier: 1 },
  { symbol: 'ARB', name: 'Arbitrum', brandColor: '#213147', secondaryColor: '#12AAFF', tier: 1 },
  { symbol: 'OP', name: 'Optimism', brandColor: '#FF0420', tier: 1 },
  { symbol: 'MATIC', name: 'Polygon', brandColor: '#8247E5', tier: 1 },
  
  // ==========================================================================
  // TIER 2 - High Priority (10 tokens)
  // ==========================================================================
  // Major DeFi protocols and popular tokens
  { symbol: 'AAVE', name: 'Aave', brandColor: '#B6509E', secondaryColor: '#2EBAC6', tier: 2 },
  { symbol: 'UNI', name: 'Uniswap', brandColor: '#FF007A', tier: 2 },
  { symbol: 'LDO', name: 'Lido DAO', brandColor: '#00A3FF', tier: 2 },
  { symbol: 'CRV', name: 'Curve', brandColor: '#FFF100', secondaryColor: '#000000', tier: 2 },
  { symbol: 'MKR', name: 'Maker', brandColor: '#1AAB9B', tier: 2 },
  { symbol: 'GMX', name: 'GMX', brandColor: '#4B7FFB', tier: 2 },
  { symbol: 'PEPE', name: 'Pepe', brandColor: '#4CAF50', tier: 2 },
  { symbol: 'DOGE', name: 'Dogecoin', brandColor: '#C2A633', tier: 2 },
  { symbol: 'SHIB', name: 'Shiba Inu', brandColor: '#FFA409', tier: 2 },
  { symbol: 'APE', name: 'ApeCoin', brandColor: '#0047FF', tier: 2 },
  
  // ==========================================================================
  // TIER 3 - Nice to Have (10 tokens)
  // ==========================================================================
  // Emerging protocols and specialized tokens
  { symbol: 'AVAX', name: 'Avalanche', brandColor: '#E84142', tier: 3 },
  { symbol: 'SUI', name: 'Sui', brandColor: '#4DA2FF', tier: 3 },
  { symbol: 'APT', name: 'Aptos', brandColor: '#34D399', tier: 3 },
  { symbol: 'TIA', name: 'Celestia', brandColor: '#7B2BF9', tier: 3 },
  { symbol: 'EIGEN', name: 'Eigenlayer', brandColor: '#1A1A2E', tier: 3 },
  { symbol: 'PENDLE', name: 'Pendle', brandColor: '#24C4FF', tier: 3 },
  { symbol: 'JUP', name: 'Jupiter', brandColor: '#FFAA34', tier: 3 },
  { symbol: 'RAY', name: 'Raydium', brandColor: '#C200FB', tier: 3 },
  { symbol: 'GRT', name: 'The Graph', brandColor: '#6F4CFF', tier: 3 },
  { symbol: 'PYTH', name: 'Pyth Network', brandColor: '#E6DAFE', secondaryColor: '#6B00FF', tier: 3 },
];

/**
 * Hero building prompts for major protocols
 */
const HERO_BUILDINGS: HeroBuildingPrompt[] = [
  // ---------------------------------------------------------------------------
  // DEFI PROTOCOLS
  // ---------------------------------------------------------------------------
  {
    id: 'aave-lending-tower',
    name: 'Aave Lending Tower',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Tall futuristic lending tower with purple and teal gradient colors,
      Aave brand colors (#B6509E, #2EBAC6), ghost-like ethereal glow effects,
      modern glass and steel architecture, floating holographic displays,
      DeFi protocol headquarters aesthetic, sci-fi financial hub,
      6x6 tile footprint, approximately 8 floors tall`,
  },
  
  {
    id: 'uniswap-exchange',
    name: 'Uniswap Exchange',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Distinctive DEX exchange building with pink magenta theme (#FF007A),
      iconic unicorn horn spire on top, swirling liquidity pool effect at base,
      modern sleek architecture, glass panels with pink reflections,
      trading floor visible through windows, animated swap indicators,
      4x4 tile footprint, medium height modern building`,
  },
  
  {
    id: 'lido-staking-hub',
    name: 'Lido Staking Hub',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Serene liquid staking facility with ocean blue theme (#00A3FF),
      wave-like architectural elements, flowing water features,
      coral accent decorations (#F69988), beacon tower with staking light,
      calm and stable appearance, modern sustainable design,
      5x5 tile footprint, medium height with lighthouse tower`,
  },
  
  {
    id: 'curve-finance-pool',
    name: 'Curve Finance Pool',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Curved organic building shape suggesting liquidity pools,
      deep blue color scheme (#0038FF) with red accent details,
      flowing curved architecture, pool-like water features,
      stablecoin vault aesthetic, low and wide design,
      5x4 tile footprint, wide low building with curves`,
  },
  
  {
    id: 'makerdao-vault',
    name: 'MakerDAO Vault',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Ancient temple-styled bank vault, teal green theme (#1AAB9B),
      classical columns with modern tech integration, golden DAI accents (#F4B731),
      massive vault doors visible, secure fortress appearance,
      blend of ancient wisdom and modern DeFi, prestigious institution,
      6x5 tile footprint, grand classical building`,
  },
  
  {
    id: 'pendle-yield-factory',
    name: 'Pendle Yield Factory',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Industrial yield factory with cyan theme (#17E7D6),
      pipes and machinery suggesting yield splitting, steam vents,
      time-decay visual elements (hourglasses, clocks), dark accents,
      alchemist laboratory meets modern factory aesthetic,
      4x3 tile footprint, industrial complex`,
  },
  
  {
    id: 'gmx-perps-arena',
    name: 'GMX Perps Arena',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Trading arena with blue theme (#3498DB), dark interior (#1A1A2E),
      leverage indicators (up to 50x), liquidation warning lights,
      stadium-like architecture for trading battles, bright displays,
      intense high-stakes trading floor aesthetic,
      5x5 tile footprint, arena-shaped building`,
  },
  
  {
    id: 'hyperliquid-terminal',
    name: 'Hyperliquid Terminal',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Ultra-modern neon green trading terminal (#00FF88),
      high-speed data visualization, holographic order books,
      dark background with bright neon accents, cyberpunk aesthetic,
      fastest perps exchange visual representation, sleek and minimal,
      4x4 tile footprint, futuristic compact building`,
  },
  
  // ---------------------------------------------------------------------------
  // EXCHANGES
  // ---------------------------------------------------------------------------
  {
    id: 'coinbase-tower',
    name: 'Coinbase Tower',
    category: 'exchange',
    prompt: `${BASE_PROMPT}
      Prestigious corporate headquarters tower, Coinbase blue (#0052FF),
      clean minimalist design, white accent panels, institutional trust aesthetic,
      massive skyscraper with glass facade, trading floors visible,
      compliant and professional appearance, NYSE-listed company vibe,
      8x8 tile footprint, tallest building in city`,
  },
  
  {
    id: 'binance-megaplex',
    name: 'Binance Megaplex',
    category: 'exchange',
    prompt: `${BASE_PROMPT}
      Massive trading complex, Binance yellow (#F0B90B) with dark accents (#1E2026),
      multiple connected buildings, global trading hub appearance,
      launchpad rocket on roof, BNB chain integration visual,
      empire-building aesthetic, sprawling campus,
      10x8 tile footprint, largest exchange building`,
  },
  
  {
    id: 'kraken-fortress',
    name: 'Kraken Fortress',
    category: 'exchange',
    prompt: `${BASE_PROMPT}
      Secure fortress-like exchange, purple theme (#5741D9),
      octopus/kraken motifs in architecture, security-focused design,
      thick walls, vault-like appearance, never been hacked aesthetic,
      Nordic/maritime influences, cold storage visible,
      6x6 tile footprint, fortified exchange`,
  },
  
  {
    id: 'ftx-ruins',
    name: 'FTX Ruins (Memorial)',
    category: 'exchange',
    prompt: `${BASE_PROMPT}
      Ruined collapsed building, gray and desaturated colors,
      former glory visible in remaining architecture, caution tape,
      warning signs, memorial flowers at entrance,
      cautionary tale aesthetic, crumbling facade,
      4x4 tile footprint, destroyed building`,
    negativePrompt: `${NEGATIVE_PROMPT}, cheerful, bright colors, functioning building`,
  },
  
  // ---------------------------------------------------------------------------
  // BLOCKCHAIN HQs
  // ---------------------------------------------------------------------------
  {
    id: 'ethereum-foundation-hq',
    name: 'Ethereum Foundation HQ',
    category: 'chain',
    prompt: `${BASE_PROMPT}
      Prestigious research institution, Ethereum purple-blue (#627EEA),
      octahedral/diamond motifs from Ethereum logo,
      smart contract visualizations on walls, merge commemorative elements,
      world computer headquarters, academic and technical aesthetic,
      8x6 tile footprint, institutional campus building`,
  },
  
  {
    id: 'solana-labs-campus',
    name: 'Solana Labs Campus',
    category: 'chain',
    prompt: `${BASE_PROMPT}
      High-speed tech campus, Solana purple (#9945FF) and green (#14F195),
      400ms block time visualized as fast-moving lights,
      modern Silicon Valley aesthetic, speed and scale focus,
      tropical vibes mixed with tech, gradient architecture,
      7x7 tile footprint, modern tech campus`,
  },
  
  {
    id: 'bitcoin-citadel',
    name: 'Bitcoin Citadel',
    category: 'chain',
    prompt: `${BASE_PROMPT}
      Ancient fortress storing digital gold, Bitcoin orange (#F7931A),
      massive citadel walls, vault-like security, laser eyes beaming from tower,
      21 million commemorated in architecture, no yield just HODL aesthetic,
      timeless design mixing ancient and modern, maximum prestige,
      8x8 tile footprint, ancient grand citadel`,
  },
  
  {
    id: 'base-camp',
    name: 'Base Camp',
    category: 'chain',
    prompt: `${BASE_PROMPT}
      Modern L2 headquarters, Base blue (#0052FF),
      Coinbase integration visible, onchain summer vibes,
      builder-focused aesthetic, startup energy,
      clean minimal design, welcoming appearance,
      5x5 tile footprint, modern startup HQ`,
  },
  
  // ---------------------------------------------------------------------------
  // CT CULTURE
  // ---------------------------------------------------------------------------
  {
    id: 'cobies-penthouse',
    name: "Cobie's Penthouse",
    category: 'ct',
    prompt: `${BASE_PROMPT}
      Luxurious penthouse with panoramic city views,
      podcast studio visible, alpha leak aesthetics,
      UpOnly branding elements, whale-tier luxury,
      modern minimalist interior, high above the city,
      4x4 tile footprint, rooftop penthouse`,
  },
  
  {
    id: 'gcr-observatory',
    name: 'GCR Observatory',
    category: 'ct',
    prompt: `${BASE_PROMPT}
      Mysterious market observation tower, telescope on roof,
      charts and data screens visible, dark and enigmatic,
      legend status aesthetics, market watching 24/7,
      anonymous and powerful vibe, signal tower,
      2x3 tile footprint, tall narrow observation tower`,
  },
  
  // ---------------------------------------------------------------------------
  // MEME CULTURE
  // ---------------------------------------------------------------------------
  {
    id: 'pepe-statue',
    name: 'Pepe Statue',
    category: 'meme',
    prompt: `${BASE_PROMPT}
      Statue monument of Pepe the Frog, green (#3D9970),
      "feels good man" pose, meme magic aesthetic,
      golden pedestal, tourist attraction vibe,
      beloved community icon, wholesome meme energy,
      2x2 tile footprint, statue on pedestal`,
  },
  
  {
    id: 'diamond-hands-monument',
    name: 'Diamond Hands Monument',
    category: 'meme',
    prompt: `${BASE_PROMPT}
      Crystal diamond hands holding crypto symbols,
      sparkling cyan diamonds (#B9F2FF), inspirational monument,
      HODL culture celebration, never selling aesthetic,
      bright and hopeful, tourist photo spot,
      2x2 tile footprint, crystal sculpture`,
  },
  
  {
    id: 'moon-rocket',
    name: 'To The Moon Rocket',
    category: 'meme',
    prompt: `${BASE_PROMPT}
      Retro-futuristic rocket ship on launch pad,
      gold and white colors (#FFD700), "to the moon" aesthetic,
      ready for liftoff, countdown display,
      optimistic bull market energy, space exploration vibes,
      2x3 tile footprint, rocket on launch pad`,
  },
  
  {
    id: 'rug-pull-crater',
    name: 'Rug Pull Crater',
    category: 'meme',
    prompt: `${BASE_PROMPT}
      Crater in the ground where building used to be,
      dark red and black colors (#8B0000), warning signs,
      cautionary memorial, "RIP" flowers and tokens,
      rug pulled away visual, sad but educational,
      3x3 tile footprint, crater/destroyed area`,
    negativePrompt: `${NEGATIVE_PROMPT}, happy, bright colors`,
  },
  
  {
    id: 'satoshi-shrine',
    name: 'Satoshi Shrine',
    category: 'meme',
    prompt: `${BASE_PROMPT}
      Japanese torii gate shrine honoring Satoshi,
      Bitcoin orange accents (#F7931A), mysterious and sacred,
      "21 million" inscriptions, anonymous creator tribute,
      peaceful and reverent, pilgrimage destination,
      2x2 tile footprint, small shrine`,
  },
  
  // ---------------------------------------------------------------------------
  // PLASMA BUILDINGS
  // ---------------------------------------------------------------------------
  // Plasma ecosystem buildings with diverse architectural styles and unique
  // color palettes. Each building has its own character while maintaining
  // the clean isometric pixel art style consistent with IsoCity buildings.
  // ---------------------------------------------------------------------------
  
  {
    id: 'plasma_hq',
    name: 'Plasma HQ',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Modern corporate headquarters skyscraper, glass and steel construction,
      navy blue tinted windows (#1E3A5F) with white steel frame,
      sleek contemporary office tower with rooftop helipad,
      multiple floors visible through windows, executive penthouse top,
      minimalist modern architecture, polished corporate aesthetic,
      4x4 tile footprint, tall imposing headquarters building`,
  },
  
  {
    id: 'plasma_node',
    name: 'Plasma Node',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Small server rack building, industrial gray metal (#4A4A4A),
      compact data center with ventilation grilles,
      single red status light on top, utilitarian design,
      server tower aesthetic, simple functional structure,
      1x1 tile footprint, small technical equipment building`,
  },
  
  {
    id: 'plasma_bridge',
    name: 'Plasma Bridge',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Stone and iron bridge with two decorative towers,
      warm sandstone color (#D4A574) with copper-green patina accents,
      ornate Victorian-era bridge architecture, suspension cables,
      detailed stonework, arched design connecting two points,
      2x3 tile footprint, elegant pedestrian bridge structure`,
  },
  
  {
    id: 'plasma_vault',
    name: 'Plasma Vault',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Bank vault building with thick concrete walls,
      gunmetal gray exterior (#5C5C5C) with brass door details,
      massive circular vault door visible on front facade,
      art deco security building aesthetic, fortress-like appearance,
      reinforced architecture, small windows with bars,
      2x2 tile footprint, secure vault building`,
  },
  
  {
    id: 'plasma_lab',
    name: 'Plasma Lab',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Research laboratory with white clinical exterior (#F5F5F5),
      teal accent panels (#008B8B), large observation windows,
      dome section on roof for experiments, modern scientific facility,
      clean lines, laboratory equipment visible through glass,
      academic research campus aesthetic,
      2x2 tile footprint, science laboratory building`,
  },
  
  {
    id: 'plasma_arena',
    name: 'Plasma Arena',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Sports arena with curved roof structure,
      deep red exterior (#8B0000) with cream trim accents,
      large entrance archways, stadium seating visible inside,
      modern coliseum design, event venue aesthetic,
      championship sports arena appearance,
      3x3 tile footprint, large arena building`,
  },
  
  {
    id: 'plasma_tower',
    name: 'Plasma Tower',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Tall communications tower with observation deck,
      silver metallic structure (#C0C0C0) with orange safety markings,
      radio antenna arrays, lattice steel construction,
      broadcast tower aesthetic, beacon light at peak,
      2x3 tile footprint, tall broadcast tower`,
  },
  
  {
    id: 'plasma_garden',
    name: 'Plasma Garden',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Botanical garden greenhouse with Victorian ironwork,
      white painted iron frame (#FFFFFF) with glass panels,
      lush green plants visible inside, decorative dome roof,
      garden pavilion aesthetic, ornate conservatory design,
      flowering plants and small trees inside,
      2x2 tile footprint, glass greenhouse garden`,
  },
  
  {
    id: 'plasma_fountain',
    name: 'Plasma Fountain',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Ornate stone fountain with tiered water basins,
      white marble (#F0EAD6) with copper green verdigris accents,
      water spraying upward, classical Roman fountain design,
      decorative sculptures, public plaza centerpiece,
      1x1 tile footprint, small decorative fountain`,
  },
  
  {
    id: 'plasma_monument',
    name: 'Plasma Monument',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Granite obelisk monument on stepped pedestal,
      dark gray granite (#2F4F4F) with gold inscription plates,
      commemorative memorial aesthetic, eternal flame at base,
      dignified classical monument design, wreath decorations,
      2x2 tile footprint, memorial monument`,
  },
  
  {
    id: 'plasma_gateway',
    name: 'Plasma Gateway',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Grand entrance gate with two pillars and archway,
      terracotta brick (#CD853F) with wrought iron gates,
      decorative lanterns on pillars, welcoming city entrance,
      classical European gate design, ornamental ironwork,
      2x1 tile footprint, entry gateway arch`,
  },
  
  {
    id: 'plasma_observatory',
    name: 'Plasma Observatory',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Astronomical observatory with rotating dome roof,
      cream colored building (#FFF8DC) with copper dome (#B87333),
      telescope visible through dome opening, scientific facility,
      hilltop observatory aesthetic, classical architecture,
      2x2 tile footprint, domed observatory building`,
  },
  
  {
    id: 'plasma_reactor',
    name: 'Plasma Reactor',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Industrial power plant with cooling towers,
      concrete gray (#808080) with yellow safety stripes,
      steam rising from cooling towers, heavy industrial facility,
      power generation complex, smokestacks and pipes,
      nuclear power plant aesthetic without radiation symbols,
      3x3 tile footprint, industrial power facility`,
  },
  
  {
    id: 'plasma_academy',
    name: 'Plasma Academy',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Classical university building with columned entrance,
      warm brick red (#A0522D) with white column details,
      ivy-covered walls, large arched windows, clock tower,
      prestigious academic institution aesthetic, campus building,
      traditional collegiate architecture,
      3x2 tile footprint, university academy building`,
  },
  
  {
    id: 'plasma_museum',
    name: 'Plasma Museum',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Neoclassical museum with grand columned facade,
      white stone exterior (#FAF0E6) with bronze door details,
      triangular pediment with sculptural relief, wide steps,
      Smithsonian-style museum aesthetic, cultural institution,
      large display windows showing exhibits inside,
      2x2 tile footprint, classical museum building`,
  },
  
  {
    id: 'plasma_stadium',
    name: 'Plasma Stadium',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Large football stadium with distinctive roof structure,
      blue steel frame (#4169E1) with white fabric roof canopy,
      massive tiered seating bowl visible, floodlight towers,
      modern sports stadium aesthetic, championship venue,
      4x3 tile footprint, grand sports stadium`,
  },
  
  {
    id: 'plasma_spire',
    name: 'Plasma Spire',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Tall Gothic church spire with ornate stonework,
      gray limestone (#A9A9A9) with darker stone accents,
      pointed spire reaching high, decorative finials,
      cathedral tower aesthetic, medieval architecture style,
      1x2 tile footprint, tall stone spire`,
  },
  
  {
    id: 'plasma_nexus',
    name: 'Plasma Nexus',
    category: 'plasma',
    prompt: `${BASE_PROMPT}
      Modern transit hub with distinctive curved roof,
      glass and white steel construction (#F8F8FF),
      multiple entry points, central atrium visible,
      transportation interchange aesthetic, Grand Central style,
      busy urban hub architecture, skylight roof,
      3x3 tile footprint, central transit nexus building`,
  },
  
  // ---------------------------------------------------------------------------
  // STABLECOIN ISSUERS
  // ---------------------------------------------------------------------------
  // Major stablecoin protocols with institutional architecture aesthetic.
  // Each has unique branding while maintaining professional appearance.
  
  {
    id: 'tether_hq',
    name: 'Tether HQ',
    category: 'stablecoin',
    prompt: `${BASE_PROMPT}
      Grand corporate headquarters with neoclassical elements,
      cream white stone facade (#F5F5DC) with green accent trim (#228B22),
      massive entrance with Corinthian columns, Tether logo subtly visible,
      imposing financial institution aesthetic, bank-like architecture,
      central dome with flag on top, gold window frames,
      4x3 tile footprint, major financial headquarters`,
  },
  
  {
    id: 'circle_tower',
    name: 'Circle Tower',
    category: 'stablecoin',
    prompt: `${BASE_PROMPT}
      Modern cylindrical skyscraper with blue glass exterior,
      Circle brand blue (#3773F5) reflective windows, white steel frame,
      rounded contemporary architecture, rooftop helipad,
      Silicon Valley tech campus aesthetic, innovative design,
      LED accent lighting, clean minimalist facade,
      3x3 tile footprint, modern tech headquarters tower`,
  },
  
  {
    id: 'ethena_labs',
    name: 'Ethena Labs',
    category: 'stablecoin',
    prompt: `${BASE_PROMPT}
      Futuristic laboratory complex with angular architecture,
      dark purple (#4B0082) with electric gold (#FFD700) accents,
      glass atrium showing lab equipment inside, chemistry aesthetic,
      research facility with solar panels on roof,
      high-tech biotech campus style, experimental vibe,
      2x2 tile footprint, innovative research lab building`,
  },
  
  // ---------------------------------------------------------------------------
  // INFRASTRUCTURE PROTOCOLS
  // ---------------------------------------------------------------------------
  // Oracles, bridges, and data infrastructure with industrial/tech aesthetic.
  
  {
    id: 'chainlink_hub',
    name: 'Chainlink Hub',
    category: 'infrastructure',
    prompt: `${BASE_PROMPT}
      Hexagonal data center with satellite dishes on roof,
      Chainlink blue (#375BD2) steel panels with white trim,
      server room visible through windows, antenna array,
      telecommunications hub aesthetic, network operations center,
      industrial tech architecture, backup generators visible,
      3x3 tile footprint, major data infrastructure building`,
  },
  
  {
    id: 'the_graph_indexer',
    name: 'The Graph Indexer',
    category: 'infrastructure',
    prompt: `${BASE_PROMPT}
      Modern library-like building with large glass windows,
      The Graph purple (#6F4CFF) accents on white facade,
      visible server racks through windows, data center aesthetic,
      rows of indexed books/data visualization motif,
      organized and methodical architecture, information hub,
      2x2 tile footprint, data indexing facility`,
  },
  
  {
    id: 'pyth_observatory',
    name: 'Pyth Observatory',
    category: 'infrastructure',
    prompt: `${BASE_PROMPT}
      Observatory building with rotating dome on top,
      sleek black (#1A1A2E) with purple (#6B00FF) LED accents,
      telescope dome, astronomical research aesthetic,
      high-precision measurement facility style,
      stargazing architecture with scientific equipment,
      2x2 tile footprint, oracle observatory building`,
  },
  
  {
    id: 'layerzero_bridge',
    name: 'LayerZero Bridge',
    category: 'infrastructure',
    prompt: `${BASE_PROMPT}
      Suspension bridge gatehouse with twin towers,
      bronze-colored metal (#CD7F32) with black steel cables,
      bridge architecture on building, gateway aesthetic,
      Victorian engineering style with modern elements,
      control tower for bridge operations visible,
      2x3 tile footprint, bridge control building`,
  },
  
  {
    id: 'wormhole_portal',
    name: 'Wormhole Portal',
    category: 'infrastructure',
    prompt: `${BASE_PROMPT}
      Circular portal structure with spinning ring aesthetic,
      dark navy (#191970) with cyan portal glow (#00FFFF),
      sci-fi teleportation gate building, energy conduits,
      interdimensional gateway architecture, futuristic design,
      control panels and energy cables visible,
      2x2 tile footprint, wormhole portal gateway`,
  },
  
  // ---------------------------------------------------------------------------
  // ADDITIONAL DEFI PROTOCOLS
  // ---------------------------------------------------------------------------
  // New DeFi buildings with diverse architectural styles.
  
  {
    id: 'eigenlayer_vault',
    name: 'Eigenlayer Vault',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Massive reinforced vault building with layered design,
      gunmetal gray (#2F4F4F) with gold vault door visible,
      brutalist architecture with security aesthetic,
      multiple stacked layers visible from outside,
      high-security bank vault style, imposing presence,
      3x3 tile footprint, restaking vault building`,
  },
  
  {
    id: 'morpho_optimizer',
    name: 'Morpho Optimizer',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Butterfly-wing inspired modern building,
      iridescent blue-green (#4682B4) with glass panels,
      organic curved architecture, nature-tech fusion,
      metamorphosis aesthetic, elegant flowing design,
      solar-efficient windows, sustainable building,
      2x2 tile footprint, optimization center building`,
  },
  
  {
    id: 'maple_finance',
    name: 'Maple Finance',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Canadian-inspired stone building with maple leaf motifs,
      warm red brick (#8B0000) with autumn orange accents (#FF8C00),
      bay windows, Victorian banking aesthetic,
      traditional financial institution style, solid and trustworthy,
      decorative ironwork, carved stone details,
      2x2 tile footprint, institutional lending building`,
  },
  
  {
    id: 'spark_protocol',
    name: 'Spark Protocol',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Electric power station styled building,
      bright yellow (#FFD700) with silver metal accents,
      lightning rod on roof, transformer aesthetic,
      energy generation facility style, sparking effects,
      industrial power architecture, high voltage signs,
      2x2 tile footprint, lending power station`,
  },
  
  {
    id: 'ondo_finance',
    name: 'Ondo Finance',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Classical Federal Reserve inspired building,
      white marble (#FFFAFA) with dark gray granite trim,
      imposing columned entrance, eagle sculpture on top,
      government treasury aesthetic, serious and formal,
      tall windows, American Beaux-Arts architecture,
      2x2 tile footprint, real-world assets building`,
  },
  
  {
    id: 'sky_money',
    name: 'Sky.money',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Cloud-shaped futuristic floating building,
      light blue (#87CEEB) with white fluffy accents,
      rooftop garden with sky motifs, elevated platforms,
      ethereal cloud city aesthetic, dream-like architecture,
      windmill and solar panels, sustainable sky building,
      3x2 tile footprint, cloud stablecoin headquarters`,
  },
  
  // ---------------------------------------------------------------------------
  // SOLANA ECOSYSTEM DEFI
  // ---------------------------------------------------------------------------
  // Solana DeFi protocols with faster, more dynamic aesthetic.
  
  {
    id: 'jupiter_terminal',
    name: 'Jupiter Terminal',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Space station styled terminal building,
      orange-gold (#FF8C00) with teal accent panels (#008080),
      planetary ring motifs, orbital trajectory aesthetic,
      mission control center style, radar dishes,
      sci-fi space exploration architecture, Jupiter theme,
      2x2 tile footprint, swap aggregator terminal`,
  },
  
  {
    id: 'raydium_pool',
    name: 'Raydium Pool',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Radioactive-themed industrial facility,
      neon purple (#9400D3) with toxic green (#32CD32) accents,
      bubbling pool tanks visible, chemical plant aesthetic,
      AMM liquidity factory style, pipes and valves,
      hazmat industrial architecture, glowing containers,
      2x2 tile footprint, liquidity pool facility`,
  },
  
  {
    id: 'orca_whirlpool',
    name: 'Orca Whirlpool',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Aquarium-styled modern building with water features,
      ocean blue (#0077BE) with white whale motifs,
      glass walls showing water inside, whirlpool fountain,
      marine research center aesthetic, organic curves,
      orca-inspired architecture, aquatic design,
      2x2 tile footprint, concentrated liquidity building`,
  },
  
  {
    id: 'kamino_finance',
    name: 'Kamino Finance',
    category: 'defi',
    prompt: `${BASE_PROMPT}
      Target/bullseye themed modern building,
      red and white concentric ring patterns (#DC143C, #FFFFFF),
      precision engineering aesthetic, archery range motif,
      high-accuracy financial targeting architecture,
      sleek modern sports facility style,
      2x2 tile footprint, auto-compound facility`,
  },
  
  // ---------------------------------------------------------------------------
  // ADDITIONAL L2 CHAINS
  // ---------------------------------------------------------------------------
  // New Layer 2 blockchain headquarters.
  
  {
    id: 'zksync_tower',
    name: 'zkSync Era Tower',
    category: 'chain',
    prompt: `${BASE_PROMPT}
      Tall encryption-themed skyscraper,
      electric purple (#8A2BE2) with black security panels,
      zero-knowledge proof symbols, padlock motifs,
      secure data fortress aesthetic, encoded patterns,
      high-tech security architecture, LED matrix displays,
      2x3 tile footprint, zero-knowledge chain tower`,
  },
  
  {
    id: 'scroll_campus',
    name: 'Scroll Campus',
    category: 'chain',
    prompt: `${BASE_PROMPT}
      Ancient scroll and parchment inspired building,
      warm tan (#D2B48C) with orange terracotta (#E2725B) tiles,
      curved roof like an unrolled scroll, library aesthetic,
      East Asian pagoda influence, scholarly architecture,
      decorative scrollwork, knowledge center style,
      2x2 tile footprint, zkEVM campus building`,
  },
  
  {
    id: 'linea_station',
    name: 'Linea Station',
    category: 'chain',
    prompt: `${BASE_PROMPT}
      Modern train station with Art Deco elements,
      ConsenSys orange (#F6851B) with chrome accents,
      streamlined locomotive-inspired architecture,
      transportation hub aesthetic, speed lines,
      grand concourse visible through glass,
      2x2 tile footprint, L2 transit station building`,
  },
  
  {
    id: 'blast_arena',
    name: 'Blast Arena',
    category: 'chain',
    prompt: `${BASE_PROMPT}
      Explosive gaming arena with dynamic architecture,
      bright yellow (#FFFF00) with black blast pattern (#000000),
      action sports venue aesthetic, explosion motifs,
      esports arena style, LED screens visible,
      energy and excitement, dynamic angular design,
      2x2 tile footprint, native yield arena`,
  },
  
  {
    id: 'mantle_hub',
    name: 'Mantle Hub',
    category: 'chain',
    prompt: `${BASE_PROMPT}
      Treasury-themed grand hall building,
      rich burgundy (#800020) with gold leaf accents (#DAA520),
      cape/mantle fabric architectural elements,
      BitDAO treasury aesthetic, royal design,
      ornate but modern, wealth management style,
      2x2 tile footprint, treasury-backed chain hub`,
  },
];

// =============================================================================
// API CLIENT
// =============================================================================

/**
 * Generate an image using the Nanobanana API
 * 
 * @param prompt - The text prompt for image generation
 * @param options - Additional options (negative prompt, size, etc.)
 * @returns Base64 encoded image data
 */
async function generateImage(
  prompt: string,
  options: {
    negativePrompt?: string;
    size?: string;
    style?: string;
  } = {}
): Promise<Buffer> {
  const apiKey = process.env.NANOBANANA_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'NANOBANANA_API_KEY environment variable not set.\n' +
      'Get your API key from the Nanobanana dashboard and set it:\n' +
      '  export NANOBANANA_API_KEY="your-key-here"'
    );
  }

  const requestBody = {
    prompt: prompt,
    negative_prompt: options.negativePrompt || NEGATIVE_PROMPT,
    width: parseInt(options.size?.split('x')[0] || String(DEFAULT_SIZE)),
    height: parseInt(options.size?.split('x')[1] || String(DEFAULT_SIZE)),
    style: options.style || 'isometric_game_art',
    output_format: 'png',
    remove_background: true,
  };

  console.log(`  Calling Nanobanana API...`);
  
  // NOTE: This is a placeholder implementation
  // Replace with actual Nanobanana API when available
  // For now, we'll simulate the API call
  
  try {
    const response = await fetch(NANOBANANA_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { image: string };
    
    // Assuming API returns base64 encoded image
    const imageBuffer = Buffer.from(data.image, 'base64');
    return imageBuffer;
    
  } catch (error) {
    if ((error as { cause?: { code?: string } }).cause?.code === 'ENOTFOUND') {
      console.log(`  ⚠️  API not reachable - saving placeholder`);
      // Return a placeholder image (1x1 transparent PNG)
      return Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
    }
    throw error;
  }
}

/**
 * Save generated image to disk
 */
async function saveImage(
  imageBuffer: Buffer,
  building: HeroBuildingPrompt
): Promise<string> {
  // Create category directory if needed
  const categoryDir = path.join(OUTPUT_DIR, building.category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  // Save the image
  const filename = `${building.id}.png`;
  const filepath = path.join(categoryDir, filename);
  
  fs.writeFileSync(filepath, imageBuffer);
  
  return filepath;
}

// =============================================================================
// MAIN GENERATION LOGIC
// =============================================================================

/**
 * Generate assets for specified buildings
 */
async function generateAssets(options: {
  buildingId?: string;
  category?: string;
  dryRun?: boolean;
}): Promise<void> {
  console.log('🎨 Nanobanana Asset Generator');
  console.log('============================\n');

  // Filter buildings based on options
  let buildings = HERO_BUILDINGS;
  
  if (options.buildingId) {
    buildings = buildings.filter(b => b.id === options.buildingId);
    if (buildings.length === 0) {
      console.error(`❌ Building not found: ${options.buildingId}`);
      console.log('\nAvailable buildings:');
      HERO_BUILDINGS.forEach(b => console.log(`  - ${b.id}`));
      process.exit(1);
    }
  }
  
  if (options.category) {
    buildings = buildings.filter(b => b.category === options.category);
    if (buildings.length === 0) {
      console.error(`❌ No buildings in category: ${options.category}`);
      console.log('\nAvailable categories:');
      const categories = [...new Set(HERO_BUILDINGS.map(b => b.category))];
      categories.forEach(c => console.log(`  - ${c}`));
      process.exit(1);
    }
  }

  console.log(`📦 Generating ${buildings.length} building(s)\n`);

  if (options.dryRun) {
    console.log('🔍 DRY RUN - No images will be generated\n');
  }

  // Generate each building
  for (const building of buildings) {
    console.log(`🏗️  ${building.name} (${building.id})`);
    console.log(`   Category: ${building.category}`);
    
    if (options.dryRun) {
      console.log(`   Prompt: ${building.prompt.substring(0, 100)}...`);
      console.log('   ✅ Would generate\n');
      continue;
    }

    try {
      const imageBuffer = await generateImage(building.prompt, {
        negativePrompt: building.negativePrompt,
        size: building.size,
        style: building.style,
      });

      const filepath = await saveImage(imageBuffer, building);
      console.log(`   ✅ Saved to: ${filepath}\n`);

    } catch (error) {
      console.error(`   ❌ Error: ${(error as Error).message}\n`);
    }

    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('✨ Generation complete!');
}

// =============================================================================
// TOKEN ANIMATION GENERATOR
// =============================================================================

/**
 * Output directory for token animations
 */
const TOKEN_OUTPUT_DIR = path.join(__dirname, '..', 'public', 'Animations', 'tokens');

/**
 * Generate token animation prompt for a specific frame
 * 
 * @param token - Token definition
 * @param frameIndex - Frame index (0-59)
 * @returns Prompt for the specific frame
 */
function generateTokenFramePrompt(token: TokenAnimationDef, frameIndex: number): string {
  // Calculate rotation angle for this frame (0-360 degrees over 60 frames)
  const rotationAngle = (frameIndex / 60) * 360;
  
  // Determine the visible angle description
  let angleDescription: string;
  if (rotationAngle < 45 || rotationAngle > 315) {
    angleDescription = 'front-facing view of coin';
  } else if (rotationAngle >= 45 && rotationAngle < 135) {
    angleDescription = 'side-angled view of coin, turning right';
  } else if (rotationAngle >= 135 && rotationAngle < 225) {
    angleDescription = 'back view of coin showing reverse side';
  } else {
    angleDescription = 'side-angled view of coin, turning left';
  }
  
  const colorDescription = token.secondaryColor 
    ? `${token.brandColor} primary color with ${token.secondaryColor} secondary accent`
    : `${token.brandColor} brand color throughout`;
  
  return `${TOKEN_BASE_PROMPT}
    ${token.name} (${token.symbol}) cryptocurrency token,
    ${colorDescription},
    ${angleDescription},
    embossed ${token.symbol} logo/symbol on coin face,
    rotation angle approximately ${Math.round(rotationAngle)} degrees,
    matching isometric game art style, pixel-perfect edges`;
}

/**
 * Save a token animation frame
 */
async function saveTokenFrame(
  imageBuffer: Buffer,
  token: TokenAnimationDef,
  frameIndex: number
): Promise<string> {
  // Create token directory if it doesn't exist
  const tokenDir = path.join(TOKEN_OUTPUT_DIR, token.symbol);
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true });
  }
  
  // Format frame index with leading zeros (S00, S01, ... S59)
  const frameNumber = String(frameIndex).padStart(2, '0');
  const filename = `${token.symbol}_S${frameNumber}.png`;
  const filepath = path.join(tokenDir, filename);
  
  fs.writeFileSync(filepath, imageBuffer);
  return filepath;
}

/**
 * Generate all frames for a token animation
 */
async function generateTokenAnimation(
  token: TokenAnimationDef,
  options: { dryRun: boolean }
): Promise<void> {
  console.log(`🪙 Generating ${token.name} (${token.symbol}) animation...`);
  console.log(`   Brand Color: ${token.brandColor}`);
  console.log(`   Tier: ${token.tier}`);
  
  const totalFrames = 60; // Match existing coin animation
  
  if (options.dryRun) {
    console.log(`   Would generate ${totalFrames} frames`);
    console.log(`   Output: /public/Animations/tokens/${token.symbol}/`);
    console.log('   ✅ Would generate\n');
    return;
  }
  
  for (let frame = 0; frame < totalFrames; frame++) {
    try {
      const prompt = generateTokenFramePrompt(token, frame);
      const imageBuffer = await generateImage(prompt, {
        size: '256x256', // Smaller size for token sprites
        style: 'spinning_token',
      });
      
      await saveTokenFrame(imageBuffer, token, frame);
      
      // Progress indicator
      if ((frame + 1) % 10 === 0) {
        console.log(`   Progress: ${frame + 1}/${totalFrames} frames`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`   ❌ Frame ${frame} error: ${(error as Error).message}`);
    }
  }
  
  console.log(`   ✅ Generated ${totalFrames} frames\n`);
}

/**
 * Generate token animations based on options
 */
async function generateTokenAnimations(options: {
  symbol?: string;
  tier?: number;
  dryRun: boolean;
}): Promise<void> {
  console.log('\n🪙 TOKEN ANIMATION GENERATOR');
  console.log('=============================\n');
  
  // Filter tokens based on options
  let tokens = TOKEN_ANIMATIONS;
  
  if (options.symbol) {
    const symbolUpper = options.symbol.toUpperCase();
    tokens = tokens.filter(t => t.symbol === symbolUpper);
    if (tokens.length === 0) {
      console.error(`❌ Token not found: ${options.symbol}`);
      console.log('\nAvailable tokens:');
      TOKEN_ANIMATIONS.forEach(t => console.log(`  - ${t.symbol} (${t.name})`));
      process.exit(1);
    }
  }
  
  if (options.tier) {
    tokens = tokens.filter(t => t.tier === options.tier);
    if (tokens.length === 0) {
      console.error(`❌ No tokens in tier: ${options.tier}`);
      console.log('\nAvailable tiers: 1, 2, 3');
      process.exit(1);
    }
  }
  
  console.log(`📦 Generating animations for ${tokens.length} token(s)\n`);
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN - No images will be generated\n');
  }
  
  for (const token of tokens) {
    await generateTokenAnimation(token, { dryRun: options.dryRun });
  }
  
  console.log('✨ Token animation generation complete!');
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

interface CLIOptions {
  buildingId?: string;
  category?: string;
  tokenSymbol?: string;
  tokenTier?: number;
  generateTokens: boolean;
  dryRun: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    generateTokens: false,
    dryRun: false,
  };

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
      case '--tokens':
      case '-t':
        options.generateTokens = true;
        break;
      case '--token-symbol':
      case '-ts':
        options.tokenSymbol = args[++i];
        options.generateTokens = true;
        break;
      case '--token-tier':
      case '-tt':
        options.tokenTier = parseInt(args[++i], 10);
        options.generateTokens = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Nanobanana Asset Generator for Crypto City

Usage:
  npx ts-node scripts/generateAssets.ts [options]

Building Options:
  --building, -b <id>     Generate a specific building by ID
  --category, -c <name>   Generate all buildings in a category

Token Animation Options:
  --tokens, -t            Generate token animations (instead of buildings)
  --token-symbol, -ts <s> Generate animation for a specific token symbol
  --token-tier, -tt <n>   Generate animations for tokens in tier (1, 2, or 3)

General Options:
  --dry-run, -d           Show what would be generated without calling API
  --help, -h              Show this help message

Building Categories:
  defi           - DeFi protocol buildings (Aave, Uniswap, Jupiter, etc.)
  exchange       - Exchange buildings (Coinbase, Binance, etc.)
  chain          - Blockchain HQ buildings (Ethereum, Solana, zkSync, etc.)
  ct             - Crypto Twitter culture buildings
  meme           - Meme culture props and monuments
  plasma         - Plasma L2 ecosystem buildings (HQ, Nodes, Bridge, etc.)
  stablecoin     - Stablecoin issuers (Tether, Circle, Ethena)
  infrastructure - Oracles & bridges (Chainlink, LayerZero, Wormhole)

Token Tiers:
  1 - Must Have   (BTC, ETH, SOL, BNB, USDT, USDC, LINK, ARB, OP, MATIC)
  2 - High Priority (AAVE, UNI, LDO, CRV, MKR, GMX, PEPE, DOGE, SHIB, APE)
  3 - Nice to Have (AVAX, SUI, APT, TIA, EIGEN, PENDLE, JUP, RAY, GRT, PYTH)

Examples:
  # Generate all buildings
  npx ts-node scripts/generateAssets.ts

  # Generate specific building
  npx ts-node scripts/generateAssets.ts --building aave-lending-tower

  # Generate all defi buildings (dry run)
  npx ts-node scripts/generateAssets.ts --category defi --dry-run

  # Generate all token animations
  npx ts-node scripts/generateAssets.ts --tokens

  # Generate BTC token animation only
  npx ts-node scripts/generateAssets.ts --token-symbol BTC

  # Generate tier 1 token animations (dry run)
  npx ts-node scripts/generateAssets.ts --token-tier 1 --dry-run
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// =============================================================================
// ENTRY POINT
// =============================================================================

const options = parseArgs();

// Determine which generation mode to run
if (options.generateTokens) {
  // Generate token animations
  generateTokenAnimations({
    symbol: options.tokenSymbol,
    tier: options.tokenTier,
    dryRun: options.dryRun,
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else {
  // Generate building assets
  generateAssets({
    buildingId: options.buildingId,
    category: options.category,
    dryRun: options.dryRun,
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

