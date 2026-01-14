# NPC Titan Reactions Implementation Checkpoint

## Task
Implement NPC reactions to Titan (Task 4-2) as specified in HERO_PET_SYSTEM.md Section 6.3.

## Last Updated
2026-01-12

## Phase Status
- Phase 1 (Tests Written): ✓ COMPLETED
- Phase 2 (Implementation): ✓ COMPLETED
- Phase 3 (Refactoring): ✓ COMPLETED

## Files Created/Modified

### New Files
1. `src/lib/titan/NPCTitanReactions.ts` - Core implementation (~450 lines)
2. `tests/npcTitanReactions.spec.ts` - Test suite (71 tests)

### Modified Files
1. `src/lib/titan/index.ts` - Added exports for new module

## Implementation Summary

### NPCReaction Types
9 reaction types implemented:
- `flee` - Run away from Titan
- `cower` - Stay still, afraid
- `ignore` - No special reaction
- `approach` - Walk toward Titan
- `greet` - Wave/acknowledge
- `worship` - Bow/praise (angelic Titan)
- `challenge` - Confront (brave NPCs to evil Titan)
- `offer_gift` - Give something to Titan
- `seek_help` - Ask Titan for assistance

### Core Functions
- `calculateFearLevel(npc, titan, relationship)` - Returns 0-100 fear score
- `calculateTrustLevel(npc, titan, relationship)` - Returns -100 to +100 trust score
- `getNPCReaction(npc, titan, relationship)` - Returns the appropriate reaction
- `getNPCReactionDetailed(npc, titan, relationship)` - Returns reaction with reason and intensity
- `shouldAvoidPosition(npc, position, titanPosition, titan)` - Pathfinding check
- `getAvoidanceRadius(npc, titan, relationship)` - Returns 0-10 tile avoidance radius
- `getApproachRadius(npc, titan, relationship)` - Returns approach distance
- `processNPCTitanProximity(npc, titan, distance, relationship)` - Main hook for NPCSimulation

### Reaction Priority System
Reactions are evaluated in priority order:
1. `flee` (weight: 100) - Fear > 60
2. `cower` (weight: 90) - Fear > 40 + high neuroticism
3. `worship` (weight: 80) - Angelic alignment (< -0.6)
4. `challenge` (weight: 70) - Brave NPC + evil Titan
5. `seek_help` (weight: 60) - NPC in need + trusted Titan
6. `offer_gift` (weight: 50) - High agreeableness + familiarity
7. `approach` (weight: 40) - Trust > 30, fear < 20
8. `greet` (weight: 30) - High extraversion + good Titan
9. `ignore` (weight: 10) - Default fallback

### Fear Calculation Factors
- Titan alignment (evil = +fear)
- Relationship fearOf value
- NPC neuroticism
- Titan's current action (attacking = scary)
- Good alignment reduces fear

### Trust Calculation Factors
- Titan alignment (good = +trust)
- Relationship trust value
- NPC agreeableness
- Shared faction bonus
- Fear reduces trust

## Test Coverage
- 71 tests passing
- Covers all reaction types
- Tests fear/trust calculations
- Tests pathfinding modifications
- Tests animation and message systems
- Integration tests for complete scenarios

## Acceptance Criteria Met
✓ NPCs flee from evil Titans
✓ NPCs approach friendly Titans  
✓ Reactions consider relationship history
✓ Fear/trust calculations accurate
✓ Pathfinding avoidance works
✓ Visual feedback clear (animations + messages)

## Next Steps
- Integration with NPCSimulation.ts to call `processNPCTitanProximity`
- Add visual effects for reactions (particle systems)
- Sound effects for reaction events
