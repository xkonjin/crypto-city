#!/usr/bin/env npx ts-node

/**
 * Aggressive Sprite Transparency Fixer
 * 
 * Uses multiple strategies to remove backgrounds from stubborn sprites:
 * 1. Multi-point sampling from edges
 * 2. Higher color tolerance
 * 3. Gradient detection
 * 
 * Usage:
 *   npx ts-node scripts/fixSpriteTransparencyAggressive.ts --dry-run
 *   npx ts-node scripts/fixSpriteTransparencyAggressive.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const CRYPTO_SPRITES_DIR = path.join(process.cwd(), 'public/Building/crypto');
const BACKUP_DIR = path.join(process.cwd(), 'public/Building/crypto_backup_aggressive');

interface FixResult {
  file: string;
  status: 'fixed' | 'skipped' | 'error';
  reason: string;
  originalSize?: number;
  newSize?: number;
  transparencyPct?: number;
}

function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

// More aggressive - sample from all 4 edges, not just corners
async function sampleEdges(imagePath: string): Promise<Map<string, { count: number; r: number; g: number; b: number }>> {
  const { data, info } = await sharp(imagePath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const colorCounts = new Map<string, { count: number; r: number; g: number; b: number }>();
  
  const samplePixel = (x: number, y: number) => {
    const idx = (y * width + x) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Quantize more aggressively to catch gradients
    const key = `${Math.round(r / 20) * 20},${Math.round(g / 20) * 20},${Math.round(b / 20) * 20}`;
    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { count: 1, r, g, b });
    }
  };

  // Sample edges (10 pixels deep)
  for (let i = 0; i < 10; i++) {
    // Top edge
    for (let x = 0; x < width; x += 5) {
      samplePixel(x, i);
    }
    // Bottom edge
    for (let x = 0; x < width; x += 5) {
      samplePixel(x, height - 1 - i);
    }
    // Left edge
    for (let y = 0; y < height; y += 5) {
      samplePixel(i, y);
    }
    // Right edge
    for (let y = 0; y < height; y += 5) {
      samplePixel(width - 1 - i, y);
    }
  }

  return colorCounts;
}

async function findDominantEdgeColors(imagePath: string): Promise<Array<{ r: number; g: number; b: number }>> {
  const colorCounts = await sampleEdges(imagePath);
  
  // Sort by count and return top colors
  const sorted = Array.from(colorCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 colors
  
  return sorted.map(c => ({ r: c.r, g: c.g, b: c.b }));
}

async function fixSprite(imagePath: string, dryRun: boolean): Promise<FixResult> {
  const fileName = path.basename(imagePath);
  
  try {
    // Get metadata
    const metadata = await sharp(imagePath).metadata();
    
    // Skip if already RGBA with good transparency
    if (metadata.channels === 4) {
      const { data, info } = await sharp(imagePath).raw().toBuffer({ resolveWithObject: true });
      let transparentPixels = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) transparentPixels++;
      }
      const transparencyRatio = transparentPixels / (info.width * info.height);
      
      if (transparencyRatio > 0.15) { // Already good
        return {
          file: fileName,
          status: 'skipped',
          reason: `Already has ${(transparencyRatio * 100).toFixed(1)}% transparency`,
        };
      }
    }

    // Find dominant edge colors (potential backgrounds)
    const bgColors = await findDominantEdgeColors(imagePath);
    
    if (bgColors.length === 0) {
      return {
        file: fileName,
        status: 'skipped',
        reason: 'Could not detect edge colors',
      };
    }

    // Read the image
    const { data: rawData, info } = await sharp(imagePath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const newData = Buffer.from(rawData);

    // More aggressive flood-fill with multiple seed points
    const visited = new Set<number>();
    const queue: Array<{ x: number; y: number }> = [];

    // Seed from entire edge perimeter
    for (let x = 0; x < width; x++) {
      queue.push({ x, y: 0 });
      queue.push({ x, y: height - 1 });
    }
    for (let y = 0; y < height; y++) {
      queue.push({ x: 0, y });
      queue.push({ x: width - 1, y });
    }

    // Tolerance increases with number of background colors found
    const tolerance = 25 + (bgColors.length * 5); // 30-50 range

    // BFS flood fill
    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const idx = (y * width + x) * 4;
      const key = y * width + x;

      if (visited.has(key)) continue;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const r = newData[idx];
      const g = newData[idx + 1];
      const b = newData[idx + 2];

      // Check if this pixel matches ANY background color
      let isBackground = false;
      for (const bgColor of bgColors) {
        if (colorDistance({ r, g, b }, bgColor) < tolerance) {
          isBackground = true;
          break;
        }
      }
      
      if (!isBackground) continue;

      visited.add(key);
      newData[idx + 3] = 0; // Make transparent

      // Add neighbors (4-directional)
      queue.push({ x: x - 1, y });
      queue.push({ x: x + 1, y });
      queue.push({ x, y: y - 1 });
      queue.push({ x, y: y + 1 });
    }

    // Calculate transparency percentage
    let transparentPixels = 0;
    for (let i = 3; i < newData.length; i += 4) {
      if (newData[i] < 10) transparentPixels++;
    }
    const transparencyRatio = transparentPixels / (width * height);

    // Lower threshold since we're being aggressive
    if (transparencyRatio < 0.05) {
      return {
        file: fileName,
        status: 'skipped',
        reason: `Only ${(transparencyRatio * 100).toFixed(1)}% - background too complex or integrated`,
        transparencyPct: transparencyRatio * 100,
      };
    }

    // Don't remove too much (sprite would be invisible)
    if (transparencyRatio > 0.95) {
      return {
        file: fileName,
        status: 'skipped',
        reason: `${(transparencyRatio * 100).toFixed(1)}% would be transparent - entire sprite would disappear`,
        transparencyPct: transparencyRatio * 100,
      };
    }

    if (dryRun) {
      return {
        file: fileName,
        status: 'fixed',
        reason: `Would remove background (${(transparencyRatio * 100).toFixed(1)}% transparent)`,
        transparencyPct: transparencyRatio * 100,
      };
    }

    // Backup original
    const backupPath = path.join(BACKUP_DIR, path.relative(CRYPTO_SPRITES_DIR, imagePath));
    await fs.promises.mkdir(path.dirname(backupPath), { recursive: true });
    await fs.promises.copyFile(imagePath, backupPath);

    // Save fixed sprite
    const originalSize = (await fs.promises.stat(imagePath)).size;
    
    await sharp(newData, { raw: { width, height, channels: 4 } })
      .png({ compressionLevel: 9, palette: true, colors: 64 })
      .toFile(imagePath);

    const newSize = (await fs.promises.stat(imagePath)).size;

    return {
      file: fileName,
      status: 'fixed',
      reason: `Removed background (${(transparencyRatio * 100).toFixed(1)}% transparent)`,
      originalSize,
      newSize,
      transparencyPct: transparencyRatio * 100,
    };

  } catch (error) {
    return {
      file: fileName,
      status: 'error',
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function getUnfixedSprites(): Promise<string[]> {
  // Only process sprites that STILL fail validation (have < 5% transparency)
  const sprites: string[] = [];
  const categories = await fs.promises.readdir(CRYPTO_SPRITES_DIR);
  
  for (const category of categories) {
    const categoryPath = path.join(CRYPTO_SPRITES_DIR, category);
    const stat = await fs.promises.stat(categoryPath);
    if (!stat.isDirectory()) continue;
    
    const files = await fs.promises.readdir(categoryPath);
    
    for (const file of files) {
      if (!file.endsWith('.png')) continue;
      
      const filePath = path.join(categoryPath, file);
      
      // Check current transparency
      const { data, info } = await sharp(filePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      let transparentPixels = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) transparentPixels++;
      }
      const transparencyRatio = transparentPixels / (info.width * info.height);
      
      // Only include sprites with < 5% transparency
      if (transparencyRatio < 0.05) {
        sprites.push(filePath);
      }
    }
  }
  
  return sprites;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('🎨 Aggressive Sprite Transparency Fixer');
  console.log('=======================================');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  console.log('Scanning for sprites that still need fixing...\n');
  const sprites = await getUnfixedSprites();

  console.log(`Found ${sprites.length} sprites still needing transparency fix\n`);

  if (sprites.length === 0) {
    console.log('✅ All sprites already have transparency!');
    return;
  }

  let fixed = 0;
  let skipped = 0;
  let errors = 0;
  let totalSaved = 0;

  for (const sprite of sprites) {
    const result = await fixSprite(sprite, dryRun);
    
    const icon = result.status === 'fixed' ? '✅' : result.status === 'skipped' ? '⏭️' : '❌';
    console.log(`${icon} ${result.file}: ${result.reason}`);
    
    if (result.status === 'fixed') {
      fixed++;
      if (result.originalSize && result.newSize) {
        const saved = result.originalSize - result.newSize;
        totalSaved += saved;
        console.log(`   Size: ${(result.originalSize / 1024).toFixed(1)}KB → ${(result.newSize / 1024).toFixed(1)}KB (saved ${(saved / 1024).toFixed(1)}KB)`);
      }
    } else if (result.status === 'skipped') {
      skipped++;
    } else {
      errors++;
    }
  }

  console.log('\n=======================================');
  console.log('📊 Summary');
  console.log(`   Fixed: ${fixed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  if (totalSaved > 0) {
    console.log(`   Total size saved: ${(totalSaved / 1024 / 1024).toFixed(2)}MB`);
  }
  
  if (!dryRun && fixed > 0) {
    console.log(`\n📁 Backups saved to: ${BACKUP_DIR}`);
  }
}

main().catch(console.error);
