/**
 * Update building registry to use generated sprites
 * 
 * This script:
 * 1. Scans generated sprites in public/Building/crypto/
 * 2. Updates the isProcedural flag to false for buildings with sprites
 * 3. Adds sprite paths to building definitions
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
        console.log(`Found sprite: ${buildingId} -> ${spritePath}`);
      }
    }
  }
  
  return sprites;
}

// Generate updated building entries with sprites
function generateSpriteConfig(sprites: Map<string, string>): void {
  console.log('\n=== Sprite Configuration ===\n');
  console.log('Add these sprite configurations to the building definitions:\n');
  
  for (const [buildingId, spritePath] of sprites) {
    // Get footprint from filename
    const filename = path.basename(spritePath);
    const footprintMatch = filename.match(/^(\d+)x(\d+)/);
    const footprint = footprintMatch ? `${footprintMatch[1]}x${footprintMatch[2]}` : '2x2';
    
    console.log(`'${buildingId}': {`);
    console.log(`  isProcedural: false,`);
    console.log(`  sprites: {`);
    console.log(`    south: '${spritePath}',`);
    console.log(`  },`);
    console.log(`},\n`);
  }
}

// Main
function main() {
  console.log('Scanning generated sprites...\n');
  const sprites = scanGeneratedSprites();
  console.log(`\nFound ${sprites.size} sprites total\n`);
  
  generateSpriteConfig(sprites);
  
  // Output summary by category
  const byCat = new Map<string, number>();
  for (const [, spritePath] of sprites) {
    const cat = spritePath.split('/')[3];
    byCat.set(cat, (byCat.get(cat) || 0) + 1);
  }
  
  console.log('\n=== Summary by Category ===');
  for (const [cat, count] of byCat) {
    console.log(`  ${cat}: ${count} sprites`);
  }
}

main();
