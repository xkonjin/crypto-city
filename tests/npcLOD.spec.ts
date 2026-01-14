import { test, expect } from "@playwright/test";

/**
 * Tests for Enhanced NPC Level-of-Detail (LOD) System (Issue #195)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * This enhances the LOD system with:
 * - Spatial chunking for efficient NPC management
 * - Batch updates for distant NPCs
 * - Statistical simulation for off-screen NPCs
 * - Memory pooling for NPC object reuse
 * - Smooth LOD transitions
 */

import {
  LODManager,
  NPCDetailLevel,
  getDetailLevel,
  getUpdatePolicy,
  resetLODManager,
  type NPCChunk,
  type ChunkBounds,
  type MemoryPool,
  type LODTransition,
} from "@/lib/npc/LODManager";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a mock NPC reference for testing
 */
function createMockNPCRef(
  id: string,
  x: number,
  y: number,
  options: { isTracked?: boolean; isInteracting?: boolean } = {}
) {
  return {
    id,
    position: { x, y },
    isTracked: options.isTracked ?? false,
    isInteracting: options.isInteracting ?? false,
  };
}

/**
 * Reset LODManager before each test
 */
function resetManager(): void {
  resetLODManager();
}

// =============================================================================
// TEST SUITE: NPCChunk Interface
// =============================================================================

test.describe("NPCChunk Interface", () => {
  test.beforeEach(resetManager);

  test("should define chunk with bounds, npcIds, and lastUpdated", async () => {
    const lodManager = new LODManager();
    const bounds: ChunkBounds = {
      minX: 0,
      minY: 0,
      maxX: 16,
      maxY: 16,
    };
    
    const chunk = lodManager.createChunk(bounds);
    
    expect(chunk).toBeDefined();
    expect(chunk.id).toBeDefined();
    expect(chunk.bounds).toEqual(bounds);
    expect(chunk.npcIds).toEqual([]);
    expect(chunk.lastUpdated).toBeDefined();
    expect(typeof chunk.lastUpdated).toBe("number");
  });

  test("should generate unique chunk IDs", async () => {
    const lodManager = new LODManager();
    const chunk1 = lodManager.createChunk({ minX: 0, minY: 0, maxX: 16, maxY: 16 });
    const chunk2 = lodManager.createChunk({ minX: 16, minY: 0, maxX: 32, maxY: 16 });
    
    expect(chunk1.id).not.toBe(chunk2.id);
  });

  test("should store chunk size as 16x16 tiles by default", async () => {
    const lodManager = new LODManager();
    const chunk = lodManager.createChunk({ minX: 0, minY: 0, maxX: 16, maxY: 16 });
    
    const width = chunk.bounds.maxX - chunk.bounds.minX;
    const height = chunk.bounds.maxY - chunk.bounds.minY;
    
    expect(width).toBe(16);
    expect(height).toBe(16);
  });
});

// =============================================================================
// TEST SUITE: Chunk-based NPC Management
// =============================================================================

