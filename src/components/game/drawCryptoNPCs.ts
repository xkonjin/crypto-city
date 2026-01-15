/**
 * CryptoNPC Drawing Utilities
 * 
 * Renders simulation NPCs from NPCManager on the game canvas.
 * These are the AI-driven NPCs with personalities, memories, and custom avatars.
 * 
 * Separate from decorative pedestrians (drawPedestrians.ts) which are simpler cosmetic entities.
 */

import { CryptoNPC, NPCDirection } from '@/games/isocity/types/npc';
import { NPCManager } from '@/lib/npc/NPCManager';
import { movementManager } from '@/lib/npc/movement';
import { gridToScreen } from './utils';
import { TILE_WIDTH, TILE_HEIGHT } from './types';
import {
  SPRITE_FRAME_WIDTH,
  SPRITE_FRAME_HEIGHT,
  getSpriteFrame,
} from '@/lib/ingestion/AvatarGenerator';

// LOD thresholds for CryptoNPCs
const LOD_SIMPLE_ZOOM = 0.5;   // Below this: dots only
const LOD_MEDIUM_ZOOM = 0.7;   // Below this: simple sprites
const LOD_FULL_ZOOM = 1.0;     // Above this: full detail + labels

// Sprite colors by sprite type
const SPRITE_COLORS: Record<string, string> = {
  apple: '#ff6b6b',
  banana: '#ffd93d',
  custom: '#9b59b6',
};

// Direction to sprite row mapping (matching avatar spritesheet layout)
const DIRECTION_ROW: Record<NPCDirection, number> = {
  south: 0,  // Row 1: facing viewer
  east: 1,   // Row 2: right
  west: 2,   // Row 3: left
  north: 3,  // Row 4: away
};

interface ViewBounds {
  viewLeft: number;
  viewTop: number;
  viewRight: number;
  viewBottom: number;
}

/**
 * Get visible CryptoNPCs (not inside buildings)
 */
function getVisibleCryptoNPCs(): CryptoNPC[] {
  return NPCManager.getAllNPCs().filter(npc => !npc.isInsideBuilding);
}

/**
 * Calculate interpolated screen position for an NPC
 * Uses movement progress for smooth animation between tiles
 */
function getInterpolatedPosition(npc: CryptoNPC): { screenX: number; screenY: number } {
  const progress = movementManager.getTileProgress(npc);
  const nextTile = movementManager.getNextTile(npc);
  
  // Get current tile screen position
  const current = gridToScreen(npc.gridX, npc.gridY, 0, 0);
  
  if (progress > 0 && nextTile) {
    // Interpolate between current and next tile
    const next = gridToScreen(nextTile.x, nextTile.y, 0, 0);
    return {
      screenX: current.screenX + (next.screenX - current.screenX) * progress + TILE_WIDTH / 2,
      screenY: current.screenY + (next.screenY - current.screenY) * progress + TILE_HEIGHT / 2,
    };
  }
  
  // Not moving, center on tile
  return {
    screenX: current.screenX + TILE_WIDTH / 2,
    screenY: current.screenY + TILE_HEIGHT / 2,
  };
}

/**
 * Draw a simple dot for very zoomed out view
 */
