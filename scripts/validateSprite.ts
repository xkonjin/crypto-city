#!/usr/bin/env node
/**
 * Sprite Validator CLI - Validate individual or batch sprites
 * 
 * Usage:
 *   npx ts-node scripts/validateSprite.ts <path>
 *   npx ts-node scripts/validateSprite.ts public/Building/crypto/defi/
 *   npx ts-node scripts/validateSprite.ts --all
 *   npx ts-node scripts/validateSprite.ts --report
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// =============================================================================
// TYPES (duplicated for Node.js script - can't import browser code)
// =============================================================================

interface SpriteValidationResult {
  valid: boolean;
  filePath: string;
  dimensions: {
    width: number;
    height: number;
    expected: string;
    correct: boolean;
  };
  transparency: {
    hasAlpha: boolean;
    solidBackground: boolean;
    cornerPixelsTransparent: boolean;
    transparentPixelCount: number;
    totalPixels: number;
    transparencyPercent: number;
  };
  colorAnalysis: {
    uniqueColors: number;
    maxAllowed: number;
    withinLimit: boolean;
    dominantColors: string[];
  };
  issues: string[];
  warnings: string[];
  score: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CRYPTO_SPRITES_DIR = path.join(PROJECT_ROOT, 'public/Building/crypto');
const BUILDING_SIZE = { width: 512, height: 512 };
const MAX_COLORS = 24;
const MIN_TRANSPARENCY = 5;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

async function validateSprite(filePath: string): Promise<SpriteValidationResult> {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Read image with sharp
    const image = sharp(filePath);
    const metadata = await image.metadata();
    const { width = 0, height = 0, channels = 0 } = metadata;
    
    // Get raw pixel data
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Check dimensions
    const filename = path.basename(filePath);
    const footprintMatch = filename.match(/^(\d+)x(\d+)/);
    let expectedWidth = BUILDING_SIZE.width;
    let expectedHeight = BUILDING_SIZE.height;
    
    // For crypto buildings, we expect 512x512
    const dimensionsCorrect = width === expectedWidth && height === expectedHeight;
    if (!dimensionsCorrect) {
      issues.push(`Dimensions ${width}x${height} don't match expected ${expectedWidth}x${expectedHeight}`);
    }
    
    // Analyze transparency
    const totalPixels = width * height;
    let transparentCount = 0;
    let hasAlpha = channels === 4 || info.channels === 4;
    
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) {
        transparentCount++;
      }
    }
    
    // Check corners
    const getPixelAlpha = (x: number, y: number) => data[(y * width + x) * 4 + 3];
    const corners = [
      getPixelAlpha(0, 0),
      getPixelAlpha(width - 1, 0),
      getPixelAlpha(0, height - 1),
      getPixelAlpha(width - 1, height - 1),
    ];
    const cornerTransparentCount = corners.filter(a => a === 0).length;
    const cornerPixelsTransparent = cornerTransparentCount >= 3;
    
    const transparencyPercent = (transparentCount / totalPixels) * 100;
    const solidBackground = transparencyPercent < 1;
    
    if (solidBackground) {
      issues.push('Solid background detected (less than 1% transparency)');
    }
    if (!cornerPixelsTransparent) {
      warnings.push('Corner pixels are not transparent - may have background contamination');
    }
    if (transparencyPercent < MIN_TRANSPARENCY) {
      warnings.push(`Low transparency (${transparencyPercent.toFixed(1)}%)`);
    }
    
    // Analyze colors
    const colorSet = new Set<string>();
    const colorCounts = new Map<string, number>();
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a === 0) continue;
      
      const colorKey = `${r},${g},${b}`;
      colorSet.add(colorKey);
      colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
    }
    
    const uniqueColors = colorSet.size;
    const withinLimit = uniqueColors <= MAX_COLORS;
    
    if (!withinLimit) {
      warnings.push(`Too many colors (${uniqueColors}) - pixel art typically uses ≤${MAX_COLORS}`);
    }
    
    // Get dominant colors
    const dominantColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => {
        const [r, g, b] = color.split(',').map(Number);
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
      });
    
    // Calculate score
    let score = 100;
    score -= issues.length * 25;
    score -= warnings.length * 10;
    if (!cornerPixelsTransparent) score -= 15;
    if (uniqueColors > MAX_COLORS * 2) score -= 10;
    score = Math.max(0, Math.min(100, score));
    
    return {
      valid: issues.length === 0,
      filePath,
      dimensions: {
        width,
        height,
        expected: `${expectedWidth}x${expectedHeight}`,
        correct: dimensionsCorrect,
      },
      transparency: {
        hasAlpha,
        solidBackground,
        cornerPixelsTransparent,
        transparentPixelCount: transparentCount,
        totalPixels,
        transparencyPercent,
      },
      colorAnalysis: {
        uniqueColors,
        maxAllowed: MAX_COLORS,
        withinLimit,
        dominantColors,
      },
      issues,
      warnings,
      score,
    };
  } catch (error) {
    return {
      valid: false,
      filePath,
      dimensions: { width: 0, height: 0, expected: '512x512', correct: false },
      transparency: {
        hasAlpha: false,
        solidBackground: true,
        cornerPixelsTransparent: false,
        transparentPixelCount: 0,
        totalPixels: 0,
        transparencyPercent: 0,
      },
      colorAnalysis: {
        uniqueColors: 0,
        maxAllowed: MAX_COLORS,
        withinLimit: true,
        dominantColors: [],
      },
      issues: [`Failed to read image: ${error}`],
      warnings: [],
      score: 0,
    };
  }
}

function formatResult(result: SpriteValidationResult): string {
  const statusEmoji = result.valid ? '✅' : '❌';
  const scoreEmoji = result.score >= 80 ? '🟢' : result.score >= 50 ? '🟡' : '🔴';
  const relativePath = result.filePath.replace(PROJECT_ROOT + '/', '');
  
  let output = `${statusEmoji} ${relativePath}\n`;
  output += `   Score: ${scoreEmoji} ${result.score}/100\n`;
  output += `   Size: ${result.dimensions.width}x${result.dimensions.height} ${result.dimensions.correct ? '✓' : '✗'}\n`;
  output += `   Transparency: ${result.transparency.transparencyPercent.toFixed(1)}% | Corners: ${result.transparency.cornerPixelsTransparent ? '✓' : '✗'}\n`;
  output += `   Colors: ${result.colorAnalysis.uniqueColors}/${result.colorAnalysis.maxAllowed} ${result.colorAnalysis.withinLimit ? '✓' : '✗'}\n`;
  
  if (result.colorAnalysis.dominantColors.length > 0) {
    output += `   Dominant: ${result.colorAnalysis.dominantColors.join(', ')}\n`;
  }
  
  if (result.issues.length > 0) {
    result.issues.forEach(issue => {
      output += `   ❌ ${issue}\n`;
    });
  }
  
  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => {
      output += `   ⚠️ ${warning}\n`;
    });
  }
  
  return output;
}

async function findAllSprites(dir: string): Promise<string[]> {
  const sprites: string[] = [];
  
  if (!fs.existsSync(dir)) return sprites;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sprites.push(...await findAllSprites(fullPath));
    } else if (entry.name.endsWith('.png')) {
      sprites.push(fullPath);
    }
  }
  
  return sprites;
}

async function generateHTMLReport(results: SpriteValidationResult[]): Promise<string> {
  const passed = results.filter(r => r.valid).length;
  const failed = results.length - passed;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>Sprite Validation Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #eee; }
    h1 { color: #4ade80; }
    .summary { display: flex; gap: 20px; margin-bottom: 30px; }
    .stat { background: #16213e; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; }
    .stat-label { color: #888; }
    .passed { color: #4ade80; }
    .failed { color: #f87171; }
    .warning { color: #fbbf24; }
    .sprite-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
    .sprite-card { background: #16213e; border-radius: 8px; padding: 15px; }
    .sprite-card.invalid { border-left: 4px solid #f87171; }
    .sprite-card.valid { border-left: 4px solid #4ade80; }
    .sprite-name { font-weight: bold; margin-bottom: 10px; word-break: break-all; }
    .sprite-meta { font-size: 0.9em; color: #888; }
    .score { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; }
    .score-high { background: #166534; }
    .score-mid { background: #854d0e; }
    .score-low { background: #991b1b; }
    .colors { display: flex; gap: 5px; margin-top: 10px; }
    .color-swatch { width: 20px; height: 20px; border-radius: 4px; border: 1px solid #333; }
    .issue { color: #f87171; font-size: 0.85em; margin-top: 5px; }
    .warning-text { color: #fbbf24; font-size: 0.85em; margin-top: 5px; }
  </style>
</head>
<body>
  <h1>🎨 Sprite Validation Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  
  <div class="summary">
    <div class="stat">
      <div class="stat-value">${results.length}</div>
      <div class="stat-label">Total Sprites</div>
    </div>
    <div class="stat">
      <div class="stat-value passed">${passed}</div>
      <div class="stat-label">Passed</div>
    </div>
    <div class="stat">
      <div class="stat-value failed">${failed}</div>
      <div class="stat-label">Failed</div>
    </div>
    <div class="stat">
      <div class="stat-value">${avgScore.toFixed(0)}</div>
      <div class="stat-label">Avg Score</div>
    </div>
  </div>
  
  <h2>Sprites</h2>
  <div class="sprite-grid">`;
  
  // Sort: invalid first, then by score
  const sorted = [...results].sort((a, b) => {
    if (a.valid !== b.valid) return a.valid ? 1 : -1;
    return a.score - b.score;
  });
  
  for (const result of sorted) {
    const relativePath = result.filePath.replace(PROJECT_ROOT + '/', '');
    const scoreClass = result.score >= 80 ? 'score-high' : result.score >= 50 ? 'score-mid' : 'score-low';
    
    html += `
    <div class="sprite-card ${result.valid ? 'valid' : 'invalid'}">
      <div class="sprite-name">${path.basename(relativePath)}</div>
      <div class="sprite-meta">
        <span class="score ${scoreClass}">${result.score}/100</span>
        ${result.dimensions.width}x${result.dimensions.height}
        | ${result.colorAnalysis.uniqueColors} colors
        | ${result.transparency.transparencyPercent.toFixed(0)}% transparent
      </div>
      <div class="colors">
        ${result.colorAnalysis.dominantColors.map(c => `<div class="color-swatch" style="background:${c}" title="${c}"></div>`).join('')}
      </div>
      ${result.issues.map(i => `<div class="issue">❌ ${i}</div>`).join('')}
      ${result.warnings.map(w => `<div class="warning-text">⚠️ ${w}</div>`).join('')}
    </div>`;
  }
  
  html += `
  </div>
</body>
</html>`;
  
  return html;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npx ts-node scripts/validateSprite.ts <path>     Validate single file or directory');
    console.log('  npx ts-node scripts/validateSprite.ts --all      Validate all crypto sprites');
    console.log('  npx ts-node scripts/validateSprite.ts --report   Generate HTML report');
    process.exit(0);
  }
  
  const generateReport = args.includes('--report');
  const validateAll = args.includes('--all') || generateReport;
  
  let spritePaths: string[] = [];
  
  if (validateAll) {
    console.log('🔍 Finding all crypto sprites...');
    spritePaths = await findAllSprites(CRYPTO_SPRITES_DIR);
    console.log(`Found ${spritePaths.length} sprites\n`);
  } else {
    const targetPath = path.resolve(args[0]);
    
    if (!fs.existsSync(targetPath)) {
      console.error(`❌ Path not found: ${targetPath}`);
      process.exit(1);
    }
    
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      spritePaths = await findAllSprites(targetPath);
    } else {
      spritePaths = [targetPath];
    }
  }
  
  if (spritePaths.length === 0) {
    console.log('No sprites found to validate.');
    process.exit(0);
  }
  
  console.log(`Validating ${spritePaths.length} sprites...\n`);
  
  const results: SpriteValidationResult[] = [];
  let passed = 0;
  let failed = 0;
  
  for (const spritePath of spritePaths) {
    const result = await validateSprite(spritePath);
    results.push(result);
    
    if (result.valid) {
      passed++;
    } else {
      failed++;
    }
    
    if (!generateReport) {
      console.log(formatResult(result));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed out of ${spritePaths.length} sprites`);
  
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  console.log(`📈 Average score: ${avgScore.toFixed(1)}/100`);
  
  // Count common issues
  const issueCount = new Map<string, number>();
  for (const result of results) {
    for (const issue of result.issues) {
      const key = issue.split(':')[0].split('(')[0].trim();
      issueCount.set(key, (issueCount.get(key) || 0) + 1);
    }
  }
  
  if (issueCount.size > 0) {
    console.log('\n📋 Common issues:');
    for (const [issue, count] of Array.from(issueCount.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${count}x ${issue}`);
    }
  }
  
  // Generate HTML report if requested
  if (generateReport) {
    const html = await generateHTMLReport(results);
    const reportPath = path.join(PROJECT_ROOT, 'sprite-validation-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`\n📄 HTML report saved to: ${reportPath}`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
