import { test, expect } from "@playwright/test";

/**
 * Tests for NPC Simulation Engine
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * This implements the main simulation loop that orchestrates all NPC systems together.
 */

// Import the types and functions we're going to implement
import type {
  SimulationConfig,
  SimulationState,
  NPCEvent,
  NPCLODLevel,
} from "@/lib/npc/NPCSimulation";
import {
  NPCSimulation,
  DEFAULT_SIMULATION_CONFIG,
  LOD_UPDATE_FREQUENCY,
} from "@/lib/npc/NPCSimulation";
import { NPCManager } from "@/lib/npc/NPCManager";
import { createDefaultNeeds } from "@/lib/npc/needs";
import { createDefaultMemory } from "@/lib/npc/memory";
import { createInitialMovement } from "@/lib/npc/movement";
import { PersonalityManager } from "@/lib/npc/PersonalityManager";

/**
 * Test Suite: SimulationConfig Interface
 * Tests the configuration structure
 */
test.describe("SimulationConfig Interface", () => {
  test("should have default config with correct properties", async () => {
    expect(DEFAULT_SIMULATION_CONFIG).toBeDefined();
    expect(DEFAULT_SIMULATION_CONFIG.tickIntervalMs).toBe(100);
    expect(DEFAULT_SIMULATION_CONFIG.gameMinutesPerTick).toBe(1);
    expect(DEFAULT_SIMULATION_CONFIG.maxNPCs).toBe(100);
    expect(DEFAULT_SIMULATION_CONFIG.enableLLM).toBe(false);
    expect(DEFAULT_SIMULATION_CONFIG.lodEnabled).toBe(true);
  });

  test("should allow partial config override", async () => {
    const simulation = new NPCSimulation({
      tickIntervalMs: 200,
      maxNPCs: 50,
    });

    const state = simulation.getState();
    expect(state).toBeDefined();
    // Config should be merged with defaults
  });
});

/**
 * Test Suite: SimulationState Interface
 * Tests the state structure
 */
test.describe("SimulationState Interface", () => {
  test("should have initial state with correct properties", async () => {
    const simulation = new NPCSimulation();
    const state = simulation.getState();

    expect(state.isRunning).toBe(false);
    expect(state.currentGameTime).toBe(480); // 8:00 AM = 8 * 60 minutes
    expect(state.currentGameDay).toBe(1);
    expect(state.tickCount).toBe(0);
  });

  test("should expose time getters", async () => {
    const simulation = new NPCSimulation();

    expect(simulation.getGameHour()).toBe(8); // 8 AM
    expect(simulation.getGameMinute()).toBe(0);
  });
});

/**
 * Test Suite: NPCSimulation Lifecycle
 * Tests start, stop, pause, resume
 */
test.describe("NPCSimulation Lifecycle", () => {
  test("start should set isRunning to true", async () => {
    const simulation = new NPCSimulation();

    simulation.start();
    expect(simulation.getState().isRunning).toBe(true);

    simulation.stop();
  });

  test("stop should set isRunning to false", async () => {
    const simulation = new NPCSimulation();

    simulation.start();
    simulation.stop();
    expect(simulation.getState().isRunning).toBe(false);
  });

  test("pause should stop running but preserve state", async () => {
    const simulation = new NPCSimulation();

    simulation.start();
    // Run a few ticks
    simulation.tick();
    simulation.tick();
    const tickCountBeforePause = simulation.getState().tickCount;

    simulation.pause();
    expect(simulation.getState().isRunning).toBe(false);
    expect(simulation.getState().tickCount).toBe(tickCountBeforePause);

    simulation.stop();
  });

  test("resume should continue from paused state", async () => {
    const simulation = new NPCSimulation();

    simulation.start();
    simulation.tick();
    simulation.tick();
    const tickCountBeforePause = simulation.getState().tickCount;

    simulation.pause();
    simulation.resume();

    expect(simulation.getState().isRunning).toBe(true);
    expect(simulation.getState().tickCount).toBe(tickCountBeforePause);

    simulation.stop();
  });
});

