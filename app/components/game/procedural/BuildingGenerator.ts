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
    
    // Draw right face (lighter - receives more light)
    this.ctx.fillStyle = palette.primaryLight;
    this.ctx.beginPath();
    this.ctx.moveTo(frontX, frontY);
    this.ctx.lineTo(rightX, rightY);
    this.ctx.lineTo(rightX, rightY - h);
    this.ctx.lineTo(frontX, frontY - h);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Draw right face outline
    this.ctx.strokeStyle = palette.outline;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    
    // Draw left face (darker - shadow side)
    this.ctx.fillStyle = palette.primaryDark;
    this.ctx.beginPath();
    this.ctx.moveTo(frontX, frontY);
    this.ctx.lineTo(leftX, leftY);
    this.ctx.lineTo(leftX, leftY - h);
    this.ctx.lineTo(frontX, frontY - h);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Draw left face outline
    this.ctx.strokeStyle = palette.outline;
    this.ctx.stroke();
    
    // Draw top face
    this.ctx.fillStyle = palette.top;
    this.ctx.beginPath();
    this.ctx.moveTo(frontX, frontY - h);
    this.ctx.lineTo(leftX, leftY - h);
    this.ctx.lineTo(backX, backY - h);
    this.ctx.lineTo(rightX, rightY - h);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Draw top face outline
    this.ctx.strokeStyle = palette.outline;
    this.ctx.stroke();
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
    
    this.ctx.fillStyle = fillColor;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + width, y + width * skew);
    this.ctx.lineTo(x + width, y + width * skew - height);
    this.ctx.lineTo(x, y - height);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Window frame
    this.ctx.strokeStyle = frameColor;
    this.ctx.lineWidth = 0.5;
    this.ctx.stroke();
    
    // Window reflection highlight
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(x + 1, y - height + 2);
    this.ctx.lineTo(x + width * 0.4, y - height + 2 + width * 0.4 * skew);
    this.ctx.lineTo(x + width * 0.4, y - height * 0.5 + width * 0.4 * skew);
    this.ctx.lineTo(x + 1, y - height * 0.5);
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
  
  private drawRoof(
    config: ProceduralBuildingConfig,
    palette: ColorPalette,
    baseX: number,
    baseY: number
  ): void {
    const { floors, footprint, roofStyle = 'flat' } = config;
    const w = footprint.width * (CELL_WIDTH_PX / 2);
    const d = footprint.height * (CELL_WIDTH_PX / 2);
    const h = floors * FLOOR_HEIGHT_PX;
    
    const topY = baseY - h;
    
    if (roofStyle === 'peaked') {
      // Draw peaked roof
      const peakHeight = FLOOR_HEIGHT_PX * 0.8;
      const centerX = baseX - w / 2 + d / 2;
      const centerY = topY - w * 0.25 - d * 0.25;
      
      // Left roof slope
      this.ctx.fillStyle = palette.primaryDark;
      this.ctx.beginPath();
      this.ctx.moveTo(baseX, topY);
      this.ctx.lineTo(baseX - w, topY - w * 0.5);
      this.ctx.lineTo(centerX, centerY - peakHeight);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.strokeStyle = palette.outline;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      
      // Right roof slope
      this.ctx.fillStyle = palette.primaryLight;
      this.ctx.beginPath();
      this.ctx.moveTo(baseX, topY);
      this.ctx.lineTo(baseX + d, topY - d * 0.5);
      this.ctx.lineTo(centerX, centerY - peakHeight);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    } else if (roofStyle === 'terrace') {
      // Draw terrace with railing
      const railHeight = 4;
      
      // Left railing
      this.ctx.fillStyle = palette.accent;
      this.ctx.fillRect(baseX - w, topY - w * 0.5 - railHeight, 2, railHeight);
      this.ctx.fillRect(baseX - w * 0.5, topY - w * 0.25 - railHeight, 2, railHeight);
      this.ctx.fillRect(baseX, topY - railHeight, 2, railHeight);
      
      // Railing bar
      this.ctx.strokeStyle = palette.accent;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(baseX - w, topY - w * 0.5 - railHeight);
      this.ctx.lineTo(baseX, topY - railHeight);
      this.ctx.stroke();
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
  
  private drawAntenna(
    config: ProceduralBuildingConfig,
    palette: ColorPalette,
    baseX: number,
    baseY: number
  ): void {
    const { floors, footprint } = config;
    const w = footprint.width * (CELL_WIDTH_PX / 2);
    const d = footprint.height * (CELL_WIDTH_PX / 2);
    const h = floors * FLOOR_HEIGHT_PX;
    
    const antennaX = baseX - w / 2 + d / 2;
    const antennaY = baseY - h - w * 0.25 - d * 0.25;
    const antennaHeight = 20;
    
    // Antenna pole
    this.ctx.strokeStyle = PLASMA_COLORS.midGray;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(antennaX, antennaY);
    this.ctx.lineTo(antennaX, antennaY - antennaHeight);
    this.ctx.stroke();
    
    // Antenna top
    this.ctx.fillStyle = PLASMA_COLORS.coral;
    this.ctx.beginPath();
    this.ctx.arc(antennaX, antennaY - antennaHeight, 3, 0, Math.PI * 2);
    this.ctx.fill();
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
// Procedural configs for crypto-themed buildings
// These use crypto palettes and styles for consistent visual identity

export const CRYPTO_PROCEDURAL_BUILDINGS: Record<string, ProceduralBuildingConfig> = {
  // ---------------------------------------------------------------------------
  // DEFI PROTOCOL BUILDINGS
  // ---------------------------------------------------------------------------
  'proc-defi-tower': {
    id: 'proc-defi-tower',
    name: 'DeFi Tower',
    floors: 12,
    footprint: { width: 5, height: 5 },
    style: 'defi',
    palette: 'ethereum',
    windowDensity: 0.95,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  'proc-lending-hub': {
    id: 'proc-lending-hub',
    name: 'Lending Hub',
    floors: 8,
    footprint: { width: 6, height: 6 },
    style: 'defi',
    palette: 'aave',
    windowDensity: 0.85,
    roofStyle: 'flat',
    hasAntenna: true,
    groundFloorRetail: true,
  },
  'proc-staking-vault': {
    id: 'proc-staking-vault',
    name: 'Staking Vault',
    floors: 6,
    footprint: { width: 5, height: 5 },
    style: 'defi',
    palette: 'lido',
    windowDensity: 0.7,
    roofStyle: 'flat',
    features: [
      { type: 'pillar', position: 0.25 },
      { type: 'pillar', position: 0.75 },
    ],
  },
  'proc-dex-exchange': {
    id: 'proc-dex-exchange',
    name: 'DEX Exchange',
    floors: 5,
    footprint: { width: 4, height: 4 },
    style: 'defi',
    palette: 'uniswap',
    windowDensity: 0.9,
    roofStyle: 'flat',
    groundFloorRetail: true,
  },
  'proc-yield-factory': {
    id: 'proc-yield-factory',
    name: 'Yield Factory',
    floors: 4,
    footprint: { width: 4, height: 3 },
    style: 'defi',
    palette: 'pendle',
    windowDensity: 0.8,
    roofStyle: 'terrace',
    hasAntenna: true,
  },
  
  // ---------------------------------------------------------------------------
  // EXCHANGE BUILDINGS
  // ---------------------------------------------------------------------------
  'proc-cex-tower': {
    id: 'proc-cex-tower',
    name: 'CEX Tower',
    floors: 15,
    footprint: { width: 8, height: 8 },
    style: 'exchange',
    palette: 'coinbase',
    windowDensity: 0.95,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  'proc-trading-floor': {
    id: 'proc-trading-floor',
    name: 'Trading Floor',
    floors: 6,
    footprint: { width: 6, height: 5 },
    style: 'exchange',
    palette: 'binance',
    windowDensity: 0.9,
    roofStyle: 'flat',
    groundFloorRetail: true,
  },
  'proc-exchange-fortress': {
    id: 'proc-exchange-fortress',
    name: 'Exchange Fortress',
    floors: 8,
    footprint: { width: 6, height: 6 },
    style: 'exchange',
    palette: 'kraken',
    windowDensity: 0.7,
    roofStyle: 'flat',
    features: [
      { type: 'pillar', position: 0.2 },
      { type: 'pillar', position: 0.5 },
      { type: 'pillar', position: 0.8 },
    ],
  },
  'proc-perps-arena': {
    id: 'proc-perps-arena',
    name: 'Perps Arena',
    floors: 5,
    footprint: { width: 5, height: 5 },
    style: 'exchange',
    palette: 'gmx',
    windowDensity: 0.85,
    roofStyle: 'terrace',
    hasAntenna: true,
  },
  
  // ---------------------------------------------------------------------------
  // BLOCKCHAIN HQ BUILDINGS
  // ---------------------------------------------------------------------------
  'proc-chain-hq': {
    id: 'proc-chain-hq',
    name: 'Chain HQ',
    floors: 10,
    footprint: { width: 7, height: 7 },
    style: 'chain',
    palette: 'ethereum',
    windowDensity: 0.8,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  'proc-l2-tower': {
    id: 'proc-l2-tower',
    name: 'L2 Tower',
    floors: 8,
    footprint: { width: 6, height: 6 },
    style: 'chain',
    palette: 'arbitrum',
    windowDensity: 0.85,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  'proc-sol-campus': {
    id: 'proc-sol-campus',
    name: 'Sol Campus',
    floors: 6,
    footprint: { width: 7, height: 7 },
    style: 'chain',
    palette: 'solana',
    windowDensity: 0.75,
    roofStyle: 'terrace',
    groundFloorRetail: true,
  },
  'proc-btc-citadel': {
    id: 'proc-btc-citadel',
    name: 'BTC Citadel',
    floors: 12,
    footprint: { width: 8, height: 8 },
    style: 'chain',
    palette: 'bitcoin',
    windowDensity: 0.6,
    roofStyle: 'peaked',
    features: [
      { type: 'pillar', position: 0.15 },
      { type: 'pillar', position: 0.35 },
      { type: 'pillar', position: 0.65 },
      { type: 'pillar', position: 0.85 },
    ],
  },
  
  // ---------------------------------------------------------------------------
  // CT CULTURE BUILDINGS
  // ---------------------------------------------------------------------------
  'proc-podcast-studio': {
    id: 'proc-podcast-studio',
    name: 'Podcast Studio',
    floors: 3,
    footprint: { width: 3, height: 3 },
    style: 'ct',
    palette: 'podcast',
    windowDensity: 0.7,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  'proc-whale-penthouse': {
    id: 'proc-whale-penthouse',
    name: 'Whale Penthouse',
    floors: 8,
    footprint: { width: 4, height: 4 },
    style: 'ct',
    palette: 'ctWhale',
    windowDensity: 0.6,
    roofStyle: 'terrace',
    features: [
      { type: 'balcony', floor: 7, position: 0.5 },
    ],
  },
  'proc-degen-den': {
    id: 'proc-degen-den',
    name: 'Degen Den',
    floors: 3,
    footprint: { width: 3, height: 3 },
    style: 'ct',
    palette: 'ctDegen',
    windowDensity: 0.9,
    roofStyle: 'flat',
    hasAntenna: true,
  },
  'proc-alpha-hub': {
    id: 'proc-alpha-hub',
    name: 'Alpha Hub',
    floors: 5,
    footprint: { width: 4, height: 4 },
    style: 'ct',
    palette: 'ctInfluencer',
    windowDensity: 0.8,
    roofStyle: 'flat',
    groundFloorRetail: true,
  },
  
  // ---------------------------------------------------------------------------
  // MEME BUILDINGS (larger meme structures)
  // ---------------------------------------------------------------------------
  'proc-meme-temple': {
    id: 'proc-meme-temple',
    name: 'Meme Temple',
    floors: 4,
    footprint: { width: 4, height: 4 },
    style: 'meme',
    palette: 'pepe',
    windowDensity: 0.5,
    roofStyle: 'peaked',
    features: [
      { type: 'pillar', position: 0.25 },
      { type: 'pillar', position: 0.75 },
    ],
  },
  'proc-moon-base': {
    id: 'proc-moon-base',
    name: 'Moon Base',
    floors: 6,
    footprint: { width: 5, height: 5 },
    style: 'meme',
    palette: 'moon',
    windowDensity: 0.7,
    roofStyle: 'dome',
    hasAntenna: true,
  },
  'proc-diamond-vault': {
    id: 'proc-diamond-vault',
    name: 'Diamond Vault',
    floors: 3,
    footprint: { width: 3, height: 3 },
    style: 'meme',
    palette: 'diamondHands',
    windowDensity: 0.4,
    roofStyle: 'flat',
    features: [
      { type: 'pillar', position: 0.5 },
    ],
  },
  'proc-wagmi-cafe': {
    id: 'proc-wagmi-cafe',
    name: 'WAGMI Cafe',
    floors: 2,
    footprint: { width: 2, height: 2 },
    style: 'meme',
    palette: 'wagmi',
    windowDensity: 0.8,
    roofStyle: 'flat',
    groundFloorRetail: true,
  },
};

// Combined export of all procedural buildings
export const ALL_PROCEDURAL_BUILDINGS: Record<string, ProceduralBuildingConfig> = {
  ...PROCEDURAL_BUILDINGS,
  ...CRYPTO_PROCEDURAL_BUILDINGS,
};

