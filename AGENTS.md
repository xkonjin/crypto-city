# AGENTS.md - AI Assistant Guidelines

> CryptoCity: An isometric city builder with real-time crypto data integration
> 
> **Status:** Active development | **Last Updated:** 2026-01-14 | **Tests:** 3791 passing

## Specialized Droids & Skills

This project has specialized droids and skills in `.factory/` for targeted tasks.

### Project Droids (`.factory/droids/`)

| Droid | Purpose | When to Use |
|-------|---------|-------------|
| `simulation-expert` | City simulation, RCI, services | Debugging sim logic |
| `canvas-renderer` | Isometric rendering, depth sorting | Canvas/visual issues |
| `npc-architect` | NPC behavior, memory, LOD, X402 | NPC system changes |
| `titan-trainer` | Hero pet BDI AI, learning, skills | Titan features |
| `crypto-economist` | Crypto buildings, synergies, risk | Economy system |
| `ui-builder` | React panels, shadcn/ui, Cobie | UI components |
| `test-runner` | Run/debug Playwright tests | Test failures |
| `sprite-generator` | Generate/fix building sprites | Sprite issues |
| `sprite-validator` | Validate sprite quality (transparency, colors) | Sprite QA |
| `visual-tester` | Playwright visual regression tests | Render verification |
| `animation-expert` | NPC walk cycles, spritesheets | Character animation |
| `performance-auditor` | Profile and optimize | Performance |
| `bug-hunter` | Trace data flow, find root causes | Bug investigation |

### Project Skills (`.factory/skills/`)

| Skill | Purpose |
|-------|---------|
| `add-crypto-building` | Add new crypto building end-to-end |
| `add-game-panel` | Create new dialog panel with state |
| `implement-npc-behavior` | Add new NPC need/activity/interaction |
| `add-titan-skill` | Add new Titan skill with XP progression |
| `write-playwright-test` | Generate tests matching project patterns |
| `trace-data-flow` | Debug state synchronization issues |

---

## Quick Reference

```bash
# Development
npm run dev           # Dev server (localhost:3000) - uses --webpack flag
npm run build         # Production build (compiles successfully)
npm run lint          # ESLint (passes clean)
npm run test          # Playwright E2E tests (2838 tests)
npm run test:ui       # Interactive test UI

# Type check
npx tsc --noEmit
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: SIMULATION (React) - Source of Truth              │
│  Grid state, budget, population, time, zone growth          │
│  Files: GameContext.tsx, simulation.ts, EconomyContext.tsx  │
└─────────────────────┬───────────────────────────────────────┘
                      │ props/context (one-way)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: RENDERING (Canvas) - Visualization                │
│  Multi-layer canvas, depth sorting, overlays                │
│  Files: CanvasIsometricGrid.tsx (3.5k lines)                │
└─────────────────────────────────────────────────────────────┘
                      │ reads grid
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: COSMETIC AGENTS - Eye Candy                       │
│  NPCs, vehicles, aircraft - read grid, never write          │
│  Files: NPCSimulation.ts, vehicleSystems hooks              │
└─────────────────────────────────────────────────────────────┘
```

**Golden Rule:** Simulation computes NUMBERS. Canvas shows PICTURES. Pictures never change numbers.

## Project Structure