function drawSimpleNPC(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  color: string
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw NPC using basic shapes (medium LOD)
 */
function drawMediumNPC(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  npc: CryptoNPC,
  zoom: number
): void {
  const color = SPRITE_COLORS[npc.spriteType] || SPRITE_COLORS.custom;
  const scale = Math.max(0.5, zoom);
  
  // Body (oval)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y + 4 * scale, 6 * scale, 10 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Head (circle)
  ctx.fillStyle = '#ffd8b1'; // Skin tone
  ctx.beginPath();
  ctx.arc(x, y - 8 * scale, 5 * scale, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw NPC using custom avatar spritesheet
 */
function drawCustomAvatarNPC(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  npc: CryptoNPC,
  zoom: number,
  animFrame: number
): void {
  const profile = npc.ingestedProfile;
  if (!profile?.avatarSpritesheetImage) {
    // Fallback to medium LOD if avatar not loaded
    drawMediumNPC(ctx, x, y, npc, zoom);
    return;
  }
  
  const img = profile.avatarSpritesheetImage;
  const row = DIRECTION_ROW[npc.direction];
  const col = animFrame % 4; // 0-3 for idle/walk frames
  
  const srcX = col * SPRITE_FRAME_WIDTH;
  const srcY = row * SPRITE_FRAME_HEIGHT;
  
  // Scale sprite based on zoom
  const scale = Math.min(1.5, Math.max(0.7, zoom));
  const destW = SPRITE_FRAME_WIDTH * scale;
  const destH = SPRITE_FRAME_HEIGHT * scale;
  
  ctx.drawImage(
    img,
    srcX, srcY, SPRITE_FRAME_WIDTH, SPRITE_FRAME_HEIGHT,
    x - destW / 2, y - destH + 8, destW, destH
  );
}

/**
 * Draw NPC name label (high zoom only)
 */
function drawNameLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  name: string,
  isIngested: boolean
): void {
  const displayName = name.length > 12 ? name.substring(0, 10) + '...' : name;
  
  ctx.font = '10px monospace';
  const metrics = ctx.measureText(displayName);
  const padding = 2;
  const bgWidth = metrics.width + padding * 2;
  const bgHeight = 12;
  
  // Background
  ctx.fillStyle = isIngested ? 'rgba(155, 89, 182, 0.8)' : 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(x - bgWidth / 2, y - 32, bgWidth, bgHeight);
  
  // Text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(displayName, x, y - 22);
}

/**
 * Main draw function for CryptoNPCs
 * 
 * @param ctx Canvas 2D rendering context
 * @param viewBounds Visible area bounds for culling
 * @param zoom Current zoom level
 * @param animFrame Animation frame counter for walk cycles
 */
export function drawCryptoNPCs(
  ctx: CanvasRenderingContext2D,
  viewBounds: ViewBounds,
  zoom: number = 1.0,
  animFrame: number = 0
): void {
  const visibleNPCs = getVisibleCryptoNPCs();
  if (visibleNPCs.length === 0) return;
  
  // Determine LOD level
  const useSimpleLOD = zoom < LOD_SIMPLE_ZOOM;
  const useMediumLOD = zoom < LOD_MEDIUM_ZOOM;
  const showLabels = zoom >= LOD_FULL_ZOOM;
  
  for (const npc of visibleNPCs) {
    const { screenX, screenY } = getInterpolatedPosition(npc);
    
    // Viewport culling
    if (
      screenX < viewBounds.viewLeft - 50 ||
      screenX > viewBounds.viewRight + 50 ||
      screenY < viewBounds.viewTop - 50 ||
      screenY > viewBounds.viewBottom + 50
    ) {
      continue;
    }
    
    // Draw based on LOD level
    if (useSimpleLOD) {
      const color = SPRITE_COLORS[npc.spriteType] || SPRITE_COLORS.custom;
      drawSimpleNPC(ctx, screenX, screenY, color);
    } else if (useMediumLOD) {
      drawMediumNPC(ctx, screenX, screenY, npc, zoom);
    } else {
      // Full detail - use custom avatar if available
      if (npc.spriteType === 'custom' && npc.ingestedProfile?.avatarSpritesheetImage) {
        drawCustomAvatarNPC(ctx, screenX, screenY, npc, zoom, animFrame);
      } else {
        drawMediumNPC(ctx, screenX, screenY, npc, zoom);
      }
      
      // Draw name labels at high zoom
      if (showLabels) {
        const isIngested = !!npc.ingestedProfile;
        drawNameLabel(ctx, screenX, screenY, npc.name, isIngested);
      }
    }
  }
}

/**
 * Get count of visible CryptoNPCs (for debugging)
 */
export function getVisibleCryptoNPCCount(): number {
  return getVisibleCryptoNPCs().length;
}
