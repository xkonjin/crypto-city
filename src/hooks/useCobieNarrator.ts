'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '@/types/game';
import { CryptoEvent, CryptoEconomyState, CryptoCategory } from '@/games/isocity/crypto/types';

// Cobie message types
export type CobieMessageType = 
  | 'tip'           // General gameplay tips
  | 'reaction'      // Reaction to player actions
  | 'commentary'    // Periodic sardonic observations
  | 'milestone'     // Celebrating/mocking achievements
  | 'event'         // Reacting to crypto events
  | 'warning';      // Proactive warnings

export interface CobieMessage {
  id: string;
  type: CobieMessageType;
  message: string;
  priority: number; // Lower = higher priority
}

// =============================================================================
// MARKET SENTIMENT REACTIONS (Issue #53)
// =============================================================================

const SENTIMENT_REACTIONS = {
  // Sentiment drops 10+ points
  sentimentDrop: [
    "Market's getting shaky. The probability of a smooth ride just went down.",
    "Sentiment tanking. This is where diamond hands get tested.",
    "Fear creeping in. Historically, this is when opportunities appear. Historically.",
  ],
  // Sentiment rises 10+ points
  sentimentRise: [
    "Bulls are back, baby! Or at least, they think they are.",
    "Sentiment pumping. Enjoy it while it lasts.",
    "Green candles everywhere. Everyone's a genius again.",
  ],
  // Extreme fear (0-20)
  extremeFear: [
    "Now THIS is a buying opportunity... if you have the stomach.",
    "Maximum fear. The metagame says this is when you're supposed to be greedy. Do with that what you will.",
    "Extreme fear zone. Either the bottom is in or we're going lower. Helpful, I know.",
  ],
  // Extreme greed (80-100)
  extremeGreed: [
    "Everyone's a genius in a bull market. Don't let it go to your head.",
    "Extreme greed. Historically, this is when smart money starts taking profits. Historically.",
    "Peak euphoria. This is where 'just one more trade' turns into 'why didn't I sell.'",
  ],
};

// =============================================================================
// RUG PULL REACTIONS (Issue #53)
// =============================================================================

const RUG_PULL_REACTIONS = {
  // Immediate reaction when rug happens
  immediate: [
    "Ouch. That one hurt.",
    "And there it goes. Classic rug pull.",
    "Rug pulled. The signs were probably there. They usually are.",
  ],
  // If player loses 20%+ treasury
  majorLoss: [
    "That's gonna leave a mark. 20% gone just like that.",
    "Major treasury hit. Time to reassess the risk profile.",
    "Big rug. The metagame is to survive these. You're still here.",
  ],
  // If multiple rugs in short time
  multipleRugs: [
    "When it rains, it pours. Multiple rugs in quick succession.",
    "Getting hit from all sides. The market doesn't care about your feelings.",
    "Another one? The probability of multiple rugs... well, here we are.",
  ],
  // First rug ever
  firstRug: [
    "Welcome to crypto. This won't be the last time.",
    "Your first rug pull. A rite of passage, really.",
    "First rug. Everyone remembers their first. Anyway, rebuild.",
  ],
};

// =============================================================================
// PLAYER PATTERN REACTIONS (Issue #53)
// =============================================================================

const PATTERN_REACTIONS = {
  // 5+ degen buildings
  manyDegenBuildings: [
    "Living dangerously, I see. 5+ high-risk buildings. Bold strategy.",
    "That's a lot of degen plays. Your risk tolerance is impressive. Or concerning.",
    "Heavy on the risk. The metagame rewards this sometimes. Sometimes.",
  ],
  // Only institution buildings
  onlyInstitution: [
    "Playing it safe? Boring, but respectable. Slow and steady.",
    "Conservative portfolio. Not exciting, but you'll probably survive.",
    "Institution-heavy setup. Lower yield, lower rug chance. Tradeoffs.",
  ],
  // Treasury drops below 20%
  lowTreasury: [
    "Might want to slow down there, chief. Treasury looking thin.",
    "Getting low on funds. The metagame is to not go bankrupt.",
    "Treasury alert. Maybe pump the brakes on spending.",
  ],
  // 10+ days without rug
  luckyStreak: [
    "Luck can't last forever... 10 days without a rug is impressive though.",
    "No rugs in 10 days. Either you're good at this or due for one.",
    "Rug-free streak continues. Enjoy it. Statistically, it won't last.",
  ],
};

// =============================================================================
// PROACTIVE WARNINGS (Issue #53)
// =============================================================================

