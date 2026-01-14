# Crypto Building Sprites - Issues to Fix

## Summary
Several AI-generated crypto building sprites have visual issues that need to be addressed.
The runtime background removal in `src/components/game/placeholders.ts` has been improved
to better handle these cases, but some sprites may need regeneration for optimal quality.

## Issue Types

### 1. Black Background (Most Common)
Sprites have solid black background at the top of the image instead of transparency.
This happens when the AI generates a "dark space" background instead of true transparency.

**Affected Sprites:**
| Path | Issue Details |
|------|---------------|
| `plasma/2x3plasma_tower_south.png` | Black background at top ~40% |
| `plasma/2x3plasma_bridge_south.png` | Black background + wrong color scheme (tan instead of pink) |
| `plasma/3x3plasma_reactor_south.png` | Black background at top ~30% |
| `exchange/2x3kraken_exchange_south.png` | Black background at top ~50% |
| `meme/2x3moon_monument_south.png` | Black background at top |
| `meme/2x3floki_fortress_south.png` | Black background at top |
| `defi/2x2compound_bank_south.png` | Black background at top ~60% |
| `defi/2x3eigenlayer_restaking_south.png` | Black background with gradient |
| `meme/2x2wif_temple_south.png` | Black background + white ground plane |

### 2. Ground Plane Issues
Some sprites have a gray/white ground plane or shadow at the bottom.
This should be transparent for proper isometric tile rendering.

**Affected Sprites:**
| Path | Issue Details |
|------|---------------|
| `meme/2x2wif_temple_south.png` | White ground plane at bottom |
| `infrastructure/2x3layerzero_bridge_south.png` | Has "ISOCITY" watermark text |

### 3. Wrong Color Scheme
Some Plasma buildings don't use the signature pink/magenta Plasma brand color.

**Affected Sprites:**
| Path | Issue Details |
|------|---------------|
| `plasma/2x3plasma_bridge_south.png` | Uses tan/brown instead of pink |

## Runtime Fix Applied

The `placeholders.ts` file has been updated with:
- Extended dark color detection (RGB values 0-40)
- Increased color threshold from 35 to 45
- Better edge sampling for background detection

This should automatically remove most black backgrounds when sprites are loaded.

## Sprites That Are Good (Reference Quality)

These sprites have clean transparent backgrounds and can be used as reference:
- `legends/2x3vitalik_tower_south.png` - Clean, proper pixel art style
- `legends/2x3solana_spire_south.png` - Clean, good proportions
- `chain/2x3zksync_tower_south.png` - Clean, good detail
- `chain/2x3arbitrum_bridge_south.png` - Clean, unique horizontal design
- `defi/3x3ftx_ruins_south.png` - Clean, good "ruined" aesthetic

## Regeneration Priority

1. **High Priority** (significantly affects gameplay visibility):
   - `plasma/2x3plasma_tower_south.png`
   - `exchange/2x3kraken_exchange_south.png`
   - `defi/2x2compound_bank_south.png`
   - `plasma/2x3plasma_bridge_south.png` (also needs color fix)

2. **Medium Priority** (visible but manageable):
   - `plasma/3x3plasma_reactor_south.png`
   - `meme/2x3moon_monument_south.png`
   - `meme/2x3floki_fortress_south.png`
   - `defi/2x3eigenlayer_restaking_south.png`

3. **Low Priority** (minor issues):
   - `meme/2x2wif_temple_south.png`
   - `infrastructure/2x3layerzero_bridge_south.png` (watermark)

## Regeneration Script

Use the existing `scripts/generateSpecificSprites.ts` script to regenerate:

```bash
npx ts-node scripts/generateSpecificSprites.ts plasma_tower plasma_bridge plasma_reactor kraken_exchange compound_bank
```

Remember to add the `--transparency` prompt hint to the generation.
