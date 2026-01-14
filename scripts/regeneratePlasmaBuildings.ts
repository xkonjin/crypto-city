#!/usr/bin/env node
/**
 * PLASMA SPRITE REGENERATOR
 * 
 * Regenerates remaining Plasma building sprites with correct Plasma.to brand colors.
 * Uses British Racing Green (#162F29), Teal (#569F8C), and Gold (#DCCC7B) accents.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public/Building/crypto');

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

interface SpriteConfig {
  id: string;
  footprint: { width: number; height: number };
  prompt: string;
  outputPath: string;
}

// Remaining Plasma buildings to regenerate
const PLASMA_SPRITES: SpriteConfig[] = [
  {
    id: 'plasma_lab',
    footprint: { width: 2, height: 2 },
    prompt: `Isometric pixel art building: "Plasma Lab" - Research laboratory for blockchain technology.
COLORS: Primary British Racing Green (#162F29), glowing teal (#569F8C) equipment, white lab elements, light green (#DCEFEA) screens.
STYLE: Modern tech lab with scientific equipment, glass walls showing workstations, antenna array on roof, holographic displays.
SIZE: 2x2 tile footprint.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/2x2plasma_lab_south.png',
  },
  {
    id: 'plasma_garden',
    footprint: { width: 2, height: 2 },
    prompt: `Isometric pixel art: "Plasma Garden" - A high-tech botanical garden powered by blockchain.
COLORS: British Racing Green (#162F29) planters, teal (#569F8C) water features, vibrant green plants, gold (#DCCC7B) pathways.
STYLE: Futuristic garden with geometric planters, holographic trees, teal water fountains, LED lighting along paths.
SIZE: 2x2 tile footprint.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/2x2plasma_garden_south.png',
  },
  {
    id: 'plasma_fountain',
    footprint: { width: 1, height: 1 },
    prompt: `Isometric pixel art: "Plasma Fountain" - Decorative tech fountain.
COLORS: British Racing Green (#162F29) base, glowing teal (#569F8C) water/energy streams, silver metal.
STYLE: Modern fountain with levitating water orbs, energy streams flowing upward, geometric base.
SIZE: 1x1 tile footprint, small decorative piece.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/1x1plasma_fountain_south.png',
  },
  {
    id: 'plasma_monument',
    footprint: { width: 2, height: 2 },
    prompt: `Isometric pixel art: "Plasma Monument" - Memorial monument for the Plasma blockchain.
COLORS: British Racing Green (#162F29) stone, teal (#569F8C) glowing elements, gold (#DCCC7B) plaques.
STYLE: Tall obelisk or abstract sculpture with flowing energy patterns, commemorative design, eternal flame effect in teal.
SIZE: 2x2 tile footprint.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/2x2plasma_monument_south.png',
  },
  {
    id: 'plasma_gateway',
    footprint: { width: 2, height: 1 },
    prompt: `Isometric pixel art: "Plasma Gateway" - Entry portal/gate to Plasma ecosystem.
COLORS: British Racing Green (#162F29) pillars, teal (#569F8C) energy portal, gold (#DCCC7B) trim.
STYLE: Two pillars with glowing energy gate between them, digital particle effects, futuristic archway.
SIZE: 2x1 tile footprint, horizontal gate structure.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/2x1plasma_gateway_south.png',
  },
  {
    id: 'plasma_observatory',
    footprint: { width: 2, height: 2 },
    prompt: `Isometric pixel art building: "Plasma Observatory" - Space/data observation center.
COLORS: British Racing Green (#162F29) dome, teal (#569F8C) observation windows, silver telescope, light green screens.
STYLE: Observatory with rotating dome, large telescope, satellite dishes, holographic star projections.
SIZE: 2x2 tile footprint.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/2x2plasma_observatory_south.png',
  },
  {
    id: 'plasma_academy',
    footprint: { width: 3, height: 2 },
    prompt: `Isometric pixel art building: "Plasma Academy" - Educational institution for blockchain training.
COLORS: British Racing Green (#162F29) walls, teal (#569F8C) windows, gold (#DCCC7B) roof accents, light green trim.
STYLE: Modern university building with large lecture halls, digital classrooms visible, graduation cap motif.
SIZE: 3x2 tile footprint, wide academic building.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/3x2plasma_academy_south.png',
  },
  {
    id: 'plasma_museum',
    footprint: { width: 2, height: 2 },
    prompt: `Isometric pixel art building: "Plasma Museum" - Museum showcasing blockchain history.
COLORS: British Racing Green (#162F29) exterior, teal (#569F8C) display cases, gold (#DCCC7B) frames, marble white accents.
STYLE: Classical museum with modern twist, large exhibition windows, holographic displays visible inside.
SIZE: 2x2 tile footprint.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/2x2plasma_museum_south.png',
  },
  {
    id: 'plasma_stadium',
    footprint: { width: 4, height: 3 },
    prompt: `Isometric pixel art building: "Plasma Stadium" - Large sports/events venue.
COLORS: British Racing Green (#162F29) exterior, teal (#569F8C) field/court lighting, gold (#DCCC7B) roof trim.
STYLE: Modern stadium with retractable roof, massive screens, VIP sections, field visible from outside.
SIZE: 4x3 tile footprint, large venue.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/4x3plasma_stadium_south.png',
  },
  {
    id: 'plasma_spire',
    footprint: { width: 1, height: 2 },
    prompt: `Isometric pixel art: "Plasma Spire" - Tall narrow communication spire.
COLORS: British Racing Green (#162F29) structure, teal (#569F8C) energy rings, gold tip.
STYLE: Elegant vertical spire with energy rings circling it, beacon light at top, art deco influence.
SIZE: 1x2 tile footprint, tall narrow structure.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/1x2plasma_spire_south.png',
  },
  {
    id: 'plasma_nexus',
    footprint: { width: 3, height: 3 },
    prompt: `Isometric pixel art building: "Plasma Nexus" - Central network hub building.
COLORS: British Racing Green (#162F29) base, teal (#569F8C) energy conduits, light green (#DCEFEA) glowing core.
STYLE: High-tech data center with visible server racks, energy connections radiating outward, central glowing orb.
SIZE: 3x3 tile footprint, impressive tech building.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/3x3plasma_nexus_south.png',
  },
];

async function generateSprite(config: SpriteConfig): Promise<boolean> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  console.log(`\nGenerating: ${config.id} (${config.footprint.width}x${config.footprint.height})`);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: config.prompt }],
    });

    if (!response.candidates?.[0]?.content?.parts) {
      console.error(`  ❌ No response parts for ${config.id}`);
      return false;
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        const outputPath = path.join(OUTPUT_DIR, config.outputPath);
        const dir = path.dirname(outputPath);
        
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
        fs.writeFileSync(outputPath, imageBuffer);
        
        console.log(`  ✅ Saved: ${config.outputPath} (${(imageBuffer.length / 1024).toFixed(1)} KB)`);
        return true;
      }
    }
    
    console.error(`  ❌ No image data in response for ${config.id}`);
    return false;
  } catch (error) {
    console.error(`  ❌ Error generating ${config.id}:`, error);
    return false;
  }
}

async function main() {
  console.log('🎨 Plasma Building Sprite Regenerator');
  console.log('=====================================');
  console.log('Using Plasma.to brand colors:');
  console.log('  - British Racing Green: #162F29');
  console.log('  - Teal: #569F8C');
  console.log('  - Gold: #DCCC7B');
  console.log(`\nSprites to regenerate: ${PLASMA_SPRITES.length}`);
  
  let success = 0;
  let failed = 0;
  
  for (const config of PLASMA_SPRITES) {
    const result = await generateSprite(config);
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(40));
  console.log(`✅ Success: ${success}/${PLASMA_SPRITES.length}`);
  console.log(`❌ Failed: ${failed}/${PLASMA_SPRITES.length}`);
}

main().catch(console.error);
