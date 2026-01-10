# CRYPTO BUILDING SPRITES

Sprite assets for 93 crypto-themed buildings (4 stablecoins after dai_vault addition). Organized by category.

## STRUCTURE

```
crypto/
├── chain/           # L1/L2 blockchain buildings (13)
│   ├── 4x4ethereum_beacon_south.png
│   ├── 3x3solana_tower_south.png
│   ├── 3x3bitcoin_vault_south.png
│   ├── 2x3arbitrum_bridge_south.png
│   └── ...
│
├── ct/              # Crypto Twitter culture (10)
│   ├── 2x2ct_studio_south.png
│   ├── 2x2vc_office_south.png
│   ├── 2x2nft_gallery_south.png
│   ├── 2x2dao_hq_south.png
│   └── ...
│
├── defi/            # DeFi protocols (23)
│   ├── 3x3aave_lending_tower_south.png
│   ├── 2x2uniswap_exchange_south.png
│   ├── 3x3makerdao_vault_south.png
│   └── ...
│
├── exchange/        # CEX headquarters (7)
│   ├── 4x4binance_tower_south.png
│   ├── 3x3coinbase_hq_south.png
│   ├── 2x3kraken_exchange_south.png
│   └── ...
│
├── infrastructure/  # Oracles, bridges (5)
│   ├── 3x3chainlink_hub_south.png
│   ├── 2x3layerzero_bridge_south.png
│   └── ...
│
├── meme/            # Meme coin culture (20)
│   ├── 1x1pepe_statue_south.png
│   ├── 2x2doge_fountain_south.png
│   ├── 2x2wif_temple_south.png
│   └── ...
│
├── plasma/          # Plasma ecosystem (18)
│   ├── 4x4plasma_hq_south.png
│   ├── 3x3plasma_reactor_south.png
│   └── ...
│
└── stablecoin/      # Stablecoin issuers (4)
    ├── 3x3tether_hq_south.png    → Tether HQ (footprint: 3x3)
    ├── 3x3circle_tower_south.png → Circle Tower (USDC)
    ├── 2x2dai_vault_south.png    → DAI Vault (MakerDAO)
    └── (ethena_labs is procedural)
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

Buildings with `isProcedural: true` in registry don't have sprites yet:
- Need to be generated or designed
- Temporarily use placeholder or similar building sprite

## KNOWN ISSUES

1. **Transparency artifacts** - Some sprites have remnant backgrounds
2. **Missing rotations** - Only south-facing sprites exist
3. **Inconsistent sizes** - Some sprites don't match declared footprint
4. **Placeholder needed** - Procedural buildings need fallback sprite

## ADDING NEW SPRITES

1. Create PNG at correct dimensions
2. Use transparent background
3. Follow naming convention
4. Add to appropriate category folder
5. Register in buildings.ts with effects
6. Test placement in game

## NOTES

- Total: 99 buildings across 8 categories
- All sprites are static PNG (no animation frames yet)
- Animation via particle effects overlay (planned)
- Brand colors should be recognizable but not trademarked
