// ============================================================================
// PLACEHOLDER BUILDING COLORS & CRYPTO SPRITE RENDERING
// ============================================================================
// Colors for rendering buildings before sprites are loaded
// Based on zone/category for visual consistency
// Also handles loading and rendering crypto building sprites

import { getCryptoBuilding } from '@/games/isocity/crypto/buildings';
import type { CryptoCategory, CryptoBuildingDefinition } from '@/games/isocity/crypto/types';

// Cache for loaded and processed crypto building sprites (with transparent backgrounds)
const cryptoSpriteCache = new Map<string, HTMLCanvasElement>();
const loadingSprites = new Set<string>();

// Background colors to make transparent (common AI-generated image backgrounds)
const BACKGROUND_COLORS = [
  // White/light backgrounds
  { r: 255, g: 255, b: 255 }, // Pure white
  { r: 254, g: 254, b: 254 }, // Near-white
  { r: 250, g: 250, b: 250 }, // Light gray
  { r: 245, g: 245, b: 245 }, // Lighter gray
  { r: 240, g: 240, b: 240 }, // Gray
  // Black/dark backgrounds
  { r: 0, g: 0, b: 0 },       // Pure black
  { r: 1, g: 1, b: 1 },       // Near-black
  { r: 5, g: 5, b: 5 },       // Very dark
  { r: 10, g: 10, b: 10 },    // Dark
  { r: 15, g: 15, b: 15 },    // Dark gray
  { r: 20, g: 20, b: 20 },    // Dark gray
  { r: 25, g: 25, b: 25 },    // Dark gray
  // Checkered pattern colors (common in AI transparency simulation)
  { r: 204, g: 204, b: 204 }, // Light checker
  { r: 153, g: 153, b: 153 }, // Dark checker
  { r: 191, g: 191, b: 191 }, // Mid checker
  // Gray ground plane colors
  { r: 128, g: 128, b: 128 }, // Mid gray
  { r: 192, g: 192, b: 192 }, // Light gray
  { r: 169, g: 169, b: 169 }, // Dark gray
];
const COLOR_THRESHOLD = 35; // Distance threshold for background detection

/**
 * Remove background from sprite image using flood fill from corners
 * This is more accurate than simple color matching
 */
function removeBackground(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // Get pixel index
  const getPixelIndex = (x: number, y: number) => (y * width + x) * 4;
  
  // Check if a color matches any known background color
  const isBackgroundColor = (r: number, g: number, b: number): boolean => {
    for (const bg of BACKGROUND_COLORS) {
      const dist = Math.sqrt(
        Math.pow(r - bg.r, 2) +
        Math.pow(g - bg.g, 2) +
        Math.pow(b - bg.b, 2)
      );
      if (dist <= COLOR_THRESHOLD) {
        return true;
      }
    }
    return false;
  };
  
  // Sample multiple points along edges to detect background
  const edgeSamples: number[] = [];
  // Top edge
  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
    edgeSamples.push(getPixelIndex(x, 0));
  }
  // Bottom edge
  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 20))) {
    edgeSamples.push(getPixelIndex(x, height - 1));
  }
  // Left edge
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
    edgeSamples.push(getPixelIndex(0, y));
  }
  // Right edge
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 20))) {
    edgeSamples.push(getPixelIndex(width - 1, y));
  }
  
  // Collect unique background colors from edges
  const detectedBgColors: Array<{r: number, g: number, b: number}> = [];
  for (const idx of edgeSamples) {
    if (idx >= 0 && idx < data.length - 3) {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Check if this color is close to a known background
      if (isBackgroundColor(r, g, b)) {
        // Add if not already in list (with tolerance)
        const exists = detectedBgColors.some(bg => 
          Math.abs(bg.r - r) < 10 && Math.abs(bg.g - g) < 10 && Math.abs(bg.b - b) < 10
        );
        if (!exists) {
          detectedBgColors.push({ r, g, b });
        }
      }
    }
  }
  
  // Also add the corner colors as potential backgrounds
  const corners = [
    getPixelIndex(0, 0),
    getPixelIndex(width - 1, 0),
    getPixelIndex(0, height - 1),
    getPixelIndex(width - 1, height - 1),
  ];
  for (const idx of corners) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const exists = detectedBgColors.some(bg => 
      Math.abs(bg.r - r) < 15 && Math.abs(bg.g - g) < 15 && Math.abs(bg.b - b) < 15
    );
    if (!exists) {
      detectedBgColors.push({ r, g, b });
    }
  }
  
  // Make pixels matching detected backgrounds transparent
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Check against detected background colors
    let isBackground = false;
    for (const bg of detectedBgColors) {
      const dist = Math.sqrt(
        Math.pow(r - bg.r, 2) +
        Math.pow(g - bg.g, 2) +
        Math.pow(b - bg.b, 2)
      );
      if (dist <= COLOR_THRESHOLD) {
        isBackground = true;
        break;
      }
    }
    
    // Also check known background colors
    if (!isBackground) {
      isBackground = isBackgroundColor(r, g, b);
    }
    
    if (isBackground) {
      data[i + 3] = 0; // Make transparent
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Load a crypto building sprite image and remove its background
 */
export function loadCryptoBuildingSprite(building: CryptoBuildingDefinition): void {
  if (building.isProcedural || !building.sprites?.south) return;
  
  const spritePath = building.sprites.south;
  if (cryptoSpriteCache.has(spritePath) || loadingSprites.has(spritePath)) return;
  
  loadingSprites.add(spritePath);
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // Process the image to remove background
    const processedCanvas = removeBackground(img);
    cryptoSpriteCache.set(spritePath, processedCanvas);
    loadingSprites.delete(spritePath);
  };
  img.onerror = () => {
    console.warn(`Failed to load crypto sprite: ${spritePath}`);
    loadingSprites.delete(spritePath);
  };
  img.src = spritePath;
}

