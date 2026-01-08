# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-07
**Commit:** 14914b6
**Branch:** feat/critical-fixes-isocity-migration

## OVERVIEW

Isometric city builder engine (Pogicity/crypto-city) with real-time crypto data integration. Next.js 16 + React 19 + canvas-based isometric renderer. Phaser 3.90 loaded dynamically (no SSR).

## STRUCTURE

```
src/
├── app/                   # Next.js App Router pages
├── components/
│   ├── game/             # Canvas renderer, game systems (SEE: ./src/components/game/AGENTS.md)
│   ├── ui/               # Radix-based shadcn/ui components
│   ├── crypto/           # Live data indicators, news ticker
│   └── mobile/           # Mobile-specific UI
├── lib/                  # Utilities, crypto APIs (SEE: ./src/lib/AGENTS.md)
├── games/isocity/        # IsoCity engine types (SEE: ./src/games/isocity/AGENTS.md)
├── core/                 # Core types (grid, rendering, entities)
├── hooks/                # React hooks (crypto data, mobile, cheats)
├── context/              # GameContext, MultiplayerContext
└── types/                # Shared TypeScript types
public/
├── Building/             # Sprites by category (residential/, commercial/, etc.)
├── Tiles/                # Ground tiles (grass, road, snow)
├── Characters/           # Walking GIFs (4 directions) - PROPRIETARY
└── cars/                 # Vehicle sprites (4 directions)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add buildings | `src/components/game/buildingHelpers.ts` | Registry + sprite loading |
| Game rendering | `src/components/game/CanvasIsometricGrid.tsx` | Main canvas component |
| Road behavior | `src/components/game/roadDrawing.ts` | Auto-connect logic |
| Crypto integration | `src/lib/crypto/` | APIs, caching, blending |
| UI panels | `src/components/game/panels/` | Budget, advisors, stats |
| Grid types | `src/core/types/grid.ts` | GridCell, TileType |
| Game state | `src/context/GameContext.tsx` | Zustand-like context |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `CanvasIsometricGrid` | Component | `game/CanvasIsometricGrid.tsx` | Main canvas renderer |
| `GameContext` | Context | `context/GameContext.tsx` | Global game state |
| `GridCell` | Interface | `core/types/grid.ts` | Tile data structure |
| `TileType` | Enum | `components/game/types.ts` | Ground types |
| `useRealCryptoData` | Hook | `hooks/useRealCryptoData.ts` | Live crypto fetching |
| `CryptoEventManager` | Class | `games/isocity/crypto/` | Crypto-to-game events |

## CONVENTIONS

### Naming
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Building IDs: `kebab-case`
- Files: `camelCase.ts` or `PascalCase.tsx`

### Isometric System
- Tile size: **44x22 pixels**
- Grid: 48x48 cells
- Depth formula: `(x + y) * DEPTH_Y_MULT`
- Layer offsets:
  - 0.00: Ground tiles
  - 0.05: Buildings
  - 0.06: Props/trees
  - 0.10: Cars
  - 0.20: Characters

### Building Sprites
- Naming: `{width}x{height}{name}_{direction}.png`
- Directions: `south` (required), `north`, `east`, `west`
- Anchor: Bottom-center (front corner)

## ANTI-PATTERNS (THIS PROJECT)

- **Never SSR Phaser** - Dynamic import only, check `typeof window`
- **Never mutate grid in Phaser** - React owns state, Phaser renders
- **Never hardcode tile sizes** - Use constants from `constants.ts`
- **Character sprites are proprietary** - Don't redistribute `/public/Characters/`

## ARCHITECTURE

```
React (source of truth) ────► Canvas/Phaser (renders)
         │                           │
         │ grid, simData             │ click events
         ▼                           ▼
  GameContext.tsx            callbacks to React
```

**Data Flow:**
1. React manages: grid state, UI, tool selection
2. Canvas manages: rendering, characters, cars, animations
3. React → Canvas: via props/context
4. Canvas → React: via callbacks (`onTileClick`, `onTilesDrag`)

## COMMANDS

```bash
npm run dev       # Dev server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
npm run test      # Playwright tests
```

## NOTES

- **Crypto data** caches in IndexedDB via `idb` package
- **Multiplayer** uses Supabase realtime (optional)
- **GIF animations** parsed with `gifuct-js`
- **See ROADMAP.md** for simulation/zoning vision (extensive)
- **CLAUDE.md** has sound notification conventions
