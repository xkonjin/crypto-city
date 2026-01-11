import { test, expect } from "@playwright/test";

/**
 * Tests for NPC Pathfinding System (Issue #101)
 * 
 * TDD Phase 1: Write failing tests first to define expected behavior.
 * This implements A* pathfinding for NPCs to navigate between buildings on the isometric grid.
 */

import type { GridPosition, PathNode, PathfindingOptions } from "@/lib/npc/pathfinding";
import {
  findPath,
  isWalkable,
  getBuildingEntrance,
  manhattanDistance,
  reconstructPath,
  DEFAULT_PATHFINDING_OPTIONS,
} from "@/lib/npc/pathfinding";

import type { MovementState, NPCMovement } from "@/lib/npc/movement";
import {
  MovementManager,
  MOVEMENT_DESCRIPTIONS,
  createInitialMovement,
} from "@/lib/npc/movement";

import type { Tile } from "@/games/isocity/types/game";
import type { Building, BuildingType } from "@/games/isocity/types/buildings";

/**
 * Helper to create a mock tile
 */
function createMockTile(
  x: number,
  y: number,
  buildingType: BuildingType = 'grass'
): Tile {
  const building: Building = {
    type: buildingType,
    level: 1,
    population: 0,
    jobs: 0,
    powered: true,
    watered: true,
    onFire: false,
    fireProgress: 0,
    age: 0,
    constructionProgress: 100,
    abandoned: false,
  };

  return {
    x,
    y,
    zone: 'none',
    building,
    landValue: 0,
    pollution: 0,
    crime: 0,
    traffic: 0,
    hasSubway: false,
  };
}

/**
 * Helper to create a mock grid
 */