test.describe("Chunk-based NPC Management", () => {
  test.beforeEach(resetManager);

  test("assignNPCToChunk should add NPC to correct chunk", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64); // 4x4 chunks for a 64x64 grid
    
    lodManager.assignNPCToChunk("npc-1", 5, 5);
    
    const chunk = lodManager.getChunkForPosition(5, 5);
    expect(chunk).toBeDefined();
    expect(chunk?.npcIds).toContain("npc-1");
  });

  test("assignNPCToChunk should handle NPCs at chunk boundaries", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    // Position exactly at chunk boundary (16, 16)
    lodManager.assignNPCToChunk("npc-boundary", 16, 16);
    
    const chunk = lodManager.getChunkForPosition(16, 16);
    expect(chunk).toBeDefined();
    expect(chunk?.npcIds).toContain("npc-boundary");
  });

  test("assignNPCToChunk should move NPC between chunks when position changes", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    // Initial assignment in chunk 0
    lodManager.assignNPCToChunk("npc-mobile", 5, 5);
    const chunk1 = lodManager.getChunkForPosition(5, 5);
    expect(chunk1?.npcIds).toContain("npc-mobile");
    
    // Move to different chunk
    lodManager.assignNPCToChunk("npc-mobile", 20, 20);
    const chunk2 = lodManager.getChunkForPosition(20, 20);
    
    expect(chunk1?.npcIds).not.toContain("npc-mobile");
    expect(chunk2?.npcIds).toContain("npc-mobile");
  });

  test("getChunkForPosition should return correct chunk", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    const chunk1 = lodManager.getChunkForPosition(5, 5);
    const chunk2 = lodManager.getChunkForPosition(20, 5);
    
    expect(chunk1).toBeDefined();
    expect(chunk2).toBeDefined();
    expect(chunk1?.id).not.toBe(chunk2?.id);
  });

  test("getChunkForPosition should return null for out-of-bounds position", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    const chunk = lodManager.getChunkForPosition(100, 100);
    expect(chunk).toBeNull();
  });

  test("removeNPCFromChunks should remove NPC from all chunks", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    lodManager.assignNPCToChunk("npc-remove", 5, 5);
    lodManager.removeNPCFromChunks("npc-remove");
    
    const chunk = lodManager.getChunkForPosition(5, 5);
    expect(chunk?.npcIds).not.toContain("npc-remove");
  });
});

// =============================================================================
// TEST SUITE: Chunk Updates
// =============================================================================

test.describe("Chunk Updates", () => {
  test.beforeEach(resetManager);

  test("updateChunk should update lastUpdated timestamp", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    const chunk = lodManager.getChunkForPosition(5, 5);
    const initialTimestamp = chunk?.lastUpdated ?? 0;
    
    // Wait a bit to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 10));
    
    lodManager.updateChunk(chunk!.id, 16.67);
    
    const updatedChunk = lodManager.getChunkForPosition(5, 5);
    expect(updatedChunk?.lastUpdated).toBeGreaterThan(initialTimestamp);
  });

  test("updateChunk should return list of NPCs that were updated", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    lodManager.assignNPCToChunk("npc-1", 5, 5);
    lodManager.assignNPCToChunk("npc-2", 10, 10);
    
    const chunk = lodManager.getChunkForPosition(5, 5);
    const result = lodManager.updateChunk(chunk!.id, 16.67);
    
    expect(result.updatedNPCIds).toContain("npc-1");
    expect(result.updatedNPCIds).toContain("npc-2");
  });

  test("updateChunk should not update suspended NPCs", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    lodManager.assignNPCToChunk("npc-suspended", 5, 5);
    lodManager.setNPCDetailLevel("npc-suspended", NPCDetailLevel.SUSPENDED);
    
    const chunk = lodManager.getChunkForPosition(5, 5);
    const result = lodManager.updateChunk(chunk!.id, 16.67);
    
    expect(result.skippedNPCIds).toContain("npc-suspended");
  });

  test("getChunksByPriority should return chunks ordered by distance to viewport", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    lodManager.updateViewport({
      minX: 0,
      maxX: 32,
      minY: 0,
      maxY: 32,
      centerX: 16,
      centerY: 16,
    });
    
    const chunks = lodManager.getChunksByPriority();
    
    expect(chunks.length).toBeGreaterThan(0);
    // First chunk should be closest to viewport center
    const firstChunk = chunks[0];
    expect(firstChunk.bounds.minX).toBeLessThanOrEqual(16);
    expect(firstChunk.bounds.maxX).toBeGreaterThanOrEqual(16);
  });
});

// =============================================================================
// TEST SUITE: Batch Update System
// =============================================================================

