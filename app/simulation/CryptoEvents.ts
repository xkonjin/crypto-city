// =============================================================================
// CRYPTO EVENTS SYSTEM
// =============================================================================
// Manages dynamic events that affect the crypto city simulation.
// Events like bull runs, bear markets, airdrops, rug pulls, and hacks
// provide gameplay variety and authentic crypto culture flavor.
//
// Events are triggered by:
// - Random chance each tick
// - Building-specific triggers
// - Market sentiment conditions
// - Player actions

import {
  CryptoEvent,
  CryptoEventType,
  CryptoEconomyState,
  CryptoEffects,
  GridCell,
} from '../components/game/types';
import { CryptoBuildingDefinition } from '../data/cryptoBuildings';
import { analyzeCryptoBuildings } from './CryptoEconomy';

// =============================================================================
// EVENT DEFINITIONS
// =============================================================================

/**
 * Template for generating events
 */
interface EventTemplate {
  type: CryptoEventType;
  name: string;
  description: string;
  minDuration: number;      // Minimum ticks
  maxDuration: number;      // Maximum ticks
  isPositive: boolean;
  baseChance: number;       // Base probability per tick (0-1)
  effects: Partial<CryptoEffects>;
  sentimentShift: number;   // How much to shift sentiment
  treasuryImpact: number;   // Multiplier for treasury change
  conditions?: {            // Conditions for event to trigger
    minSentiment?: number;
    maxSentiment?: number;
    minBuildings?: number;
    requiredTiers?: string[];
    requiredCategories?: string[];
  };
}

/**
 * All event templates
 */
