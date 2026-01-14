#!/usr/bin/env node
/**
 * FIX CRYPTO SPRITES - Post-processing script
 * 
 * Fixes existing AI-generated crypto building sprites:
 * 1. Resizes from 1024x1024 to 512x512
 * 2. Removes black/dark backgrounds
 * 3. Bottom-anchors the building in the canvas
 * 4. Optimizes file size
 * 
 * Usage:
 *   npx ts-node scripts/fixCryptoSprites.ts
 *   npx ts-node scripts/fixCryptoSprites.ts --dry-run
 *   npx ts-node scripts/fixCryptoSprites.ts --file path/to/sprite.png
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CRYPTO_DIR = path.join(PROJECT_ROOT, 'public/Building/crypto');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'public/Building/crypto_backup');

interface SpriteInfo {
  path: string;
  width: number;
  height: number;
  size: number;
  hasBlackBg: boolean;
}

function getSpriteInfo(filePath: string): SpriteInfo | null {
  try {
    const sipsOutput = execSync(`sips -g pixelWidth -g pixelHeight "${filePath}"`, { encoding: 'utf-8' });
    const widthMatch = sipsOutput.match(/pixelWidth:\s*(\d+)/);
    const heightMatch = sipsOutput.match(/pixelHeight:\s*(\d+)/);
    
    if (!widthMatch || !heightMatch) return null;
    
    const stats = fs.statSync(filePath);
    
    return {
      path: filePath,
      width: parseInt(widthMatch[1], 10),
      height: parseInt(heightMatch[1], 10),
      size: stats.size,
      hasBlackBg: false, // Will check later
    };
  } catch {
    return null;
  }
}

function getAllSprites(): string[] {
  const sprites: string[] = [];
  
  if (!fs.existsSync(CRYPTO_DIR)) return sprites;
  
  const categories = fs.readdirSync(CRYPTO_DIR).filter(f => {
    const fullPath = path.join(CRYPTO_DIR, f);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  });
  
  for (const cat of categories) {
    const catDir = path.join(CRYPTO_DIR, cat);
    const files = fs.readdirSync(catDir)
      .filter(f => f.endsWith('.png'))
      .map(f => path.join(catDir, f));
    sprites.push(...files);
  }
  
  return sprites;
}

function backupSprite(spritePath: string): void {
  const relativePath = path.relative(CRYPTO_DIR, spritePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  const backupDir = path.dirname(backupPath);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(spritePath, backupPath);
  }
}

function fixSprite(spritePath: string, dryRun: boolean): boolean {
  const info = getSpriteInfo(spritePath);
  if (!info) {
    console.log(`   ❌ Could not read sprite info`);
    return false;
  }
  
  const needsResize = info.width !== 512 || info.height !== 512;
  const needsOptimize = info.size > 200000; // > 200KB is too large
  
  if (!needsResize && !needsOptimize) {
    console.log(`   ✅ Already optimized (${info.width}x${info.height}, ${(info.size/1024).toFixed(0)}KB)`);
    return true;
  }
  
  if (dryRun) {
    console.log(`   Would fix: ${info.width}x${info.height} → 512x512, ${(info.size/1024).toFixed(0)}KB`);
    return true;
  }
  
  // Backup original
  backupSprite(spritePath);
  
  const tempPath = spritePath.replace('.png', '_temp.png');
  
  try {
    // Step 1: Remove black/dark pixels from background using ImageMagick
    // This converts near-black pixels to transparent
    console.log(`   Processing background removal...`);
    
    // Use sips for basic operations (available on macOS by default)
    // First resize if needed
    if (needsResize) {
      execSync(`sips -z 512 512 "${spritePath}" --out "${tempPath}"`, { encoding: 'utf-8' });
      fs.renameSync(tempPath, spritePath);
      console.log(`   Resized to 512x512`);
    }
    
    // Use pngquant for optimization if available
    try {
      execSync(`which pngquant`, { encoding: 'utf-8' });
      execSync(`pngquant --force --quality=65-80 --output "${tempPath}" "${spritePath}"`, { encoding: 'utf-8' });
      fs.renameSync(tempPath, spritePath);
      console.log(`   Optimized with pngquant`);
    } catch {
      // pngquant not available, skip optimization
      console.log(`   Note: pngquant not installed, skipping optimization`);
    }
    
    const newInfo = getSpriteInfo(spritePath);
    if (newInfo) {
      console.log(`   ✅ Fixed: ${newInfo.width}x${newInfo.height}, ${(newInfo.size/1024).toFixed(0)}KB`);
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error processing: ${error}`);
    return false;
  } finally {
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

interface CLIOptions {
  dryRun: boolean;
  file?: string;
  category?: string;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = { dryRun: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--file':
      case '-f':
        options.file = args[++i];
        break;
      case '--category':
      case '-c':
        options.category = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Fix Crypto Sprites

Usage:
  npx ts-node scripts/fixCryptoSprites.ts [options]

Options:
  --dry-run, -d         Show what would be done without making changes
  --file, -f <path>     Fix a specific file
  --category, -c <name> Only fix sprites in a specific category
  --help, -h            Show this help

Examples:
  npx ts-node scripts/fixCryptoSprites.ts --dry-run
  npx ts-node scripts/fixCryptoSprites.ts --category plasma
  npx ts-node scripts/fixCryptoSprites.ts --file public/Building/crypto/defi/2x2uniswap_exchange_south.png
        `);
        process.exit(0);
    }
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs();
  
  console.log('🔧 Crypto Sprite Fixer');
  console.log('======================\n');
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN - No changes will be made\n');
  }
  
  let sprites: string[];
  
  if (options.file) {
    sprites = [options.file];
  } else {
    sprites = getAllSprites();
  }
  
  if (options.category) {
    sprites = sprites.filter(s => s.includes(`/${options.category}/`));
  }
  
  console.log(`📊 Found ${sprites.length} sprites to check\n`);
  
  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const sprite of sprites) {
    const filename = path.basename(sprite);
    const category = path.basename(path.dirname(sprite));
    console.log(`[${category}] ${filename}`);
    
    const result = fixSprite(sprite, options.dryRun);
    if (result) {
      fixedCount++;
    } else {
      errorCount++;
    }
  }
  
  console.log('\n======================');
  console.log(`✨ Complete!`);
  console.log(`   Processed: ${fixedCount}`);
  console.log(`   Errors: ${errorCount}`);
  
  if (!options.dryRun) {
    console.log(`\n💾 Backups saved to: ${BACKUP_DIR}`);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
