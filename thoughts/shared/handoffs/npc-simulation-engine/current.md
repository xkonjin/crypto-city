# NPC Simulation Engine Implementation

## Checkpoints
**Task:** Create NPC Simulation Engine - The Brain
**Last Updated:** 2026-01-11

### Phase Status
- Phase 1 (Tests Written): ✓ VALIDATED - 42 tests written
- Phase 2 (Implementation): ✓ COMPLETE - NPCSimulation.ts implemented
- Phase 3 (React Hook): ✓ COMPLETE - useNPCSimulation.ts created
- Phase 4 (Index Exports): ✓ COMPLETE - Exports added to index.ts
- Phase 5 (Refactoring): ✓ COMPLETE - All tests pass, TypeScript errors fixed

### Files Created
1. `src/lib/npc/NPCSimulation.ts` - Main simulation engine (718 lines)
2. `src/hooks/useNPCSimulation.ts` - React hook for simulation (262 lines)
3. `tests/npcSimulation.spec.ts` - Test suite (690 lines)

### Files Modified
1. `src/lib/npc/index.ts` - Added exports for NPCSimulation

## Implementation Summary

### NPCSimulation Class Features
- **Lifecycle Management**: start(), stop(), pause(), resume()
- **Tick-based Simulation Loop**: Configurable tick interval and game time per tick
- **Time Management**: Game time (0-1439 minutes), day cycles, working hours, daytime checks
- **NPC Updates Per Tick**:
  - Needs decay (via NeedsManager)
  - Schedule checking (via ScheduleManager)
  - Urgent need handling (overrides schedule)
  - Movement updates (via MovementManager)
  - Mood decay (via MoodManager)
  - Interaction processing (via InteractionManager)
- **Level of Detail (LOD)**: Distance-based update frequency optimization
  - full: every tick (< 5 tiles)
  - high: every 2 ticks (< 15 tiles)
  - medium: every 5 ticks (< 30 tiles)
  - low: every 20 ticks (< 50 tiles)
  - minimal: every 100 ticks (> 50 tiles)
- **Daily Cycle**: Pay salary/expenses, decay memories/relationships/skills, collect faction taxes
- **Event System**: onTick, onDayChange, onNPCEvent callbacks

### React Hook Features (useNPCSimulation)
- Auto-start/stop on mount/unmount
- State updates via React state
- Camera position sync for LOD
- Event subscriptions
- Helper hooks: useSimulationTime, useNPCTracking, useNPCList

### Configuration Options
```typescript
interface SimulationConfig {
  tickIntervalMs: number;        // Default: 100ms
  gameMinutesPerTick: number;    // Default: 1 minute
  maxNPCs: number;               // Default: 100
  enableLLM: boolean;            // Default: false
  lodEnabled: boolean;           // Default: true
}
```

## Test Results
- 42 tests written and passing
- Covers: config, state, lifecycle, time management, NPC updates, daily cycle, LOD, events, periodic updates, manager integration, camera position, nearby NPCs helper

## Integration Notes
- NPCSimulation is the master controller
- Initialize on game start
- Call tick() on game update (or use auto-tick via start())
- Connect to React via useNPCSimulation hook
- Camera position should be updated for proper LOD calculations
