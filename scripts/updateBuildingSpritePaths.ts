#!/usr/bin/env node
/**
 * Updates buildings.ts to add sprite paths for all generated sprites
 * and sets isProcedural: false for buildings that now have sprites
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUILDINGS_FILE = path.join(PROJECT_ROOT, 'src/games/isocity/crypto/buildings.ts');
const SPRITES_DIR = path.join(PROJECT_ROOT, 'public/Building/crypto');

// Get all sprite files
function getAllSprites(): Map<string, string> {
  const sprites = new Map<string, string>();
  
  const categories = fs.readdirSync(SPRITES_DIR).filter(f => {
    const fullPath = path.join(SPRITES_DIR, f);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  });
  
  for (const cat of categories) {
    const catDir = path.join(SPRITES_DIR, cat);
    const files = fs.readdirSync(catDir).filter(f => f.endsWith('_south.png'));
    
    for (const file of files) {
      // Extract building ID from filename like "2x2building_name_south.png"
      const match = file.match(/(\d+x\d+)(.+)_south\.png/);
      if (match) {
        const footprint = match[1];
        const buildingId = match[2];
        const spritePath = `/Building/crypto/${cat}/${file}`;
        sprites.set(buildingId, spritePath);
      }
    }
  }
  
  return sprites;
}

function updateBuildingsFile(): void {
  const sprites = getAllSprites();
  console.log(`Found ${sprites.size} sprites to map\n`);
  
  let content = fs.readFileSync(BUILDINGS_FILE, 'utf-8');
  let updatedCount = 0;
  
  // Process line by line, tracking which building block we're in
  const lines = content.split('\n');
  const newLines: string[] = [];
  let currentBuildingId: string | null = null;
  let inBuildingBlock = false;
  let foundIsProcedural = false;
  let hasSprites = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect building ID line
    const idMatch = line.match(/^\s*id:\s*'([^']+)'/);
    if (idMatch) {
      currentBuildingId = idMatch[1];
      inBuildingBlock = true;
      foundIsProcedural = false;
      hasSprites = false;
    }
    
    // Check for sprites block
    if (inBuildingBlock && line.includes('sprites:')) {
      hasSprites = true;
    }
    
    // Check for isProcedural: true and update if we have a sprite
    if (inBuildingBlock && currentBuildingId && sprites.has(currentBuildingId)) {
      if (line.match(/^\s*isProcedural:\s*true/)) {
        const spritePath = sprites.get(currentBuildingId)!;
        // Change to false
        newLines.push(line.replace('isProcedural: true', 'isProcedural: false'));
        // Add sprites block after isProcedural line if not already present
        if (!hasSprites) {
          newLines.push(`    sprites: {`);
          newLines.push(`      south: '${spritePath}',`);
          newLines.push(`    },`);
        }
        updatedCount++;
        console.log(`✅ Updated: ${currentBuildingId}`);
        foundIsProcedural = true;
        continue;
      }
    }
    
    // End of building block
    if (inBuildingBlock && line.match(/^\s*\},$/)) {
      inBuildingBlock = false;
      currentBuildingId = null;
    }
    
    newLines.push(line);
  }
  
  fs.writeFileSync(BUILDINGS_FILE, newLines.join('\n'));
  console.log(`\n✨ Updated ${updatedCount} buildings`);
}

updateBuildingsFile();
