/**
 * Canvas tile rendering functions
 * Issue #66 - Module extraction from CanvasIsometricGrid.tsx
 */

import { Tile, BuildingType } from '@/types/game';
import { TILE_WIDTH, TILE_HEIGHT } from '@/components/game/types';
import { getBuildingSize, requiresWaterAdjacency } from '@/lib/simulation';
import { getCachedImage } from '@/components/game/imageLoader';
import { drawPlaceholderBuilding } from '@/components/game/placeholders';
import { getActiveSpritePack, BUILDING_TO_SPRITE } from '@/lib/renderConfig';
import {
  selectSpriteSource,
  calculateSpriteCoords,
  calculateSpriteScale,
  calculateSpriteOffsets,
} from '@/components/game/buildingSprite';
import { drawFoundationPlot, drawGreenBaseTile, drawGreyBaseTile } from '@/components/game/drawing';
import { drawRoad, RoadDrawingOptions } from '@/components/game/roadDrawing';
import { drawBridgeTile, drawSuspensionBridgeTowers, drawSuspensionBridgeOverlay } from '@/components/game/bridgeDrawing';
import { WATER_ASSET_PATH } from '@/components/game/constants';

/**
 * Tile metadata for rendering decisions (cached per-tile)
 */
export interface TileRenderMetadata {
  needsGreyBase: boolean;
  needsGreenBaseOverWater: boolean;
  needsGreenBaseForPark: boolean;
  isPartOfParkBuilding: boolean;
  isAdjacentToWater: boolean;
  hasAdjacentRoad: boolean;
  shouldFlipForRoad: boolean;
}

/**
 * Draw the isometric diamond base tile
 */
