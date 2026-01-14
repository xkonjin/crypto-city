# Crypto City: Living Breathing City Specification

> "The city wasn't built in a day. It was grown, pixel by pixel, by beings who thought they were alive. The fact that they weren't is, frankly, irrelevant."
> — Hitchhiker's Guide to Crypto City, Chapter 42

## Executive Summary

Transform Crypto City from a city builder into a **persistent multiplayer living world** where:
1. AI NPCs live autonomous lives with real thoughts, personalities, and on-chain wallets
2. Users can **ingest themselves** (or anyone from X/Twitter) to become permanent residents
3. A **City Builder AI** runs the simulation autonomously
4. Players can trigger **disaster events** (paid in USDT₮) while others can **repair** them
5. Everything happens on **Plasma testnet** with real x402 micropayments

---

## Part 1: NPC Cognitive Architecture

### Research Foundation

Based on extensive research into multi-agent AI systems:

| System | Key Innovation | Applied to Crypto City |
|--------|---------------|------------------------|
| **Stanford Smallville** | Memory stream + reflection + planning | NPC memory system |
| **Altera/Project Sid** | PIANO architecture for 1000+ agents | LOD system for scale |
| **Inworld AI** | Character personality engines | Dialogue pools + LLM |
| **NVIDIA ACE** | Autonomous NPCs that perceive/plan/act | Activity scheduling |

### NPC Brain Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          NPC COGNITIVE ARCHITECTURE                      │
│                                                                          │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐    │
│  │    PERCEPTION    │   │    COGNITION     │   │     ACTION       │    │
│  │  ────────────── │   │  ────────────── │   │  ──────────────  │    │
│  │  • See NPCs      │──▶│  • Memory Stream │──▶│  • Move          │    │
│  │  • See Buildings │   │  • Reflection    │   │  • Speak         │    │
│  │  • Market Data   │   │  • Planning      │   │  • Work          │    │
│  │  • Events        │   │  • Decision      │   │  • Trade         │    │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘    │
│           │                      │                      │               │
│           └──────────────────────┴──────────────────────┘               │
│                                  │                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         INTERNAL STATE                            │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │  │
│  │  │ Memory  │  │  Needs  │  │  Mood   │  │Personality│ │ Wallet │ │  │
│  │  │ Stream  │  │ System  │  │ Engine  │  │  Traits  │ │ (x402) │ │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Memory Stream (Stanford Generative Agents Style)

```typescript
interface ThoughtStream {
  // What the NPC perceives
  observations: Observation[];
  
  // What the NPC remembers (episodic, semantic, procedural)
  memories: Memory[];
  
  // What the NPC is thinking RIGHT NOW
  currentThought: string;
  
  // Plans for the immediate future
  shortTermPlan: string[];
  
  // Life goals and aspirations
  longTermGoals: string[];
  
  // Recent reflections (insights derived from memories)
  reflections: Reflection[];
}

// Observation example:
// "I see trader_bob walking toward the DEX. He looks worried."

// Reflection example (derived periodically):
// "I've noticed that every time the market dips, Alice comes to my bar. 
//  She might be using alcohol to cope with losses."
```

### Thought Generation System

NPCs generate thoughts based on:
1. **Immediate perception** - What they see around them
2. **Need state** - Hungry? Lonely? Broke?
3. **Personality** - How they interpret events
4. **Memory retrieval** - Relevant past experiences
5. **Relationships** - Who they like/dislike nearby

