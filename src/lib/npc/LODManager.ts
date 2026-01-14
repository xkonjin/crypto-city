/**
 * NPC Level-of-Detail (LOD) Manager
 * 
 * Manages NPC simulation detail levels based on distance from player view.
 * Enables 50-100 "real" NPCs with full AI while showing 500+ visual NPCs.
 * 
 * Issue #157: Add NPC Level-of-Detail (LOD) system
 * Issue #195: Enhanced LOD system with spatial chunking, batch updates,
 *             statistical simulation, memory pooling, and smooth transitions
 */

import { DECAY_RATES, CRITICAL_THRESHOLDS } from './needs';

// =============================================================================
// TYPES
// =============================================================================

export enum NPCDetailLevel {
  FULL = 'full',           // Player is directly interacting
  HIGH = 'high',           // On screen, nearby
  MEDIUM = 'medium',       // On screen, far
  LOW = 'low',             // Off screen, same district
  MINIMAL = 'minimal',     // Off screen, far away
  SUSPENDED = 'suspended', // Not simulated at all
}

export interface UpdatePolicy {
  needsUpdate: 'every_tick' | 'every_second' | 'every_5_seconds' | 'every_minute' | 'statistical' | 'none';
  actionSelection: 'every_second' | 'every_5_seconds' | 'every_30_seconds' | 'every_5_minutes' | 'statistical' | 'none';
  pathfinding: 'precise' | 'approximate' | 'teleport' | 'none';
  animation: 'full' | 'simplified' | 'none';
  llmCalls: 'allowed' | 'limited' | 'rare' | 'none';
}

export interface NPCBudget {
  maxRealNPCs: number;      // NPCs with full simulation
  maxVisibleNPCs: number;   // NPCs shown on screen
  pathfindingPerFrame: number; // A* calls per frame
  llmCallsPerMinute: number;   // LLM budget
}

export interface Position {
  x: number;
  y: number;
}

export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
}

// =============================================================================
// ENHANCED LOD TYPES (Issue #195)
// =============================================================================

/**
 * Bounds for a spatial chunk
 */
export interface ChunkBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Spatial chunk for NPC partitioning
 */
export interface NPCChunk {
  id: string;
  bounds: ChunkBounds;
  npcIds: string[];
  lastUpdated: number;
  overloaded?: boolean;
}

/**
 * Configuration for enhanced LOD system
 */
export interface EnhancedLODConfig {
  maxBatchUpdatesPerFrame?: number;
  statisticalDecayMultiplier?: number;
  poolCapacity?: number;
  maxNPCsPerChunk?: number;
  chunkSize?: number;
}

/**
 * Result of a chunk update operation
 */
export interface ChunkUpdateResult {
  success: boolean;
  updatedNPCIds: string[];
  skippedNPCIds: string[];
  timeSpentMs: number;
}

/**
 * Result of a batch update operation
 */
export interface BatchUpdateResult {
  processedCount: number;
  updatedNPCIds: string[];
  remainingNPCIds: string[];
  simplifiedUpdates: string[];
  timeSpentMs: number;
}

/**
 * NPC needs state for statistical updates
 */
export interface NPCNeedsState {
  hunger: number;
  energy: number;
  social: number;
  fun: number;
  wealth: number;
  purpose: number;
  position?: Position;
  movement?: string;
}

/**
 * Result of statistical simulation
 */
export interface StatisticalUpdateResult {
  needs: NPCNeedsState;
  likelyActivity: string;
  estimatedPosition?: Position;
  wasStatistical: boolean;
  confidence: number;
}

/**
 * Memory pool for NPC object reuse
 */
export interface MemoryPool {
  capacity: number;
  available: number;
  totalAcquired: number;
  totalReleased: number;
}

/**
 * Pooled NPC data
 */
export interface PooledNPC {
  previousId: string;
  lastPosition: Position;
  timestamp: number;
}

/**
 * LOD transition state
 */
export interface LODTransition {
  npcId: string;
  fromLevel: NPCDetailLevel;
  toLevel: NPCDetailLevel;
  duration: number;
  startTime: number;
  progress: number;
}

/**
 * Chunk statistics
 */
export interface ChunkStats {
  chunkId: string;
  npcCount: number;
  lastUpdated: number;
  overloaded: boolean;
  distanceFromViewport: number;
}

/**
 * Merge recommendation
 */
export interface MergeRecommendation {
  chunks: string[];
  reason: string;
}

/**
 * Split result
 */
