# AI NPC Living City System - Deep Technical Specification

## Executive Summary

Transform Crypto City from a static city builder into a **living, breathing metropolis** where hundreds of AI-powered NPCs autonomously live their lives, form relationships, build economies, create political systems, and engage in emergent conflicts - all while maintaining distinct personalities, memories, and voices.

---

## Part 1: Research Foundation

### Key Reference Projects

| Project | Key Innovation | Relevance |
|---------|---------------|-----------|
| **Stanford Generative Agents (Smallville)** | Memory stream → Retrieval → Reflection → Planning | Core architecture pattern |
| **Project Sid (Altera)** | 1000+ agents forming civilizations in Minecraft | Scale & emergent behavior |
| **Microsoft TinyTroupe** | LLM-powered persona simulation | Personality system |
| **Dwarf Fortress** | 500+ needs/memories per dwarf, cause-effect chains | Deep simulation without LLM |
| **RimWorld** | Accessible emergent storytelling | Balance depth vs. playability |
| **The Sims** | Needs-based AI with utility scoring | Motive decay system |
| **Inworld AI** | Dynamic relationships, multi-agent conversations | Social bonds |
| **Comme il Faut (CiF)** | Social simulation architecture | Relationship modeling |

### Core Architecture Patterns

#### 1. Stanford Generative Agents Memory Architecture
```
Observation → Memory Stream → Retrieval (recency + importance + relevance) → 
    → Reflection (synthesize higher-level insights) →
    → Planning (day/hour plans based on persona + memories) →
    → Action
```

#### 2. PIANO Architecture (Project Sid)
- **P**arallel **I**nformation **A**ggregation via **N**eural **O**rchestration
- Multiple cognitive modules run simultaneously
- Enables 1000+ agents with coherent behavior
- Key finding: "Less intelligent" agents with decentralized communication create more realistic dynamics

#### 3. Needs-Based AI (The Sims)
```typescript
interface Need {
  current: number;      // 0-100
  decayRate: number;    // Per game minute
  weight: number;       // Priority multiplier when low
  satisfiers: Action[]; // What can fulfill this need
}
```

---

## Part 2: System Architecture

### 2.1 NPC Entity Structure

```typescript
interface CryptoNPC {
  // === IDENTITY ===
  id: string;
  name: string;
  walletAddress: string;           // On-chain identity
  avatar: NPCAvatar;
  voiceProfile: VoiceProfile;      // Unique voice characteristics
  
  // === DEMOGRAPHICS ===
  age: number;
  occupation: Occupation;
  residence: BuildingId;
  workplace: BuildingId | null;
  
  // === PERSONALITY (Big Five + Crypto Traits) ===
  personality: {
    openness: number;              // 0-1: curiosity, creativity
    conscientiousness: number;     // 0-1: organization, discipline
    extraversion: number;          // 0-1: social energy
    agreeableness: number;         // 0-1: cooperation vs competition
    neuroticism: number;           // 0-1: emotional volatility
    
    // Crypto-specific traits
    riskTolerance: number;         // 0-1: HODL vs day trade
    fomo: number;                  // 0-1: susceptibility to hype
    trustInInstitutions: number;   // 0-1: bank lover vs sovereign individual
    technicalKnowledge: number;    // 0-1: normie to protocol architect
    degenLevel: number;            // 0-1: conservative to full ape
  };
  
  // === CAPABILITIES & STATS ===
  stats: {
    health: number;
    energy: number;
    wealth: number;
    reputation: number;
    influence: number;
    tradingSkill: number;
    socialSkill: number;
    technicalSkill: number;
    combatSkill: number;
  };
  
  // === NEEDS SYSTEM ===
  needs: {
    hunger: Need;
    energy: Need;
    social: Need;
    fun: Need;
    wealth: Need;                  // Crypto-specific: need to accumulate
    status: Need;                  // Need for recognition
    security: Need;                // Safety and stability
    purpose: Need;                 // Meaningful work/contribution
  };
  
  // === MEMORY SYSTEM ===
  memory: MemorySystem;
  
  // === RELATIONSHIPS ===
  relationships: Map<NPCId, Relationship>;
  
  // === POLITICAL/FACTION ===
  faction: FactionId | null;
  politicalBeliefs: PoliticalBeliefs;
  
  // === CURRENT STATE ===
  currentLocation: GridPosition;
  currentActivity: Activity | null;
  schedule: DailySchedule;
  goals: Goal[];
  
  // === INTERNAL WORLD ===
  internalWorld: {
    currentMood: Mood;
    thoughts: Thought[];           // Recent internal monologue
    beliefs: Belief[];             // What they believe about the world
    desires: Desire[];             // What they want
    intentions: Intention[];       // What they plan to do
  };
}
```

