/**
 * Sprite Validator - Automated sprite quality checking
 * 
 * Validates pixel art sprites for:
 * - Correct dimensions
 * - Proper transparency (alpha channel)
 * - Color palette limits
 * - Background contamination
 */

// =============================================================================
// TYPES
// =============================================================================

export interface SpriteValidationResult {
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
  score: number; // 0-100 quality score
}

export interface ValidationOptions {
  /** Expected width (default: 512 for buildings, 128 for avatars) */
  expectedWidth?: number;
  /** Expected height (default: 512 for buildings, 192 for avatars) */
  expectedHeight?: number;
  /** Maximum allowed unique colors (default: 24) */
  maxColors?: number;
  /** Minimum transparency percentage for valid sprite (default: 5%) */
  minTransparencyPercent?: number;
  /** Strict mode - fail on warnings too */
  strict?: boolean;
}

export type SpriteType = 'building' | 'avatar' | 'tile' | 'unknown';

// =============================================================================
// CONSTANTS
// =============================================================================

export const BUILDING_DIMENSIONS = { width: 512, height: 512 };
export const AVATAR_DIMENSIONS = { width: 128, height: 192 };
export const TILE_DIMENSIONS = { width: 64, height: 64 };
// NOTE: AI-generated sprites often use more colors than traditional pixel art
// Using 64 as limit to accommodate Gemini/DALL-E generated sprites
export const MAX_PIXEL_ART_COLORS = 64;
export const MIN_TRANSPARENCY_PERCENT = 5;

// =============================================================================
// VALIDATION LOGIC (Browser-compatible)
// =============================================================================

/**
 * Detect sprite type from filename or dimensions
 */
export function detectSpriteType(filename: string, width?: number, height?: number): SpriteType {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('_south.png') || lowerName.includes('crypto')) {
    return 'building';
  }
  if (lowerName.includes('avatar') || lowerName.includes('spritesheet')) {
    return 'avatar';
  }
  if (width === 64 && height === 64) {
    return 'tile';
  }
  if (width === 512 && height === 512) {
    return 'building';
  }
  if (width === 128 && height === 192) {
    return 'avatar';
  }
  
  return 'unknown';
}

/**
 * Get expected dimensions for sprite type
 */
export function getExpectedDimensions(spriteType: SpriteType): { width: number; height: number } {
  switch (spriteType) {
    case 'building': return BUILDING_DIMENSIONS;
    case 'avatar': return AVATAR_DIMENSIONS;
    case 'tile': return TILE_DIMENSIONS;
    default: return { width: 512, height: 512 };
  }
}

/**
 * Analyze image data for transparency
 */
export function analyzeTransparency(
  imageData: Uint8ClampedArray,
  width: number,
  height: number
): SpriteValidationResult['transparency'] {
  const totalPixels = width * height;
  let transparentCount = 0;
  let hasAlpha = false;
  
  // Check all pixels for transparency
  for (let i = 0; i < imageData.length; i += 4) {
    const alpha = imageData[i + 3];
    if (alpha < 255) {
      hasAlpha = true;
      if (alpha === 0) {
        transparentCount++;
      }
    }
  }
  
  // Check corner pixels (should be transparent for buildings)
  const corners = [
    0, // top-left
    (width - 1) * 4, // top-right
    (height - 1) * width * 4, // bottom-left
    ((height - 1) * width + (width - 1)) * 4, // bottom-right
  ];
  
  let cornerTransparentCount = 0;
  for (const cornerIdx of corners) {
    if (imageData[cornerIdx + 3] === 0) {
      cornerTransparentCount++;
    }
  }
  
  const transparencyPercent = (transparentCount / totalPixels) * 100;
  
  return {
    hasAlpha,
    solidBackground: transparencyPercent < 1,
    cornerPixelsTransparent: cornerTransparentCount >= 3, // At least 3 corners should be transparent
    transparentPixelCount: transparentCount,
    totalPixels,
    transparencyPercent,
  };
}

/**
 * Analyze color palette from image data
 */
export function analyzeColors(
  imageData: Uint8ClampedArray,
  maxColors: number = MAX_PIXEL_ART_COLORS
): SpriteValidationResult['colorAnalysis'] {
  const colorSet = new Set<string>();
  const colorCounts = new Map<string, number>();
  
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];
    
    // Skip fully transparent pixels
    if (a === 0) continue;
    
    const colorKey = `${r},${g},${b}`;
    colorSet.add(colorKey);
    colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
  }
  
  // Get top 5 dominant colors
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => {
      const [r, g, b] = color.split(',').map(Number);
      return rgbToHex(r, g, b);
    });
  
  return {
    uniqueColors: colorSet.size,
    maxAllowed: maxColors,
    withinLimit: colorSet.size <= maxColors,
    dominantColors: sortedColors,
  };
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate a sprite from canvas ImageData (browser-compatible)
 */