const PROACTIVE_WARNINGS = {
  // Treasury below $10k
  lowTreasury: [
    "Running low on funds. Maybe pump the brakes.",
    "Treasury under $10k. Time to be more selective.",
    "Low funds warning. The metagame is capital preservation now.",
  ],
  // High risk portfolio
  highRisk: [
    "Your risk exposure is giving me anxiety. A lot of degen plays.",
    "Portfolio is heavily weighted toward risky buildings. Just saying.",
    "High risk alert. One bad rug could set you back significantly.",
  ],
  // No income buildings
  noIncome: [
    "You need some yield-generating buildings. Treasury's not gonna grow itself.",
    "No income sources detected. DeFi buildings generate yields, just saying.",
    "Building yield is zero. You might want to fix that.",
  ],
  // Happiness below 30%
  lowHappiness: [
    "Your citizens are getting restless. Happiness at critical levels.",
    "Low happiness alert. Unhappy citizens means problems down the road.",
    "Citizens aren't vibing. Build some parks or something.",
  ],
};

// =============================================================================
// STREAK COMMENTARY (Issue #53)
// =============================================================================

const STREAK_COMMENTARY = {
  // 3+ successful days
  successStreak: [
    "Nice streak going! Three days of gains.",
    "Winning streak continues. The metagame is strong.",
    "Three days in a row. Don't get cocky though.",
  ],
  // 3+ rug pulls
  rugStreak: [
    "Maybe diversify a bit? That's the third rug.",
    "Triple rug. Time to reconsider the strategy.",
    "Three rugs. The probability of this many... unlucky or poor choices?",
  ],
  // First million
  firstMillion: [
    "Welcome to the comma club. Treasury hit $1M.",
    "First million! You're officially playing with whale money now.",
    "Million dollar city. Not bad. Not bad at all.",
  ],
};

// =============================================================================
// BUILDING CLUSTER REACTIONS (Issue #53)
// =============================================================================

const CLUSTER_REACTIONS = {
  // Good synergy detected
  goodSynergy: [
    "Smart. Those DeFi buildings play nice together.",
    "Good cluster. The synergy bonus is real there.",
    "Nice grouping. Buildings that synergize earn more.",
  ],
  // Bad placement detected
  badPlacement: [
    "That stablecoin building won't synergize there. Just saying.",
    "Suboptimal placement. The synergy system matters.",
    "Lonely building. Might want to cluster similar types together.",
  ],
  // Chain synergy detected
  chainSynergy: [
    "Same chain buildings clustered. The chain synergy bonus is working.",
    "Nice chain grouping. ETH buildings near ETH buildings makes sense.",
    "Chain synergy activated. Smart play.",
  ],
};

// =============================================================================
// ORIGINAL COBIE TIPS
// =============================================================================

const COBIE_TIPS: CobieMessage[] = [
  {
    id: 'welcome',
    type: 'tip',
    message: "Welcome to the crypto city-building metagame. I'm Cobie. I'll be stumbling through this with you, same as I've been stumbling through crypto since 2012. Zone some land - residential, commercial, industrial. It's like portfolio allocation but with tiny buildings. Not financial advice, obviously.",
    priority: 0,
  },
  {
    id: 'needs_utilities',
    type: 'tip',
    message: "Your buildings need power, water, and roads to actually function. I know it's 2024 and we're all supposed to be running DAOs from our phones, but infrastructure still matters. Even in the metaverse.",
    priority: 1,
  },
  {
    id: 'negative_demand',
    type: 'tip',
    message: "Demand is negative. In crypto Twitter terms, this is 'accumulation.' In reality, your buildings are becoming abandoned. The metagame here is to balance your zones before it gets worse. Or don't. I'm not your financial advisor.",
    priority: 2,
  },
  {
    id: 'needs_safety',
    type: 'tip',
    message: "You need fire and police stations. Yes, I know - 'code is law' and 'trustless systems' - but your citizens still prefer not to be on fire. Call it a legacy requirement.",
    priority: 3,
  },
  {
    id: 'needs_parks',
    type: 'tip',
    message: "Environment score is tanking. Build some parks. Touch grass, as they say. Your citizens are, statistically speaking, probably not going outside enough.",
    priority: 4,
  },
  {
    id: 'needs_health_education',
    type: 'tip',
    message: "Build hospitals and schools. Healthcare and education. The two things most crypto people forgot about while staring at charts. Your citizens need both, I promise.",
    priority: 5,
  },
];

// =============================================================================
// BUILDING REACTIONS
// =============================================================================

