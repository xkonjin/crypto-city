// Procedural Building Generator for Plasma-style isometric buildings
// Generates clean vector-style buildings as Canvas textures

import { TILE_WIDTH, TILE_HEIGHT } from '../types';
import { ColorPalette, getPalette, PLASMA_COLORS, varyPalette, BUILDING_PALETTES } from './ColorPalette';
import { CRYPTO_BUILDING_PALETTES, getCryptoPalette } from './CryptoPalettes';

// Building style types - includes crypto-specific styles
export type BuildingStyle = 
  | 'modern' 
  | 'residential' 
  | 'commercial' 
  | 'landmark' 
  | 'civic'
  // Crypto-specific styles
  | 'defi'        // DeFi protocol buildings - techy, fintech aesthetic
  | 'exchange'    // Exchange buildings - corporate, trading floor style
  | 'chain'       // Blockchain HQs - tech campus, branded
  | 'ct'          // CT culture buildings - podcast studio, loft style
  | 'meme';       // Meme props - whimsical, colorful

// Feature types that can be added to buildings
export type FeatureType = 'window' | 'door' | 'balcony' | 'sign' | 'awning' | 'roofDetail' | 'pillar' | 'antenna';

export interface BuildingFeature {
  type: FeatureType;
  floor?: number;      // Which floor (0-indexed from bottom)
  position?: number;   // Horizontal position (0-1)
  size?: number;       // Relative size
  color?: string;      // Override color
}

export interface ProceduralBuildingConfig {
  id: string;
  name: string;
  floors: number;              // Number of stories (1-20)
  footprint: { width: number; height: number };  // Grid cells
  style: BuildingStyle;
  palette?: string;            // Palette name or use style default
  features?: BuildingFeature[];
  roofStyle?: 'flat' | 'peaked' | 'dome' | 'terrace';
  hasChimney?: boolean;
  hasAntenna?: boolean;
  windowDensity?: number;      // 0-1, how many windows per floor
  groundFloorRetail?: boolean; // Larger ground floor with awning
}

// Isometric projection constants
const ISO_ANGLE = Math.atan(0.5); // ~26.57 degrees
const FLOOR_HEIGHT_PX = 24;      // Pixels per floor
const CELL_WIDTH_PX = TILE_WIDTH;  // 44px per grid cell
const CELL_HEIGHT_PX = TILE_HEIGHT; // 22px per grid cell (isometric)

