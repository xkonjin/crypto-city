## Checkpoints
**Task:** Implement win/lose conditions for Crypto City
**Last Updated:** 2026-01-10T17:50:00Z
**Closes:** #29, #43

### Phase Status
- Phase 1 (Tests Written): ✓ VALIDATED (15 tests passing)
- Phase 2 (Implementation): ✓ COMPLETED
- Phase 3 (Wiring/Integration): ✓ COMPLETED

### Resume Context
- TASK COMPLETE
- All 56 original tests + 15 new tests passing (71 total)
- Build successful

### Requirements Summary
**Win Conditions (any triggers victory):**
1. Reach $1,000,000 TVL
2. Survive 100 game days
3. Reach 10,000 population
4. Build 50 crypto buildings

**Lose Conditions (triggers game over):**
1. Treasury at $0 for 100 consecutive ticks (bankruptcy)
2. All crypto buildings destroyed (rugged out)
3. City happiness below 20% for 50 consecutive ticks

### Files to Create/Modify
1. `src/lib/gameObjectives.ts` - Core objectives logic
2. `src/components/game/GameEndModal.tsx` - Victory/Game Over UI
3. `src/games/isocity/crypto/CryptoEconomyManager.ts` - Add checkGameEnd()
4. `src/components/Game.tsx` - Wire up objectives checking