/**
 * Get a loaded crypto building sprite (as canvas with transparent background)
 */
export function getCryptoBuildingSprite(building: CryptoBuildingDefinition): HTMLCanvasElement | null {
  if (building.isProcedural || !building.sprites?.south) return null;
  return cryptoSpriteCache.get(building.sprites.south) || null;
}

export interface PlaceholderColor {
  top: string;
  left: string;
  right: string;
  height: number;
}

export const CRYPTO_CATEGORY_COLORS: Record<CryptoCategory, PlaceholderColor> = {
  defi: { top: '#3b82f6', left: '#2563eb', right: '#60a5fa', height: 1.2 },
  exchange: { top: '#22c55e', left: '#16a34a', right: '#4ade80', height: 1.4 },
  chain: { top: '#a855f7', left: '#9333ea', right: '#c084fc', height: 1.3 },
  ct: { top: '#06b6d4', left: '#0891b2', right: '#22d3ee', height: 0.9 },
  meme: { top: '#f59e0b', left: '#d97706', right: '#fbbf24', height: 0.8 },
  plasma: { top: '#ec4899', left: '#db2777', right: '#f472b6', height: 1.5 },
  stablecoin: { top: '#10b981', left: '#059669', right: '#34d399', height: 1.1 },
  infrastructure: { top: '#6366f1', left: '#4f46e5', right: '#818cf8', height: 1.2 },
};

export const PLACEHOLDER_COLORS: Record<string, PlaceholderColor> = {
  // Residential - greens
  house_small: { top: '#4ade80', left: '#22c55e', right: '#86efac', height: 0.6 },
  house_medium: { top: '#4ade80', left: '#22c55e', right: '#86efac', height: 0.8 },
  mansion: { top: '#22c55e', left: '#16a34a', right: '#4ade80', height: 1.0 },
  apartment_low: { top: '#22c55e', left: '#16a34a', right: '#4ade80', height: 1.2 },
  apartment_high: { top: '#16a34a', left: '#15803d', right: '#22c55e', height: 1.8 },
  // Commercial - blues
  shop_small: { top: '#60a5fa', left: '#3b82f6', right: '#93c5fd', height: 0.5 },
  shop_medium: { top: '#60a5fa', left: '#3b82f6', right: '#93c5fd', height: 0.7 },
  office_low: { top: '#3b82f6', left: '#2563eb', right: '#60a5fa', height: 1.3 },
  office_high: { top: '#2563eb', left: '#1d4ed8', right: '#3b82f6', height: 2.0 },
  mall: { top: '#1d4ed8', left: '#1e40af', right: '#2563eb', height: 1.0 },
  // Industrial - oranges/ambers
  factory_small: { top: '#fbbf24', left: '#f59e0b', right: '#fcd34d', height: 0.6 },
  factory_medium: { top: '#f59e0b', left: '#d97706', right: '#fbbf24', height: 0.9 },
  factory_large: { top: '#d97706', left: '#b45309', right: '#f59e0b', height: 1.2 },
  warehouse: { top: '#fbbf24', left: '#f59e0b', right: '#fcd34d', height: 0.7 },
  // Services - purples/pinks
  police_station: { top: '#818cf8', left: '#6366f1', right: '#a5b4fc', height: 0.8 },
  fire_station: { top: '#f87171', left: '#ef4444', right: '#fca5a5', height: 0.8 },
  hospital: { top: '#f472b6', left: '#ec4899', right: '#f9a8d4', height: 1.2 },
  school: { top: '#c084fc', left: '#a855f7', right: '#d8b4fe', height: 0.8 },
  university: { top: '#a855f7', left: '#9333ea', right: '#c084fc', height: 1.0 },
  // Parks - teals
  park: { top: '#2dd4bf', left: '#14b8a6', right: '#5eead4', height: 0.2 },
  park_large: { top: '#14b8a6', left: '#0d9488', right: '#2dd4bf', height: 0.3 },
  tennis: { top: '#5eead4', left: '#2dd4bf', right: '#99f6e4', height: 0.2 },
  tree: { top: '#22c55e', left: '#16a34a', right: '#4ade80', height: 0.5 },
  // Utilities - grays
  power_plant: { top: '#9ca3af', left: '#6b7280', right: '#d1d5db', height: 1.0 },
  water_tower: { top: '#60a5fa', left: '#3b82f6', right: '#93c5fd', height: 1.4 },
  subway_station: { top: '#6b7280', left: '#4b5563', right: '#9ca3af', height: 0.5 },
  // Special - golds
  stadium: { top: '#fbbf24', left: '#f59e0b', right: '#fcd34d', height: 0.8 },
  museum: { top: '#e879f9', left: '#d946ef', right: '#f0abfc', height: 0.9 },
  airport: { top: '#9ca3af', left: '#6b7280', right: '#d1d5db', height: 0.4 },
  space_program: { top: '#f1f5f9', left: '#e2e8f0', right: '#f8fafc', height: 1.5 },
  city_hall: { top: '#fbbf24', left: '#f59e0b', right: '#fcd34d', height: 1.2 },
  amusement_park: { top: '#fb7185', left: '#f43f5e', right: '#fda4af', height: 0.8 },
  // Default for unknown/park buildings
  default: { top: '#9ca3af', left: '#6b7280', right: '#d1d5db', height: 0.6 },
};