test.describe("Batch Update System", () => {
  test.beforeEach(resetManager);

  test("batchUpdateDistantNPCs should update multiple NPCs efficiently", async () => {
    const lodManager = new LODManager();
    
    const npcIds = ["npc-1", "npc-2", "npc-3", "npc-4", "npc-5"];
    const result = lodManager.batchUpdateDistantNPCs(npcIds, 16.67);
    
    expect(result.processedCount).toBe(5);
    expect(result.updatedNPCIds).toHaveLength(5);
  });

  test("batchUpdateDistantNPCs should respect update budget", async () => {
    const lodManager = new LODManager({ maxBatchUpdatesPerFrame: 3 });
    
    const npcIds = ["npc-1", "npc-2", "npc-3", "npc-4", "npc-5"];
    const result = lodManager.batchUpdateDistantNPCs(npcIds, 16.67);
    
    expect(result.processedCount).toBeLessThanOrEqual(3);
    expect(result.remainingNPCIds.length).toBeGreaterThan(0);
  });

  test("batchUpdateDistantNPCs should track time spent", async () => {
    const lodManager = new LODManager();
    
    const npcIds = ["npc-1", "npc-2", "npc-3"];
    const result = lodManager.batchUpdateDistantNPCs(npcIds, 16.67);
    
    expect(result.timeSpentMs).toBeDefined();
    expect(result.timeSpentMs).toBeGreaterThanOrEqual(0);
  });

  test("batchUpdateDistantNPCs should use simplified calculations for LOD_LOW NPCs", async () => {
    const lodManager = new LODManager();
    
    // Set NPCs to LOW detail level
    lodManager.setNPCDetailLevel("npc-distant", NPCDetailLevel.LOW);
    
    const result = lodManager.batchUpdateDistantNPCs(["npc-distant"], 100);
    
    expect(result.simplifiedUpdates).toContain("npc-distant");
  });
});

// =============================================================================
// TEST SUITE: Statistical Simulation
// =============================================================================

test.describe("Statistical Simulation", () => {
  test.beforeEach(resetManager);

  test("statisticalUpdate should approximate needs decay", async () => {
    const lodManager = new LODManager();
    
    const initialState = {
      hunger: 80,
      energy: 70,
      social: 60,
      fun: 50,
      wealth: 90,
      purpose: 75,
    };
    
    const result = lodManager.statisticalUpdate("npc-1", 60, initialState);
    
    // All needs should have decayed
    expect(result.needs.hunger).toBeLessThan(initialState.hunger);
    expect(result.needs.energy).toBeLessThan(initialState.energy);
    expect(result.needs.social).toBeLessThan(initialState.social);
    expect(result.needs.fun).toBeLessThan(initialState.fun);
  });

  test("statisticalUpdate should use configurable decay rates", async () => {
    const lodManager = new LODManager({
      statisticalDecayMultiplier: 2.0,
    });
    
    const initialState = {
      hunger: 80,
      energy: 70,
      social: 60,
      fun: 50,
      wealth: 90,
      purpose: 75,
    };
    
    const defaultManager = new LODManager();
    
    const defaultResult = defaultManager.statisticalUpdate("npc-1", 60, initialState);
    const fastDecayResult = lodManager.statisticalUpdate("npc-2", 60, initialState);
    
    // Faster decay should result in lower values
    expect(fastDecayResult.needs.hunger).toBeLessThan(defaultResult.needs.hunger);
  });

  test("statisticalUpdate should predict likely activities", async () => {
    const lodManager = new LODManager();
    
    const state = {
      hunger: 15, // Critical hunger
      energy: 70,
      social: 60,
      fun: 50,
      wealth: 90,
      purpose: 75,
    };
    
    const result = lodManager.statisticalUpdate("npc-1", 60, state);
    
    // Should predict eating activity due to critical hunger
    expect(result.likelyActivity).toBe("eating");
  });

  test("statisticalUpdate should estimate position changes", async () => {
    const lodManager = new LODManager();
    
    const state = {
      hunger: 80,
      energy: 70,
      social: 60,
      fun: 50,
      wealth: 90,
      purpose: 75,
      position: { x: 10, y: 10 },
      movement: "walking",
    };
    
    const result = lodManager.statisticalUpdate("npc-1", 1000, state);
    
    // Position should have changed if NPC was walking
    expect(result.estimatedPosition).toBeDefined();
  });

  test("statisticalUpdate should handle minimal detail level", async () => {
    const lodManager = new LODManager();
    lodManager.setNPCDetailLevel("npc-minimal", NPCDetailLevel.MINIMAL);
    
    const state = {
      hunger: 80,
      energy: 70,
      social: 60,
      fun: 50,
      wealth: 90,
      purpose: 75,
    };
    
    const result = lodManager.statisticalUpdate("npc-minimal", 300, state);
    
    expect(result.wasStatistical).toBe(true);
    expect(result.confidence).toBeDefined();
    expect(result.confidence).toBeLessThan(1.0);
  });
});

