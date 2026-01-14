# Company & Building Ingestion System

> "The Guide says: 'In Crypto City, any company with a Twitter account is just a building permit away from becoming a permanent fixture in your digital metropolis. The reverse is also true - buildings are just companies that forgot to get a social media manager.'"

## Overview

Extends the existing X Profile Ingestion system to support **companies and projects**, creating both:
1. **Company Representative NPC** - An NPC that represents the company
2. **Custom Building** - An AI-generated isometric building sprite based on brand identity

This system shares infrastructure with NPC ingestion (deduplication, IndexedDB persistence, avatar generation) but adds building sprite generation and the crypto building registry.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    INGESTION ENTRY POINTS                        │
├─────────────────────────────────────────────────────────────────┤
│  X Profile Modal                                                 │
│  ├── 👤 Individual → NPC Only (existing flow)                   │
│  └── 🏢 Company → NPC + Building (new flow)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEDUPLICATION CHECK                           │
│  IngestedEntityStore.hasBeenIngested(username, type)            │
│  ├── Found → Return existing entity (NPC, Building, or both)    │
│  └── Not Found → Continue to ingestion pipeline                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    X PROFILE FETCH                               │
│  Fetch profile using existing XProfileAdapter                    │
│  Detect entity type from profile (individual vs company)        │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐        ┌──────────────────────────────────┐
│   INDIVIDUAL PATH    │        │       COMPANY/PROJECT PATH       │
│   (Existing Flow)    │        │                                  │
│                      │        │  1. Generate Representative NPC  │
│  • Generate NPC      │        │  2. Generate Building Sprite     │
│  • Avatar sprite     │        │  3. Create CryptoBuildingDef     │
│  • Persist to DB     │        │  4. Persist Both to DB           │
└──────────────────────┘        └──────────────────────────────────┘
```

---

## Entity Type Detection

Determine if an X profile represents an individual or company:

```typescript
interface EntityTypeSignals {
  // Profile signals
  isVerifiedOrganization: boolean;   // Blue checkmark org verification
  hasWebsiteInBio: boolean;          // Links to company domain
  bioContainsCompanyKeywords: boolean; // "protocol", "exchange", "foundation", etc.
  usernameMatchesKnownProtocol: boolean; // In KNOWN_PROTOCOLS list
  
  // Engagement signals
  followerCount: number;             // >100k suggests org
  followingRatio: number;            // Orgs follow fewer accounts
  
  // Content signals
  tweetsAboutProduct: boolean;       // "launched", "update", "v2", etc.
  hasOfficialAnnouncements: boolean; // Announcement-style tweets
}

type EntityType = 'individual' | 'company' | 'protocol' | 'unknown';
```

### Known Protocol List
Pre-populate with major crypto projects for instant recognition:
```typescript
const KNOWN_PROTOCOLS = [
  'uniswap', 'aaborswap', 'chainlink', 'aave', 'compound', 
  'makerdao', 'lido', 'eigenlayer', 'celestiaorg', 'penloio',
  'arbitrum', 'optimismFND', 'base', 'zaborow', 'scroll_zkevm',
  // ... 100+ known crypto projects
];
```

---

## Company Representative NPC

When ingesting a company, create a representative NPC:

```typescript
interface CompanyRepresentativeNPC extends CryptoNPC {
  // Standard NPC fields
  isIngestedUser: true;
  xUsername: string;
  
  // Company-specific fields
  isCompanyRepresentative: true;
  representedCompany: string;        // Company name
  representedBuildingId?: string;    // Link to generated building
  
  // Occupation is always company-related
  occupation: 'community_manager' | 'developer_advocate' | 'founder' | 'marketer';
  
  // Dialogue seeds reference the company
  dialogueSeeds: string[];  // e.g., "Have you tried our new V3 pools?"
}
```

### Representative Appearance
- **Avatar**: Use company logo/pfp to generate pixel art mascot
- **Outfit**: Brand colors integrated into clothing
- **Label**: `@username` + company icon

---

## Building Generation

### Building Definition Structure
Generated buildings follow the existing `CryptoBuildingDefinition` format:

```typescript
interface IngestedBuildingDefinition extends CryptoBuildingDefinition {
  // Standard fields
  id: string;              // e.g., 'ingested_acme_protocol'
  name: string;            // e.g., 'Acme Protocol HQ'
  category: 'ingested';    // New category for user-generated buildings
  footprint: { width: 2 | 3; height: 2 | 3 };
  icon: string;            // Extracted from profile or generated
  isProcedural: false;     // Always use generated sprites
  sprites: { south: string };
  cost: number;            // Based on follower count/TVL
  
