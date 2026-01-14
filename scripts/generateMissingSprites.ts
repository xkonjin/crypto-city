#!/usr/bin/env node
/**
 * MISSING SPRITE GENERATOR
 * 
 * Generates sprites for procedural buildings that don't have sprites yet.
 * Reads building definitions from buildings.ts and generates using Gemini 2.0 Flash.
 * 
 * Usage:
 *   GEMINI_API_KEY=your_key npx ts-node scripts/generateMissingSprites.ts
 *   
 * Options:
 *   --limit <n>     Maximum number of sprites to generate
 *   --category <c>  Only generate for specific category
 *   --dry-run       Show what would be generated without calling API
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// =============================================================================
// CONFIGURATION
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUILDINGS_FILE = path.join(PROJECT_ROOT, 'src/games/isocity/crypto/buildings.ts');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public/Building/crypto');
const REFERENCE_DIR = path.join(PROJECT_ROOT, 'public/Building');

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
  defi: { primary: '#3b82f6', secondary: '#1e40af' },
  exchange: { primary: '#22c55e', secondary: '#15803d' },
  chain: { primary: '#a855f7', secondary: '#7e22ce' },
  ct: { primary: '#06b6d4', secondary: '#0e7490' },
  meme: { primary: '#f59e0b', secondary: '#b45309' },
  plasma: { primary: '#ec4899', secondary: '#be185d' },
  stablecoin: { primary: '#10b981', secondary: '#047857' },
  infrastructure: { primary: '#6366f1', secondary: '#4338ca' },
  legends: { primary: '#f97316', secondary: '#c2410c' },
  titan: { primary: '#8b5cf6', secondary: '#6d28d9' },
};

// Tile dimensions based on footprint
const TILE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1x1': { width: 128, height: 160 },
  '1x2': { width: 128, height: 224 },
  '2x1': { width: 192, height: 160 },
  '2x2': { width: 192, height: 224 },
  '2x3': { width: 192, height: 288 },
  '3x2': { width: 256, height: 224 },
  '3x3': { width: 256, height: 288 },
  '3x4': { width: 256, height: 352 },
  '4x2': { width: 320, height: 224 },
  '4x3': { width: 320, height: 288 },
  '4x4': { width: 320, height: 352 },
};

// =============================================================================
// BUILDING EXTRACTION
// =============================================================================

function extractProceduralBuildings(content: string): BuildingInfo[] {
  const buildings: BuildingInfo[] = [];
  
  // Split content by building blocks and process each
  // Look for isProcedural: true patterns and extract surrounding info
  const lines = content.split('\n');
  let currentBuilding: Partial<BuildingInfo> = {};
  let inBuilding = false;
  let braceDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Track brace depth
    braceDepth += (line.match(/\{/g) || []).length;
    braceDepth -= (line.match(/\}/g) || []).length;
    
    // Detect building start
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
        // Look for description in next ~20 lines
        for (let j = i; j < Math.min(i + 30, lines.length); j++) {
          const descMatch = lines[j].match(/description:\s*["'`]([^"'`]+)/);
          if (descMatch) {
            currentBuilding.description = descMatch[1].substring(0, 200);
            break;
          }
        }
        
        // Commit building if we have all required fields
        if (currentBuilding.id && currentBuilding.name && currentBuilding.category && 
            currentBuilding.footprint && currentBuilding.icon) {
          buildings.push(currentBuilding as BuildingInfo);
        }
      }
      
      // Reset at closing brace
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
  
  const categories = fs.readdirSync(OUTPUT_DIR).filter(f => {
    const stat = fs.statSync(path.join(OUTPUT_DIR, f));
    return stat.isDirectory();
  });
  
  for (const cat of categories) {
    const catDir = path.join(OUTPUT_DIR, cat);
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.png'));
    
    for (const file of files) {
      // Extract building ID from filename like "2x2building_name_south.png"
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
  const footprintKey = `${building.footprint.width}x${building.footprint.height}`;
  const dims = TILE_DIMENSIONS[footprintKey] || { width: 192, height: 224 };
  const colors = CATEGORY_COLORS[building.category] || CATEGORY_COLORS.defi;
  
  // Create a more detailed prompt based on the building name
  const nameHints = getNameBasedHints(building);
  
  return `Create an isometric pixel art building sprite for a city builder game.

BUILDING: ${building.name}
CATEGORY: ${building.category}
SIZE: ${footprintKey} tiles (${dims.width}x${dims.height} pixels)
ICON THEME: ${building.icon}

STYLE REQUIREMENTS:
- Isometric pixel art (south-facing view, 2:1 diamond perspective)
- Clean pixel art with visible individual pixels
- Crisp edges, no anti-aliasing blur
- Limited color palette (max 32 colors)
- Primary color: ${colors.primary}
- Secondary color: ${colors.secondary}

BUILDING CONCEPT:
${nameHints}
${building.description ? `Context: ${building.description.substring(0, 150)}...` : ''}

TECHNICAL REQUIREMENTS:
- Image size: ${dims.width}x${dims.height} pixels
- TRANSPARENT background (no ground plane, no shadows on ground)
- Building sits on a diamond-shaped footprint
- Proper depth/height for ${footprintKey} tile building
- Should look like a professional game asset

OUTPUT: A single PNG image with transparent background showing the building from isometric south-facing view.`;
}

function getNameBasedHints(building: BuildingInfo): string {
  const id = building.id.toLowerCase();
  const name = building.name.toLowerCase();
  
  // Generate architectural hints based on naming patterns
  if (id.includes('tower') || id.includes('spire')) {
    return 'Tall vertical structure reaching skyward, multiple floors visible';
  }
  if (id.includes('vault') || id.includes('bunker')) {
    return 'Fortified structure with thick walls, vault doors, secure appearance';
  }
  if (id.includes('fountain') || id.includes('pool')) {
    return 'Water feature prominent, decorative basin or pool visible';
  }
  if (id.includes('monument') || id.includes('memorial')) {
    return 'Commemorative structure, statue or obelisk-like, dignified appearance';
  }
  if (id.includes('lab') || id.includes('factory')) {
    return 'Industrial or research facility, pipes, machinery, technical equipment';
  }
  if (id.includes('arena') || id.includes('stadium')) {
    return 'Large open structure for gatherings, seating areas, grand entrance';
  }
  if (id.includes('cafe') || id.includes('lounge')) {
    return 'Cozy establishment with outdoor seating, warm lighting, inviting';
  }
  if (id.includes('museum') || id.includes('gallery')) {
    return 'Cultural building with grand entrance, display windows, classical elements';
  }
  if (id.includes('academy') || id.includes('campus')) {
    return 'Educational institution, multiple connected buildings, scholarly appearance';
  }
  if (id.includes('garden') || id.includes('park')) {
    return 'Green space with plants, trees, paths, natural elements integrated';
  }
  if (id.includes('headquarters') || id.includes('hq')) {
    return 'Corporate building, modern office aesthetic, prominent signage';
  }
  if (id.includes('ruins')) {
    return 'Dilapidated structure, broken walls, overgrown, abandoned appearance';
  }
  if (id.includes('yacht') || id.includes('boat')) {
    return 'Maritime structure or vessel, docked appearance, nautical elements';
  }
  if (id.includes('den')) {
    return 'Cozy dwelling, lived-in appearance, creature comforts visible';
  }
  if (name.includes('plasma')) {
    return 'Futuristic energy aesthetic, glowing pink/magenta elements, high-tech';
  }
  if (building.category === 'meme') {
    return 'Playful, colorful, meme-culture inspired, slightly absurd but charming';
  }
  if (building.category === 'legends') {
    return 'Historical significance, either grand or ruined depending on context';
  }
  
  return 'Modern architectural style appropriate for a crypto-themed city';
}

// =============================================================================
// API CALLS
// =============================================================================

async function generateImage(prompt: string, category: string): Promise<Buffer | null> {
  if (!GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY not set');
    return null;
  }
  
  // Load reference image for style consistency
  const referenceBase64 = loadReferenceImage(category);
  
  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];
  
  if (referenceBase64) {
    parts.push({
      inline_data: {
        mime_type: 'image/png',
        data: referenceBase64,
      }
    });
    parts.push({
      text: `Use this image as a STYLE REFERENCE for the isometric pixel art style, perspective, and level of detail. Generate a NEW building in this EXACT same visual style:\n\n${prompt}`
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
          responseModalities: ['IMAGE', 'TEXT'],
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  API Error: ${response.status} - ${errorText.substring(0, 200)}`);
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

function loadReferenceImage(category: string): string | null {
  const refMapping: Record<string, string> = {
    defi: 'commercial/4x4bookstore_south.png',
    exchange: 'commercial/4x4bookstore_south.png',
    chain: 'landmark/6x6internet_archive_south.png',
    ct: 'commercial/3x3hospital_south.png',
    meme: 'residential/3x3limestones_south.png',
    plasma: 'landmark/6x6internet_archive_south.png',
    stablecoin: 'commercial/4x4bookstore_south.png',
    infrastructure: 'civic/2x2fire_station_south.png',
    legends: 'landmark/6x6internet_archive_south.png',
    titan: 'residential/3x3limestones_south.png',
  };
  
  const refPath = path.join(REFERENCE_DIR, refMapping[category] || refMapping.defi);
  
  if (!fs.existsSync(refPath)) {
    // Try crypto directory for existing sprites
    const cryptoRefs = fs.readdirSync(path.join(OUTPUT_DIR, category === 'titan' ? 'plasma' : category))
      .filter(f => f.endsWith('.png'));
    if (cryptoRefs.length > 0) {
      const cryptoRef = path.join(OUTPUT_DIR, category === 'titan' ? 'plasma' : category, cryptoRefs[0]);
      try {
        return fs.readFileSync(cryptoRef).toString('base64');
      } catch {
        return null;
      }
    }
    return null;
  }
  
  try {
    return fs.readFileSync(refPath).toString('base64');
  } catch {
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
Missing Sprite Generator

Generates sprites for procedural buildings that don't have sprites yet.

Usage:
  GEMINI_API_KEY=your_key npx ts-node scripts/generateMissingSprites.ts [options]

Options:
  --limit, -l <n>       Maximum number to generate
  --category, -c <name> Only generate for specific category  
  --dry-run, -d         Show what would be generated
  --help, -h            Show this help

Examples:
  npx ts-node scripts/generateMissingSprites.ts --dry-run
  npx ts-node scripts/generateMissingSprites.ts --limit 10 --category plasma
        `);
        process.exit(0);
    }
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs();
  
  console.log('🎨 Missing Sprite Generator');
  console.log('===========================\n');
  
  if (!GEMINI_API_KEY && !options.dryRun) {
    console.error('❌ Error: GEMINI_API_KEY environment variable required');
    console.error('   Set it: export GEMINI_API_KEY=your_key');
    process.exit(1);
  }
  
  // Get missing buildings
  let missing = getMissingBuildings();
  
  console.log(`📊 Found ${missing.length} buildings without sprites\n`);
  
  // Filter by category if specified
  if (options.category) {
    missing = missing.filter(b => b.category === options.category);
    console.log(`   Filtered to ${missing.length} in category: ${options.category}`);
  }
  
  // Apply limit
  if (options.limit) {
    missing = missing.slice(0, options.limit);
    console.log(`   Limited to ${missing.length} buildings\n`);
  }
  
  if (missing.length === 0) {
    console.log('✅ All procedural buildings have sprites!');
    return;
  }
  
  // Group by category for summary
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
    for (const building of missing) {
      console.log(`\n📍 ${building.name} (${building.id})`);
      console.log(`   Category: ${building.category}`);
      console.log(`   Footprint: ${building.footprint.width}x${building.footprint.height}`);
      console.log(`   Icon: ${building.icon}`);
      const prompt = generatePrompt(building);
      console.log(`   Prompt preview: ${prompt.substring(0, 200)}...`);
    }
    return;
  }
  
  // Generate sprites
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < missing.length; i++) {
    const building = missing[i];
    console.log(`\n[${i + 1}/${missing.length}] 🏗️  ${building.name}`);
    console.log(`   Category: ${building.category}`);
    console.log(`   Footprint: ${building.footprint.width}x${building.footprint.height}`);
    
    const prompt = generatePrompt(building);
    console.log('   Calling Gemini API...');
    
    const imageBuffer = await generateImage(prompt, building.category);
    
    if (imageBuffer) {
      const filepath = saveImage(imageBuffer, building);
      console.log(`   ✅ Saved: ${path.basename(filepath)}`);
      successCount++;
    } else {
      console.log(`   ❌ Failed to generate`);
      failCount++;
    }
    
    // Rate limiting - wait between requests
    if (i < missing.length - 1) {
      console.log('   Waiting 3s (rate limit)...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('\n===========================');
  console.log(`✨ Generation complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
