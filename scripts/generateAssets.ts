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
// CLI INTERFACE
// =============================================================================

/**
 * Parse command line arguments
 */
function parseArgs(): { buildingId?: string; category?: string; dryRun: boolean } {
  const args = process.argv.slice(2);
  const options: { buildingId?: string; category?: string; dryRun: boolean } = {
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
      case '--help':
      case '-h':
        console.log(`
Nanobanana Asset Generator for Crypto City

Usage:
  npx ts-node scripts/generateAssets.ts [options]

Options:
  --building, -b <id>     Generate a specific building by ID
  --category, -c <name>   Generate all buildings in a category
  --dry-run, -d           Show what would be generated without calling API
  --help, -h              Show this help message

Categories:
  defi      - DeFi protocol buildings (Aave, Uniswap, etc.)
  exchange  - Exchange buildings (Coinbase, Binance, etc.)
  chain     - Blockchain HQ buildings (Ethereum, Solana, etc.)
  ct        - Crypto Twitter culture buildings
  meme      - Meme culture props and monuments

Examples:
  npx ts-node scripts/generateAssets.ts
  npx ts-node scripts/generateAssets.ts --building aave-lending-tower
  npx ts-node scripts/generateAssets.ts --category defi --dry-run
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
generateAssets(options).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