  // Crypto metadata
  crypto: {
    tier: CryptoTier;      // Based on follower count/TVL
    protocol: string;      // Company/protocol name
    chain: CryptoChain;    // Detected from bio or 'ethereum' default
    description: string;   // Generated from bio
    effects: CryptoEffects;
  };
  
  // Ingestion metadata
  ingested: {
    sourceUsername: string;
    sourceProfileId: string;
    ingestedAt: number;
    lastUpdatedAt: number;
  };
}
```

### Building Sprite Generation
Use the same Gemini 2.5 Flash (Nano Banana) API as existing building sprites:

```typescript
async function generateBuildingSprite(
  profile: XProfile,
  options: BuildingSpriteOptions
): Promise<string> {
  const prompt = buildBuildingPrompt({
    companyName: profile.displayName,
    logoUrl: profile.profileImageUrl,
    brandColors: extractBrandColors(profile),
    category: detectCategory(profile),
    footprint: determineFootprint(profile),
    style: getCategoryStyle(options.category),
  });
  
  // Call Gemini API (same as scripts/generateSpritesNanoBanana.ts)
  const result = await generateWithGemini(prompt, {
    referenceImage: profile.profileImageUrl,
    outputSize: calculateSpriteSize(options.footprint),
  });
  
  return result.base64Image;
}
```

### Building Prompt Template
```text
Generate an isometric pixel art building sprite for "{{companyName}}" headquarters.

SPECIFICATIONS:
- Size: {{width * 64}}x{{height * 80}} pixels ({{footprint}})
- Style: Isometric pixel art, 16-bit SimCity aesthetic
- Background: FULLY TRANSPARENT
- Direction: South-facing (toward viewer)

BRAND INTEGRATION:
- Company: {{companyName}}
- Brand Colors: {{brandColors}}
- Logo reference provided - incorporate recognizable elements
- Category: {{category}} ({{categoryStyle}})

ARCHITECTURAL STYLE:
{{categoryDescription}}

The building should be instantly recognizable as belonging to {{companyName}}.
Incorporate the logo subtly into architecture (signage, roof design, etc.).
```

### Footprint Determination
Based on company size/influence:

| Tier | Follower Range | TVL Range | Footprint |
|------|---------------|-----------|-----------|
| retail | <10k | <$1M | 1x1 |
| degen | 10k-100k | $1M-$10M | 2x2 |
| whale | 100k-1M | $10M-$100M | 2x3 or 3x2 |
| institution | >1M | >$100M | 3x3 |

---

## Deduplication System

### Unified Entity Store
Extend IndexedDB schema to handle both NPCs and buildings:

```typescript
interface IngestedEntityDBSchema extends DBSchema {
  'ingested-npcs': {
    key: string;  // profileId
    value: PersistedIngestedNPC;
    indexes: { 'by-username': string };
  };
  'ingested-buildings': {
    key: string;  // buildingId (e.g., 'ingested_uniswap')
    value: PersistedIngestedBuilding;
    indexes: { 'by-username': string; 'by-profile-id': string };
  };
  'ingestion-registry': {
    key: string;  // username (lowercase)
    value: IngestionRecord;
  };
}

interface IngestionRecord {
  username: string;
  profileId: string;
  entityType: 'individual' | 'company';
  npcId?: string;
  buildingId?: string;
  ingestedAt: number;
  lastCheckedAt: number;
}
```

### Deduplication Flow
```typescript
async function checkDuplication(username: string): Promise<DuplicationResult> {
  const record = await IngestedEntityStore.getRecord(username.toLowerCase());
  
  if (!record) {
    return { isDuplicate: false };
  }
  
  return {
    isDuplicate: true,
    existingRecord: record,
    npc: record.npcId ? await IngestedNPCStore.get(record.npcId) : undefined,
    building: record.buildingId ? await IngestedBuildingStore.get(record.buildingId) : undefined,
  };
}
```

### Update vs Skip Options
When duplicate found, offer user choices:
1. **Skip** - Use existing entity as-is
2. **Update** - Re-fetch profile, regenerate avatar/sprite if changed
3. **Force Regenerate** - Regenerate everything regardless of changes

---

## Persisted Building Store

```typescript
interface PersistedIngestedBuilding {
  // Identification
  buildingId: string;           // 'ingested_{{username}}'
  profileId: string;            // X profile ID
  username: string;             // X username
  
  // Building data
  name: string;                 // Display name
  category: 'ingested';
  footprint: { width: number; height: number };
  tier: CryptoTier;
  chain: CryptoChain;
  
  // Sprite data (base64 PNG)
  spriteBase64: string;
  spriteBlobUrl?: string;       // Cached blob URL for rendering
  
