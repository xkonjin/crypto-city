# Building Rename Implementation Spec

## Overview

This spec details the technical implementation of renaming all traditional (non-crypto) buildings in Crypto City to match the sardonic crypto-themed narrative established in `CRYPTO_CITY_BRAND_NARRATIVE.md`.

## Scope

### In Scope
- Renaming all `BuildingType` enum values in `src/games/isocity/types/buildings.ts`
- Updating all display names for buildings across UI
- Adding building descriptions/lore to building definitions
- Updating building metadata (icons, categories)
- Creating migration for existing saves

### Out of Scope (Future Work)
- New building sprites (reuse existing assets, just rename)
- New building types
- Gameplay balance changes

---

## Technical Implementation

### Phase 1: Build Type Mapping System

Rather than changing internal IDs (which would break saves), we'll create a display name mapping system.

```typescript
// NEW FILE: src/games/isocity/types/buildingDisplayNames.ts

export interface BuildingDisplayInfo {
  displayName: string;
  category: BuildingCategory;
  description: string;
  lore: string;
  icon: string;
}

export type BuildingCategory = 
  | 'staking_suburbs'      // Residential
  | 'trading_district'     // Commercial
  | 'mining_flats'         // Industrial
  | 'civic_quarter'        // Services
  | 'infrastructure'       // Utilities & Transport
  | 'landmarks'            // Special
  | 'degen_district'       // Parks & Entertainment
  | 'terrain';             // Water, grass, etc.

export const BUILDING_DISPLAY_INFO: Record<BuildingType, BuildingDisplayInfo> = {
  // Terrain (no rename)
  empty: {
    displayName: 'Empty Lot',
    category: 'terrain',
    description: 'Vacant land awaiting development',
    lore: 'Every great protocol started as an empty repo.',
    icon: '⬜'
  },
  grass: {
    displayName: 'Grassland',
    category: 'terrain',
    description: 'Undeveloped green space',
    lore: 'Nature reminds us that sometimes touching grass is necessary.',
    icon: '🌱'
  },
  water: {
    displayName: 'Liquidity Pool',
    category: 'terrain',
    description: 'Natural water feature',
    lore: 'Deep liquidity. Don\'t dive without checking the depth.',
    icon: '💧'
  },
  tree: {
    displayName: 'Money Tree',
    category: 'terrain',
    description: 'Mature vegetation',
    lore: 'They say money doesn\'t grow on trees. They haven\'t seen DeFi yields.',
    icon: '🌳'
  },

  // Infrastructure
  road: {
    displayName: 'Mempool Lane',
    category: 'infrastructure',
    description: 'Standard road connection',
    lore: 'Transactions wait their turn. Priority available for those who tip.',
    icon: '🛤️'
  },
  bridge: {
    displayName: 'Trust Bridge',
    category: 'infrastructure',
    description: 'Water crossing',
    lore: 'Varies from "mostly secure" to "probably fine" to "we\'re working on it."',
    icon: '🌉'
  },
  rail: {
    displayName: 'L2 Express Track',
    category: 'infrastructure',
    description: 'Rail line',
    lore: 'Fast transit that settles on main street eventually.',
    icon: '🚃'
  },

  // RESIDENTIAL - The Staking Suburbs
  house_small: {
    displayName: 'Seed Phrase Shack',
    category: 'staking_suburbs',
    description: 'Starter home for new citizens',
    lore: 'Where new degens write their seed phrase on a napkin and immediately lose the napkin.',
    icon: '🏠'
  },
  house_medium: {
    displayName: 'HODL House',
    category: 'staking_suburbs',
    description: 'Mid-range family home',
    lore: 'Built to last through at least three bear markets. Panic room doubles as cold storage.',
    icon: '🏡'
  },
  mansion: {
    displayName: 'Whale Estate',
    category: 'staking_suburbs',
    description: 'Luxury residence',
    lore: 'Seven bathrooms, one for each hardware wallet. Garden maze shaped like a blockchain.',
    icon: '🏰'
  },
  apartment_low: {
    displayName: 'Staker Flats',
    category: 'staking_suburbs',
    description: 'Low-rise apartments',
    lore: 'Affordable housing for passive income earners. Staking dashboard view included.',
    icon: '🏢'
  },
  apartment_high: {
    displayName: 'Validator Tower',
    category: 'staking_suburbs',
    description: 'High-rise apartments',
    lore: 'Must prove 32 ETH net worth to apply. Elevator requires consensus to operate.',
    icon: '🏙️'
  },

  // COMMERCIAL - The Trading District
  shop_small: {
    displayName: 'Airdrop Bodega',
    category: 'trading_district',
    description: 'Small retail shop',
    lore: 'Accepts any token. Returns may vary. Actually, returns WILL vary.',
    icon: '🏪'
  },
  shop_medium: {
    displayName: 'Liquidity Plaza',
    category: 'trading_district',
    description: 'Medium retail',
    lore: 'Prices update faster than staff can keep up. "What\'s the price?" "Which second?"',
    icon: '🛒'
  },
  office_low: {
    displayName: 'Protocol HQ',
    category: 'trading_district',
    description: 'Low-rise office',
    lore: 'Junior devs ship code that moves billions. Dress code: hoodie mandatory.',
    icon: '🏬'
  },
  office_high: {
    displayName: 'DAO Spire',
    category: 'trading_district',
    description: 'High-rise office',
    lore: 'Where governance proposals debate for eternity. Meeting rooms named after exploits.',
    icon: '🏛️'
  },
  mall: {
    displayName: 'DEX Megaplex',
    category: 'trading_district',
    description: 'Large shopping center',
    lore: '47 shops connected by bridges of varying trustworthiness. Some may rug.',
    icon: '🛍️'
  },

  // INDUSTRIAL - The Mining Flats
  factory_small: {
    displayName: 'GPU Farm',  // Or Yield Farm (variant)
    category: 'mining_flats',
    description: 'Small production facility',
    lore: 'Either mining crypto or farming yield. Both: staring at numbers hopefully going up.',
    icon: '🏭'
  },
  factory_medium: {
    displayName: 'ASIC Factory',
    category: 'mining_flats',
    description: 'Medium manufacturing',
    lore: 'Specialized equipment for converting electricity to money. Neighbors hate this.',
    icon: '⚙️'
  },
  factory_large: {
    displayName: 'Mining Complex',
    category: 'mining_flats',
    description: 'Large industrial facility',
    lore: 'Serious hash power happens here. Electric bill is classified information.',
    icon: '🔧'
  },
  warehouse: {
    displayName: 'Cold Storage Depot',
    category: 'mining_flats',
    description: 'Storage facility',
    lore: 'Where hardware wallets are written on paper, laminated, buried, and memorized anyway.',
    icon: '📦'
  },

  // CIVIC - The Civic Quarter
  police_station: {
    displayName: 'Exploit Response HQ',
    category: 'civic_quarter',
    description: 'Security services',
    lore: 'First responders for smart contract emergencies. "We can\'t undo it, but we can investigate."',
    icon: '🚔'
  },
  fire_station: {
    displayName: 'Liquidation Rescue',
    category: 'civic_quarter',
    description: 'Emergency services',
    lore: 'Responds when positions are on fire. Equipped with emergency fiat for margin calls.',
    icon: '🚒'
  },
  hospital: {
    displayName: 'Recovery Ward',
    category: 'civic_quarter',
    description: 'Healthcare facility',
    lore: 'Specializes in portfolio trauma and "I should have sold" syndrome. Support groups Thursdays.',
    icon: '🏥'
  },
  school: {
    displayName: 'DYOR Academy',
    category: 'civic_quarter',
    description: 'Education facility',
    lore: 'Where young degens learn to read whitepapers and spot rug pull warning signs.',
    icon: '🏫'
  },
  university: {
    displayName: 'Tokenomics Institute',
    category: 'civic_quarter',
    description: 'Higher education',
    lore: 'Degrees in Game Theory, Applied Cope, and "Understanding The Technology." Graduation varies by cycle.',
    icon: '🎓'
  },

  // Utilities
  power_plant: {
    displayName: 'Consensus Reactor',
    category: 'infrastructure',
    description: 'Power generation',
    lore: 'Provides computational energy to validate existence. Runs on electricity and belief.',
    icon: '⚡'
  },
  water_tower: {
    displayName: 'Liquidity Tank',
    category: 'infrastructure',
    description: 'Water supply',
    lore: 'Ensures liquidity flows throughout the city. Dry seasons correlate with bear markets.',
    icon: '💧'
  },

  // Transportation
  subway_station: {
    displayName: 'ZK Metro',
    category: 'infrastructure',
    description: 'Underground transit',
    lore: 'So efficient you don\'t have to prove you took the ride. Zero knowledge commuting.',
    icon: '🚇'
  },
  rail_station: {
    displayName: 'Rollup Terminal',
    category: 'infrastructure',
    description: 'Train station',
    lore: 'Batch your travels for efficiency. The 3:15 to Optimism is now arriving.',
    icon: '🚉'
  },

  // Parks & Recreation - The Degen District
  park: {
    displayName: 'HODL Garden',
    category: 'degen_district',
    description: 'Small park',
    lore: 'A peaceful place to contemplate your portfolio. Benches face away from price displays.',
    icon: '🌳'
  },
  park_large: {
    displayName: 'Diamond Hands Reserve',
    category: 'degen_district',
    description: 'Large park',
    lore: 'For those who hold through winter. Evergreen trees because paper hands don\'t last.',
    icon: '🌲'
  },
  tennis: {
    displayName: 'Volatility Courts',
    category: 'degen_district',
    description: 'Tennis facility',
    lore: 'Ball goes up, ball comes down. Sometimes in the same rally.',
    icon: '🎾'
  },
  basketball_courts: {
    displayName: 'Pump Courts',
    category: 'degen_district',
    description: 'Basketball facility',
    lore: 'Slam dunks and dramatic reversals. Just like your portfolio.',
    icon: '🏀'
  },
  playground_small: {
    displayName: 'Testnet Playground',
    category: 'degen_district',
    description: 'Small playground',
    lore: 'Where little degens practice their first swaps with play money.',
    icon: '🎢'
  },
  playground_large: {
    displayName: 'Mainnet Playground',
    category: 'degen_district',
    description: 'Large playground',
    lore: 'The stakes are real now. Watch your step.',
    icon: '🎡'
  },
  swimming_pool: {
    displayName: 'Liquidity Pool',
    category: 'degen_district',
    description: 'Swimming facility',
    lore: 'Dive in! Pool depth varies based on market conditions. Check before jumping.',
    icon: '🏊'
  },
  skate_park: {
    displayName: 'Leverage Ramps',
    category: 'degen_district',
    description: 'Skateboard park',
    lore: 'Higher ramps, bigger tricks, harder falls. 100x tricks available.',
    icon: '🛹'
  },

  // Sports Fields
  baseball_field_small: {
    displayName: 'Short Squeeze Diamond',
    category: 'degen_district',
    description: 'Baseball field',
    lore: 'Three strikes and you\'re liquidated. Home runs are rare but spectacular.',
    icon: '⚾'
  },
  soccer_field_small: {
    displayName: 'Arbitrage Arena',
    category: 'degen_district',
    description: 'Soccer field',
    lore: 'Goal is to move the ball between markets faster than anyone else.',
    icon: '⚽'
  },
  football_field: {
    displayName: 'Touchdown Trading Grounds',
    category: 'degen_district',
    description: 'Football field',
    lore: 'Four quarters, four market cycles. Halftime analysis included.',
    icon: '🏈'
  },
  baseball_stadium: {
    displayName: 'Moon League Stadium',
    category: 'degen_district',
    description: 'Major sports venue',
    lore: 'Home of the Crypto City Moons. Seventh inning stretch replaced with portfolio check.',
    icon: '🏟️'
  },

  // Landmarks
  stadium: {
    displayName: 'Bull Bear Arena',
    category: 'landmarks',
    description: 'Major sports venue',
    lore: 'Where Bulls and Bears compete eternally. Score changes every 4 hours.',
    icon: '🏟️'
  },
  museum: {
    displayName: 'Block Archive',
    category: 'landmarks',
    description: 'Cultural institution',
    lore: 'Crypto history artifacts. Terra exhibit in basement. Don\'t ask about "Fallen Protocols" wing.',
    icon: '🏛️'
  },
  airport: {
    displayName: 'Crosschain Hub',
    category: 'landmarks',
    description: 'International transit',
    lore: 'Travel to other chains. Customs may take 7-30 days. Assets may arrive different.',
    icon: '✈️'
  },
  space_program: {
    displayName: 'Moonshot Launchpad',
    category: 'landmarks',
    description: 'Space facility',
    lore: 'We\'re going to the moon. Always have been. Always will be. Not financial advice.',
    icon: '🚀'
  },
  city_hall: {
    displayName: 'Governance Forum',
    category: 'landmarks',
    description: 'City government',
    lore: 'Proposals proposed, debated, amended, re-debated, temperature-checked. Quorum rarely achieved.',
    icon: '🏛️'
  },
  amusement_park: {
    displayName: 'Volatility Park',
    category: 'landmarks',
    description: 'Theme park',
    lore: 'Rides go up. Rides go down. Sometimes simultaneously. Must be this liquidated to ride.',
    icon: '🎢'
  },

  // Additional facilities
  community_center: {
    displayName: 'Discord HQ',
    category: 'civic_quarter',
    description: 'Community facility',
    lore: 'Where communities gather to argue about tokenomics and post memes.',
    icon: '🏘️'
  },
  office_building_small: {
    displayName: 'Startup Garage',
    category: 'trading_district',
    description: 'Small office',
    lore: 'Every billion-dollar protocol started in a garage. Or a Discord. Same thing.',
    icon: '🏢'
  },
  mini_golf_course: {
    displayName: 'Par-T Golf',
    category: 'degen_district',
    description: 'Mini golf',
    lore: 'Eighteen holes of gradually increasing difficulty. Just like DeFi.',
    icon: '⛳'
  },
  bleachers_field: {
    displayName: 'Spectator Seats',
    category: 'degen_district',
    description: 'Viewing area',
    lore: 'Sometimes the best move is to watch others play.',
    icon: '🎪'
  },
  go_kart_track: {
    displayName: 'Speed Run Track',
    category: 'degen_district',
    description: 'Go-kart racing',
    lore: 'Fast and chaotic. Just like market open.',
    icon: '🏎️'
  },
  amphitheater: {
    displayName: 'Town Hall Stage',
    category: 'civic_quarter',
    description: 'Performance venue',
    lore: 'Where founders give updates to the community. Questions limited to two per person.',
    icon: '🎭'
  },
  greenhouse_garden: {
    displayName: 'Yield Greenhouse',
    category: 'mining_flats',
    description: 'Greenhouse',
    lore: 'Organic yield farming. Results may vary by season and market conditions.',
    icon: '🌿'
  },
  animal_pens_farm: {
    displayName: 'Bull Pen',
    category: 'mining_flats',
    description: 'Animal facility',
    lore: 'Where bulls rest between market cycles. Bears stay in the woods.',
    icon: '🐂'
  },
  cabin_house: {
    displayName: 'Cold Storage Cabin',
    category: 'staking_suburbs',
    description: 'Rural housing',
    lore: 'Off-grid living for the truly decentralized. Seed phrase buried in yard.',
    icon: '🏚️'
  },
  campground: {
    displayName: 'Diamond Hands Camp',
    category: 'degen_district',
    description: 'Camping area',
    lore: 'For those holding through the harshest conditions. Tents rated for -80% drawdowns.',
    icon: '⛺'
  },
  marina_docks_small: {
    displayName: 'Yacht Preview Dock',
    category: 'landmarks',
    description: 'Boat dock',
    lore: 'Window shopping for the yacht you\'ll buy when your bags pump.',
    icon: '⛵'
  },
  pier_large: {
    displayName: 'Boating Accident Pier',
    category: 'landmarks',
    description: 'Large pier',
    lore: 'A popular spot for unfortunate hardware wallet incidents. Very convenient.',
    icon: '🚢'
  },
  roller_coaster_small: {
    displayName: 'Portfolio Coaster',
    category: 'degen_district',
    description: 'Roller coaster',
    lore: 'Experience your portfolio in physical form. Loops, drops, and unexpected stops.',
    icon: '🎢'
  },
  community_garden: {
    displayName: 'Seed Garden',
    category: 'degen_district',
    description: 'Community garden',
    lore: 'Where the community plants seeds (phrases) and watches them grow.',
    icon: '🌻'
  },
  pond_park: {
    displayName: 'Reflection Pool',
    category: 'degen_district',
    description: 'Pond',
    lore: 'A quiet place to reflect on trades past and opportunities missed.',
    icon: '🏞️'
  },
  park_gate: {
    displayName: 'Genesis Gate',
    category: 'landmarks',
    description: 'Park entrance',
    lore: 'Through this gate lies the genesis of your journey.',
    icon: '⛩️'
  },
  mountain_lodge: {
    displayName: 'ATH Lodge',
    category: 'landmarks',
    description: 'Mountain retreat',
    lore: 'The view from All-Time High is spectacular. Getting here is the hard part.',
    icon: '🏔️'
  },
  mountain_trailhead: {
    displayName: 'The Starting Trail',
    category: 'landmarks',
    description: 'Hiking trail',
    lore: 'Every journey to the top starts with a single buy order.',
    icon: '🥾'
  },

  // Crypto building placeholder (handled separately)
  crypto_building: {
    displayName: 'Crypto Building',
    category: 'landmarks',
    description: 'Crypto-specific building',
    lore: 'A building from the crypto district.',
    icon: '🏗️'
  },
};
```

