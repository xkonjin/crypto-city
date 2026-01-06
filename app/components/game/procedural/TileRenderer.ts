// Procedural Tile Renderer for Plasma-style isometric tiles
// Generates tiles with depth, corner pillars, and wireframe edges

import { TILE_WIDTH, TILE_HEIGHT, TileType } from '../types';
import { ColorPalette, PLASMA_COLORS, BUILDING_PALETTES, getPalette, lerpColor } from './ColorPalette';

// Tile depth (height of the 3D extrusion)
const TILE_DEPTH = 8;

// Pillar dimensions
const PILLAR_WIDTH = 4;
const PILLAR_HEIGHT = 12;

export interface TileRenderConfig {
  type: TileType;
  palette?: string;
  showPillars?: boolean;
  wireframe?: boolean;
  opacity?: number;
  gridPattern?: boolean;
  highlightEdges?: boolean;
}

export class TileRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tileCache: Map<string, string> = new Map();
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  /**
   * Generate a tile texture as a data URL
   */
  render(config: TileRenderConfig): string {
    const cacheKey = JSON.stringify(config);
    if (this.tileCache.has(cacheKey)) {
      return this.tileCache.get(cacheKey)!;
    }
    
    // Size canvas to fit tile with pillars and depth
    this.canvas.width = TILE_WIDTH + PILLAR_WIDTH * 2;
    this.canvas.height = TILE_HEIGHT + TILE_DEPTH + PILLAR_HEIGHT;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const palette = this.getPaletteForTile(config);
    const centerX = this.canvas.width / 2;
    const topY = PILLAR_HEIGHT;
    
    if (config.wireframe) {
      this.drawWireframeTile(centerX, topY, palette, config.opacity ?? 0.3);
    } else {
      this.drawSolidTile(centerX, topY, palette, config);
    }
    
    if (config.showPillars) {
      this.drawCornerPillars(centerX, topY);
    }
    
    const dataUrl = this.canvas.toDataURL('image/png');
    this.tileCache.set(cacheKey, dataUrl);
    return dataUrl;
  }
  
  /**
   * Generate and return the canvas directly for Phaser
   */
  renderToCanvas(config: TileRenderConfig): HTMLCanvasElement {
    this.render(config);
    const clone = document.createElement('canvas');
    clone.width = this.canvas.width;
    clone.height = this.canvas.height;
    const cloneCtx = clone.getContext('2d')!;
    cloneCtx.drawImage(this.canvas, 0, 0);
    return clone;
  }
  
  /**
   * Clear the tile cache
   */
  clearCache(): void {
    this.tileCache.clear();
  }
  
  private getPaletteForTile(config: TileRenderConfig): ColorPalette {
    if (config.palette) {
      return getPalette(config.palette);
    }
    
    switch (config.type) {
      case TileType.Grass:
        return BUILDING_PALETTES.tileGreen;
      case TileType.Road:
      case TileType.Asphalt:
        return BUILDING_PALETTES.tileGray;
      case TileType.Tile:
        return BUILDING_PALETTES.tileBeige;
      case TileType.Snow:
        return {
          primary: '#E8E8F0',
          primaryDark: '#C8C8D8',
          primaryLight: '#F8F8FF',
          top: '#FFFFFF',
          accent: PLASMA_COLORS.light,
          outline: '#B0B0C0',
        };
      default:
        return BUILDING_PALETTES.tileGreen;
    }
  }
  
  private drawSolidTile(
    centerX: number,
    topY: number,
    palette: ColorPalette,
    config: TileRenderConfig
  ): void {
    const halfWidth = TILE_WIDTH / 2;
    const halfHeight = TILE_HEIGHT / 2;
    
    // Draw depth sides
    // Right side (darker)
    this.ctx.fillStyle = palette.primaryDark;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, topY + TILE_HEIGHT / 2);
    this.ctx.lineTo(centerX + halfWidth, topY + halfHeight / 2);
    this.ctx.lineTo(centerX + halfWidth, topY + halfHeight / 2 + TILE_DEPTH);
    this.ctx.lineTo(centerX, topY + TILE_HEIGHT / 2 + TILE_DEPTH);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Left side (even darker)
    this.ctx.fillStyle = lerpColor(palette.primaryDark, '#000000', 0.15);
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, topY + TILE_HEIGHT / 2);
    this.ctx.lineTo(centerX - halfWidth, topY + halfHeight / 2);
    this.ctx.lineTo(centerX - halfWidth, topY + halfHeight / 2 + TILE_DEPTH);
    this.ctx.lineTo(centerX, topY + TILE_HEIGHT / 2 + TILE_DEPTH);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Draw top face (main tile surface)
    this.ctx.fillStyle = palette.top;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, topY);                          // Top
    this.ctx.lineTo(centerX + halfWidth, topY + halfHeight / 2);  // Right
    this.ctx.lineTo(centerX, topY + TILE_HEIGHT / 2);        // Bottom
    this.ctx.lineTo(centerX - halfWidth, topY + halfHeight / 2);  // Left
    this.ctx.closePath();
    this.ctx.fill();
    
    // Draw grid pattern if requested
    if (config.gridPattern) {
      this.drawGridPattern(centerX, topY, palette);
    }
    
    // Highlight edges if requested
    if (config.highlightEdges) {
      this.ctx.strokeStyle = palette.primaryLight;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, topY);
      this.ctx.lineTo(centerX + halfWidth, topY + halfHeight / 2);
      this.ctx.moveTo(centerX, topY);
      this.ctx.lineTo(centerX - halfWidth, topY + halfHeight / 2);
      this.ctx.stroke();
    }
    
    // Draw outline
    this.ctx.strokeStyle = palette.outline;
    this.ctx.lineWidth = 1.5;
    
    // Top face outline
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, topY);
    this.ctx.lineTo(centerX + halfWidth, topY + halfHeight / 2);
    this.ctx.lineTo(centerX, topY + TILE_HEIGHT / 2);
    this.ctx.lineTo(centerX - halfWidth, topY + halfHeight / 2);
    this.ctx.closePath();
    this.ctx.stroke();
    
    // Depth outline
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, topY + TILE_HEIGHT / 2);
    this.ctx.lineTo(centerX, topY + TILE_HEIGHT / 2 + TILE_DEPTH);
    this.ctx.moveTo(centerX + halfWidth, topY + halfHeight / 2);
    this.ctx.lineTo(centerX + halfWidth, topY + halfHeight / 2 + TILE_DEPTH);
    this.ctx.moveTo(centerX - halfWidth, topY + halfHeight / 2);
    this.ctx.lineTo(centerX - halfWidth, topY + halfHeight / 2 + TILE_DEPTH);
    this.ctx.stroke();
    
    // Bottom edge outline
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - halfWidth, topY + halfHeight / 2 + TILE_DEPTH);
    this.ctx.lineTo(centerX, topY + TILE_HEIGHT / 2 + TILE_DEPTH);
    this.ctx.lineTo(centerX + halfWidth, topY + halfHeight / 2 + TILE_DEPTH);
    this.ctx.stroke();
  }
  
  private drawWireframeTile(
    centerX: number,
    topY: number,
    palette: ColorPalette,
    opacity: number
  ): void {
    const halfWidth = TILE_WIDTH / 2;
    const halfHeight = TILE_HEIGHT / 2;
    
    this.ctx.globalAlpha = opacity;
    
    // Draw wireframe outline only
    this.ctx.strokeStyle = palette.outline;
    this.ctx.lineWidth = 1;
    
    // Top face outline
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, topY);
    this.ctx.lineTo(centerX + halfWidth, topY + halfHeight / 2);
    this.ctx.lineTo(centerX, topY + TILE_HEIGHT / 2);
    this.ctx.lineTo(centerX - halfWidth, topY + halfHeight / 2);
    this.ctx.closePath();
    this.ctx.stroke();
    
    // Depth lines (just corners)
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, topY + TILE_HEIGHT / 2);
    this.ctx.lineTo(centerX, topY + TILE_HEIGHT / 2 + TILE_DEPTH);
    this.ctx.moveTo(centerX + halfWidth, topY + halfHeight / 2);
    this.ctx.lineTo(centerX + halfWidth, topY + halfHeight / 2 + TILE_DEPTH);
    this.ctx.moveTo(centerX - halfWidth, topY + halfHeight / 2);
    this.ctx.lineTo(centerX - halfWidth, topY + halfHeight / 2 + TILE_DEPTH);
    this.ctx.stroke();
    
    // Bottom edge
    this.ctx.beginPath();
    this.ctx.moveTo(centerX - halfWidth, topY + halfHeight / 2 + TILE_DEPTH);
    this.ctx.lineTo(centerX, topY + TILE_HEIGHT / 2 + TILE_DEPTH);
    this.ctx.lineTo(centerX + halfWidth, topY + halfHeight / 2 + TILE_DEPTH);
    this.ctx.stroke();
    
    this.ctx.globalAlpha = 1;
  }
  
  private drawGridPattern(
    centerX: number,
    topY: number,
    palette: ColorPalette
  ): void {
    const halfWidth = TILE_WIDTH / 2;
    const halfHeight = TILE_HEIGHT / 2;
    
    this.ctx.strokeStyle = palette.primaryDark;
    this.ctx.lineWidth = 0.5;
    this.ctx.globalAlpha = 0.3;
    
    // Draw diagonal grid lines (matching the beige floor pattern from animations)
    const gridSpacing = 6;
    
    // Lines going from top-right to bottom-left
    for (let i = 1; i < 4; i++) {
      const offset = i * gridSpacing;
      this.ctx.beginPath();
      // Start from top edge, go to left edge
      const startX = centerX + offset * 0.5;
      const startY = topY + offset * 0.25;
      const endX = centerX - halfWidth + offset * 0.5;
      const endY = topY + halfHeight / 2 + offset * 0.25;
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
    
    // Lines going from top-left to bottom-right
    for (let i = 1; i < 4; i++) {
      const offset = i * gridSpacing;
      this.ctx.beginPath();
      const startX = centerX - offset * 0.5;
      const startY = topY + offset * 0.25;
      const endX = centerX + halfWidth - offset * 0.5;
      const endY = topY + halfHeight / 2 + offset * 0.25;
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
  }
  
  private drawCornerPillars(centerX: number, topY: number): void {
    const halfWidth = TILE_WIDTH / 2;
    const halfHeight = TILE_HEIGHT / 2;
    
    // Pillar positions (at corners of the tile)
    const corners = [
      { x: centerX, y: topY },                              // Top
      { x: centerX + halfWidth, y: topY + halfHeight / 2 }, // Right
      { x: centerX, y: topY + TILE_HEIGHT / 2 },            // Bottom
      { x: centerX - halfWidth, y: topY + halfHeight / 2 }, // Left
    ];
    
    for (const corner of corners) {
      this.drawPillar(corner.x, corner.y);
    }
  }
  
  private drawPillar(x: number, y: number): void {
    const pw = PILLAR_WIDTH;
    const ph = PILLAR_HEIGHT;
    
    // Pillar body (white/light)
    this.ctx.fillStyle = PLASMA_COLORS.light;
    
    // Front face
    this.ctx.fillRect(x - pw / 2, y - ph, pw, ph);
    
    // Left face (slightly darker)
    this.ctx.fillStyle = '#E0E0E0';
    this.ctx.beginPath();
    this.ctx.moveTo(x - pw / 2, y);
    this.ctx.lineTo(x - pw / 2 - pw / 4, y - pw / 8);
    this.ctx.lineTo(x - pw / 2 - pw / 4, y - ph - pw / 8);
    this.ctx.lineTo(x - pw / 2, y - ph);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Top face
    this.ctx.fillStyle = '#F8F8F8';
    this.ctx.beginPath();
    this.ctx.moveTo(x - pw / 2, y - ph);
    this.ctx.lineTo(x - pw / 2 - pw / 4, y - ph - pw / 8);
    this.ctx.lineTo(x + pw / 2 - pw / 4, y - ph - pw / 8);
    this.ctx.lineTo(x + pw / 2, y - ph);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Outline
    this.ctx.strokeStyle = PLASMA_COLORS.lightGray;
    this.ctx.lineWidth = 0.5;
    this.ctx.strokeRect(x - pw / 2, y - ph, pw, ph);
  }
  
  /**
   * Render a road tile with proper markings
   */
  renderRoad(connections: { north: boolean; south: boolean; east: boolean; west: boolean }): string {
    const cacheKey = `road-${connections.north}-${connections.south}-${connections.east}-${connections.west}`;
    if (this.tileCache.has(cacheKey)) {
      return this.tileCache.get(cacheKey)!;
    }
    
    // First render base tile
    this.canvas.width = TILE_WIDTH + PILLAR_WIDTH * 2;
    this.canvas.height = TILE_HEIGHT + TILE_DEPTH + PILLAR_HEIGHT;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const palette = BUILDING_PALETTES.tileGray;
    const centerX = this.canvas.width / 2;
    const topY = PILLAR_HEIGHT;
    
    this.drawSolidTile(centerX, topY, palette, { type: TileType.Road });
    
    // Draw road markings
    this.drawRoadMarkings(centerX, topY, connections);
    
    const dataUrl = this.canvas.toDataURL('image/png');
    this.tileCache.set(cacheKey, dataUrl);
    return dataUrl;
  }
  
  private drawRoadMarkings(
    centerX: number,
    topY: number,
    connections: { north: boolean; south: boolean; east: boolean; west: boolean }
  ): void {
    this.ctx.strokeStyle = PLASMA_COLORS.light;
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([3, 3]);
    
    const halfWidth = TILE_WIDTH / 2;
    const halfHeight = TILE_HEIGHT / 2;
    const centerTileY = topY + TILE_HEIGHT / 4;
    
    // Draw center lines based on connections
    if (connections.north || connections.south) {
      // Vertical road (in isometric: from top-left to bottom-right)
      this.ctx.beginPath();
      this.ctx.moveTo(centerX - halfWidth / 2, centerTileY);
      this.ctx.lineTo(centerX + halfWidth / 2, centerTileY + halfHeight / 2);
      this.ctx.stroke();
    }
    
    if (connections.east || connections.west) {
      // Horizontal road (in isometric: from top-right to bottom-left)
      this.ctx.beginPath();
      this.ctx.moveTo(centerX + halfWidth / 2, centerTileY - halfHeight / 4);
      this.ctx.lineTo(centerX - halfWidth / 2, centerTileY + halfHeight / 4);
      this.ctx.stroke();
    }
    
    this.ctx.setLineDash([]);
  }
}

// Singleton instance
let rendererInstance: TileRenderer | null = null;

export function getTileRenderer(): TileRenderer {
  if (!rendererInstance) {
    rendererInstance = new TileRenderer();
  }
  return rendererInstance;
}

// Pre-generate common tile configurations
export function preloadTiles(): Map<string, string> {
  const renderer = getTileRenderer();
  const tiles = new Map<string, string>();
  
  // Standard tiles
  tiles.set('grass', renderer.render({ type: TileType.Grass, showPillars: false, gridPattern: true }));
  tiles.set('grass-pillars', renderer.render({ type: TileType.Grass, showPillars: true, gridPattern: true }));
  tiles.set('road', renderer.render({ type: TileType.Road }));
  tiles.set('asphalt', renderer.render({ type: TileType.Asphalt }));
  tiles.set('tile', renderer.render({ type: TileType.Tile, gridPattern: true }));
  tiles.set('snow', renderer.render({ type: TileType.Snow }));
  
  // Wireframe tiles for edges
  tiles.set('wireframe', renderer.render({ type: TileType.Grass, wireframe: true, opacity: 0.3 }));
  tiles.set('wireframe-light', renderer.render({ type: TileType.Grass, wireframe: true, opacity: 0.15 }));
  
  return tiles;
}