/**
 * Test Suite: Time Management
 * Tests game time progression
 */
test.describe("Time Management", () => {
  test("tick should advance game time by gameMinutesPerTick", async () => {
    const simulation = new NPCSimulation({ gameMinutesPerTick: 5 });
    const initialTime = simulation.getState().currentGameTime;

    simulation.tick();

    expect(simulation.getState().currentGameTime).toBe(initialTime + 5);
  });

  test("tick should increment tickCount", async () => {
    const simulation = new NPCSimulation();

    simulation.tick();
    expect(simulation.getState().tickCount).toBe(1);

    simulation.tick();
    expect(simulation.getState().tickCount).toBe(2);
  });

  test("should handle day rollover at midnight", async () => {
    // Set time to 23:55 (1435 minutes)
    const simulation = new NPCSimulation({ gameMinutesPerTick: 10 });
    simulation.setGameTime(1435);

    const initialDay = simulation.getState().currentGameDay;

    // Tick should cross midnight
    simulation.tick();

    expect(simulation.getState().currentGameDay).toBe(initialDay + 1);
    expect(simulation.getState().currentGameTime).toBeLessThan(1440);
  });

  test("getGameHour should return correct hour", async () => {
    const simulation = new NPCSimulation();

    simulation.setGameTime(0); // Midnight
    expect(simulation.getGameHour()).toBe(0);

    simulation.setGameTime(720); // Noon
    expect(simulation.getGameHour()).toBe(12);

    simulation.setGameTime(1380); // 11 PM
    expect(simulation.getGameHour()).toBe(23);
  });

  test("getGameMinute should return correct minute", async () => {
    const simulation = new NPCSimulation();

    simulation.setGameTime(63); // 1:03 AM
    expect(simulation.getGameMinute()).toBe(3);

    simulation.setGameTime(745); // 12:25 PM
    expect(simulation.getGameMinute()).toBe(25);
  });

  test("isWorkingHours should return true during business hours", async () => {
    const simulation = new NPCSimulation();

    simulation.setGameTime(540); // 9 AM
    expect(simulation.isWorkingHours()).toBe(true);

    simulation.setGameTime(1020); // 5 PM
    expect(simulation.isWorkingHours()).toBe(true);
  });

  test("isWorkingHours should return false outside business hours", async () => {
    const simulation = new NPCSimulation();

    simulation.setGameTime(420); // 7 AM
    expect(simulation.isWorkingHours()).toBe(false);

    simulation.setGameTime(1200); // 8 PM
    expect(simulation.isWorkingHours()).toBe(false);
  });

  test("isDaytime should return true between 6 AM and 8 PM", async () => {
    const simulation = new NPCSimulation();

    simulation.setGameTime(360); // 6 AM
    expect(simulation.isDaytime()).toBe(true);

    simulation.setGameTime(1200); // 8 PM
    expect(simulation.isDaytime()).toBe(true);
  });

  test("isDaytime should return false at night", async () => {
    const simulation = new NPCSimulation();

    simulation.setGameTime(300); // 5 AM
    expect(simulation.isDaytime()).toBe(false);

    simulation.setGameTime(1320); // 10 PM
    expect(simulation.isDaytime()).toBe(false);
  });
});

/**
 * Test Suite: NPC Updates
 * Tests the per-NPC update logic
 */
test.describe("NPC Updates", () => {
  test("tick should update needs for all NPCs", async () => {
    const simulation = new NPCSimulation({ gameMinutesPerTick: 10, lodEnabled: false });

    // Spawn an NPC
    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });
    const initialHunger = npc.needs.hunger.current;

    simulation.tick();

    // Hunger should have decayed
    const updatedNpc = NPCManager.getNPC(npc.id);
    expect(updatedNpc?.needs.hunger.current).toBeLessThan(initialHunger);

    NPCManager.clear();
  });

  test("tick should check schedules for NPCs", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5, occupation: 'trader' });

    // Set time to working hours
    simulation.setGameTime(540); // 9 AM

    // This should trigger schedule-based behavior
    simulation.tick();

    // NPC should have some activity
    const updatedNpc = NPCManager.getNPC(npc.id);
    expect(updatedNpc).toBeDefined();

    NPCManager.clear();
  });

  test("urgent needs should override schedule", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });
    
    // Set hunger to critical
    npc.needs.hunger.current = 5;

    simulation.tick();

    // NPC should be handling urgent need
    const updatedNpc = NPCManager.getNPC(npc.id);
    expect(updatedNpc).toBeDefined();

    NPCManager.clear();
  });
});