export function drawPlaceholderBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  buildingType: string,
  tileWidth: number,
  tileHeight: number
): void {
  let colors = PLACEHOLDER_COLORS[buildingType];
  
  // Check if this is a crypto building with a sprite
  const cryptoBuilding = getCryptoBuilding(buildingType);
  if (cryptoBuilding) {
    // Try to load and draw the sprite if available
    if (!cryptoBuilding.isProcedural && cryptoBuilding.sprites?.south) {
      loadCryptoBuildingSprite(cryptoBuilding);
      const sprite = getCryptoBuildingSprite(cryptoBuilding);
      if (sprite) {
        // Calculate dimensions based on footprint
        const footprintW = cryptoBuilding.footprint.width;
        const footprintH = cryptoBuilding.footprint.height;
        
        // Scale sprite to fit the tile footprint
        const spriteAspect = sprite.width / sprite.height;
        const targetWidth = tileWidth * Math.max(footprintW, footprintH);
        const targetHeight = targetWidth / spriteAspect;
        
        // Center the sprite on the tile
        const drawX = x + (tileWidth * footprintW - targetWidth) / 2;
        const drawY = y + tileHeight - targetHeight + (tileHeight * footprintH) / 2;
        
        ctx.drawImage(sprite, drawX, drawY, targetWidth, targetHeight);
        return;
      }
    }
    // Fall back to category colors for procedural or unloaded sprites
    colors = CRYPTO_CATEGORY_COLORS[cryptoBuilding.category];
  }
  
  colors = colors || PLACEHOLDER_COLORS.default;
  const boxHeight = tileHeight * colors.height;
  
  const w = tileWidth;
  const h = tileHeight;
  const cx = x + w / 2;
  const topY = y - boxHeight;
  
  // Draw left face (darker)
  ctx.fillStyle = colors.left;
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(cx, y + h);
  ctx.lineTo(cx, topY + h);
  ctx.lineTo(x, topY + h / 2);
  ctx.closePath();
  ctx.fill();
  
  // Draw right face (lighter)
  ctx.fillStyle = colors.right;
  ctx.beginPath();
  ctx.moveTo(x + w, y + h / 2);
  ctx.lineTo(cx, y + h);
  ctx.lineTo(cx, topY + h);
  ctx.lineTo(x + w, topY + h / 2);
  ctx.closePath();
  ctx.fill();
  
  // Draw top face
  ctx.fillStyle = colors.top;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(x + w, topY + h / 2);
  ctx.lineTo(cx, topY + h);
  ctx.lineTo(x, topY + h / 2);
  ctx.closePath();
  ctx.fill();
  
  // Add subtle edge lines
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(x + w, topY + h / 2);
  ctx.lineTo(cx, topY + h);
  ctx.lineTo(x, topY + h / 2);
  ctx.closePath();
  ctx.stroke();
}
