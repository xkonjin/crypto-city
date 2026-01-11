# NPC Pathfinding System Implementation

## Checkpoints
**Task:** Implement NPC Pathfinding and Building Navigation (#101)
**Last Updated:** 2026-01-11

### Phase Status
- Phase 1 (Tests Written): ✓ VALIDATED
- Phase 2 (Implementation): ✓ VALIDATED  
- Phase 3 (Refactoring): ✓ VALIDATED

### Resume Context
- Current focus: Complete
- Next action: None - task fully implemented

---

## Implementation Report

### TDD Summary
- Tests written: 65
- Tests passing: 65
- Files modified: 5 files created/modified

### Files Created
1. `src/lib/npc/pathfinding.ts` - A* pathfinding algorithm implementation
2. `src/lib/npc/movement.ts` - Movement state machine and manager
3. `tests/npcPathfinding.spec.ts` - Comprehensive test suite

### Files Modified
1. `src/games/isocity/types/npc.ts` - Added `movement: NPCMovement` to CryptoNPC interface
2. `src/lib/npc/index.ts` - Added exports for pathfinding and movement modules
3. `src/lib/npc/NPCManager.ts` - Added movement initialization to spawnNPC

---

## Implementation Details

### Pathfinding Module (`src/lib/npc/pathfinding.ts`)

**Key Interfaces:**
- `GridPosition` - x, y coordinates
- `PathNode` - A* node with g, h, f scores and parent reference
- `PathfindingOptions` - preferRoads, avoidBuildings, maxIterations

**Key Functions:**
- `findPath()` - A* implementation that finds shortest path between two points
- `isWalkable()` - Checks if a tile can be walked on
- `getBuildingEntrance()` - Finds the entrance position for a building
- `manhattanDistance()` - Heuristic function for A*
- `reconstructPath()` - Builds path from A* result
- `findPathCached()` - Cached version for common routes
- `clearPathCache()` - Clears the path cache

**Walkable Tiles:** empty, grass, road, tree, rail, bridge

**Tile Costs (for road preference):**
- road: 1 (fastest)
- bridge: 1
- grass: 2
- empty: 2
- tree: 3
- rail: 4

### Movement Module (`src/lib/npc/movement.ts`)

**Movement States:**
- `idle` - NPC is stationary
- `walking` - NPC is moving along a path (with progress, pathIndex)
- `inside_building` - NPC is inside a building
- `entering_building` - NPC is entering a building (with progress)
- `exiting_building` - NPC is exiting a building (with progress)

**NPCMovement Interface:**
```typescript
interface NPCMovement {
  state: MovementState;
  targetPosition: GridPosition | null;
  walkSpeed: number;  // Tiles per second (default: 2.0)
}
```

**MovementManager Class:**
- `setDestination()` - Calculate path and start walking
- `update()` - Update position based on delta time
- `enterBuilding()` - Start building entry animation
- `exitBuilding()` - Start building exit animation
- `stopMovement()` - Cancel current movement
- `isMoving()` - Check if NPC is walking
- `isInsideBuilding()` - Check if NPC is inside
- `getTileProgress()` - Get progress through current tile (0-1)
- `getNextTile()` - Get the next tile NPC is moving to

**Hitchhiker's Guide Descriptions:**
```typescript
const MOVEMENT_DESCRIPTIONS = {
  idle: "Standing motionless, contemplating the futility of centralized finance.",
  walking: "Ambulating with purpose, or at least the illusion of it.",
  inside_building: "Temporarily removed from the chaos of the outside world.",
  entering_building: "Seeking shelter from the relentless march of market forces.",
  exiting_building: "Emerging to face whatever the market has done in their absence.",
};
```

---

## Test Coverage

### Pathfinding Tests
- GridPosition and PathNode interfaces
- PathfindingOptions defaults and customization
- Manhattan distance calculation
- isWalkable for all tile types
- Basic pathfinding on empty grid
- Obstacle avoidance (buildings, water)
- Road preference
- Performance limits (maxIterations)
- Building entrance detection
- Path reconstruction

### Movement Tests
- MovementState type definitions
- NPCMovement interface
- createInitialMovement factory
- setDestination and path calculation
- Position advancement along path
- Direction calculation (N, S, E, W)
- Transition to idle at destination
- Building enter/exit animations
- Hitchhiker's Guide descriptions

---

## Usage Example

```typescript
import { 
  MovementManager, 
  createInitialMovement,
  findPath,
  isWalkable 
} from '@/lib/npc';

// Initialize NPC with movement
const npc = {
  gridX: 0,
  gridY: 0,
  movement: createInitialMovement(),
  direction: 'south',
};

// Create manager
const manager = new MovementManager();

// Set destination
const success = manager.setDestination(npc, 10, 10, gameGrid);

// In game loop
function update(deltaTime: number) {
  manager.update(npc, deltaTime);
}

// Enter building when at entrance
manager.enterBuilding(npc, 'house_5_5');
manager.update(npc, 0.5); // Complete animation

// Exit building
manager.exitBuilding(npc);
manager.update(npc, 0.5); // Complete animation
```

---

## Integration Notes

1. **CryptoNPC Interface** - Now includes `movement: NPCMovement`
2. **NPCManager** - Automatically initializes movement when spawning NPCs
3. **Serialization** - Movement state is saved/loaded with NPC persistence
4. **Grid Compatibility** - Uses existing `Tile` and `Building` types from game

## Next Steps (if needed)
- Visual rendering of NPC walking animations
- Path visualization for debugging
- Multi-NPC pathfinding coordination
- Dynamic obstacle avoidance (other NPCs)