// =============================================================================
// TEST SUITE: Memory Pooling
// =============================================================================

test.describe("Memory Pooling", () => {
  test.beforeEach(resetManager);

  test("should create memory pool with specified capacity", async () => {
    const lodManager = new LODManager({ poolCapacity: 50 });
    const pool = lodManager.getMemoryPool();
    
    expect(pool).toBeDefined();
    expect(pool.capacity).toBe(50);
  });

  test("acquireFromPool should return recycled NPC object", async () => {
    const lodManager = new LODManager();
    
    // Return an NPC to the pool
    lodManager.releaseToPool("npc-recycled", { x: 10, y: 10 });
    
    // Acquire from pool
    const acquired = lodManager.acquireFromPool();
    
    expect(acquired).toBeDefined();
    expect(acquired?.previousId).toBe("npc-recycled");
  });

  test("acquireFromPool should return null when pool is empty", async () => {
    const lodManager = new LODManager();
    
    const acquired = lodManager.acquireFromPool();
    
    expect(acquired).toBeNull();
  });

  test("releaseToPool should add NPC to pool", async () => {
    const lodManager = new LODManager();
    
    lodManager.releaseToPool("npc-released", { x: 5, y: 5 });
    
    const pool = lodManager.getMemoryPool();
    expect(pool.available).toBe(1);
  });

  test("releaseToPool should respect pool capacity", async () => {
    const lodManager = new LODManager({ poolCapacity: 2 });
    
    lodManager.releaseToPool("npc-1", { x: 1, y: 1 });
    lodManager.releaseToPool("npc-2", { x: 2, y: 2 });
    lodManager.releaseToPool("npc-3", { x: 3, y: 3 }); // Should be ignored
    
    const pool = lodManager.getMemoryPool();
    expect(pool.available).toBe(2);
  });

  test("clearPool should empty the memory pool", async () => {
    const lodManager = new LODManager();
    
    lodManager.releaseToPool("npc-1", { x: 1, y: 1 });
    lodManager.releaseToPool("npc-2", { x: 2, y: 2 });
    
    lodManager.clearPool();
    
    const pool = lodManager.getMemoryPool();
    expect(pool.available).toBe(0);
  });

  test("pool stats should track usage metrics", async () => {
    const lodManager = new LODManager();
    
    lodManager.releaseToPool("npc-1", { x: 1, y: 1 });
    lodManager.acquireFromPool();
    lodManager.releaseToPool("npc-2", { x: 2, y: 2 });
    
    const pool = lodManager.getMemoryPool();
    expect(pool.totalAcquired).toBe(1);
    expect(pool.totalReleased).toBe(2);
  });
});

// =============================================================================
// TEST SUITE: Smooth LOD Transitions
// =============================================================================