  // Effects (calculated from profile)
  effects: CryptoEffects;
  
  // Timestamps
  ingestedAt: number;
  lastUpdatedAt: number;
  
  // Placement info
  isPlaced: boolean;
  placedAt?: { x: number; y: number };
}
```

---

## UI Updates

### X Profile Ingestion Modal
Add entity type selector:

```tsx
<Dialog>
  <DialogHeader>
    <DialogTitle>Ingest X Profile</DialogTitle>
  </DialogHeader>
  
  <DialogContent>
    {/* Existing username input */}
    <Input placeholder="username" value={username} />
    
    {/* NEW: Entity type selector */}
    <RadioGroup value={entityType} onValueChange={setEntityType}>
      <RadioGroupItem value="auto" label="Auto-detect" />
      <RadioGroupItem value="individual" label="👤 Individual (NPC only)" />
      <RadioGroupItem value="company" label="🏢 Company (NPC + Building)" />
    </RadioGroup>
    
    {/* Preview section */}
    {preview && (
      <PreviewCard>
        <Avatar src={preview.profileImageUrl} />
        <div>
          <h3>{preview.displayName}</h3>
          <p>Type: {preview.detectedType}</p>
          {preview.detectedType === 'company' && (
            <>
              <p>Building Tier: {preview.tier}</p>
              <p>Footprint: {preview.footprint.width}x{preview.footprint.height}</p>
            </>
          )}
        </div>
      </PreviewCard>
    )}
    
    {/* Duplication warning */}
    {duplicationCheck?.isDuplicate && (
      <Alert variant="warning">
        <p>@{username} has already been ingested.</p>
        <RadioGroup value={dupeAction}>
          <RadioGroupItem value="skip" label="Use existing" />
          <RadioGroupItem value="update" label="Update if changed" />
          <RadioGroupItem value="regenerate" label="Force regenerate" />
        </RadioGroup>
      </Alert>
    )}
  </DialogContent>
  
  <DialogFooter>
    <Button onClick={handleIngest}>
      {entityType === 'company' ? 'Create NPC + Building' : 'Create NPC'}
    </Button>
  </DialogFooter>
</Dialog>
```

### Find My Character Panel
Extend to show buildings:

```tsx
<Tabs defaultValue="npcs">
  <TabsList>
    <TabsTrigger value="npcs">NPCs ({npcCount})</TabsTrigger>
    <TabsTrigger value="buildings">Buildings ({buildingCount})</TabsTrigger>
  </TabsList>
  
  <TabsContent value="npcs">
    {/* Existing NPC list */}
  </TabsContent>
  
  <TabsContent value="buildings">
    <BuildingList>
      {buildings.map(building => (
        <BuildingCard key={building.buildingId}>
          <img src={building.spriteBlobUrl} />
          <div>
            <h4>{building.name}</h4>
            <p>@{building.username} • {building.tier}</p>
            {building.isPlaced ? (
              <Button onClick={() => goToBuilding(building)}>
                📍 View in City
              </Button>
            ) : (
              <Button onClick={() => placeBuilding(building)}>
                🏗️ Place Building
              </Button>
            )}
          </div>
        </BuildingCard>
      ))}
    </BuildingList>
  </TabsContent>
</Tabs>
```

### Crypto Building Panel
Add "Ingested" category section:

```tsx
// In CryptoBuildingPanel.tsx
const categories = [
  // ... existing categories
  { id: 'ingested', name: 'Custom', icon: '✨' },
];

// Filter to show ingested buildings
const ingestedBuildings = useIngestedBuildings();
```

---

## Integration with Game Systems

### Building Registry Integration
Dynamically register ingested buildings:

```typescript
// In buildingRegistry.ts or new ingestedBuildingRegistry.ts
class IngestedBuildingRegistry {
  private buildings: Map<string, IngestedBuildingDefinition> = new Map();
  
  async loadFromIndexedDB(): Promise<void> {
    const persisted = await IngestedBuildingStore.getAll();
    for (const building of persisted) {
      this.register(this.toDefinition(building));
    }
  }
  
  register(building: IngestedBuildingDefinition): void {
    this.buildings.set(building.id, building);
    // Notify game context of new building availability
    gameContext.dispatch({ type: 'REGISTER_BUILDING', building });
  }
  
  getAll(): IngestedBuildingDefinition[] {
    return Array.from(this.buildings.values());
  }
}