### 2.2 Memory System

```typescript
interface MemorySystem {
  // === EPISODIC MEMORY (specific events) ===
  episodic: EpisodicMemory[];
  
  // === SEMANTIC MEMORY (facts & knowledge) ===
  semantic: SemanticMemory[];
  
  // === PROCEDURAL MEMORY (skills & how-to) ===
  procedural: ProceduralMemory[];
  
  // === WORKING MEMORY (current context) ===
  working: WorkingMemory;
}

interface EpisodicMemory {
  id: string;
  timestamp: GameTime;
  location: GridPosition;
  participants: NPCId[];
  event: string;                   // Natural language description
  emotionalValence: number;        // -1 (negative) to +1 (positive)
  importance: number;              // 1-10 scale
  embedding?: number[];            // Vector for semantic search
  
  // Decay
  accessCount: number;
  lastAccessed: GameTime;
  strength: number;                // Decays over time
}

interface Reflection {
  id: string;
  timestamp: GameTime;
  sourceMemories: string[];        // Memory IDs that led to this
  insight: string;                 // Higher-level understanding
  importance: number;
}

// Memory retrieval scoring (from Stanford paper)
function retrieveMemories(query: string, npc: CryptoNPC, limit: number = 10): EpisodicMemory[] {
  return npc.memory.episodic
    .map(memory => ({
      memory,
      score: 
        recencyScore(memory) * RECENCY_WEIGHT +
        importanceScore(memory) * IMPORTANCE_WEIGHT +
        relevanceScore(memory, query) * RELEVANCE_WEIGHT
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(m => m.memory);
}
```

### 2.3 Relationship System

```typescript
interface Relationship {
  targetId: NPCId;
  
  // Core metrics (Inworld-style)
  trust: number;                   // -100 to +100
  respect: number;                 // -100 to +100
  familiarity: number;             // 0 to 100
  attraction: number;              // -100 to +100 (romantic/aesthetic)
  
  // Derived type
  type: RelationshipType;          // stranger, acquaintance, friend, rival, enemy, lover, family
  
  // History
  interactionHistory: Interaction[];
  sharedMemories: string[];        // Memory IDs
  
  // Debts and favors
  owedFavors: number;
  debts: Debt[];
}

type RelationshipType = 
  | 'stranger'
  | 'acquaintance' 
  | 'friend'
  | 'close_friend'
  | 'rival'
  | 'enemy'
  | 'nemesis'
  | 'romantic_interest'
  | 'partner'
  | 'family'
  | 'business_partner'
  | 'mentor'
  | 'mentee';

// Relationship evolution rules
const RELATIONSHIP_THRESHOLDS = {
  friend: { trust: 50, familiarity: 30 },
  close_friend: { trust: 75, familiarity: 60 },
  rival: { respect: 30, trust: -30 },
  enemy: { trust: -50 },
  nemesis: { trust: -80, respect: -50 },
  romantic_interest: { attraction: 60, familiarity: 40 },
};
```

### 2.4 Needs & Motivation System

