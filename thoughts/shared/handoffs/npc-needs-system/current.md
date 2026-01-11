# NPC Needs System Implementation Checkpoint

## Task
Implement The Sims-style needs system where NPCs have motives that decay over time (Issue #99)

**Last Updated:** 2026-01-11

## Phase Status
- Phase 1 (Tests Written): ✓ COMPLETED - 41 tests written and validated
- Phase 2 (Implementation): ✓ COMPLETED - All code implemented
- Phase 3 (Refactoring): ✓ COMPLETED - Code clean and documented

## Files Created

### Core Implementation
- `src/lib/npc/needs.ts` - Need types, decay rates, critical thresholds, descriptions
- `src/lib/npc/NeedsManager.ts` - Manager class for need operations and Utility AI scoring

### Types Updated
- `src/games/isocity/types/npc.ts` - Added `needs: NPCNeeds` to CryptoNPC interface
- `src/games/isocity/types/index.ts` - Added npc exports
- `src/lib/npc/NPCManager.ts` - Updated to initialize needs on NPC spawn

### Test File
- `tests/npcNeeds.spec.ts` - 41 comprehensive tests

## Implementation Details

### Need Types (6 total)
| Need | Decay Rate | Critical Threshold | Weight | Satisfiers |
|------|------------|-------------------|--------|------------|
| hunger | 0.5/min | 20 | 1.2 | eating_restaurant, eating_home |
| energy | 0.3/min | 15 | 1.1 | sleeping_home, napping |
| social | 0.2/min | 25 | 0.9 | conversation, party |
| fun | 0.4/min | 20 | 0.8 | entertainment_venue, gaming |
| wealth | 0.1/min | 30 | 1.0 | trading, earning, staking |
| purpose | 0.15/min | 25 | 0.9 | working, building |

### Key Functions
- `createDefaultNeeds()` - Creates NPCNeeds with randomized 50-100 values
- `NeedsManager.updateNeeds()` - Decays all needs over time
- `NeedsManager.satisfyNeed()` - Increases a specific need
- `NeedsManager.getMostUrgentNeed()` - Returns lowest/most urgent need
- `NeedsManager.scoreAction()` - Utility AI scoring for actions
- `NeedsManager.getNeedsSatisfiers()` - Gets activities that satisfy a need

### Hitchhiker's Guide Descriptions
```typescript
hunger: "The primal urge that reminds even crypto millionaires they can't eat Bitcoin. Yet."
energy: "What separates a functioning degen from one who fell asleep during the airdrop."
wealth: "The number that must always go up. Always. No exceptions. WAGMI."
```

## Test Results
All 41 tests passing:
- Need Interface: 2 tests
- Decay Rates: 3 tests  
- Critical Thresholds: 2 tests
- NPCNeeds Structure: 4 tests
- NeedsManager - updateNeeds: 3 tests
- NeedsManager - satisfyNeed: 4 tests
- NeedsManager - getMostUrgentNeed: 4 tests
- NeedsManager - getNeedsSatisfiers: 6 tests
- Utility AI Scoring: 4 tests
- Hitchhiker's Guide Descriptions: 4 tests
- Helper functions: 5 tests

## Integration Points
- `CryptoNPC.needs` - Every NPC now has a needs object
- `SerializedNPC.needs` - Needs are persisted to localStorage
- `NPCManager.spawnNPC()` - Automatically initializes needs for new NPCs
- Backward compatible - Old saves get default needs on load

## Next Steps (for future work)
1. Integrate with NPC behavior/activity system
2. Add visual indicators for critical needs
3. Connect needs to building interactions
4. Implement need satisfaction when NPCs perform activities