### Phase 2: UI Integration

Update all UI components that display building names:

```typescript
// Helper function to get display name
export function getBuildingDisplayName(type: BuildingType): string {
  return BUILDING_DISPLAY_INFO[type]?.displayName || type.replace(/_/g, ' ');
}

export function getBuildingDescription(type: BuildingType): string {
  return BUILDING_DISPLAY_INFO[type]?.description || '';
}

export function getBuildingLore(type: BuildingType): string {
  return BUILDING_DISPLAY_INFO[type]?.lore || '';
}
```

### Phase 3: UI Components to Update

1. **BuildingPanel.tsx** - Building selection menu
2. **BuildingTooltip.tsx** - Hover tooltips
3. **StatisticsPanel.tsx** - City statistics
4. **NewsTicker.tsx** - News headlines
5. **AdvisorPanel.tsx** - Advisor messages
6. **Codex/Encyclopedia** - Full building info (new component)

### Phase 4: Building Codex (New Feature)

A "Hitchhiker's Guide" style encyclopedia accessible from the UI:

```typescript
interface CodexEntry {
  id: BuildingType;
  displayName: string;
  category: BuildingCategory;
  shortDescription: string;
  lore: string;
  stats: {
    maxPop: number;
    maxJobs: number;
    pollution: number;
    landValue: number;
  };
  unlockCondition?: string;
  tips?: string[];
}
```

