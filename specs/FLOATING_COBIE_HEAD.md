# Floating Cobie Talking Head - Technical Specification

> "Your conscience is a $10M shitcoin portfolio watching you make decisions." - Cobie, probably

## Overview

A floating, animated pixel-art talking head inspired by Black & White's spiritual advisors (Blackey/Whitey). Unlike the current toast-based narrator, this is a persistent, context-aware companion that floats in the corner of the screen, reacts to player actions in real-time, and speaks with animated lip-sync.

## Reference: Black & White Spiritual Advisors

In Lionhead's Black & White (2001):
- **Blackey** (evil) and **Whitey** (good) are floating talking heads
- Serve as player's conscience, providing guidance and feedback
- React dynamically to player actions and moral choices
- Attempt to influence player decisions
- Always present, contextually aware of game state
- Provide sardonic/helpful commentary based on alignment

**For Crypto City:** Cobie serves as the single "crypto Twitter conscience" - sardonic, probabilistic, occasionally helpful, always watching.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: CONTEXT AWARENESS (CobieContextProvider)                      │
│  Tracks: cursor position, hovered tile, selected tool, game events      │
│  Files: CobieContextProvider.tsx, useCobieContext.ts                    │
└─────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: AI BRAIN (CobieBrain.ts)                                      │
│  Decides: when to speak, what to say, what expression to show           │
│  Uses: existing useCobieNarrator dialogue + new contextual triggers     │
└─────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: VISUAL RENDERER (FloatingCobieHead.tsx)                       │
│  Renders: pixel art head with expressions, lip-sync, idle animations    │
│  Uses: Canvas-based sprite animation with expression layers             │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. CobieContextProvider (`src/context/CobieContext.tsx`)

Provides real-time context awareness:

```typescript
interface CobieContext {
  // Cursor/interaction context
  hoveredTile: { x: number; y: number } | null;
  hoveredBuilding: CryptoBuilding | null;
  selectedTool: Tool;
  
  // Game state context
  treasury: number;
  treasuryTrend: 'up' | 'down' | 'stable';
  marketSentiment: number;
  recentEvents: CryptoEvent[];
  
  // Player behavior context
  idleTime: number; // Seconds since last action
  lastAction: PlayerAction | null;
  actionStreak: PlayerAction[]; // Last 10 actions
  
  // Time context
  gameSpeed: number;
  currentHour: number;
}
```

### 2. CobieBrain (`src/lib/cobie/CobieBrain.ts`)

AI decision engine:

```typescript
interface CobieBrainState {
  // Current state
  currentMood: CobieMood;
  currentExpression: CobieExpression;
  isSpeaking: boolean;
  currentDialogue: string | null;
  
  // Speaking queue
  dialogueQueue: PrioritizedDialogue[];
  
  // Context tracking
  lastContextUpdate: number;
  consecutiveIdleSeconds: number;
  hasReactedToCurrentHover: boolean;
}

type CobieMood = 
  | 'neutral'      // Default state
  | 'amused'       // Player did something funny
  | 'concerned'    // Risk detected
  | 'excited'      // Big gains/milestones
  | 'bored'        // Player idle too long
  | 'sardonic'     // Classic Cobie mode
  | 'thinking';    // Processing something

type CobieExpression =
  | 'idle'
  | 'smirk'
  | 'raised_eyebrow'
  | 'wide_eyes'
  | 'squint'
  | 'thinking'
  | 'talking'
  | 'laughing'
  | 'concerned'
  | 'sleeping';
```

**Decision Logic:**
1. **Hover Reactions** - When player hovers a risky building, Cobie raises eyebrow
2. **Action Reactions** - When player bulldozes or places buildings, immediate reaction
3. **Event Reactions** - Rug pulls, sentiment shifts, milestones
4. **Idle Behavior** - After 30s idle, Cobie starts looking bored, eventually "falls asleep"
5. **Contextual Commentary** - Notices patterns (too many degen builds, low treasury)

### 3. FloatingCobieHead (`src/components/game/FloatingCobieHead.tsx`)

The visual component:

```typescript
interface FloatingCobieHeadProps {
  expression: CobieExpression;
  mood: CobieMood;
  dialogue: string | null;
  isSpeaking: boolean;
  position: 'bottom-left' | 'bottom-right';
  scale: 'small' | 'medium' | 'large';
  enabled: boolean;
}
```

**Features:**
- **Base Head Sprite** - 96x96 pixel art bald head (isometric style)
- **Expression Layers** - Separate sprites for eyes, mouth, eyebrows
- **Idle Animation** - Subtle bobbing (CSS transform + breathing)
- **Look Direction** - Head/eyes follow cursor (toward hovered tile)
- **Lip Sync** - Mouth animation cycles when speaking
- **Expression Transitions** - Smooth fade between expressions
- **Speech Bubble** - Retro pixel-art speech bubble with text

