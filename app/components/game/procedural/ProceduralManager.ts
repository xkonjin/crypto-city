// Procedural Manager - Handles generation and caching of procedural textures
// Bridges the procedural generators with Phaser's texture system

import Phaser from 'phaser';
import { BuildingGenerator, ProceduralBuildingConfig, PROCEDURAL_BUILDINGS, getBuildingGenerator } from './BuildingGenerator';
import { TileRenderer, TileRenderConfig, getTileRenderer } from './TileRenderer';
import { AnimationSystem, createAnimationSystem } from './AnimationSystem';
import { TileType } from '../types';

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
   */
  private generateProceduralBuildings(): void {
    for (const config of Object.values(PROCEDURAL_BUILDINGS)) {
      this.generateProceduralBuilding(config);
    }
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
   */
  getProceduralBuildingKey(buildingId: string): string | null {
    const config = PROCEDURAL_BUILDINGS[buildingId];
    if (!config) return null;
    
    const key = `proc_building_${buildingId}`;
    
    // Generate if doesn't exist yet
    if (!this.scene.textures.exists(key)) {
      this.generateProceduralBuilding(config);
    }
    
    return key;
  }
  
  /**
   * Check if a building ID is a procedural building
   */
  isProceduralBuilding(buildingId: string): boolean {
    return buildingId.startsWith('proc-') || PROCEDURAL_BUILDINGS[buildingId] !== undefined;
  }
  
  /**
   * Get the procedural building configuration
   */
  getProceduralBuildingConfig(buildingId: string): ProceduralBuildingConfig | null {
    return PROCEDURAL_BUILDINGS[buildingId] || null;
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