export function drawIsometricTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tile: Tile,
  highlight: boolean,
  currentZoom: number,
  tileMetadata: TileRenderMetadata | null,
  skipGreyBase: boolean = false,
  skipGreenBase: boolean = false
): void {
  const w = TILE_WIDTH;
  const h = TILE_HEIGHT;
  
  // Determine tile colors (top face and shading)
  let topColor = '#4a7c3f'; // grass
  let strokeColor = '#2d4a26';

  const isPark = tileMetadata?.isPartOfParkBuilding || 
    ['park', 'park_large', 'tennis', 'basketball_courts', 'playground_small',
     'playground_large', 'baseball_field_small', 'soccer_field_small', 'football_field',
     'skate_park', 'mini_golf_course', 'bleachers_field', 'go_kart_track', 'amphitheater', 
     'greenhouse_garden', 'animal_pens_farm', 'cabin_house', 'campground', 'marina_docks_small', 
     'pier_large', 'roller_coaster_small', 'community_garden', 'pond_park', 'park_gate', 
     'mountain_lodge', 'mountain_trailhead'].includes(tile.building.type);
  const hasGreyBase = tileMetadata?.needsGreyBase ?? false;
  
  if (tile.building.type === 'water') {
    topColor = '#2563eb';
    strokeColor = '#1e3a8a';
  } else if (tile.building.type === 'road' || tile.building.type === 'bridge') {
    topColor = '#4a4a4a';
    strokeColor = '#333';
  } else if (isPark) {
    topColor = '#4a7c3f';
    strokeColor = '#2d4a26';
  } else if (hasGreyBase && !skipGreyBase) {
    // Grey/concrete base tiles for ALL buildings (except parks)
    topColor = '#6b7280';
    strokeColor = '#374151';
  } else if (tile.zone === 'residential') {
    if (tile.building.type !== 'grass' && tile.building.type !== 'empty') {
      topColor = '#3d7c3f';
    } else {
      topColor = '#2d5a2d';
    }
    strokeColor = '#22c55e';
  } else if (tile.zone === 'commercial') {
    if (tile.building.type !== 'grass' && tile.building.type !== 'empty') {
      topColor = '#3a5c7c';
    } else {
      topColor = '#2a4a6a';
    }
    strokeColor = '#3b82f6';
  } else if (tile.zone === 'industrial') {
    if (tile.building.type !== 'grass' && tile.building.type !== 'empty') {
      topColor = '#7c5c3a';
    } else {
      topColor = '#6a4a2a';
    }
    strokeColor = '#f59e0b';
  }
  
  // Skip drawing green base for tiles adjacent to water or bridge tiles
  const shouldSkipDrawing = (skipGreenBase && (tile.building.type === 'grass' || tile.building.type === 'empty' || tile.building.type === 'tree')) || 
                            tile.building.type === 'bridge';
  
  // Draw the isometric diamond (top face)
  if (!shouldSkipDrawing) {
    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();
    ctx.fill();
    
    // Draw grid lines only when zoomed in (hide when zoom < 0.6)
    if (currentZoom >= 0.6) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    
    // Draw zone border with dashed line
    if (tile.zone !== 'none' && 
        currentZoom >= 0.95 &&
        (tile.building.type === 'grass' || tile.building.type === 'empty')) {
      ctx.strokeStyle = tile.zone === 'residential' ? '#22c55e' : 
                        tile.zone === 'commercial' ? '#3b82f6' : '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  
  // Highlight on hover/select
  if (highlight) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/**
 * Draw water tile at a given screen position
 */
export function drawWaterTileAt(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  gridX: number,
  gridY: number
): void {
  const waterImage = getCachedImage(WATER_ASSET_PATH);
  if (!waterImage) return;
  
  const w = TILE_WIDTH;
  const h = TILE_HEIGHT;
  const tileCenterX = screenX + w / 2;
  const tileCenterY = screenY + h / 2;
  
  const imgW = waterImage.naturalWidth || waterImage.width;
  const imgH = waterImage.naturalHeight || waterImage.height;
  
  // Deterministic "random" offset based on tile position
  const seedX = ((gridX * 7919 + gridY * 6271) % 1000) / 1000;
  const seedY = ((gridX * 4177 + gridY * 9311) % 1000) / 1000;
  
  const cropScale = 0.35;
  const cropW = imgW * cropScale;
  const cropH = imgH * cropScale;
  const maxOffsetX = imgW - cropW;
  const maxOffsetY = imgH - cropH;
  const srcX = seedX * maxOffsetX;
  const srcY = seedY * maxOffsetY;
  
  ctx.save();
  // Clip to isometric diamond shape
  ctx.beginPath();
  ctx.moveTo(screenX + w / 2, screenY);
  ctx.lineTo(screenX + w, screenY + h / 2);
  ctx.lineTo(screenX + w / 2, screenY + h);
  ctx.lineTo(screenX, screenY + h / 2);
  ctx.closePath();
  ctx.clip();
  
  const aspectRatio = cropH / cropW;
  const jitterX = (seedX - 0.5) * w * 0.3;
  const jitterY = (seedY - 0.5) * h * 0.3;
  
  const destWidth = w * 1.15;
  const destHeight = destWidth * aspectRatio;
  
  ctx.globalAlpha = 0.95;
  ctx.drawImage(
    waterImage,
    srcX, srcY, cropW, cropH,
    Math.round(tileCenterX - destWidth / 2 + jitterX * 0.3),
    Math.round(tileCenterY - destHeight / 2 + jitterY * 0.3),
    Math.round(destWidth),
    Math.round(destHeight)
  );
  
  ctx.restore();
}

/**
 * Draw a building sprite at the given position
 */
export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tile: Tile,
  zoom: number,
  grid: Tile[][],
  gridSize: number,
  roadDrawingOptions: RoadDrawingOptions,
  getTileMetadata: (x: number, y: number) => TileRenderMetadata | null
): void {
  const buildingType = tile.building.type;
  const placeholderBuildingType = buildingType === 'crypto_building' && tile.building.cryptoBuildingId 
    ? tile.building.cryptoBuildingId 
    : buildingType;
  const w = TILE_WIDTH;
  const h = TILE_HEIGHT;
  
  // Handle roads separately with adjacency
  if (buildingType === 'road') {
    drawRoad(ctx, x, y, tile.x, tile.y, zoom, roadDrawingOptions);
    return;
  }
  
  // Handle bridges with special rendering
  if (buildingType === 'bridge') {
    drawBridgeTile(ctx, x, y, tile.building, tile.x, tile.y, zoom);
    return;
  }
  
  // Draw water tiles underneath marina/pier buildings
  if (buildingType === 'marina_docks_small' || buildingType === 'pier_large') {
    const buildingSize = getBuildingSize(buildingType);
    for (let dx = 0; dx < buildingSize.width; dx++) {
      for (let dy = 0; dy < buildingSize.height; dy++) {
        const tileGridX = tile.x + dx;
        const tileGridY = tile.y + dy;
        // Use inline calculation instead of importing gridToScreen to avoid circular deps
        const screenX = (tileGridX - tileGridY) * (w / 2);
        const screenY = (tileGridX + tileGridY) * (h / 2);
        drawWaterTileAt(ctx, screenX, screenY, tileGridX, tileGridY);
      }
    }
  }
  
  const activePack = getActiveSpritePack();
  const hasTileSprite = BUILDING_TO_SPRITE[buildingType] || 
    (activePack.parksBuildings && activePack.parksBuildings[buildingType]) ||
    (activePack.stationsVariants && activePack.stationsVariants[buildingType]);
  
  if (hasTileSprite) {
    // Handle water tiles specially
    if (buildingType === 'water') {
      drawWaterBuilding(ctx, x, y, tile, grid, gridSize, zoom);
      return;
    }
    
    // Check if building is under construction
    const isUnderConstruction = tile.building.constructionProgress !== undefined &&
                                 tile.building.constructionProgress < 100;
    const constructionProgress = tile.building.constructionProgress ?? 100;
    const isFoundationPhase = isUnderConstruction && constructionProgress < 40;
    
    if (isFoundationPhase) {
      const buildingSize = getBuildingSize(buildingType);
      if (buildingSize.width > 1 || buildingSize.height > 1) {
        for (let dy = 0; dy < buildingSize.height; dy++) {
          for (let dx = 0; dx < buildingSize.width; dx++) {
            const plotX = x + (dx - dy) * (w / 2);
            const plotY = y + (dx + dy) * (h / 2);
            drawFoundationPlot(ctx, plotX, plotY, w, h, zoom);
          }
        }
      } else {
        drawFoundationPlot(ctx, x, y, w, h, zoom);
      }
      return;
    }
    
    // Use extracted utilities to draw sprite
    const spriteSourceInfo = selectSpriteSource(buildingType, tile.building, tile.x, tile.y, activePack);
    const filteredSpriteSheet = getCachedImage(spriteSourceInfo.source, true) || getCachedImage(spriteSourceInfo.source);
    
    if (filteredSpriteSheet) {
      const sheetWidth = filteredSpriteSheet.naturalWidth || filteredSpriteSheet.width;
      const sheetHeight = filteredSpriteSheet.naturalHeight || filteredSpriteSheet.height;
      
      const coords = calculateSpriteCoords(buildingType, spriteSourceInfo, sheetWidth, sheetHeight, activePack);
      
      if (coords) {
        const scaleMultiplier = calculateSpriteScale(buildingType, spriteSourceInfo, tile.building, activePack);
        const offsets = calculateSpriteOffsets(buildingType, spriteSourceInfo, tile.building, activePack);
        
        const buildingSize = getBuildingSize(buildingType);
        const isMultiTile = buildingSize.width > 1 || buildingSize.height > 1;
        
        let drawPosX = x;
        let drawPosY = y;
        
        if (isMultiTile) {
          const frontmostOffsetX = buildingSize.width - 1;
          const frontmostOffsetY = buildingSize.height - 1;
          const screenOffsetX = (frontmostOffsetX - frontmostOffsetY) * (w / 2);
          const screenOffsetY = (frontmostOffsetX + frontmostOffsetY) * (h / 2);
          drawPosX = x + screenOffsetX;
          drawPosY = y + screenOffsetY;
        }
        
        const destWidth = w * 1.2 * scaleMultiplier;
        const aspectRatio = coords.sh / coords.sw;
        const destHeight = destWidth * aspectRatio;
        
        const drawX = drawPosX + w / 2 - destWidth / 2 + offsets.horizontal * w;
        
        let verticalPush: number;
        if (isMultiTile) {
          const footprintDepth = buildingSize.width + buildingSize.height - 2;
          verticalPush = footprintDepth * h * 0.25;
        } else {
          verticalPush = destHeight * 0.15;
        }
        verticalPush += offsets.vertical * h;
        
        const drawY = drawPosY + h - destHeight + verticalPush;
        
        // Determine flip based on road adjacency or random
        const isWaterfrontAsset = requiresWaterAdjacency(buildingType);
        const shouldRoadMirror = (() => {
          if (isWaterfrontAsset) return false;
          
          const originMetadata = getTileMetadata(tile.x, tile.y);
          if (originMetadata?.hasAdjacentRoad) {
            return originMetadata.shouldFlipForRoad;
          }
          
          const mirrorSeed = (tile.x * 47 + tile.y * 83) % 100;
          return mirrorSeed < 50;
        })();
        
        const baseFlipped = tile.building.flipped === true;
        const isFlipped = baseFlipped !== shouldRoadMirror;
        
        if (isFlipped) {
          ctx.save();
          const centerX = Math.round(drawX + destWidth / 2);
          ctx.translate(centerX, 0);
          ctx.scale(-1, 1);
          ctx.translate(-centerX, 0);
          
          ctx.drawImage(
            filteredSpriteSheet,
            coords.sx, coords.sy, coords.sw, coords.sh,
            Math.round(drawX), Math.round(drawY),
            Math.round(destWidth), Math.round(destHeight)
          );
          
          ctx.restore();
        } else {
          ctx.drawImage(
            filteredSpriteSheet,
            coords.sx, coords.sy, coords.sw, coords.sh,
            Math.round(drawX), Math.round(drawY),
            Math.round(destWidth), Math.round(destHeight)
          );
        }
      } else {
        drawPlaceholderBuilding(ctx, x, y, placeholderBuildingType, w, h);
      }
    } else {
      drawPlaceholderBuilding(ctx, x, y, placeholderBuildingType, w, h);
    }
  } else {
    drawPlaceholderBuilding(ctx, x, y, placeholderBuildingType, w, h);
  }
  
  // Draw fire effect
  if (tile.building.onFire) {
    const fireX = x + w / 2;
    const fireY = y - 10;
    
    ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(fireX, fireY, 18, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
    ctx.beginPath();
    ctx.ellipse(fireX, fireY + 5, 10, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
    ctx.beginPath();
    ctx.ellipse(fireX, fireY + 8, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw water building with blending
 */
function drawWaterBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tile: Tile,
  grid: Tile[][],
  gridSize: number,
  zoom: number
): void {
  const waterImage = getCachedImage(WATER_ASSET_PATH);
  const w = TILE_WIDTH;
  const h = TILE_HEIGHT;
  
  const gridX = tile.x;
  const gridY = tile.y;
  const adjacentWater = {
    north: gridX > 0 && grid[gridY]?.[gridX - 1]?.building.type === 'water',
    east: gridY > 0 && grid[gridY - 1]?.[gridX]?.building.type === 'water',
    south: gridX < gridSize - 1 && grid[gridY]?.[gridX + 1]?.building.type === 'water',
    west: gridY < gridSize - 1 && grid[gridY + 1]?.[gridX]?.building.type === 'water',
  };
  
  const adjacentCount = (adjacentWater.north ? 1 : 0) + (adjacentWater.east ? 1 : 0) + 
                       (adjacentWater.south ? 1 : 0) + (adjacentWater.west ? 1 : 0);
  
  if (waterImage) {
    const tileCenterX = x + w / 2;
    const tileCenterY = y + h / 2;
    
    const imgW = waterImage.naturalWidth || waterImage.width;
    const imgH = waterImage.naturalHeight || waterImage.height;
    
    const seedX = ((gridX * 7919 + gridY * 6271) % 1000) / 1000;
    const seedY = ((gridX * 4177 + gridY * 9311) % 1000) / 1000;
    
    const cropScale = 0.35;
    const cropW = imgW * cropScale;
    const cropH = imgH * cropScale;
    const maxOffsetX = imgW - cropW;
    const maxOffsetY = imgH - cropH;
    const srcX = seedX * maxOffsetX;
    const srcY = seedY * maxOffsetY;
    
    const expand = w * 0.4;
    const topExpand = (adjacentWater.north && adjacentWater.east) ? expand * 0.3 : 0;
    const rightExpand = (adjacentWater.east && adjacentWater.south) ? expand * 0.3 : 0;
    const bottomExpand = (adjacentWater.south && adjacentWater.west) ? expand * 0.3 : 0;
    const leftExpand = (adjacentWater.west && adjacentWater.north) ? expand * 0.3 : 0;
    
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - topExpand);
    ctx.lineTo(x + w + rightExpand, y + h / 2);
    ctx.lineTo(x + w / 2, y + h + bottomExpand);
    ctx.lineTo(x - leftExpand, y + h / 2);
    ctx.closePath();
    ctx.clip();
    
    const aspectRatio = cropH / cropW;
    const savedAlpha = ctx.globalAlpha;
    const jitterX = (seedX - 0.5) * w * 0.3;
    const jitterY = (seedY - 0.5) * h * 0.3;
    
    if (zoom < 0.5) {
      const destWidth = w * 1.15;
      const destHeight = destWidth * aspectRatio;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(
        waterImage,
        srcX, srcY, cropW, cropH,
        Math.round(tileCenterX - destWidth / 2),
        Math.round(tileCenterY - destHeight / 2),
        Math.round(destWidth),
        Math.round(destHeight)
      );
    } else if (adjacentCount >= 2) {
      const outerScale = 2.0 + adjacentCount * 0.3;
      const outerWidth = w * outerScale;
      const outerHeight = outerWidth * aspectRatio;
      ctx.globalAlpha = 0.35;
      ctx.drawImage(
        waterImage,
        srcX, srcY, cropW, cropH,
        Math.round(tileCenterX - outerWidth / 2 + jitterX),
        Math.round(tileCenterY - outerHeight / 2 + jitterY),
        Math.round(outerWidth),
        Math.round(outerHeight)
      );
      
      const coreScale = 1.1;
      const coreWidth = w * coreScale;
      const coreHeight = coreWidth * aspectRatio;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(
        waterImage,
        srcX, srcY, cropW, cropH,
        Math.round(tileCenterX - coreWidth / 2 + jitterX * 0.5),
        Math.round(tileCenterY - coreHeight / 2 + jitterY * 0.5),
        Math.round(coreWidth),
        Math.round(coreHeight)
      );
    } else {
      const destWidth = w * 1.15;
      const destHeight = destWidth * aspectRatio;
      
      ctx.globalAlpha = 0.95;
      ctx.drawImage(
        waterImage,
        srcX, srcY, cropW, cropH,
        Math.round(tileCenterX - destWidth / 2 + jitterX * 0.3),
        Math.round(tileCenterY - destHeight / 2 + jitterY * 0.3),
        Math.round(destWidth),
        Math.round(destHeight)
      );
    }
    
    ctx.globalAlpha = savedAlpha;
    ctx.restore();
  } else {
    // Water image not loaded yet - draw placeholder diamond
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w / 2, y + h);
    ctx.lineTo(x, y + h / 2);
    ctx.closePath();
    ctx.fill();
  }
}

// Re-export base tile drawing functions
export { drawGreenBaseTile, drawGreyBaseTile, drawFoundationPlot } from '@/components/game/drawing';
export { drawRoad } from '@/components/game/roadDrawing';
export { drawBridgeTile, drawSuspensionBridgeTowers, drawSuspensionBridgeOverlay } from '@/components/game/bridgeDrawing';
export { drawRailTrack, drawRailTracksOnly, drawRailroadCrossing } from '@/components/game/railSystem';