function createMockGrid(size: number): Tile[][] {
  const grid: Tile[][] = [];
  for (let y = 0; y < size; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < size; x++) {
      row.push(createMockTile(x, y, 'grass'));
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Test Suite: GridPosition Interface
 */
test.describe("GridPosition Interface", () => {
  test("should define x and y coordinates", async () => {
    const pos: GridPosition = { x: 5, y: 10 };
    expect(pos.x).toBe(5);
    expect(pos.y).toBe(10);
  });
});

/**
 * Test Suite: PathNode Interface
 */
test.describe("PathNode Interface", () => {
  test("should define A* node properties", async () => {
    const node: PathNode = {
      x: 5,
      y: 10,
      g: 5,
      h: 10,
      f: 15,
      parent: null,
    };

    expect(node.x).toBe(5);
    expect(node.y).toBe(10);
    expect(node.g).toBe(5);
    expect(node.h).toBe(10);
    expect(node.f).toBe(15);
    expect(node.parent).toBeNull();
  });

  test("should allow parent node reference", async () => {
    const parentNode: PathNode = {
      x: 4,
      y: 9,
      g: 4,
      h: 11,
      f: 15,
      parent: null,
    };

    const childNode: PathNode = {
      x: 5,
      y: 10,
      g: 5,
      h: 10,
      f: 15,
      parent: parentNode,
    };

    expect(childNode.parent).toBe(parentNode);
    expect(childNode.parent?.x).toBe(4);
    expect(childNode.parent?.y).toBe(9);
  });
});

/**
 * Test Suite: PathfindingOptions Interface
 */
test.describe("PathfindingOptions Interface", () => {
  test("should define default options", async () => {
    expect(DEFAULT_PATHFINDING_OPTIONS.preferRoads).toBe(true);
    expect(DEFAULT_PATHFINDING_OPTIONS.avoidBuildings).toBe(true);
    expect(DEFAULT_PATHFINDING_OPTIONS.maxIterations).toBeGreaterThan(0);
  });

  test("should allow custom options", async () => {
    const options: PathfindingOptions = {
      preferRoads: false,
      avoidBuildings: true,
      maxIterations: 500,
    };

    expect(options.preferRoads).toBe(false);
    expect(options.avoidBuildings).toBe(true);
    expect(options.maxIterations).toBe(500);
  });
});

/**
 * Test Suite: manhattanDistance
 */
test.describe("manhattanDistance", () => {
  test("should calculate distance between two points", async () => {
    expect(manhattanDistance(0, 0, 5, 5)).toBe(10);
    expect(manhattanDistance(0, 0, 3, 4)).toBe(7);
    expect(manhattanDistance(5, 5, 5, 5)).toBe(0);
  });

  test("should handle negative coordinates", async () => {
    expect(manhattanDistance(-2, -3, 2, 3)).toBe(10);
  });

  test("should be symmetric", async () => {
    expect(manhattanDistance(0, 0, 5, 3)).toBe(manhattanDistance(5, 3, 0, 0));
  });
});

/**
 * Test Suite: isWalkable
 */
test.describe("isWalkable", () => {
  test("should return true for grass tiles", async () => {
    const grid = createMockGrid(10);
    expect(isWalkable(5, 5, grid)).toBe(true);
  });

  test("should return true for road tiles", async () => {
    const grid = createMockGrid(10);
    grid[5][5].building.type = 'road';
    expect(isWalkable(5, 5, grid)).toBe(true);
  });

  test("should return false for building tiles", async () => {
    const grid = createMockGrid(10);
    grid[5][5].building.type = 'house_small';
    expect(isWalkable(5, 5, grid)).toBe(false);
  });

  test("should return false for water tiles", async () => {
    const grid = createMockGrid(10);
    grid[5][5].building.type = 'water';
    expect(isWalkable(5, 5, grid)).toBe(false);
  });

  test("should return false for out-of-bounds coordinates", async () => {
    const grid = createMockGrid(10);
    expect(isWalkable(-1, 5, grid)).toBe(false);
    expect(isWalkable(5, -1, grid)).toBe(false);
    expect(isWalkable(10, 5, grid)).toBe(false);
    expect(isWalkable(5, 10, grid)).toBe(false);
  });

  test("should return true for empty tiles", async () => {
    const grid = createMockGrid(10);
    grid[5][5].building.type = 'empty';
    expect(isWalkable(5, 5, grid)).toBe(true);
  });

  test("should return true for tree tiles (can walk past)", async () => {
    const grid = createMockGrid(10);
    grid[5][5].building.type = 'tree';
    expect(isWalkable(5, 5, grid)).toBe(true);
  });
});

/**
 * Test Suite: findPath - Basic Pathfinding
 */
test.describe("findPath - Basic Pathfinding", () => {
  test("should find path on empty grid", async () => {
    const grid = createMockGrid(10);
    const path = findPath(0, 0, 5, 5, grid);

    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
    expect(path![0]).toEqual({ x: 0, y: 0 });
    expect(path![path!.length - 1]).toEqual({ x: 5, y: 5 });
  });

  test("should find direct path when no obstacles", async () => {
    const grid = createMockGrid(10);
    const path = findPath(0, 0, 0, 5, grid);

    expect(path).not.toBeNull();
    // Direct vertical path should be 6 tiles (0 to 5 inclusive)
    expect(path!.length).toBe(6);
  });

  test("should return path with start and end positions", async () => {
    const grid = createMockGrid(10);
    const path = findPath(2, 3, 7, 8, grid);

    expect(path).not.toBeNull();
    expect(path![0]).toEqual({ x: 2, y: 3 });
    expect(path![path!.length - 1]).toEqual({ x: 7, y: 8 });
  });

  test("should return null when start is blocked", async () => {
    const grid = createMockGrid(10);
    grid[0][0].building.type = 'house_small';
    const path = findPath(0, 0, 5, 5, grid);

    expect(path).toBeNull();
  });

  test("should return null when end is blocked", async () => {
    const grid = createMockGrid(10);
    grid[5][5].building.type = 'house_small';
    const path = findPath(0, 0, 5, 5, grid);

    expect(path).toBeNull();
  });

  test("should return single-element path when start equals end", async () => {
    const grid = createMockGrid(10);
    const path = findPath(5, 5, 5, 5, grid);

    expect(path).not.toBeNull();
    expect(path!.length).toBe(1);
    expect(path![0]).toEqual({ x: 5, y: 5 });
  });
});

/**
 * Test Suite: findPath - Obstacle Avoidance
 */
test.describe("findPath - Obstacle Avoidance", () => {
  test("should navigate around buildings", async () => {
    const grid = createMockGrid(10);
    // Create a wall of buildings
    for (let y = 0; y < 8; y++) {
      grid[y][5].building.type = 'house_small';
    }

    const path = findPath(0, 4, 9, 4, grid);

    expect(path).not.toBeNull();
    // Path should go around the wall
    expect(path!.some(p => p.x === 5 && p.y >= 0 && p.y < 8)).toBe(false);
  });

  test("should find path through gap in obstacles", async () => {
    const grid = createMockGrid(10);
    // Create a wall with a gap
    for (let y = 0; y < 10; y++) {
      if (y !== 5) {
        grid[y][5].building.type = 'house_small';
      }
    }

    const path = findPath(0, 5, 9, 5, grid);

    expect(path).not.toBeNull();
    expect(path!.some(p => p.x === 5 && p.y === 5)).toBe(true);
  });

  test("should return null when path is completely blocked", async () => {
    const grid = createMockGrid(10);
    // Create impassable wall
    for (let y = 0; y < 10; y++) {
      grid[y][5].building.type = 'house_small';
    }

    const path = findPath(0, 5, 9, 5, grid);

    expect(path).toBeNull();
  });

  test("should avoid water tiles", async () => {
    const grid = createMockGrid(10);
    // Create a river
    for (let x = 0; x < 10; x++) {
      grid[5][x].building.type = 'water';
    }

    const path = findPath(0, 3, 0, 7, grid);

    expect(path).toBeNull(); // No bridge, can't cross
  });
});

/**
 * Test Suite: findPath - Road Preference
 */
test.describe("findPath - Road Preference", () => {
  test("should prefer roads when preferRoads option is true", async () => {
    const grid = createMockGrid(10);
    // Create a road from (0,0) to (5,5) via (5,0)
    for (let x = 0; x <= 5; x++) {
      grid[0][x].building.type = 'road';
    }
    for (let y = 0; y <= 5; y++) {
      grid[y][5].building.type = 'road';
    }

    const path = findPath(0, 0, 5, 5, grid, { preferRoads: true, avoidBuildings: true, maxIterations: 1000 });

    expect(path).not.toBeNull();
    // Path should follow roads more often than not
    const roadTiles = path!.filter(p => grid[p.y][p.x].building.type === 'road');
    expect(roadTiles.length).toBeGreaterThan(path!.length / 2);
  });

  test("should not prioritize roads when preferRoads is false", async () => {
    const grid = createMockGrid(10);
    // Create a longer road path
    for (let x = 0; x <= 9; x++) {
      grid[0][x].building.type = 'road';
    }
    for (let y = 0; y <= 5; y++) {
      grid[y][9].building.type = 'road';
    }

    const pathWithRoads = findPath(0, 0, 5, 5, grid, { preferRoads: true, avoidBuildings: true, maxIterations: 1000 });
    const pathWithoutRoads = findPath(0, 0, 5, 5, grid, { preferRoads: false, avoidBuildings: true, maxIterations: 1000 });

    expect(pathWithRoads).not.toBeNull();
    expect(pathWithoutRoads).not.toBeNull();
    // Without road preference, path should be more direct
    expect(pathWithoutRoads!.length).toBeLessThanOrEqual(pathWithRoads!.length);
  });
});

/**
 * Test Suite: findPath - Performance
 */
test.describe("findPath - Performance", () => {
  test("should respect maxIterations limit", async () => {
    const grid = createMockGrid(48);
    // Very limited iterations should fail to find long paths
    const path = findPath(0, 0, 47, 47, grid, { preferRoads: false, avoidBuildings: true, maxIterations: 10 });

    expect(path).toBeNull();
  });

  test("should find path on 48x48 grid within reasonable iterations", async () => {
    const grid = createMockGrid(48);
    const path = findPath(0, 0, 47, 47, grid, { preferRoads: false, avoidBuildings: true, maxIterations: 10000 });

    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: getBuildingEntrance
 */
test.describe("getBuildingEntrance", () => {
  test("should return entrance position for a building", async () => {
    const grid = createMockGrid(10);
    // Place a small house with road in front
    grid[5][5].building.type = 'house_small';
    grid[6][5].building.type = 'road'; // South of building

    const entrance = getBuildingEntrance('house_5_5', grid);

    expect(entrance).not.toBeNull();
    // Entrance should be adjacent to building
    expect(Math.abs(entrance!.x - 5) + Math.abs(entrance!.y - 5)).toBe(1);
  });

  test("should return null for non-existent building", async () => {
    const grid = createMockGrid(10);
    const entrance = getBuildingEntrance('nonexistent_building', grid);

    expect(entrance).toBeNull();
  });

  test("should prefer road-adjacent entrance", async () => {
    const grid = createMockGrid(10);
    grid[5][5].building.type = 'house_small';
    grid[6][5].building.type = 'road'; // Road to south

    const entrance = getBuildingEntrance('house_5_5', grid);

    expect(entrance).not.toBeNull();
    expect(entrance).toEqual({ x: 5, y: 6 }); // Should prefer road entrance
  });

  test("should return any walkable adjacent tile if no road", async () => {
    const grid = createMockGrid(10);
    grid[5][5].building.type = 'house_small';
    // No roads, but grass is walkable

    const entrance = getBuildingEntrance('house_5_5', grid);

    expect(entrance).not.toBeNull();
    // Should return one of the adjacent grass tiles
    const isAdjacent = 
      (entrance!.x === 4 && entrance!.y === 5) ||
      (entrance!.x === 6 && entrance!.y === 5) ||
      (entrance!.x === 5 && entrance!.y === 4) ||
      (entrance!.x === 5 && entrance!.y === 6);
    expect(isAdjacent).toBe(true);
  });
});

/**
 * Test Suite: reconstructPath
 */
test.describe("reconstructPath", () => {
  test("should reconstruct path from end node", async () => {
    const node1: PathNode = { x: 0, y: 0, g: 0, h: 5, f: 5, parent: null };
    const node2: PathNode = { x: 1, y: 0, g: 1, h: 4, f: 5, parent: node1 };
    const node3: PathNode = { x: 2, y: 0, g: 2, h: 3, f: 5, parent: node2 };

    const path = reconstructPath(node3);

    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
  });

  test("should handle single node path", async () => {
    const node: PathNode = { x: 5, y: 5, g: 0, h: 0, f: 0, parent: null };
    const path = reconstructPath(node);

    expect(path).toEqual([{ x: 5, y: 5 }]);
  });
});

/**
 * Test Suite: MovementState Types
 */
test.describe("MovementState Types", () => {
  test("should define idle state", async () => {
    const state: MovementState = { type: 'idle' };
    expect(state.type).toBe('idle');
  });

  test("should define walking state with path", async () => {
    const state: MovementState = {
      type: 'walking',
      path: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      pathIndex: 0,
      progress: 0.5,
    };
    expect(state.type).toBe('walking');
    expect(state.path.length).toBe(2);
    expect(state.pathIndex).toBe(0);
    expect(state.progress).toBe(0.5);
  });

  test("should define inside_building state", async () => {
    const state: MovementState = {
      type: 'inside_building',
      buildingId: 'house_5_5',
    };
    expect(state.type).toBe('inside_building');
    expect(state.buildingId).toBe('house_5_5');
  });

  test("should define entering_building state", async () => {
    const state: MovementState = {
      type: 'entering_building',
      buildingId: 'shop_3_4',
      progress: 0,
    };
    expect(state.type).toBe('entering_building');
    if (state.type === 'entering_building') {
      expect(state.buildingId).toBe('shop_3_4');
    }
  });

  test("should define exiting_building state", async () => {
    const state: MovementState = {
      type: 'exiting_building',
      buildingId: 'office_2_2',
      progress: 0,
    };
    expect(state.type).toBe('exiting_building');
    if (state.type === 'exiting_building') {
      expect(state.buildingId).toBe('office_2_2');
    }
  });
});

/**
 * Test Suite: NPCMovement Interface
 */
test.describe("NPCMovement Interface", () => {
  test("should define movement properties", async () => {
    const movement: NPCMovement = {
      state: { type: 'idle' },
      targetPosition: null,
      walkSpeed: 2.0,
    };

    expect(movement.state.type).toBe('idle');
    expect(movement.targetPosition).toBeNull();
    expect(movement.walkSpeed).toBe(2.0);
  });

  test("createInitialMovement should return default state", async () => {
    const movement = createInitialMovement();

    expect(movement.state.type).toBe('idle');
    expect(movement.targetPosition).toBeNull();
    expect(movement.walkSpeed).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: MovementManager - setDestination
 */
test.describe("MovementManager - setDestination", () => {
  test("should set destination and calculate path", async () => {
    const manager = new MovementManager();
    const grid = createMockGrid(10);
    
    // Create a minimal NPC-like object
    const npc = {
      id: 'test-npc',
      gridX: 0,
      gridY: 0,
      movement: createInitialMovement(),
    };

    const result = manager.setDestination(npc, 5, 5, grid);

    expect(result).toBe(true);
    expect(npc.movement.state.type).toBe('walking');
    expect(npc.movement.targetPosition).toEqual({ x: 5, y: 5 });
  });

  test("should return false when path is blocked", async () => {
    const manager = new MovementManager();
    const grid = createMockGrid(10);
    
    // Block the destination
    grid[5][5].building.type = 'house_small';
    
    const npc = {
      id: 'test-npc',
      gridX: 0,
      gridY: 0,
      movement: createInitialMovement(),
    };

    const result = manager.setDestination(npc, 5, 5, grid);

    expect(result).toBe(false);
    expect(npc.movement.state.type).toBe('idle');
  });

  test("should not change state if already at destination", async () => {
    const manager = new MovementManager();
    const grid = createMockGrid(10);
    
    const npc = {
      id: 'test-npc',
      gridX: 5,
      gridY: 5,
      movement: createInitialMovement(),
    };

    const result = manager.setDestination(npc, 5, 5, grid);

    expect(result).toBe(true);
    expect(npc.movement.state.type).toBe('idle');
  });
});

/**
 * Test Suite: MovementManager - update
 */
test.describe("MovementManager - update", () => {
  test("should advance position along path", async () => {
    const manager = new MovementManager();
    const grid = createMockGrid(10);
    
    const npc = {
      id: 'test-npc',
      gridX: 0,
      gridY: 0,
      movement: createInitialMovement(),
      direction: 'south' as const,
    };

    manager.setDestination(npc, 5, 0, grid);
    
    // Update with enough time to move one tile (at 2 tiles/sec, 0.5s moves 1 tile)
    manager.update(npc, 0.5);

    expect(npc.gridX).toBe(1);
    expect(npc.gridY).toBe(0);
  });

  test("should update direction based on movement", async () => {
    const manager = new MovementManager();
    const grid = createMockGrid(10);
    
    const npc = {
      id: 'test-npc',
      gridX: 0,
      gridY: 0,
      movement: createInitialMovement(),
      direction: 'south' as const,
    };

    manager.setDestination(npc, 5, 0, grid);
    manager.update(npc, 0.5);

    // Moving east (increasing X)
    expect(npc.direction).toBe('east');
  });

  test("should transition to idle when reaching destination", async () => {
    const manager = new MovementManager();
    const grid = createMockGrid(10);
    
    const npc = {
      id: 'test-npc',
      gridX: 0,
      gridY: 0,
      movement: createInitialMovement(),
      direction: 'south' as const,
    };

    manager.setDestination(npc, 1, 0, grid);
    manager.update(npc, 1.0); // Enough time to reach destination

    expect(npc.movement.state.type).toBe('idle');
    expect(npc.gridX).toBe(1);
    expect(npc.gridY).toBe(0);
  });

  test("should do nothing when idle", async () => {
    const manager = new MovementManager();
    
    const npc = {
      id: 'test-npc',
      gridX: 5,
      gridY: 5,
      movement: createInitialMovement(),
      direction: 'south' as const,
    };

    manager.update(npc, 1.0);

    expect(npc.gridX).toBe(5);
    expect(npc.gridY).toBe(5);
    expect(npc.movement.state.type).toBe('idle');
  });

  test("should handle partial tile movement", async () => {
    const manager = new MovementManager();
    const grid = createMockGrid(10);
    
    const npc = {
      id: 'test-npc',
      gridX: 0,
      gridY: 0,
      movement: createInitialMovement(),
      direction: 'south' as const,
    };

    manager.setDestination(npc, 5, 0, grid);
    
    // Update with less time than needed for full tile
    manager.update(npc, 0.1);

    // Should still be at start but with progress
    expect(npc.gridX).toBe(0);
    if (npc.movement.state.type === 'walking') {
      expect(npc.movement.state.progress).toBeGreaterThan(0);
    }
  });
});

/**
 * Test Suite: MovementManager - enterBuilding
 */
test.describe("MovementManager - enterBuilding", () => {
  test("should transition to entering_building state", async () => {
    const manager = new MovementManager();
    
    const npc = {
      id: 'test-npc',
      gridX: 5,
      gridY: 6,
      movement: createInitialMovement(),
      isInsideBuilding: false,
      currentBuildingId: null as string | null,
    };

    manager.enterBuilding(npc, 'house_5_5');

    expect(npc.movement.state.type).toBe('entering_building');
    if (npc.movement.state.type === 'entering_building') {
      expect(npc.movement.state.buildingId).toBe('house_5_5');
    }
  });

  test("should set isInsideBuilding after enter animation", async () => {
    const manager = new MovementManager();
    
    const npc = {
      id: 'test-npc',
      gridX: 5,
      gridY: 6,
      movement: createInitialMovement(),
      isInsideBuilding: false,
      currentBuildingId: null as string | null,
    };

    manager.enterBuilding(npc, 'house_5_5');
    manager.update(npc, 1.0); // Complete enter animation

    expect(npc.movement.state.type).toBe('inside_building');
    expect(npc.isInsideBuilding).toBe(true);
    expect(npc.currentBuildingId).toBe('house_5_5');
  });
});

/**
 * Test Suite: MovementManager - exitBuilding
 */
test.describe("MovementManager - exitBuilding", () => {
  test("should transition to exiting_building state", async () => {
    const manager = new MovementManager();
    
    const npc = {
      id: 'test-npc',
      gridX: 5,
      gridY: 5,
      movement: {
        state: { type: 'inside_building' as const, buildingId: 'house_5_5' },
        targetPosition: null,
        walkSpeed: 2.0,
      },
      isInsideBuilding: true,
      currentBuildingId: 'house_5_5',
    };

    manager.exitBuilding(npc);

    expect(npc.movement.state.type).toBe('exiting_building');
  });

  test("should set isInsideBuilding false after exit animation", async () => {
    const manager = new MovementManager();
    
    const npc = {
      id: 'test-npc',
      gridX: 5,
      gridY: 5,
      movement: {
        state: { type: 'inside_building' as const, buildingId: 'house_5_5' },
        targetPosition: null,
        walkSpeed: 2.0,
      },
      isInsideBuilding: true,
      currentBuildingId: 'house_5_5',
    };

    manager.exitBuilding(npc);
    manager.update(npc, 1.0); // Complete exit animation

    expect(npc.movement.state.type).toBe('idle');
    expect(npc.isInsideBuilding).toBe(false);
    expect(npc.currentBuildingId).toBeNull();
  });
});

/**
 * Test Suite: MOVEMENT_DESCRIPTIONS
 */
test.describe("MOVEMENT_DESCRIPTIONS - Hitchhiker's Guide Style", () => {
  test("should have description for walking", async () => {
    expect(MOVEMENT_DESCRIPTIONS.walking).toBeDefined();
    expect(MOVEMENT_DESCRIPTIONS.walking).toContain("Ambulating");
  });

  test("should have description for inside_building", async () => {
    expect(MOVEMENT_DESCRIPTIONS.inside_building).toBeDefined();
    expect(MOVEMENT_DESCRIPTIONS.inside_building).toContain("removed from the chaos");
  });

  test("should have description for entering_building", async () => {
    expect(MOVEMENT_DESCRIPTIONS.entering_building).toBeDefined();
    expect(MOVEMENT_DESCRIPTIONS.entering_building).toContain("shelter");
  });

  test("should have sardonic crypto-themed descriptions", async () => {
    // All descriptions should be witty and crypto-themed
    Object.values(MOVEMENT_DESCRIPTIONS).forEach(desc => {
      expect(desc.length).toBeGreaterThan(20);
    });
  });
});

/**
 * Test Suite: Direction Calculation
 */
test.describe("Direction Calculation", () => {
  test("should return east when moving in positive X direction", async () => {
    const manager = new MovementManager();
    const grid = createMockGrid(10);
    
    const npc = {
      id: 'test-npc',
      gridX: 0,
      gridY: 5,
      movement: createInitialMovement(),
      direction: 'south' as const,
    };

    manager.setDestination(npc, 5, 5, grid);
    manager.update(npc, 0.5);

    expect(npc.direction).toBe('east');
  });

  test("should return west when moving in negative X direction", async () => {
    const manager = new MovementManager();
    const grid = createMockGrid(10);
    
    const npc = {
      id: 'test-npc',
      gridX: 5,
      gridY: 5,
      movement: createInitialMovement(),
      direction: 'south' as const,
    };

    manager.setDestination(npc, 0, 5, grid);
    manager.update(npc, 0.5);

    expect(npc.direction).toBe('west');
  });

  test("should return south when moving in positive Y direction", async () => {
    const manager = new MovementManager();
    const grid = createMockGrid(10);
    
    const npc = {
      id: 'test-npc',
      gridX: 5,
      gridY: 0,
      movement: createInitialMovement(),
      direction: 'north' as const,
    };

    manager.setDestination(npc, 5, 5, grid);
    manager.update(npc, 0.5);

    expect(npc.direction).toBe('south');
  });

  test("should return north when moving in negative Y direction", async () => {
    const manager = new MovementManager();
    const grid = createMockGrid(10);
    
    const npc = {
      id: 'test-npc',
      gridX: 5,
      gridY: 5,
      movement: createInitialMovement(),
      direction: 'south' as const,
    };

    manager.setDestination(npc, 5, 0, grid);
    manager.update(npc, 0.5);

    expect(npc.direction).toBe('north');
  });
});

/**
 * Test Suite: Edge Cases
 */
test.describe("Edge Cases", () => {
  test("should handle grid boundaries correctly", async () => {
    const grid = createMockGrid(10);
    
    // Path along edge
    const path = findPath(0, 0, 9, 0, grid);
    expect(path).not.toBeNull();
    
    // Path to corner
    const cornerPath = findPath(0, 0, 9, 9, grid);
    expect(cornerPath).not.toBeNull();
  });

  test("should handle very short paths", async () => {
    const grid = createMockGrid(10);
    
    const path = findPath(5, 5, 5, 6, grid);
    expect(path).not.toBeNull();
    expect(path!.length).toBe(2);
  });

  test("should handle diagonal movement efficiently", async () => {
    const grid = createMockGrid(10);
    
    const path = findPath(0, 0, 5, 5, grid);
    expect(path).not.toBeNull();
    // Diagonal movement should be roughly 10 tiles (Manhattan distance)
    expect(path!.length).toBeLessThanOrEqual(11);
  });
});