const EVENT_TEMPLATES: Record<CryptoEventType, EventTemplate> = {
  // ---------------------------------------------------------------------------
  // MARKET-WIDE EVENTS
  // ---------------------------------------------------------------------------
  bullRun: {
    type: 'bullRun',
    name: '🚀 Bull Run!',
    description: 'Markets are pumping! All yields doubled for a limited time.',
    minDuration: 12,
    maxDuration: 48,
    isPositive: true,
    baseChance: 0.002,
    effects: {
      yieldRate: 100,  // Added to all yields
      stakingBonus: 2.0,
    },
    sentimentShift: 20,
    treasuryImpact: 0,
    conditions: {
      minSentiment: 60,
    },
  },
  
  bearMarket: {
    type: 'bearMarket',
    name: '🐻 Bear Market',
    description: 'Markets are crashing. Yields reduced, sentiment tanking.',
    minDuration: 24,
    maxDuration: 72,
    isPositive: false,
    baseChance: 0.002,
    effects: {
      yieldRate: -50,  // Halved yields
      volatility: 0.5,
    },
    sentimentShift: -30,
    treasuryImpact: 0,
    conditions: {
      maxSentiment: 40,
    },
  },
  
  // ---------------------------------------------------------------------------
  // POSITIVE EVENTS
  // ---------------------------------------------------------------------------
  airdrop: {
    type: 'airdrop',
    name: '🎁 Airdrop!',
    description: 'A protocol just airdropped tokens to the city!',
    minDuration: 1,
    maxDuration: 1,
    isPositive: true,
    baseChance: 0.01,
    effects: {},
    sentimentShift: 5,
    treasuryImpact: 500,  // Bonus tokens
    conditions: {
      minBuildings: 3,
    },
  },
  
  protocolUpgrade: {
    type: 'protocolUpgrade',
    name: '⬆️ Protocol Upgrade',
    description: 'A major protocol just shipped an upgrade. Yields boosted!',
    minDuration: 24,
    maxDuration: 48,
    isPositive: true,
    baseChance: 0.003,
    effects: {
      yieldRate: 25,
      stakingBonus: 1.15,
    },
    sentimentShift: 10,
    treasuryImpact: 0,
    conditions: {
      requiredCategories: ['defi'],
    },
  },
  
  whaleEntry: {
    type: 'whaleEntry',
    name: '🐋 Whale Alert!',
    description: 'A whale just moved into the city! TVL and prestige soaring.',
    minDuration: 48,
    maxDuration: 96,
    isPositive: true,
    baseChance: 0.001,
    effects: {
      populationBoost: 50,
      prestigeBonus: 30,
    },
    sentimentShift: 15,
    treasuryImpact: 1000,
    conditions: {
      requiredTiers: ['institution', 'whale'],
    },
  },
  
  merge: {
    type: 'merge',
    name: '🔀 The Merge!',
    description: 'A historic protocol upgrade! Ethereum vibes in the city.',
    minDuration: 72,
    maxDuration: 168,
    isPositive: true,
    baseChance: 0.0005,
    effects: {
      yieldRate: 50,
      stakingBonus: 1.25,
      volatility: -0.2,
    },
    sentimentShift: 25,
    treasuryImpact: 2000,
    conditions: {
      requiredCategories: ['chain'],
    },
  },
  
  airdropSeason: {
    type: 'airdropSeason',
    name: '🌈 Airdrop Season!',
    description: 'Multiple protocols dropping tokens! The city is celebrating.',
    minDuration: 48,
    maxDuration: 120,
    isPositive: true,
    baseChance: 0.0008,
    effects: {
      airdropChance: 0.1,
      happinessEffect: 20,
    },
    sentimentShift: 20,
    treasuryImpact: 3000,
    conditions: {
      minBuildings: 10,
      minSentiment: 50,
    },
  },
  
  memeRally: {
    type: 'memeRally',
    name: '🐸 Meme Rally!',
    description: 'Pepe and friends are pumping! Meme buildings get boosted.',
    minDuration: 12,
    maxDuration: 36,
    isPositive: true,
    baseChance: 0.003,
    effects: {
      yieldRate: 50,
      happinessEffect: 15,
    },
    sentimentShift: 10,
    treasuryImpact: 200,
    conditions: {
      requiredCategories: ['meme'],
    },
  },
  
  // ---------------------------------------------------------------------------
  // NEGATIVE EVENTS
  // ---------------------------------------------------------------------------
  rugPull: {
    type: 'rugPull',
    name: '🔻 Rug Pull!',
    description: 'A project just rugged! Building disabled, treasury hit.',
    minDuration: 48,
    maxDuration: 168,
    isPositive: false,
    baseChance: 0.001,
    effects: {
      yieldRate: -100,  // Building yields nothing
    },
    sentimentShift: -25,
    treasuryImpact: -1000,
    conditions: {
      requiredTiers: ['degen'],
    },
  },
  
  hack: {
    type: 'hack',
    name: '💀 Exchange Hacked!',
    description: 'An exchange got exploited! Funds are not safu.',
    minDuration: 72,
    maxDuration: 168,
    isPositive: false,
    baseChance: 0.0008,
    effects: {
      yieldRate: -75,
      tradingFees: -100,
    },
    sentimentShift: -35,
    treasuryImpact: -2000,
    conditions: {
      requiredCategories: ['exchange'],
    },
  },
  
  ctDrama: {
    type: 'ctDrama',
    name: '🎭 CT Drama',
    description: 'Crypto Twitter is fighting again. Sentiment volatile.',
    minDuration: 6,
    maxDuration: 24,
    isPositive: false,
    baseChance: 0.005,
    effects: {
      volatility: 0.3,
      happinessEffect: -10,
    },
    sentimentShift: -10,
    treasuryImpact: 0,
    conditions: {
      requiredCategories: ['ct'],
    },
  },
  
  liquidation: {
    type: 'liquidation',
    name: '📉 Liquidation Cascade',
    description: 'Leveraged positions getting rekt. Chaos in the markets.',
    minDuration: 6,
    maxDuration: 24,
    isPositive: false,
    baseChance: 0.002,
    effects: {
      volatility: 0.5,
      yieldRate: -30,
    },
    sentimentShift: -20,
    treasuryImpact: -500,
    conditions: {
      maxSentiment: 35,
    },
  },
  
  halving: {
    type: 'halving',
    name: '⚡ Bitcoin Halving',
    description: 'Bitcoin rewards halved. Historically bullish long-term.',
    minDuration: 168,
    maxDuration: 336,
    isPositive: true,  // Net positive historically
    baseChance: 0.0002,
    effects: {
      volatility: 0.2,
      yieldRate: -10,  // Short term negative
      prestigeBonus: 20,
    },
    sentimentShift: 5,
    treasuryImpact: 0,
    conditions: {
      requiredCategories: ['chain'],
    },
  },
  
  regulatoryFUD: {
    type: 'regulatoryFUD',
    name: '⚖️ Regulatory FUD',
    description: 'Government crackdown rumors. Markets uncertain.',
    minDuration: 24,
    maxDuration: 72,
    isPositive: false,
    baseChance: 0.001,
    effects: {
      yieldRate: -20,
      volatility: 0.3,
      happinessEffect: -15,
    },
    sentimentShift: -15,
    treasuryImpact: -300,
    conditions: {
      minBuildings: 5,
    },
  },
};

