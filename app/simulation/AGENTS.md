# CRYPTO SIMULATION - AGENTS KNOWLEDGE BASE

Pure function economy engine. No side effects, fully testable. Called by React on tick.

## STRUCTURE

```
simulation/
├── index.ts                # Central exports
├── CryptoEconomy.ts        # Pure functions: yield, sentiment, analysis
├── CryptoEconomyManager.ts # Class wrapper, singleton for convenience
├── CryptoEventManager.ts   # Event trigger/processing logic
├── CryptoEvents.ts         # Event definitions, effects, history
└── ZoneEffects.ts          # Spatial effects, synergies, land value
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Yield calculation | CryptoEconomy.ts | `calculateDailyYield()` |
| Market sentiment | CryptoEconomy.ts | `updateMarketSentiment()` |
| Main tick | CryptoEconomy.ts | `economyTick()` - entry point |
| Event triggers | CryptoEvents.ts | `tryTriggerEvent()` |
| Building synergies | ZoneEffects.ts | `calculateChainSynergy()` |
| Zone radius effects | ZoneEffects.ts | `getZoneEffectsAtTile()` |

## KEY EXPORTS (index.ts)

```typescript
// Pure functions (preferred)
economyTick(state, grid, ticksPerDay) → newState
calculateDailyYield(buildings, state) → number
updateMarketSentiment(current, change) → number
tryTriggerEvent(state, buildings) → Event | null

// Singleton (convenience)
cryptoEconomy.tick()
cryptoEconomy.getState()
```

## ECONOMY FLOW

```
economyTick() called by React interval
    ↓
analyzeCryptoBuildings(grid) → find all crypto buildings
    ↓
calculateDailyYield(buildings, state) → compute yields
    ↓
updateMarketSentiment() → drift + random noise
    ↓
return newState → React updates, Phaser re-renders
```

## KEY TYPES (from types.ts)

```typescript
CryptoTier: "degen" | "retail" | "whale" | "institution"

CryptoEffects: {
  yieldRate?, stakingBonus?, tradingFees?,
  volatility?, rugRisk?, hackRisk?,
  populationBoost?, happinessEffect?, prestigeBonus?,
  airdropChance?, zoneRadius?, chainSynergy?[]
}

CryptoEconomyState: {
  treasury, dailyYield, totalTVL, marketSentiment,
  globalYieldMultiplier, cryptoBuildingCount,
  buildingsByTier, treasuryHistory[]
}
```

## ANTI-PATTERNS

- **Never call Phaser from simulation** - Pure functions only
- **Never read DOM/window** - Stateless
- **Avoid class methods for core logic** - Use pure functions
- **Don't store mutable state** - Return new state objects

## TESTABILITY

All core functions are pure:
```typescript
// Input → Output, no side effects
const newState = economyTick(oldState, mockGrid, 24);
expect(newState.treasury).toBeGreaterThan(oldState.treasury);
```