export interface SplitResult {
  success: boolean;
  reason?: string;
  newChunks?: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const DEFAULT_BUDGET: NPCBudget = {
  maxRealNPCs: 100,
  maxVisibleNPCs: 500,
  pathfindingPerFrame: 10,
  llmCallsPerMinute: 30,
};

export const UPDATE_POLICIES: Record<NPCDetailLevel, UpdatePolicy> = {
  [NPCDetailLevel.FULL]: {
    needsUpdate: 'every_tick',
    actionSelection: 'every_second',
    pathfinding: 'precise',
    animation: 'full',
    llmCalls: 'allowed',
  },
  [NPCDetailLevel.HIGH]: {
    needsUpdate: 'every_tick',
    actionSelection: 'every_5_seconds',
    pathfinding: 'precise',
    animation: 'full',
    llmCalls: 'limited',
  },
  [NPCDetailLevel.MEDIUM]: {
    needsUpdate: 'every_second',
    actionSelection: 'every_30_seconds',
    pathfinding: 'approximate',
    animation: 'simplified',
    llmCalls: 'rare',
  },
  [NPCDetailLevel.LOW]: {
    needsUpdate: 'every_minute',
    actionSelection: 'every_5_minutes',
    pathfinding: 'teleport',
    animation: 'none',
    llmCalls: 'none',
  },
  [NPCDetailLevel.MINIMAL]: {
    needsUpdate: 'statistical',
    actionSelection: 'statistical',
    pathfinding: 'none',
    animation: 'none',
    llmCalls: 'none',
  },
  [NPCDetailLevel.SUSPENDED]: {
    needsUpdate: 'none',
    actionSelection: 'none',
    pathfinding: 'none',
    animation: 'none',
    llmCalls: 'none',
  },
};

// Distance thresholds for LOD levels
const DISTANCE_THRESHOLDS = {
  HIGH: 10,      // Within 10 tiles
  MEDIUM: 30,    // Within 30 tiles  
  LOW: 80,       // Within 80 tiles
  MINIMAL: 200,  // Within 200 tiles
};

// =============================================================================
// LOD CALCULATION
// =============================================================================

/**
 * Calculate distance between two positions
 */
function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a position is within viewport bounds
 */
function isInViewport(pos: Position, viewport: ViewportBounds): boolean {
  return (
    pos.x >= viewport.minX &&
    pos.x <= viewport.maxX &&
    pos.y >= viewport.minY &&
    pos.y <= viewport.maxY
  );
}

/**
 * Determine LOD level for an NPC based on position and interaction state
 */
export function getDetailLevel(
  npcPosition: Position,
  viewport: ViewportBounds,
  isInteracting: boolean = false,
  isTracked: boolean = false
): NPCDetailLevel {
  // Always full detail if player is interacting
  if (isInteracting) {
    return NPCDetailLevel.FULL;
  }
  
  // Tracked NPCs get at least HIGH
  if (isTracked) {
    return NPCDetailLevel.HIGH;
  }
  
  const inViewport = isInViewport(npcPosition, viewport);
  const distanceFromCenter = calculateDistance(npcPosition, {
    x: viewport.centerX,
    y: viewport.centerY,
  });
  
  if (inViewport) {
    if (distanceFromCenter < DISTANCE_THRESHOLDS.HIGH) {
      return NPCDetailLevel.HIGH;
    }
    return NPCDetailLevel.MEDIUM;
  }
  
  // Off screen
  if (distanceFromCenter < DISTANCE_THRESHOLDS.LOW) {
    return NPCDetailLevel.LOW;
  }
  
  if (distanceFromCenter < DISTANCE_THRESHOLDS.MINIMAL) {
    return NPCDetailLevel.MINIMAL;
  }
  
  return NPCDetailLevel.SUSPENDED;
}

/**
 * Get update policy for a detail level
 */
export function getUpdatePolicy(level: NPCDetailLevel): UpdatePolicy {
  return UPDATE_POLICIES[level];
}

// =============================================================================
// SIMULATED NPC SYSTEM (Tier 2)
// =============================================================================

export interface SimulatedNPC {
  id: string;
  position: Position;
  direction: number; // 0-3 (N, E, S, W)
  speed: number;
  spriteType: string;
  lifetime: number;
  flowDirection?: number;
}

export interface FlowLane {
  x: number;
  y: number;
  toResidential: number;
  toCommercial: number;
  toIndustrial: number;
  toPark: number;
}

/**
 * Spawn a simulated NPC at a position
 */
export function spawnSimulatedNPC(
  position: Position,
  spriteTypes: string[],
): SimulatedNPC {
  return {
    id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    position: { ...position },
    direction: Math.floor(Math.random() * 4),
    speed: 0.5 + Math.random() * 0.5,
    spriteType: spriteTypes[Math.floor(Math.random() * spriteTypes.length)],
    lifetime: 30000 + Math.random() * 60000, // 30-90 seconds
  };
}

/**
 * Update a simulated NPC (simple movement, no pathfinding)
 */
export function updateSimulatedNPC(
  npc: SimulatedNPC,
  flowLane: FlowLane | null,
  deltaMs: number,
  hour: number,
): SimulatedNPC {
  const updated = { ...npc };
  updated.lifetime -= deltaMs;
  
  // Determine direction from flow lane or time of day
  if (flowLane) {
    // Rush hour: follow commute patterns
    if (hour >= 7 && hour <= 9) {
      updated.flowDirection = flowLane.toCommercial;
    } else if (hour >= 17 && hour <= 19) {
      updated.flowDirection = flowLane.toResidential;
    } else {
      // Random leisure movement
      const directions = [flowLane.toCommercial, flowLane.toPark, flowLane.toResidential];
      updated.flowDirection = directions[Math.floor(Math.random() * directions.length)];
    }
  }
  
  // Move in direction
  const direction = updated.flowDirection ?? updated.direction;
  const moveSpeed = updated.speed * (deltaMs / 16.67);
  
  switch (direction % 4) {
    case 0: updated.position.y -= moveSpeed; break; // North
    case 1: updated.position.x += moveSpeed; break; // East
    case 2: updated.position.y += moveSpeed; break; // South
    case 3: updated.position.x -= moveSpeed; break; // West
  }
  
  return updated;
}

/**
 * Check if a simulated NPC should be despawned
 */
export function shouldDespawn(npc: SimulatedNPC, viewport: ViewportBounds): boolean {
  // Despawn if lifetime expired
  if (npc.lifetime <= 0) return true;
  
  // Despawn if far outside viewport
  const margin = 50;
  if (
    npc.position.x < viewport.minX - margin ||
    npc.position.x > viewport.maxX + margin ||
    npc.position.y < viewport.minY - margin ||
    npc.position.y > viewport.maxY + margin
  ) {
    return true;
  }
  
  return false;
}

// =============================================================================
// LOD MANAGER CLASS (Enhanced for Issue #195)
// =============================================================================

interface NPCReference {
  id: string;
  position: Position;
  isTracked: boolean;
  isInteracting: boolean;
}

// Default chunk size: 16x16 tiles
const DEFAULT_CHUNK_SIZE = 16;
const DEFAULT_POOL_CAPACITY = 100;
const DEFAULT_MAX_BATCH_UPDATES = 50;
const DEFAULT_STATISTICAL_DECAY_MULTIPLIER = 1.0;
const DEFAULT_MAX_NPCS_PER_CHUNK = 50;

/**
 * LOD detail level priority for interpolation
 */
const LOD_PRIORITY: Record<NPCDetailLevel, number> = {
  [NPCDetailLevel.SUSPENDED]: 0,
  [NPCDetailLevel.MINIMAL]: 1,
  [NPCDetailLevel.LOW]: 2,
  [NPCDetailLevel.MEDIUM]: 3,
  [NPCDetailLevel.HIGH]: 4,
  [NPCDetailLevel.FULL]: 5,
};

const LOD_BY_PRIORITY: NPCDetailLevel[] = [
  NPCDetailLevel.SUSPENDED,
  NPCDetailLevel.MINIMAL,
  NPCDetailLevel.LOW,
  NPCDetailLevel.MEDIUM,
  NPCDetailLevel.HIGH,
  NPCDetailLevel.FULL,
];

export class LODManager {
  private budget: NPCBudget;
  private viewport: ViewportBounds;
  private npcLevels: Map<string, NPCDetailLevel> = new Map();
  private simulatedNPCs: SimulatedNPC[] = [];
  private flowLanes: Map<string, FlowLane> = new Map();
  private lastPathfindingFrame = 0;
  private pathfindingThisFrame = 0;
  
