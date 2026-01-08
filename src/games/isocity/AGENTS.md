# ISOCITY ENGINE

Type definitions and managers for the IsoCity game engine. Migrated/refactored module.

## STRUCTURE

```
isocity/
├── index.ts              # Main exports
├── types/                # Core type definitions
│   ├── index.ts          # Re-exports all types
│   ├── game.ts           # GameState, GameTime
│   ├── buildings.ts      # BuildingDefinition, Lot
│   ├── zones.ts          # ZoneType, ZoneDensity
│   ├── services.ts       # ServiceCoverage, ServiceType
│   └── economy.ts        # Budget, TaxRates, Demand
│
└── crypto/               # Crypto-game integration
    ├── index.ts
    ├── types.ts          # CryptoGameEffect interfaces
    ├── buildings.ts      # Crypto-themed building defs
    ├── buildingRegistry.ts # Building lookup
    ├── CryptoEventManager.ts  # Crypto → game events
    └── CryptoEconomyManager.ts # Crypto → economy effects
```

## WHERE TO LOOK

| Task | File |
|------|------|
| Add zone type | `types/zones.ts` |
| Add service type | `types/services.ts` |
| Budget/taxes | `types/economy.ts` |
| Crypto buildings | `crypto/buildings.ts` |
| Crypto events | `crypto/CryptoEventManager.ts` |

## KEY TYPES

```typescript
// types/zones.ts
type ZoneType = 'R' | 'C' | 'I';  // Residential, Commercial, Industrial
type ZoneDensity = 'low' | 'medium' | 'high';

// types/economy.ts
interface Budget {
  treasury: number;
  income: { residential: number; commercial: number; industrial: number };
  expenses: { police: number; fire: number; health: number; education: number };
  taxRates: { residential: number; commercial: number; industrial: number };
}

// types/services.ts
interface ServiceCoverage {
  police: number;   // 0-100
  fire: number;
  health: number;
  education: number;
}
```

## CRYPTO INTEGRATION

The `crypto/` subdirectory bridges real crypto data to game mechanics:

| Class | Purpose |
|-------|---------|
| `CryptoEventManager` | Spawns events based on market conditions |
| `CryptoEconomyManager` | Adjusts budget, demand from crypto data |

## CONVENTIONS

- Types are pure interfaces, no runtime code
- Managers are classes with `update()` methods called each tick
- Building defs follow parent project's `BuildingDefinition` shape

## NOTES

- This module aligns with ROADMAP.md simulation vision
- Types designed for future zoning/simulation features
- Crypto managers are optional, game works without them