// =============================================================================
// EVENT GENERATION
// =============================================================================

/**
 * Generate a unique event ID
 */
function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if conditions are met for an event
 */
function checkEventConditions(
  template: EventTemplate,
  state: CryptoEconomyState,
  buildings: CryptoBuildingDefinition[]
): boolean {
  const conditions = template.conditions;
  if (!conditions) return true;
  
  // Check sentiment conditions
  if (conditions.minSentiment !== undefined && state.marketSentiment < conditions.minSentiment) {
    return false;
  }
  if (conditions.maxSentiment !== undefined && state.marketSentiment > conditions.maxSentiment) {
    return false;
  }
  
  // Check building count
  if (conditions.minBuildings !== undefined && buildings.length < conditions.minBuildings) {
    return false;
  }
  
  // Check required tiers
  if (conditions.requiredTiers && conditions.requiredTiers.length > 0) {
    const hasRequiredTier = buildings.some(b => 
      conditions.requiredTiers!.includes(b.crypto.tier)
    );
    if (!hasRequiredTier) return false;
  }
  
  // Check required categories
  if (conditions.requiredCategories && conditions.requiredCategories.length > 0) {
    const hasRequiredCategory = buildings.some(b => 
      conditions.requiredCategories!.includes(b.category)
    );
    if (!hasRequiredCategory) return false;
  }
  
  return true;
}

/**
 * Try to trigger a random event based on current conditions
 *
 * @param state - Current economy state
 * @param grid - Game grid
 * @param currentTick - Current simulation tick
 * @returns New event if triggered, null otherwise
 */
export function tryTriggerEvent(
  state: CryptoEconomyState,
  grid: GridCell[][],
  currentTick: number
): CryptoEvent | null {
  const analysis = analyzeCryptoBuildings(grid);
  const buildings = analysis.buildings;
  
  // No events if no crypto buildings
  if (buildings.length === 0) return null;
  
  // Check each event type
  for (const [eventType, template] of Object.entries(EVENT_TEMPLATES)) {
    // Check conditions first
    if (!checkEventConditions(template, state, buildings)) {
      continue;
    }
    
    // Check building-specific triggers
    let adjustedChance = template.baseChance;
    
    // Buildings can increase event chances
    for (const building of buildings) {
      const effects = building.crypto.effects;
      
      // Airdrop chance stacks
      if (eventType === 'airdrop' && effects.airdropChance) {
        adjustedChance += effects.airdropChance;
      }
      
      // Drama chance from CT buildings
      if (eventType === 'ctDrama' && effects.dramaChance) {
        adjustedChance += effects.dramaChance;
      }
      
      // Rug risk from degen buildings
      if (eventType === 'rugPull' && effects.rugRisk) {
        adjustedChance += effects.rugRisk;
      }
      
      // Hack risk from exchanges
      if (eventType === 'hack' && effects.hackRisk) {
        adjustedChance += effects.hackRisk;
      }
    }
    
    // Roll the dice
    if (Math.random() < adjustedChance) {
      // Determine affected buildings
      const affectedBuildings = selectAffectedBuildings(template, buildings);
      
      // Calculate duration
      const duration = Math.floor(
        template.minDuration + Math.random() * (template.maxDuration - template.minDuration)
      );
      
      // Generate event
      const event: CryptoEvent = {
        id: generateEventId(),
        type: template.type,
        name: template.name,
        description: template.description,
        affectedBuildings: affectedBuildings.map(b => b.id),
        affectedChains: getAffectedChains(affectedBuildings),
        startTick: currentTick,
        duration,
        magnitude: 0.5 + Math.random() * 0.5,  // 0.5 to 1.0
        isPositive: template.isPositive,
        effects: template.effects,
      };
      
      return event;
    }
  }
  
  return null;
}