  // Enhanced LOD features (Issue #195)
  private config: Required<EnhancedLODConfig>;
  private chunks: Map<string, NPCChunk> = new Map();
  private npcToChunk: Map<string, string> = new Map();
  private chunkGridWidth = 0;
  private chunkGridHeight = 0;
  private gridOffsetX = 0;
  private gridOffsetY = 0;
  private chunkIdCounter = 0;
  
  // Memory pooling
  private pool: PooledNPC[] = [];
  private poolStats: MemoryPool;
  
  // LOD transitions
  private transitions: Map<string, LODTransition> = new Map();
  
  // Merge recommendations
  private mergeRecommendations: MergeRecommendation[] = [];
  
  constructor(budgetOrConfig: Partial<NPCBudget & EnhancedLODConfig> = {}) {
    // Separate budget from enhanced config
    const { 
      maxBatchUpdatesPerFrame, 
      statisticalDecayMultiplier, 
      poolCapacity,
      maxNPCsPerChunk,
      chunkSize,
      ...budgetRest 
    } = budgetOrConfig;
    
    this.budget = { ...DEFAULT_BUDGET, ...budgetRest };
    this.config = {
      maxBatchUpdatesPerFrame: maxBatchUpdatesPerFrame ?? DEFAULT_MAX_BATCH_UPDATES,
      statisticalDecayMultiplier: statisticalDecayMultiplier ?? DEFAULT_STATISTICAL_DECAY_MULTIPLIER,
      poolCapacity: poolCapacity ?? DEFAULT_POOL_CAPACITY,
      maxNPCsPerChunk: maxNPCsPerChunk ?? DEFAULT_MAX_NPCS_PER_CHUNK,
      chunkSize: chunkSize ?? DEFAULT_CHUNK_SIZE,
    };
    
    this.viewport = {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      centerX: 50,
      centerY: 50,
    };
    
    this.poolStats = {
      capacity: this.config.poolCapacity,
      available: 0,
      totalAcquired: 0,
      totalReleased: 0,
    };
  }
  
