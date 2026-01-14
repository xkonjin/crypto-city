/**
 * useTitanRenderer Hook
 * 
 * Integrates Titan sprite rendering with the canvas system.
 * Provides methods to render the Titan pet on the isometric grid.
 * 
 * Issue #154: Titan sprite rendering integration
 */

'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useTitan } from '@/hooks/useTitan';
import {
  TitanSpriteLoader,
  TitanAnimationState,
  createPlaceholderSprite,
  placeholderToImage,
  getTitanSpritePath,
} from '@/lib/titan/TitanSprite';
import { getAlignmentState } from '@/lib/titan/TitanAlignment';
import type { TitanPet, AlignmentState } from '@/games/isocity/types/titan';

// Isometric conversion constants (should match CanvasIsometricGrid)
const TILE_WIDTH = 64;
const HEIGHT_RATIO = 0.6;
const TILE_HEIGHT = TILE_WIDTH * HEIGHT_RATIO;

// Titan sprite dimensions
const TITAN_SPRITE_WIDTH = 64;
const TITAN_SPRITE_HEIGHT = 80;
const TITAN_Y_OFFSET = -40; // Offset to place Titan feet on the ground

export interface TitanRenderData {
  screenX: number;
  screenY: number;
  sprite: HTMLImageElement | null;
  direction: string;
  animation: string;
  alignment: string;
  isVisible: boolean;
}

export interface UseTitanRendererReturn {
  /** Whether a Titan exists to render */
  hasTitan: boolean;
  /** Current Titan data */
  titan: TitanPet | null;
  /** Get render data for current frame */
  getRenderData: (viewportOffset: { x: number; y: number }, zoom: number) => TitanRenderData | null;
  /** Render the Titan to a canvas context */
  renderTitan: (
    ctx: CanvasRenderingContext2D,
    viewportOffset: { x: number; y: number },
    zoom: number
  ) => void;
  /** Preload sprites for the current Titan */
  preloadSprites: () => Promise<void>;
  /** Get the depth value for z-ordering */
  getDepth: () => number;
}

/**
 * Convert grid position to screen position (isometric)
 */
function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2),
    y: (gridX + gridY) * (TILE_HEIGHT / 2),
  };
}

/**
 * Calculate depth for z-ordering (entities closer to bottom-right render on top)
 */
function calculateDepth(gridX: number, gridY: number): number {
  return (gridX + gridY) * 0.1 + 0.2; // NPCs use 0.2 base
}