/**
 * Select which buildings are affected by an event
 */
function selectAffectedBuildings(
  template: EventTemplate,
  buildings: CryptoBuildingDefinition[]
): CryptoBuildingDefinition[] {
  const conditions = template.conditions;
  
  // For market-wide events, all buildings affected
  if (template.type === 'bullRun' || template.type === 'bearMarket') {
    return buildings;
  }
  
  // Filter by conditions
  let candidates = buildings;
  
  if (conditions?.requiredTiers) {
    candidates = candidates.filter(b => conditions.requiredTiers!.includes(b.crypto.tier));
  }
  
  if (conditions?.requiredCategories) {
    candidates = candidates.filter(b => conditions.requiredCategories!.includes(b.category));
  }
  
  // For negative events, pick 1-3 buildings
  if (!template.isPositive && candidates.length > 0) {
    const count = Math.min(candidates.length, 1 + Math.floor(Math.random() * 3));
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
  
  return candidates;
}

/**
 * Get unique chains from buildings
 */
function getAffectedChains(buildings: CryptoBuildingDefinition[]): string[] {
  const chains = new Set<string>();
  for (const building of buildings) {
    if (building.crypto.chain) {
      chains.add(building.crypto.chain);
    }
  }
  return Array.from(chains);
}

// =============================================================================
// EVENT PROCESSING
// =============================================================================

/**
 * Process active events - check for expiration, apply effects
 *
 * @param events - Currently active events
 * @param currentTick - Current simulation tick
 * @returns Updated array of still-active events
 */
export function processActiveEvents(
  events: CryptoEvent[],
  currentTick: number
): CryptoEvent[] {
  return events.filter(event => {
    const elapsed = currentTick - event.startTick;
    return elapsed < event.duration;
  });
}

/**
 * Calculate total effects from all active events
 *
 * @param events - Active events
 * @returns Combined effects
 */
export function calculateEventEffects(events: CryptoEvent[]): {
  yieldMultiplier: number;
  volatilityModifier: number;
  happinessModifier: number;
  sentimentShift: number;
} {
  let yieldMultiplier = 1.0;
  let volatilityModifier = 0;
  let happinessModifier = 0;
  let sentimentShift = 0;
  
  for (const event of events) {
    const effects = event.effects;
    const magnitude = event.magnitude;
    
    // Yield effects stack multiplicatively for positive, additively for negative
    if (effects.yieldRate) {
      if (effects.yieldRate > 0) {
        yieldMultiplier *= 1 + (effects.yieldRate / 100) * magnitude;
      } else {
        yieldMultiplier += (effects.yieldRate / 100) * magnitude;
      }
    }
    
    if (effects.stakingBonus) {
      yieldMultiplier *= effects.stakingBonus;
    }
    
    // Volatility stacks
    if (effects.volatility) {
      volatilityModifier += effects.volatility * magnitude;
    }
    
    // Happiness stacks
    if (effects.happinessEffect) {
      happinessModifier += effects.happinessEffect * magnitude;
    }
    
    // Get template for sentiment shift
    const template = EVENT_TEMPLATES[event.type];
    if (template) {
      sentimentShift += template.sentimentShift * magnitude;
    }
  }
  
  return {
    yieldMultiplier: Math.max(0.1, yieldMultiplier),  // Never go below 10%
    volatilityModifier,
    happinessModifier,
    sentimentShift,
  };
}

/**
 * Calculate treasury impact from events
 *
 * @param events - Newly triggered events this tick
 * @returns Total treasury change
 */
export function calculateTreasuryImpact(events: CryptoEvent[]): number {
  let total = 0;
  
  for (const event of events) {
    const template = EVENT_TEMPLATES[event.type];
    if (template) {
      total += template.treasuryImpact * event.magnitude;
    }
  }
  
  return Math.floor(total);
}

// =============================================================================
// EVENT UI HELPERS
// =============================================================================

/**
 * Get an icon for an event type
 */
export function getEventIcon(type: CryptoEventType): string {
  const icons: Record<CryptoEventType, string> = {
    bullRun: '🚀',
    bearMarket: '🐻',
    airdrop: '🎁',
    rugPull: '🔻',
    hack: '💀',
    protocolUpgrade: '⬆️',
    whaleEntry: '🐋',
    ctDrama: '🎭',
    liquidation: '📉',
    merge: '🔀',
    halving: '⚡',
    airdropSeason: '🌈',
    memeRally: '🐸',
    regulatoryFUD: '⚖️',
  };
  return icons[type] || '❓';
}

/**
 * Get a color for an event (positive = green, negative = red)
 */
export function getEventColor(isPositive: boolean): string {
  return isPositive ? '#00FF88' : '#FF4444';
}

/**
 * Format event duration for display
 */
export function formatEventDuration(remainingTicks: number, ticksPerHour: number = 1): string {
  const hours = remainingTicks / ticksPerHour;
  if (hours < 1) return 'Soon';
  if (hours < 24) return `${Math.ceil(hours)}h`;
  const days = hours / 24;
  return `${Math.ceil(days)}d`;
}

/**
 * Get event priority for sorting (higher = more important)
 */
export function getEventPriority(event: CryptoEvent): number {
  // Negative events are more urgent
  let priority = event.isPositive ? 0 : 50;
  
  // Magnitude increases priority
  priority += event.magnitude * 30;
  
  // Specific event type priorities
  const typePriority: Record<CryptoEventType, number> = {
    rugPull: 100,
    hack: 90,
    bullRun: 80,
    bearMarket: 75,
    whaleEntry: 60,
    airdropSeason: 55,
    merge: 50,
    liquidation: 70,
    airdrop: 40,
    protocolUpgrade: 35,
    ctDrama: 25,
    memeRally: 30,
    halving: 45,
    regulatoryFUD: 65,
  };
  
  priority += typePriority[event.type] || 0;
  
  return priority;
}

// =============================================================================
// EVENT HISTORY
// =============================================================================

/**
 * Maximum events to keep in history
 */
const MAX_EVENT_HISTORY = 50;

/**
 * Add an event to history, maintaining max size
 */
export function addToEventHistory(
  history: CryptoEvent[],
  event: CryptoEvent
): CryptoEvent[] {
  return [event, ...history].slice(0, MAX_EVENT_HISTORY);
}

/**
 * Get recent events of a specific type
 */
export function getRecentEventsByType(
  history: CryptoEvent[],
  type: CryptoEventType,
  count: number = 5
): CryptoEvent[] {
  return history.filter(e => e.type === type).slice(0, count);
}

/**
 * Calculate event statistics from history
 */
export function getEventStats(history: CryptoEvent[]): {
  total: number;
  positive: number;
  negative: number;
  byType: Record<string, number>;
} {
  const stats = {
    total: history.length,
    positive: 0,
    negative: 0,
    byType: {} as Record<string, number>,
  };
  
  for (const event of history) {
    if (event.isPositive) {
      stats.positive++;
    } else {
      stats.negative++;
    }
    stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
  }
  
  return stats;
}

