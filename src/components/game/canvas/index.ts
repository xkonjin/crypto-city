/**
 * Canvas module barrel exports
 * Issue #66 - Module extraction from CanvasIsometricGrid.tsx
 * 
 * This module provides organized utilities for canvas-based isometric grid rendering.
 */

// Utility functions and types
export {
  // Types
  type BuildingDrawItem,
  type OverlayDrawItem,
  type RenderQueues,
  type ViewBounds,
  type MapBounds,
  type MapCorners,
  
  // Coordinate conversion (re-exported from utils)
  gridToScreen,
  screenToGrid,
  
  // Render queue management
  createRenderQueues,
  clearRenderQueues,
  insertionSortByDepth,
  calculateTileDepth,
  
  // Viewport calculations
  calculateViewBounds,
  isInViewport,
  calculateMapBounds,
  clampOffset,
  calculateMapCorners,
  createMapClipPath,
  
  // Constants
  TILE_DIMENSIONS,
} from './CanvasUtils';

// Tile rendering
export {
  // Types
  type TileRenderMetadata,
  
  // Drawing functions
  drawIsometricTile,
  drawWaterTileAt,
  drawBuilding,
  
  // Re-exported drawing functions
  drawGreenBaseTile,
  drawGreyBaseTile,
  drawFoundationPlot,
  drawRoad,
  drawBridgeTile,
  drawSuspensionBridgeTowers,
  drawSuspensionBridgeOverlay,
  drawRailTrack,
  drawRailTracksOnly,
  drawRailroadCrossing,
} from './CanvasTiles';

// Overlay rendering
export {
  // Types
  type TileCoverage,
  
  // Overlay rendering functions
  renderOverlayQueue,
  renderServiceRadii,
  renderSynergyOverlay,
  renderSynergyIndicatorsOnly,
  renderCryptoOverlay,
  
  // Re-exports
  getOverlayFillStyle,
  calculatePlacementSynergyPreview,
  drawSynergyConnections,
} from './CanvasOverlays';

// Input handling
export {
  // Constants
  PAN_DRAG_THRESHOLD,
  
  // Types
  type TouchGestureState,
  type KeyboardPanConfig,
  type WheelZoomConfig,
  type RoadDrawingState,
  
  // Touch utilities
  createTouchGestureState,
  getTouchDistance,
  getTouchCenter,
  
  // Coordinate conversion
  clientToGrid,
  isInGrid,
  
  // Input handling
  handleKeyboardPanTick,
  isTypingTarget,
  calculateWheelZoom,
  calculatePinchZoom,
  
  // Road drawing
  createRoadDrawingState,
  calculateRoadDragTarget,
} from './CanvasInput';

// Entity management
export {
  // Types
  type EntityRefs,
  
  // Entity management
  clearAllEntities,
  updateAnimationTimers,
  
  // Re-exported hooks
  useVehicleSystems,
  useAircraftSystems,
  useBoatSystem,
  useBargeSystem,
  useSeaplaneSystem,
  useEffectsSystems,
  
  // Re-exported drawing functions
  drawAirplanes,
  drawHelicopters,
  drawSeaplanes,
  drawTrains,
} from './CanvasEntities';

// Core renderer
export {
  // Types
  type BackgroundGradientCache,
  type CollectTilesOptions,
  type CollectTilesResult,
  type CanvasLayers,
  type RenderMetrics,
  type DirtyRegion,
  type Viewport,
  
  // Background rendering
  createOrGetBackgroundGradient,
  clearCanvasWithBackground,
  setupCanvasTransform,
  
  // Tile collection
  collectTilesIntoQueues,
  sortRenderQueues,
  
  // Canvas management
  updateCanvasSize,
  
  // Optimization utilities
  createRenderMetrics,
  updateRenderMetrics,
  createDirtyRegion,
  requestFullRedraw,
  clearDirtyRegion,
  hasDirtyTiles,
  getVisibleTileRange,
} from './CanvasRenderer';