```typescript
// Example thought generation for a degen_trader NPC
function generateThought(npc: CryptoNPC, context: SimulationContext): string {
  const thoughts = [];
  
  // Need-based thoughts
  if (npc.needs.hunger.current < 30) {
    thoughts.push("Getting hungry... should grab food before the next pump");
  }
  
  // Perception-based thoughts
  const nearbyNPCs = context.getNearbyNPCs(npc, 5);
  if (nearbyNPCs.length > 0) {
    const known = nearbyNPCs.find(n => npc.relationships[n.id]?.familiarity > 0.5);
    if (known) {
      thoughts.push(`Oh, there's ${known.name}. ${getRelationshipThought(npc, known)}`);
    }
  }
  
  // Market-based thoughts (personality affects interpretation)
  if (context.marketCondition === 'bear') {
    if (npc.personality.crypto.riskTolerance > 0.7) {
      thoughts.push("Blood in the streets! Time to accumulate...");
    } else {
      thoughts.push("This dump is concerning. Should I cut my losses?");
    }
  }
  
  // Memory-triggered thoughts
  const relevantMemory = retrieveRelevantMemory(npc, context);
  if (relevantMemory) {
    thoughts.push(`This reminds me of ${relevantMemory.event}...`);
  }
  
  return selectThought(thoughts, npc.personality);
}
```

### Personality-Driven Speech

Each archetype has distinct speech patterns:

| Archetype | Speech Pattern | Example |
|-----------|---------------|---------|
| **bitcoin_maxi** | Confrontational, maximalist | "Have fun staying poor. Bitcoin fixes this." |
| **degen_trader** | Excited, slang-heavy | "SER THIS IS THE ONE 🚀 100x incoming fren" |
| **eth_builder** | Technical, optimistic | "We're still early. The merge was just the beginning." |
| **staking_grandma** | Patient, folksy | "Slow and steady, dear. Rome wasn't built in a day." |
| **privacy_maxi** | Paranoid, terse | "That's none of your business. Or the government's." |
| **nft_flipper** | Trend-focused | "This project? GENERATIONAL. Just look at the art." |
| **protocol_politician** | Diplomatic, verbose | "I propose we table this for governance review..." |
| **normie_investor** | Confused, questioning | "So is Bitcoin like a stock? Why is it crashing?" |

### Progressive Disclosure UI

```
┌─────────────────────────────────────────────────────────────────┐
│  ZOOM LEVEL 1: City View                                        │
│  ─────────────────────────────────────────────────────────────  │
│  • See sprite dots moving                                       │
│  • Aggregate activity indicators (busy areas glow)              │
│  • No individual NPC info                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Zoom in...
┌─────────────────────────────────────────────────────────────────┐
│  ZOOM LEVEL 2: Neighborhood View                                │
│  ─────────────────────────────────────────────────────────────  │
│  • See individual NPCs walking                                  │
│  • Name tags appear on hover                                    │
│  • Activity icons (🍔 eating, 💤 sleeping, 💬 talking)         │
│  • Quick stats tooltip                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Click NPC...
┌─────────────────────────────────────────────────────────────────┐
│  ZOOM LEVEL 3: NPC Inspector Panel                              │
│  ─────────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🧑 Satoshi_Maxi_42                    ⭐ Favorite      │   │
│  │  ──────────────────────────────────────────────────────  │   │
│  │  💭 "This dump is a buying opportunity..."               │   │
│  │                                                          │   │
│  │  📊 Status                                               │   │
│  │  ├─ Occupation: Trader                                   │   │
│  │  ├─ Mood: 😟 Anxious                                     │   │
│  │  ├─ Activity: Working at DEX Exchange                    │   │
│  │  └─ Wallet: $42.50 USDT₮                                 │   │
│  │                                                          │   │
│  │  🧠 Personality: Degen Trader                            │   │
│  │  ├─ Risk Tolerance: ████████░░ 80%                       │   │
│  │  ├─ FOMO Level: ██████████ 100%                          │   │
│  │  └─ Degen Level: █████████░ 90%                          │   │
│  │                                                          │   │
│  │  📝 Recent Thoughts                                       │   │
│  │  • "Just aped into a new memecoin..."                    │   │
│  │  • "Should have taken profits yesterday..."              │   │
│  │  • "Alice said this project was rugged..."               │   │
│  │                                                          │   │
│  │  🤝 Relationships                                         │   │
│  │  ├─ 💚 Best Friend: CryptoChad                           │   │
│  │  ├─ 💛 Friend: Alice                                     │   │
│  │  └─ 💔 Rival: BearishBob                                 │   │
│  │                                                          │   │
│  │  📜 History  [View Full Timeline]                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 2: X/Twitter Ingestion System

