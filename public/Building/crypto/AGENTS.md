# CRYPTO BUILDING SPRITES

**127 sprite assets** for crypto-themed buildings. All generated with Gemini 2.5 Flash Image API.

**Last Updated:** 2025-01-13 | **Total Size:** ~136MB | **Format:** PNG with transparency

## STRUCTURE

```
crypto/
├── chain/           # L1/L2 blockchain buildings (13)
│   ├── 4x4ethereum_beacon_south.png
│   ├── 3x3solana_tower_south.png
│   ├── 3x3bitcoin_vault_south.png
│   ├── 2x3arbitrum_bridge_south.png
│   ├── 2x2base_camp_south.png
│   ├── 2x2avalanche_summit_south.png
│   ├── 2x2blast_arena_south.png
│   └── ...
│
├── ct/              # Crypto Twitter culture (10)
│   ├── 2x2ct_studio_south.png
│   ├── 2x2vc_office_south.png
│   ├── 2x2nft_gallery_south.png
│   ├── 2x2dao_hq_south.png
│   ├── 2x2podcast_tower_south.png
│   ├── 1x1anon_bunker_south.png
│   └── ...
│
├── defi/            # DeFi protocols (23)
│   ├── 3x3aave_lending_tower_south.png
│   ├── 2x2uniswap_exchange_south.png
│   ├── 3x3makerdao_vault_south.png
│   ├── 3x3eigenlayer_vault_south.png
│   ├── 3x3hyperliquid_vault_south.png
│   ├── 2x2jupiter_terminal_south.png
│   └── ...
│
├── exchange/        # CEX headquarters (7)
│   ├── 4x4binance_tower_south.png
│   ├── 3x3coinbase_hq_south.png
│   ├── 2x3kraken_exchange_south.png
│   ├── 2x2gemini_office_south.png
│   ├── 2x2kucoin_plaza_south.png
│   └── ...
│
├── infrastructure/  # Oracles, bridges (7)
│   ├── 3x3chainlink_hub_south.png
│   ├── 2x3layerzero_bridge_south.png
│   ├── 2x2security_auditor_south.png
│   ├── 2x2crypto_insurance_south.png
│   └── ...
│
├── legends/         # Legendary figures & events (19)
│   ├── 3x3ftx_ruins_south.png
│   ├── 2x2luna_crater_south.png
│   ├── 2x3vitalik_tower_south.png
│   ├── 2x2satoshi_monument_south.png
│   ├── 2x2alpha_bunker_south.png (Cobie's Alpha Bunker)
│   └── ...
│
├── meme/            # Meme coin culture (20)
│   ├── 1x1pepe_statue_south.png
│   ├── 2x2doge_fountain_south.png
│   ├── 2x2wif_temple_south.png
│   ├── 2x2bonk_arena_south.png
│   ├── 2x2mog_mansion_south.png
│   ├── 2x2hodl_bunker_south.png
│   └── ...
│
├── plasma/          # Plasma ecosystem (18)
│   ├── 4x4plasma_hq_south.png
│   ├── 3x3plasma_reactor_south.png
│   ├── 3x3plasma_nexus_south.png
│   ├── 2x2plasma_lab_south.png
│   └── ...
│
├── stablecoin/      # Stablecoin issuers (5)
│   ├── 3x3tether_hq_south.png
│   ├── 3x3circle_tower_south.png
│   ├── 2x2dai_vault_south.png
│   ├── 2x2ethena_labs_south.png
│   └── 2x2stablecoin_reserve_south.png
│
└── titan/           # Hero Pet system (5)
    ├── 2x2titan-den-1_south.png (Basic)
    ├── 2x2titan-den-2_south.png (Improved)
    ├── 3x3titan-den-3_south.png (Advanced)
    ├── 3x3titan-den-4_south.png (Deluxe)
    └── 4x4titan-den-5_south.png (Premium)
```

## NAMING CONVENTION

```
{width}x{height}{building_name}_{direction}.png

Examples:
- 4x4binance_tower_south.png  → 4x4 tile Binance Tower, south-facing
- 2x2pepe_statue_south.png    → 2x2 tile Pepe Statue, south-facing
- 1x1plasma_node_south.png    → 1x1 tile Plasma Node, south-facing
```

## SPRITE SPECIFICATIONS

### Dimensions
- Base tile: 64x64 pixels
- Multi-tile: width * 64 x height * 64
- Actual sprite height includes building above tile

### Orientation
- Currently: Only `_south` sprites exist
- TODO: Add `_north`, `_east`, `_west` variants
- South = default view (front-facing)

### Transparency
- Background: Transparent PNG
- Some sprites need cleanup (see fixSpriteBackgrounds.py)

### Style
- Isometric pixel art
- Consistent with main game aesthetic
- Recognizable brand elements (Binance yellow, Coinbase blue, etc.)

## BUILDING REGISTRY

Sprites must be registered in:
1. `src/games/isocity/crypto/buildings.ts` - Full definition
2. `src/games/isocity/crypto/buildingRegistry.ts` - Category mapping
3. `src/components/game/buildingHelpers.ts` - Size/placement info

## PROCEDURAL BUILDINGS

**STATUS: All buildings now have sprites!**

As of 2025-01-13, all 127 buildings have custom AI-generated sprites.
No procedural (placeholder) buildings remain.

## KNOWN ISSUES

1. **Missing rotations** - Only south-facing sprites exist (TODO: generate north/east/west)
2. **Some sprites may need refinement** - AI generation occasionally produces artifacts

## ADDING NEW SPRITES

1. Create PNG at correct dimensions
2. Use transparent background
3. Follow naming convention
4. Add to appropriate category folder
5. Register in buildings.ts with effects
6. Test placement in game

## SPRITE GENERATION

Sprites were generated using Google's Gemini 2.5 Flash Image API:

```bash
# Run from project root
npx tsx scripts/generateSpritesNanoBanana.ts
```

**API Details:**
- Model: `gemini-2.5-flash-image`
- Style: Isometric pixel art with transparent background
- Output: PNG files with checkered transparency

## NOTES

- Total: **127 buildings** across **10 categories**
- All sprites are static PNG (no animation frames yet)
- Animation via particle effects overlay (CryptoParticleSystem)
- Brand colors should be recognizable but not trademarked
- Each building has Hitchhiker's Guide-style sardonic description