```typescript
interface Need {
  current: number;                 // 0-100
  max: number;                     // Usually 100
  decayRate: number;               // Points per game minute
  criticalThreshold: number;       // Below this = urgent
  weight: number;                  // Base priority weight
}

// Utility AI scoring for action selection
function scoreAction(action: Action, npc: CryptoNPC): number {
  let score = 0;
  
  // Score based on need satisfaction
  for (const [needName, effect] of Object.entries(action.needEffects)) {
    const need = npc.needs[needName];
    const currentDeficit = need.max - need.current;
    const urgencyMultiplier = need.current < need.criticalThreshold ? 2.0 : 1.0;
    
    // More valuable to satisfy urgent needs
    score += effect * urgencyMultiplier * need.weight * (currentDeficit / need.max);
  }
  
  // Personality modifiers
  score *= personalityModifier(action, npc.personality);
  
  // Goal alignment
  score += goalAlignment(action, npc.goals) * GOAL_WEIGHT;
  
  // Social context
  score += socialContextModifier(action, npc);
  
  return score;
}

// Daily schedule template based on occupation
const SCHEDULE_TEMPLATES: Record<Occupation, ScheduleTemplate> = {
  trader: {
    6: 'wake_up',
    7: 'breakfast',
    8: 'commute_to_work',
    9: 'work',           // Trading at DEX
    12: 'lunch',
    13: 'work',
    17: 'commute_home',
    18: 'leisure',
    20: 'dinner',
    21: 'social',        // Hit the bars, check Discord
    23: 'sleep',
  },
  miner: {
    // ... different schedule
  },
  // etc.
};
```

### 2.5 Economic System

```typescript
interface NPCEconomy {
  // Personal finances
  wallet: {
    cash: number;                  // Stablecoin balance
    crypto: Map<TokenId, number>; // Token holdings
    nfts: NFTId[];
    stakedPositions: StakedPosition[];
  };
  
  // Income sources
  income: {
    salary: number;                // Per game day
    tradingProfits: number;
    stakingRewards: number;
    rentalIncome: number;
  };
  
  // Expenses
  expenses: {
    housing: number;
    food: number;
    entertainment: number;
    taxes: number;                 // To city/faction
  };
}

// Market system - NPCs affect and are affected by markets
interface CityMarket {
  goods: Map<GoodId, {
    price: number;
    supply: number;
    demand: number;
    priceHistory: number[];
  }>;
  
  // Price discovery through NPC trading
  updatePrices(): void;
}

// NPC trading behavior
function decideTradeAction(npc: CryptoNPC, market: CityMarket): TradeAction | null {
  // Based on:
  // - Personality (risk tolerance, FOMO)
  // - Technical analysis skill
  // - Social influence (what are friends buying?)
  // - News/events
  // - Current portfolio
  
  const sentiment = calculateSentiment(npc);
  const technicalSignal = npc.stats.tradingSkill > 0.7 
    ? analyzeTechnicalIndicators(market)
    : null;
  const socialInfluence = getSocialTradingInfluence(npc);
  
  // Combine signals based on personality
  // ...
}
```

### 2.6 Political & Faction System

```typescript
interface Faction {
  id: string;
  name: string;
  ideology: FactionIdeology;
  leader: NPCId | null;
  members: Set<NPCId>;
  territory: GridPosition[];       // Controlled areas
  
  // Resources
  treasury: number;
  military: MilitaryForce;
  
  // Relationships with other factions
  relations: Map<FactionId, FactionRelation>;
  
  // Governance
  laws: Law[];
  taxRate: number;
  
  // Culture
  beliefs: Belief[];
  rituals: Ritual[];
}

interface FactionIdeology {
  economic: 'communist' | 'socialist' | 'mixed' | 'capitalist' | 'anarcho_capitalist';
  governance: 'autocracy' | 'oligarchy' | 'democracy' | 'dao' | 'anarchy';
  cryptoPhilosophy: 'bitcoin_maxi' | 'eth_aligned' | 'multi_chain' | 'tradfi_hybrid';
}

interface PoliticalBeliefs {
  // Economic
  wealthRedistribution: number;    // 0 = laissez-faire, 1 = full redistribution
  regulationSupport: number;       // 0 = anarchy, 1 = heavy regulation
  
  // Governance
  centralAuthority: number;        // 0 = decentralized, 1 = centralized
  democraticParticipation: number; // 0 = don't care, 1 = very engaged
  
  // Crypto-specific
  decentralizationPurity: number;  // 0 = pragmatist, 1 = purist
  privacyImportance: number;
  
  // Formed through:
  // - Personality
  // - Life experiences (memories)
  // - Social influence
  // - Economic status
}

// Political action selection
function decidePoliticalAction(npc: CryptoNPC): PoliticalAction | null {
  // Vote in elections
  // Support/oppose laws
  // Join/leave factions
  // Protest
  // Revolution/coup (if extreme)
}
```