```
src/
├── app/                     # Next.js 16 App Router
│   ├── page.tsx            # Landing + Game container
│   └── layout.tsx          # Root layout with providers
├── components/
│   ├── game/               # Core game components
│   │   ├── CanvasIsometricGrid.tsx  # Main renderer (3,474 lines)
│   │   ├── Sidebar.tsx              # Building tools (28,837 bytes)
│   │   ├── TopBar.tsx               # Desktop stats bar
│   │   ├── types.ts                 # Car, Airplane, Pedestrian types
│   │   ├── panels/                  # 16 dialog panels (Budget, Stats, etc.)
│   │   └── buildingHelpers.ts       # Building definitions
│   ├── ui/                 # shadcn/ui components (20 files)
│   ├── crypto/             # Crypto-specific UI
│   │   ├── CryptoBuildingPanel.tsx  # 127 crypto buildings
│   │   └── NewsTicker.tsx           # Scrolling headlines
│   ├── mobile/             # Mobile UI variants
│   └── titan/              # Hero Pet system (WIP)
│       ├── GodHandCursor.tsx
│       ├── TitanStatusPanel.tsx
│       └── TitanDetailView.tsx
├── lib/
│   ├── simulation.ts       # Core city sim (5,991 lines)
│   ├── npc/                # NPC simulation (32 files)
│   │   ├── NPCSimulation.ts    # Master controller
│   │   ├── needs.ts            # Sims-style motives
│   │   ├── memory.ts           # Episodic/semantic memory
│   │   └── personality.ts      # Big Five + crypto traits
│   ├── titan/              # Hero Pet logic
│   │   ├── TitanManager.ts     # Singleton manager
│   │   ├── TitanAI.ts          # BDI architecture
│   │   └── TitanLearning.ts    # Reinforcement learning
│   └── crypto/api/         # Crypto data fetching
├── games/isocity/
│   ├── crypto/             # Crypto economy
│   │   ├── CryptoEconomyManager.ts
│   │   ├── buildings.ts    # 127 crypto building definitions
│   │   └── types.ts        # CryptoBuilding, Tier types
│   └── types/              # Game type definitions
│       ├── game.ts
│       ├── npc.ts
│       └── titan.ts
├── context/                # React contexts
│   ├── GameContext.tsx     # Main state hub (2,055 lines)
│   ├── EconomyContext.tsx
│   ├── GridContext.tsx
│   └── SimulationContext.tsx
└── hooks/                  # Custom hooks
    ├── useNPCSimulation.ts
    ├── useTitan.ts
    └── useRealCryptoData.ts
```

## Key Files by Task

