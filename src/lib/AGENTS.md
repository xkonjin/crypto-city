# UTILITIES & CRYPTO

Shared utilities, crypto data integration, multiplayer support.

## STRUCTURE

```
lib/
├── utils.ts              # Generic utilities (cn(), etc.)
├── names.ts              # Name generation for NPCs
├── simulation.ts         # Game simulation logic
├── cityManager.ts        # City state management
├── shareState.ts         # State sharing utilities
├── renderConfig.ts       # Render settings
├── performanceUtils.ts   # Performance helpers
├── saveWorker.ts         # Web Worker for saves
├── saveWorkerManager.ts  # Worker orchestration
│
├── crypto/               # Crypto data integration
│   ├── index.ts          # Main exports
│   ├── types.ts          # CryptoData, MarketData interfaces
│   ├── config.ts         # API keys, endpoints
│   ├── realityBlender.ts # Maps crypto → game effects
│   ├── api/              # External API clients
│   │   ├── coinGecko.ts  # Price data
│   │   ├── defiLlama.ts  # DeFi TVL data
│   │   ├── fearGreed.ts  # Fear & Greed Index
│   │   ├── perplexityNews.ts # AI news summaries
│   │   └── twitter.ts    # Social sentiment
│   └── cache/            # IndexedDB caching
│       ├── types.ts
│       └── cryptoDataCache.ts
│
└── multiplayer/          # Supabase realtime
    ├── types.ts          # Room, Player interfaces
    ├── database.ts       # Supabase client
    └── supabaseProvider.ts
```

## WHERE TO LOOK

| Task | File |
|------|------|
| Add crypto API | `crypto/api/` + register in `crypto/index.ts` |
| Cache crypto data | `crypto/cache/cryptoDataCache.ts` |
| Map crypto to game | `crypto/realityBlender.ts` |
| Multiplayer sync | `multiplayer/supabaseProvider.ts` |
| Web Worker saves | `saveWorker.ts` |

## CRYPTO DATA FLOW

```
External APIs ──► cache/cryptoDataCache.ts ──► realityBlender.ts ──► Game
    │                    │                            │
 coinGecko          IndexedDB                   Weather, events,
 defiLlama          (idb package)               building effects
 fearGreed
```

### Reality Blender
Maps real crypto data to in-game effects:
- BTC price → city prosperity/mood
- Fear/Greed → NPC behavior
- Volume → traffic density

## CONVENTIONS

- All API clients export async functions returning typed data
- Cache has TTL-based invalidation
- Worker communication via `postMessage`

## ANTI-PATTERNS

- **Don't call APIs directly from components** - Use hooks + cache
- **Don't skip cache** - APIs have rate limits
- **Don't block main thread** - Heavy saves go to Worker

## NOTES

- `@supabase/supabase-js` for multiplayer
- `idb` package for IndexedDB wrapper
- API keys stored in environment variables
