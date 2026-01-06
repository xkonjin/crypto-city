// =============================================================================
// PROCEDURAL MANAGER
// =============================================================================
// Handles generation and caching of procedural textures.
// Bridges the procedural generators with Phaser's texture system.
// 
// This manager is responsible for:
// - Generating procedural building textures from configs
// - Caching textures in Phaser's texture manager
// - Providing texture keys for buildings based on their IDs
// - Supporting both standard procedural buildings AND crypto buildings
//
// The key insight: Crypto buildings defined in cryptoBuildings.ts have
// isProcedural: true, so we need to generate configs for them dynamically
// using the CRYPTO_BUILDING_PROCEDURAL_CONFIGS registry.

import Phaser from 'phaser';
import { BuildingGenerator, ProceduralBuildingConfig, ALL_PROCEDURAL_BUILDINGS, getBuildingGenerator } from './BuildingGenerator';
import { TileRenderer, TileRenderConfig, getTileRenderer, preloadTiles } from './TileRenderer';
import { AnimationSystem, createAnimationSystem } from './AnimationSystem';
import { TileType } from '../types';
import { ALL_CRYPTO_BUILDINGS } from '../../../data/cryptoBuildings';

export class ProceduralManager {
  private scene: Phaser.Scene;
  private buildingGenerator: BuildingGenerator;
  private tileRenderer: TileRenderer;
  private animationSystem: AnimationSystem;
  private generatedTextures: Set<string> = new Set();
  private initialized: boolean = false;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.buildingGenerator = getBuildingGenerator();
    this.tileRenderer = getTileRenderer();
    this.animationSystem = createAnimationSystem(scene);
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
   * This includes both standard procedural buildings and crypto buildings
   * that are marked with isProcedural: true
   */
  private generateProceduralBuildings(): void {
    // Generate all procedural buildings from the combined registry
    // This includes standard proc-* buildings AND crypto buildings
    for (const [id, config] of Object.entries(ALL_PROCEDURAL_BUILDINGS)) {
      this.generateProceduralBuilding(config);
    }
    
    console.log(`[ProceduralManager] Generated ${Object.keys(ALL_PROCEDURAL_BUILDINGS).length} procedural building textures`);
  }
  
  /**
   * Generate a single procedural building texture
   */
  generateProceduralBuilding(config: ProceduralBuildingConfig): string {
    const key = `proc_building_${config.id}`;
    
    if (this.scene.textures.exists(key)) {
      return key;
    }
    
    const canvas = this.buildingGenerator.generateCanvas(config);
    this.scene.textures.addCanvas(key, canvas);
    this.generatedTextures.add(key);
    
    return key;
  }
  
  /**
   * Get texture key for a procedural building
   * Works with both standard proc-* buildings and crypto buildings
   * that are marked with isProcedural: true
   */
  getProceduralBuildingKey(buildingId: string): string | null {
    // First check the combined procedural buildings registry
    const config = ALL_PROCEDURAL_BUILDINGS[buildingId];
    if (!config) {
      // Building not found in procedural configs
      // This could be a crypto building that wasn't added to the configs yet
      console.warn(`[ProceduralManager] No procedural config found for: ${buildingId}`);
      return null;
    }
    
    const key = `proc_building_${buildingId}`;
    
    // Generate if doesn't exist yet
    if (!this.scene.textures.exists(key)) {
      this.generateProceduralBuilding(config);
    }
    
    return key;
  }
  
  /**
   * Check if a building ID is a procedural building
   * A building is procedural if:
   * 1. It starts with 'proc-' (standard procedural buildings)
   * 2. It exists in the ALL_PROCEDURAL_BUILDINGS registry
   * 3. It's a crypto building with isProcedural: true
   */
  isProceduralBuilding(buildingId: string): boolean {
    // Check standard procedural prefix
    if (buildingId.startsWith('proc-')) {
      return true;
    }
    
    // Check if in procedural buildings registry
    if (ALL_PROCEDURAL_BUILDINGS[buildingId] !== undefined) {
      return true;
    }
    
    // Check if it's a crypto building marked as procedural
    const cryptoBuilding = ALL_CRYPTO_BUILDINGS[buildingId];
    if (cryptoBuilding && cryptoBuilding.isProcedural) {
      return true;
    }
    
    return false;
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

