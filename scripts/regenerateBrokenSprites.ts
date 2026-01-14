#!/usr/bin/env node
/**
 * SPRITE REGENERATOR - Fix Broken Sprites
 * 
 * Regenerates specific sprites that have issues:
 * - Black backgrounds
 * - Wrong colors (e.g., Plasma buildings that aren't using brand colors)
 * - Lowercase text
 * - Clipping issues
 * 
 * Uses Google's Gemini 2.5 Flash Image API with explicit transparency instructions.
 * 
 * Usage:
 *   GEMINI_API_KEY=your_key npx ts-node scripts/regenerateBrokenSprites.ts
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

// Plasma.to Brand Colors (from official brand kit)
const PLASMA_BRAND = {
  primary: '#162F29',        // British Racing Green
  dark: '#0A1512',           // Very dark green
  medium: '#295B4F',         // Medium green
  light: '#569F8C',          // Light teal
  veryLight: '#DCEFEA',      // Very light green
  yellow: '#DCCC7B',         // Accent yellow
  orange: '#D07F44',         // Accent orange
  silverBlue: '#5986C5',     // Silver blue accent
};

// Sprites to regenerate with specific prompts
interface SpriteConfig {
  id: string;
  category: string;
  footprint: { width: number; height: number };
  prompt: string;
  outputPath: string;
}

const SPRITES_TO_REGENERATE: SpriteConfig[] = [
  // ADDITIONAL PLASMA BUILDINGS to regenerate with correct brand colors
  {
    id: 'plasma_lab',
    category: 'plasma',
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
    category: 'plasma',
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
    category: 'plasma',
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
    category: 'plasma',
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
    category: 'plasma',
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
    category: 'plasma',
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
    category: 'plasma',
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
    category: 'plasma',
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
    category: 'plasma',
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
    category: 'plasma',
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
    category: 'plasma',
    footprint: { width: 3, height: 3 },
    prompt: `Isometric pixel art building: "Plasma Nexus" - Central network hub building.
COLORS: British Racing Green (#162F29) base, teal (#569F8C) energy conduits, light green (#DCEFEA) glowing core.
STYLE: High-tech data center with visible server racks, energy connections radiating outward, central glowing orb.
SIZE: 3x3 tile footprint, impressive tech building.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/3x3plasma_nexus_south.png',
  },
  // Keep the original list items below...
  // PLASMA BUILDINGS - Using official Plasma.to brand colors (already regenerated, kept for reference)
  {
    id: 'plasma_tower',
    category: 'plasma',
    footprint: { width: 2, height: 3 },
    prompt: `Isometric pixel art building: "Plasma Tower" - A tall elegant broadcast/communications tower.
COLORS: Primary British Racing Green (#162F29), accents of teal (#569F8C) and light green (#DCEFEA). Gold/yellow highlights (#DCCC7B).
STYLE: Modern, sleek, corporate tower with antenna on top. Glass and steel. Glowing green energy accents.
SIZE: 2x3 tile footprint, tall vertical structure.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds. Building only on transparent/alpha channel.
NO text on building. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/2x3plasma_tower_south.png',
  },
  {
    id: 'plasma_bridge',
    category: 'plasma',
    footprint: { width: 2, height: 3 },
    prompt: `Isometric pixel art structure: "Plasma Bridge" - A high-tech blockchain bridge/gateway connecting two platforms.
COLORS: Primary British Racing Green (#162F29), glowing teal (#569F8C), light green accents (#DCEFEA).
STYLE: Futuristic bridge with energy beams, digital data flowing through. Geometric modern design.
SIZE: 2x3 tile footprint, horizontal bridge structure.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds. Structure only on transparent/alpha channel.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/2x3plasma_bridge_south.png',
  },
  {
    id: 'plasma_reactor',
    category: 'plasma',
    footprint: { width: 3, height: 3 },
    prompt: `Isometric pixel art building: "Plasma Reactor" - A power generation facility with glowing reactor core.
COLORS: Primary British Racing Green (#162F29), glowing teal energy (#569F8C), silver/gray machinery.
STYLE: Industrial power plant with dome reactor, cooling towers, green energy glow effects.
SIZE: 3x3 tile footprint, industrial complex.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds. Building only on transparent/alpha channel.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/3x3plasma_reactor_south.png',
  },
  {
    id: 'plasma_hq',
    category: 'plasma',
    footprint: { width: 4, height: 4 },
    prompt: `Isometric pixel art building: "Plasma HQ" - Corporate headquarters, flagship building.
COLORS: Primary British Racing Green (#162F29), glass with teal tint (#569F8C), gold accents (#DCCC7B).
STYLE: Modern corporate skyscraper, glass and steel, prominent Plasma logo area (abstract geometric, no text), rooftop helipad.
SIZE: 4x4 tile footprint, tall impressive headquarters.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds. Building only on transparent/alpha channel.
NO text on building. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/4x4plasma_hq_south.png',
  },
  {
    id: 'plasma_node',
    category: 'plasma',
    footprint: { width: 1, height: 1 },
    prompt: `Isometric pixel art: "Plasma Node" - Small network node/server unit.
COLORS: British Racing Green (#162F29), glowing teal LEDs (#569F8C), silver metal casing.
STYLE: Compact server rack or network node with blinking lights, small antenna, cable connections.
SIZE: 1x1 tile footprint, small but detailed.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/1x1plasma_node_south.png',
  },
  {
    id: 'plasma_vault',
    category: 'plasma',
    footprint: { width: 2, height: 2 },
    prompt: `Isometric pixel art building: "Plasma Vault" - Secure crypto vault/treasury.
COLORS: Dark green (#162F29), reinforced steel gray, teal security lights (#569F8C), gold vault door accent.
STYLE: Fortified bank vault building, heavy doors, security cameras, armored walls.
SIZE: 2x2 tile footprint.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/2x2plasma_vault_south.png',
  },
  {
    id: 'plasma_arena',
    category: 'plasma',
    footprint: { width: 3, height: 3 },
    prompt: `Isometric pixel art building: "Plasma Arena" - Sports/events arena.
COLORS: British Racing Green (#162F29) exterior, teal (#569F8C) roof accents, bright interior lighting.
STYLE: Modern stadium/arena with curved roof, large entrance, seating visible, event lighting.
SIZE: 3x3 tile footprint, large arena.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'plasma/3x3plasma_arena_south.png',
  },
  
  // DEFI BUILDINGS with black background issues
  {
    id: 'compound_bank',
    category: 'defi',
    footprint: { width: 2, height: 2 },
    prompt: `Isometric pixel art building: "Compound Bank" - DeFi lending protocol building.
COLORS: Fresh green (#22c55e), white marble, gold accents. Clean modern bank aesthetic.
STYLE: Modern bank building with columns, large windows, "COMPOUND" styled geometric logo on facade (abstract shapes, no text).
SIZE: 2x2 tile footprint.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'defi/2x2compound_bank_south.png',
  },
  {
    id: 'eigenlayer_restaking',
    category: 'defi',
    footprint: { width: 2, height: 3 },
    prompt: `Isometric pixel art building: "EigenLayer Restaking Hub" - Restaking protocol tower.
COLORS: Purple (#8b5cf6), blue (#3b82f6), white highlights. Layered geometric design.
STYLE: Tall tower with multiple stacked layers (representing restaking), glowing energy between layers, modern tech aesthetic.
SIZE: 2x3 tile footprint, tall vertical structure.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'defi/2x3eigenlayer_restaking_south.png',
  },
  
  // EXCHANGE with black background
  {
    id: 'kraken_exchange',
    category: 'exchange',
    footprint: { width: 2, height: 3 },
    prompt: `Isometric pixel art building: "Kraken Exchange" - Cryptocurrency exchange headquarters.
COLORS: Deep purple (#6b21a8), sea green accents, white. Kraken/octopus themed.
STYLE: Gothic-style exchange building with kraken tentacle decorations on corners, grand entrance, trading floor visible through windows.
SIZE: 2x3 tile footprint.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'exchange/2x3kraken_exchange_south.png',
  },
  
  // MEME coins with black backgrounds
  {
    id: 'moon_monument',
    category: 'meme',
    footprint: { width: 2, height: 3 },
    prompt: `Isometric pixel art: "Moon Monument" - A monument celebrating crypto going "to the moon".
COLORS: Silver/gray moon surface, gold rocket, starry accents, lunar white.
STYLE: Large moon sphere with rocket launching from it, crater details, memorial plaque area (no text), astronaut figure.
SIZE: 2x3 tile footprint, vertical monument.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'meme/2x3moon_monument_south.png',
  },
  {
    id: 'floki_fortress',
    category: 'meme',
    footprint: { width: 2, height: 3 },
    prompt: `Isometric pixel art building: "Floki Fortress" - Viking-themed meme coin castle.
COLORS: Brown wood, gold accents, orange fire torches, viking horn gold.
STYLE: Viking longhouse/fortress with wooden beams, dragon head decorations, flaming torches, shield decorations on walls.
SIZE: 2x3 tile footprint, fortress structure.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'meme/2x3floki_fortress_south.png',
  },
  {
    id: 'wif_temple',
    category: 'meme',
    footprint: { width: 2, height: 2 },
    prompt: `Isometric pixel art building: "WIF Temple" - Temple for the dog with hat meme coin.
COLORS: Brown/tan temple stone, pink knitted hat accent, gold decorations.
STYLE: Ancient temple with dog statue wearing a pink knitted beanie hat on top, columns, ceremonial steps.
SIZE: 2x2 tile footprint.
CRITICAL: TRANSPARENT BACKGROUND. NO black, white, or colored backgrounds. NO ground plane.
NO text. Clean pixel art style, 64px base tile size.`,
    outputPath: 'meme/2x2wif_temple_south.png',
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
      // @ts-ignore - Type definitions may not include inlineData
      if (part.inlineData?.data) {
        const outputPath = path.join(OUTPUT_DIR, config.outputPath);
        const dir = path.dirname(outputPath);
        
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // @ts-ignore
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
  console.log('🎨 Sprite Regenerator - Fixing Broken Sprites');
  console.log('='.repeat(50));
  console.log(`\nSprites to regenerate: ${SPRITES_TO_REGENERATE.length}`);
  
  let success = 0;
  let failed = 0;
  
  for (const config of SPRITES_TO_REGENERATE) {
    const result = await generateSprite(config);
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Success: ${success}/${SPRITES_TO_REGENERATE.length}`);
  console.log(`❌ Failed: ${failed}/${SPRITES_TO_REGENERATE.length}`);
}

main().catch(console.error);