### 2.7 Conflict & Warfare System

```typescript
interface ConflictSystem {
  // Types of conflict
  activeConflicts: Conflict[];
  
  // Escalation ladder
  tensions: Map<`${FactionId}-${FactionId}`, number>; // 0-100
}

interface Conflict {
  id: string;
  type: ConflictType;
  participants: {
    aggressor: FactionId | NPCId;
    defender: FactionId | NPCId;
    allies: Map<FactionId | NPCId, 'aggressor' | 'defender'>;
  };
  
  cause: ConflictCause;
  stage: ConflictStage;
  battles: Battle[];
  casualties: number;
  
  // Resolution
  status: 'active' | 'ceasefire' | 'resolved';
  resolution?: ConflictResolution;
}

type ConflictType = 
  | 'personal_feud'      // Between individuals
  | 'gang_war'           // Small group conflict
  | 'faction_war'        // Full faction conflict
  | 'civil_war'          // Internal faction conflict
  | 'revolution'         // Against ruling faction
  | 'economic_war';      // Market manipulation/attacks

type ConflictCause =
  | 'insult'
  | 'theft'
  | 'betrayal'
  | 'territory'
  | 'resources'
  | 'ideology'
  | 'revenge'
  | 'honor';

interface Battle {
  id: string;
  location: GridPosition;
  timestamp: GameTime;
  
  attackers: Combatant[];
  defenders: Combatant[];
  
  result: BattleResult;
  casualties: {
    attackerLosses: number;
    defenderLosses: number;
  };
}

interface Combatant {
  npcId: NPCId;
  role: 'fighter' | 'support' | 'commander';
  equipment: Equipment[];
  
  // Combat stats
  health: number;
  morale: number;
}

// Combat resolution (simplified)
function resolveCombat(attacker: Combatant, defender: Combatant): CombatResult {
  const attackerPower = calculateCombatPower(attacker);
  const defenderPower = calculateCombatPower(defender);
  
  // Factor in:
  // - Stats (combatSkill)
  // - Equipment
  // - Morale
  // - Terrain
  // - Numbers
  // - Luck
  
  // ...
}
```

### 2.8 Learning & Adaptation System

```typescript
interface LearningSystem {
  // Skill improvement through practice
  skillProgression: Map<Skill, {
    experience: number;
    level: number;
  }>;
  
  // Behavioral adaptation
  behaviorPatterns: {
    successfulStrategies: Strategy[];
    failedStrategies: Strategy[];
  };
  
  // Social learning
  observedBehaviors: ObservedBehavior[];
}

// NPCs learn from experience
function updateFromExperience(npc: CryptoNPC, outcome: ActionOutcome): void {
  // Update skill if relevant
  if (outcome.skillUsed) {
    const progression = npc.learning.skillProgression.get(outcome.skillUsed);
    progression.experience += outcome.success ? 10 : 2;
    
    // Level up check
    if (progression.experience >= levelThreshold(progression.level)) {
      progression.level++;
      npc.stats[outcome.skillUsed] = Math.min(1.0, npc.stats[outcome.skillUsed] + 0.05);
    }
  }
  
  // Update strategy preferences
  if (outcome.success) {
    npc.learning.behaviorPatterns.successfulStrategies.push(outcome.strategy);
  } else {
    npc.learning.behaviorPatterns.failedStrategies.push(outcome.strategy);
  }
  
  // Create memory
  addMemory(npc, {
    event: describeOutcome(outcome),
    emotionalValence: outcome.success ? 0.5 : -0.3,
    importance: calculateImportance(outcome),
  });
}

// Social learning - observe and imitate successful NPCs
function learnFromOthers(npc: CryptoNPC, observed: NPCAction): void {
  // Only learn from respected/admired NPCs
  const relationship = npc.relationships.get(observed.npcId);
  if (relationship && relationship.respect > 50) {
    // Add observed behavior to consideration
    npc.learning.observedBehaviors.push({
      action: observed.action,
      outcome: observed.outcome,
      source: observed.npcId,
      timestamp: getCurrentTime(),
    });
  }
}
```

