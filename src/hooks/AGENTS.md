# CUSTOM HOOKS

React hooks for game state, crypto data, and utilities. 5 files.

## STRUCTURE

```
hooks/
├── useCheatCodes.ts      # Konami code & debug cheats
├── useMobile.ts          # Mobile/touch detection
├── useMultiplayerSync.ts # Supabase realtime sync
├── useRealCryptoData.ts  # Live crypto price/sentiment
└── useTipSystem.ts       # Tutorial tip management
```

## WHERE TO LOOK

| Task | File |
|------|------|
| Add cheat code | `useCheatCodes.ts` |
| Mobile detection | `useMobile.ts` |
| Multiplayer sync | `useMultiplayerSync.ts` |
| Crypto API data | `useRealCryptoData.ts` |
| Tutorial tips | `useTipSystem.ts` |

## HOOK DETAILS

### useRealCryptoData
Fetches and caches live crypto market data:
```typescript
const { data, isLoading, error, refetch } = useRealCryptoData({
  enabled: true,
  refreshInterval: 60000, // 1 minute
});

// Returns:
interface RealWorldCryptoData {
  btcPrice: number;
  ethPrice: number;
  fearGreedIndex: number;    // 0-100
  totalMarketCap: number;
  btc24hChange: number;
  topGainers: TokenData[];
  topLosers: TokenData[];
}
```

### useMultiplayerSync
Manages Supabase realtime for co-op:
```typescript
const {
  isConnected,
  players,
  sendAction,
  broadcastState,
} = useMultiplayerSync(roomCode, playerId);
```

### useCheatCodes
Registers keyboard sequences:
```typescript
// Built-in cheats:
// - "funds" → Add $10,000
// - "power" → Unlimited power
// - "water" → Unlimited water
// - Konami code → Easter egg
```

### useMobile
Responsive breakpoint detection:
```typescript
const { isMobileDevice, isSmallScreen, isTouchDevice } = useMobile();
```

### useTipSystem
Progressive tutorial system:
```typescript
const { currentTip, dismissTip, showTip, hasSeenTip } = useTipSystem();
```

## CONVENTIONS

### Hook Structure
```typescript
export function useHookName(options: Options): ReturnType {
  const [state, setState] = useState<T>(initial);
  
  useEffect(() => {
    // Setup
    return () => { /* Cleanup */ };
  }, [deps]);
  
  const action = useCallback(() => {
    // Memoized action
  }, [deps]);
  
  return { state, action };
}
```

### Error Handling
- Return `{ error }` in return object
- Log errors but don't throw in hooks
- Provide fallback/default values

### Caching
- `useRealCryptoData` uses IndexedDB cache
- Cache invalidation via TTL
- Stale-while-revalidate pattern

## ANTI-PATTERNS

- **Don't call hooks conditionally** - Breaks React rules
- **Don't fetch without caching** - API rate limits
- **Don't skip cleanup** - Memory leaks in realtime hooks
- **Don't mutate state directly** - Use setState/dispatch

## NOTES

- All hooks are client-side only
- Crypto data cached in IndexedDB via `idb` package
- Multiplayer uses Supabase realtime channels
