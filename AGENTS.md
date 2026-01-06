# CRYPTO CITY - AGENTS KNOWLEDGE BASE

**Generated:** 2026-01-06  
**Commit:** a4cf539  
**Branch:** main

## OVERVIEW

Isometric city builder with crypto economy simulation. Next.js 16 + React 19 frontend, Phaser 3.90 game engine (dynamically loaded, no SSR). Buildings generate yield, market sentiment fluctuates, events trigger based on portfolio.

## STRUCTURE

```
app/
├── components/
│   ├── game/           # React-Phaser bridge, grid state
│   │   ├── phaser/     # Phaser scene, rendering, entities [SEE AGENTS.md]
│   │   └── procedural/ # Terrain/road generation algorithms
│   └── ui/             # React UI panels (dashboard, tools, modals)
├── data/
│   ├── buildings.ts    # ALL building definitions (1500+ lines)
│   └── cryptoBuildings.ts  # Crypto-specific building metadata
├── simulation/         # Crypto economy engine [SEE AGENTS.md]
├── hooks/              # useCryptoEconomy hook
├── services/           # External API integrations
└── utils/              # Audio helpers
public/
├── Building/           # Sprites by category (residential, commercial, etc.)
├── Characters/         # Walking GIF animations (4 directions) [PROPRIETARY]
├── cars/               # Vehicle sprites
├── Tiles/              # Ground tiles (grass, road, snow)
└── audio/              # Music and SFX
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add buildings | `app/data/buildings.ts` | Follow existing pattern exactly |
| Add crypto buildings | `app/data/cryptoBuildings.ts` | Requires tier + effects |
| Modify game rendering | `app/components/game/phaser/MainScene.ts` | 3000 lines, use caution |
| Modify grid state | `app/components/game/GameBoard.tsx` | React state source of truth |
| Add UI panels | `app/components/ui/` | Standard React components |
| Crypto simulation | `app/simulation/` | Pure functions, see subdir AGENTS.md |
| Types/enums | `app/components/game/types.ts` | GridCell, TileType, CryptoEffects |

## CODE MAP (Key Exports)

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `MainScene` | class | phaser/MainScene.ts | Phaser scene, all rendering |
| `GameBoard` | component | game/GameBoard.tsx | Root component, grid state |
| `GridCell` | interface | game/types.ts | Cell data structure |
| `TileType` | enum | game/types.ts | Grass, Road, Building, etc. |
| `CryptoEconomyState` | interface | game/types.ts | Treasury, sentiment, TVL |
| `cryptoEconomy` | singleton | simulation/CryptoEconomyManager.ts | Economy controller |
| `BUILDINGS` | const | data/buildings.ts | Building registry |
| `ALL_CRYPTO_BUILDINGS` | const | data/cryptoBuildings.ts | Crypto building registry |

## CONVENTIONS

### Naming
- Components: PascalCase
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Building IDs: kebab-case (`"victorian-townhouse"`)
- Enums: PascalCase values

### Sprite Naming
`{width}x{height}{name}_{direction}.png`  
Example: `4x4bookstore_south.png`

### Isometric System
- Tile size: 44x22 pixels
- Grid: 48x48 cells
- Depth: `(x + y) * DEPTH_Y_MULT` with layer offsets

### Grid Cell Structure
```typescript
{
  type: TileType,
  x, y: number,
  isOrigin?: boolean,        // Top-left of multi-cell building
  originX?, originY?: number,
  buildingId?: string,
  buildingOrientation?: Direction,
  underlyingTileType?: TileType
}
```

## ANTI-PATTERNS

- **No SSR for Phaser** - Dynamic import only, check `typeof window`
- **No direct grid mutation in Phaser** - React is source of truth
- **No `as any` or `@ts-ignore`** - Fix types properly
- **Character sprites are proprietary** - Do not redistribute

## ARCHITECTURE

```
React (state) ────► Phaser (render)
     ▲                    │
     │  callbacks         │ via refs
     └────────────────────┘

Simulation (pure functions) → economyTick() → new state
```

- React manages: Grid, UI, tool selection, crypto economy state
- Phaser manages: Rendering, characters, cars, camera
- React→Phaser: `ref.current.spawnCharacter()`, `updateGrid()`
- Phaser→React: `onTileClick`, `onTilesDrag` callbacks
- Simulation: Pure functions, no side effects, testable

## COMMANDS

```bash
npm run dev     # Dev server localhost:3000
npm run build   # Production build
npm run lint    # ESLint
```

## NOTES

- Save/load uses localStorage JSON
- Roads snap to 4x4 grid segments
- Existing CLAUDE.md has detailed Phaser troubleshooting resources
- ROADMAP.md contains detailed future plans (zoning, traffic, NPC AI)
- Large files: MainScene.ts (3000), GameBoard.tsx (2000), buildings.ts (1500)