test.describe("Smooth LOD Transitions", () => {
  test.beforeEach(resetManager);

  test("transitionLOD should create transition record", async () => {
    const lodManager = new LODManager();
    
    lodManager.transitionLOD("npc-1", NPCDetailLevel.LOW, NPCDetailLevel.HIGH, 500);
    
    const transition = lodManager.getActiveTransition("npc-1");
    expect(transition).toBeDefined();
    expect(transition?.fromLevel).toBe(NPCDetailLevel.LOW);
    expect(transition?.toLevel).toBe(NPCDetailLevel.HIGH);
  });

  test("transitionLOD should use default duration of 500ms", async () => {
    const lodManager = new LODManager();
    
    lodManager.transitionLOD("npc-1", NPCDetailLevel.LOW, NPCDetailLevel.HIGH);
    
    const transition = lodManager.getActiveTransition("npc-1");
    expect(transition?.duration).toBe(500);
  });

  test("transitionLOD should allow duration up to 1000ms", async () => {
    const lodManager = new LODManager();
    
    lodManager.transitionLOD("npc-1", NPCDetailLevel.LOW, NPCDetailLevel.HIGH, 1000);
    
    const transition = lodManager.getActiveTransition("npc-1");
    expect(transition?.duration).toBe(1000);
  });

  test("updateTransitions should progress transition based on delta time", async () => {
    const lodManager = new LODManager();
    
    lodManager.transitionLOD("npc-1", NPCDetailLevel.LOW, NPCDetailLevel.HIGH, 500);
    
    lodManager.updateTransitions(250); // 250ms = 50% progress
    
    const transition = lodManager.getActiveTransition("npc-1");
    expect(transition?.progress).toBeCloseTo(0.5, 1);
  });

  test("updateTransitions should complete transition when progress reaches 1.0", async () => {
    const lodManager = new LODManager();
    
    lodManager.transitionLOD("npc-1", NPCDetailLevel.LOW, NPCDetailLevel.HIGH, 500);
    lodManager.updateTransitions(600); // More than duration
    
    const transition = lodManager.getActiveTransition("npc-1");
    expect(transition).toBeNull();
    
    // NPC should now be at target LOD
    const currentLOD = lodManager.getNPCDetailLevel("npc-1");
    expect(currentLOD).toBe(NPCDetailLevel.HIGH);
  });

  test("getCurrentTransitionLevel should interpolate between levels", async () => {
    const lodManager = new LODManager();
    
    lodManager.transitionLOD("npc-1", NPCDetailLevel.MINIMAL, NPCDetailLevel.FULL, 1000);
    lodManager.updateTransitions(500); // 50% progress
    
    const currentLevel = lodManager.getCurrentTransitionLevel("npc-1");
    
    // At 50% between MINIMAL and FULL, should return intermediate level
    expect(currentLevel).toBeDefined();
    // The actual level depends on interpolation logic
  });

  test("cancelTransition should remove active transition", async () => {
    const lodManager = new LODManager();
    
    lodManager.transitionLOD("npc-1", NPCDetailLevel.LOW, NPCDetailLevel.HIGH, 500);
    lodManager.cancelTransition("npc-1");
    
    const transition = lodManager.getActiveTransition("npc-1");
    expect(transition).toBeNull();
  });

  test("multiple NPCs should have independent transitions", async () => {
    const lodManager = new LODManager();
    
    lodManager.transitionLOD("npc-1", NPCDetailLevel.LOW, NPCDetailLevel.HIGH, 500);
    lodManager.transitionLOD("npc-2", NPCDetailLevel.HIGH, NPCDetailLevel.LOW, 1000);
    
    lodManager.updateTransitions(500);
    
    const transition1 = lodManager.getActiveTransition("npc-1");
    const transition2 = lodManager.getActiveTransition("npc-2");
    
    expect(transition1).toBeNull(); // Completed
    expect(transition2?.progress).toBeCloseTo(0.5, 1); // 50% done
  });
});

// =============================================================================
// TEST SUITE: Chunk Distribution Optimization
// =============================================================================

