'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '@/types/game';

// Cobie message types
export type CobieMessageType = 
  | 'tip'           // General gameplay tips
  | 'reaction'      // Reaction to player actions
  | 'commentary'    // Periodic sardonic observations
  | 'milestone'     // Celebrating/mocking achievements
  | 'event';        // Reacting to crypto events

export interface CobieMessage {
  id: string;
  type: CobieMessageType;
  message: string;
  priority: number; // Lower = higher priority
}

// Cobie's sardonic tips (replacing generic tips)
// Voice: Self-deprecating, gaming metaphors, probabilistic thinking, self-aware absurdity
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

// Cobie's reactions to specific building placements
// Voice: References real events, probabilistic framing, self-aware humor
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

// Cobie's milestone commentary
// Voice: Probabilistic framing, self-deprecating, references to real crypto metrics
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

// Random periodic commentary
// Voice: Gaming metaphors, market observations, self-aware crypto humor, Cobie's famous sayings
const RANDOM_COMMENTARY: string[] = [
  // Core Cobie-isms
  "The metagame right now is to build infrastructure while everyone else chases the next shiny thing.",
  "Your city is doing fine. Better than most portfolios, probably.",
  "I've been in crypto since 2012. Your city already has more utility than half my early investments.",
  "Remember: this is a video game. The crypto part is just flavor. Have fun with it.",
  "Your citizens seem content. They're probably not on Twitter. Smart.",
  "Building during uncertain times is historically the right call. Historically.",
  "Every cycle, I tell people to take some risk off. Every cycle, they don't listen. Your call.",
  "This city has good bones. Which is more than I can say for most token projects.",
  "You're actually building something. That already puts you ahead of 95% of crypto.",
  "The probability of everything going right is low. The probability of learning something is high. Keep building.",
  "Nice city. The metagame is always changing but good fundamentals tend to survive.",
  "At least you're not panic selling during a dip. That's more discipline than most people have.",
  
  // Famous Cobie phrases
  "Stay the course. That's it. That's the alpha.",
  "The best plays are usually the boring ones. Boring is underrated.",
  "Everyone has a plan until they see their portfolio down 60%.",
  "If you're not sure what to do, doing nothing is often correct.",
  "The market is a machine for transferring money from the impatient to the patient.",
  
  // UpOnly podcast references
  "This reminds me of something we discussed on UpOnly. Can't remember what. The podcasts all blur together after a while.",
  "Ledger said something relevant on the show once. I think. Content creation is weird.",
  
  // Self-deprecating humor
  "I've made every mistake you can make in crypto. Somehow still here. That's the metagame.",
  "Don't ask me for financial advice. I once held through a 99% drawdown. By accident.",
  "My track record is public. Draw your own conclusions.",
  
  // Market observations
  "Retail is quiet. That's historically when you want to be building.",
  "CT is bullish. Historically, that's when you want to start thinking about exits. Historically.",
  "Everyone's calling for the cycle top. So we probably have more room to run. Or not. I don't know.",
  "The narrative changed again. Try to keep up. Or don't. The fundamentals rarely do.",
  
  // Gaming metaphors
  "You're playing the right game. Most people don't even know what game they're in.",
  "The current meta rewards builders. That usually changes, but enjoy it while it lasts.",
  "This is a long game. Act accordingly.",
];

// Check functions for tips
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

const STORAGE_KEY = 'cryptocity-cobie-disabled';
const SHOWN_TIPS_KEY = 'cryptocity-cobie-shown';
const MIN_MESSAGE_INTERVAL_MS = 20000; // 20 seconds between messages
const TIP_CHECK_INTERVAL_MS = 5000;
const INITIAL_DELAY_MS = 2000;
const COMMENTARY_INTERVAL_MS = 120000; // Random commentary every 2 minutes

interface UseCobieNarratorReturn {
  currentMessage: CobieMessage | null;
  isVisible: boolean;
  onDismiss: () => void;
  onDisableCobie: () => void;
  cobieEnabled: boolean;
  setCobieEnabled: (enabled: boolean) => void;
  // For triggering reactions from outside
  triggerReaction: (buildingId: string) => void;
  triggerMilestone: (milestoneId: string) => void;
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
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load preferences
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
      // Queue the message
      messageQueueRef.current.push(message);
      return;
    }
    
    setCurrentMessage(message);
    setIsVisible(true);
    lastMessageTimeRef.current = now;
    
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

  // Trigger reaction to building placement
  const triggerReaction = useCallback((buildingId: string) => {
    if (!cobieEnabled) return;
    
    const reactions = BUILDING_REACTIONS[buildingId];
    if (reactions && reactions.length > 0) {
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      showMessage({
        id: `reaction_${buildingId}_${Date.now()}`,
        type: 'reaction',
        message: randomReaction,
        priority: 1,
      });
    }
  }, [cobieEnabled, showMessage]);

  // Trigger milestone message
  const triggerMilestone = useCallback((milestoneId: string) => {
    if (!cobieEnabled) return;
    
    const messages = MILESTONE_MESSAGES[milestoneId];
    if (messages && messages.length > 0) {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      showMessage({
        id: `milestone_${milestoneId}_${Date.now()}`,
        type: 'milestone',
        message: randomMessage,
        priority: 0, // High priority for milestones
      }, true); // Force show milestones
    }
  }, [cobieEnabled, showMessage]);

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

  // Set up random commentary
  useEffect(() => {
    if (commentaryIntervalRef.current) {
      clearInterval(commentaryIntervalRef.current);
    }
    
    if (!cobieEnabled) return;
    
    commentaryIntervalRef.current = setInterval(() => {
      if (isVisible) return; // Don't interrupt existing messages
      
      const randomComment = RANDOM_COMMENTARY[Math.floor(Math.random() * RANDOM_COMMENTARY.length)];
      showMessage({
        id: `commentary_${Date.now()}`,
        type: 'commentary',
        message: randomComment,
        priority: 10, // Low priority
      });
    }, COMMENTARY_INTERVAL_MS);
    
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
  };
}
