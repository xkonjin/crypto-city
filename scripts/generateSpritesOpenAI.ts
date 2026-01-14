#!/usr/bin/env node
/**
 * SPRITE GENERATOR - OpenAI DALL-E 3
 * 
 * Generates isometric building sprites using DALL-E 3.
 * 
 * Usage:
 *   OPENAI_API_KEY=your_key npx ts-node scripts/generateSpritesOpenAI.ts
 *   
 * Options:
 *   --limit <n>     Maximum number of sprites to generate
 *   --category <c>  Only generate for specific category
 *   --dry-run       Show what would be generated without calling API
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// =============================================================================
// CONFIGURATION
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUILDINGS_FILE = path.join(PROJECT_ROOT, 'src/games/isocity/crypto/buildings.ts');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public/Building/crypto');

// =============================================================================
// TYPES
// =============================================================================

interface BuildingInfo {
  id: string;
  name: string;
  category: string;
  footprint: { width: number; height: number };
  icon: string;
  description: string;
}

// Brand colors for visual consistency
const CATEGORY_COLORS: Record<string, { primary: string; secondary: string }> = {
  defi: { primary: 'blue', secondary: 'teal' },
  exchange: { primary: 'green', secondary: 'gold' },
  chain: { primary: 'purple', secondary: 'cyan' },
  ct: { primary: 'sky blue', secondary: 'white' },
  meme: { primary: 'yellow', secondary: 'orange' },
  plasma: { primary: 'magenta', secondary: 'pink' },
  stablecoin: { primary: 'emerald', secondary: 'white' },
  infrastructure: { primary: 'indigo', secondary: 'gray' },
  legends: { primary: 'orange', secondary: 'red' },
  titan: { primary: 'violet', secondary: 'gold' },
};

// =============================================================================
// BUILDING EXTRACTION
// =============================================================================

function extractProceduralBuildings(content: string): BuildingInfo[] {
  const buildings: BuildingInfo[] = [];
  const lines = content.split('\n');
  let currentBuilding: Partial<BuildingInfo> = {};
  let inBuilding = false;
  let braceDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    braceDepth += (line.match(/\{/g) || []).length;
    braceDepth -= (line.match(/\}/g) || []).length;
    
    const idMatch = line.match(/id:\s*'([^']+)'/);
    if (idMatch) {
      currentBuilding.id = idMatch[1];
      inBuilding = true;
    }
    
    if (inBuilding) {
      const nameMatch = line.match(/name:\s*'([^']+)'/);
      if (nameMatch) currentBuilding.name = nameMatch[1];
      
      const catMatch = line.match(/category:\s*'([^']+)'/);
      if (catMatch) currentBuilding.category = catMatch[1];
      
      const footprintMatch = line.match(/footprint:\s*\{\s*width:\s*(\d+),\s*height:\s*(\d+)/);
      if (footprintMatch) {
        currentBuilding.footprint = { 
          width: parseInt(footprintMatch[1], 10), 
          height: parseInt(footprintMatch[2], 10) 
        };
      }
      
      const iconMatch = line.match(/icon:\s*'([^']+)'/);
      if (iconMatch) currentBuilding.icon = iconMatch[1];
      
      if (line.includes('isProcedural: true')) {
        for (let j = i; j < Math.min(i + 30, lines.length); j++) {
          const descMatch = lines[j].match(/description:\s*["'`]([^"'`]+)/);
          if (descMatch) {
            currentBuilding.description = descMatch[1].substring(0, 200);
            break;
          }
        }
        
        if (currentBuilding.id && currentBuilding.name && currentBuilding.category && 
            currentBuilding.footprint && currentBuilding.icon) {
          buildings.push(currentBuilding as BuildingInfo);
        }
      }
      
      if (braceDepth <= 1 && line.includes('},')) {
        currentBuilding = {};
        inBuilding = false;
      }
    }
  }
  
  return buildings;
}

function getExistingSprites(): Set<string> {
  const sprites = new Set<string>();
  
  if (!fs.existsSync(OUTPUT_DIR)) return sprites;
  
  const categories = fs.readdirSync(OUTPUT_DIR).filter(f => {
    const stat = fs.statSync(path.join(OUTPUT_DIR, f));
    return stat.isDirectory();
  });
  
  for (const cat of categories) {
    const catDir = path.join(OUTPUT_DIR, cat);
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.png'));
    
    for (const file of files) {
      const match = file.match(/\d+x\d+(.+)_south\.png/);
      if (match) {
        sprites.add(match[1]);
      }
    }
  }
  
  return sprites;
}

function getMissingBuildings(): BuildingInfo[] {
  const content = fs.readFileSync(BUILDINGS_FILE, 'utf-8');
  const allProcedural = extractProceduralBuildings(content);
  const existingSprites = getExistingSprites();
  
  return allProcedural.filter(b => !existingSprites.has(b.id));
}

// =============================================================================
// PROMPT GENERATION
// =============================================================================

function generatePrompt(building: BuildingInfo): string {
  const colors = CATEGORY_COLORS[building.category] || CATEGORY_COLORS.defi;
  const nameHints = getNameBasedHints(building);
  
  return `Create a single isometric pixel art building for a city builder video game. 

EXACT STYLE: Classic 16-bit pixel art like SimCity 2000 or Pocket City. Clean pixels, no anti-aliasing, limited color palette (max 24 colors).

BUILDING: "${building.name}"
THEME: ${building.icon} ${nameHints}
SIZE: ${building.footprint.width}x${building.footprint.height} tile building (medium size)
COLORS: Primary ${colors.primary}, secondary ${colors.secondary}

CRITICAL REQUIREMENTS:
1. ISOMETRIC VIEW: South-facing diamond perspective (2:1 ratio)
2. PURE PIXEL ART: Visible individual pixels, crisp edges, NO blur or gradients
3. TRANSPARENT BACKGROUND: Building floating on nothing, no ground, no shadows on floor
4. PROFESSIONAL QUALITY: Clean, polished game asset ready for production
5. SINGLE BUILDING: Just one building centered in frame

The building should look like it belongs in a crypto-themed city builder game. Make it distinctive and recognizable.`;
}

function getNameBasedHints(building: BuildingInfo): string {
  const id = building.id.toLowerCase();
  
  if (id.includes('tower') || id.includes('spire')) return 'Tall vertical tower structure';
  if (id.includes('vault') || id.includes('bunker')) return 'Fortified vault with thick walls';
  if (id.includes('fountain') || id.includes('pool')) return 'Water feature, decorative basin';
  if (id.includes('monument') || id.includes('memorial')) return 'Commemorative statue or obelisk';
  if (id.includes('lab') || id.includes('factory')) return 'Industrial facility with machinery';
  if (id.includes('arena') || id.includes('stadium')) return 'Large open venue, grand entrance';
  if (id.includes('cafe') || id.includes('lounge')) return 'Cozy establishment, warm lighting';
  if (id.includes('museum') || id.includes('gallery')) return 'Cultural building, display windows';
  if (id.includes('academy') || id.includes('campus')) return 'Educational institution';
  if (id.includes('garden') || id.includes('park')) return 'Green space with plants';
  if (id.includes('headquarters') || id.includes('hq')) return 'Corporate office building';
  if (id.includes('ruins')) return 'Dilapidated, broken structure';
  if (id.includes('yacht') || id.includes('boat')) return 'Maritime vessel or dock';
  if (id.includes('den')) return 'Cozy creature dwelling';
  if (building.category === 'meme') return 'Playful, colorful, meme-culture inspired';
  if (building.category === 'legends') return 'Historical significance, dramatic';
  if (building.category === 'plasma') return 'Futuristic energy aesthetic, glowing';
  
  return 'Modern crypto-themed architecture';
}

// =============================================================================
// API CALLS
// =============================================================================

async function generateImage(prompt: string): Promise<Buffer | null> {
  if (!OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY not set');
    return null;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  API Error: ${response.status} - ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json() as {
      data?: Array<{ b64_json?: string; url?: string }>;
      error?: { message: string };
    };

    if (data.error) {
      console.error(`  API Error: ${data.error.message}`);
      return null;
    }

    const imageData = data.data?.[0]?.b64_json;
    if (imageData) {
      return Buffer.from(imageData, 'base64');
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
// MAIN
// =============================================================================

interface CLIOptions {
  limit?: number;
  category?: string;
  dryRun: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = { dryRun: false };

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
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Sprite Generator (OpenAI DALL-E 3)

Usage:
  OPENAI_API_KEY=your_key npx ts-node scripts/generateSpritesOpenAI.ts [options]

Options:
  --limit, -l <n>       Maximum number to generate
  --category, -c <name> Only generate for specific category  
  --dry-run, -d         Show what would be generated
  --help, -h            Show this help

Examples:
  npx ts-node scripts/generateSpritesOpenAI.ts --dry-run
  npx ts-node scripts/generateSpritesOpenAI.ts --limit 10 --category plasma
        `);
        process.exit(0);
    }
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs();
  
  console.log('🎨 Sprite Generator (DALL-E 3)');
  console.log('==============================\n');
  
  if (!OPENAI_API_KEY && !options.dryRun) {
    console.error('❌ Error: OPENAI_API_KEY environment variable required');
    process.exit(1);
  }
  
  let missing = getMissingBuildings();
  
  console.log(`📊 Found ${missing.length} buildings without sprites\n`);
  
  if (options.category) {
    missing = missing.filter(b => b.category === options.category);
    console.log(`   Filtered to ${missing.length} in category: ${options.category}`);
  }
  
  if (options.limit) {
    missing = missing.slice(0, options.limit);
    console.log(`   Limited to ${missing.length} buildings\n`);
  }
  
  if (missing.length === 0) {
    console.log('✅ All procedural buildings have sprites!');
    return;
  }
  
  const byCategory = missing.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📦 Buildings to generate:');
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`   ${cat}: ${count}`);
  }
  console.log('');
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN - Showing prompts only\n');
    for (const building of missing.slice(0, 5)) {
      console.log(`\n📍 ${building.name} (${building.id})`);
      console.log(`   Category: ${building.category}`);
      console.log(`   Footprint: ${building.footprint.width}x${building.footprint.height}`);
      const prompt = generatePrompt(building);
      console.log(`   Prompt: ${prompt.substring(0, 300)}...`);
    }
    if (missing.length > 5) {
      console.log(`\n... and ${missing.length - 5} more buildings`);
    }
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  const failedBuildings: string[] = [];
  
  for (let i = 0; i < missing.length; i++) {
    const building = missing[i];
    console.log(`\n[${i + 1}/${missing.length}] 🏗️  ${building.name}`);
    console.log(`   Category: ${building.category}`);
    console.log(`   Footprint: ${building.footprint.width}x${building.footprint.height}`);
    
    const prompt = generatePrompt(building);
    console.log('   Calling DALL-E 3 API...');
    
    const imageBuffer = await generateImage(prompt);
    
    if (imageBuffer) {
      const filepath = saveImage(imageBuffer, building);
      console.log(`   ✅ Saved: ${path.basename(filepath)}`);
      successCount++;
    } else {
      console.log(`   ❌ Failed to generate`);
      failCount++;
      failedBuildings.push(building.id);
    }
    
    // Rate limiting - DALL-E 3 has strict rate limits
    if (i < missing.length - 1) {
      console.log('   Waiting 5s (rate limit)...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log('\n==============================');
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