### Overview

Allow users to **ingest any X/Twitter profile** into the game as a permanent NPC resident.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     INGESTION PIPELINE                           │
│                                                                  │
│  User Input          Profile Fetch       Trait Extraction        │
│  ──────────          ────────────        ───────────────         │
│  @username    ──▶    X API / Scraper ──▶  LLM Analysis           │
│                      • Bio                • Personality           │
│                      • Last 20 tweets     • Occupation            │
│                      • Metrics            • Speech style          │
│                                                                  │
│                           │                                       │
│                           ▼                                       │
│                                                                  │
│  Sprite Generation       NPC Creation        X402 Wallet         │
│  ─────────────────       ────────────        ──────────          │
│  AI Pixel Art Gen  ◀──   CryptoNPC     ──▶   HD Wallet           │
│  • From profile pic      • Unique traits     • Funded from       │
│  • Isometric style       • Custom dialogue     faucet            │
│  • 4 directions          • Housing assigned  • Ready to earn     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1: Profile Fetching

```typescript
interface XProfileData {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  profileImageUrl: string;
  followerCount: number;
  followingCount: number;
  tweetCount: number;
  recentTweets: Tweet[];
  pinnedTweet?: Tweet;
}

interface Tweet {
  id: string;
  text: string;
  createdAt: Date;
  likes: number;
  retweets: number;
  replies: number;
}

// Options for fetching:
// 1. Official X API (requires API key, rate limited)
// 2. Apify Twitter Scraper ($0.001/record)
// 3. twscrape open source (free, needs account pool)
// 4. Mock adapter for testing
```

### Step 2: Personality Extraction

Use LLM to analyze profile and generate NPC traits:

```typescript
const INGESTION_PROMPT = `
You are analyzing a Twitter/X profile to create an NPC for a crypto-themed city builder game.

Profile:
- Username: {username}
- Bio: {bio}
- Recent Tweets: {tweets}

Based on this profile, determine:

1. PERSONALITY ARCHETYPE (pick one):
   - bitcoin_maxi: Strong Bitcoin supporter, skeptical of altcoins
   - eth_builder: Ethereum developer/enthusiast, technical
   - degen_trader: High-risk trader, loves memecoins
   - privacy_maxi: Privacy-focused, suspicious of surveillance
   - normie_investor: New to crypto, still learning
   - nft_flipper: NFT collector/trader, art-focused
   - staking_grandma: Long-term holder, passive income
   - protocol_politician: Governance participant, diplomatic

2. OCCUPATION (pick one):
   - trader, developer, artist, shop_owner, bartender, security, miner, unemployed

3. DIALOGUE SEEDS (5 phrases this person might say, based on their tweets):
   - Should sound like the actual person
   - Use their vocabulary and style
   - Include any catchphrases or recurring themes

4. PERSONALITY TRAITS (0-1 scale):
   - openness, conscientiousness, extraversion, agreeableness, neuroticism
   - riskTolerance, fomo, trustInInstitutions, technicalKnowledge, degenLevel

Output as JSON.
`;
```

### Step 3: Sprite Generation

Generate unique pixel art sprite from profile picture:

```typescript
const SPRITE_GENERATION_PROMPT = `
Create an isometric pixel art character sprite (64x64) based on this profile picture.

Style requirements:
- Pixel art style matching the game aesthetic
- 4 directional frames (south, north, east, west)
- Walking animation (2 frames per direction)
- Transparent background
- Character should be recognizable but stylized
- Include any distinctive features (hair color, accessories, etc.)

Reference game style: [link to existing character sprites]
`;

// Generation pipeline:
// 1. Use Gemini 2.5 Flash Image API (already used for buildings)
// 2. Generate base sprite from profile pic
// 3. Apply game's color palette
// 4. Save to /public/Characters/ingested/{username}/
```