export class BuildingGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  /**
   * Generate a building texture as a data URL
   */
  generate(config: ProceduralBuildingConfig): string {
    const { floors, footprint, style, roofStyle = 'flat' } = config;
    
    // Calculate canvas dimensions
    // Width: footprint width + height in isometric projection
    const baseWidth = (footprint.width + footprint.height) * (CELL_WIDTH_PX / 2);
    // Height: building height + isometric base depth
    const buildingHeight = floors * FLOOR_HEIGHT_PX;
    const baseDepth = footprint.height * (CELL_HEIGHT_PX / 2);
    const roofExtra = roofStyle === 'peaked' ? FLOOR_HEIGHT_PX : (roofStyle === 'dome' ? FLOOR_HEIGHT_PX * 0.7 : 0);
    
    // Standard 512x512 canvas with building centered at bottom
    this.canvas.width = 512;
    this.canvas.height = 512;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, 512, 512);
    
    // Get palette - check both standard and crypto palettes
    const paletteName = config.palette || this.getDefaultPalette(style);
    const palette = varyPalette(this.getPaletteByName(paletteName), 0.02);
    
    // Calculate building position (bottom-center anchor at 256, 512)
    const buildingBaseX = 256;
    const buildingBaseY = 512;
    
    // Draw the building
    this.drawBuilding(config, palette, buildingBaseX, buildingBaseY);
    
    return this.canvas.toDataURL('image/png');
  }
  
  /**
   * Generate a building and return as ImageData for Phaser texture creation
   */
  generateImageData(config: ProceduralBuildingConfig): ImageData {
    this.generate(config);
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Generate and return the canvas directly for Phaser
   */
  generateCanvas(config: ProceduralBuildingConfig): HTMLCanvasElement {
    this.generate(config);
    // Clone the canvas to return
    const clone = document.createElement('canvas');
    clone.width = this.canvas.width;
    clone.height = this.canvas.height;
    const cloneCtx = clone.getContext('2d')!;
    cloneCtx.drawImage(this.canvas, 0, 0);
    return clone;
  }
  
  private getDefaultPalette(style: BuildingStyle): string {
    // Default palettes for each building style
    // Crypto styles map to crypto palettes
    const defaults: Record<BuildingStyle, string> = {
      modern: 'modern',
      residential: 'residential',
      commercial: 'commercial',
      landmark: 'landmark',
      civic: 'civic',
      // Crypto style defaults
      defi: 'ethereum',
      exchange: 'coinbase',
      chain: 'ethereum',
      ct: 'ctInfluencer',
      meme: 'pepe',
    };
    return defaults[style];
  }
  
  /**
   * Get a palette by name, checking both standard and crypto palettes
   */
  private getPaletteByName(name: string): ColorPalette {
    // First check standard palettes
    if (BUILDING_PALETTES[name]) {
      return BUILDING_PALETTES[name];
    }
    // Then check crypto palettes
    if (CRYPTO_BUILDING_PALETTES[name]) {
      return CRYPTO_BUILDING_PALETTES[name];
    }
    // Fallback to modern
    return BUILDING_PALETTES.modern;
  }
  
  private drawBuilding(
    config: ProceduralBuildingConfig,
    palette: ColorPalette,
    baseX: number,
    baseY: number
  ): void {
    const { floors, footprint, roofStyle = 'flat', features = [] } = config;
    
    const buildingWidth = footprint.width * (CELL_WIDTH_PX / 2);
    const buildingDepth = footprint.height * (CELL_WIDTH_PX / 2);
    const buildingHeight = floors * FLOOR_HEIGHT_PX;
    
    // Isometric offsets
    const isoLeft = -buildingWidth;
    const isoRight = buildingDepth;
    const isoTopOffset = buildingHeight;
    
    // Draw main building body (3D box)
    this.drawIsometricBox(
      baseX,
      baseY,
      footprint.width,
      footprint.height,
      floors,
      palette
    );
    
    // Draw windows
    const windowDensity = config.windowDensity ?? 0.7;
    if (windowDensity > 0) {
      this.drawWindows(config, palette, baseX, baseY);
    }
    
    // Draw ground floor retail if specified
    if (config.groundFloorRetail) {
      this.drawGroundFloorRetail(config, palette, baseX, baseY);
    }
    
    // Draw roof details
    this.drawRoof(config, palette, baseX, baseY);
    
    // Draw additional features
    for (const feature of features) {
      this.drawFeature(feature, config, palette, baseX, baseY);
    }
    
    // Draw chimney or antenna
    if (config.hasChimney) {
      this.drawChimney(config, palette, baseX, baseY);
    }
    if (config.hasAntenna) {
      this.drawAntenna(config, palette, baseX, baseY);
    }
  }
  
  /**
   * Draws a 3D isometric box with enhanced visual details:
   * - Gradient shading on faces for depth
   * - Edge highlights for bevel effect
   * - Floor separation lines for detail
   * - Corner edge highlights
   */
  private drawIsometricBox(
    baseX: number,
    baseY: number,
    widthCells: number,
    depthCells: number,
    floors: number,
    palette: ColorPalette
  ): void {
    const w = widthCells * (CELL_WIDTH_PX / 2);
    const d = depthCells * (CELL_WIDTH_PX / 2);
    const h = floors * FLOOR_HEIGHT_PX;
    
    // Calculate corner positions (isometric projection)
    // Front corner (bottom of the diamond)
    const frontX = baseX;
    const frontY = baseY;
    
    // Left corner
    const leftX = baseX - w;
    const leftY = baseY - w * 0.5;
    
    // Right corner  
    const rightX = baseX + d;
    const rightY = baseY - d * 0.5;
    
    // Back corner
    const backX = baseX - w + d;
    const backY = baseY - w * 0.5 - d * 0.5;
    
    // === RIGHT FACE (lighter - receives more light) ===
    // Create vertical gradient for depth on right face
    const rightGradient = this.ctx.createLinearGradient(frontX, frontY, rightX, rightY);
    rightGradient.addColorStop(0, palette.primary);           // Near edge - mid tone
    rightGradient.addColorStop(0.5, palette.primaryLight);    // Center - lightest
    rightGradient.addColorStop(1, this.lightenColor(palette.primaryLight, 0.1));  // Far edge - highlight
    
    this.ctx.fillStyle = rightGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(frontX, frontY);
    this.ctx.lineTo(rightX, rightY);
    this.ctx.lineTo(rightX, rightY - h);
    this.ctx.lineTo(frontX, frontY - h);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Right face floor separation lines (subtle horizontal details)
    this.ctx.strokeStyle = this.darkenColor(palette.primaryLight, 0.1);
    this.ctx.lineWidth = 0.5;
    for (let i = 1; i < floors; i++) {
      const lineY = frontY - i * FLOOR_HEIGHT_PX;
      this.ctx.beginPath();
      this.ctx.moveTo(frontX, lineY);
      this.ctx.lineTo(rightX, rightY - i * FLOOR_HEIGHT_PX);
      this.ctx.stroke();
    }
    
    // Right face outline
    this.ctx.strokeStyle = palette.outline;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(frontX, frontY);
    this.ctx.lineTo(rightX, rightY);
    this.ctx.lineTo(rightX, rightY - h);
    this.ctx.lineTo(frontX, frontY - h);
    this.ctx.closePath();
    this.ctx.stroke();
    
    // === LEFT FACE (darker - shadow side) ===
    // Create vertical gradient for depth on left face  
    const leftGradient = this.ctx.createLinearGradient(leftX, leftY, frontX, frontY);
    leftGradient.addColorStop(0, this.darkenColor(palette.primaryDark, 0.15));  // Far edge - darkest
    leftGradient.addColorStop(0.5, palette.primaryDark);      // Center
    leftGradient.addColorStop(1, palette.primary);            // Near edge - mid tone
    
    this.ctx.fillStyle = leftGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(frontX, frontY);
    this.ctx.lineTo(leftX, leftY);
    this.ctx.lineTo(leftX, leftY - h);
    this.ctx.lineTo(frontX, frontY - h);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Left face floor separation lines
    this.ctx.strokeStyle = this.darkenColor(palette.primaryDark, 0.15);
    this.ctx.lineWidth = 0.5;
    for (let i = 1; i < floors; i++) {
      const lineY = frontY - i * FLOOR_HEIGHT_PX;
      this.ctx.beginPath();
      this.ctx.moveTo(frontX, lineY);
      this.ctx.lineTo(leftX, leftY - i * FLOOR_HEIGHT_PX);
      this.ctx.stroke();
    }
    
    // Left face outline
    this.ctx.strokeStyle = palette.outline;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(frontX, frontY);
    this.ctx.lineTo(leftX, leftY);
    this.ctx.lineTo(leftX, leftY - h);
    this.ctx.lineTo(frontX, frontY - h);
    this.ctx.closePath();
    this.ctx.stroke();
    
    // === TOP FACE ===
    // Create gradient for top face to add dimension
    const topGradient = this.ctx.createLinearGradient(leftX, leftY - h, rightX, rightY - h);
    topGradient.addColorStop(0, this.darkenColor(palette.top, 0.1));
    topGradient.addColorStop(0.5, palette.top);
    topGradient.addColorStop(1, this.lightenColor(palette.top, 0.1));
    
    this.ctx.fillStyle = topGradient;
    this.ctx.beginPath();
    this.ctx.moveTo(frontX, frontY - h);
    this.ctx.lineTo(leftX, leftY - h);
    this.ctx.lineTo(backX, backY - h);
    this.ctx.lineTo(rightX, rightY - h);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Top face outline
    this.ctx.strokeStyle = palette.outline;
    this.ctx.stroke();
    
    // === EDGE HIGHLIGHTS ===
    // Front vertical edge highlight (brightest point)
    this.ctx.strokeStyle = this.lightenColor(palette.primaryLight, 0.3);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(frontX, frontY);
    this.ctx.lineTo(frontX, frontY - h);
    this.ctx.stroke();
    
    // Top front edge highlight
    this.ctx.strokeStyle = this.lightenColor(palette.top, 0.2);
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    this.ctx.moveTo(frontX, frontY - h);
    this.ctx.lineTo(rightX, rightY - h);
    this.ctx.stroke();
  }
  
  /**
   * Lighten a hex color by a percentage
   */
  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xFF) + Math.round(255 * percent));
    const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(255 * percent));
    const b = Math.min(255, (num & 0xFF) + Math.round(255 * percent));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
  
  /**
   * Darken a hex color by a percentage
   */
  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xFF) - Math.round(255 * percent));
    const g = Math.max(0, ((num >> 8) & 0xFF) - Math.round(255 * percent));
    const b = Math.max(0, (num & 0xFF) - Math.round(255 * percent));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
  
  private drawWindows(
    config: ProceduralBuildingConfig,
    palette: ColorPalette,
    baseX: number,
    baseY: number
  ): void {
    const { floors, footprint, windowDensity = 0.7 } = config;
    const windowColor = palette.accent;
    const windowFrameColor = palette.outline;
    
    const w = footprint.width * (CELL_WIDTH_PX / 2);
    const d = footprint.height * (CELL_WIDTH_PX / 2);
    
    // Window dimensions (isometric)
    const windowWidth = 6;
    const windowHeight = 10;
    const windowSpacing = 14;
    
    // Draw windows on left face
    const leftFaceWindows = Math.floor((w - 10) / windowSpacing);
    for (let floor = 0; floor < floors; floor++) {
      if (config.groundFloorRetail && floor === 0) continue; // Skip ground floor if retail
      
      for (let i = 0; i < leftFaceWindows; i++) {
        if (Math.random() > windowDensity) continue;
        
        const wx = baseX - 8 - i * windowSpacing;
        const wy = baseY - floor * FLOOR_HEIGHT_PX - FLOOR_HEIGHT_PX * 0.6;
        
        // Isometric adjustment
        const isoX = wx;
        const isoY = wy + (w - 8 - i * windowSpacing) * 0.5 - w * 0.5;
        
        this.drawIsometricWindow(isoX - 2, isoY, windowWidth, windowHeight, windowColor, windowFrameColor, 'left');
      }
    }
    
    // Draw windows on right face
    const rightFaceWindows = Math.floor((d - 10) / windowSpacing);
    for (let floor = 0; floor < floors; floor++) {
      if (config.groundFloorRetail && floor === 0) continue;
      
      for (let i = 0; i < rightFaceWindows; i++) {
        if (Math.random() > windowDensity) continue;
        
        const wx = baseX + 8 + i * windowSpacing;
        const wy = baseY - floor * FLOOR_HEIGHT_PX - FLOOR_HEIGHT_PX * 0.6;
        
        // Isometric adjustment
        const isoX = wx;
        const isoY = wy + (8 + i * windowSpacing) * 0.5 - d * 0.5;
        
        this.drawIsometricWindow(isoX + 2, isoY, windowWidth, windowHeight, windowColor, windowFrameColor, 'right');
      }
    }
  }
  
  /**
   * Draws an isometric window with enhanced visual details:
   * - Gradient fill for glass depth effect
   * - Multi-layer reflections for realism
   * - Inner glow for lit windows (evening effect)
   * - Proper frame with thickness
   */
  private drawIsometricWindow(
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: string,
    frameColor: string,
    face: 'left' | 'right'
  ): void {
    // Draw window as a simple parallelogram
    const skew = face === 'left' ? -0.5 : 0.5;
    
    // Create gradient for glass depth effect
    const gradient = this.ctx.createLinearGradient(
      x, y - height,
      x + width, y + width * skew
    );
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(0.5, this.lightenColor(fillColor, 0.15));
    gradient.addColorStop(1, fillColor);
    
    // Window glass with gradient
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + width, y + width * skew);
    this.ctx.lineTo(x + width, y + width * skew - height);
    this.ctx.lineTo(x, y - height);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Inner glow for lit windows (subtle warm light)
    this.ctx.fillStyle = 'rgba(255, 240, 200, 0.15)';
    this.ctx.fill();
    
    // Window frame (thicker for visibility)
    this.ctx.strokeStyle = frameColor;
    this.ctx.lineWidth = 0.8;
    this.ctx.stroke();
    
    // Window divider (cross pattern for larger windows)
    if (width > 5) {
      this.ctx.strokeStyle = frameColor;
      this.ctx.lineWidth = 0.4;
      this.ctx.beginPath();
      // Vertical divider
      this.ctx.moveTo(x + width * 0.5, y + width * 0.5 * skew);
      this.ctx.lineTo(x + width * 0.5, y + width * 0.5 * skew - height);
      this.ctx.stroke();
    }
    
    // Primary reflection highlight (top-left corner)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 1, y - height + 2);
    this.ctx.lineTo(x + width * 0.35, y - height + 2 + width * 0.35 * skew);
    this.ctx.lineTo(x + width * 0.35, y - height * 0.6 + width * 0.35 * skew);
    this.ctx.lineTo(x + 1, y - height * 0.6);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Secondary reflection (smaller diagonal)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(x + width * 0.6, y + width * 0.6 * skew - height * 0.3);
    this.ctx.lineTo(x + width * 0.8, y + width * 0.8 * skew - height * 0.3);
    this.ctx.lineTo(x + width * 0.8, y + width * 0.8 * skew - height * 0.5);
    this.ctx.lineTo(x + width * 0.6, y + width * 0.6 * skew - height * 0.5);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  private drawGroundFloorRetail(
    config: ProceduralBuildingConfig,
    palette: ColorPalette,
    baseX: number,
    baseY: number
  ): void {
    const { footprint } = config;
    const w = footprint.width * (CELL_WIDTH_PX / 2);
    const d = footprint.height * (CELL_WIDTH_PX / 2);
    
    // Large storefront window on left face
    const windowWidth = w * 0.7;
    const windowHeight = FLOOR_HEIGHT_PX * 0.7;
    
    // Left face storefront
    this.ctx.fillStyle = PLASMA_COLORS.blueLight;
    this.ctx.globalAlpha = 0.8;
    this.ctx.beginPath();
    const wx = baseX - w * 0.15;
    const wy = baseY - windowHeight * 0.2;
    this.ctx.moveTo(wx, wy);
    this.ctx.lineTo(wx - windowWidth, wy - windowWidth * 0.5);
    this.ctx.lineTo(wx - windowWidth, wy - windowWidth * 0.5 - windowHeight);
    this.ctx.lineTo(wx, wy - windowHeight);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
    
    // Awning
    this.ctx.fillStyle = palette.primary;
    this.ctx.beginPath();
    const awningY = baseY - FLOOR_HEIGHT_PX + 2;
    this.ctx.moveTo(baseX, awningY);
    this.ctx.lineTo(baseX - w, awningY - w * 0.5);
    this.ctx.lineTo(baseX - w - 6, awningY - w * 0.5 + 3);
    this.ctx.lineTo(baseX - 6, awningY + 3);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = palette.outline;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
  
  /**
   * Draws roof with enhanced visual details:
   * - Peaked: Gradient shading for 3D effect, ridge highlight
   * - Terrace: Glass railing panels, greenery
   * - Dome: Proper curved dome with highlights and shadows
   * - Flat: Already drawn as top of isometric box
   */
  private drawRoof(
    config: ProceduralBuildingConfig,
    palette: ColorPalette,
    baseX: number,
    baseY: number
  ): void {
    const { floors, footprint, roofStyle = 'flat', style } = config;
    const w = footprint.width * (CELL_WIDTH_PX / 2);
    const d = footprint.height * (CELL_WIDTH_PX / 2);
    const h = floors * FLOOR_HEIGHT_PX;
    
    const topY = baseY - h;
    const isCryptoStyle = ['defi', 'exchange', 'chain', 'ct', 'meme'].includes(style);
    
    if (roofStyle === 'peaked') {
      // Draw peaked roof with gradient shading
      const peakHeight = FLOOR_HEIGHT_PX * 0.8;
      const centerX = baseX - w / 2 + d / 2;
      const centerY = topY - w * 0.25 - d * 0.25;
      
      // Left roof slope (shadow side) with gradient
      const leftRoofGradient = this.ctx.createLinearGradient(
        baseX - w, topY - w * 0.5,
        centerX, centerY - peakHeight
      );
      leftRoofGradient.addColorStop(0, this.darkenColor(palette.primaryDark, 0.1));
      leftRoofGradient.addColorStop(1, palette.primaryDark);
      
      this.ctx.fillStyle = leftRoofGradient;
      this.ctx.beginPath();
      this.ctx.moveTo(baseX, topY);
      this.ctx.lineTo(baseX - w, topY - w * 0.5);
      this.ctx.lineTo(centerX, centerY - peakHeight);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.strokeStyle = palette.outline;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      
      // Right roof slope (light side) with gradient
      const rightRoofGradient = this.ctx.createLinearGradient(
        baseX + d, topY - d * 0.5,
        centerX, centerY - peakHeight
      );
      rightRoofGradient.addColorStop(0, this.lightenColor(palette.primaryLight, 0.1));
      rightRoofGradient.addColorStop(1, palette.primaryLight);
      
      this.ctx.fillStyle = rightRoofGradient;
      this.ctx.beginPath();
      this.ctx.moveTo(baseX, topY);
      this.ctx.lineTo(baseX + d, topY - d * 0.5);
      this.ctx.lineTo(centerX, centerY - peakHeight);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      
      // Ridge highlight
      this.ctx.strokeStyle = this.lightenColor(palette.primaryLight, 0.3);
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(baseX, topY);
      this.ctx.lineTo(centerX, centerY - peakHeight);
      this.ctx.stroke();
      
    } else if (roofStyle === 'terrace') {
      // Draw terrace with modern glass railing
      const railHeight = 5;
      
      // Glass panels with transparency
      this.ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
      this.ctx.beginPath();
      this.ctx.moveTo(baseX - w, topY - w * 0.5);
      this.ctx.lineTo(baseX, topY);
      this.ctx.lineTo(baseX, topY - railHeight);
      this.ctx.lineTo(baseX - w, topY - w * 0.5 - railHeight);
      this.ctx.closePath();
      this.ctx.fill();
      
      // Railing posts
      this.ctx.fillStyle = palette.accent;
      for (let i = 0; i <= 2; i++) {
        const postX = baseX - w * (i * 0.5);
        const postY = topY - w * 0.25 * i;
        this.ctx.fillRect(postX - 1, postY - railHeight, 2, railHeight);
      }
      
      // Top railing bar
      this.ctx.strokeStyle = palette.accent;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(baseX - w, topY - w * 0.5 - railHeight);
      this.ctx.lineTo(baseX, topY - railHeight);
      this.ctx.stroke();
      
      // Add small rooftop detail (AC unit or greenery)
      if (footprint.width >= 3) {
        const detailX = baseX - w * 0.3 + d * 0.3;
        const detailY = topY - w * 0.15 - d * 0.15;
        this.ctx.fillStyle = isCryptoStyle ? palette.accent : '#7CB342';  // Green for plants
        this.ctx.fillRect(detailX - 4, detailY - 3, 8, 3);
      }
      
    } else if (roofStyle === 'dome') {
      // Draw dome with 3D effect
      const centerX = baseX - w / 2 + d / 2;
      const centerY = topY - w * 0.25 - d * 0.25;
      const domeRadius = Math.min(w, d) * 0.6;
      const domeHeight = domeRadius * 0.8;
      
      // Dome base ellipse (on top of building)
      this.ctx.fillStyle = palette.top;
      this.ctx.beginPath();
      this.ctx.ellipse(centerX, centerY, domeRadius, domeRadius * 0.5, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Dome body with gradient for 3D effect
      const domeGradient = this.ctx.createRadialGradient(
        centerX - domeRadius * 0.3, centerY - domeHeight * 0.7,
        0,
        centerX, centerY - domeHeight * 0.3,
        domeRadius * 1.2
      );
      domeGradient.addColorStop(0, this.lightenColor(palette.primaryLight, 0.3));
      domeGradient.addColorStop(0.3, palette.primaryLight);
      domeGradient.addColorStop(0.7, palette.primary);
      domeGradient.addColorStop(1, palette.primaryDark);
      
      this.ctx.fillStyle = domeGradient;
      this.ctx.beginPath();
      // Draw dome as half ellipse
      this.ctx.moveTo(centerX - domeRadius, centerY);
      this.ctx.bezierCurveTo(
        centerX - domeRadius, centerY - domeHeight * 1.5,
        centerX + domeRadius, centerY - domeHeight * 1.5,
        centerX + domeRadius, centerY
      );
      this.ctx.closePath();
      this.ctx.fill();
      
      // Dome outline
      this.ctx.strokeStyle = palette.outline;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      
      // Dome highlight
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      this.ctx.beginPath();
      this.ctx.ellipse(
        centerX - domeRadius * 0.3,
        centerY - domeHeight * 0.5,
        domeRadius * 0.25,
        domeRadius * 0.15,
        -Math.PI / 6,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
      // Dome accent ring (for crypto buildings)
      if (isCryptoStyle) {
        this.ctx.strokeStyle = palette.accent;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY, domeRadius, domeRadius * 0.5, 0, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }
  
  private drawFeature(
    feature: BuildingFeature,
    config: ProceduralBuildingConfig,
    palette: ColorPalette,
    baseX: number,
    baseY: number
  ): void {
    // Placeholder for additional feature rendering
    // Can be extended for doors, signs, balconies, etc.
    switch (feature.type) {
      case 'door':
        this.drawDoor(feature, config, palette, baseX, baseY);
        break;
      case 'balcony':
        this.drawBalcony(feature, config, palette, baseX, baseY);
        break;
      case 'pillar':
        this.drawPillar(feature, config, palette, baseX, baseY);
        break;
    }
  }
  
  private drawDoor(
    feature: BuildingFeature,
    config: ProceduralBuildingConfig,
    palette: ColorPalette,
    baseX: number,
    baseY: number
  ): void {
    const doorWidth = 8;
    const doorHeight = 16;
    const position = feature.position ?? 0.5;
    
    const { footprint } = config;
    const w = footprint.width * (CELL_WIDTH_PX / 2);
    
    const dx = baseX - w * position;
    const dy = baseY - w * position * 0.5;
    
    // Door frame
    this.ctx.fillStyle = feature.color || PLASMA_COLORS.dark;
    this.ctx.beginPath();
    this.ctx.moveTo(dx, dy);
    this.ctx.lineTo(dx - doorWidth, dy - doorWidth * 0.5);
    this.ctx.lineTo(dx - doorWidth, dy - doorWidth * 0.5 - doorHeight);
    this.ctx.lineTo(dx, dy - doorHeight);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Door handle
    this.ctx.fillStyle = PLASMA_COLORS.gold;
    this.ctx.beginPath();
    this.ctx.arc(dx - doorWidth * 0.3, dy - doorWidth * 0.15 - doorHeight * 0.5, 1.5, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  private drawBalcony(
    feature: BuildingFeature,
    config: ProceduralBuildingConfig,
    palette: ColorPalette,
    baseX: number,
    baseY: number
  ): void {
    const floor = feature.floor ?? 1;
    const position = feature.position ?? 0.5;
    
    const { footprint } = config;
    const w = footprint.width * (CELL_WIDTH_PX / 2);
    
    const floorY = baseY - floor * FLOOR_HEIGHT_PX;
    const bx = baseX - w * position;
    const by = floorY - w * position * 0.5;
    
    // Balcony platform
    this.ctx.fillStyle = palette.top;
    const balconyWidth = 10;
    const balconyDepth = 6;
    this.ctx.beginPath();
    this.ctx.moveTo(bx, by);
    this.ctx.lineTo(bx - balconyDepth, by + balconyDepth * 0.5);
    this.ctx.lineTo(bx - balconyDepth - balconyWidth, by + balconyDepth * 0.5 - balconyWidth * 0.5);
    this.ctx.lineTo(bx - balconyWidth, by - balconyWidth * 0.5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = palette.outline;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    // Railing
    this.ctx.strokeStyle = palette.accent;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(bx - balconyDepth, by + balconyDepth * 0.5);
    this.ctx.lineTo(bx - balconyDepth, by + balconyDepth * 0.5 - 6);
    this.ctx.moveTo(bx - balconyDepth - balconyWidth, by + balconyDepth * 0.5 - balconyWidth * 0.5);
    this.ctx.lineTo(bx - balconyDepth - balconyWidth, by + balconyDepth * 0.5 - balconyWidth * 0.5 - 6);
    this.ctx.stroke();
  }
  
  private drawPillar(
    feature: BuildingFeature,
    config: ProceduralBuildingConfig,
    palette: ColorPalette,
    baseX: number,
    baseY: number
  ): void {
    const position = feature.position ?? 0;
    const { floors, footprint } = config;
    const w = footprint.width * (CELL_WIDTH_PX / 2);
    
    const pillarHeight = floors * FLOOR_HEIGHT_PX;
    const px = baseX - w * position;
    const py = baseY - w * position * 0.5;
    
    // Pillar body
    this.ctx.fillStyle = feature.color || PLASMA_COLORS.light;
    const pillarWidth = 4;
    this.ctx.fillRect(px - pillarWidth / 2, py - pillarHeight, pillarWidth, pillarHeight);
    
    // Pillar cap
    this.ctx.fillStyle = palette.top;
    this.ctx.fillRect(px - pillarWidth / 2 - 1, py - pillarHeight - 3, pillarWidth + 2, 3);
    
    // Pillar base
    this.ctx.fillRect(px - pillarWidth / 2 - 1, py - 3, pillarWidth + 2, 3);
  }
  
  private drawChimney(
    config: ProceduralBuildingConfig,
    palette: ColorPalette,
    baseX: number,
    baseY: number
  ): void {
    const { floors, footprint } = config;
    const w = footprint.width * (CELL_WIDTH_PX / 2);
    const h = floors * FLOOR_HEIGHT_PX;
    
    const chimneyX = baseX - w * 0.3;
    const chimneyY = baseY - h - w * 0.15;
    const chimneyHeight = 12;
    const chimneyWidth = 6;
    
    // Chimney body
    this.ctx.fillStyle = palette.primaryDark;
    this.ctx.fillRect(chimneyX - chimneyWidth / 2, chimneyY - chimneyHeight, chimneyWidth, chimneyHeight);
    
    // Chimney top
    this.ctx.fillStyle = palette.outline;
    this.ctx.fillRect(chimneyX - chimneyWidth / 2 - 1, chimneyY - chimneyHeight - 2, chimneyWidth + 2, 2);
  }
  
  /**
   * Draws an antenna with enhanced visual effects:
   * - Metallic gradient on the pole
   * - Glowing beacon at the top (uses palette accent color)
   * - Multiple glow layers for depth
   * - Support struts for larger buildings
   */
  private drawAntenna(
    config: ProceduralBuildingConfig,
    palette: ColorPalette,
    baseX: number,
    baseY: number
  ): void {
    const { floors, footprint, style } = config;
    const w = footprint.width * (CELL_WIDTH_PX / 2);
    const d = footprint.height * (CELL_WIDTH_PX / 2);
    const h = floors * FLOOR_HEIGHT_PX;
    
    const antennaX = baseX - w / 2 + d / 2;
    const antennaY = baseY - h - w * 0.25 - d * 0.25;
    const antennaHeight = Math.min(25, 12 + floors * 0.8);  // Scale with building size
    
    // Determine if this is a crypto building for special glow effects
    const isCryptoStyle = ['defi', 'exchange', 'chain', 'ct', 'meme'].includes(style);
    const glowColor = isCryptoStyle ? palette.accent : PLASMA_COLORS.coral;
    
    // Antenna pole with metallic gradient
    const poleGradient = this.ctx.createLinearGradient(
      antennaX - 2, antennaY,
      antennaX + 2, antennaY
    );
    poleGradient.addColorStop(0, '#666666');
    poleGradient.addColorStop(0.3, '#AAAAAA');
    poleGradient.addColorStop(0.5, '#CCCCCC');
    poleGradient.addColorStop(0.7, '#AAAAAA');
    poleGradient.addColorStop(1, '#666666');
    
    this.ctx.strokeStyle = poleGradient;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(antennaX, antennaY);
    this.ctx.lineTo(antennaX, antennaY - antennaHeight);
    this.ctx.stroke();
    
    // Support struts for taller buildings
    if (floors > 6) {
      this.ctx.strokeStyle = '#888888';
      this.ctx.lineWidth = 0.5;
      this.ctx.beginPath();
      // Left strut
      this.ctx.moveTo(antennaX - 4, antennaY);
      this.ctx.lineTo(antennaX, antennaY - antennaHeight * 0.6);
      // Right strut
      this.ctx.moveTo(antennaX + 4, antennaY);
      this.ctx.lineTo(antennaX, antennaY - antennaHeight * 0.6);
      this.ctx.stroke();
    }
    
    // === GLOWING BEACON ===
    // Outer glow (largest, most transparent)
    if (isCryptoStyle) {
      const outerGlow = this.ctx.createRadialGradient(
        antennaX, antennaY - antennaHeight,
        0,
        antennaX, antennaY - antennaHeight,
        12
      );
      outerGlow.addColorStop(0, this.hexToRgba(glowColor, 0.4));
      outerGlow.addColorStop(0.5, this.hexToRgba(glowColor, 0.15));
      outerGlow.addColorStop(1, this.hexToRgba(glowColor, 0));
      
      this.ctx.fillStyle = outerGlow;
      this.ctx.beginPath();
      this.ctx.arc(antennaX, antennaY - antennaHeight, 12, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Middle glow
    const middleGlow = this.ctx.createRadialGradient(
      antennaX, antennaY - antennaHeight,
      0,
      antennaX, antennaY - antennaHeight,
      6
    );
    middleGlow.addColorStop(0, this.hexToRgba(glowColor, 0.6));
    middleGlow.addColorStop(1, this.hexToRgba(glowColor, 0));
    
    this.ctx.fillStyle = middleGlow;
    this.ctx.beginPath();
    this.ctx.arc(antennaX, antennaY - antennaHeight, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Core beacon (solid bright center)
    this.ctx.fillStyle = glowColor;
    this.ctx.beginPath();
    this.ctx.arc(antennaX, antennaY - antennaHeight, 3, 0, Math.PI * 2);
    this.ctx.fill();
    
    // White highlight in center
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.beginPath();
    this.ctx.arc(antennaX - 0.5, antennaY - antennaHeight - 0.5, 1, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  /**
   * Convert hex color to rgba string with specified alpha
   */
  private hexToRgba(hex: string, alpha: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) & 0xFF;
    const g = (num >> 8) & 0xFF;
    const b = num & 0xFF;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

// Singleton instance
let generatorInstance: BuildingGenerator | null = null;

export function getBuildingGenerator(): BuildingGenerator {
  if (!generatorInstance) {
    generatorInstance = new BuildingGenerator();
  }
  return generatorInstance;
}

// Pre-defined procedural building configs matching the existing building categories
export const PROCEDURAL_BUILDINGS: Record<string, ProceduralBuildingConfig> = {
  // Residential
  'proc-apartment-small': {
    id: 'proc-apartment-small',
    name: 'Small Apartment',
    floors: 3,
    footprint: { width: 2, height: 2 },
    style: 'residential',
    palette: 'residential',
    windowDensity: 0.8,
    roofStyle: 'flat',
  },
  'proc-apartment-medium': {
    id: 'proc-apartment-medium',
    name: 'Medium Apartment',
    floors: 5,
    footprint: { width: 3, height: 3 },
    style: 'residential',
    palette: 'brownstone',
    windowDensity: 0.75,
    roofStyle: 'terrace',
  },
  'proc-apartment-tall': {
    id: 'proc-apartment-tall',
    name: 'Tall Apartment',
    floors: 8,
    footprint: { width: 4, height: 4 },
    style: 'residential',
    palette: 'residentialCream',
    windowDensity: 0.7,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  'proc-townhouse': {
    id: 'proc-townhouse',
    name: 'Townhouse',
    floors: 3,
    footprint: { width: 2, height: 3 },
    style: 'residential',
    palette: 'brownstone',
    windowDensity: 0.6,
    roofStyle: 'peaked',
    hasChimney: true,
    features: [{ type: 'door', position: 0.3 }],
  },
  
  // Commercial
  'proc-office-small': {
    id: 'proc-office-small',
    name: 'Small Office',
    floors: 4,
    footprint: { width: 2, height: 2 },
    style: 'commercial',
    palette: 'modern',
    windowDensity: 0.9,
    roofStyle: 'flat',
  },
  'proc-office-tower': {
    id: 'proc-office-tower',
    name: 'Office Tower',
    floors: 12,
    footprint: { width: 4, height: 4 },
    style: 'commercial',
    palette: 'modernBlue',
    windowDensity: 0.95,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  'proc-retail': {
    id: 'proc-retail',
    name: 'Retail Store',
    floors: 2,
    footprint: { width: 3, height: 2 },
    style: 'commercial',
    palette: 'commercial',
    windowDensity: 0.5,
    groundFloorRetail: true,
  },
  
  // Civic
  'proc-city-hall': {
    id: 'proc-city-hall',
    name: 'City Hall',
    floors: 4,
    footprint: { width: 5, height: 4 },
    style: 'civic',
    palette: 'civic',
    windowDensity: 0.6,
    roofStyle: 'flat',
    features: [
      { type: 'pillar', position: 0.2 },
      { type: 'pillar', position: 0.5 },
      { type: 'pillar', position: 0.8 },
    ],
  },
  'proc-library': {
    id: 'proc-library',
    name: 'Library',
    floors: 3,
    footprint: { width: 4, height: 3 },
    style: 'civic',
    palette: 'landmark',
    windowDensity: 0.4,
    roofStyle: 'peaked',
  },
  
  // Landmark
  'proc-museum': {
    id: 'proc-museum',
    name: 'Museum',
    floors: 3,
    footprint: { width: 6, height: 5 },
    style: 'landmark',
    palette: 'landmark',
    windowDensity: 0.3,
    roofStyle: 'dome',
    features: [
      { type: 'pillar', position: 0.15 },
      { type: 'pillar', position: 0.35 },
      { type: 'pillar', position: 0.55 },
      { type: 'pillar', position: 0.75 },
    ],
  },
  'proc-skyscraper': {
    id: 'proc-skyscraper',
    name: 'Skyscraper',
    floors: 20,
    footprint: { width: 5, height: 5 },
    style: 'modern',
    palette: 'modernBlue',
    windowDensity: 0.98,
    roofStyle: 'flat',
    hasAntenna: true,
  },
};

// =============================================================================
// CRYPTO PROCEDURAL BUILDING CONFIGS
// =============================================================================
// Procedural configs for crypto-themed buildings.
// These use crypto palettes and styles for consistent visual identity.
//
// IMPORTANT: IDs here MUST match the IDs in cryptoBuildings.ts exactly!
// The ProceduralManager looks up configs by building ID, so mismatches
// will cause crypto buildings to not render.
//
// Each config specifies:
// - floors: Number of stories (affects height)
// - footprint: Grid size from the building definition
// - style: Visual style category
// - palette: Color scheme from CryptoPalettes.ts (brand-appropriate)
// - windowDensity: How many windows per floor (0-1)
// - roofStyle: flat, peaked, dome, or terrace
// - features: Additional visual elements (pillars, balconies, etc.)

export const CRYPTO_PROCEDURAL_BUILDINGS: Record<string, ProceduralBuildingConfig> = {
  // ===========================================================================
  // DEFI PROTOCOL BUILDINGS
  // ===========================================================================
  // Major DeFi protocols - typically modern glass/steel with protocol brand colors
  
  // Aave - Purple/teal lending protocol
  'aave-lending-tower': {
    id: 'aave-lending-tower',
    name: 'Aave Lending Tower',
    floors: 10,
    footprint: { width: 6, height: 6 },
    style: 'defi',
    palette: 'aave',  // Purple-pink with teal accent
    windowDensity: 0.9,
    roofStyle: 'flat',
    hasAntenna: true,
    groundFloorRetail: true,
  },
  
  // Uniswap - Iconic pink DEX
  'uniswap-exchange': {
    id: 'uniswap-exchange',
    name: 'Uniswap Exchange',
    floors: 6,
    footprint: { width: 4, height: 4 },
    style: 'defi',
    palette: 'uniswap',  // Signature pink
    windowDensity: 0.85,
    roofStyle: 'flat',
    groundFloorRetail: true,
  },
  
  // Lido - Blue liquid staking
  'lido-staking-hub': {
    id: 'lido-staking-hub',
    name: 'Lido Staking Hub',
    floors: 8,
    footprint: { width: 5, height: 5 },
    style: 'defi',
    palette: 'lido',  // Lido blue with coral accent
    windowDensity: 0.8,
    roofStyle: 'terrace',
    features: [
      { type: 'pillar', position: 0.25 },
      { type: 'pillar', position: 0.75 },
    ],
  },
  
  // Pendle - Cyan yield trading
  'pendle-yield-factory': {
    id: 'pendle-yield-factory',
    name: 'Pendle Yield Factory',
    floors: 5,
    footprint: { width: 4, height: 3 },
    style: 'defi',
    palette: 'pendle',  // Cyan/teal
    windowDensity: 0.85,
    roofStyle: 'terrace',
    hasAntenna: true,
  },
  
  // Curve - Deep blue stablecoin DEX
  'curve-finance-pool': {
    id: 'curve-finance-pool',
    name: 'Curve Finance Pool',
    floors: 7,
    footprint: { width: 5, height: 4 },
    style: 'defi',
    palette: 'curve',  // Deep blue with red accent
    windowDensity: 0.75,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  
  // MakerDAO - Teal DAI issuer (institutional)
  'makerdao-vault': {
    id: 'makerdao-vault',
    name: 'MakerDAO Vault',
    floors: 9,
    footprint: { width: 6, height: 5 },
    style: 'defi',
    palette: 'maker',  // Teal with DAI yellow
    windowDensity: 0.7,
    roofStyle: 'peaked',
    features: [
      { type: 'pillar', position: 0.2 },
      { type: 'pillar', position: 0.5 },
      { type: 'pillar', position: 0.8 },
    ],
  },
  
  // Compound - Green money markets
  'compound-treasury': {
    id: 'compound-treasury',
    name: 'Compound Treasury',
    floors: 6,
    footprint: { width: 4, height: 4 },
    style: 'defi',
    palette: 'compound',  // Compound green
    windowDensity: 0.85,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  
  // Yearn - Blue yield aggregator
  'yearn-strategy-lab': {
    id: 'yearn-strategy-lab',
    name: 'Yearn Strategy Lab',
    floors: 4,
    footprint: { width: 3, height: 3 },
    style: 'defi',
    palette: 'yearn',  // Yearn blue
    windowDensity: 0.8,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  
  // GMX - Blue perps DEX
  'gmx-perps-arena': {
    id: 'gmx-perps-arena',
    name: 'GMX Perps Arena',
    floors: 7,
    footprint: { width: 5, height: 5 },
    style: 'defi',
    palette: 'gmx',  // GMX blue
    windowDensity: 0.9,
    roofStyle: 'terrace',
    hasAntenna: true,
  },
  
  // Hyperliquid - Neon green perps
  'hyperliquid-terminal': {
    id: 'hyperliquid-terminal',
    name: 'Hyperliquid Terminal',
    floors: 6,
    footprint: { width: 4, height: 4 },
    style: 'defi',
    palette: 'hyperliquid',  // Neon green
    windowDensity: 0.95,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  
  // EigenLayer - Restaking (Ethereum-aligned)
  'eigenlayer-restaking-hub': {
    id: 'eigenlayer-restaking-hub',
    name: 'EigenLayer Restaking Hub',
    floors: 8,
    footprint: { width: 5, height: 5 },
    style: 'defi',
    palette: 'ethereum',  // Ethereum purple
    windowDensity: 0.85,
    roofStyle: 'flat',
    hasAntenna: true,
    groundFloorRetail: true,
  },
  
  // Morpho - Lending optimizer
  'morpho-optimizer': {
    id: 'morpho-optimizer',
    name: 'Morpho Optimizer',
    floors: 5,
    footprint: { width: 3, height: 4 },
    style: 'defi',
    palette: 'ethereum',  // Ethereum ecosystem
    windowDensity: 0.8,
    roofStyle: 'terrace',
    hasAntenna: true,
  },
  
  // ===========================================================================
  // EXCHANGE BUILDINGS
  // ===========================================================================
  // Major exchanges - large corporate buildings with brand colors
  
  // Coinbase - US regulated (blue)
  'coinbase-tower': {
    id: 'coinbase-tower',
    name: 'Coinbase Tower',
    floors: 15,
    footprint: { width: 8, height: 8 },
    style: 'exchange',
    palette: 'coinbase',  // Coinbase blue
    windowDensity: 0.95,
    roofStyle: 'flat',
    hasAntenna: true,
    groundFloorRetail: true,
  },
  
  // Binance - Global giant (yellow/black)
  'binance-megaplex': {
    id: 'binance-megaplex',
    name: 'Binance Megaplex',
    floors: 18,
    footprint: { width: 10, height: 8 },
    style: 'exchange',
    palette: 'binance',  // Binance yellow
    windowDensity: 0.9,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  
  // Kraken - Security-focused (purple)
  'kraken-fortress': {
    id: 'kraken-fortress',
    name: 'Kraken Fortress',
    floors: 10,
    footprint: { width: 6, height: 6 },
    style: 'exchange',
    palette: 'kraken',  // Kraken purple
    windowDensity: 0.7,
    roofStyle: 'flat',
    features: [
      { type: 'pillar', position: 0.2 },
      { type: 'pillar', position: 0.5 },
      { type: 'pillar', position: 0.8 },
    ],
  },
  
  // FTX Ruins - Cautionary memorial (gray)
  'ftx-ruins': {
    id: 'ftx-ruins',
    name: 'FTX Ruins (Memorial)',
    floors: 3,
    footprint: { width: 4, height: 4 },
    style: 'exchange',
    palette: 'ftxRuins',  // Gray ruins
    windowDensity: 0.3,
    roofStyle: 'flat',
  },
  
  // dYdX - Decentralized perps (purple)
  'dydx-trading-floor': {
    id: 'dydx-trading-floor',
    name: 'dYdX Trading Floor',
    floors: 7,
    footprint: { width: 5, height: 4 },
    style: 'exchange',
    palette: 'dydx',  // dYdX purple
    windowDensity: 0.85,
    roofStyle: 'terrace',
    hasAntenna: true,
  },
  
  // Jupiter - Solana DEX aggregator (lime green)
  'jupiter-aggregator': {
    id: 'jupiter-aggregator',
    name: 'Jupiter Aggregator',
    floors: 4,
    footprint: { width: 3, height: 3 },
    style: 'exchange',
    palette: 'jupiter',  // Jupiter lime green
    windowDensity: 0.8,
    roofStyle: 'flat',
    groundFloorRetail: true,
  },
  
  // Bybit - Asian exchange
  'bybit-tower': {
    id: 'bybit-tower',
    name: 'Bybit Tower',
    floors: 8,
    footprint: { width: 5, height: 5 },
    style: 'exchange',
    palette: 'coinbase',  // Similar corporate blue
    windowDensity: 0.85,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  
  // ===========================================================================
  // BLOCKCHAIN ECOSYSTEM BUILDINGS
  // ===========================================================================
  // Chain HQs - Major presence with ecosystem brand colors
  
  // Ethereum Foundation (purple)
  'ethereum-foundation-hq': {
    id: 'ethereum-foundation-hq',
    name: 'Ethereum Foundation HQ',
    floors: 12,
    footprint: { width: 8, height: 6 },
    style: 'chain',
    palette: 'ethereum',  // Ethereum purple
    windowDensity: 0.8,
    roofStyle: 'peaked',
    hasAntenna: true,
    features: [
      { type: 'pillar', position: 0.15 },
      { type: 'pillar', position: 0.5 },
      { type: 'pillar', position: 0.85 },
    ],
  },
  
  // Solana Labs (purple/green)
  'solana-labs-campus': {
    id: 'solana-labs-campus',
    name: 'Solana Labs Campus',
    floors: 10,
    footprint: { width: 7, height: 7 },
    style: 'chain',
    palette: 'solana',  // Solana purple with green accent
    windowDensity: 0.85,
    roofStyle: 'terrace',
    groundFloorRetail: true,
    hasAntenna: true,
  },
  
  // Base Camp (Coinbase L2 - blue)
  'base-camp': {
    id: 'base-camp',
    name: 'Base Camp',
    floors: 8,
    footprint: { width: 5, height: 5 },
    style: 'chain',
    palette: 'base',  // Base blue
    windowDensity: 0.85,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  
  // Arbitrum Tower (blue)
  'arbitrum-tower': {
    id: 'arbitrum-tower',
    name: 'Arbitrum Tower',
    floors: 9,
    footprint: { width: 6, height: 6 },
    style: 'chain',
    palette: 'arbitrum',  // Arbitrum blue
    windowDensity: 0.85,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  
  // Optimism Collective (red)
  'optimism-collective': {
    id: 'optimism-collective',
    name: 'Optimism Collective',
    floors: 8,
    footprint: { width: 5, height: 5 },
    style: 'chain',
    palette: 'optimism',  // Optimism red
    windowDensity: 0.8,
    roofStyle: 'terrace',
    hasAntenna: true,
  },
  
  // Polygon Plaza (purple)
  'polygon-plaza': {
    id: 'polygon-plaza',
    name: 'Polygon Plaza',
    floors: 6,
    footprint: { width: 4, height: 4 },
    style: 'chain',
    palette: 'polygon',  // Polygon purple
    windowDensity: 0.8,
    roofStyle: 'flat',
    groundFloorRetail: true,
  },
  
  // Avalanche Summit (red)
  'avalanche-summit': {
    id: 'avalanche-summit',
    name: 'Avalanche Summit',
    floors: 8,
    footprint: { width: 5, height: 5 },
    style: 'chain',
    palette: 'avalanche',  // Avalanche red
    windowDensity: 0.8,
    roofStyle: 'peaked',
    hasAntenna: true,
  },
  
  // Bitcoin Citadel (orange/gold)
  'bitcoin-citadel': {
    id: 'bitcoin-citadel',
    name: 'Bitcoin Citadel',
    floors: 14,
    footprint: { width: 8, height: 8 },
    style: 'chain',
    palette: 'bitcoin',  // Bitcoin orange
    windowDensity: 0.6,
    roofStyle: 'peaked',
    features: [
      { type: 'pillar', position: 0.15 },
      { type: 'pillar', position: 0.35 },
      { type: 'pillar', position: 0.65 },
      { type: 'pillar', position: 0.85 },
    ],
  },
  
  // ===========================================================================
  // CT CULTURE / INFLUENCER BUILDINGS
  // ===========================================================================
  // Crypto Twitter personalities - varied styles from luxurious to neon degen
  
  // Cobie's Penthouse (luxurious dark)
  'cobies-penthouse': {
    id: 'cobies-penthouse',
    name: "Cobie's Penthouse",
    floors: 10,
    footprint: { width: 4, height: 4 },
    style: 'ct',
    palette: 'ctWhale',  // Dark luxurious with gold
    windowDensity: 0.6,
    roofStyle: 'terrace',
    features: [
      { type: 'balcony', floor: 9, position: 0.5 },
    ],
  },
  
  // UpOnly Podcast Studio (podcast purple)
  'uponly-studio': {
    id: 'uponly-studio',
    name: 'UpOnly Podcast Studio',
    floors: 4,
    footprint: { width: 3, height: 3 },
    style: 'ct',
    palette: 'podcast',  // Podcast purple
    windowDensity: 0.75,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  
  // GCR Observatory (whale dark)
  'gcr-observatory': {
    id: 'gcr-observatory',
    name: 'GCR Observatory',
    floors: 5,
    footprint: { width: 2, height: 3 },
    style: 'ct',
    palette: 'ctWhale',  // Dark mysterious
    windowDensity: 0.5,
    roofStyle: 'dome',
    hasAntenna: true,
  },
  
  // Ansem's Sol Mansion (Solana themed)
  'ansems-sol-mansion': {
    id: 'ansems-sol-mansion',
    name: "Ansem's Sol Mansion",
    floors: 6,
    footprint: { width: 4, height: 4 },
    style: 'ct',
    palette: 'solana',  // Solana purple/green
    windowDensity: 0.7,
    roofStyle: 'terrace',
    features: [
      { type: 'balcony', floor: 5, position: 0.5 },
    ],
  },
  
  // Hsaka's Trading Den (degen neon)
  'hsakas-trading-den': {
    id: 'hsakas-trading-den',
    name: "Hsaka's Trading Den",
    floors: 4,
    footprint: { width: 3, height: 3 },
    style: 'ct',
    palette: 'ctDegen',  // Neon magenta/green
    windowDensity: 0.9,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  
  // Loomdart's Lab (research/ethereum)
  'loomdarts-lab': {
    id: 'loomdarts-lab',
    name: "Loomdart's Lab",
    floors: 4,
    footprint: { width: 3, height: 3 },
    style: 'ct',
    palette: 'ethereum',  // Research vibes
    windowDensity: 0.75,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  
  // Andrew Kang Capital (institutional whale)
  'andrew-kang-capital': {
    id: 'andrew-kang-capital',
    name: 'Andrew Kang Capital',
    floors: 8,
    footprint: { width: 5, height: 5 },
    style: 'ct',
    palette: 'ctWhale',  // Dark luxurious
    windowDensity: 0.7,
    roofStyle: 'flat',
    hasAntenna: true,
    features: [
      { type: 'pillar', position: 0.25 },
      { type: 'pillar', position: 0.75 },
    ],
  },
  
  // Arthur Hayes' Hideout (Bitcoin themed)
  'arthur-hayes-hideout': {
    id: 'arthur-hayes-hideout',
    name: "Arthur Hayes' Hideout",
    floors: 5,
    footprint: { width: 4, height: 3 },
    style: 'ct',
    palette: 'bitcoin',  // Bitcoin orange
    windowDensity: 0.6,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  
  // DefiLlama Watchtower (neutral/informational)
  'defillama-watchtower': {
    id: 'defillama-watchtower',
    name: 'DefiLlama Watchtower',
    floors: 6,
    footprint: { width: 3, height: 4 },
    style: 'ct',
    palette: 'ethereum',  // Multi-chain neutral
    windowDensity: 0.7,
    roofStyle: 'dome',
    hasAntenna: true,
  },
  
  // Bankless HQ (Ethereum aligned)
  'bankless-hq': {
    id: 'bankless-hq',
    name: 'Bankless HQ',
    floors: 6,
    footprint: { width: 4, height: 4 },
    style: 'ct',
    palette: 'ethereum',  // Ethereum purple
    windowDensity: 0.75,
    roofStyle: 'flat',
    hasAntenna: true,
    groundFloorRetail: true,
  },
  
  // ===========================================================================
  // MEME CULTURE PROPS
  // ===========================================================================
  // Fun meme structures - colorful and whimsical
  
  // Pepe Statue (pepe green)
  'pepe-statue': {
    id: 'pepe-statue',
    name: 'Pepe Statue',
    floors: 2,
    footprint: { width: 2, height: 2 },
    style: 'meme',
    palette: 'pepe',  // Pepe green
    windowDensity: 0.3,
    roofStyle: 'dome',
  },
  
  // Wojak Memorial (sad beige)
  'wojak-memorial': {
    id: 'wojak-memorial',
    name: 'Wojak Memorial',
    floors: 2,
    footprint: { width: 1, height: 2 },
    style: 'meme',
    palette: 'wojak',  // Skin tone beige
    windowDensity: 0.2,
    roofStyle: 'flat',
  },
  
  // Diamond Hands Monument (cyan diamond)
  'diamond-hands-monument': {
    id: 'diamond-hands-monument',
    name: 'Diamond Hands Monument',
    floors: 3,
    footprint: { width: 2, height: 2 },
    style: 'meme',
    palette: 'diamondHands',  // Crystal cyan
    windowDensity: 0.4,
    roofStyle: 'peaked',
    features: [
      { type: 'pillar', position: 0.5 },
    ],
  },
  
  // Paper Hands Fountain (weak beige)
  'paper-hands-fountain': {
    id: 'paper-hands-fountain',
    name: 'Paper Hands Fountain',
    floors: 2,
    footprint: { width: 2, height: 2 },
    style: 'meme',
    palette: 'wojak',  // Weak paper tone
    windowDensity: 0.3,
    roofStyle: 'flat',
  },
  
  // Rug Pull Crater (dark red warning)
  'rug-pull-crater': {
    id: 'rug-pull-crater',
    name: 'Rug Pull Crater',
    floors: 1,
    footprint: { width: 3, height: 3 },
    style: 'meme',
    palette: 'rugPull',  // Dark red
    windowDensity: 0.1,
    roofStyle: 'flat',
  },
  
  // To The Moon Rocket (gold/space)
  'moon-rocket': {
    id: 'moon-rocket',
    name: 'To The Moon Rocket',
    floors: 4,
    footprint: { width: 2, height: 3 },
    style: 'meme',
    palette: 'moon',  // Gold moon
    windowDensity: 0.5,
    roofStyle: 'peaked',
    hasAntenna: true,
  },
  
  // WAGMI Banner (hopeful green)
  'wagmi-banner': {
    id: 'wagmi-banner',
    name: 'WAGMI Banner',
    floors: 1,
    footprint: { width: 1, height: 1 },
    style: 'meme',
    palette: 'wagmi',  // Hopeful green
    windowDensity: 0.2,
    roofStyle: 'flat',
  },
  
  // NGMI Graffiti (warning red)
  'ngmi-graffiti': {
    id: 'ngmi-graffiti',
    name: 'NGMI Graffiti',
    floors: 1,
    footprint: { width: 1, height: 1 },
    style: 'meme',
    palette: 'ngmi',  // Warning red
    windowDensity: 0.2,
    roofStyle: 'flat',
  },
  
  // Degen Ape Statue (NFT culture)
  'degen-ape-statue': {
    id: 'degen-ape-statue',
    name: 'Degen Ape Statue',
    floors: 2,
    footprint: { width: 2, height: 2 },
    style: 'meme',
    palette: 'nft',  // NFT colorful
    windowDensity: 0.4,
    roofStyle: 'dome',
  },
  
  // Laser Eyes Billboard (Bitcoin maxi)
  'laser-eyes-billboard': {
    id: 'laser-eyes-billboard',
    name: 'Laser Eyes Billboard',
    floors: 2,
    footprint: { width: 2, height: 1 },
    style: 'meme',
    palette: 'laserEyes',  // Bitcoin orange with red
    windowDensity: 0.3,
    roofStyle: 'flat',
  },
  
  // GM Cafe (morning sky blue)
  'gm-cafe': {
    id: 'gm-cafe',
    name: 'GM Cafe',
    floors: 2,
    footprint: { width: 2, height: 2 },
    style: 'meme',
    palette: 'gm',  // Morning sky blue
    windowDensity: 0.8,
    roofStyle: 'flat',
    groundFloorRetail: true,
  },
  
  // Vitalik Bust (Ethereum)
  'vitalik-bust': {
    id: 'vitalik-bust',
    name: 'Vitalik Bust',
    floors: 2,
    footprint: { width: 1, height: 2 },
    style: 'meme',
    palette: 'ethereum',  // Ethereum purple
    windowDensity: 0.2,
    roofStyle: 'dome',
  },
  
  // Satoshi Shrine (Bitcoin gold)
  'satoshi-shrine': {
    id: 'satoshi-shrine',
    name: 'Satoshi Shrine',
    floors: 3,
    footprint: { width: 2, height: 2 },
    style: 'meme',
    palette: 'bitcoin',  // Bitcoin orange/gold
    windowDensity: 0.3,
    roofStyle: 'peaked',
    features: [
      { type: 'pillar', position: 0.25 },
      { type: 'pillar', position: 0.75 },
    ],
  },
  
  // Probably Nothing Sign (degen mystery)
  'probably-nothing-sign': {
    id: 'probably-nothing-sign',
    name: 'Probably Nothing Sign',
    floors: 1,
    footprint: { width: 1, height: 1 },
    style: 'meme',
    palette: 'ctDegen',  // Mysterious degen
    windowDensity: 0.1,
    roofStyle: 'flat',
  },
};

// Combined export of all procedural buildings
export const ALL_PROCEDURAL_BUILDINGS: Record<string, ProceduralBuildingConfig> = {
  ...PROCEDURAL_BUILDINGS,
  ...CRYPTO_PROCEDURAL_BUILDINGS,
};