  // ===========================================================================
  // ORIGINAL LOD MANAGER METHODS
  // ===========================================================================
  
  /**
   * Update viewport bounds
   */
  updateViewport(viewport: ViewportBounds): void {
    this.viewport = viewport;
  }
  
  /**
   * Update LOD levels for all NPCs
   */
  updateLODLevels(npcs: NPCReference[]): Map<string, NPCDetailLevel> {
    for (const npc of npcs) {
      const oldLevel = this.npcLevels.get(npc.id);
      const newLevel = getDetailLevel(
        npc.position,
        this.viewport,
        npc.isInteracting,
        npc.isTracked
      );
      
      // Only update if changed and no active transition
      if (oldLevel !== newLevel && !this.transitions.has(npc.id)) {
        this.npcLevels.set(npc.id, newLevel);
      }
    }
    
    return new Map(this.npcLevels);
  }
  
  /**
   * Get LOD level for a specific NPC
   */
  getLODLevel(npcId: string): NPCDetailLevel {
    return this.npcLevels.get(npcId) ?? NPCDetailLevel.SUSPENDED;
  }
  
  /**
   * Check if pathfinding is allowed this frame
   */
  canPathfind(): boolean {
    if (this.pathfindingThisFrame >= this.budget.pathfindingPerFrame) {
      return false;
    }
    this.pathfindingThisFrame++;
    return true;
  }
  
  /**
   * Reset frame counters
   */
  newFrame(): void {
    this.pathfindingThisFrame = 0;
    this.lastPathfindingFrame++;
  }
  
  /**
   * Set flow lane data for a tile
   */
  setFlowLane(x: number, y: number, flowLane: FlowLane): void {
    this.flowLanes.set(`${x},${y}`, flowLane);
  }
  
  /**
   * Get flow lane for a position
   */
  getFlowLane(x: number, y: number): FlowLane | null {
    return this.flowLanes.get(`${Math.floor(x)},${Math.floor(y)}`) ?? null;
  }
  
  /**
   * Spawn simulated NPCs based on zone populations
   */
  spawnSimulatedNPCs(
    zonePopulations: Array<{ x: number; y: number; population: number }>,
    spriteTypes: string[],
  ): void {
    const targetCount = Math.min(
      this.budget.maxVisibleNPCs - this.simulatedNPCs.length,
      50 // Spawn up to 50 per call
    );
    
    if (targetCount <= 0) return;
    
    // Weight zones by population
    const totalPop = zonePopulations.reduce((sum, z) => sum + z.population, 0);
    if (totalPop === 0) return;
    
    let spawned = 0;
    for (const zone of zonePopulations) {
      if (spawned >= targetCount) break;
      
      // Spawn proportional to population
      const spawnChance = zone.population / totalPop;
      if (Math.random() < spawnChance) {
        // Only spawn if in or near viewport
        const inRange = isInViewport(zone, this.viewport) || 
          calculateDistance(zone, { x: this.viewport.centerX, y: this.viewport.centerY }) < 50;
        
        if (inRange) {
          this.simulatedNPCs.push(spawnSimulatedNPC(zone, spriteTypes));
          spawned++;
        }
      }
    }
  }
  