### Step 4: NPC Creation with X402 Wallet

```typescript
async function ingestXProfile(username: string): Promise<CryptoNPC> {
  // 1. Fetch profile data
  const profile = await fetchXProfile(username);
  
  // 2. Extract traits via LLM
  const traits = await extractPersonalityTraits(profile);
  
  // 3. Generate sprite
  const spritesheet = await generateCharacterSprite(profile.profileImageUrl);
  
  // 4. Create X402 wallet
  const wallet = await createNPCWallet(username);
  
  // 5. Fund wallet from faucet (testnet)
  await fundFromFaucet(wallet.address, INITIAL_NPC_BALANCE);
  
  // 6. Create NPC
  const npc = spawnIngestedNPC({
    profileId: profile.id,
    displayName: profile.displayName,
    avatarSpritesheet: spritesheet,
    traits: traits.personality,
    dialogueSeeds: traits.dialogueSeeds,
  }, {
    grid: currentGrid,
    gridSize: GRID_SIZE,
  });
  
  // 7. Mark as X-verified user
  npc.isIngestedUser = true;
  npc.xUsername = username;
  npc.x402Wallet = wallet;
  
  return npc;
}
```

### Favorite & Follow System

Users can favorite NPCs to follow them:

```typescript
interface FavoriteNPC {
  npcId: string;
  userId: string;  // Wallet address of the user
  favoritedAt: number;
  notifications: {
    onTrade: boolean;
    onInteraction: boolean;
    onMoodChange: boolean;
  };
}

// UI features for favorited NPCs:
// - Quick-select in sidebar
// - Camera follows option
// - Activity notification feed
// - Full history timeline
// - Relationship graph
```

---

## Part 3: City Builder AI

### Research Foundation

| System | Innovation | Applied |
|--------|------------|---------|
| **SimCity AI** | Advisor system, demand modeling | RCI balance |
| **Cities: Skylines** | Traffic AI, service coverage | Zone growth |
| **CityX** | Procedural unbounded cities | Expansion |
| **Project Sid** | Self-organizing agent societies | NPC economy |

### Autonomous City Management

The City Builder AI manages the city when no human is actively playing:

```
┌─────────────────────────────────────────────────────────────────┐
│                      CITY BUILDER AI                             │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   PERCEPTION   │  │   PLANNING     │  │   EXECUTION    │    │
│  │  ────────────  │  │  ────────────  │  │  ────────────  │    │
│  │  • Population  │  │  • Zone needs  │  │  • Place zone  │    │
│  │  • Demand      │──▶│  • Road plan   │──▶│  • Build road  │    │
│  │  • Treasury    │  │  • Budget      │  │  • Manage $$$  │    │
│  │  • Events      │  │  • Emergency   │  │  • Respond     │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    GOALS & CONSTRAINTS                    │  │
│  │  • Keep population happy (avg mood > 60)                  │  │
│  │  • Maintain treasury positive                             │  │
│  │  • Balance RCI (Residential/Commercial/Industrial)        │  │
│  │  • Respond to disasters within X minutes                  │  │
│  │  • Never bankrupt the city                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### AI Decision Framework

```typescript
interface CityAIState {
  // Current assessment
  populationTrend: 'growing' | 'stable' | 'declining';
  demandBalance: {
    residential: number;  // -1 to 1
    commercial: number;
    industrial: number;
  };
  treasuryHealth: 'surplus' | 'balanced' | 'deficit' | 'critical';
  serviceGaps: ServiceGap[];
  activeDisasters: Disaster[];
  
  // Planned actions queue
  actionQueue: CityAction[];
}

type CityAction = 
  | { type: 'zone'; zoneType: ZoneType; location: GridPos }
  | { type: 'road'; from: GridPos; to: GridPos }
  | { type: 'building'; buildingId: string; location: GridPos }
  | { type: 'demolish'; location: GridPos }
  | { type: 'adjust_tax'; rate: number }
  | { type: 'emergency_response'; disasterId: string };

