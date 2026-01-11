## Checkpoints
**Task:** Add money sinks to prevent inflation spiral (Issue #54)
**Last Updated:** 2026-01-11

### Phase Status
- Phase 1 (Tests Written): ✓ COMPLETED
- Phase 2 (Implementation): ✓ COMPLETED
- Phase 3 (Refactoring): ✓ COMPLETED

### Implementation Summary

#### Files Modified:
1. **src/games/isocity/crypto/types.ts** - Added types for:
   - `BuildingMaintenance` - maintenance cost configuration
   - `ServiceFunding` - security, marketing, research funding levels
   - `BuildingUpgrade` - upgrade level and bonuses
   - `DamagedBuilding` - tracking buildings needing repair
   - Extended `CryptoEconomyState` with new money sink fields
   - Extended `PlacedCryptoBuilding` with upgradeLevel and isDamaged

2. **src/games/isocity/crypto/CryptoEconomyManager.ts** - Added:
   - `ECONOMY_CONFIG.MAINTENANCE` - base cost $150/building/day with tier multipliers
   - `ECONOMY_CONFIG.SERVICES` - service funding costs and bonuses
   - `ECONOMY_CONFIG.REPAIRS` - 25% of original cost
   - `ECONOMY_CONFIG.UPGRADES` - levels 1-3 with yield bonuses
   - Maintenance cost calculation in `recalculateEconomy()`
   - Service cost deduction in `tick()`
   - Marketing bonus applied to yields
   - Security bonus applied to rug risk reduction
   - Methods: `setServiceFunding()`, `getMoneySinkStats()`, `damageBuilding()`, 
     `repairDamagedBuilding()`, `demolishDamagedBuilding()`, `upgradeBuilding()`, etc.
   - Rug pull events now damage a random building

3. **tests/moneySinks.spec.ts** - Added E2E tests for all money sink features

#### Key Mechanics:
1. **Maintenance**: $150 base * tier multiplier (0.5-2.0) * city size scaling (0.5%/10 buildings)
2. **Services**: $0-100/day each, bonuses at 50%+, penalties below 30%
3. **Repairs**: 25% of building cost, 0 yield until repaired
4. **Upgrades**: Level 2 costs 50% of base (+25% yield), Level 3 costs 100% (+50% yield)

### Build Status: ✓ PASSING
