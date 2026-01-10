# CRYPTO COMPONENTS

React components for displaying crypto market data. 6 files.

## STRUCTURE

```
crypto/
├── CryptoDataPanel.tsx    # Main crypto stats panel
├── CryptoTicker.tsx       # Scrolling price ticker
├── FearGreedGauge.tsx     # Fear & Greed Index display
├── MarketOverview.tsx     # Market cap, volume summary
├── PriceChart.tsx         # Mini price charts
└── TokenCard.tsx          # Individual token display
```

## WHERE TO LOOK

| Task | File |
|------|------|
| Show crypto prices | `CryptoTicker.tsx` |
| Market sentiment | `FearGreedGauge.tsx` |
| Token details | `TokenCard.tsx` |
| Price history | `PriceChart.tsx` |

## COMPONENT DETAILS

### CryptoDataPanel
Main panel showing live market data:
```typescript
<CryptoDataPanel 
  position="top-right"
  compact={false}
  showChart={true}
/>
```

### CryptoTicker
Scrolling news-style ticker:
```typescript
<CryptoTicker 
  tokens={['BTC', 'ETH', 'SOL']}
  speed="normal"
/>
```

### FearGreedGauge
Visual sentiment indicator:
```typescript
<FearGreedGauge 
  value={75}  // 0-100
  showLabel={true}
/>
// Displays: "Extreme Greed" with colored gauge
```

## DATA FLOW

```
useRealCryptoData() hook
        │
        ▼
  CryptoDataPanel
   ├── CryptoTicker
   ├── FearGreedGauge
   ├── MarketOverview
   └── TokenCard[]
```

## CONVENTIONS

### Styling
- Use game UI theme (retro pixel style)
- Match panel styling from game/panels/
- Monospace fonts for numbers
- Color coding: green=up, red=down

### Data Display
- Format large numbers (1.2M, 3.4B)
- Show % change with arrows
- Cache data to prevent flicker
- Loading skeletons for async data

### Responsiveness
- Collapse to compact mode on mobile
- Hide non-essential data on small screens
- Touch-friendly tap targets

## ANTI-PATTERNS

- **Don't poll APIs directly** - Use useRealCryptoData hook
- **Don't show stale data without indicator** - Show "updated X ago"
- **Don't block render on data** - Show loading state
- **Don't hardcode prices** - Always fetch fresh

## NOTES

- All data from `useRealCryptoData` hook
- Updates every 60 seconds (configurable)
- Cached in IndexedDB for offline
- Fear & Greed affects game mood