// AI decision loop (runs every game hour)
function cityAITick(state: GameState): CityAction[] {
  const assessment = assessCityState(state);
  const priorities = rankPriorities(assessment);
  const actions: CityAction[] = [];
  
  for (const priority of priorities) {
    switch (priority.type) {
      case 'housing_shortage':
        actions.push(planResidentialExpansion(state, priority));
        break;
      case 'unemployment':
        actions.push(planCommercialZone(state, priority));
        break;
      case 'traffic_jam':
        actions.push(planRoadImprovement(state, priority));
        break;
      case 'disaster_response':
        actions.push(planEmergencyResponse(state, priority));
        break;
      case 'budget_crisis':
        actions.push(planBudgetAdjustment(state, priority));
        break;
    }
  }
  
  return actions;
}
```

### Building Placement AI

The AI decides where to place buildings based on:

```typescript
interface BuildingPlacementScore {
  // Factors considered
  synergy: number;        // Boost from nearby compatible buildings
  accessRoad: boolean;    // Is there road access?
  serviceRange: boolean;  // Are services (fire, police) nearby?
  landValue: number;      // Appropriate for building tier?
  npcDemand: number;      // Do NPCs want this type of building?
  
  // Final score
  total: number;
}

// Example: Deciding where to place a new DEX
function scoreDEXPlacement(location: GridPos, state: GameState): number {
  let score = 0;
  
  // Near other DeFi buildings (+synergy)
  const nearbyDefi = countNearbyBuildings(location, 'defi', 5);
  score += nearbyDefi * 10;
  
  // Near traders (+customer base)
  const nearbyTraders = countNPCsWithOccupation(location, 'trader', 10);
  score += nearbyTraders * 5;
  
  // Road access required
  if (!hasRoadAccess(location, state)) return 0;
  
  // Not too close to competitor
  const nearestDEX = findNearestBuilding(location, 'dex');
  if (nearestDEX && distance(location, nearestDEX) < 5) {
    score -= 50; // Too close to competition
  }
  
  return score;
}
```

---

## Part 4: Disaster & Event System

### Disaster Types

| Disaster | Trigger Cost | Damage | Recovery |
|----------|-------------|--------|----------|
| **Market Crash** | $5 USDT₮ | NPCs panic, trades fail | Market stabilizes |
| **Rug Pull** | $10 USDT₮ | Building destroyed, NPCs lose $ | Rebuild, compensation |
| **51% Attack** | $20 USDT₮ | Chain buildings offline | Validators recover |
| **SEC Raid** | $15 USDT₮ | Exchange buildings raided | Legal fees, reopening |
| **Flash Loan Exploit** | $8 USDT₮ | DeFi buildings drained | Audits, refunds |
| **Earthquake** | $25 USDT₮ | Random building damage | Construction crews |
| **Fire** | $5 USDT₮ | Spreads to nearby buildings | Fire department |
| **Whale Dump** | $12 USDT₮ | Market manipulation | Price recovery |

### Disaster Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  DISASTER EVENT FLOW                                             │
│                                                                  │
│  1. TRIGGER (Player pays USDT₮)                                 │
│     └──▶ ConnectWallet ──▶ Pay $X USDT₮ ──▶ Disaster starts     │
│                                                                  │
│  2. DAMAGE PHASE                                                 │
│     └──▶ Buildings affected ──▶ NPCs react ──▶ Economy impact   │
│                                                                  │
│  3. RECOVERY PHASE                                               │
│     └──▶ Repair jobs posted ──▶ Any player can pay to repair    │
│                                                                  │
│  4. RESOLUTION                                                   │
│     └──▶ Buildings restored ──▶ NPCs return ──▶ Normal ops      │
└─────────────────────────────────────────────────────────────────┘
```

### Balance Mechanics

To prevent griefing while keeping it fun:

```typescript
interface DisasterBalancing {
  // Cooldowns prevent spam
  globalCooldown: number;      // 5 minutes between any disaster
  perTypeCooldown: number;     // 30 minutes for same type
  
  // Scaling cost based on city size
  baseCost: number;            // $5 USDT₮
  costPerPopulation: number;   // +$0.01 per NPC
  
  // Damage limits
  maxBuildingsAffected: number;  // 10% of city max
  npcRecoveryGuarantee: boolean; // NPCs always survive
  
  // Recovery incentives
  repairReward: number;          // XP or achievements
  insurancePayout: boolean;      // Affected players get partial refund
  
  // Anti-griefing
  targetedProtection: number;    // Same building can't be hit twice in 1 hour
  newPlayerShield: number;       // New users immune for 24 hours
}
```

### NPC Reactions to Disasters

```typescript
function handleDisasterForNPC(npc: CryptoNPC, disaster: Disaster): void {
  // Update mood
  npc.internalWorld.mood = {
    type: 'panicked',
    intensity: 0.9,
    trigger: disaster.type,
  };
  
  // Generate thoughts
  const thought = generateDisasterThought(npc, disaster);
  npc.thoughtStream.currentThought = thought;
  // "Oh no, another rug pull! This is why I don't trust new tokens..."
  
  // Create memory
  addEpisodicMemory(npc, {
    event: `${disaster.type} hit the city`,
    emotionalValence: -0.8,
    importance: 8,
    participants: [],
    location: { x: npc.gridX, y: npc.gridY },
  });
  
  // Behavioral response
  switch (npc.personality.crypto.riskTolerance) {
    case value if value > 0.7:
      // Degen: "Time to buy the dip!"
      npc.currentActivity = 'working'; // Trading
      break;
    case value if value < 0.3:
      // Conservative: Hide
      npc.currentActivity = 'idle';
      seekSafety(npc);
      break;
    default:
      // Normal: Panic briefly then recover
      setTimeout(() => recoverFromPanic(npc), 5000);
  }
}
```

---

## Part 5: X402 Integration

### NPC Economy on Plasma Testnet

Every NPC has a real wallet and can earn/spend USDT₮:

```typescript
interface NPCEconomyFlow {
  // Income sources
  salary: {
    frequency: 'daily';
    source: 'city_treasury' | 'employer_building';
    amount: BigInt; // Based on occupation
  };
  
  tips: {
    from: 'other_npcs' | 'players';
    trigger: 'good_service' | 'entertainment';
  };
  
  trading: {
    profits: BigInt;
    losses: BigInt;
  };
  
  services: {
    provided: NPCService[];  // What they sell
    consumed: NPCService[];  // What they buy
  };
  
  // Expense sinks
  expenses: {
    housing: BigInt;     // Daily rent
    food: BigInt;        // Multiple per day
    entertainment: BigInt;
    insurance: BigInt;   // Disaster protection
  };
}
```

### Service Exchange System

NPCs automatically trade services with each other:

```typescript
// Example: Bartender serves Trader
async function executeServiceExchange(
  provider: CryptoNPC,
  consumer: CryptoNPC,
  service: NPCService
): Promise<ServiceResult> {
  // 1. Consumer initiates request
  const request = await fetch(`/api/npc/${provider.id}/services/${service.id}`, {
    headers: { 'X-Requester': consumer.id },
  });
  
  // 2. Get 402 Payment Required
  if (request.status === 402) {
    const paymentDetails = await request.json();
    
    // 3. Consumer pays via x402
    const txHash = await transfer(
      consumer.x402Wallet,
      provider.x402Wallet.address,
      service.price
    );
    
    // 4. Retry with payment proof
    const fulfilled = await fetch(`/api/npc/${provider.id}/services/${service.id}`, {
      headers: {
        'X-Requester': consumer.id,
        'X-Payment': txHash,
      },
    });
    
    if (fulfilled.ok) {
      // 5. Update both NPCs
      satisfyNeed(consumer, service.satisfiesNeed);
      recordIncome(provider, service.price);
      
      // 6. Create memories for both
      addServiceMemory(provider, consumer, service);
      addServiceMemory(consumer, provider, service, true);
      
      return { success: true, txHash };
    }
  }
  
  return { success: false, error: 'Payment failed' };
}
```