---

## Part 3: AI Integration Architecture

### 3.1 Hybrid AI Approach

We use a **hybrid approach** combining:
1. **Rule-based systems** for deterministic behaviors (schedules, basic needs)
2. **Utility AI** for action selection
3. **LLM** for dialogue, reflection, and complex reasoning
4. **Vector embeddings** for memory retrieval

```typescript
interface AISystem {
  // Fast, cheap: Rule-based
  scheduleManager: ScheduleManager;
  needsEngine: NeedsEngine;
  pathfinding: Pathfinding;
  
  // Medium: Utility AI
  actionSelector: UtilityAISelector;
  combatAI: CombatAI;
  
  // Expensive: LLM-powered
  dialogueGenerator: LLMDialogueGenerator;
  reflectionEngine: LLMReflectionEngine;
  planningEngine: LLMPlanningEngine;
  
  // Supporting
  memoryRetrieval: VectorMemoryRetrieval;
}

// Tiered processing to manage costs
class NPCBrain {
  async tick(npc: CryptoNPC, deltaTime: number): Promise<void> {
    // Always run (every tick)
    this.updateNeeds(npc, deltaTime);
    this.updatePosition(npc, deltaTime);
    
    // Run periodically (every ~10 seconds game time)
    if (shouldEvaluateActions(npc)) {
      await this.selectAction(npc);
    }
    
    // Run rarely (every ~hour game time, or on significant events)
    if (shouldReflect(npc)) {
      await this.generateReflection(npc);
    }
    
    // Run very rarely (once per game day, or on major life changes)
    if (shouldReplan(npc)) {
      await this.generateDailyPlan(npc);
    }
  }
}
```

### 3.2 LLM Integration

```typescript
interface LLMPromptTemplates {
  // Character voice generation
  dialogue: (npc: CryptoNPC, context: DialogueContext) => string;
  
  // Internal thoughts
  innerMonologue: (npc: CryptoNPC, situation: Situation) => string;
  
  // Memory reflection
  reflection: (npc: CryptoNPC, recentMemories: EpisodicMemory[]) => string;
  
  // Daily planning
  planning: (npc: CryptoNPC, currentState: WorldState) => string;
  
  // Decision making for complex situations
  complexDecision: (npc: CryptoNPC, options: DecisionOption[]) => string;
}

// Example: Dialogue generation
const dialoguePrompt = (npc: CryptoNPC, context: DialogueContext): string => `
You are ${npc.name}, a ${npc.age}-year-old ${npc.occupation} living in Crypto City.

PERSONALITY:
- Openness: ${describeLevel(npc.personality.openness)} (${npc.personality.openness.toFixed(2)})
- Extraversion: ${describeLevel(npc.personality.extraversion)}
- Risk Tolerance: ${describeLevel(npc.personality.riskTolerance)}
- Degen Level: ${describeLevel(npc.personality.degenLevel)}

CURRENT MOOD: ${npc.internalWorld.currentMood}
CURRENT NEEDS: ${describeNeeds(npc.needs)}

RELEVANT MEMORIES:
${context.relevantMemories.map(m => `- ${m.event} (${m.timestamp})`).join('\n')}

RELATIONSHIP WITH ${context.otherNPC.name}:
- Trust: ${context.relationship.trust}
- Familiarity: ${context.relationship.familiarity}
- Type: ${context.relationship.type}

CURRENT SITUATION:
${context.situation}

Respond as ${npc.name} would, staying in character. Use crypto slang naturally if appropriate for this character. Keep response under 100 words.
`;

// Rate limiting and caching
class LLMManager {
  private cache: Map<string, { response: string; timestamp: number }>;
  private requestQueue: PriorityQueue<LLMRequest>;
  
  async generateDialogue(npc: CryptoNPC, context: DialogueContext): Promise<string> {
    const cacheKey = this.getCacheKey(npc, context);
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.response;
    }
    
    // Queue request
    return this.enqueueRequest({
      type: 'dialogue',
      npc,
      context,
      priority: this.calculatePriority(npc, context),
    });
  }
}
```