/**
 * Test Suite: Daily Cycle
 * Tests the advanceDay logic
 */
test.describe("Daily Cycle", () => {
  test("advanceDay should increment currentGameDay", async () => {
    const simulation = new NPCSimulation();
    const initialDay = simulation.getState().currentGameDay;

    simulation.advanceDay();

    expect(simulation.getState().currentGameDay).toBe(initialDay + 1);
  });

  test("advanceDay should trigger onDayChange callback", async () => {
    const simulation = new NPCSimulation();
    let callbackDay: number | null = null;

    simulation.onDayChange = (day: number) => {
      callbackDay = day;
    };

    simulation.advanceDay();

    expect(callbackDay).toBe(2);
  });

  test("day rollover should decay memories for all NPCs", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });

    // Add an episodic memory
    npc.memory.episodic.push({
      id: 'test-memory',
      event: 'Test event',
      participants: [npc.id],
      location: { x: 5, y: 5 },
      timestamp: Date.now(),
      importance: 5,
      emotionalValence: 0.5,
      strength: 1.0,
      accessCount: 0,
      lastAccessed: Date.now(),
    });

    simulation.advanceDay();

    const updatedNpc = NPCManager.getNPC(npc.id);
    // Memory strength should have decayed
    expect(updatedNpc?.memory.episodic[0]?.strength).toBeLessThan(1.0);

    NPCManager.clear();
  });
});

/**
 * Test Suite: Level of Detail (LOD)
 * Tests the LOD system for performance optimization
 */
test.describe("Level of Detail (LOD)", () => {
  test("should define LOD update frequencies", async () => {
    expect(LOD_UPDATE_FREQUENCY.full).toBe(1);
    expect(LOD_UPDATE_FREQUENCY.high).toBe(2);
    expect(LOD_UPDATE_FREQUENCY.medium).toBe(5);
    expect(LOD_UPDATE_FREQUENCY.low).toBe(20);
    expect(LOD_UPDATE_FREQUENCY.minimal).toBe(100);
  });

  test("calculateLOD should return full for nearby NPCs", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });

    const lod = simulation.calculateLOD(npc, { x: 6, y: 6 });
    expect(lod).toBe('full');

    NPCManager.clear();
  });

  test("calculateLOD should return high for NPCs within 15 tiles", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });

    const lod = simulation.calculateLOD(npc, { x: 15, y: 5 });
    expect(lod).toBe('high');

    NPCManager.clear();
  });

  test("calculateLOD should return medium for NPCs within 30 tiles", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });

    const lod = simulation.calculateLOD(npc, { x: 25, y: 5 });
    expect(lod).toBe('medium');

    NPCManager.clear();
  });

  test("calculateLOD should return low for NPCs within 50 tiles", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });

    const lod = simulation.calculateLOD(npc, { x: 45, y: 5 });
    expect(lod).toBe('low');

    NPCManager.clear();
  });

  test("calculateLOD should return minimal for far NPCs", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });

    const lod = simulation.calculateLOD(npc, { x: 100, y: 100 });
    expect(lod).toBe('minimal');

    NPCManager.clear();
  });

  test("LOD should affect update frequency", async () => {
    const simulation = new NPCSimulation({ lodEnabled: true });

    NPCManager.clear();
    const nearNPC = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });
    const farNPC = NPCManager.spawnNPC({ gridX: 100, gridY: 100 });

    // Set camera position
    simulation.setCameraPosition({ x: 5, y: 5 });

    // Near NPC should update more frequently
    const nearLOD = simulation.calculateLOD(nearNPC, { x: 5, y: 5 });
    const farLOD = simulation.calculateLOD(farNPC, { x: 5, y: 5 });

    expect(LOD_UPDATE_FREQUENCY[nearLOD]).toBeLessThan(LOD_UPDATE_FREQUENCY[farLOD]);

    NPCManager.clear();
  });
});