### 4. Sprite System (`public/figurines/cobie-head/`)

```
cobie-head/
├── base/
│   ├── head-front.png      # Base head facing forward
│   ├── head-left.png       # Slight left turn (15°)
│   ├── head-right.png      # Slight right turn (15°)
│   └── head-down.png       # Looking down
├── eyes/
│   ├── eyes-neutral.png
│   ├── eyes-wide.png
│   ├── eyes-squint.png
│   ├── eyes-closed.png
│   ├── eyes-look-left.png
│   ├── eyes-look-right.png
│   └── eyes-look-up.png
├── eyebrows/
│   ├── brows-neutral.png
│   ├── brows-raised.png
│   ├── brows-furrowed.png
│   └── brows-one-raised.png
├── mouth/
│   ├── mouth-neutral.png
│   ├── mouth-smirk.png
│   ├── mouth-open-1.png    # Lip sync frame 1
│   ├── mouth-open-2.png    # Lip sync frame 2
│   ├── mouth-open-3.png    # Lip sync frame 3
│   ├── mouth-laugh.png
│   └── mouth-concerned.png
└── effects/
    ├── sweat-drop.png
    ├── question-mark.png
    ├── exclamation.png
    └── zzz.png
```

### 5. Dialogue System Enhancement

Extend existing `useCobieNarrator` with contextual triggers:

```typescript
// New contextual reactions (add to useCobieNarrator.ts)
const HOVER_REACTIONS: Record<string, string[]> = {
  // When hovering high-risk buildings
  high_risk_hover: [
    msg("That one's spicy. The probability of a rug is... non-trivial."),
    msg("Looking at the danger zone, I see."),
    msg("High yield, high drama. Classic crypto equation."),
  ],
  // When hovering DeFi category
  defi_hover: [
    msg("DeFi. Where 'yield' is just a fancy word for 'hope'."),
    msg("Composable money legos. What could go wrong?"),
  ],
  // When hovering their own treasury
  treasury_hover: [
    msg("Counting your coins? Smart. Or paranoid. Same thing in crypto."),
  ],
};

const IDLE_COMMENTARY: Record<number, string[]> = {
  30: [  // 30 seconds idle
    msg("Taking a break? Markets don't sleep, but you should."),
    msg("*taps glass* You still there?"),
  ],
  60: [  // 60 seconds idle
    msg("I'll just be here. Watching. Waiting."),
    msg("The metagame is patience, I guess."),
  ],
  120: [ // 2 minutes idle - gets sleepy
    msg("*yawns* Wake me up when something interesting happens."),
  ],
};

const TOOL_REACTIONS: Record<Tool, string[]> = {
  bulldoze: [
    msg("Destruction mode activated. Cathartic."),
    msg("Sometimes you gotta tear it down to build it up."),
  ],
  zone_residential: [
    msg("Housing for the degens. Noble work."),
  ],
  // ... etc
};
```

## Implementation Phases

### Phase 1: Core Infrastructure (2 issues)
1. **CobieContext Provider** - Context awareness system
2. **CobieBrain Engine** - Decision logic for expressions/dialogue

### Phase 2: Visual System (3 issues)
3. **Pixel Art Sprites** - Create sprite sheets for head, expressions, effects
4. **FloatingCobieHead Component** - Canvas renderer with animation
5. **Speech Bubble System** - Retro pixel-art speech bubbles

### Phase 3: Integration (2 issues)
6. **Context Hooks** - Connect to game events, cursor, tools
7. **Enhanced Dialogue** - Hover reactions, idle commentary, tool reactions

### Phase 4: Polish (2 issues)
8. **Idle Behaviors** - Blinking, looking around, sleeping
9. **Settings & Persistence** - Enable/disable, position, scale preferences

## Technical Considerations

### Performance
- Use `requestAnimationFrame` for smooth animation
- Sprite sheets pre-loaded
- Expression changes debounced (100ms minimum between changes)
- Dialogue queue prevents spam

### Accessibility
- Mute button (no audio planned, but for future TTS)
- Disable option in settings
- Screen reader announcements for dialogue
- Reduced motion: disable bobbing animation

### Mobile
- Smaller scale on mobile (64x64)
- Position: bottom-right on mobile (avoid thumb zone)
- Tap to dismiss speech bubble

## Integration Points

### With Existing Systems
- `useCobieNarrator` - All existing dialogue content
- `useCobieEvents` - Event animation triggers
- `GameContext` - Game state access
- `CryptoEconomyManager` - Economy events

### New Event Sources
- Canvas hover events (from CanvasIsometricGrid)
- Tool selection changes (from GameContext)
- Cursor position (global mouse tracking)

## Success Metrics
- Cobie reacts within 100ms of significant events
- Expression changes feel natural (not jarring)
- Players report Cobie as "helpful" or "amusing" (not annoying)
- No performance impact (< 2% CPU when idle)