---

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/games/isocity/types/buildingDisplayNames.ts` | NEW | Display name mapping |
| `src/games/isocity/types/index.ts` | MODIFY | Export new types |
| `src/components/buildings/BuildingPanel.tsx` | MODIFY | Use display names |
| `src/components/ui/BuildingTooltip.tsx` | MODIFY | Show lore on hover |
| `src/components/ui/StatisticsPanel.tsx` | MODIFY | Use display names |
| `src/components/ui/NewsTicker.tsx` | MODIFY | Crypto-themed headlines |
| `src/components/ui/Codex.tsx` | NEW | Building encyclopedia |
| `src/lib/i18n/en.json` | MODIFY | Add display name translations |

---

## Migration Strategy

Since we're using display names (not changing internal IDs), **no save migration is needed**. Existing saves will continue to work, and buildings will simply display with new names.

---

## Testing Checklist

- [ ] All building types have display names
- [ ] Tooltips show correct names and lore
- [ ] Building panel categories match new scheme
- [ ] News ticker uses crypto terminology
- [ ] Statistics use display names
- [ ] No regressions in save/load
- [ ] Codex displays all buildings correctly
- [ ] i18n fallbacks work

---

## Future Enhancements

1. **Localization** - Translate display names to other languages
2. **Dynamic Lore** - Lore that changes based on game state
3. **Building History** - Track building achievements/milestones
4. **NPC Quotes** - Random NPC comments about buildings
5. **Seasonal Variants** - Different descriptions in bull/bear markets