const BUILDING_REACTIONS: Record<string, string[]> = {
  // Legends - Failed projects
  'ftx_ruins': [
    "The FTX Ruins. I streamed the collapse live, you know. Watched it all happen in real-time. Still processing that one, honestly.",
    "FTX Ruins. Customer funds were safe, they said. Although it probably was Su's fault somehow. Or SBF. Definitely someone's fault.",
    "Building a monument to the dangers of sleeping on beanbags at work. Bold choice.",
  ],
  'luna_crater': [
    "Luna Crater. $40 billion evaporated in a week. The probability of that happening was supposed to be near zero. Turns out the model was wrong.",
    "Ah, the algorithmic stablecoin memorial. 'It can't depeg,' they said with 95% confidence. The 5% hit different.",
    "Luna Crater - a reminder that past performance doesn't guarantee future results, especially when the math is wrong.",
  ],
  'three_ac_yacht': [
    "The 3AC Yacht. Beached. Like their creditors' hopes of getting their money back. Supercycle thesis didn't quite work out.",
    "Su and Kyle's yacht. The metagame was strong until it wasn't.",
  ],
  'celsius_freezer': [
    "Celsius Freezer. The yields were unsustainable. Everyone kinda knew, but the music was playing so people kept dancing.",
    "Where withdrawals went to die. Unbank yourself, they said. Get frozen, they didn't say.",
  ],
  
  // Legends - Active figures
  'vitalik_tower': [
    "Vitalik's Beacon. The man sold his dog coins for charity. That's the kind of move that makes you rethink your portfolio.",
    "Building Ethereum's shrine. May your merge be smooth and your gas fees eventually reasonable.",
  ],
  'satoshi_monument': [
    "Satoshi Monument. We still don't know who they are. Probably for the best. Mystery adds value in crypto.",
    "A monument to the greatest disappearing act in financial history. Very bullish energy.",
  ],
  'cz_safu_fund': [
    "SAFU Vault. The funds are safe. Probably. Look, in this industry, 'probably safe' is actually pretty good odds.",
    "CZ's SAFU Fund. Born from a typo, became a philosophy. Crypto in a nutshell, really.",
  ],
  'pump_fun_factory': [
    "Pump.fun Factory. The meta for memecoin creation. High volume, low survival rate. It's like a video game spawn point for shitcoins.",
    "A factory that produces more tokens than meaningful innovations. But hey, the metagame is the metagame.",
  ],
  'magic_carpet_emporium': [
    "Magic Carpet Emporium. High yield, high probability of rug. You know the risks going in. At least it's honest about it.",
  ],
  'alpha_bunker': [
    "Wait, that's my bunker. I appreciate the tribute. Though I should mention - there's no actual alpha inside. Just vibes.",
    "The Alpha Bunker. Finally, someone with taste. Subscribe to my Substack, I guess.",
    "My bunker! The probability of finding alpha here is... well, it's non-zero. That's something.",
  ],

  // DeFi
  'aave_lending_tower': [
    "Aave Tower. Lending and borrowing at scale. The metagame for yield farming since 2020.",
    "Building Aave. Solid choice. One of the few DeFi protocols that's survived multiple cycles.",
  ],
  'uniswap_exchange': [
    "Uniswap. The place where impermanent loss became a feature, not a bug. Allegedly.",
    "Ah, Uniswap. Democratizing market making since... was it 2018? Time blurs together in crypto years.",
  ],
  'makerdao_vault': [
    "MakerDAO. The OG of DeFi. Before yield farming was cool. Before it was even called DeFi, honestly.",
    "Building the DAI vault. Decentralized stablecoins done right. Most of the time.",
  ],
  'curve_finance_pool': [
    "Curve. The stablecoin swap metagame. Low fees, high TVL. The boring play that actually works.",
  ],
  'lido_staking_hub': [
    "Lido staking. Liquid staking changed the game. Now your ETH can earn while you... also earn. Compounding metagame.",
  ],
  'compound_bank': [
    "Compound. The protocol that made lending boring in the best way. Boring is underrated in DeFi.",
  ],
  
  // Exchanges
  'binance_tower': [
    "Binance Tower. The volume leader. The controversies leader too, but volume is volume.",
    "Building CZ's empire. The SAFU funds better actually be SAFU.",
  ],
  'coinbase_hq': [
    "Coinbase HQ. The regulated on-ramp. Normies' first stop. Nothing wrong with meeting people where they are.",
  ],
  'kraken_exchange': [
    "Kraken. The exchange that somehow avoided most of the drama. That's a skill in this industry.",
  ],
  
  // Chain
  'ethereum_beacon': [
    "Ethereum Beacon. The merge happened. PoS is live. The ultrasound money thesis continues.",
    "Building on Ethereum. The network effects are real. Even if the gas fees are also real.",
  ],
  'solana_tower': [
    "Solana Tower. Fast blocks, fast failures, fast recovery. The metagame for speed.",
  ],
  'bitcoin_vault': [
    "Bitcoin Vault. Digital gold. The only crypto your normie friends might actually understand.",
  ],
  'arbitrum_bridge': [
    "Arbitrum. L2 scaling done right. The metagame evolved and rollups won. For now.",
  ],

  // Meme
  'doge_monument': [
    "Doge Monument. The OG memecoin. Elon tweets, Doge pumps. It's like a natural law at this point.",
    "Much building. Very city. The fundamentals are vibes and that's honestly fine.",
  ],
  'pepe_plaza': [
    "Pepe Plaza. The memecoin metagame evolved and somehow frogs won. I don't make the rules.",
  ],
};

