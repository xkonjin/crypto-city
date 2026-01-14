# Gang Warfare System Implementation

## Checkpoints
**Task:** Implement Gang/Faction Warfare Mechanics (#191)
**Last Updated:** 2026-01-13

### Phase Status
- Phase 1 (Tests Written): ✓ VALIDATED
- Phase 2 (Implementation): ✓ COMPLETED  
- Phase 3 (Refactoring): ✓ COMPLETED

### Implementation Summary

#### Files Created
1. `src/lib/npc/gangWarfare.ts` - Types and helper functions for gang warfare
2. `src/lib/npc/TerritoryManager.ts` - Main manager class with all methods
3. `tests/npcGangWarfare.spec.ts` - Comprehensive test suite (64 tests)

#### Types Implemented (gangWarfare.ts)
- `Territory` interface - Grid bounds, control, income/influence bonuses
- `TurfWar` interface - Faction warfare over territory with stages
- `TurfWarStage` type - intimidation, skirmishes, all_out_war, conquest, resolved
- `Skirmish` interface - Individual clashes during turf wars
- `Raid` interface - Building attacks with outcomes and loot
- `ProtectionRacket` interface - Faction protection schemes
- `Ambush` interface - Surprise attacks on NPCs
- `GridBounds` and `GridLocation` interfaces

#### TerritoryManager Methods
- `createTerritory(bounds)` - Define new territory
- `claimTerritory(territoryId, factionId)` - Claim unclaimed territory
- `contestTerritory(territoryId, attackerFactionId)` - Start contesting
- `resolveContest(territoryId)` - Determine winner based on presence/strength
- `calculateTerritoryIncome(territoryId)` - Income from controlled territory
- `startTurfWar(attackerFactionId, defenderFactionId, territoryId)` - Begin turf war
- `escalateTurfWar(warId)` - Move to next stage
- `resolveTurfWar(warId)` - Determine winner
- `createRaid(attackerIds, targetBuildingId)` - Execute raid on building
- `setupProtectionRacket(factionId, buildingIds, feePercentage)` - Protection scheme
- `executeAmbush(attackerIds, targetId, location)` - Surprise attack
- `serialize()` / `deserialize()` - State persistence

#### Test Coverage (64 tests)
- Territory Types: 3 tests
- TurfWar Types: 3 tests  
- Territory Management: 6 tests
- Territory Claims: 4 tests
- Territory Contests: 6 tests
- Territory Income: 4 tests
- Turf Wars: 10 tests
- Raids: 5 tests
- Protection Rackets: 6 tests
- Ambushes: 5 tests
- Hitchhiker's Guide Descriptions: 8 tests
- Integration with Faction System: 3 tests
- Serialization: 3 tests

### Technical Notes
- Territory income scales with grid size (0.5 per cell) plus bonus
- Contest resolution based on NPC count × 10 + combat strength
- Turf war escalation is manual via `escalateTurfWar()`
- Raid success = attackerStrength / (attackerStrength + buildingSecurity)
- Ambush success = 0.5 + (stealth × 0.4) - (awareness × 0.4)
- All entities support serialization for game save/load

### Integration Points
- Works with existing `FactionManager` for faction IDs
- Follows patterns from `ConflictManager` for battles and wars
- Uses similar typing patterns as `conflicts.ts`
- Hitchhiker's Guide descriptions follow existing sardonic crypto-native style