### 3.3 Performance Optimization

```typescript
// Level of Detail (LOD) for NPCs
enum NPCDetailLevel {
  FULL = 'full',           // Player is directly interacting
  HIGH = 'high',           // On screen, nearby
  MEDIUM = 'medium',       // On screen, far
  LOW = 'low',             // Off screen, same district
  MINIMAL = 'minimal',     // Off screen, far away
  SUSPENDED = 'suspended', // Not simulated at all
}

function getDetailLevel(npc: CryptoNPC, player: Player): NPCDetailLevel {
  const distance = calculateDistance(npc.currentLocation, player.location);
  const isOnScreen = isInViewport(npc.currentLocation, player.camera);
  const isInteracting = player.interactingWith === npc.id;
  
  if (isInteracting) return NPCDetailLevel.FULL;
  if (isOnScreen && distance < 5) return NPCDetailLevel.HIGH;
  if (isOnScreen) return NPCDetailLevel.MEDIUM;
  if (distance < 50) return NPCDetailLevel.LOW;
  if (distance < 200) return NPCDetailLevel.MINIMAL;
  return NPCDetailLevel.SUSPENDED;
}

// What updates at each detail level
const UPDATE_POLICIES: Record<NPCDetailLevel, UpdatePolicy> = {
  [NPCDetailLevel.FULL]: {
    needsUpdate: 'every_tick',
    actionSelection: 'every_second',
    llmCalls: 'allowed',
    animation: 'full',
    pathfinding: 'precise',
  },
  [NPCDetailLevel.HIGH]: {
    needsUpdate: 'every_tick',
    actionSelection: 'every_5_seconds',
    llmCalls: 'limited',
    animation: 'full',
    pathfinding: 'precise',
  },
  [NPCDetailLevel.MEDIUM]: {
    needsUpdate: 'every_second',
    actionSelection: 'every_30_seconds',
    llmCalls: 'rare',
    animation: 'simplified',
    pathfinding: 'approximate',
  },
  [NPCDetailLevel.LOW]: {
    needsUpdate: 'every_minute',
    actionSelection: 'every_5_minutes',
    llmCalls: 'none',
    animation: 'none',
    pathfinding: 'teleport',
  },
  [NPCDetailLevel.MINIMAL]: {
    needsUpdate: 'statistical',  // Just calculate expected values
    actionSelection: 'statistical',
    llmCalls: 'none',
    animation: 'none',
    pathfinding: 'none',
  },
  [NPCDetailLevel.SUSPENDED]: {
    // Skip entirely, restore state on re-activation
  },
};
```

---

## Part 4: Implementation Phases

### Phase 1: Core NPC Framework
- [ ] NPC entity class with basic stats
- [ ] Simple needs system (hunger, energy, social)
- [ ] Basic pathfinding to buildings
- [ ] Day/night cycle schedule following
- [ ] NPC spawning and persistence

### Phase 2: Memory & Personality
- [ ] Episodic memory storage
- [ ] Memory retrieval system
- [ ] Personality traits affecting behavior
- [ ] Internal mood system
- [ ] Basic dialogue generation

### Phase 3: Relationships
- [ ] Relationship tracking between NPCs
- [ ] Trust/respect/familiarity metrics
- [ ] Relationship evolution over time
- [ ] Social interactions
- [ ] Family/friend networks

### Phase 4: Economic System
- [ ] NPC wallets and finances
- [ ] Jobs and income
- [ ] Shopping and consumption
- [ ] NPC-to-NPC trading
- [ ] Market price effects

### Phase 5: Political System
- [ ] Faction creation and membership
- [ ] Political beliefs formation
- [ ] Voting and governance
- [ ] Laws and enforcement
- [ ] Tax systems

### Phase 6: Conflict System
- [ ] Personal feuds and rivalries
- [ ] Gang/faction conflicts
- [ ] Combat resolution
- [ ] War mechanics
- [ ] Peace treaties