export function useTitanRenderer(): UseTitanRendererReturn {
  const { titan, hasTitan } = useTitan();
  
  // Sprite loader instance
  const spriteLoaderRef = useRef<TitanSpriteLoader | null>(null);
  
  // Animation state
  const animationStateRef = useRef<TitanAnimationState | null>(null);
  
  // Placeholder sprite cache
  const placeholderRef = useRef<HTMLImageElement | null>(null);
  
  // Initialize sprite loader
  useEffect(() => {
    if (typeof window !== 'undefined' && !spriteLoaderRef.current) {
      spriteLoaderRef.current = new TitanSpriteLoader();
    }
  }, []);
  
  // Initialize animation state when Titan changes
  useEffect(() => {
    if (titan && !animationStateRef.current) {
      animationStateRef.current = new TitanAnimationState(
        'idle',
        titan.direction as 'north' | 'south' | 'east' | 'west'
      );
    }
  }, [titan]);
  
  // Update animation state
  useEffect(() => {
    if (titan && animationStateRef.current) {
      // Map Titan activity to animation
      const activityToAnimation: Record<string, string> = {
        idle: 'idle',
        walking: 'walk',
        running: 'run',
        eating: 'eat',
        sleeping: 'sleep',
        sitting: 'sit',
        playing: 'happy',
        learning: 'learn',
        helping: 'help_npc',
      };
      
      const activity = titan.currentActivity || 'idle';
      const animation = activityToAnimation[activity] || 'idle';
      animationStateRef.current.setAnimation(animation as Parameters<TitanAnimationState['setAnimation']>[0]);
      animationStateRef.current.setDirection(titan.direction as 'north' | 'south' | 'east' | 'west');
    }
  }, [titan, titan?.currentActivity, titan?.direction]);
  
  // Preload sprites
  const preloadSprites = useCallback(async () => {
    if (!titan || !spriteLoaderRef.current) return;
    
    const alignment = getAlignmentState(titan.alignment);
    await spriteLoaderRef.current.preloadCurrentAlignment(titan.species, alignment);
  }, [titan]);
  
  // Create or get placeholder sprite
  const getPlaceholder = useCallback((): HTMLImageElement | null => {
    if (!titan) return null;
    
    if (!placeholderRef.current) {
      const alignment = getAlignmentState(titan.alignment);
      const canvas = createPlaceholderSprite(titan.species, alignment, TITAN_SPRITE_WIDTH);
      placeholderRef.current = placeholderToImage(canvas);
    }
    
    return placeholderRef.current;
  }, [titan]);
  
  // Get current sprite
  const getCurrentSprite = useCallback((): HTMLImageElement | null => {
    if (!titan || !spriteLoaderRef.current || !animationStateRef.current) {
      return getPlaceholder();
    }
    
    const alignment = getAlignmentState(titan.alignment);
    const currentAnim = animationStateRef.current.getCurrentAnimation();
    const direction = animationStateRef.current.getCurrentDirection();
    
    const spritePath = getTitanSpritePath(
      titan.species,
      alignment,
      currentAnim,
      direction
    );
    
    const sprite = spriteLoaderRef.current.getSprite(spritePath);
    
    // Return sprite if loaded, otherwise use placeholder
    return sprite || getPlaceholder();
  }, [titan, getPlaceholder]);
  
  // Get render data
  const getRenderData = useCallback((
    viewportOffset: { x: number; y: number },
    zoom: number
  ): TitanRenderData | null => {
    if (!titan || !hasTitan) return null;
    
    // Convert grid position to screen position
    const screenPos = gridToScreen(titan.gridX, titan.gridY);
    
    // Apply viewport offset and zoom
    const finalX = (screenPos.x + viewportOffset.x) * zoom;
    const finalY = (screenPos.y + viewportOffset.y + TITAN_Y_OFFSET) * zoom;
    
    // Get current sprite
    const sprite = getCurrentSprite();
    
    // Get alignment state
    const alignment = getAlignmentState(titan.alignment);
    
    return {
      screenX: finalX,
      screenY: finalY,
      sprite,
      direction: titan.direction,
      animation: titan.currentActivity || 'idle',
      alignment,
      isVisible: true,
    };
  }, [titan, hasTitan, getCurrentSprite]);
  
  // Render Titan to canvas
  const renderTitan = useCallback((
    ctx: CanvasRenderingContext2D,
    viewportOffset: { x: number; y: number },
    zoom: number
  ) => {
    const renderData = getRenderData(viewportOffset, zoom);
    if (!renderData || !renderData.sprite) return;
    
    const { screenX, screenY, sprite } = renderData;
    
    // Calculate scaled dimensions
    const width = TITAN_SPRITE_WIDTH * zoom;
    const height = TITAN_SPRITE_HEIGHT * zoom;
    
    // Center sprite on position
    const drawX = screenX - width / 2;
    const drawY = screenY - height;
    
    // Draw the sprite
    ctx.drawImage(sprite, drawX, drawY, width, height);
    
    // Draw name label if visible
    if (titan) {
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.font = `${12 * zoom}px Arial`;
      ctx.textAlign = 'center';
      
      const labelY = drawY - 5 * zoom;
      ctx.strokeText(titan.name, screenX, labelY);
      ctx.fillText(titan.name, screenX, labelY);
    }
  }, [getRenderData, titan]);
  
  // Get depth for z-ordering
  const getDepth = useCallback((): number => {
    if (!titan) return 0;
    return calculateDepth(titan.gridX, titan.gridY);
  }, [titan]);
  
  return {
    hasTitan,
    titan,
    getRenderData,
    renderTitan,
    preloadSprites,
    getDepth,
  };
}

/**
 * Utility function to render Titan at a specific position.
 * Can be used outside of React context for direct canvas operations.
 */
export function renderTitanAtPosition(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  screenX: number,
  screenY: number,
  zoom: number = 1,
  name?: string
): void {
  const width = TITAN_SPRITE_WIDTH * zoom;
  const height = TITAN_SPRITE_HEIGHT * zoom;
  
  // Center sprite on position
  const drawX = screenX - width / 2;
  const drawY = screenY - height;
  
  // Draw the sprite
  ctx.drawImage(sprite, drawX, drawY, width, height);
  
  // Draw name label if provided
  if (name) {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.font = `${12 * zoom}px Arial`;
    ctx.textAlign = 'center';
    
    const labelY = drawY - 5 * zoom;
    ctx.strokeText(name, screenX, labelY);
    ctx.fillText(name, screenX, labelY);
  }
}
