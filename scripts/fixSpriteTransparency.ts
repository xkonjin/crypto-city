#!/usr/bin/env npx ts-node

/**
 * Fix Sprite Transparency Script
 * 
 * Converts RGB sprites to RGBA and removes backgrounds using flood-fill.
 * 
 * Usage:
 *   npx ts-node scripts/fixSpriteTransparency.ts           # Fix all crypto sprites
 *   npx ts-node scripts/fixSpriteTransparency.ts --dry-run # Preview without saving
 *   npx ts-node scripts/fixSpriteTransparency.ts --single path/to/sprite.png
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const CRYPTO_SPRITES_DIR = path.join(process.cwd(), 'public/Building/crypto');
const BACKUP_DIR = path.join(process.cwd(), 'public/Building/crypto_backup_pre_transparency');

interface FixResult {
  file: string;
  status: 'fixed' | 'skipped' | 'error';
  reason: string;
  originalSize?: number;
  newSize?: number;
}

// Colors to treat as background (will be made transparent)
const BACKGROUND_COLORS = [
  { r: 255, g: 255, b: 255 }, // White
  { r: 254, g: 254, b: 254 }, // Near-white
  { r: 253, g: 253, b: 253 },
  { r: 252, g: 252, b: 252 },
  { r: 238, g: 238, b: 238 }, // Light gray
  { r: 0, g: 0, b: 0 },       // Black (some sprites)
  { r: 1, g: 1, b: 1 },
  { r: 2, g: 2, b: 2 },
];

// Tolerance for color matching (Euclidean distance)
const COLOR_TOLERANCE = 15;

function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

function isBackgroundColor(r: number, g: number, b: number): boolean {
  for (const bg of BACKGROUND_COLORS) {
    if (colorDistance({ r, g, b }, bg) < COLOR_TOLERANCE) {
      return true;
    }
  }
  return false;
}

async function analyzeCorners(imagePath: string): Promise<{ r: number; g: number; b: number } | null> {
  const { data, info } = await sharp(imagePath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  
  // Sample corners (5x5 pixels from each corner)
  const cornerSamples: Array<{ r: number; g: number; b: number }> = [];
  
  const sampleCorner = (startX: number, startY: number) => {
    for (let y = startY; y < startY + 5 && y < height; y++) {
      for (let x = startX; x < startX + 5 && x < width; x++) {
        const idx = (y * width + x) * channels;
        cornerSamples.push({
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
        });
      }
    }
  };

  // Sample all 4 corners
  sampleCorner(0, 0);                    // Top-left
  sampleCorner(width - 5, 0);            // Top-right
  sampleCorner(0, height - 5);           // Bottom-left
  sampleCorner(width - 5, height - 5);   // Bottom-right

  // Find most common color in corners
  const colorCounts = new Map<string, { count: number; r: number; g: number; b: number }>();
  
  for (const sample of cornerSamples) {
    // Quantize to reduce noise
    const key = `${Math.round(sample.r / 10) * 10},${Math.round(sample.g / 10) * 10},${Math.round(sample.b / 10) * 10}`;
    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { count: 1, ...sample });
    }
  }

  // Find most common
  let maxCount = 0;
  let bgColor: { r: number; g: number; b: number } | null = null;
  
  for (const [, value] of colorCounts) {
    if (value.count > maxCount) {
      maxCount = value.count;
      bgColor = { r: value.r, g: value.g, b: value.b };
    }
  }

  // Only return if at least 60% of corners have same color
  if (maxCount >= cornerSamples.length * 0.6) {
    return bgColor;
  }
  
  return null;
}

async function fixSprite(imagePath: string, dryRun: boolean): Promise<FixResult> {
  const fileName = path.basename(imagePath);
  
  try {
    // Get metadata
    const metadata = await sharp(imagePath).metadata();
    
    // Skip if already RGBA with good transparency
    if (metadata.channels === 4) {
      // Check if it already has transparency
      const { data, info } = await sharp(imagePath).raw().toBuffer({ resolveWithObject: true });
      let transparentPixels = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) transparentPixels++;
      }
      const transparencyRatio = transparentPixels / (info.width * info.height);
      
      if (transparencyRatio > 0.05) {
        return {
          file: fileName,
          status: 'skipped',
          reason: `Already has ${(transparencyRatio * 100).toFixed(1)}% transparency`,
        };
      }
    }

    // Analyze corners to find background color
    const bgColor = await analyzeCorners(imagePath);
    
    if (!bgColor) {
      return {
        file: fileName,
        status: 'skipped',
        reason: 'Could not detect consistent background color',
      };
    }

    // Read the image
    const { data: rawData, info } = await sharp(imagePath)
      .ensureAlpha() // Add alpha channel if missing
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    const newData = Buffer.from(rawData);

    // Flood-fill from corners to remove background
    const visited = new Set<number>();
    const queue: Array<{ x: number; y: number }> = [];

    // Start from all 4 corners
    queue.push({ x: 0, y: 0 });
    queue.push({ x: width - 1, y: 0 });
    queue.push({ x: 0, y: height - 1 });
    queue.push({ x: width - 1, y: height - 1 });

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

      // Check if this pixel matches background color (with tolerance)
      if (colorDistance({ r, g, b }, bgColor) > COLOR_TOLERANCE + 10) {
        continue;
      }

      visited.add(key);

      // Make transparent
      newData[idx + 3] = 0;

      // Add neighbors
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

    if (transparencyRatio < 0.01) {
      return {
        file: fileName,
        status: 'skipped',
        reason: `Flood fill only removed ${(transparencyRatio * 100).toFixed(1)}% - background might be part of image`,
      };
    }

    if (dryRun) {
      return {
        file: fileName,
        status: 'fixed',
        reason: `Would remove background (${(transparencyRatio * 100).toFixed(1)}% transparent)`,
      };
    }

    // Backup original
    const backupPath = path.join(BACKUP_DIR, path.relative(CRYPTO_SPRITES_DIR, imagePath));
    await fs.promises.mkdir(path.dirname(backupPath), { recursive: true });
    await fs.promises.copyFile(imagePath, backupPath);

    // Save fixed sprite with optimization
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
    };

  } catch (error) {
    return {
      file: fileName,
      status: 'error',
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function getAllSprites(): Promise<string[]> {
  const sprites: string[] = [];
  
  const categories = await fs.promises.readdir(CRYPTO_SPRITES_DIR);
  
  for (const category of categories) {
    const categoryPath = path.join(CRYPTO_SPRITES_DIR, category);
    const stat = await fs.promises.stat(categoryPath);
    
    if (!stat.isDirectory()) continue;
    
    const files = await fs.promises.readdir(categoryPath);
    
    for (const file of files) {
      if (file.endsWith('.png')) {
        sprites.push(path.join(categoryPath, file));
      }
    }
  }
  
  return sprites;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const singleIdx = args.indexOf('--single');
  
  console.log('🎨 Sprite Transparency Fixer');
  console.log('============================');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  let sprites: string[];
  
  if (singleIdx >= 0 && args[singleIdx + 1]) {
    sprites = [args[singleIdx + 1]];
  } else {
    sprites = await getAllSprites();
  }

  console.log(`Found ${sprites.length} sprites to process\n`);

  const results: FixResult[] = [];
  let fixed = 0;
  let skipped = 0;
  let errors = 0;
  let totalSaved = 0;

  for (const sprite of sprites) {
    const result = await fixSprite(sprite, dryRun);
    results.push(result);
    
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

  console.log('\n============================');
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