| Task | Primary File | Notes |
|------|-------------|-------|
| Add standard buildings | src/components/game/buildingHelpers.ts | |
| Add crypto buildings | src/games/isocity/crypto/buildings.ts | 127 existing |
| Game state management | src/context/GameContext.tsx | 2k lines |
| Canvas rendering | src/components/game/CanvasIsometricGrid.tsx | 3.5k lines |
| City simulation logic | src/lib/simulation.ts | 6k lines |
| NPC behavior | src/lib/npc/NPCSimulation.ts | |
| Crypto economy | src/games/isocity/crypto/CryptoEconomyManager.ts | |
| Hero Pet system | src/lib/titan/TitanManager.ts | WIP |
| UI panels | src/components/game/panels/*.tsx | 16 panels |
| Design tokens | src/app/globals.css | CSS variables |

## Code Conventions

### TypeScript
- **Strict mode enabled**
- **Path alias:** `@/*` → `./src/*`
- **No suppressions:** Never use `as any`, `@ts-ignore`, `@ts-expect-error`

### Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `CanvasIsometricGrid.tsx` |
| Functions | camelCase | `gridToScreen()` |
| Constants | SCREAMING_SNAKE | `TILE_WIDTH`, `GRID_SIZE` |
| Types/Interfaces | PascalCase | `GridPosition`, `GameState` |
| Building IDs | kebab-case | `"aave-lending-tower"` |
| Files | camelCase.ts or PascalCase.tsx | |

### Isometric Math
```typescript
// Constants
const TILE_WIDTH = 64;
const HEIGHT_RATIO = 0.6;
const TILE_HEIGHT = TILE_WIDTH * HEIGHT_RATIO; // 38.4

// Grid → Screen
screenX = (gridX - gridY) * (TILE_WIDTH / 2);
screenY = (gridX + gridY) * (TILE_HEIGHT / 2);

// Screen → Grid
gridX = floor(screenX / TILE_WIDTH + screenY / TILE_HEIGHT);
gridY = floor(screenY / TILE_HEIGHT - screenX / TILE_WIDTH);

// Depth layers (lower = further back)
// 0.00 - Ground tiles
// 0.05 - Buildings
// 0.10 - Cars
// 0.20 - Characters
```

## Game Systems

### Simulation (src/lib/simulation.ts)
- Zone growth based on RCI demand
- Land value computation
- Service coverage (police, fire, health, education)
- Budget system (taxes, expenses)
- Fire simulation with spread mechanics

### NPC System (src/lib/npc/)
- **Tiered simulation:** 50-100 "real" NPCs with full AI, 500+ cosmetic sprites
- **Needs:** hunger, energy, social, fun, wealth, purpose, security
- **Memory:** Episodic, semantic, procedural, working
- **Personality:** Big Five + crypto traits (riskTolerance, degenLevel)

### Crypto Economy (src/games/isocity/crypto/)
- **127 buildings** across 10 categories with custom AI-generated sprites:
  - DeFi (23): Aave, Uniswap, Lido, Pendle, Curve, MakerDAO, Compound, EigenLayer, etc.
  - Exchange (7): Binance, Coinbase, Kraken, OKX, Bybit, KuCoin, Gemini
  - Chain (13): Ethereum, Solana, Bitcoin, Arbitrum, Optimism, Polygon, Base, etc.
  - CT (10): CT Studio, VC Office, Alpha Call Center, Podcast Tower, NFT Gallery, etc.
  - Meme (20): Pepe, Doge, Shiba, WIF, BONK, POPCAT, BRETT, Floki, MOG, etc.
  - Plasma (18): HQ, Node, Bridge, Vault, Lab, Arena, Tower, Garden, etc.
  - Stablecoin (5): Tether, Circle, DAI, Ethena, Reserve
  - Infrastructure (7): Chainlink, The Graph, Pyth, LayerZero, Wormhole, Auditor, Insurance
  - Legends (19): FTX Ruins, Luna Crater, 3AC Yacht, Vitalik's Beacon, Satoshi Monument, etc.
  - Titan (5): Den tiers 1-5 for Hero Pet system
- Building tiers: retail → degen → whale → institution
- Chain synergies (Ethereum, Solana, Arbitrum, Base, Polygon, etc.)
- Risk system: rug probability, audits, insurance
- Real-world data integration (CoinGecko, DeFi Llama, Fear & Greed)
- All sprites in `/public/Building/crypto/{category}/` (127 PNG files, ~136MB total)

### Titan/Hero Pet (src/lib/titan/)
- BDI (Belief-Desire-Intention) AI architecture
- Reinforcement learning via God Hand praise/punish
- 12 skill categories with XP progression
- 8 miracle types with alignment requirements
- Visual morphing based on moral alignment

## Data Persistence

| Data | Saved? | Storage |
|------|--------|---------|
| Grid (buildings, zones, roads) | Yes | localStorage (compressed) |
| Budget, treasury | Yes | localStorage |
| Time (year, month, day) | Yes | localStorage |
| Population, demand | Yes | localStorage |
| NPCs | No | Respawned |
| Cars/Aircraft | No | Respawned |
| Titan state | Yes | Separate key |

## Testing

```bash
# All tests
npm run test

# Single file
npx playwright test tests/game.spec.ts

# By name
npx playwright test -g "should load the game canvas"

# Interactive
npm run test:ui
```

Test files in `tests/` (90+ spec files):
- `game.spec.ts` - Core game functionality
- `npcSimulation.spec.ts` - NPC system (1600+ NPC tests)
- `titan*.spec.ts` - Hero Pet tests (21 files)
- `floatingCobieHead.spec.ts` - Cobie companion (176 tests)
- `cryptoBuildingPanel.spec.ts` - Building UI panel
- `zoneOverlay.spec.ts` - Zone visualization system
- `synergyPreview.spec.ts` - Synergy mechanics

## Anti-Patterns

| Don't | Why |
|-------|-----|
| SSR Canvas/Phaser | Dynamic import only, check `typeof window` |
| Mutate grid in Canvas | React owns state, Canvas renders |
| Hardcode tile sizes | Use constants from config |
| Call APIs from components | Use hooks with caching |
| Skip crypto API cache | Rate limits will block you |
| Block main thread | Heavy saves → Web Worker |
| Use `as any` | Fix the type properly |

## Sound Notification

Play system sound when finishing long tasks or needing input:
```bash
afplay /System/Library/Sounds/Ping.aiff
```

## Known Issues

### Turbopack + iCloud
Turbopack fails on paths with spaces. Project uses `--webpack` flag:
```json
"scripts": {
  "dev": "next dev --webpack",
  "build": "next build --webpack"
}
```

### Canvas Performance
CanvasIsometricGrid is 147KB. For large cities, consider:
- Dirty region tracking
- LOD for zoomed-out view
- Chunked rendering

## Documentation

| Document | Purpose |
|----------|---------|
| ROADMAP.md | Technical roadmap with implementation details |
| USER_STORIES.md | 7 epics, 30+ user stories |
| specs/HERO_PET_SYSTEM.md | Titan companion design |
| specs/AI_NPC_LIVING_CITY.md | NPC AI architecture |
| specs/CRYPTO_CITY_BRAND_NARRATIVE.md | Tone, humor, naming |
| docs/GAME_MECHANICS.md | Basic game rules |

## Dependencies

**Core:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4
**UI:** Radix UI, class-variance-authority, lucide-react
**State:** Zustand, SWR
**Data:** Supabase, idb (IndexedDB)
**Game:** Phaser 3.90 (optional), gifuct-js
**Testing:** Playwright
**AI:** @google/genai (for sprite generation scripts)

## Visual System

### Sprite Generation

AI-generated sprites use Google's Gemini 2.5 Flash Image (Nano Banana) API:

```bash
# Generation scripts in /scripts/
generateSpritesNanoBanana.ts   # Main generator (Gemini 2.5 Flash Image)
generateSpecificSprites.ts     # For specific buildings
updateBuildingSpritePaths.ts   # Updates buildings.ts with paths
```

**Sprite Naming Convention:** `{width}x{height}{building_id}_south.png`
- Example: `3x3aave_lending_tower_south.png`
- All sprites have transparent backgrounds
- Isometric pixel art style (64x64 base tile size)

### Sprite Validation

```bash
# Validate all crypto sprites
npx ts-node scripts/validateSprite.ts --all

# Generate HTML report
npx ts-node scripts/validateSprite.ts --report
```

**Quality Checks:**
| Check | Pass Criteria |
|-------|---------------|
| Dimensions | 512x512 PNG |
| Transparency | >5% transparent pixels |
| Corners | ≥3 corners transparent |
| Colors | ≤24 unique colors |

### Dev Tools

Access sprite preview tools at `/dev/sprites` (dev mode only):
- **Sprite Preview**: Grid view with validation status
- **Animation Preview**: Test NPC walk cycles
- **Generator Playground**: Test AI generation (requires API key)

### Visual Regression Tests

```bash
# Run visual tests
npx playwright test tests/visual/

# Update baselines
npx playwright test tests/visual/ --update-snapshots
```

### NPC Avatar Spritesheet Format

```
128x192 PNG (4×4 grid, 32x48 per frame)

Row 1: South (facing viewer)
Row 2: East (right)
Row 3: West (left)
Row 4: North (away)

Cols: idle, walk1, walk2, walk3
```

## X402 NPC Economy (Testnet)

NPCs can transact using the x402 payment protocol on Plasma testnet:

```
src/lib/npc/x402/
├── constants.ts           # Plasma testnet config, service prices
├── types.ts               # NPCOnChainWallet, NPCService, etc.
├── NPCWalletManager.ts    # HD wallet derivation, transfers
├── NPCServiceRegistry.ts  # NPC services by occupation
└── index.ts               # Module exports
```

**Key Concepts:**
- Each NPC gets a deterministic HD wallet (derived from master seed)
- NPCs offer services (drinks, alpha calls, security, etc.) for USDT₮
- Uses HTTP 402 "Payment Required" flow for micropayments
- Plasma testnet: Chain ID 9746, RPC: `https://testnet-rpc.plasma.to`

**Service Prices (USDT₮):**
| Service | Price |
|---------|-------|
| Drink | $0.05 |
| Food | $0.10 |
| Alpha Call | $0.25 |
| Security Escort | $0.50 |

See `specs/X402_NPC_ECONOMY.md` for full implementation spec.
