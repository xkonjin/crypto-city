// Procedural Manager - Handles generation and caching of procedural textures
// Bridges the procedural generators with Phaser's texture system

import Phaser from 'phaser';
import { BuildingGenerator, ProceduralBuildingConfig, ALL_PROCEDURAL_BUILDINGS, getBuildingGenerator } from './BuildingGenerator';
import { TileRenderer, TileRenderConfig, getTileRenderer } from './TileRenderer';
import { AnimationSystem, createAnimationSystem } from './AnimationSystem';
import { TileType } from '../types';

// =============================================================================
// TEXTURE GENERATION STATE
// =============================================================================

export type TextureState = 'pending' | 'generating' | 'ready' | 'error';

export interface TextureLoadingState {
  buildingId: string;
  state: TextureState;
  error?: string;
}

export type TextureReadyCallback = (buildingId: string, textureKey: string) => void;

export class ProceduralManager {
  private scene: Phaser.Scene;
  private buildingGenerator: BuildingGenerator;
  private tileRenderer: TileRenderer;
  private animationSystem: AnimationSystem;
  private generatedTextures: Set<string> = new Set();
  private initialized: boolean = false;
  
  // Loading state tracking
  private textureStates: Map<string, TextureState> = new Map();
  private pendingGenerations: Map<string, Promise<string>> = new Map();
  private onReadyCallbacks: TextureReadyCallback[] = [];
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.buildingGenerator = getBuildingGenerator();
    this.tileRenderer = getTileRenderer();
    this.animationSystem = createAnimationSystem(scene);
  }
  
  // ---------------------------------------------------------------------------
  // LOADING STATE API
  // ---------------------------------------------------------------------------
  
  /**
   * Check if a texture is ready for use
   */
  isTextureReady(buildingId: string): boolean {
    const key = `proc_building_${buildingId}`;
    return this.scene.textures.exists(key) && this.textureStates.get(buildingId) === 'ready';
  }
  
  /**
   * Get the loading state of a texture
   */
  getTextureState(buildingId: string): TextureState {
    return this.textureStates.get(buildingId) ?? 'pending';
  }
  
  /**
   * Get all loading states
   */
  getAllTextureStates(): TextureLoadingState[] {
    const states: TextureLoadingState[] = [];
    for (const [buildingId, state] of this.textureStates) {
      states.push({ buildingId, state });
    }
    return states;
  }
  
  /**
   * Get count of textures by state
   */
  getTextureStateCounts(): Record<TextureState, number> {
    const counts: Record<TextureState, number> = {
      pending: 0,
      generating: 0,
      ready: 0,
      error: 0,
    };
    
    for (const state of this.textureStates.values()) {
      counts[state]++;
    }
    
    return counts;
  }
  
  /**
   * Register callback for when textures become ready
   */
  onTextureReady(callback: TextureReadyCallback): () => void {
    this.onReadyCallbacks.push(callback);
    
    return () => {
      const index = this.onReadyCallbacks.indexOf(callback);
      if (index > -1) {
        this.onReadyCallbacks.splice(index, 1);
      }
    };
  }
  
  private notifyTextureReady(buildingId: string, textureKey: string): void {
    for (const callback of this.onReadyCallbacks) {
      try {
        callback(buildingId, textureKey);
      } catch (error) {
        console.error('[ProceduralManager] Callback error:', error);
      }
    }
  }
  
  /**
   * Initialize procedural textures (call during scene create)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[ProceduralManager] Initializing procedural textures...');
    
    // Generate standard tile textures
    this.generateTileTextures();
    
    // Pre-generate procedural buildings
    this.generateProceduralBuildings();
    
    this.initialized = true;
    console.log('[ProceduralManager] Initialization complete');
  }
  
  /**
   * Generate all standard tile textures
   */
  private generateTileTextures(): void {
    // Standard grass tile with depth
    this.generateAndCacheTile('proc_grass', {
      type: TileType.Grass,
      showPillars: false,
      gridPattern: true,
    });
    
    // Grass tile with corner pillars
    this.generateAndCacheTile('proc_grass_pillars', {
      type: TileType.Grass,
      showPillars: true,
      gridPattern: true,
    });
    
    // Road/Tile
    this.generateAndCacheTile('proc_tile', {
      type: TileType.Tile,
      showPillars: false,
      gridPattern: true,
    });
    
    // Asphalt
    this.generateAndCacheTile('proc_asphalt', {
      type: TileType.Road,
      palette: 'tileGray',
    });
    
    // Snow
    this.generateAndCacheTile('proc_snow', {
      type: TileType.Snow,
    });
    
    // Wireframe tiles for map edges
    this.generateAndCacheTile('proc_wireframe', {
      type: TileType.Grass,
      wireframe: true,
      opacity: 0.3,
    });
    
    this.generateAndCacheTile('proc_wireframe_light', {
      type: TileType.Grass,
      wireframe: true,
      opacity: 0.15,
    });
  }
  
  /**
   * Generate a tile texture and cache it in Phaser's texture manager
   */
  private generateAndCacheTile(key: string, config: TileRenderConfig): void {
    if (this.scene.textures.exists(key)) {
      return; // Already exists
    }
    
    const canvas = this.tileRenderer.renderToCanvas(config);
    this.scene.textures.addCanvas(key, canvas);
    this.generatedTextures.add(key);
  }
  
  /**
   * Generate all pre-defined procedural buildings
   */
  private generateProceduralBuildings(): void {
    for (const config of Object.values(ALL_PROCEDURAL_BUILDINGS)) {
      this.generateProceduralBuilding(config);
    }
  }
  
  /**
   * Generate a single procedural building texture
   * Now with error handling and state tracking
   */
  generateProceduralBuilding(config: ProceduralBuildingConfig): string {
    const key = `proc_building_${config.id}`;
    
    // Already generated
    if (this.scene.textures.exists(key)) {
      this.textureStates.set(config.id, 'ready');
      return key;
    }
    
    // Mark as generating
    this.textureStates.set(config.id, 'generating');
    
    try {
      const canvas = this.buildingGenerator.generateCanvas(config);
      this.scene.textures.addCanvas(key, canvas);
      this.generatedTextures.add(key);
      
      // Mark as ready and notify
      this.textureStates.set(config.id, 'ready');
      this.notifyTextureReady(config.id, key);
      
      console.log(`[ProceduralManager] Generated texture: ${key}`);
      return key;
    } catch (error) {
      console.error(`[ProceduralManager] Failed to generate ${config.id}:`, error);
      this.textureStates.set(config.id, 'error');
      
      // Return fallback texture key
      return '__ERROR_TEXTURE__';
    }
  }
  
  /**
   * Generate a building asynchronously (for large textures or batching)
   */
  async generateProceduralBuildingAsync(config: ProceduralBuildingConfig): Promise<string> {
    const key = `proc_building_${config.id}`;
    
    // Already generated
    if (this.scene.textures.exists(key)) {
      this.textureStates.set(config.id, 'ready');
      return key;
    }
    
    // Already generating
    const pending = this.pendingGenerations.get(config.id);
    if (pending) {
      return pending;
    }
    
    // Start generation
    this.textureStates.set(config.id, 'generating');
    
    const promise = new Promise<string>((resolve) => {
      // Use requestAnimationFrame to avoid blocking
      requestAnimationFrame(() => {
        try {
          const canvas = this.buildingGenerator.generateCanvas(config);
          this.scene.textures.addCanvas(key, canvas);
          this.generatedTextures.add(key);
          
          this.textureStates.set(config.id, 'ready');
          this.notifyTextureReady(config.id, key);
          
          resolve(key);
        } catch (error) {
          console.error(`[ProceduralManager] Async generation failed for ${config.id}:`, error);
          this.textureStates.set(config.id, 'error');
          resolve('__ERROR_TEXTURE__');
        } finally {
          this.pendingGenerations.delete(config.id);
        }
      });
    });
    
    this.pendingGenerations.set(config.id, promise);
    return promise;
  }
  
  /**
   * Get texture key for a procedural building
   * Returns null if not ready yet, triggers generation if needed
   */
  getProceduralBuildingKey(buildingId: string): string | null {
    const config = ALL_PROCEDURAL_BUILDINGS[buildingId];
    if (!config) return null;
    
    const key = `proc_building_${buildingId}`;
    const state = this.getTextureState(buildingId);
    
    // If ready, return the key
    if (state === 'ready' && this.scene.textures.exists(key)) {
      return key;
    }
    
    // If error, return error texture
    if (state === 'error') {
      return '__ERROR_TEXTURE__';
    }
    
    // If pending, start generation
    if (state === 'pending') {
      this.generateProceduralBuilding(config);
      
      // Check if it completed synchronously
      if (this.scene.textures.exists(key)) {
        return key;
      }
    }
    
    // Still generating - return loading texture
    return '__LOADING_TEXTURE__';
  }
  
  /**
   * Get texture key for a procedural building, waiting for generation
   */
  async getProceduralBuildingKeyAsync(buildingId: string): Promise<string | null> {
    const config = ALL_PROCEDURAL_BUILDINGS[buildingId];
    if (!config) return null;
    
    const key = `proc_building_${buildingId}`;
    
    // If already ready
    if (this.scene.textures.exists(key)) {
      return key;
    }
    
    // Generate and wait
    return this.generateProceduralBuildingAsync(config);
  }
  
  /**
   * Check if a building ID is a procedural building
   */
  isProceduralBuilding(buildingId: string): boolean {
    return buildingId.startsWith('proc-') || ALL_PROCEDURAL_BUILDINGS[buildingId] !== undefined;
  }
  
  /**
   * Get the procedural building configuration
   */
  getProceduralBuildingConfig(buildingId: string): ProceduralBuildingConfig | null {
    return ALL_PROCEDURAL_BUILDINGS[buildingId] || null;
  }
  
  /**
   * Get animation system for placement effects
   */
  getAnimationSystem(): AnimationSystem {
    return this.animationSystem;
  }
  
  /**
   * Animate building placement
   */
  animatePlacement(sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite, callback?: () => void): void {
    this.animationSystem.animateBuildingPlacement(sprite, callback);
  }
  
  /**
   * Animate building removal
   */
  animateRemoval(sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite, callback?: () => void): void {
    this.animationSystem.animateBuildingRemoval(sprite, callback);
  }
  
  /**
   * Show floating text effect
   */
  showFloatingText(x: number, y: number, text: string): void {
    this.animationSystem.showFloatingText(x, y, text);
  }
  
  /**
   * Create construction particles at position
   */
  spawnConstructionParticles(x: number, y: number): void {
    this.animationSystem.spawnConstructionParticles(x, y);
  }
  
  /**
   * Create ripple effect at position
   */
  createRipple(x: number, y: number, color?: string): void {
    this.animationSystem.createRippleEffect(x, y, color);
  }
  
  /**
   * Start ambient particles
   */
  startAmbientParticles(): void {
    this.animationSystem.createAmbientParticles();
  }
  
  /**
   * Clean up generated textures
   */
  destroy(): void {
    for (const key of this.generatedTextures) {
      if (this.scene.textures.exists(key)) {
        this.scene.textures.remove(key);
      }
    }
    this.generatedTextures.clear();
    this.animationSystem.destroy();
    this.initialized = false;
  }
}

// Singleton pattern for global access
let managerInstance: ProceduralManager | null = null;

export function getProceduralManager(scene: Phaser.Scene): ProceduralManager {
  if (!managerInstance || managerInstance['scene'] !== scene) {
    managerInstance = new ProceduralManager(scene);
  }
  return managerInstance;
}

export function clearProceduralManager(): void {
  if (managerInstance) {
    managerInstance.destroy();
    managerInstance = null;
  }
}