export const ingestedBuildingRegistry = new IngestedBuildingRegistry();
```

### Sprite Loading
Load sprites from IndexedDB on game start:

```typescript
// In CanvasIsometricGrid.tsx or dedicated loader
async function loadIngestedBuildingSprites(): Promise<Map<string, HTMLImageElement>> {
  const sprites = new Map();
  const buildings = await IngestedBuildingStore.getAll();
  
  for (const building of buildings) {
    if (building.spriteBase64) {
      const img = await loadImageFromBase64(building.spriteBase64);
      sprites.set(building.buildingId, img);
    }
  }
  
  return sprites;
}
```

### Economy Integration
Ingested buildings participate in the crypto economy:

```typescript
// Effects are calculated based on profile metrics
function calculateBuildingEffects(profile: XProfile, tier: CryptoTier): CryptoEffects {
  const baseYield = TIER_BASE_YIELDS[tier];
  const followerBonus = Math.log10(profile.followerCount) * 2;
  
  return {
    yieldRate: baseYield + followerBonus,
    volatility: 0.15,
    rugRisk: 0.005, // Low risk for established protocols
    populationBoost: 20 * CRYPTO_TIER_MULTIPLIERS[tier],
    happinessEffect: 5,
    zoneRadius: 4 + tier === 'institution' ? 2 : 0,
    chainSynergy: [detectChain(profile)],
    categorySynergy: ['ingested'],
  };
}
```

---

## File Structure

```
src/lib/ingestion/
├── IngestionPipeline.ts          # Extended with company flow
├── CompanyIngestionPipeline.ts   # NEW: Company-specific logic
├── EntityTypeDetector.ts         # NEW: Individual vs company detection
├── BuildingGenerator.ts          # NEW: Building sprite + definition generation
├── IngestedBuildingStore.ts      # NEW: IndexedDB for buildings
├── IngestedEntityStore.ts        # NEW: Unified deduplication registry
├── IngestedNPCStore.ts           # Existing (minor updates)
├── AvatarGenerator.ts            # Existing (reused for company logos)
└── XProfileAdapter.ts            # Existing (no changes)

src/components/game/panels/
├── XIngestionPanel.tsx           # Updated with entity type selector
├── FindMyCharacterPanel.tsx      # Updated with buildings tab
└── IngestedBuildingsTab.tsx      # NEW: Building list component

src/games/isocity/crypto/
├── IngestedBuildingRegistry.ts   # NEW: Runtime registry for ingested buildings
└── buildings.ts                  # No changes (static buildings)
```

---

## Implementation Order

1. **Phase 1: Deduplication** (2-3 hours)
   - Create `IngestedEntityStore.ts` with registry
   - Add deduplication check to existing NPC flow
   - Update UI with duplicate warning

2. **Phase 2: Entity Detection** (2-3 hours)
   - Create `EntityTypeDetector.ts`
   - Add KNOWN_PROTOCOLS list
   - Integrate into preview flow

3. **Phase 3: Building Generation** (4-5 hours)
   - Create `BuildingGenerator.ts` (adapt from scripts/generateSpritesNanoBanana.ts)
   - Create `IngestedBuildingStore.ts`
   - Generate building definitions with effects

4. **Phase 4: Building Registry** (2-3 hours)
   - Create `IngestedBuildingRegistry.ts`
   - Integrate with game context
   - Load sprites on game start

5. **Phase 5: UI Updates** (3-4 hours)
   - Update X Ingestion Panel
   - Update Find My Character Panel
   - Add ingested buildings to Crypto Building Panel

6. **Phase 6: Company NPC** (2 hours)
   - Create company representative NPC variant
   - Link NPC to building

---

## API/Integration Notes

### Gemini API (Nano Banana)
Same API used for existing building sprites:
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`
- Key: `NEXT_PUBLIC_GEMINI_API_KEY` or `GEMINI_API_KEY`
- Rate limit: ~15 requests/minute

### IndexedDB Stores
- `crypto-city-ingested-npcs` - Existing store
- `crypto-city-ingested-buildings` - New store
- `crypto-city-ingestion-registry` - New deduplication registry

### Storage Estimates
- NPC record: ~10-50KB (with avatar spritesheet)
- Building record: ~50-200KB (larger sprite)
- Registry record: ~1KB
- Realistic limit: ~100-200 ingested entities before localStorage concerns

---

## Open Questions

1. **Should ingested buildings appear in the standard building menu or separate section?**
   - Recommendation: Separate "Custom" category to avoid confusion

2. **Should users be able to delete ingested entities?**
   - Recommendation: Yes, with confirmation dialog

3. **Should we sync ingested entities to cloud for cross-device persistence?**
   - Recommendation: Future enhancement, start with local-only

4. **Rate limiting for building generation (more expensive than NPC)?**
   - Recommendation: Max 5 building generations per hour, separate from NPC limit
