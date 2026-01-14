# NPC Avatar System Specification

> Turn your X profile into a living pixel citizen of Crypto City

## Overview

This system transforms X/Twitter profile pictures into pixel art NPC sprites that walk around the city. When you "ingest" your X profile, you become a permanent resident of Crypto City - complete with custom sprite, personality-driven dialogue, and trackable life.

## Current State

### NPC Sprite System
- **Sprite Types**: Currently only 2 generic types (`apple`, `banana`)
- **Location**: `/public/Characters/{type}walk{direction}.gif`
- **Format**: Animated GIF sprites for each direction (north, south, east, west)
- **Rendering**: `drawPedestrians.ts` renders generic colored circles at zoomed-out view

### X Profile Ingestion
- **Pipeline**: `IngestionPipeline.ts` fetches profile, extracts personality, spawns NPC
- **Avatar Queue**: `avatarQueue.ts` has stub for avatar generation (not implemented)
- **Storage**: NPCs store `ingestedProfile.avatarSpritesheet` but it's not used

### Gap Analysis
1. **No custom avatars** - All NPCs use generic apple/banana sprites
2. **No pixel art generation** - Avatar queue is a placeholder
3. **No persistent tracking** - Ingested NPCs disappear on reload
4. **No visual differentiation** - Can't distinguish your NPC from others

## Proposed System

### 1. Avatar Generation Pipeline

```
X Profile Image → Nano Banana (Gemini 2.5 Flash) → Pixel Art Spritesheet
     ↓                       ↓                           ↓
  Square PFP         "Pixelate this profile picture    4-direction
  (400x400)           into isometric sprite"          walking sprites
```

### 2. Sprite Generation Prompt

```typescript
const AVATAR_GENERATION_PROMPT = `
Convert this profile picture into a pixel art character sprite for an isometric city builder game.

STYLE:
- 16-bit pixel art, 32x48 pixels per frame
- Isometric view (south-facing for main sprite)
- Limited color palette (extract dominant colors from image)
- Walking animation frames (4 frames per direction)

OUTPUT:
- Single spritesheet PNG (128x192)
- 4 columns (walk animation frames)
- 4 rows (south, north, east, west directions)
- TRANSPARENT background

IMPORTANT:
- Preserve recognizable features from the profile picture
- Pixelate face, hair, clothing distinctively
- Make the character look like the original person/avatar
- Crypto/tech aesthetic (headphones, hoodies, sunglasses OK)
`;
```

### 3. Data Model Updates

```typescript
// In games/isocity/types/npc.ts
export type NPCSpriteType = 'apple' | 'banana' | 'custom';

export interface IngestedNPCProfile {
  profileId: string;
  xUsername: string;           // Twitter handle
  displayName: string;
  profileImageUrl: string;     // Original PFP URL
  avatarSpritesheet?: string;  // Generated pixel sprite path
  avatarStatus: 'pending' | 'generating' | 'ready' | 'failed';
  dialogueSeeds: string[];
  createdAt: number;
}

export interface CryptoNPC {
  // ... existing fields
  spriteType: NPCSpriteType;
  
  // New fields for ingested users
  isIngestedUser?: boolean;
  ingestedProfile?: IngestedNPCProfile;
  
  // Custom sprite rendering
  customSpritesheet?: HTMLImageElement;  // Loaded sprite
  customSpriteStatus?: 'loading' | 'ready' | 'error';
}
```

### 4. Avatar Generation Service

```typescript
// New file: src/lib/ingestion/AvatarGenerator.ts

export interface AvatarGenerationOptions {
  profileImageUrl: string;
  username: string;
  dominantColors?: string[];  // Extracted from PFP
}

export interface AvatarGenerationResult {
  success: boolean;
  spritesheetPath?: string;
  spritesheetBlob?: Blob;
  error?: string;
}

export async function generatePixelAvatar(
  options: AvatarGenerationOptions
): Promise<AvatarGenerationResult> {
  // 1. Download profile image
  // 2. Extract dominant colors
  // 3. Send to Nano Banana with prompt
  // 4. Save spritesheet to IndexedDB/localStorage
  // 5. Return path/blob for rendering
}
```

### 5. Rendering Changes