  /**
   * Update all simulated NPCs
   */
  updateSimulatedNPCs(deltaMs: number, hour: number): SimulatedNPC[] {
    // Update each NPC
    this.simulatedNPCs = this.simulatedNPCs.map(npc => {
      const flowLane = this.getFlowLane(npc.position.x, npc.position.y);
      return updateSimulatedNPC(npc, flowLane, deltaMs, hour);
    });
    
    // Remove despawned NPCs
    this.simulatedNPCs = this.simulatedNPCs.filter(
      npc => !shouldDespawn(npc, this.viewport)
    );
    
    return this.simulatedNPCs;
  }
  
  /**
   * Get visible simulated NPCs
   */
  getVisibleSimulatedNPCs(): SimulatedNPC[] {
    return this.simulatedNPCs.filter(npc => 
      isInViewport(npc.position, this.viewport)
    );
  }
  
  /**
   * Get performance stats (enhanced with chunk info)
   */
  getStats(): {
    realNPCCount: number;
    simulatedNPCCount: number;
    pathfindingBudget: { used: number; max: number };
    lodDistribution: Record<NPCDetailLevel, number>;
    chunkCount: number;
    activeChunks: number;
  } {
    const lodDistribution: Record<NPCDetailLevel, number> = {
      [NPCDetailLevel.FULL]: 0,
      [NPCDetailLevel.HIGH]: 0,
      [NPCDetailLevel.MEDIUM]: 0,
      [NPCDetailLevel.LOW]: 0,
      [NPCDetailLevel.MINIMAL]: 0,
      [NPCDetailLevel.SUSPENDED]: 0,
    };
    
    for (const level of this.npcLevels.values()) {
      lodDistribution[level]++;
    }
    
    // Count active chunks (chunks with NPCs)
    let activeChunks = 0;
    for (const chunk of this.chunks.values()) {
      if (chunk.npcIds.length > 0) {
        activeChunks++;
      }
    }
    
    return {
      realNPCCount: this.npcLevels.size,
      simulatedNPCCount: this.simulatedNPCs.length,
      pathfindingBudget: {
        used: this.pathfindingThisFrame,
        max: this.budget.pathfindingPerFrame,
      },
      lodDistribution,
      chunkCount: this.chunks.size,
      activeChunks,
    };
  }
  
  // ===========================================================================
  // ENHANCED LOD METHODS - CHUNK MANAGEMENT (Issue #195)
  // ===========================================================================
  
  /**
   * Create a spatial chunk with the given bounds
   */
  createChunk(bounds: ChunkBounds): NPCChunk {
    const chunk: NPCChunk = {
      id: `chunk-${this.chunkIdCounter++}`,
      bounds,
      npcIds: [],
      lastUpdated: Date.now(),
    };
    
    this.chunks.set(chunk.id, chunk);
    return chunk;
  }
  
  /**
   * Initialize the chunk grid for a given world size
   */
  initializeChunks(
    worldWidth: number, 
    worldHeight: number,
    offsetX: number = 0,
    offsetY: number = 0
  ): void {
    this.chunks.clear();
    this.npcToChunk.clear();
    this.chunkIdCounter = 0;
    
    this.gridOffsetX = offsetX;
    this.gridOffsetY = offsetY;
    
    const chunkSize = this.config.chunkSize;
    this.chunkGridWidth = Math.ceil(worldWidth / chunkSize);
    this.chunkGridHeight = Math.ceil(worldHeight / chunkSize);
    
    for (let cy = 0; cy < this.chunkGridHeight; cy++) {
      for (let cx = 0; cx < this.chunkGridWidth; cx++) {
        const bounds: ChunkBounds = {
          minX: offsetX + cx * chunkSize,
          minY: offsetY + cy * chunkSize,
          maxX: offsetX + (cx + 1) * chunkSize,
          maxY: offsetY + (cy + 1) * chunkSize,
        };
        this.createChunk(bounds);
      }
    }
  }
  
  /**
   * Assign an NPC to the appropriate chunk based on position
   */
  assignNPCToChunk(npcId: string, gridX: number, gridY: number): void {
    // Remove from current chunk if any
    const currentChunkId = this.npcToChunk.get(npcId);
    if (currentChunkId) {
      const currentChunk = this.chunks.get(currentChunkId);
      if (currentChunk) {
        const idx = currentChunk.npcIds.indexOf(npcId);
        if (idx !== -1) {
          currentChunk.npcIds.splice(idx, 1);
        }
      }
    }
    
    // Find new chunk
    const newChunk = this.getChunkForPosition(gridX, gridY);
    if (newChunk) {
      newChunk.npcIds.push(npcId);
      this.npcToChunk.set(npcId, newChunk.id);
      
      // Check overload
      newChunk.overloaded = newChunk.npcIds.length > this.config.maxNPCsPerChunk;
    }
  }
  
