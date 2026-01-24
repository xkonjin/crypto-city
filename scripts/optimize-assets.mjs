#!/usr/bin/env node

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const IMAGE_QUALITY = 80;
const DIRECTORIES_TO_OPTIMIZE = [
  'public/Building',
  'public/Props',
  'public/Characters',
];

async function findPNGFiles(dir) {
  const files = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await findPNGFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message);
  }
  
  return files;
}

async function convertToWebP(pngPath) {
  const webpPath = pngPath.replace(/\.png$/i, '.webp');
  
  // Check if WebP already exists and is newer
  try {
    const [pngStat, webpStat] = await Promise.all([
      fs.stat(pngPath),
      fs.stat(webpPath).catch(() => null)
    ]);
    
    if (webpStat && webpStat.mtime > pngStat.mtime) {
      console.log(`⏭️  Skipping ${path.basename(pngPath)} (WebP is up to date)`);
      return { skipped: true };
    }
  } catch (error) {
    // Continue with conversion
  }
  
  try {
    const startSize = (await fs.stat(pngPath)).size;
    
    await sharp(pngPath)
      .webp({ quality: IMAGE_QUALITY })
      .toFile(webpPath);
    
    const endSize = (await fs.stat(webpPath)).size;
    const savings = ((1 - endSize / startSize) * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(pngPath)} → ${path.basename(webpPath)} (${savings}% smaller)`);
    
    return { 
      original: startSize, 
      optimized: endSize, 
      savings: startSize - endSize 
    };
  } catch (error) {
    console.error(`❌ Failed to convert ${pngPath}:`, error.message);
    return { error: true };
  }
}

async function optimizeAssets() {
  console.log('🚀 Starting asset optimization...\n');
  
  let totalOriginal = 0;
  let totalOptimized = 0;
  let filesProcessed = 0;
  let filesSkipped = 0;
  let errors = 0;
  
  for (const dir of DIRECTORIES_TO_OPTIMIZE) {
    const fullDir = path.join(projectRoot, dir);
    console.log(`📁 Processing ${dir}...`);
    
    const pngFiles = await findPNGFiles(fullDir);
    
    if (pngFiles.length === 0) {
      console.log(`   No PNG files found in ${dir}\n`);
      continue;
    }
    
    console.log(`   Found ${pngFiles.length} PNG files\n`);
    
    for (const pngFile of pngFiles) {
      const result = await convertToWebP(pngFile);
      
      if (result.skipped) {
        filesSkipped++;
      } else if (result.error) {
        errors++;
      } else {
        totalOriginal += result.original;
        totalOptimized += result.optimized;
        filesProcessed++;
      }
    }
    
    console.log('');
  }
  
  console.log('📊 Optimization Summary:');
  console.log(`   Files processed: ${filesProcessed}`);
  console.log(`   Files skipped: ${filesSkipped}`);
  console.log(`   Errors: ${errors}`);
  
  if (filesProcessed > 0) {
    const totalSavings = totalOriginal - totalOptimized;
    const percentSavings = ((totalSavings / totalOriginal) * 100).toFixed(1);
    
    console.log(`   Original size: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Optimized size: ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Total savings: ${(totalSavings / 1024 / 1024).toFixed(2)} MB (${percentSavings}%)`);
  }
  
  console.log('\n✨ Asset optimization complete!');
}

optimizeAssets().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