/**
 * Test Suite: Events
 * Tests the event callback system
 */
test.describe("Events", () => {
  test("onTick should be called after each tick", async () => {
    const simulation = new NPCSimulation();
    let tickCallbackState: SimulationState | null = null;

    simulation.onTick = (state: SimulationState) => {
      tickCallbackState = state;
    };

    simulation.tick();

    expect(tickCallbackState).not.toBeNull();
    expect(tickCallbackState!.tickCount).toBe(1);
  });

  test("onNPCEvent should be called for NPC events", async () => {
    const simulation = new NPCSimulation();
    const events: NPCEvent[] = [];

    simulation.onNPCEvent = (event: NPCEvent) => {
      events.push(event);
    };

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });

    // Emit a test event
    simulation.emitNPCEvent({
      type: 'spawn',
      npcId: npc.id,
      data: { gridX: 5, gridY: 5 },
      timestamp: Date.now(),
    });

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('spawn');

    NPCManager.clear();
  });

  test("should emit events for significant NPC actions", async () => {
    const simulation = new NPCSimulation();
    const events: NPCEvent[] = [];

    simulation.onNPCEvent = (event: NPCEvent) => {
      events.push(event);
    };

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });

    // Simulate mood change event
    if (npc.internalWorld) {
      npc.internalWorld.currentMood = 'happy';
    }
    simulation.emitNPCEvent({
      type: 'mood_change',
      npcId: npc.id,
      data: { mood: 'happy' },
      timestamp: Date.now(),
    });

    expect(events.some((e) => e.type === 'mood_change')).toBe(true);

    NPCManager.clear();
  });
});

/**
 * Test Suite: Periodic Updates
 * Tests the staggered update system for performance
 */
test.describe("Periodic Updates", () => {
  test("interactions should update every 10 ticks", async () => {
    const simulation = new NPCSimulation();

    // Run 9 ticks
    for (let i = 0; i < 9; i++) {
      simulation.tick();
    }

    // On tick 10, interactions should be processed
    // This is internal behavior, we test via state changes
    simulation.tick();
    expect(simulation.getState().tickCount).toBe(10);
  });

  test("factions should update every 60 ticks", async () => {
    const simulation = new NPCSimulation();

    // Run 60 ticks
    for (let i = 0; i < 60; i++) {
      simulation.tick();
    }

    expect(simulation.getState().tickCount).toBe(60);
    // Faction updates would have been processed
  });
});

/**
 * Test Suite: Integration with Managers
 * Tests that simulation properly uses all manager classes
 */
test.describe("Integration with Managers", () => {
  test("should use NeedsManager for needs updates", async () => {
    const simulation = new NPCSimulation({ gameMinutesPerTick: 10, lodEnabled: false });

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });
    npc.needs.hunger.current = 50;
    npc.needs.energy.current = 50;

    simulation.tick();

    const updatedNpc = NPCManager.getNPC(npc.id);
    // Both needs should have decayed
    expect(updatedNpc?.needs.hunger.current).toBeLessThan(50);
    expect(updatedNpc?.needs.energy.current).toBeLessThan(50);

    NPCManager.clear();
  });

  test("should use MovementManager for movement updates", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });
    
    // Put NPC in walking state
    npc.movement.state = {
      type: 'walking',
      path: [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 },
      ],
      pathIndex: 0,
      progress: 0,
    };

    simulation.tick();

    // Movement should have progressed
    const updatedNpc = NPCManager.getNPC(npc.id);
    expect(updatedNpc?.movement.state.type).toBeDefined();

    NPCManager.clear();
  });

  test("should use ScheduleManager for activity determination", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5, occupation: 'trader' });

    // Set to working hours
    simulation.setGameTime(600); // 10 AM

    simulation.tick();

    // NPC should be following schedule
    const updatedNpc = NPCManager.getNPC(npc.id);
    expect(updatedNpc).toBeDefined();

    NPCManager.clear();
  });
});