  /**
   * Get the chunk containing the given position
   */
  getChunkForPosition(gridX: number, gridY: number): NPCChunk | null {
    for (const chunk of this.chunks.values()) {
      if (
        gridX >= chunk.bounds.minX &&
        gridX < chunk.bounds.maxX &&
        gridY >= chunk.bounds.minY &&
        gridY < chunk.bounds.maxY
      ) {
        return chunk;
      }
    }
    return null;
  }
  
  /**
   * Remove an NPC from all chunks
   */
  removeNPCFromChunks(npcId: string): void {
    const chunkId = this.npcToChunk.get(npcId);
    if (chunkId) {
      const chunk = this.chunks.get(chunkId);
      if (chunk) {
        const idx = chunk.npcIds.indexOf(npcId);
        if (idx !== -1) {
          chunk.npcIds.splice(idx, 1);
        }
      }
      this.npcToChunk.delete(npcId);
    }
  }
  
  /**
   * Update all NPCs in a chunk
   */
  updateChunk(chunkId: string, deltaTime: number): ChunkUpdateResult {
    const startTime = performance.now();
    const result: ChunkUpdateResult = {
      success: true,
      updatedNPCIds: [],
      skippedNPCIds: [],
      timeSpentMs: 0,
    };
    
    const chunk = this.chunks.get(chunkId);
    if (!chunk) {
      result.success = true;
      result.timeSpentMs = performance.now() - startTime;
      return result;
    }
    
    for (const npcId of chunk.npcIds) {
      const level = this.npcLevels.get(npcId);
      if (level === NPCDetailLevel.SUSPENDED) {
        result.skippedNPCIds.push(npcId);
      } else {
        result.updatedNPCIds.push(npcId);
      }
    }
    
    chunk.lastUpdated = Date.now();
    result.timeSpentMs = performance.now() - startTime;
    return result;
  }
  
  /**
   * Get chunks ordered by priority (distance to viewport)
   */
  getChunksByPriority(): NPCChunk[] {
    const chunksWithDistance: Array<{ chunk: NPCChunk; distance: number }> = [];
    
    for (const chunk of this.chunks.values()) {
      // Calculate center of chunk
      const centerX = (chunk.bounds.minX + chunk.bounds.maxX) / 2;
      const centerY = (chunk.bounds.minY + chunk.bounds.maxY) / 2;
      
      // Distance from viewport center
      const distance = calculateDistance(
        { x: centerX, y: centerY },
        { x: this.viewport.centerX, y: this.viewport.centerY }
      );
      
      chunksWithDistance.push({ chunk, distance });
    }
    
    // Sort by distance (closest first)
    chunksWithDistance.sort((a, b) => a.distance - b.distance);
    
    return chunksWithDistance.map(c => c.chunk);
  }
  
  /**
   * Get chunk count
   */
  getChunkCount(): number {
    return this.chunks.size;
  }
  
  // ===========================================================================
  // ENHANCED LOD METHODS - BATCH UPDATES (Issue #195)
  // ===========================================================================
  
  /**
   * Set the detail level for an NPC manually
   */
  setNPCDetailLevel(npcId: string, level: NPCDetailLevel): void {
    this.npcLevels.set(npcId, level);
  }
  
  /**
   * Get detail level with alias for backward compatibility
   */
  getNPCDetailLevel(npcId: string): NPCDetailLevel {
    return this.getLODLevel(npcId);
  }
  
  /**
   * Batch update distant NPCs efficiently
   */
  batchUpdateDistantNPCs(npcIds: string[], deltaTime: number): BatchUpdateResult {
    const startTime = performance.now();
    const result: BatchUpdateResult = {
      processedCount: 0,
      updatedNPCIds: [],
      remainingNPCIds: [],
      simplifiedUpdates: [],
      timeSpentMs: 0,
    };
    
    const maxUpdates = this.config.maxBatchUpdatesPerFrame;
    
    for (let i = 0; i < npcIds.length; i++) {
      if (result.processedCount >= maxUpdates) {
        result.remainingNPCIds.push(...npcIds.slice(i));
        break;
      }
      
      const npcId = npcIds[i];
      const level = this.npcLevels.get(npcId);
      
      // Use simplified updates for LOW detail NPCs
      if (level === NPCDetailLevel.LOW || level === NPCDetailLevel.MINIMAL) {
        result.simplifiedUpdates.push(npcId);
      }
      
      result.updatedNPCIds.push(npcId);
      result.processedCount++;
    }
    
    result.timeSpentMs = performance.now() - startTime;
    return result;
  }
  
  // ===========================================================================
  // ENHANCED LOD METHODS - STATISTICAL SIMULATION (Issue #195)
  // ===========================================================================
  
