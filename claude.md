# Project Guidelines for Claude

> **Full Codebase Map:** See `docs/CODEBASE_MAP.md` for comprehensive architecture documentation

## Notifications

Play system sound (`afplay /System/Library/Sounds/Ping.aiff`) when finishing long tasks, needing input, or hitting errors.

## Tech Stack

- **Framework:** Next.js 16, React 19, TypeScript 5, App Router
- **Rendering:** Canvas 2D (multi-layer isometric)
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Testing:** Playwright (3,791+ tests)

## Commands

```bash
npm run dev     # Development (localhost:3000)
npm run build   # Production build
npm run lint    # ESLint
npm run test    # Playwright tests
```

## Architecture Summary

```
LAYER 1: SIMULATION (React) - Source of Truth
  GameContext.tsx, simulation.ts - grid, budget, population

LAYER 2: RENDERING (Canvas) - Visualization  
  CanvasIsometricGrid.tsx - 6-layer canvas, depth sorting

LAYER 3: AGENTS - Eye Candy
  NPCSimulation.ts, vehicleSystems - cosmetic only
```

**Golden Rule:** Simulation computes NUMBERS. Canvas shows PICTURES. Pictures never change numbers.

## Key Files

| Task | File |
|------|------|
| City simulation | `src/lib/simulation.ts` (6k lines) |
| Game state | `src/context/GameContext.tsx` |
| Main renderer | `src/components/game/CanvasIsometricGrid.tsx` |
| Crypto buildings | `src/games/isocity/crypto/buildings.ts` |
| Crypto economy | `src/games/isocity/crypto/CryptoEconomyManager.ts` |
| NPC simulation | `src/lib/npc/NPCSimulation.ts` |
| Titan/Pet AI | `src/lib/titan/TitanAI.ts` |
| UI panels | `src/components/game/panels/*.tsx` |

## Isometric Math

```typescript
const TILE_WIDTH = 64;
const TILE_HEIGHT = 38.4; // 64 * 0.6

// Grid → Screen
screenX = (gridX - gridY) * (TILE_WIDTH / 2);
screenY = (gridX + gridY) * (TILE_HEIGHT / 2);
```

## Code Conventions

- Components: PascalCase
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Building IDs: kebab-case

## Key Systems

### Crypto Economy
- 127 buildings across 10 categories (DeFi, Exchange, Chain, CT, Meme, etc.)
- 4 tiers: retail → degen → whale → institution
- Chain synergies, rug risk, protection buildings

### NPC System
- 6-tier LOD (FULL → SUSPENDED based on distance)
- Needs-driven behavior, episodic + semantic + vector memory
- X402 economy for NPC transactions

### Titan/Pet
- BDI AI (Belief-Desire-Intention)
- God Hand praise/punish for training
- 12 skills, moral alignment (-1 angelic to +1 demonic)

## Save/Load

localStorage with lz-string compression, Web Worker serialization.

## Skills & Droids

Use `ask-questions` skill (by @the-vampiire) before asking users for input, making decisions with options, or gathering requirements. Core principles:
- Context first: analyze codebase before asking (don't ask about decided things)
- Quality over quantity: max 4-6 questions per interaction
- Options with tradeoffs: each option must include context
See `.factory/skills/ask-questions/` for templates, examples, and anti-patterns.