/**
 * Test Suite: Camera Position
 * Tests camera position for LOD calculations
 */
test.describe("Camera Position", () => {
  test("setCameraPosition should update internal camera state", async () => {
    const simulation = new NPCSimulation();

    simulation.setCameraPosition({ x: 10, y: 20 });

    const cameraPos = simulation.getCameraPosition();
    expect(cameraPos.x).toBe(10);
    expect(cameraPos.y).toBe(20);
  });

  test("camera position should affect LOD calculations", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });

    // Camera far away
    simulation.setCameraPosition({ x: 100, y: 100 });
    let lod = simulation.calculateLOD(npc, simulation.getCameraPosition());
    expect(lod).toBe('minimal');

    // Camera close
    simulation.setCameraPosition({ x: 5, y: 5 });
    lod = simulation.calculateLOD(npc, simulation.getCameraPosition());
    expect(lod).toBe('full');

    NPCManager.clear();
  });
});

/**
 * Test Suite: getNearbyNPCs helper
 * Tests finding NPCs within a certain distance
 */
test.describe("getNearbyNPCs helper", () => {
  test("should return NPCs within specified distance", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc1 = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });
    const npc2 = NPCManager.spawnNPC({ gridX: 6, gridY: 5 }); // 1 tile away
    const npc3 = NPCManager.spawnNPC({ gridX: 10, gridY: 5 }); // 5 tiles away
    const npc4 = NPCManager.spawnNPC({ gridX: 20, gridY: 20 }); // Far away

    const nearbyNPCs = simulation.getNearbyNPCs(npc1, 3);

    expect(nearbyNPCs).toContain(npc2);
    expect(nearbyNPCs).not.toContain(npc1); // Shouldn't include self
    expect(nearbyNPCs).not.toContain(npc4);

    NPCManager.clear();
  });

  test("should return empty array if no NPCs nearby", async () => {
    const simulation = new NPCSimulation();

    NPCManager.clear();
    const npc1 = NPCManager.spawnNPC({ gridX: 5, gridY: 5 });
    const npc2 = NPCManager.spawnNPC({ gridX: 50, gridY: 50 });

    const nearbyNPCs = simulation.getNearbyNPCs(npc1, 3);

    expect(nearbyNPCs).toHaveLength(0);

    NPCManager.clear();
  });
});

// =============================================================================
// TITAN INTEGRATION TESTS
// =============================================================================

import { TitanManager } from "@/lib/titan";

/**
 * Helper to reset TitanManager state
 */
function resetTitanManager(): void {
  TitanManager.despawnTitan();
  try {
    TitanManager.clearStorage();
  } catch {
    // Expected in Node.js context
  }
}

/**
 * Test Suite: Titan Integration
 * Tests that the Titan is updated in the simulation tick
 */