  /**
   * Perform statistical simulation for off-screen NPCs
   * Approximates state changes without full calculations
   */
  statisticalUpdate(
    npcId: string, 
    deltaMinutes: number, 
    state: NPCNeedsState
  ): StatisticalUpdateResult {
    const multiplier = this.config.statisticalDecayMultiplier;
    const level = this.npcLevels.get(npcId) ?? NPCDetailLevel.MINIMAL;
    
    // Calculate needs decay using base decay rates
    const needs: NPCNeedsState = {
      hunger: Math.max(0, state.hunger - (DECAY_RATES.hunger * deltaMinutes * multiplier)),
      energy: Math.max(0, state.energy - (DECAY_RATES.energy * deltaMinutes * multiplier)),
      social: Math.max(0, state.social - (DECAY_RATES.social * deltaMinutes * multiplier)),
      fun: Math.max(0, state.fun - (DECAY_RATES.fun * deltaMinutes * multiplier)),
      wealth: Math.max(0, state.wealth - (DECAY_RATES.wealth * deltaMinutes * multiplier)),
      purpose: Math.max(0, state.purpose - (DECAY_RATES.purpose * deltaMinutes * multiplier)),
    };
    
    // Predict likely activity based on critical needs
    let likelyActivity = 'idle';
    if (needs.hunger < CRITICAL_THRESHOLDS.hunger) {
      likelyActivity = 'eating';
    } else if (needs.energy < CRITICAL_THRESHOLDS.energy) {
      likelyActivity = 'sleeping';
    } else if (needs.social < CRITICAL_THRESHOLDS.social) {
      likelyActivity = 'socializing';
    } else if (needs.fun < CRITICAL_THRESHOLDS.fun) {
      likelyActivity = 'entertainment';
    }
    
    // Estimate position change if walking
    let estimatedPosition: Position | undefined;
    if (state.position && state.movement === 'walking') {
      // Approximate movement: ~1 tile per minute
      const movementTiles = deltaMinutes / 60;
      const direction = Math.random() * Math.PI * 2;
      estimatedPosition = {
        x: state.position.x + Math.cos(direction) * movementTiles,
        y: state.position.y + Math.sin(direction) * movementTiles,
      };
    }
    
    // Confidence is lower for MINIMAL level
    const confidence = level === NPCDetailLevel.MINIMAL ? 0.6 : 0.85;
    
    return {
      needs,
      likelyActivity,
      estimatedPosition,
      wasStatistical: true,
      confidence,
    };
  }
  
  // ===========================================================================
  // ENHANCED LOD METHODS - MEMORY POOLING (Issue #195)
  // ===========================================================================
  
  /**
   * Get memory pool stats
   */
  getMemoryPool(): MemoryPool {
    return { ...this.poolStats, available: this.pool.length };
  }
  
  /**
   * Release an NPC to the memory pool for later reuse
   */
  releaseToPool(npcId: string, position: Position): void {
    if (this.pool.length >= this.config.poolCapacity) {
      // Pool is full, discard oldest
      return;
    }
    
    this.pool.push({
      previousId: npcId,
      lastPosition: { ...position },
      timestamp: Date.now(),
    });
    
    this.poolStats.totalReleased++;
  }
  
  /**
   * Acquire a recycled NPC from the pool
   */
  acquireFromPool(): PooledNPC | null {
    if (this.pool.length === 0) {
      return null;
    }
    
    const npc = this.pool.shift()!;
    this.poolStats.totalAcquired++;
    return npc;
  }
  
  /**
   * Clear the memory pool
   */
  clearPool(): void {
    this.pool = [];
  }
  
  // ===========================================================================
  // ENHANCED LOD METHODS - SMOOTH TRANSITIONS (Issue #195)
  // ===========================================================================
  
  /**
   * Start a smooth LOD transition for an NPC
   */
  transitionLOD(
    npcId: string, 
    fromLevel: NPCDetailLevel, 
    toLevel: NPCDetailLevel, 
    duration: number = 500
  ): void {
    // Cancel any existing transition
    this.transitions.delete(npcId);
    
    // Clamp duration to 0-1000ms
    const clampedDuration = Math.max(0, Math.min(1000, duration));
    
    const transition: LODTransition = {
      npcId,
      fromLevel,
      toLevel,
      duration: clampedDuration,
      startTime: Date.now(),
      progress: 0,
    };
    
    this.transitions.set(npcId, transition);
  }
  
  /**
   * Get the active transition for an NPC
   */
  getActiveTransition(npcId: string): LODTransition | null {
    return this.transitions.get(npcId) ?? null;
  }
  