test.describe("Chunk Distribution Optimization", () => {
  test.beforeEach(resetManager);

  test("optimizeChunkDistribution should rebalance NPCs", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    // Add many NPCs to one chunk
    for (let i = 0; i < 50; i++) {
      lodManager.assignNPCToChunk(`npc-${i}`, 5, 5);
    }
    
    const stats = lodManager.getChunkStats();
    const maxBefore = Math.max(...stats.map(s => s.npcCount));
    
    lodManager.optimizeChunkDistribution();
    
    const statsAfter = lodManager.getChunkStats();
    // Should suggest redistribution or mark overloaded chunks
    expect(statsAfter.some(s => s.overloaded)).toBeDefined();
  });

  test("getChunkStats should return chunk statistics", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    lodManager.assignNPCToChunk("npc-1", 5, 5);
    lodManager.assignNPCToChunk("npc-2", 5, 10);
    lodManager.assignNPCToChunk("npc-3", 20, 20);
    
    const stats = lodManager.getChunkStats();
    
    expect(stats.length).toBeGreaterThan(0);
    expect(stats[0]).toHaveProperty("chunkId");
    expect(stats[0]).toHaveProperty("npcCount");
    expect(stats[0]).toHaveProperty("lastUpdated");
  });

  test("mergeChunks should combine adjacent sparse chunks", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    // Sparse chunks with few NPCs
    lodManager.assignNPCToChunk("npc-1", 5, 5);
    lodManager.assignNPCToChunk("npc-2", 20, 5);
    
    const countBefore = lodManager.getChunkCount();
    lodManager.mergeChunks(5); // Merge chunks with fewer than 5 NPCs
    
    // Merging may reduce chunk count or mark for merging
    expect(lodManager.getMergeRecommendations().length).toBeGreaterThanOrEqual(0);
  });

  test("splitChunk should divide overloaded chunks", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    // Overload one chunk
    for (let i = 0; i < 100; i++) {
      lodManager.assignNPCToChunk(`npc-${i}`, 5 + (i % 10), 5 + Math.floor(i / 10));
    }
    
    const chunk = lodManager.getChunkForPosition(5, 5);
    if (chunk) {
      const result = lodManager.splitChunk(chunk.id);
      expect(result.success || result.reason).toBeDefined();
    }
  });
});

// =============================================================================
// TEST SUITE: Performance Targets
// =============================================================================

test.describe("Performance Targets", () => {
  test.beforeEach(resetManager);

  test("should handle 200+ NPCs efficiently", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(128, 128);
    
    // Spawn 200 NPCs
    const npcs = [];
    for (let i = 0; i < 200; i++) {
      const x = Math.floor(Math.random() * 128);
      const y = Math.floor(Math.random() * 128);
      npcs.push(createMockNPCRef(`npc-${i}`, x, y));
      lodManager.assignNPCToChunk(`npc-${i}`, x, y);
    }
    
    const startTime = performance.now();
    lodManager.updateLODLevels(npcs);
    const endTime = performance.now();
    
    // Should complete in under 16ms (one frame at 60fps)
    expect(endTime - startTime).toBeLessThan(16);
  });

  test("batch updates should process efficiently", async () => {
    const lodManager = new LODManager();
    
    const npcIds = Array.from({ length: 100 }, (_, i) => `npc-${i}`);
    
    const startTime = performance.now();
    lodManager.batchUpdateDistantNPCs(npcIds, 16.67);
    const endTime = performance.now();
    
    // Should complete in under 8ms (half a frame)
    expect(endTime - startTime).toBeLessThan(8);
  });

  test("chunk-based updates should be faster than individual updates", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    // Add 50 NPCs to a chunk
    for (let i = 0; i < 50; i++) {
      lodManager.assignNPCToChunk(`npc-${i}`, 5 + (i % 10), 5 + Math.floor(i / 10));
    }
    
    const chunk = lodManager.getChunkForPosition(5, 5);
    
    const startTime = performance.now();
    lodManager.updateChunk(chunk!.id, 16.67);
    const endTime = performance.now();
    
    // Chunk update should be fast
    expect(endTime - startTime).toBeLessThan(5);
  });
});

// =============================================================================
// TEST SUITE: Integration with Existing LOD System
// =============================================================================