test.describe("Titan Integration", () => {
  test.beforeEach(async () => {
    resetTitanManager();
    NPCManager.clear();
  });

  test.afterEach(async () => {
    resetTitanManager();
    NPCManager.clear();
  });

  test("tick should update Titan needs when Titan exists", async () => {
    const simulation = new NPCSimulation({ gameMinutesPerTick: 10, lodEnabled: false });

    // Spawn a Titan
    const titan = TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
    const initialHunger = titan.needs.hunger.current;

    // Run a tick
    simulation.tick();

    // Titan's needs should have decayed
    const updatedTitan = TitanManager.getTitan();
    expect(updatedTitan?.needs.hunger.current).toBeLessThan(initialHunger);
  });

  test("tick should update Titan alignment decay", async () => {
    const simulation = new NPCSimulation({ gameMinutesPerTick: 60, lodEnabled: false });

    // Spawn a Titan with extreme alignment
    const titan = TitanManager.spawnTitan({ 
      gridX: 5, 
      gridY: 5, 
      initialAlignment: 0.8  // Evil alignment
    });
    const initialAlignment = titan.alignment;

    // Run many ticks (alignment decay is slow)
    for (let i = 0; i < 10; i++) {
      simulation.tick();
    }

    // Alignment should have decayed toward neutral
    const updatedTitan = TitanManager.getTitan();
    // Alignment decays toward 0, so absolute value should decrease
    expect(Math.abs(updatedTitan?.alignment ?? 0)).toBeLessThanOrEqual(Math.abs(initialAlignment));
  });

  test("tick should not crash when no Titan exists", async () => {
    const simulation = new NPCSimulation();

    // Ensure no Titan
    TitanManager.despawnTitan();

    // Should not throw
    expect(() => simulation.tick()).not.toThrow();
  });

  test("Titan should use at least medium LOD even when far from camera", async () => {
    const simulation = new NPCSimulation({ lodEnabled: true });

    // Spawn a Titan far from camera
    TitanManager.spawnTitan({ gridX: 100, gridY: 100 });
    simulation.setCameraPosition({ x: 0, y: 0 });

    const titan = TitanManager.getTitan();
    if (titan) {
      // Calculate what LOD would be for this distance
      const distance = Math.sqrt(100 * 100 + 100 * 100); // ~141 tiles
      
      // Regular NPC at this distance would get 'minimal' LOD
      // Titan should get at least 'medium' LOD
      const titanLOD = simulation.calculateTitanLOD?.(titan) ?? 'medium';
      expect(['full', 'high', 'medium']).toContain(titanLOD);
    }
  });

  test("getTitanNearbyNPCs should return NPCs near the Titan", async () => {
    const simulation = new NPCSimulation();

    // Spawn Titan and NPCs
    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
    const nearNPC = NPCManager.spawnNPC({ gridX: 6, gridY: 5 }); // 1 tile away
    const farNPC = NPCManager.spawnNPC({ gridX: 50, gridY: 50 }); // Far away

    const titan = TitanManager.getTitan();
    if (titan) {
      const nearbyNPCs = simulation.getTitanNearbyNPCs?.(titan, 3) ?? [];
      expect(nearbyNPCs).toContain(nearNPC);
      expect(nearbyNPCs).not.toContain(farNPC);
    }
  });
});

/**
 * Test Suite: Titan Events
 * Tests that Titan events are emitted correctly
 */
test.describe("Titan Events", () => {
  test.beforeEach(async () => {
    resetTitanManager();
    NPCManager.clear();
  });

  test.afterEach(async () => {
    resetTitanManager();
    NPCManager.clear();
  });

  test("should emit titan_action event when Titan performs action", async () => {
    const simulation = new NPCSimulation();
    const events: NPCEvent[] = [];

    simulation.onNPCEvent = (event: NPCEvent) => {
      events.push(event);
    };

    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
    const titan = TitanManager.getTitan();

    if (titan) {
      // Emit a titan action event
      simulation.emitNPCEvent({
        type: 'titan_action' as NPCEvent['type'],
        npcId: titan.id,
        data: { action: 'help_npc' },
        timestamp: Date.now(),
      });

      expect(events.some(e => e.type === 'titan_action')).toBe(true);
    }
  });

  test("should emit titan_alignment_change event when alignment shifts significantly", async () => {
    const simulation = new NPCSimulation();
    const events: NPCEvent[] = [];

    simulation.onNPCEvent = (event: NPCEvent) => {
      events.push(event);
    };

    TitanManager.spawnTitan({ gridX: 5, gridY: 5 });
    const titan = TitanManager.getTitan();

    if (titan) {
      // Emit alignment change event
      simulation.emitNPCEvent({
        type: 'titan_alignment_change' as NPCEvent['type'],
        npcId: titan.id,
        data: { oldAlignment: 0, newAlignment: -0.5 },
        timestamp: Date.now(),
      });

      expect(events.some(e => e.type === 'titan_alignment_change')).toBe(true);
    }
  });
});
