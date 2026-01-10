/**
 * Patch buildings.ts to use generated sprites
 * 
 * This script modifies the buildings.ts file to:
 * 1. Set isProcedural: false for buildings with generated sprites
 * 2. Add sprites: { south: '/path/to/sprite.png' } 
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SPRITES_DIR = path.join(PROJECT_ROOT, 'public', 'Building', 'crypto');
const BUILDINGS_FILE = path.join(PROJECT_ROOT, 'src', 'games', 'isocity', 'crypto', 'buildings.ts');

// Scan for generated sprites
function scanGeneratedSprites(): Map<string, string> {
  const sprites = new Map<string, string>();
  
  const categories = fs.readdirSync(SPRITES_DIR).filter((f: string) => {
    const stat = fs.statSync(path.join(SPRITES_DIR, f));
    return stat.isDirectory();
  });
  
  for (const category of categories) {
    const categoryDir = path.join(SPRITES_DIR, category);
    const files = fs.readdirSync(categoryDir).filter((f: string) => f.endsWith('.png'));
    
    for (const file of files) {
      // Extract building ID from filename: 2x2uniswap_exchange_south.png -> uniswap_exchange
      const match = file.match(/^\d+x\d+(.+)_south\.png$/);
      if (match) {
        const buildingId = match[1];
        const spritePath = `/Building/crypto/${category}/${file}`;
        sprites.set(buildingId, spritePath);
      }
    }
  }
  
  return sprites;
}

// Update buildings file
function patchBuildingsFile(sprites: Map<string, string>): void {
  console.log(`Reading ${BUILDINGS_FILE}...`);
  let content = fs.readFileSync(BUILDINGS_FILE, 'utf-8');
  
  let patchCount = 0;
  
  for (const [buildingId, spritePath] of sprites) {
    // Pattern to find the building definition and replace isProcedural: true with isProcedural: false
    // and add sprites property
    
    // Find the building by ID
    const idPattern = new RegExp(`'${buildingId}':\\s*\\{`, 'g');
    const match = idPattern.exec(content);
    
    if (!match) {
      console.log(`  Building not found: ${buildingId}`);
      continue;
    }
    
    // Find isProcedural: true for this building and replace
    const startIdx = match.index;
    // Find the next building or end of object
    const searchRegion = content.slice(startIdx, startIdx + 2000); // Search within 2000 chars
    
    // Replace isProcedural: true with isProcedural: false
    const proceduralPattern = /isProcedural:\s*true/;
    if (proceduralPattern.test(searchRegion)) {
      const beforeRegion = content.slice(0, startIdx);
      const patchedRegion = searchRegion.replace(
        /isProcedural:\s*true,/,
        `isProcedural: false,\n    sprites: {\n      south: '${spritePath}',\n    },`
      );
      const afterRegion = content.slice(startIdx + searchRegion.length);
      content = beforeRegion + patchedRegion + afterRegion;
      patchCount++;
      console.log(`  Patched: ${buildingId}`);
    } else {
      console.log(`  Already patched or not found: ${buildingId}`);
    }
  }
  
  // Write back
  console.log(`\nWriting ${patchCount} patches to ${BUILDINGS_FILE}...`);
  fs.writeFileSync(BUILDINGS_FILE, content);
  console.log('Done!');
}

// Main
function main() {
  console.log('Scanning generated sprites...\n');
  const sprites = scanGeneratedSprites();
  console.log(`Found ${sprites.size} sprites total\n`);
  
  console.log('Patching buildings.ts...\n');
  patchBuildingsFile(sprites);
  
  // Output summary
  console.log('\n=== Summary ===');
  console.log(`Total sprites: ${sprites.size}`);
}

main();
