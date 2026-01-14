#!/usr/bin/env node
/**
 * Generate specific missing sprites
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
  process.exit(1);
}
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public/Building/crypto');

// The 5 missing buildings
const MISSING_BUILDINGS = [
  {
    id: 'vitalik_tower',
    name: "Vitalik's Beacon",
    category: 'legends',
    footprint: '2x3',
    description: 'Tall ethereal tower honoring the Ethereum creator, purple and crystal aesthetic'
  },
  {
    id: 'cz_safu_fund',
    name: "CZ's SAFU Vault",
    category: 'legends', 
    footprint: '3x2',
    description: 'Fortified gold vault with SAFU letters, secure bank aesthetic'
  },
  {
    id: 'solana_spire',
    name: "Anatoly's Spire",
    category: 'legends',
    footprint: '2x3',
    description: 'Fast purple and green gradient tower, speed-themed with clock motifs'
  },
  {
    id: 'probably_nothing_museum',
    name: "'Probably Nothing' Museum",
    category: 'legends',
    footprint: '2x2',
    description: 'Ironic museum with NFT displays, art gallery with question marks'
  },
  {
    id: 'alpha_bunker',
    name: "Cobie's Alpha Bunker",
    category: 'legends',
    footprint: '2x2',
    description: 'Underground secure bunker for alpha leaks, military-style crypto intel HQ'
  }
];

function generatePrompt(building: typeof MISSING_BUILDINGS[0]): string {
  return `Generate a single isometric pixel art building sprite for a city builder video game.

STYLE: Classic 16-bit isometric pixel art like SimCity 2000 or Pocket City. 
- Clean visible pixels, NO anti-aliasing or blur
- Limited color palette (max 20 colors)
- South-facing isometric view (2:1 diamond perspective)
- TRANSPARENT BACKGROUND - no ground, no shadows, just the building floating

BUILDING: "${building.name}"
SIZE: ${building.footprint} tiles
COLORS: orange and red (legends category)
STYLE: dramatic, historical, memorable
THEME: ${building.description}

The building should be a professional game asset with clean pixel edges, ready for use in a crypto-themed city builder game. Make it distinctive and recognizable.`;
}

async function generateImage(prompt: string): Promise<Buffer | null> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: prompt }],
    });
    
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64');
      }
    }
    
    console.error('  No image data in response');
    return null;
    
  } catch (error: unknown) {
    console.error(`  API Error: ${(error as Error).message}`);
    return null;
  }
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main(): Promise<void> {
  console.log('🍌 Generating 5 Missing Sprites');
  console.log('================================\n');
  
  const categoryDir = path.join(OUTPUT_DIR, 'legends');
  ensureDir(categoryDir);
  
  for (let i = 0; i < MISSING_BUILDINGS.length; i++) {
    const building = MISSING_BUILDINGS[i];
    console.log(`\n[${i + 1}/5] 🏗️  ${building.name}`);
    console.log(`   ID: ${building.id}`);
    console.log(`   Footprint: ${building.footprint}`);
    
    const prompt = generatePrompt(building);
    console.log('   Calling Nano Banana API...');
    
    const imageBuffer = await generateImage(prompt);
    
    if (imageBuffer) {
      const filename = `${building.footprint}${building.id}_south.png`;
      const filepath = path.join(categoryDir, filename);
      fs.writeFileSync(filepath, imageBuffer);
      console.log(`   ✅ Saved: ${filename}`);
    } else {
      console.log(`   ❌ Failed`);
    }
    
    if (i < MISSING_BUILDINGS.length - 1) {
      console.log('   Waiting 2s...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n================================');
  console.log('✨ Done!');
}

main().catch(console.error);
