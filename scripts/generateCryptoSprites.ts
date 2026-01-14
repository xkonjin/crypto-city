#!/usr/bin/env node
/**
 * CRYPTO SPRITE GENERATOR - High Quality Isometric Pixel Art
 * 
 * Generates isometric building sprites using Google's Gemini API that match
 * the existing IsoCity style (512x512, transparent, bottom-anchored, pixel art).
 * 
 * Usage:
 *   GEMINI_API_KEY=your_key npx ts-node scripts/generateCryptoSprites.ts
 *   
 * Options:
 *   --limit <n>        Maximum number of sprites to generate
 *   --category <c>     Only generate for specific category
 *   --building <id>    Generate specific building by ID
 *   --dry-run          Show what would be generated without calling API
 *   --test-one         Generate just one test sprite to validate style
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  console.error('Usage: GEMINI_API_KEY=your_key npx ts-node scripts/generateCryptoSprites.ts');
  process.exit(1);
}

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUILDINGS_FILE = path.join(PROJECT_ROOT, 'src/games/isocity/crypto/buildings.ts');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public/Building/crypto');
const REFERENCE_SPRITE = path.join(PROJECT_ROOT, 'public/Building/residential/2x2limestone_south.png');

// =============================================================================
// OFFICIAL BRAND COLORS (from research)
// =============================================================================

const BRAND_COLORS: Record<string, { primary: string; secondary?: string; accent?: string }> = {
  // DeFi
  'uniswap': { primary: '#FF007A', secondary: '#FF007A', accent: '#FFD7E6' },
  'aave': { primary: '#B6509E', secondary: '#2EBAC6', accent: '#9896FF' },
  'lido': { primary: '#00A3FF', secondary: '#F69988', accent: '#F5F5F5' },
  'curve': { primary: '#FF007A', secondary: '#0000FF', accent: '#FFFF00' },
  'makerdao': { primary: '#1AAB9B', secondary: '#6ACEBB', accent: '#F4B731' },
  'compound': { primary: '#00D395', secondary: '#070A0E', accent: '#F5F5F5' },
  'eigenlayer': { primary: '#1A0A3E', secondary: '#7B5BE6', accent: '#FFFFFF' },
  'balancer': { primary: '#1E1E1E', secondary: '#FFFFFF', accent: '#FFD700' },
  'yearn': { primary: '#006AE3', secondary: '#0657F9', accent: '#F5F5F5' },
  'pendle': { primary: '#EAEAEA', secondary: '#00C6A2', accent: '#1B1B1B' },
  'morpho': { primary: '#1F2A37', secondary: '#7ED321', accent: '#FFFFFF' },
  'jupiter': { primary: '#00D8A5', secondary: '#131313', accent: '#FFFFFF' },
  'raydium': { primary: '#3875BC', secondary: '#1FCB4F', accent: '#FFFFFF' },
  'orca': { primary: '#FFD233', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'hyperliquid': { primary: '#00FFA3', secondary: '#1A1A2E', accent: '#FFFFFF' },
  
  // Exchanges
  'binance': { primary: '#F0B90B', secondary: '#1E2026', accent: '#FFFFFF' },
  'coinbase': { primary: '#0052FF', secondary: '#FFFFFF', accent: '#0A0B0D' },
  'kraken': { primary: '#5741D9', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'okx': { primary: '#000000', secondary: '#FFFFFF', accent: '#00FF00' },
  'bybit': { primary: '#F7A600', secondary: '#1E1E1E', accent: '#FFFFFF' },
  'kucoin': { primary: '#23AF91', secondary: '#1B1B1B', accent: '#FFFFFF' },
  'gemini': { primary: '#00DCFA', secondary: '#1B1B1B', accent: '#FFFFFF' },
  
  // Chains
  'ethereum': { primary: '#627EEA', secondary: '#3C3C3D', accent: '#FFFFFF' },
  'solana': { primary: '#9945FF', secondary: '#14F195', accent: '#000000' },
  'bitcoin': { primary: '#F7931A', secondary: '#4D4D4D', accent: '#FFFFFF' },
  'arbitrum': { primary: '#28A0F0', secondary: '#213147', accent: '#FFFFFF' },
  'optimism': { primary: '#FF0420', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'polygon': { primary: '#8247E5', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'base': { primary: '#0052FF', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'avalanche': { primary: '#E84142', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'zksync': { primary: '#8B8DFC', secondary: '#1E1E1E', accent: '#FFFFFF' },
  'scroll': { primary: '#FFEEDA', secondary: '#EBC28E', accent: '#1B1B1B' },
  'linea': { primary: '#61DFFF', secondary: '#121212', accent: '#FFFFFF' },
  'blast': { primary: '#FCFC03', secondary: '#000000', accent: '#FFFFFF' },
  'mantle': { primary: '#000000', secondary: '#FFFFFF', accent: '#65D9E4' },
  
  // Stablecoins
  'tether': { primary: '#26A17B', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'circle': { primary: '#2775CA', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'dai': { primary: '#F5AC37', secondary: '#1B1B1B', accent: '#FFFFFF' },
  'ethena': { primary: '#000000', secondary: '#7B68EE', accent: '#FFFFFF' },
  
  // Infrastructure
  'chainlink': { primary: '#375BD2', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'thegraph': { primary: '#6747ED', secondary: '#0C0A1D', accent: '#FFFFFF' },
  'pyth': { primary: '#E5E7EB', secondary: '#7C3AED', accent: '#1B1B1B' },
  'layerzero': { primary: '#000000', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'wormhole': { primary: '#FFFFFF', secondary: '#7B3FE4', accent: '#1B1B1B' },
  
  // Meme
  'pepe': { primary: '#479A37', secondary: '#509624', accent: '#FFFFFF' },
  'doge': { primary: '#C3A634', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'shiba': { primary: '#FFA409', secondary: '#E4202D', accent: '#FFFFFF' },
  'wif': { primary: '#8B5CF6', secondary: '#F472B6', accent: '#1B1B1B' },
  'bonk': { primary: '#F97316', secondary: '#FCD34D', accent: '#1B1B1B' },
  'popcat': { primary: '#F97316', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'brett': { primary: '#0052FF', secondary: '#FFFFFF', accent: '#1B1B1B' },
  'floki': { primary: '#D4A853', secondary: '#1B1B1B', accent: '#FFFFFF' },
  'mog': { primary: '#FFD700', secondary: '#1B1B1B', accent: '#FFFFFF' },
  
  // Plasma (Official brand colors)
  'plasma': { primary: '#569F8C', secondary: '#162F29', accent: '#DCEFEA' },
};

// Category color themes
const CATEGORY_COLORS: Record<string, { primary: string; secondary: string; accent: string; style: string }> = {
  defi: { primary: '#3B82F6', secondary: '#1E3A5F', accent: '#93C5FD', style: 'modern financial glass tower' },
  exchange: { primary: '#22C55E', secondary: '#14532D', accent: '#86EFAC', style: 'trading hub corporate building' },
  chain: { primary: '#A855F7', secondary: '#581C87', accent: '#D8B4FE', style: 'futuristic blockchain datacenter' },
  ct: { primary: '#06B6D4', secondary: '#164E63', accent: '#67E8F9', style: 'modern tech office building' },
  meme: { primary: '#F59E0B', secondary: '#78350F', accent: '#FCD34D', style: 'playful colorful fun building' },
  plasma: { primary: '#569F8C', secondary: '#162F29', accent: '#DCEFEA', style: 'sleek modern corporate tower' },
  stablecoin: { primary: '#10B981', secondary: '#064E3B', accent: '#6EE7B7', style: 'solid bank-like vault' },
  infrastructure: { primary: '#6366F1', secondary: '#312E81', accent: '#A5B4FC', style: 'industrial data center' },
  legends: { primary: '#F97316', secondary: '#7C2D12', accent: '#FDBA74', style: 'dramatic monument statue' },
  titan: { primary: '#8B5CF6', secondary: '#4C1D95', accent: '#C4B5FD', style: 'cozy creature dwelling cave' },
};

// =============================================================================
// TYPES
// =============================================================================

interface BuildingInfo {
  id: string;
  name: string;
  category: string;
  footprint: { width: number; height: number };
  description: string;
  protocol?: string;
}

// =============================================================================
// BUILDING EXTRACTION
// =============================================================================

function extractAllBuildings(content: string): BuildingInfo[] {
  const buildings: BuildingInfo[] = [];
  
  // Match building definitions
  const buildingRegex = /'([a-z_]+)':\s*\{[^}]*id:\s*'([^']+)'[^}]*name:\s*'([^']+)'[^}]*category:\s*'([^']+)'[^}]*footprint:\s*\{\s*width:\s*(\d+),\s*height:\s*(\d+)/g;
  
  let match;
  while ((match = buildingRegex.exec(content)) !== null) {
    const id = match[2];
    const name = match[3];
    const category = match[4];
    const width = parseInt(match[5], 10);
    const height = parseInt(match[6], 10);
    
    // Extract description
    const descStart = content.indexOf(`'${id}'`);
    const descSection = content.substring(descStart, descStart + 2000);
    const descMatch = descSection.match(/description:\s*["'`]([^"'`]+)/);
    const description = descMatch ? descMatch[1].substring(0, 150) : '';
    
    // Extract protocol
    const protocolMatch = descSection.match(/protocol:\s*'([^']+)'/);
    const protocol = protocolMatch ? protocolMatch[1] : undefined;
    
    buildings.push({
      id,
      name,
      category,
      footprint: { width, height },
      description,
      protocol,
    });
  }
  
  return buildings;
}

function getExistingSprites(): Set<string> {
  const sprites = new Set<string>();
  if (!fs.existsSync(OUTPUT_DIR)) return sprites;
  
  const categories = fs.readdirSync(OUTPUT_DIR).filter(f => {
    const fullPath = path.join(OUTPUT_DIR, f);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  });
  
  for (const cat of categories) {
    const catDir = path.join(OUTPUT_DIR, cat);
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.png'));
    for (const file of files) {
      const match = file.match(/\d+x\d+(.+)_south\.png/);
      if (match) sprites.add(match[1]);
    }
  }
  
  return sprites;
}

// =============================================================================
// OPTIMIZED PROMPT GENERATION
// =============================================================================

function generateOptimizedPrompt(building: BuildingInfo): string {
  const categoryTheme = CATEGORY_COLORS[building.category] || CATEGORY_COLORS.defi;
  
  // Get brand colors if available
  const brandKey = building.protocol?.toLowerCase() || 
                   building.id.split('_')[0] ||
                   building.category;
  const brandColors = BRAND_COLORS[brandKey];
  
  const colors = brandColors 
    ? `${brandColors.primary} (primary), ${brandColors.secondary || categoryTheme.secondary} (secondary), ${brandColors.accent || categoryTheme.accent} (accent)`
    : `${categoryTheme.primary}, ${categoryTheme.secondary}, ${categoryTheme.accent}`;
  
  const sizeDesc = building.footprint.width === 1 && building.footprint.height === 1 ? 'small 1x1' :
                   building.footprint.width <= 2 && building.footprint.height <= 2 ? 'medium 2x2' :
                   'large 3x3+';
  
  const archHints = getArchitectureHints(building);
  
  // Research-backed optimized prompt structure
  return `Create a single isometric pixel art building sprite for a city builder video game.

CRITICAL STYLE REQUIREMENTS:
- Classic 16-bit isometric pixel art style like SimCity 2000 or Pocket City
- Clean, crisp pixel edges with NO anti-aliasing, NO blur, NO smoothing
- LIMITED color palette (maximum 20-25 distinct colors)
- Standard 2:1 isometric diamond perspective (dimetric projection)
- TRANSPARENT BACKGROUND - just the building, no ground, no shadows
- Building must be anchored at the BOTTOM of the 512x512 canvas
- Top-left lighting source for consistent shadows
- Output size: exactly 512x512 pixels

BUILDING DETAILS:
Name: "${building.name}"
Size: ${sizeDesc} building (${building.footprint.width}x${building.footprint.height} tiles)
Category: ${building.category}
Colors to use: ${colors}
Architecture style: ${categoryTheme.style}
Visual theme: ${archHints}

IMPORTANT:
- NO text, NO labels, NO logos on the building
- Use the color palette consistently
- Make it look like a professional game asset
- Ensure clean pixel edges suitable for a retro-style city builder
- The building should be distinctive and recognizable as "${building.name}"`;
}

function getArchitectureHints(building: BuildingInfo): string {
  const id = building.id.toLowerCase();
  const name = building.name.toLowerCase();
  
  // Architecture hints based on building characteristics
  if (id.includes('tower') || id.includes('spire')) return 'tall vertical tower with multiple floors and rooftop details';
  if (id.includes('vault') || id.includes('bunker') || id.includes('reserve')) return 'fortified vault with thick walls, secure entrance, heavy doors';
  if (id.includes('fountain') || id.includes('pool')) return 'decorative water feature with basin and flowing water';
  if (id.includes('monument') || id.includes('memorial') || id.includes('statue')) return 'commemorative statue or obelisk monument';
  if (id.includes('lab') || id.includes('factory') || id.includes('reactor')) return 'industrial facility with machinery, pipes, glowing elements';
  if (id.includes('arena') || id.includes('stadium')) return 'large venue with grand entrance, seating areas visible';
  if (id.includes('cafe') || id.includes('lounge')) return 'cozy establishment with outdoor seating, warm lighting';
  if (id.includes('museum') || id.includes('gallery')) return 'cultural building with display windows, classical elements';
  if (id.includes('academy') || id.includes('campus')) return 'educational institution with scholarly architecture';
  if (id.includes('garden') || id.includes('park')) return 'green space with plants, trees, landscaping';
  if (id.includes('hq') || id.includes('headquarters') || id.includes('office')) return 'corporate headquarters with prominent entrance, modern design';
  if (id.includes('ruins') || id.includes('crater')) return 'damaged/destroyed building, broken walls, debris';
  if (id.includes('yacht') || id.includes('boat')) return 'nautical vessel, maritime elements';
  if (id.includes('den') || id.includes('enclosure')) return 'cozy dwelling, creature home with warm interior';
  if (id.includes('plaza') || id.includes('square')) return 'open gathering space with central feature';
  if (id.includes('mint')) return 'money production facility, industrial bank aesthetic';
  if (id.includes('terminal') || id.includes('station')) return 'transit hub, arrivals/departures, modern infrastructure';
  if (id.includes('bridge') || id.includes('gateway') || id.includes('portal')) return 'connecting structure, archway or portal';
  if (id.includes('billboard') || id.includes('sign')) return 'advertising display, prominent signage structure';
  if (id.includes('shrine') || id.includes('temple')) return 'sacred/worship building, ornate decorations';
  if (id.includes('beacon') || id.includes('lighthouse')) return 'glowing beacon tower, signal light at top';
  if (id.includes('hub') || id.includes('center')) return 'central building with radiating design, connector architecture';
  if (id.includes('exchange')) return 'trading floor building, financial architecture';
  if (id.includes('node')) return 'small technical building with blinking lights, servers';
  if (id.includes('observatory')) return 'dome-topped building, telescope or viewing equipment';
  if (id.includes('nexus')) return 'interconnected building, glowing energy conduits';
  
  // Category-based defaults
  if (building.category === 'meme') return 'playful, colorful, whimsical design with fun elements';
  if (building.category === 'defi') return 'modern financial building, glass and steel, professional';
  if (building.category === 'exchange') return 'trading hub, screens/charts visible, corporate';
  if (building.category === 'chain') return 'futuristic datacenter, network connectivity visual';
  if (building.category === 'plasma') return 'sleek modern design, green energy glow accents';
  if (building.category === 'legends') return 'dramatic monument or historic building';
  if (building.category === 'ct') return 'modern tech office, social media aesthetic';
  if (building.category === 'stablecoin') return 'solid bank-like structure, stable and trustworthy';
  if (building.category === 'infrastructure') return 'technical facility, servers, data processing';
  if (building.category === 'titan') return 'creature dwelling, cozy cave or den';
  
  return 'distinctive crypto-themed architecture';
}

// =============================================================================
// IMAGE GENERATION
// =============================================================================

async function generateImage(prompt: string, building: BuildingInfo): Promise<Buffer | null> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  try {
    // Load reference sprite to guide style
    let parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    
    if (fs.existsSync(REFERENCE_SPRITE)) {
      const refData = fs.readFileSync(REFERENCE_SPRITE).toString('base64');
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: refData,
        }
      });
      parts.push({
        text: `Use this reference image as a STYLE GUIDE. Match the exact pixel art style, isometric perspective, color palette approach, and level of detail. The building should look like it belongs in the same game as this reference.\n\nNow create a NEW building:\n\n${prompt}`
      });
    } else {
      parts.push({ text: prompt });
    }
    
    console.log('   Calling Gemini API...');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: parts,
      config: {
        responseModalities: ['image', 'text'],
      },
    } as any);
    
    // Extract image from response
    const candidate = response.candidates?.[0];
    const responseParts = candidate?.content?.parts || [];
    
    for (const part of responseParts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64');
      }
    }
    
    console.error('   No image data in response');
    return null;
    
  } catch (error: unknown) {
    const err = error as Error & { status?: number; message?: string };
    console.error(`   API Error: ${err.message || err}`);
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

function saveImage(imageBuffer: Buffer, building: BuildingInfo): string {
  const categoryDir = path.join(OUTPUT_DIR, building.category);
  ensureDir(categoryDir);
  
  const footprint = `${building.footprint.width}x${building.footprint.height}`;
  const filename = `${footprint}${building.id}_south.png`;
  const filepath = path.join(categoryDir, filename);
  
  fs.writeFileSync(filepath, imageBuffer);
  return filepath;
}

// =============================================================================
// CLI
// =============================================================================

interface CLIOptions {
  limit?: number;
  category?: string;
  building?: string;
  dryRun: boolean;
  testOne: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = { dryRun: false, testOne: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--limit':
      case '-l':
        options.limit = parseInt(args[++i], 10);
        break;
      case '--category':
      case '-c':
        options.category = args[++i];
        break;
      case '--building':
      case '-b':
        options.building = args[++i];
        break;
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--test-one':
      case '-t':
        options.testOne = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Crypto Sprite Generator

Usage:
  GEMINI_API_KEY=key npx ts-node scripts/generateCryptoSprites.ts [options]

Options:
  --limit, -l <n>       Maximum number to generate
  --category, -c <name> Only generate for specific category  
  --building, -b <id>   Generate specific building by ID
  --dry-run, -d         Show what would be generated
  --test-one, -t        Generate just one test sprite
  --help, -h            Show this help

Categories: defi, exchange, chain, ct, meme, plasma, stablecoin, infrastructure, legends, titan

Examples:
  npx ts-node scripts/generateCryptoSprites.ts --dry-run
  npx ts-node scripts/generateCryptoSprites.ts --test-one
  npx ts-node scripts/generateCryptoSprites.ts --category plasma
  npx ts-node scripts/generateCryptoSprites.ts --building uniswap_exchange
        `);
        process.exit(0);
    }
  }

  return options;
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const options = parseArgs();
  
  console.log('🎨 Crypto Building Sprite Generator');
  console.log('====================================\n');
  
  const content = fs.readFileSync(BUILDINGS_FILE, 'utf-8');
  let buildings = extractAllBuildings(content);
  const existingSprites = getExistingSprites();
  
  console.log(`📊 Found ${buildings.length} total buildings`);
  console.log(`   ${existingSprites.size} already have sprites\n`);
  
  // Filter based on options
  if (options.building) {
    buildings = buildings.filter(b => b.id === options.building);
    if (buildings.length === 0) {
      console.error(`Building '${options.building}' not found`);
      process.exit(1);
    }
  } else if (!options.testOne) {
    // Only generate for buildings without sprites
    buildings = buildings.filter(b => !existingSprites.has(b.id));
  }
  
  if (options.category) {
    buildings = buildings.filter(b => b.category === options.category);
    console.log(`   Filtered to ${buildings.length} in category: ${options.category}`);
  }
  
  if (options.testOne) {
    // Pick a representative building for testing
    const testBuilding = buildings.find(b => b.id === 'uniswap_exchange') || buildings[0];
    buildings = testBuilding ? [testBuilding] : [];
    console.log(`   Test mode: generating only "${testBuilding?.name}"`);
  }
  
  if (options.limit) {
    buildings = buildings.slice(0, options.limit);
    console.log(`   Limited to ${buildings.length} buildings\n`);
  }
  
  if (buildings.length === 0) {
    console.log('✅ All buildings have sprites!');
    return;
  }
  
  // Show category breakdown
  const byCategory = buildings.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📦 Buildings to generate:');
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`   ${cat}: ${count}`);
  }
  console.log('');
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN - Showing prompts\n');
    for (const building of buildings.slice(0, 3)) {
      console.log(`\n📍 ${building.name} (${building.id})`);
      console.log(`   Category: ${building.category}`);
      console.log(`   Footprint: ${building.footprint.width}x${building.footprint.height}`);
      const prompt = generateOptimizedPrompt(building);
      console.log(`   Prompt:\n${prompt.split('\n').map(l => '   ' + l).join('\n')}`);
    }
    if (buildings.length > 3) {
      console.log(`\n... and ${buildings.length - 3} more buildings`);
    }
    return;
  }
  
  // Generate sprites
  let successCount = 0;
  let failCount = 0;
  const failedBuildings: string[] = [];
  
  for (let i = 0; i < buildings.length; i++) {
    const building = buildings[i];
    console.log(`\n[${i + 1}/${buildings.length}] 🏗️  ${building.name}`);
    console.log(`   Category: ${building.category}`);
    console.log(`   Footprint: ${building.footprint.width}x${building.footprint.height}`);
    
    const prompt = generateOptimizedPrompt(building);
    const imageBuffer = await generateImage(prompt, building);
    
    if (imageBuffer) {
      const filepath = saveImage(imageBuffer, building);
      const sizeKB = (imageBuffer.length / 1024).toFixed(1);
      console.log(`   ✅ Saved: ${path.basename(filepath)} (${sizeKB}KB)`);
      successCount++;
    } else {
      console.log(`   ❌ Failed to generate`);
      failCount++;
      failedBuildings.push(building.id);
    }
    
    // Rate limiting - 2 seconds between requests
    if (i < buildings.length - 1) {
      console.log(`   Waiting 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n====================================');
  console.log(`✨ Generation complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  
  if (failedBuildings.length > 0) {
    console.log(`\n❌ Failed buildings:`);
    failedBuildings.forEach(id => console.log(`   - ${id}`));
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