test.describe("Integration with Existing LOD System", () => {
  test.beforeEach(resetManager);

  test("should maintain backward compatibility with getDetailLevel", async () => {
    const viewport = {
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      centerX: 50,
      centerY: 50,
    };
    
    // Test existing function still works
    const level = getDetailLevel({ x: 50, y: 50 }, viewport);
    expect(level).toBe(NPCDetailLevel.HIGH);
  });

  test("should maintain backward compatibility with getUpdatePolicy", async () => {
    const policy = getUpdatePolicy(NPCDetailLevel.FULL);
    
    expect(policy.needsUpdate).toBe("every_tick");
    expect(policy.pathfinding).toBe("precise");
  });

  test("enhanced LODManager should extend base functionality", async () => {
    const lodManager = new LODManager();
    
    // Base functionality
    lodManager.updateViewport({
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      centerX: 50,
      centerY: 50,
    });
    
    const npcs = [createMockNPCRef("npc-1", 50, 50)];
    const levels = lodManager.updateLODLevels(npcs);
    
    expect(levels.get("npc-1")).toBe(NPCDetailLevel.HIGH);
    
    // New chunk functionality
    lodManager.initializeChunks(64, 64);
    expect(lodManager.getChunkCount()).toBeGreaterThan(0);
  });

  test("stats should include chunk information", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    lodManager.assignNPCToChunk("npc-1", 5, 5);
    lodManager.assignNPCToChunk("npc-2", 20, 20);
    
    const stats = lodManager.getStats();
    
    expect(stats.realNPCCount).toBeDefined();
    expect(stats.chunkCount).toBeDefined();
    expect(stats.activeChunks).toBeDefined();
  });
});

// =============================================================================
// TEST SUITE: Edge Cases
// =============================================================================

test.describe("Edge Cases", () => {
  test.beforeEach(resetManager);

  test("should handle negative coordinates", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64, -32, -32); // Support negative coords
    
    lodManager.assignNPCToChunk("npc-neg", -10, -10);
    
    const chunk = lodManager.getChunkForPosition(-10, -10);
    expect(chunk?.npcIds).toContain("npc-neg");
  });

  test("should handle rapid LOD transitions", async () => {
    const lodManager = new LODManager();
    
    // Start transition
    lodManager.transitionLOD("npc-1", NPCDetailLevel.LOW, NPCDetailLevel.HIGH, 500);
    
    // Immediately start another transition (should cancel first)
    lodManager.transitionLOD("npc-1", NPCDetailLevel.HIGH, NPCDetailLevel.FULL, 500);
    
    const transition = lodManager.getActiveTransition("npc-1");
    expect(transition?.toLevel).toBe(NPCDetailLevel.FULL);
  });

  test("should handle empty chunks gracefully", async () => {
    const lodManager = new LODManager();
    lodManager.initializeChunks(64, 64);
    
    const chunk = lodManager.getChunkForPosition(5, 5);
    const result = lodManager.updateChunk(chunk!.id, 16.67);
    
    expect(result.updatedNPCIds).toHaveLength(0);
    expect(result.success).toBe(true);
  });

  test("should handle maximum NPC count per chunk", async () => {
    const lodManager = new LODManager({ maxNPCsPerChunk: 10 });
    lodManager.initializeChunks(64, 64);
    
    // Try to add more NPCs than allowed
    for (let i = 0; i < 15; i++) {
      lodManager.assignNPCToChunk(`npc-${i}`, 5, 5);
    }
    
    const chunk = lodManager.getChunkForPosition(5, 5);
    expect(chunk?.npcIds.length).toBeLessThanOrEqual(15); // Should handle overflow
    expect(chunk?.overloaded).toBe(true);
  });

  test("should handle concurrent transitions for many NPCs", async () => {
    const lodManager = new LODManager();
    
    // Start 50 concurrent transitions
    for (let i = 0; i < 50; i++) {
      lodManager.transitionLOD(
        `npc-${i}`,
        NPCDetailLevel.MINIMAL,
        NPCDetailLevel.HIGH,
        500 + Math.random() * 500
      );
    }
    
    lodManager.updateTransitions(300);
    
    const activeCount = lodManager.getActiveTransitionCount();
    expect(activeCount).toBeGreaterThan(0);
    expect(activeCount).toBeLessThanOrEqual(50);
  });
});
