# CryptoCity

> *"The city exists in a quantum state between 'We're All Gonna Make It' and 'Not Gonna Make It'—technically both, until someone checks CoinGecko."*

An isometric city builder where crypto culture meets urban planning. Build your DeFi empire, watch AI citizens navigate market cycles, and experience the beautiful chaos of Web3 with Douglas Adams-style sardonic humor.

## Features

- **Isometric City Building** - Classic 2:1 isometric projection with proper depth sorting, multi-tile buildings, and 4-direction rotation
- **127 Crypto Buildings** - DeFi protocols, exchanges, chains, meme coins, and legendary CT figures - all with custom AI-generated isometric sprites
- **Living City Simulation** - AI NPCs with needs, schedules, emotions, and pathfinding (Stanford Generative Agents-inspired)
- **Real Crypto Integration** - Fear & Greed index, DeFi TVL data, and protocol yields affect gameplay
- **Sardonic Advisor System** - Cobie-style narrator provides context-aware commentary
- **Hero Pet System** - Black & White-inspired trainable companion creature with BDI AI (in development)
- **Co-op Multiplayer** - Build cities together with 5-character room codes

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build

# Run tests
npm run test
```

Open [http://localhost:3000](http://localhost:3000) to start building.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 + React 19 + TypeScript 5 |
| Rendering | Multi-canvas isometric engine + Phaser 3.90 (optional) |
| Styling | Tailwind CSS 4 + Custom CSS variables |
| State | React Context + Zustand + SWR |
| Database | IndexedDB (idb) + Supabase (multiplayer) |
| Testing | Playwright E2E |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: SIMULATION (React)                                │
│  Source of truth: grid state, budget, population, time      │
│  Lives in: GameContext.tsx, simulation.ts                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ grid, simData (one-way push)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: RENDERING (Canvas)                                │
│  Multi-layer canvas with depth sorting                      │
│  Lives in: CanvasIsometricGrid.tsx                          │
└─────────────────────────────────────────────────────────────┘
                      │ reads grid (reference)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: COSMETIC AGENTS (Canvas)                          │
│  NPCs, cars, boats, aircraft - eye candy that reads grid    │
│  Lives in: vehicleSystems, NPCSimulation                    │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle:** Simulation computes NUMBERS. Canvas shows PICTURES of those numbers. Pictures never affect the numbers.

## Project Structure

```
src/
├── app/                     # Next.js App Router pages
├── components/
│   ├── game/               # Isometric grid, canvas layers, building system
│   ├── ui/                 # shadcn/ui + Radix primitives
│   ├── crypto/             # Crypto panel, portfolio, analytics
│   ├── mobile/             # Mobile-specific UI
│   └── titan/              # Hero Pet system (WIP)
├── lib/
│   ├── npc/                # NPC simulation (32 files)
│   ├── titan/              # Titan/Hero Pet logic
│   ├── crypto/             # API clients, caching
│   └── simulation.ts       # Core city simulation (6k lines)
├── games/isocity/
│   ├── crypto/             # Crypto economy system
│   └── types/              # Game type definitions
├── context/                # React contexts (Game, Economy, Grid, etc.)
└── hooks/                  # Custom React hooks
```

## Game Systems

### Economy
- **Treasury** - City funds from taxes and building yields
- **RCI Demand** - Residential/Commercial/Industrial balance
- **Land Value** - Affected by services, parks, pollution
- **Crypto Yields** - DeFi buildings generate passive income

### Simulation
- **Zone Growth** - Empty zones develop based on demand + desirability
- **Service Coverage** - Police, fire, health, education radius effects
- **Traffic** - Road usage visualization (not agent-pathfinded)
- **Day/Night Cycle** - Affects NPC schedules and lighting

### NPCs
- **Needs System** - Sims-style motives (hunger, energy, social, wealth)
- **Schedules** - Time-based activities (commute, work, leisure)
- **Personalities** - Big Five + crypto traits (risk tolerance, degen level)
- **Memory** - Episodic memories influence behavior

### Crypto Integration
- **Real-time Data** - CoinGecko prices, DeFi Llama TVL, Fear & Greed
- **Chain Synergies** - Buildings from same chain boost each other
- **Risk System** - Rug pulls, audits, insurance mechanics
- **Market Cycles** - Bull/bear sentiment affects city mood

## Unique Design Philosophy

**Everything is a feature.** The volatility, the absurdity, the 3am anxiety spirals. They're not bugs; they're what makes crypto interesting.

**Community through chaos.** We're all in this together. The humor comes from shared experience, not mockery.

**Build anyway.** Despite everything, people build. That's the real story of crypto. That's what CryptoCity celebrates.

## Building Types (127 Total)

| Category | Count | Examples |
|----------|-------|----------|
| DeFi | 23 | Aave Lending Tower, Uniswap Exchange, Lido Staking Hub, EigenLayer Vault |
| Exchange | 7 | Binance Tower, Coinbase HQ, Kraken Exchange, OKX Center |
| Chain | 13 | Ethereum Beacon, Solana Tower, Bitcoin Vault, Arbitrum Bridge |
| CT | 10 | CT Influencer Studio, VC Office, Alpha Call Center, Podcast Tower |
| Meme | 20 | Pepe Statue, Doge Fountain, WIF Temple, BONK Arena, MOG Mansion |
| Plasma | 18 | Plasma HQ, Plasma Node, Plasma Bridge, Plasma Lab, Plasma Arena |
| Stablecoin | 5 | Tether HQ, Circle Tower, DAI Vault, Ethena Labs |
| Infrastructure | 7 | Chainlink Hub, The Graph Indexer, LayerZero Bridge, Security Auditor |
| Legends | 19 | FTX Ruins, Luna Crater, Vitalik's Beacon, Satoshi Monument, Cobie's Alpha Bunker |
| Titan | 5 | Titan Den tiers 1-5 (Hero Pet housing) |

## Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Pan | Click + drag / Arrow keys | Touch + drag |
| Zoom | Scroll wheel | Pinch |
| Place | Click tile | Tap tile |
| Rotate | R key | Rotate button |
| Bulldoze | B key | Bulldoze tool |
| God Hand | G key | Not available |

## Development

### Commands

```bash
npm run dev         # Dev server (localhost:3000)
npm run build       # Production build
npm run lint        # ESLint
npm run test        # Playwright tests
npm run test:ui     # Interactive test runner
```

### Key Files

| Task | File |
|------|------|
| Add buildings | src/games/isocity/crypto/buildings.ts |
| Game state | src/context/GameContext.tsx |
| Rendering | src/components/game/CanvasIsometricGrid.tsx |
| Simulation | src/lib/simulation.ts |
| NPC AI | src/lib/npc/NPCSimulation.ts |
| Crypto economy | src/games/isocity/crypto/CryptoEconomyManager.ts |

### Testing

Tests: **2838 passing** (90+ spec files)

```bash
# Run all tests
npm run test

# Single test file
npx playwright test tests/game.spec.ts

# Interactive mode
npm run test:ui
```

Key test suites:
- NPC System: 1600+ tests
- Floating Cobie Head: 176 tests
- Hero Pet (Titan): 21 spec files
- Crypto Building Panel: Full UI coverage

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full technical roadmap.

**Current Focus:**
- [ ] Hero Pet (Titan) system - trainable AI companion
- [ ] NPC Emotional Engagement - deeper citizen relationships
- [ ] Plasma Wallet Integration - real crypto transactions

**Future:**
- [ ] City sharing and screenshots
- [ ] Leaderboards
- [ ] Seasonal events
- [ ] Token economics

## Contributing

Contributions welcome! Areas that need help:
- **Buildings** - New crypto-themed buildings and sprites
- **Performance** - Canvas optimization for large cities
- **Mobile** - Touch control improvements
- **Documentation** - Tutorials and examples

## License

MIT License - see below.

**Exception:** Character sprites in `/public/Characters/` are proprietary and not included in this license.

```
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

Built with love for isometric games, crypto culture, and the communities that keep both alive.