```typescript
// In drawPedestrians.ts

function drawPedestrian(ctx, ped, zoom) {
  if (ped.isIngestedUser && ped.customSpritesheet) {
    // Draw custom pixel sprite
    drawCustomSprite(ctx, ped);
  } else {
    // Fall back to generic colored circle/shape
    drawGenericPedestrian(ctx, ped);
  }
}

function drawCustomSprite(ctx, ped) {
  const sprite = ped.customSpritesheet;
  const frameWidth = 32;
  const frameHeight = 48;
  
  // Get animation frame based on direction and walk cycle
  const directionRow = DIRECTION_TO_ROW[ped.direction]; // 0-3
  const frameCol = Math.floor(ped.walkCycle * 4) % 4;   // 0-3
  
  // Draw sprite frame
  ctx.drawImage(
    sprite,
    frameCol * frameWidth,       // source X
    directionRow * frameHeight,  // source Y
    frameWidth, frameHeight,     // source size
    -frameWidth/2, -frameHeight, // dest offset (centered)
    frameWidth * zoom, frameHeight * zoom
  );
}
```

### 6. Persistence System

```typescript
// New file: src/lib/npc/IngestedNPCPersistence.ts

interface StoredIngestedNPC {
  id: string;
  xUsername: string;
  displayName: string;
  profileImageUrl: string;
  spritesheetBlob: string;  // Base64 encoded
  personality: NPCPersonality;
  occupation: Occupation;
  dialogueSeeds: string[];
  createdAt: number;
  lastSeen: number;
}

// Store in IndexedDB for large sprite data
export const IngestedNPCStore = {
  async save(npc: CryptoNPC): Promise<void>,
  async load(xUsername: string): Promise<StoredIngestedNPC | null>,
  async loadAll(): Promise<StoredIngestedNPC[]>,
  async delete(xUsername: string): Promise<void>,
};
```

### 7. UI Enhancements

#### NPC Inspector Panel Updates
- Show "Your Character" badge for ingested NPCs
- Display original profile picture alongside pixel avatar
- Track NPC location on minimap
- View NPC activity history and thoughts

#### Find My Character Feature
```typescript
// In Sidebar or dedicated panel
<Button onClick={() => focusOnIngestedNPC(username)}>
  Find My Character
</Button>
```

### 8. Implementation Phases

#### Phase 1: Foundation (1-2 hours)
- [ ] Update NPC types with new fields
- [ ] Create IndexedDB persistence layer
- [ ] Load persisted NPCs on game start

#### Phase 2: Avatar Generation (2-3 hours)
- [ ] Create AvatarGenerator service
- [ ] Integrate Nano Banana API for sprite generation
- [ ] Handle generation queue and errors

#### Phase 3: Rendering (1-2 hours)
- [ ] Update drawPedestrians to render custom sprites
- [ ] Add visual distinction for ingested NPCs (glow, badge)
- [ ] Handle sprite loading states

#### Phase 4: Tracking & UI (1-2 hours)
- [ ] Add "Find My Character" feature
- [ ] Update NPC Inspector for ingested NPCs
- [ ] Show ingested NPCs in a dedicated panel

## API Requirements

### Nano Banana (Gemini 2.5 Flash Image)
- **Endpoint**: Google Generative AI API
- **Model**: `gemini-2.5-flash-preview`
- **Input**: Profile image + generation prompt
- **Output**: PNG spritesheet (128x192)
- **Cost**: ~$0.01 per generation

### Storage
- **IndexedDB**: Store sprite blobs (100KB-500KB per NPC)
- **localStorage**: Store NPC metadata (1KB per NPC)
- **Limit**: Cap at 100 ingested NPCs per save

## Success Criteria

1. **Visual**: Ingested NPCs look distinct and recognizable
2. **Performance**: No FPS drop with 50+ custom sprites on screen
3. **Persistence**: NPCs survive page reload and game restart
4. **UX**: User can find their NPC within 3 clicks
5. **Quality**: Generated sprites match game's pixel art style

## Future Enhancements

- **Sprite Editor**: Let users tweak generated sprites
- **Animation Styles**: Running, dancing, special actions
- **Outfit System**: Change clothes based on occupation
- **Voice Lines**: Text-to-speech for NPC dialogue
- **NFT Export**: Mint your character as an NFT
