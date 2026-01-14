---
name: add-crypto-building
description: Add a new crypto building to the economy system end-to-end. Use when adding DeFi protocols, exchanges, chains, or meme coins as buildings.
---

# Add Crypto Building

Complete workflow for adding a new crypto-themed building to CryptoCity.

## Inputs Required

| Input | Description | Example |
|-------|-------------|---------|
| Building Name | Display name | "Hyperliquid Exchange" |
| Building ID | kebab-case identifier | "hyperliquid-exchange" |
| Category | One of: defi, exchange, chain, ct, meme, plasma, stablecoin, infrastructure, legends, titan | "exchange" |
| Tier | retail, degen, whale, institution | "whale" |
| Chain | Primary chain affiliation | ["ethereum", "arbitrum"] |
| Footprint | Grid size | "2x2" |
| Base Yield | Annual yield percentage | 15 |
| Rug Risk | Probability 0-1 | 0.02 |
| Brand Colors | Hex colors for sprite | ["#0000FF", "#00FF00"] |

## Steps

### 1. Generate Sprite

If sprite doesn't exist, generate using Gemini 2.5 Flash Image:

```bash
# Run sprite generation
npx ts-node scripts/generateCryptoSprites.ts --building hyperliquid-exchange
```

**Sprite Requirements:**
- Size: 512x512 PNG
- Transparent background
- Isometric pixel art style
- Include brand colors
- No text on building

**Naming:** `{w}x{h}{building_id}_south.png`
**Location:** `public/Building/crypto/{category}/`

### 2. Add Building Definition

Edit `src/games/isocity/crypto/buildings.ts`:

```typescript
// Find the appropriate category section (e.g., EXCHANGE_BUILDINGS)
export const EXCHANGE_BUILDINGS: CryptoBuilding[] = [
  // ... existing buildings
  {
    id: 'hyperliquid-exchange',
    name: 'Hyperliquid Exchange',
    description: "A perpetuals DEX so fast it makes other exchanges look like they're running on dial-up.",
    category: 'exchange',
    tier: 'whale',
    chains: ['ethereum', 'arbitrum'],
    footprint: { width: 2, height: 2 },
    baseYield: 15,
    rugRisk: 0.02,
    sprite: '/Building/crypto/exchange/2x2hyperliquid_exchange_south.png',
    cost: 12000,
    effects: {
      tradingVolume: 25,
      liquidityBonus: 0.15,
    },
  },
];
```

### 3. Update Type Definitions (if needed)

If adding a new category, edit `src/games/isocity/crypto/types.ts`:

```typescript
export type CryptoCategory = 
  | 'defi'
  | 'exchange'
  // ... add new category
```

### 4. Write Tests

Add to `tests/cryptoBuildingPanel.spec.ts`:

```typescript
test('hyperliquid-exchange building exists', async () => {
  const building = getCryptoBuilding('hyperliquid-exchange');
  expect(building).toBeDefined();
  expect(building.category).toBe('exchange');
  expect(building.tier).toBe('whale');
});

test('hyperliquid-exchange synergies calculate correctly', async () => {
  // Test chain synergy with arbitrum buildings
});
```

### 5. Verify Integration

```bash
# Build check
npm run build

# Run crypto tests
npx playwright test tests/crypto*.spec.ts

# Visual verification
npm run dev
# Place building in game and verify sprite renders
```

## Success Criteria

- [ ] Sprite exists at correct path with transparent background
- [ ] Building appears in correct category in CryptoBuildingPanel
- [ ] Building can be placed on grid
- [ ] Synergies calculate correctly with same-chain buildings
- [ ] Yield and risk values appear in building tooltip
- [ ] All tests pass
- [ ] Build succeeds with no TypeScript errors

## Verification Commands

```bash
# Check sprite exists
ls -la public/Building/crypto/{category}/{w}x{h}{id}_south.png

# Grep for building in code
grep -r "building-id" src/

# Run tests
npm run test -- -g "building-id"

# Build
npm run build
```

## Common Issues

| Issue | Fix |
|-------|-----|
| Sprite not showing | Check path matches footprint size |
| Building not in panel | Check category matches export |
| Synergy not working | Verify chain array values |
| Type error | Update types.ts if new fields added |