  /**
   * Update all active transitions
   */
  updateTransitions(deltaMs: number): void {
    const toRemove: string[] = [];
    
    for (const [npcId, transition] of this.transitions) {
      // Calculate progress based on deltaMs rather than wall clock
      // This allows for deterministic testing
      const progressIncrement = deltaMs / transition.duration;
      transition.progress = Math.min(1.0, transition.progress + progressIncrement);
      
      // Complete transition
      if (transition.progress >= 1.0) {
        this.npcLevels.set(npcId, transition.toLevel);
        toRemove.push(npcId);
      }
    }
    
    // Remove completed transitions
    for (const npcId of toRemove) {
      this.transitions.delete(npcId);
    }
  }
  
  /**
   * Get the current interpolated LOD level during a transition
   */
  getCurrentTransitionLevel(npcId: string): NPCDetailLevel | null {
    const transition = this.transitions.get(npcId);
    if (!transition) {
      return null;
    }
    
    // Interpolate between levels based on progress
    const fromPriority = LOD_PRIORITY[transition.fromLevel];
    const toPriority = LOD_PRIORITY[transition.toLevel];
    const currentPriority = Math.round(
      fromPriority + (toPriority - fromPriority) * transition.progress
    );
    
    return LOD_BY_PRIORITY[Math.max(0, Math.min(5, currentPriority))];
  }
  
  /**
   * Cancel an active transition
   */
  cancelTransition(npcId: string): void {
    this.transitions.delete(npcId);
  }
  
  /**
   * Get count of active transitions
   */
  getActiveTransitionCount(): number {
    return this.transitions.size;
  }
  
  // ===========================================================================
  // ENHANCED LOD METHODS - CHUNK OPTIMIZATION (Issue #195)
  // ===========================================================================
  
  /**
   * Get statistics for all chunks
   */
  getChunkStats(): ChunkStats[] {
    const stats: ChunkStats[] = [];
    
    for (const chunk of this.chunks.values()) {
      const centerX = (chunk.bounds.minX + chunk.bounds.maxX) / 2;
      const centerY = (chunk.bounds.minY + chunk.bounds.maxY) / 2;
      const distance = calculateDistance(
        { x: centerX, y: centerY },
        { x: this.viewport.centerX, y: this.viewport.centerY }
      );
      
      stats.push({
        chunkId: chunk.id,
        npcCount: chunk.npcIds.length,
        lastUpdated: chunk.lastUpdated,
        overloaded: chunk.overloaded ?? false,
        distanceFromViewport: distance,
      });
    }
    
    return stats;
  }
  
  /**
   * Optimize chunk distribution by identifying overloaded chunks
   */
  optimizeChunkDistribution(): void {
    // Mark overloaded chunks
    for (const chunk of this.chunks.values()) {
      chunk.overloaded = chunk.npcIds.length > this.config.maxNPCsPerChunk;
    }
  }
  
  /**
   * Get merge recommendations for sparse chunks
   */
  getMergeRecommendations(): MergeRecommendation[] {
    return [...this.mergeRecommendations];
  }
  
  /**
   * Merge sparse chunks (marks for merging, actual merge depends on game logic)
   */
  mergeChunks(minNPCThreshold: number): void {
    this.mergeRecommendations = [];
    
    const sparseChunks: string[] = [];
    for (const chunk of this.chunks.values()) {
      if (chunk.npcIds.length < minNPCThreshold) {
        sparseChunks.push(chunk.id);
      }
    }
    
    // Group adjacent sparse chunks for potential merging
    if (sparseChunks.length >= 2) {
      this.mergeRecommendations.push({
        chunks: sparseChunks,
        reason: `${sparseChunks.length} chunks have fewer than ${minNPCThreshold} NPCs`,
      });
    }
  }
  
  /**
   * Split an overloaded chunk (returns recommendation, actual split depends on game logic)
   */
  splitChunk(chunkId: string): SplitResult {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) {
      return { success: false, reason: 'Chunk not found' };
    }
    
    if (!chunk.overloaded) {
      return { success: false, reason: 'Chunk is not overloaded' };
    }
    
    // Return recommendation - actual split would need to redistribute NPCs
    return {
      success: true,
      reason: `Chunk ${chunkId} has ${chunk.npcIds.length} NPCs, recommend splitting`,
      newChunks: [`${chunkId}-a`, `${chunkId}-b`],
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let lodManagerInstance: LODManager | null = null;

export function getLODManager(budget?: Partial<NPCBudget>): LODManager {
  if (!lodManagerInstance) {
    lodManagerInstance = new LODManager(budget);
  }
  return lodManagerInstance;
}

export function resetLODManager(): void {
  lodManagerInstance = null;
}
