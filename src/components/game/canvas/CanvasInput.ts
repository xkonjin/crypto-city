/**
 * Canvas input handling utilities
 * Issue #66 - Module extraction from CanvasIsometricGrid.tsx
 */

import { TILE_WIDTH, TILE_HEIGHT, KEY_PAN_SPEED } from '@/components/game/types';
import { screenToGrid } from '@/components/game/utils';
import { calculateMapBounds, clampOffset, MapBounds } from './CanvasUtils';

/**
 * Pan drag threshold in pixels
 */
export const PAN_DRAG_THRESHOLD = 6;

/**
 * Touch gesture state
 */
export interface TouchGestureState {
  touchStart: { x: number; y: number; time: number } | null;
  initialPinchDistance: number | null;
  initialZoom: number;
  lastTouchCenter: { x: number; y: number } | null;
}

/**
 * Create initial touch gesture state
 */
export function createTouchGestureState(initialZoom: number): TouchGestureState {
  return {
    touchStart: null,
    initialPinchDistance: null,
    initialZoom,
    lastTouchCenter: null,
  };
}

/**
 * Calculate touch distance between two touch points
 */
export function getTouchDistance(touch1: React.Touch, touch2: React.Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate center point between two touches
 */
export function getTouchCenter(touch1: React.Touch, touch2: React.Touch): { x: number; y: number } {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}

/**
 * Convert client coordinates to grid coordinates
 */
export function clientToGrid(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  offset: { x: number; y: number },
  zoom: number
): { gridX: number; gridY: number } {
  const mouseX = (clientX - rect.left) / zoom;
  const mouseY = (clientY - rect.top) / zoom;
  return screenToGrid(mouseX, mouseY, offset.x / zoom, offset.y / zoom);
}

/**
 * Check if grid coordinates are within bounds
 */
export function isInGrid(gridX: number, gridY: number, gridSize: number): boolean {
  return gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize;
}

/**
 * Keyboard panning configuration
 */
export interface KeyboardPanConfig {
  keysPressed: Set<string>;
  worldState: {
    zoom: number;
    gridSize: number;
    canvasSize: { width: number; height: number };
  };
  setOffset: (fn: (prev: { x: number; y: number }) => { x: number; y: number }) => void;
}

/**
 * Handle keyboard panning tick
 */
export function handleKeyboardPanTick(
  delta: number,
  config: KeyboardPanConfig
): void {
  const { keysPressed, worldState, setOffset } = config;
  
  if (!keysPressed.size) return;
  
  let dx = 0;
  let dy = 0;
  
  if (keysPressed.has('w') || keysPressed.has('arrowup')) dy += KEY_PAN_SPEED * delta;
  if (keysPressed.has('s') || keysPressed.has('arrowdown')) dy -= KEY_PAN_SPEED * delta;
  if (keysPressed.has('a') || keysPressed.has('arrowleft')) dx += KEY_PAN_SPEED * delta;
  if (keysPressed.has('d') || keysPressed.has('arrowright')) dx -= KEY_PAN_SPEED * delta;
  
  if (dx !== 0 || dy !== 0) {
    const { zoom, gridSize, canvasSize } = worldState;
    const bounds = calculateMapBounds(gridSize, zoom, canvasSize.width, canvasSize.height);
    
    setOffset(prev => ({
      x: Math.max(bounds.minOffsetX, Math.min(bounds.maxOffsetX, prev.x + dx)),
      y: Math.max(bounds.minOffsetY, Math.min(bounds.maxOffsetY, prev.y + dy)),
    }));
  }
}

/**
 * Check if event target is a typing input
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el?.closest('input, textarea, select, [contenteditable="true"]');
}

/**
 * Zoom configuration for wheel zoom
 */
export interface WheelZoomConfig {
  currentZoom: number;
  offset: { x: number; y: number };
  mouseX: number;
  mouseY: number;
  deltaY: number;
  zoomMin: number;
  zoomMax: number;
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Calculate new zoom and offset for wheel zoom (zoom toward mouse position)
 */
export function calculateWheelZoom(config: WheelZoomConfig): {
  newZoom: number;
  newOffset: { x: number; y: number };
} | null {
  const {
    currentZoom,
    offset,
    mouseX,
    mouseY,
    deltaY,
    zoomMin,
    zoomMax,
    gridSize,
    canvasWidth,
    canvasHeight,
  } = config;
  
  // Calculate new zoom with proportional scaling
  const baseZoomDelta = 0.05;
  const scaledDelta = baseZoomDelta * Math.max(0.5, currentZoom);
  const zoomDelta = deltaY > 0 ? -scaledDelta : scaledDelta;
  const newZoom = Math.max(zoomMin, Math.min(zoomMax, currentZoom + zoomDelta));
  
  if (newZoom === currentZoom) return null;
  
  // World position under the mouse before zoom
  const worldX = (mouseX - offset.x) / currentZoom;
  const worldY = (mouseY - offset.y) / currentZoom;
  
  // After zoom, keep the same world position under the mouse
  const newOffsetX = mouseX - worldX * newZoom;
  const newOffsetY = mouseY - worldY * newZoom;
  
  // Clamp to map bounds
  const bounds = calculateMapBounds(gridSize, newZoom, canvasWidth, canvasHeight);
  const clampedOffset = clampOffset({ x: newOffsetX, y: newOffsetY }, bounds);
  
  return { newZoom, newOffset: clampedOffset };
}

/**
 * Calculate new zoom and offset for pinch zoom (zoom toward pinch center)
 */
export function calculatePinchZoom(
  currentDistance: number,
  initialDistance: number,
  initialZoom: number,
  currentCenter: { x: number; y: number },
  lastCenter: { x: number; y: number },
  offset: { x: number; y: number },
  zoom: number,
  rect: DOMRect,
  zoomMin: number,
  zoomMax: number,
  gridSize: number,
  canvasWidth: number,
  canvasHeight: number
): { newZoom: number; newOffset: { x: number; y: number } } {
  const scale = currentDistance / initialDistance;
  const newZoom = Math.max(zoomMin, Math.min(zoomMax, initialZoom * scale));
  
  // Calculate center position relative to canvas
  const centerX = currentCenter.x - rect.left;
  const centerY = currentCenter.y - rect.top;
  
  // World position at pinch center
  const worldX = (centerX - offset.x) / zoom;
  const worldY = (centerY - offset.y) / zoom;
  
  // Keep the same world position under the pinch center after zoom
  const newOffsetX = centerX - worldX * newZoom;
  const newOffsetY = centerY - worldY * newZoom;
  
  // Also account for pan movement during pinch
  const panDeltaX = currentCenter.x - lastCenter.x;
  const panDeltaY = currentCenter.y - lastCenter.y;
  
  const bounds = calculateMapBounds(gridSize, newZoom, canvasWidth, canvasHeight);
  const clampedOffset = clampOffset(
    { x: newOffsetX + panDeltaX, y: newOffsetY + panDeltaY },
    bounds
  );
  
  return { newZoom, newOffset: clampedOffset };
}

/**
 * Road drawing state for straight-line snapping
 */
export interface RoadDrawingState {
  direction: 'h' | 'v' | null;
  placedTiles: Set<string>;
}

/**
 * Create initial road drawing state
 */
export function createRoadDrawingState(): RoadDrawingState {
  return {
    direction: null,
    placedTiles: new Set(),
  };
}

/**
 * Calculate target position for road drag with direction locking
 */
export function calculateRoadDragTarget(
  startTile: { x: number; y: number },
  currentGridX: number,
  currentGridY: number,
  currentDirection: 'h' | 'v' | null
): { targetX: number; targetY: number; newDirection: 'h' | 'v' | null } {
  const dx = Math.abs(currentGridX - startTile.x);
  const dy = Math.abs(currentGridY - startTile.y);
  
  // Lock direction after moving at least 1 tile
  let direction = currentDirection;
  if (!direction && (dx > 0 || dy > 0)) {
    direction = dx >= dy ? 'h' : 'v';
  }
  
  // Calculate target position along the locked axis
  let targetX = currentGridX;
  let targetY = currentGridY;
  
  if (direction === 'h') {
    targetY = startTile.y;
  } else if (direction === 'v') {
    targetX = startTile.x;
  }
  
  return { targetX, targetY, newDirection: direction };
}
