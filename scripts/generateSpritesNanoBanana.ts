#!/usr/bin/env node
/**
 * SPRITE GENERATOR - Nano Banana (Gemini 2.5 Flash Image)
 * 
 * Generates isometric building sprites using Google's Nano Banana API.
 * 
 * Usage:
 *   GEMINI_API_KEY=your_key npx ts-node scripts/generateSpritesNanoBanana.ts
 *   
 * Options:
 *   --limit <n>     Maximum number of sprites to generate
 *   --category <c>  Only generate for specific category
 *   --dry-run       Show what would be generated without calling API
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import * as sharpModule from 'sharp';
const sharp = (sharpModule as any).default || sharpModule;

// =============================================================================
// CONFIGURATION
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  console.error('Usage: GEMINI_API_KEY=your_key npx ts-node scripts/generateSpritesNanoBanana.ts');
  process.exit(1);
}

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUILDINGS_FILE = path.join(PROJECT_ROOT, 'src/games/isocity/crypto/buildings.ts');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public/Building/crypto');
const REFERENCE_DIR = path.join(PROJECT_ROOT, 'public/Building/crypto');

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

// Category themes for visual consistency
// Plasma uses official brand colors: British Racing Green (#162F29), Teal (#569F8C)
const CATEGORY_THEMES: Record<string, { colors: string; style: string }> = {
  defi: { colors: 'blue and teal', style: 'modern financial, glass and steel' },
  exchange: { colors: 'green and gold', style: 'trading hub, corporate' },
  chain: { colors: 'purple and cyan', style: 'futuristic blockchain, digital' },
  ct: { colors: 'sky blue and white', style: 'social media, modern tech' },
  meme: { colors: 'yellow and orange', style: 'playful, cartoon-ish, fun' },
  plasma: { colors: 'British Racing Green (#162F29), teal (#569F8C), light green (#DCEFEA)', style: 'modern corporate, sleek, green energy glow accents' },
  stablecoin: { colors: 'emerald and white', style: 'stable, bank-like, trustworthy' },
  infrastructure: { colors: 'indigo and gray', style: 'industrial, technical, data center' },
  legends: { colors: 'orange and red', style: 'dramatic, historical, memorable' },
  titan: { colors: 'violet and gold', style: 'cozy dwelling, creature home' },
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
    const fullPath = path.join(OUTPUT_DIR, f);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
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
// PROMPT GENERATION (Optimized for Nano Banana)
// =============================================================================

function generatePrompt(building: BuildingInfo): string {
  const theme = CATEGORY_THEMES[building.category] || CATEGORY_THEMES.defi;
  const nameHints = getNameBasedHints(building);
  const footprint = `${building.footprint.width}x${building.footprint.height}`;
  
  // Nano Banana optimized prompt structure
  return `Generate a single isometric pixel art building sprite for a city builder video game.

STYLE: Classic 16-bit isometric pixel art like SimCity 2000 or Pocket City. 
- Clean visible pixels, NO anti-aliasing or blur
- Limited color palette (max 20 colors)
- South-facing isometric view (2:1 diamond perspective)
- TRANSPARENT BACKGROUND - no ground, no shadows, just the building floating

BUILDING: "${building.name}"
SIZE: ${footprint} tiles (${building.footprint.width === 1 ? 'small' : building.footprint.width === 2 ? 'medium' : 'large'} building)
COLORS: ${theme.colors}
STYLE: ${theme.style}
THEME: ${building.icon} ${nameHints}

The building should be a professional game asset with clean pixel edges, ready for use in a crypto-themed city builder game. Make it distinctive and recognizable as "${building.name}".`;
}

function getNameBasedHints(building: BuildingInfo): string {
  const id = building.id.toLowerCase();
  const name = building.name.toLowerCase();
  
  // Architecture hints based on building name
  if (id.includes('tower') || id.includes('spire')) return 'tall vertical tower, multiple floors';
  if (id.includes('vault') || id.includes('bunker')) return 'fortified vault, thick walls, secure';
  if (id.includes('fountain') || id.includes('pool')) return 'water feature, decorative basin';
  if (id.includes('monument') || id.includes('memorial')) return 'statue or obelisk, commemorative';
  if (id.includes('lab') || id.includes('factory')) return 'industrial facility, machinery, pipes';
  if (id.includes('arena') || id.includes('stadium')) return 'large venue, grand entrance, seating';
  if (id.includes('cafe') || id.includes('lounge')) return 'cozy establishment, outdoor seating';
  if (id.includes('museum') || id.includes('gallery')) return 'cultural building, display windows';
  if (id.includes('academy') || id.includes('campus')) return 'educational institution, scholarly';
  if (id.includes('garden') || id.includes('park')) return 'green space, plants, trees';
  if (id.includes('headquarters') || id.includes('hq')) return 'corporate office, prominent signage';
  if (id.includes('ruins')) return 'dilapidated, broken walls, abandoned';
  if (id.includes('yacht') || id.includes('boat')) return 'maritime vessel, nautical';
  if (id.includes('den')) return 'cozy dwelling, creature home';
  if (id.includes('plaza') || id.includes('square')) return 'open gathering space, central feature';
  if (id.includes('mint')) return 'money production, industrial bank';
  if (id.includes('terminal')) return 'transit hub, arrivals/departures';
  if (id.includes('bridge')) return 'connecting structure, spanning';
  if (id.includes('crater') || id.includes('ruins')) return 'destroyed, aftermath of disaster';
  if (id.includes('billboard') || id.includes('sign')) return 'advertising display, prominent text';
  if (name.includes('plasma')) return 'futuristic energy, glowing pink/magenta';
  if (building.category === 'meme') return 'playful, colorful, meme-culture inspired';
  if (building.category === 'legends') return 'historical significance, dramatic';
  
  return 'modern crypto-themed architecture';
}

// =============================================================================
// REFERENCE IMAGE LOADING
// =============================================================================

function loadReferenceImage(category: string): { data: string; mimeType: string } | null {
  // Try to load an existing sprite from the same category as reference
  const catDir = path.join(REFERENCE_DIR, category);
  
  if (!fs.existsSync(catDir)) return null;
  
  const files = fs.readdirSync(catDir).filter(f => f.endsWith('.png'));
  if (files.length === 0) return null;
  
  // Pick a random reference sprite
  const refFile = files[Math.floor(Math.random() * files.length)];
  const refPath = path.join(catDir, refFile);
  
  try {
    const data = fs.readFileSync(refPath).toString('base64');
    return { data, mimeType: 'image/png' };
  } catch {
    return null;
  }
}

// =============================================================================
// API CALLS
// =============================================================================

async function generateImage(prompt: string, category: string): Promise<Buffer | null> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  try {
    // Build content parts
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    
    // Add reference image if available
    const refImage = loadReferenceImage(category);
    if (refImage) {
      parts.push({
        inlineData: {
          mimeType: refImage.mimeType,
          data: refImage.data,
        }
      });
      parts.push({
        text: `Use this existing sprite as a STYLE REFERENCE. Match the pixel art style, perspective, and level of detail exactly. Now generate a NEW building:\n\n${prompt}`
      });
    } else {
      parts.push({ text: prompt });
    }
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: parts,
    });
    
    // Extract image from response
    const candidate = response.candidates?.[0];
    const responseParts = candidate?.content?.parts || [];
    
    for (const part of responseParts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64');
      }
    }
    
    console.error('  No image data in response');
    return null;
    
  } catch (error: unknown) {
    const err = error as Error & { status?: number; message?: string };
    console.error(`  API Error: ${err.message || err}`);
    if (err.status === 400 && err.message?.includes('country')) {
      console.error('  Note: Image generation may not be available in your region');
    }
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

// Color distance for background detection
function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

// Remove background from generated sprite using flood-fill from edges
async function addTransparency(imageBuffer: Buffer): Promise<Buffer> {
  // Sample edges to find dominant background colors
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const colorCounts = new Map<string, { count: number; r: number; g: number; b: number }>();
  
  // Sample from edges (10 pixels deep)
  for (let i = 0; i < 10; i++) {
    for (let x = 0; x < width; x += 5) {
      // Top edge
      let idx = (i * width + x) * channels;
      let key = `${Math.round(data[idx] / 20) * 20},${Math.round(data[idx + 1] / 20) * 20},${Math.round(data[idx + 2] / 20) * 20}`;
      const topEntry = colorCounts.get(key);
      if (topEntry) topEntry.count++; else colorCounts.set(key, { count: 1, r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      
      // Bottom edge
      idx = ((height - 1 - i) * width + x) * channels;
      key = `${Math.round(data[idx] / 20) * 20},${Math.round(data[idx + 1] / 20) * 20},${Math.round(data[idx + 2] / 20) * 20}`;
      const bottomEntry = colorCounts.get(key);
      if (bottomEntry) bottomEntry.count++; else colorCounts.set(key, { count: 1, r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
    for (let y = 0; y < height; y += 5) {
      // Left edge
      let idx = (y * width + i) * channels;
      let key = `${Math.round(data[idx] / 20) * 20},${Math.round(data[idx + 1] / 20) * 20},${Math.round(data[idx + 2] / 20) * 20}`;
      const leftEntry = colorCounts.get(key);
      if (leftEntry) leftEntry.count++; else colorCounts.set(key, { count: 1, r: data[idx], g: data[idx + 1], b: data[idx + 2] });
      
      // Right edge
      idx = (y * width + (width - 1 - i)) * channels;
      key = `${Math.round(data[idx] / 20) * 20},${Math.round(data[idx + 1] / 20) * 20},${Math.round(data[idx + 2] / 20) * 20}`;
      const rightEntry = colorCounts.get(key);
      if (rightEntry) rightEntry.count++; else colorCounts.set(key, { count: 1, r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
  }

  // Get top 5 background colors
  const bgColors = Array.from(colorCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Read image with alpha channel
  const { data: rawData, info: rawInfo } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const newData = Buffer.from(rawData);
  const tolerance = 35;

  // Flood-fill from all edges
  const visited = new Set<number>();
  const queue: Array<{ x: number; y: number }> = [];

  for (let x = 0; x < rawInfo.width; x++) {
    queue.push({ x, y: 0 });
    queue.push({ x, y: rawInfo.height - 1 });
  }
  for (let y = 0; y < rawInfo.height; y++) {
    queue.push({ x: 0, y });
    queue.push({ x: rawInfo.width - 1, y });
  }

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    const idx = (y * rawInfo.width + x) * 4;
    const key = y * rawInfo.width + x;

    if (visited.has(key) || x < 0 || x >= rawInfo.width || y < 0 || y >= rawInfo.height) continue;

    const r = newData[idx], g = newData[idx + 1], b = newData[idx + 2];
    let isBackground = false;
    for (const bg of bgColors) {
      if (colorDistance({ r, g, b }, bg) < tolerance) {
        isBackground = true;
        break;
      }
    }
    if (!isBackground) continue;

    visited.add(key);
    newData[idx + 3] = 0; // Make transparent

    queue.push({ x: x - 1, y }, { x: x + 1, y }, { x, y: y - 1 }, { x, y: y + 1 });
  }

  // Save with compression
  return await sharp(newData, { raw: { width: rawInfo.width, height: rawInfo.height, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, colors: 64 })
    .toBuffer();
}

async function saveImage(imageBuffer: Buffer, building: BuildingInfo): Promise<string> {
  const categoryDir = path.join(OUTPUT_DIR, building.category);
  ensureDir(categoryDir);
  
  const footprint = `${building.footprint.width}x${building.footprint.height}`;
  const filename = `${footprint}${building.id}_south.png`;
  const filepath = path.join(categoryDir, filename);
  
  // Add transparency and optimize
  const processedBuffer = await addTransparency(imageBuffer);
  
  fs.writeFileSync(filepath, processedBuffer);
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
Sprite Generator (Nano Banana / Gemini 2.5 Flash Image)

Usage:
  GEMINI_API_KEY=your_key npx ts-node scripts/generateSpritesNanoBanana.ts [options]

Options:
  --limit, -l <n>       Maximum number to generate
  --category, -c <name> Only generate for specific category  
  --dry-run, -d         Show what would be generated
  --help, -h            Show this help

Categories: defi, exchange, chain, ct, meme, plasma, stablecoin, infrastructure, legends, titan

Examples:
  npx ts-node scripts/generateSpritesNanoBanana.ts --dry-run
  npx ts-node scripts/generateSpritesNanoBanana.ts --limit 10 --category plasma
        `);
        process.exit(0);
    }
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs();
  
  console.log('🍌 Sprite Generator (Nano Banana)');
  console.log('==================================\n');
  
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
      console.log(`   Prompt preview: ${prompt.substring(0, 400)}...`);
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
    console.log('   Calling Nano Banana API...');
    
    const imageBuffer = await generateImage(prompt, building.category);
    
    if (imageBuffer) {
      console.log('   Processing transparency...');
      const filepath = await saveImage(imageBuffer, building);
      const stats = fs.statSync(filepath);
      console.log(`   ✅ Saved: ${path.basename(filepath)} (${(stats.size / 1024).toFixed(1)}KB)`);
      successCount++;
    } else {
      console.log(`   ❌ Failed to generate`);
      failCount++;
      failedBuildings.push(building.id);
    }
    
    // Rate limiting
    if (i < missing.length - 1) {
      const waitTime = 2000; // 2 seconds between requests
      console.log(`   Waiting ${waitTime/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  console.log('\n==================================');
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