### Items & Consumables

```typescript
type Item = {
  id: string;
  name: string;
  description: string;
  category: 'food' | 'drink' | 'collectible' | 'tool' | 'cosmetic';
  price: bigint;
  effect?: {
    needSatisfied: NeedType;
    amount: number;
  };
  tradeable: boolean;
  stackable: boolean;
  maxStack: number;
};

const ITEMS: Item[] = [
  {
    id: 'hopium_cocktail',
    name: 'Hopium Cocktail',
    description: 'A refreshing blend of copium and optimism. Tastes like future gains.',
    category: 'drink',
    price: BigInt(50000), // $0.05
    effect: { needSatisfied: 'fun', amount: 15 },
    tradeable: true,
    stackable: true,
    maxStack: 10,
  },
  {
    id: 'degen_sandwich',
    name: 'Degen Sandwich',
    description: 'Mystery meat between two slices of reckless optimism.',
    category: 'food',
    price: BigInt(100000), // $0.10
    effect: { needSatisfied: 'hunger', amount: 30 },
    tradeable: true,
    stackable: true,
    maxStack: 5,
  },
  {
    id: 'alpha_leak',
    name: 'Alpha Leak Document',
    description: 'A whispered secret written on a napkin. NFA.',
    category: 'collectible',
    price: BigInt(250000), // $0.25
    effect: { needSatisfied: 'purpose', amount: 20 },
    tradeable: true,
    stackable: false,
    maxStack: 1,
  },
  // ... more items
];
```

### Gift Giving Between NPCs

```typescript
interface GiftExchange {
  from: string;       // NPC ID
  to: string;         // NPC ID
  item: Item;
  timestamp: number;
  
  // Effects
  relationshipBoost: number;  // Based on gift value and recipient preferences
  moodBoost: number;
  memoryCreated: boolean;
}

function calculateGiftEffect(
  gift: Item,
  giver: CryptoNPC,
  receiver: CryptoNPC
): GiftEffect {
  // Check if receiver likes this type of item
  const preference = getGiftPreference(receiver, gift.category);
  
  // Base relationship boost
  let relationshipBoost = gift.price / 100000n; // $0.10 = 1 point
  
  // Personality modifiers
  if (receiver.personality.bigFive.agreeableness > 0.7) {
    relationshipBoost *= 1.5; // Agreeable NPCs appreciate gifts more
  }
  
  if (preference === 'loves') {
    relationshipBoost *= 2;
  } else if (preference === 'hates') {
    relationshipBoost *= 0.1; // Wrong gift backfires
  }
  
  return { relationshipBoost, moodBoost: relationshipBoost * 0.5 };
}
```

---

## Part 6: Business Ingestion

### Buildings as Entities

Allow real businesses/protocols to **ingest themselves as buildings**:

```typescript
interface IngestedBuilding {
  // Identity
  businessId: string;
  name: string;
  xHandle: string;
  
  // In-game representation
  buildingType: CryptoBuildingType;
  customSprite?: string;
  
  // Economy
  x402Wallet: Address;
  revenueShare: number;  // % of in-game income to business wallet
  
  // NPCs
  employeeNPCs: string[];  // NPCs that work here
  ownerNPC?: string;       // Optional personified owner
  
  // Special features
  customServices: NPCService[];
  customEvents: BuildingEvent[];
  branding: {
    colors: string[];
    slogan: string;
  };
}

// Example: Aave ingests as a building
const aaveBuilding: IngestedBuilding = {
  businessId: 'aave-protocol',
  name: 'Aave Lending Tower',
  xHandle: '@aaboris',
  buildingType: 'defi_lending',
  x402Wallet: '0x...',
  revenueShare: 0.1, // 10% of in-game lending fees
  customServices: [
    {
      id: 'flash_loan',
      name: 'Flash Loan Service',
      price: BigInt(100000),
    },
  ],
};
```