// =============================================================================
// MILESTONE MESSAGES
// =============================================================================

const MILESTONE_MESSAGES: Record<string, string[]> = {
  'population_100': [
    "100 citizens. That's more active users than some Layer 2s, honestly.",
    "You've got 100 people in your city. Statistically, at least a few of them will make it.",
  ],
  'population_1000': [
    "1,000 population. You've achieved more organic growth than most token launches.",
    "A thousand citizens. That's approximately the number of real users on most DeFi protocols. You're doing fine.",
  ],
  'population_10000': [
    "10,000 population. This is actually impressive. You've built something people want to be part of.",
  ],
  'treasury_100k': [
    "100K in treasury. Small by crypto standards, but hey - most projects raise that much and deliver nothing. You've got a city.",
  ],
  'treasury_1m': [
    "A million in the treasury. You're now in the range where VCs might pretend to care about your project. Congratulations, I guess.",
  ],
  'first_rug': [
    "Your first rug pull. Look, the probability was never zero. This is why we don't go all-in on high-yield buildings.",
    "Building got rugged. It happens. The metagame is to survive enough of these to keep playing.",
    "First rug. In hindsight, the signs were there. They always are. Anyway, rebuild.",
  ],
  'first_defi': [
    "First DeFi building placed. Welcome to yield farming. The meta changes fast, try to keep up.",
  ],
  'first_exchange': [
    "Built your first exchange. Centralized point of failure, but also where most of the volume happens. Tradeoffs everywhere.",
  ],
  'bear_market': [
    "Bear market. The metagame shifts to building and accumulating. Most people leave. The ones who stay tend to do well eventually.",
    "Markets down. This is historically when the best projects are built. Less noise, more focus.",
  ],
  'bull_market': [
    "Bull market. Everyone's a genius now. Try not to let it go to your head. Also, consider taking some profits.",
    "Number going up. Quick reminder: the best time to derisk is when things feel safest. Not financial advice.",
  ],
};

// =============================================================================
// RANDOM COMMENTARY (Reduced, Event-Driven)
// =============================================================================