### Phase 7: Learning & Evolution
- [ ] Skill improvement
- [ ] Behavioral adaptation
- [ ] Social learning
- [ ] Cultural transmission
- [ ] Generational changes

### Phase 8: Polish & Scale
- [ ] Performance optimization
- [ ] LOD system implementation
- [ ] LLM caching and rate limiting
- [ ] Save/load NPC state
- [ ] Scale testing (100+ NPCs)

---

## Part 5: GitHub Issues Breakdown

### Epic: AI NPC Living City System

```
#94 - Epic: AI NPC Living City System
#95 - Core NPC entity and spawning system
#96 - Needs system (hunger, energy, social, wealth)
#97 - Daily schedule and routine system
#98 - Basic pathfinding and movement
#99 - Memory system (episodic, semantic, procedural)
#100 - Memory retrieval with importance/recency/relevance scoring
#101 - Personality system (Big Five + crypto traits)
#102 - Internal mood and thought system
#103 - Relationship tracking system
#104 - Relationship evolution rules
#105 - Social interaction system
#106 - NPC dialogue generation with LLM
#107 - NPC wallet and personal finances
#108 - Jobs, income, and economic activities
#109 - NPC trading and market participation
#110 - Faction system and membership
#111 - Political beliefs and formation
#112 - Voting and governance mechanics
#113 - Personal conflict and feuds
#114 - Faction warfare system
#115 - Combat resolution mechanics
#116 - Skill learning and progression
#117 - Social learning (observing others)
#118 - NPC Level-of-Detail (LOD) optimization
#119 - LLM integration and caching
#120 - NPC UI (inspect, interact, relationships)
```

---

## Part 6: Technical Decisions

### Client vs Server Simulation
- **Client-side**: Cheaper, works offline, faster iteration
- **Server-side**: Persistent world, multiplayer, more LLM capacity

**Recommendation**: Start client-side, design for eventual server migration.

### LLM Provider
- **OpenAI GPT-4**: Best quality, expensive
- **Claude**: Good quality, slightly cheaper
- **Local (Ollama)**: Free, requires hardware, lower quality
- **Groq**: Fast inference, good for real-time

**Recommendation**: Use Groq for fast dialogue, GPT-4 for complex reasoning. Allow user to configure.

### Memory Storage
- **IndexedDB**: For client-side persistence
- **Vector DB (Pinecone/Weaviate)**: For similarity search
- **Simple array with embedding**: For MVP

**Recommendation**: Start with in-memory + IndexedDB, add vector search later.

---

## Appendix: Crypto-Specific NPC Archetypes

| Archetype | Personality | Trading Style | Political Lean |
|-----------|-------------|---------------|----------------|
| Bitcoin Maxi | Low openness, high conscientiousness | HODL only BTC | Anarcho-capitalist |
| ETH Builder | High openness, high technical | Long ETH, builds dApps | DAO governance |
| Degen Trader | High risk tolerance, low conscientiousness | Ape everything | Whatever's winning |
| Institutional | Low degen, high trust in institutions | Slow, methodical | Regulation-friendly |
| Privacy Maximalist | Low trust, high technical | Monero, ZK protocols | Anarchist |
| NFT Flipper | High extraversion, high FOMO | Fast trades, social signals | Influence-based |
| Staking Grandma | Low technical, high conscientiousness | Set and forget | Conservative |
| Protocol Politician | High extraversion, high influence | Token voting | DAO power broker |

---

## References

1. Park, J.S., et al. (2023). "Generative Agents: Interactive Simulacra of Human Behavior" - Stanford/Google
2. Altera.AL (2024). "Project Sid: Many-agent simulations toward AI civilization" - arXiv:2411.00114
3. Microsoft (2025). "TinyTroupe: LLM-powered multiagent persona simulation"
4. Zubek, R. "Needs-based AI" - Game AI Pro
5. The Sims Technical Design Documents
6. Dwarf Fortress Design Analysis
7. RimWorld AI System Analysis
8. Inworld AI Documentation - Dynamic Relationships
9. Comme il Faut (CiF) - Social Simulation Architecture