export function validateFromImageData(
  imageData: ImageData,
  filename: string,
  options: ValidationOptions = {}
): SpriteValidationResult {
  const { width, height, data } = imageData;
  const spriteType = detectSpriteType(filename, width, height);
  const expected = getExpectedDimensions(spriteType);
  
  const {
    expectedWidth = expected.width,
    expectedHeight = expected.height,
    maxColors = MAX_PIXEL_ART_COLORS,
    minTransparencyPercent = MIN_TRANSPARENCY_PERCENT,
    strict = false,
  } = options;
  
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check dimensions
  const dimensionsCorrect = width === expectedWidth && height === expectedHeight;
  if (!dimensionsCorrect) {
    issues.push(`Dimensions ${width}x${height} don't match expected ${expectedWidth}x${expectedHeight}`);
  }
  
  // Analyze transparency
  const transparency = analyzeTransparency(data, width, height);
  
  if (!transparency.hasAlpha) {
    issues.push('Image has no alpha channel');
  }
  if (transparency.solidBackground) {
    issues.push('Solid background detected (less than 1% transparency)');
  }
  if (!transparency.cornerPixelsTransparent && spriteType === 'building') {
    warnings.push('Corner pixels are not transparent - may have background contamination');
  }
  if (transparency.transparencyPercent < minTransparencyPercent) {
    warnings.push(`Low transparency (${transparency.transparencyPercent.toFixed(1)}%) - building may have solid background`);
  }
  
  // Analyze colors
  const colorAnalysis = analyzeColors(data, maxColors);
  
  if (!colorAnalysis.withinLimit) {
    warnings.push(`Too many colors (${colorAnalysis.uniqueColors}) - pixel art typically uses ≤${maxColors}`);
  }
  
  // Calculate quality score
  let score = 100;
  score -= issues.length * 25;
  score -= warnings.length * 10;
  if (!transparency.cornerPixelsTransparent) score -= 15;
  if (colorAnalysis.uniqueColors > maxColors * 2) score -= 10;
  score = Math.max(0, Math.min(100, score));
  
  const valid = issues.length === 0 && (!strict || warnings.length === 0);
  
  return {
    valid,
    filePath: filename,
    dimensions: {
      width,
      height,
      expected: `${expectedWidth}x${expectedHeight}`,
      correct: dimensionsCorrect,
    },
    transparency,
    colorAnalysis,
    issues,
    warnings,
    score,
  };
}

/**
 * Generate a human-readable validation report
 */
export function formatValidationReport(result: SpriteValidationResult): string {
  const statusEmoji = result.valid ? '✅' : '❌';
  const scoreEmoji = result.score >= 80 ? '🟢' : result.score >= 50 ? '🟡' : '🔴';
  
  let report = `${statusEmoji} ${result.filePath}\n`;
  report += `   Score: ${scoreEmoji} ${result.score}/100\n`;
  report += `   Dimensions: ${result.dimensions.width}x${result.dimensions.height} (expected ${result.dimensions.expected}) ${result.dimensions.correct ? '✓' : '✗'}\n`;
  report += `   Transparency: ${result.transparency.transparencyPercent.toFixed(1)}% | Corners: ${result.transparency.cornerPixelsTransparent ? '✓' : '✗'}\n`;
  report += `   Colors: ${result.colorAnalysis.uniqueColors}/${result.colorAnalysis.maxAllowed} ${result.colorAnalysis.withinLimit ? '✓' : '✗'}\n`;
  
  if (result.issues.length > 0) {
    report += `   Issues:\n`;
    result.issues.forEach(issue => {
      report += `     ❌ ${issue}\n`;
    });
  }
  
  if (result.warnings.length > 0) {
    report += `   Warnings:\n`;
    result.warnings.forEach(warning => {
      report += `     ⚠️ ${warning}\n`;
    });
  }
  
  return report;
}

const SpriteValidator = {
  validateFromImageData,
  analyzeTransparency,
  analyzeColors,
  detectSpriteType,
  getExpectedDimensions,
  formatValidationReport,
  BUILDING_DIMENSIONS,
  AVATAR_DIMENSIONS,
  MAX_PIXEL_ART_COLORS,
};

export default SpriteValidator;