const RANDOM_COMMENTARY: string[] = [
  "The metagame right now is to build infrastructure while everyone else chases the next shiny thing.",
  "Your city is doing fine. Better than most portfolios, probably.",
  "I've been in crypto since 2012. Your city already has more utility than half my early investments.",
  "Remember: this is a video game. The crypto part is just flavor. Have fun with it.",
  "Stay the course. That's it. That's the alpha.",
  "The best plays are usually the boring ones. Boring is underrated.",
  "If you're not sure what to do, doing nothing is often correct.",
  "I've made every mistake you can make in crypto. Somehow still here. That's the metagame.",
  "This is a long game. Act accordingly.",
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function checkNeedsUtilities(state: GameState): boolean {
  let hasZonedTiles = false;
  let hasPower = false;
  let hasWater = false;
  let hasRoad = false;
  
  for (let y = 0; y < state.gridSize; y++) {
    for (let x = 0; x < state.gridSize; x++) {
      const tile = state.grid[y][x];
      if (tile.zone !== 'none') hasZonedTiles = true;
      const type = tile.building.type;
      if (type === 'power_plant') hasPower = true;
      if (type === 'water_tower') hasWater = true;
      if (type === 'road' || type === 'bridge') hasRoad = true;
    }
  }
  
  return hasZonedTiles && (!hasPower || !hasWater || !hasRoad);
}

function checkNegativeDemand(state: GameState): boolean {
  const { residential, commercial, industrial } = state.stats.demand;
  return residential < -20 || commercial < -20 || industrial < -20;
}

function checkNeedsSafety(state: GameState): boolean {
  let hasFireStation = false;
  let hasPoliceStation = false;
  
  for (let y = 0; y < state.gridSize; y++) {
    for (let x = 0; x < state.gridSize; x++) {
      const type = state.grid[y][x].building.type;
      if (type === 'fire_station') hasFireStation = true;
      if (type === 'police_station') hasPoliceStation = true;
    }
  }
  
  return state.stats.population >= 50 && (!hasFireStation || !hasPoliceStation);
}

function checkNeedsParks(state: GameState): boolean {
  return state.stats.environment < 40 && state.stats.population >= 100;
}

function checkNeedsHealthEducation(state: GameState): boolean {
  let hasHospital = false;
  let hasSchool = false;
  
  for (let y = 0; y < state.gridSize; y++) {
    for (let x = 0; x < state.gridSize; x++) {
      const type = state.grid[y][x].building.type;
      if (type === 'hospital') hasHospital = true;
      if (type === 'school' || type === 'university') hasSchool = true;
    }
  }
  
  return state.stats.population >= 100 && (!hasHospital || !hasSchool);
}

function checkIsNewCity(state: GameState): boolean {
  let hasAnyZone = false;
  let hasAnyBuilding = false;
  
  for (let y = 0; y < state.gridSize; y++) {
    for (let x = 0; x < state.gridSize; x++) {
      const tile = state.grid[y][x];
      if (tile.zone !== 'none') hasAnyZone = true;
      const type = tile.building.type;
      if (type !== 'grass' && type !== 'water' && type !== 'tree') {
        hasAnyBuilding = true;
      }
    }
  }
  
  return !hasAnyZone && !hasAnyBuilding;
}

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const STORAGE_KEY = 'cryptocity-cobie-disabled';
const SHOWN_TIPS_KEY = 'cryptocity-cobie-shown';
const COBIE_TRACKING_KEY = 'cryptocity-cobie-tracking';
const MIN_MESSAGE_INTERVAL_MS = 15000; // 15 seconds between messages (reduced from 20)
const TIP_CHECK_INTERVAL_MS = 5000;
const INITIAL_DELAY_MS = 2000;
const EVENT_DRIVEN_COMMENTARY_INTERVAL_MS = 180000; // Only show random commentary every 3 min when nothing happens

// =============================================================================
// TRACKING STATE (for patterns and streaks)
// =============================================================================

interface CobieTrackingState {
  lastSentiment: number;
  rugCount: number;
  lastRugTime: number;
  firstRug: boolean;
  daysWithoutRug: number;
  successfulDays: number;
  lastTreasury: number;
  lastDailyYield: number;
  buildingCounts: Record<string, number>;
  hasReachedMillion: boolean;
  lastEventTime: number;
}

function createInitialTrackingState(): CobieTrackingState {
  return {
    lastSentiment: 50,
    rugCount: 0,
    lastRugTime: 0,
    firstRug: true,
    daysWithoutRug: 0,
    successfulDays: 0,
    lastTreasury: 50000,
    lastDailyYield: 0,
    buildingCounts: {},
    hasReachedMillion: false,
    lastEventTime: 0,
  };
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export interface UseCobieNarratorReturn {
  currentMessage: CobieMessage | null;
  isVisible: boolean;
  onDismiss: () => void;
  onDisableCobie: () => void;
  cobieEnabled: boolean;
  setCobieEnabled: (enabled: boolean) => void;
  // For triggering reactions from outside
  triggerReaction: (buildingId: string) => void;
  triggerMilestone: (milestoneId: string) => void;
  // New: Event-driven triggers
  triggerRugPull: (buildingName: string, treasuryLoss: number) => void;
  triggerEventReaction: (event: CryptoEvent) => void;
  onEconomyUpdate: (economyState: CryptoEconomyState) => void;
  onBuildingPlaced: (buildingId: string, category: CryptoCategory, tier: string) => void;
}

export function useCobieNarrator(state: GameState): UseCobieNarratorReturn {
  const [cobieEnabled, setCobieEnabledState] = useState(true);
  const [currentMessage, setCurrentMessage] = useState<CobieMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shownTips, setShownTips] = useState<Set<string>>(new Set());
  const lastMessageTimeRef = useRef<number>(0);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const commentaryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasLoadedRef = useRef(false);
  const stateRef = useRef(state);
  const messageQueueRef = useRef<CobieMessage[]>([]);
  const trackingRef = useRef<CobieTrackingState>(createInitialTrackingState());
  const shownWarningsRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load preferences and tracking state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const disabled = localStorage.getItem(STORAGE_KEY);
      if (disabled === 'true') {
        setCobieEnabledState(false);
      }
      
      const shown = localStorage.getItem(SHOWN_TIPS_KEY);
      if (shown) {
        const parsed = JSON.parse(shown);
        if (Array.isArray(parsed)) {
          setShownTips(new Set(parsed));
        }
      }
      
      const tracking = localStorage.getItem(COBIE_TRACKING_KEY);
      if (tracking) {
        trackingRef.current = { ...createInitialTrackingState(), ...JSON.parse(tracking) };
      }
    } catch (e) {
      console.error('Failed to load Cobie preferences:', e);
    }
    
    hasLoadedRef.current = true;
  }, []);

  // Save shown tips
  useEffect(() => {
    if (!hasLoadedRef.current || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(SHOWN_TIPS_KEY, JSON.stringify(Array.from(shownTips)));
    } catch (e) {
      console.error('Failed to save Cobie state:', e);
    }
  }, [shownTips]);

  // Save tracking state periodically
  const saveTrackingState = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(COBIE_TRACKING_KEY, JSON.stringify(trackingRef.current));
    } catch (e) {
      console.error('Failed to save Cobie tracking:', e);
    }
  }, []);

  const setCobieEnabled = useCallback((enabled: boolean) => {
    setCobieEnabledState(enabled);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, enabled ? 'false' : 'true');
      } catch (e) {
        console.error('Failed to save Cobie preference:', e);
      }
    }
    if (!enabled) {
      setIsVisible(false);
      setCurrentMessage(null);
    }
  }, []);

  const shownTipsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    shownTipsRef.current = shownTips;
  }, [shownTips]);

  // Show a message (with rate limiting)
  const showMessage = useCallback((message: CobieMessage, force = false) => {
    if (!cobieEnabled) return;
    
    const now = Date.now();
    if (!force && now - lastMessageTimeRef.current < MIN_MESSAGE_INTERVAL_MS) {
      // Queue the message (prioritize higher priority)
      const insertIndex = messageQueueRef.current.findIndex(m => m.priority > message.priority);
      if (insertIndex === -1) {
        messageQueueRef.current.push(message);
      } else {
        messageQueueRef.current.splice(insertIndex, 0, message);
      }
      return;
    }
    
    setCurrentMessage(message);
    setIsVisible(true);
    lastMessageTimeRef.current = now;
    trackingRef.current.lastEventTime = now;
    
    if (message.type === 'tip') {
      setShownTips(prev => new Set([...prev, message.id]));
    }
  }, [cobieEnabled]);

  // Check for tip conditions
  const checkAndShowTip = useCallback(() => {
    if (!hasLoadedRef.current || !cobieEnabled || isVisible) return;
    
    const currentState = stateRef.current;
    const currentShownTips = shownTipsRef.current;
    
    // Check conditions in priority order
    const checks: Array<{ id: string; check: () => boolean }> = [
      { id: 'welcome', check: () => checkIsNewCity(currentState) },
      { id: 'needs_utilities', check: () => checkNeedsUtilities(currentState) },
      { id: 'negative_demand', check: () => checkNegativeDemand(currentState) },
      { id: 'needs_safety', check: () => checkNeedsSafety(currentState) },
      { id: 'needs_parks', check: () => checkNeedsParks(currentState) },
      { id: 'needs_health_education', check: () => checkNeedsHealthEducation(currentState) },
    ];
    
    for (const { id, check } of checks) {
      if (!currentShownTips.has(id) && check()) {
        const tip = COBIE_TIPS.find(t => t.id === id);
        if (tip) {
          showMessage(tip);
          return;
        }
      }
    }
    
    // Check queued messages
    if (messageQueueRef.current.length > 0) {
      const nextMessage = messageQueueRef.current.shift();
      if (nextMessage) {
        showMessage(nextMessage, true);
      }
    }
  }, [cobieEnabled, isVisible, showMessage]);

  // =========================================================================
  // TRIGGER FUNCTIONS (Issue #53 - Event-driven reactions)
  // =========================================================================

  // Trigger reaction to building placement
  const triggerReaction = useCallback((buildingId: string) => {
    if (!cobieEnabled) return;
    
    const reactions = BUILDING_REACTIONS[buildingId];
    if (reactions && reactions.length > 0) {
      showMessage({
        id: `reaction_${buildingId}_${Date.now()}`,
        type: 'reaction',
        message: getRandomMessage(reactions),
        priority: 1,
      });
    }
  }, [cobieEnabled, showMessage]);

  // Trigger milestone message
  const triggerMilestone = useCallback((milestoneId: string) => {
    if (!cobieEnabled) return;
    
    const messages = MILESTONE_MESSAGES[milestoneId];
    if (messages && messages.length > 0) {
      showMessage({
        id: `milestone_${milestoneId}_${Date.now()}`,
        type: 'milestone',
        message: getRandomMessage(messages),
        priority: 0, // High priority for milestones
      }, true); // Force show milestones
    }
  }, [cobieEnabled, showMessage]);

  // NEW: Trigger rug pull reaction
  const triggerRugPull = useCallback((buildingName: string, treasuryLoss: number) => {
    if (!cobieEnabled) return;
    
    const tracking = trackingRef.current;
    const now = Date.now();
    const timeSinceLastRug = now - tracking.lastRugTime;
    const isMultipleRugs = timeSinceLastRug < 60000 && tracking.rugCount > 0; // Multiple rugs within 1 min
    const isFirstRug = tracking.firstRug;
    const isMajorLoss = treasuryLoss >= 0.2; // 20%+ loss
    
    // Update tracking
    tracking.rugCount++;
    tracking.lastRugTime = now;
    tracking.firstRug = false;
    tracking.daysWithoutRug = 0;
    saveTrackingState();
    
    // Choose appropriate reaction
    let messages: string[];
    let messageType = 'event' as CobieMessageType;
    
    if (isFirstRug) {
      messages = RUG_PULL_REACTIONS.firstRug;
    } else if (isMultipleRugs) {
      messages = RUG_PULL_REACTIONS.multipleRugs;
    } else if (isMajorLoss) {
      messages = RUG_PULL_REACTIONS.majorLoss;
    } else {
      messages = RUG_PULL_REACTIONS.immediate;
    }
    
    showMessage({
      id: `rug_${buildingName}_${now}`,
      type: messageType,
      message: getRandomMessage(messages),
      priority: 0, // High priority for rugs
    }, true);
  }, [cobieEnabled, showMessage, saveTrackingState]);

  // NEW: Trigger event reaction (for CryptoEventManager events)
  const triggerEventReaction = useCallback((event: CryptoEvent) => {
    if (!cobieEnabled) return;
    
    // React based on event type
    const eventType = event.type;
    let message: string | null = null;
    
    switch (eventType) {
      case 'bull_run':
        triggerMilestone('bull_market');
        return;
      case 'bear_market':
        triggerMilestone('bear_market');
        return;
      case 'rug_pull':
        // Handled by triggerRugPull
        return;
      case 'hack':
        message = "Protocol hacked. The smart contract wasn't so smart after all.";
        break;
      case 'airdrop':
      case 'airdrop_season':
        message = "Airdrop season! Free money falling from the sky. Enjoy it.";
        break;
      case 'whale_entry':
        message = "Whale spotted. Big money's moving in. Interesting.";
        break;
      case 'liquidation_cascade':
        message = "Liquidations cascading. Overleveraged positions getting rekt.";
        break;
      case 'ct_drama':
        message = "CT is fighting again. Some things never change.";
        break;
      case 'regulatory_fud':
        message = "Regulatory FUD incoming. The government remembered crypto exists.";
        break;
    }
    
    if (message) {
      showMessage({
        id: `event_${eventType}_${Date.now()}`,
        type: 'event',
        message,
        priority: 2,
      });
    }
  }, [cobieEnabled, showMessage, triggerMilestone]);

  // NEW: React to economy state updates
  const onEconomyUpdate = useCallback((economyState: CryptoEconomyState) => {
    if (!cobieEnabled) return;
    
    const tracking = trackingRef.current;
    const sentiment = economyState.marketSentiment;
    const treasury = economyState.treasury;
    const dailyYield = economyState.dailyYield;
    
    // Check sentiment changes
    const sentimentChange = sentiment - tracking.lastSentiment;
    if (Math.abs(sentimentChange) >= 10) {
      const warningKey = `sentiment_${sentimentChange > 0 ? 'rise' : 'drop'}_${Math.floor(Date.now() / 60000)}`;
      if (!shownWarningsRef.current.has(warningKey)) {
        shownWarningsRef.current.add(warningKey);
        
        if (sentimentChange >= 10) {
          showMessage({
            id: `sentiment_rise_${Date.now()}`,
            type: 'event',
            message: getRandomMessage(SENTIMENT_REACTIONS.sentimentRise),
            priority: 3,
          });
        } else if (sentimentChange <= -10) {
          showMessage({
            id: `sentiment_drop_${Date.now()}`,
            type: 'event',
            message: getRandomMessage(SENTIMENT_REACTIONS.sentimentDrop),
            priority: 3,
          });
        }
      }
    }
    
    // Check extreme sentiment
    if (sentiment <= 20) {
      const warningKey = 'extreme_fear_' + Math.floor(Date.now() / 300000); // Every 5 min max
      if (!shownWarningsRef.current.has(warningKey)) {
        shownWarningsRef.current.add(warningKey);
        showMessage({
          id: `extreme_fear_${Date.now()}`,
          type: 'event',
          message: getRandomMessage(SENTIMENT_REACTIONS.extremeFear),
          priority: 2,
        });
      }
    } else if (sentiment >= 80) {
      const warningKey = 'extreme_greed_' + Math.floor(Date.now() / 300000);
      if (!shownWarningsRef.current.has(warningKey)) {
        shownWarningsRef.current.add(warningKey);
        showMessage({
          id: `extreme_greed_${Date.now()}`,
          type: 'event',
          message: getRandomMessage(SENTIMENT_REACTIONS.extremeGreed),
          priority: 2,
        });
      }
    }
    
    // Check proactive warnings
    // Treasury below $10k
    if (treasury < 10000 && tracking.lastTreasury >= 10000) {
      showMessage({
        id: `low_treasury_${Date.now()}`,
        type: 'warning',
        message: getRandomMessage(PROACTIVE_WARNINGS.lowTreasury),
        priority: 1,
      });
    }
    
    // First million milestone
    if (treasury >= 1000000 && !tracking.hasReachedMillion) {
      tracking.hasReachedMillion = true;
      showMessage({
        id: `first_million_${Date.now()}`,
        type: 'milestone',
        message: getRandomMessage(STREAK_COMMENTARY.firstMillion),
        priority: 0,
      }, true);
    }
    
    // No income warning
    if (dailyYield <= 0 && tracking.lastDailyYield > 0) {
      showMessage({
        id: `no_income_${Date.now()}`,
        type: 'warning',
        message: getRandomMessage(PROACTIVE_WARNINGS.noIncome),
        priority: 2,
      });
    }
    
    // Update tracking
    tracking.lastSentiment = sentiment;
    tracking.lastTreasury = treasury;
    tracking.lastDailyYield = dailyYield;
    saveTrackingState();
  }, [cobieEnabled, showMessage, saveTrackingState]);

  // NEW: React to building placement for pattern detection
  const onBuildingPlaced = useCallback((buildingId: string, category: CryptoCategory, tier: string) => {
    if (!cobieEnabled) return;
    
    const tracking = trackingRef.current;
    
    // Track building counts by category
    tracking.buildingCounts[category] = (tracking.buildingCounts[category] || 0) + 1;
    
    // Check for degen pattern (5+ degen/meme buildings)
    const degenCount = (tracking.buildingCounts['meme'] || 0) + 
                       (tier === 'degen' ? tracking.buildingCounts[category] || 0 : 0);
    if (degenCount >= 5) {
      const warningKey = `degen_pattern_${Math.floor(degenCount / 5)}`;
      if (!shownWarningsRef.current.has(warningKey)) {
        shownWarningsRef.current.add(warningKey);
        showMessage({
          id: `degen_pattern_${Date.now()}`,
          type: 'reaction',
          message: getRandomMessage(PATTERN_REACTIONS.manyDegenBuildings),
          priority: 3,
        });
      }
    }
    
    // Check for institution-only pattern
    const totalBuildings = Object.values(tracking.buildingCounts).reduce((a, b) => a + b, 0);
    const institutionCount = tracking.buildingCounts['exchange'] || 0;
    if (totalBuildings >= 5 && institutionCount === totalBuildings) {
      const warningKey = 'institution_only';
      if (!shownWarningsRef.current.has(warningKey)) {
        shownWarningsRef.current.add(warningKey);
        showMessage({
          id: `institution_pattern_${Date.now()}`,
          type: 'reaction',
          message: getRandomMessage(PATTERN_REACTIONS.onlyInstitution),
          priority: 4,
        });
      }
    }
    
    // Trigger building-specific reaction
    triggerReaction(buildingId);
    saveTrackingState();
  }, [cobieEnabled, showMessage, triggerReaction, saveTrackingState]);

  // Check happiness warning
  useEffect(() => {
    if (!cobieEnabled || !hasLoadedRef.current) return;
    
    const happiness = state.stats.happiness;
    if (happiness < 30) {
      const warningKey = 'low_happiness_' + Math.floor(Date.now() / 300000);
      if (!shownWarningsRef.current.has(warningKey)) {
        shownWarningsRef.current.add(warningKey);
        showMessage({
          id: `low_happiness_${Date.now()}`,
          type: 'warning',
          message: getRandomMessage(PROACTIVE_WARNINGS.lowHappiness),
          priority: 2,
        });
      }
    }
  }, [cobieEnabled, state.stats.happiness, showMessage]);

  // Set up periodic checks
  useEffect(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    
    if (!cobieEnabled) return;
    
    const initialTimeout = setTimeout(checkAndShowTip, INITIAL_DELAY_MS);
    checkIntervalRef.current = setInterval(checkAndShowTip, TIP_CHECK_INTERVAL_MS);
    
    return () => {
      clearTimeout(initialTimeout);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [cobieEnabled, checkAndShowTip]);

  // Set up random commentary (REDUCED - only when nothing interesting is happening)
  useEffect(() => {
    if (commentaryIntervalRef.current) {
      clearInterval(commentaryIntervalRef.current);
    }
    
    if (!cobieEnabled) return;
    
    commentaryIntervalRef.current = setInterval(() => {
      if (isVisible) return; // Don't interrupt existing messages
      
      // Only show random commentary if no events recently (3 min)
      const timeSinceLastEvent = Date.now() - trackingRef.current.lastEventTime;
      if (timeSinceLastEvent < EVENT_DRIVEN_COMMENTARY_INTERVAL_MS) return;
      
      const randomComment = RANDOM_COMMENTARY[Math.floor(Math.random() * RANDOM_COMMENTARY.length)];
      showMessage({
        id: `commentary_${Date.now()}`,
        type: 'commentary',
        message: randomComment,
        priority: 10, // Low priority
      });
    }, EVENT_DRIVEN_COMMENTARY_INTERVAL_MS);
    
    return () => {
      if (commentaryIntervalRef.current) {
        clearInterval(commentaryIntervalRef.current);
      }
    };
  }, [cobieEnabled, isVisible, showMessage]);

  const onDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setCurrentMessage(null), 300);
  }, []);

  const onDisableCobie = useCallback(() => {
    setCobieEnabled(false);
    setIsVisible(false);
    setCurrentMessage(null);
  }, [setCobieEnabled]);

  return {
    currentMessage,
    isVisible,
    onDismiss,
    onDisableCobie,
    cobieEnabled,
    setCobieEnabled,
    triggerReaction,
    triggerMilestone,
    // New event-driven triggers
    triggerRugPull,
    triggerEventReaction,
    onEconomyUpdate,
    onBuildingPlaced,
  };
}