---

## Part 7: Implementation Roadmap

### Phase 1: Core NPC Enhancements (Week 1-2)
- [ ] Thought generation system
- [ ] Progressive disclosure UI
- [ ] NPC inspector panel
- [ ] Favorite/follow system

### Phase 2: X/Twitter Ingestion (Week 2-3)
- [ ] Profile fetching adapter
- [ ] LLM trait extraction
- [ ] Sprite generation pipeline
- [ ] Ingestion flow UI

### Phase 3: City Builder AI (Week 3-4)
- [ ] City assessment system
- [ ] AI decision framework
- [ ] Building placement AI
- [ ] Autonomous mode toggle

### Phase 4: X402 Economy (Week 4-5)
- [ ] NPC wallet management
- [ ] Service exchange system
- [ ] Items & consumables
- [ ] Gift giving mechanics

### Phase 5: Disasters & Events (Week 5-6)
- [ ] Disaster types & triggers
- [ ] Balance mechanics
- [ ] Recovery system
- [ ] Player payment flow

### Phase 6: Business Ingestion (Week 6-7)
- [ ] Building entity system
- [ ] Custom services
- [ ] Revenue sharing
- [ ] Business dashboard

### Phase 7: Polish & Scale (Week 7-8)
- [ ] Performance optimization
- [ ] Rate limiting
- [ ] Testnet deployment
- [ ] Documentation

---

## Appendix A: API Endpoints

```typescript
// NPC Endpoints
GET  /api/npc/:id                    // Get NPC details
GET  /api/npc/:id/thoughts           // Get thought stream
GET  /api/npc/:id/history            // Get full history
POST /api/npc/:id/favorite           // Favorite an NPC
GET  /api/npc/:id/services           // List available services
POST /api/npc/:id/services/:serviceId  // Request service (x402)

// Ingestion Endpoints
POST /api/ingest/x/:username         // Ingest X profile
GET  /api/ingest/x/:username/status  // Check ingestion status
POST /api/ingest/business            // Ingest business as building

// City AI Endpoints
GET  /api/city/status                // City health metrics
GET  /api/city/ai/actions            // Pending AI actions
POST /api/city/ai/toggle             // Enable/disable AI

// Disaster Endpoints
GET  /api/disasters                  // List available disasters
POST /api/disasters/:type/trigger    // Trigger disaster (payment required)
POST /api/disasters/:id/repair       // Fund repair

// Economy Endpoints
GET  /api/economy/stats              // Global economy stats
GET  /api/economy/npc/:id/wallet     // NPC wallet balance
POST /api/economy/npc/:id/transfer   // Transfer between NPCs
```

---

## Appendix B: Rate Limits & Costs

| Operation | Free Tier | Paid Tier | Cost |
|-----------|-----------|-----------|------|
| View NPCs | Unlimited | Unlimited | Free |
| Favorite NPCs | 10/day | 100/day | $0.01/extra |
| Ingest X Profile | 1/day | 10/day | $1.00/profile |
| Trigger Disaster | 1/day | 5/day | $5-25 USDT₮ |
| Repair Disaster | Unlimited | Unlimited | Variable |
| Business Ingestion | N/A | 1/month | $50 USDT₮ |

---

## Appendix C: Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Users | 1,000 | Unique wallet connections |
| NPCs Running | 10,000+ | Autonomous agents |
| Ingested Profiles | 5,000 | X users ingested |
| Transaction Volume | $10,000/month | USDT₮ on Plasma |
| Avg Session Time | 15 min | Time watching city |
| NPC Interactions/Day | 100,000 | Agent-to-agent events |

---

*"In the end, the city wasn't a game. It was a society. A very weird, crypto-obsessed society where everyone had opinions about consensus mechanisms. But a society nonetheless."*
— Final entry, Hitchhiker's Guide to Crypto City
