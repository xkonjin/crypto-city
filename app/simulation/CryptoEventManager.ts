// =============================================================================
// CRYPTO EVENT MANAGER
// =============================================================================
// Manages all crypto-themed events in the city simulation.
// Events can be triggered randomly based on building types, market conditions,
// or manually triggered by game mechanics.
//
// Event Types:
// - Market events: Bull runs, bear markets, meme rallies
// - Protocol events: Airdrops, upgrades, hacks, rug pulls
// - Culture events: CT drama, whale entries, liquidations
//
// Events have durations, effects, and can stack with each other.
// The news ticker displays active events to the player.

import { 
  CryptoEvent, 
  CryptoEventType, 
  CryptoEffects,
  CryptoTier,
} from '../components/game/types';
import { 
  CryptoEconomyManager, 
  PlacedCryptoBuilding 
} from './CryptoEconomyManager';

// =============================================================================
// EVENT DEFINITIONS
// =============================================================================
// Templates for each event type with base values

/**
 * Template for creating events of each type
 */
interface EventTemplate {
  type: CryptoEventType;
  names: string[];                // Possible display names (randomly selected)
  descriptions: string[];         // Possible descriptions
  baseDuration: number;           // Base duration in ticks
  durationVariance: number;       // Random variance +/- this amount
  baseMagnitude: number;          // Base effect strength (0-1)
  isPositive: boolean;            // Is this good for the city?
  baseEffects: Partial<CryptoEffects>;  // Effects to apply
  triggerChance: number;          // Base chance per tick (0-1)
  requiredSentiment?: number;     // Minimum sentiment to trigger (if any)
  requiredTier?: CryptoTier;      // Required building tier to trigger
  requiredCategory?: string;      // Required building category to trigger
}

/**
 * All event templates - these define the possible events
 */
const EVENT_TEMPLATES: Record<CryptoEventType, EventTemplate> = {
  // ---------------------------------------------------------------------------
  // MARKET CYCLE EVENTS
  // ---------------------------------------------------------------------------
  
  bullRun: {
    type: 'bullRun',
    names: [
      '🚀 Bull Run Activated!',
      '📈 Market Mooning!',
      '💹 Green Candles Everywhere!',
      '🐂 The Bulls Are Running!',
    ],
    descriptions: [
      'WAGMI! Everything is pumping!',
      'Number go up technology activated.',
      'CT is euphoric. Lambos when?',
      'Your portfolio is finally recovering.',
    ],
    baseDuration: 5,
    durationVariance: 2,
    baseMagnitude: 0.8,
    isPositive: true,
    baseEffects: {
      yieldRate: 100,           // 100% bonus yield
      happinessEffect: 30,
      volatility: 0.3,
    },
    triggerChance: 0.02,
    requiredSentiment: 70,      // Only triggers when sentiment > 70
  },

  bearMarket: {
    type: 'bearMarket',
    names: [
      '🐻 Bear Market Incoming!',
      '📉 Crypto Winter Begins',
      '❄️ The Winter is Here',
      '💀 Bear Szn Activated',
    ],
    descriptions: [
      'Time to HODL. This too shall pass.',
      'Paper hands getting shaken out.',
      'DCA opportunity or catching knives?',
      'The weak hands are selling.',
    ],
    baseDuration: 7,
    durationVariance: 3,
    baseMagnitude: 0.7,
    isPositive: false,
    baseEffects: {
      yieldRate: -50,           // 50% reduced yield
      happinessEffect: -25,
      volatility: 0.4,
    },
    triggerChance: 0.02,
    requiredSentiment: -70,     // Only triggers when sentiment < -70
  },

  memeRally: {
    type: 'memeRally',
    names: [
      '🐸 Meme Season Begins!',
      '🦍 Apes Together Strong!',
      '💎 Diamond Hands Activated!',
      '🌙 Meme Coins Mooning!',
    ],
    descriptions: [
      'Pepe is pumping. Wojak is crying (happy tears).',
      'Degen szn. Touch grass later.',
      'The memes are making money.',
      'Your shitcoins are outperforming BTC.',
    ],
    baseDuration: 3,
    durationVariance: 2,
    baseMagnitude: 0.9,
    isPositive: true,
    baseEffects: {
      yieldRate: 200,           // 200% bonus for meme buildings
      volatility: 0.6,
      airdropChance: 0.05,
    },
    triggerChance: 0.015,
    requiredSentiment: 50,
    requiredCategory: 'meme',
  },

  // ---------------------------------------------------------------------------
  // PROTOCOL EVENTS
  // ---------------------------------------------------------------------------

  airdrop: {
    type: 'airdrop',
    names: [
      '🪂 Airdrop Incoming!',
      '🎁 Free Money Alert!',
      '💰 Token Claim Live!',
      '🎉 Airdrop Szn!',
    ],
    descriptions: [
      'Check your wallets! Free tokens!',
      'The protocol is rewarding its users.',
      'Early users getting paid.',
      'This is why we farm.',
    ],
    baseDuration: 1,            // Instant
    durationVariance: 0,
    baseMagnitude: 1.0,
    isPositive: true,
    baseEffects: {
      airdropChance: 0.0,       // Effect is treasury boost, not recurring
    },
    triggerChance: 0.01,
  },

  protocolUpgrade: {
    type: 'protocolUpgrade',
    names: [
      '⬆️ Protocol Upgrade!',
      '🔧 V2 is Live!',
      '🚀 Major Update Released!',
      '✨ New Features Deployed!',
    ],
    descriptions: [
      'Better yields, better features.',
      'The devs are actually building.',
      'Roadmap delivery detected.',
      'This is alpha.',
    ],
    baseDuration: 3,
    durationVariance: 1,
    baseMagnitude: 0.6,
    isPositive: true,
    baseEffects: {
      yieldRate: 30,
      happinessEffect: 10,
      upgradeChance: 0.0,
    },
    triggerChance: 0.008,
    requiredCategory: 'defi',
  },

  rugPull: {
    type: 'rugPull',
    names: [
      '🔴 RUG PULL ALERT!',
      '💀 FUNDS ARE NOT SAFU!',
      '🚨 SCAM DETECTED!',
      '⚠️ DEV DID AN EXIT!',
    ],
    descriptions: [
      'The devs have abandoned the project.',
      'Liquidity pulled. Wallets drained.',
      'Another day, another rug.',
      'This is why we can\'t have nice things.',
    ],
    baseDuration: 999,          // Permanent (building disabled)
    durationVariance: 0,
    baseMagnitude: 1.0,
    isPositive: false,
    baseEffects: {
      rugRisk: 0.0,             // Effect is building disable
      happinessEffect: -50,
    },
    triggerChance: 0.002,
    requiredTier: 'degen',
  },

  hack: {
    type: 'hack',
    names: [
      '🔓 PROTOCOL HACKED!',
      '💻 EXPLOIT DETECTED!',
      '🚨 SECURITY BREACH!',
      '🦹 FUNDS COMPROMISED!',
    ],
    descriptions: [
      'Hackers drained the protocol.',
      'Smart contract exploit found.',
      'White hat or black hat? TBD.',
      'The bridge got bridged.',
    ],
    baseDuration: 5,
    durationVariance: 2,
    baseMagnitude: 0.8,
    isPositive: false,
    baseEffects: {
      hackRisk: 0.0,
      happinessEffect: -30,
    },
    triggerChance: 0.003,
    requiredCategory: 'exchange',
  },

  // ---------------------------------------------------------------------------
  // CULTURE EVENTS
  // ---------------------------------------------------------------------------

  whaleEntry: {
    type: 'whaleEntry',
    names: [
      '🐋 Whale Sighting!',
      '💰 Big Money Entering!',
      '📊 Institutional Buy!',
      '👀 Smart Money Moving!',
    ],
    descriptions: [
      'A whale just entered the city.',
      'Someone with deep pockets is buying.',
      'The smart money is accumulating.',
      'Watch the on-chain data.',
    ],
    baseDuration: 4,
    durationVariance: 2,
    baseMagnitude: 0.7,
    isPositive: true,
    baseEffects: {
      populationBoost: 50,
      prestigeBonus: 20,
      yieldRate: 20,
    },
    triggerChance: 0.01,
    requiredSentiment: 30,
  },

  ctDrama: {
    type: 'ctDrama',
    names: [
      '🍿 CT Drama Alert!',
      '🔥 Twitter Beef!',
      '💬 Influencer Feud!',
      '📱 Ratio Watch!',
    ],
    descriptions: [
      'Two influencers are fighting.',
      'CT is choosing sides.',
      'The timeline is on fire.',
      'Grab your popcorn.',
    ],
    baseDuration: 2,
    durationVariance: 1,
    baseMagnitude: 0.5,
    isPositive: false,       // Neutral really, but adds chaos
    baseEffects: {
      volatility: 0.3,
      dramaChance: 0.0,
      happinessEffect: -10,
    },
    triggerChance: 0.02,
    requiredCategory: 'ct',
  },

  liquidation: {
    type: 'liquidation',
    names: [
      '💥 LIQUIDATION CASCADE!',
      '📉 REKT!',
      '🔴 POSITIONS BLOWN!',
      '⚡ MARGIN CALLED!',
    ],
    descriptions: [
      'Leveraged traders getting liquidated.',
      'The cascade has begun.',
      '$100M in longs just got rekt.',
      'Funding rate says hello.',
    ],
    baseDuration: 1,
    durationVariance: 0,
    baseMagnitude: 0.9,
    isPositive: false,
    baseEffects: {
      volatility: 0.5,
      happinessEffect: -40,
    },
    triggerChance: 0.005,
    requiredCategory: 'defi',
  },

  merge: {
    type: 'merge',
    names: [
      '🔀 The Merge is Complete!',
      '⚡ Protocol Milestone!',
      '🎯 Roadmap Achieved!',
      '🏆 Major Upgrade Success!',
    ],
    descriptions: [
      'A historic moment for the ecosystem.',
      'Years of development paying off.',
      'The community celebrates.',
      'This changes everything.',
    ],
    baseDuration: 7,
    durationVariance: 3,
    baseMagnitude: 1.0,
    isPositive: true,
    baseEffects: {
      yieldRate: 50,
      stakingBonus: 0.2,
      happinessEffect: 40,
      prestigeBonus: 30,
    },
    triggerChance: 0.001,       // Rare
    requiredCategory: 'chain',
  },

  halving: {
    type: 'halving',
    names: [
      '⛏️ The Halving is Here!',
      '📊 Block Reward Cut!',
      '💎 Scarcity Increased!',
      '🔶 Bitcoin Halving!',
    ],
    descriptions: [
      'Stock-to-flow intensifies.',
      'Supply shock incoming.',
      'The 4-year cycle continues.',
      'Historically bullish.',
    ],
    baseDuration: 10,
    durationVariance: 0,
    baseMagnitude: 1.0,
    isPositive: true,
    baseEffects: {
      yieldRate: -30,           // Less mining yield but...
      prestigeBonus: 50,        // More prestige
      happinessEffect: 20,
    },
    triggerChance: 0.0005,      // Very rare
  },

  airdropSeason: {
    type: 'airdropSeason',
    names: [
      '🎊 Airdrop Season!',
      '🪂 Multiple Airdrops!',
      '💸 Free Money Everywhere!',
      '🎁 Claims are Live!',
    ],
    descriptions: [
      'Every protocol is dropping tokens.',
      'The farmers are getting rich.',
      'Check all your wallets.',
      'This is peak airdrop szn.',
    ],
    baseDuration: 5,
    durationVariance: 2,
    baseMagnitude: 0.9,
    isPositive: true,
    baseEffects: {
      airdropChance: 0.1,
      happinessEffect: 35,
    },
    triggerChance: 0.003,
    requiredSentiment: 40,
  },

  regulatoryFUD: {
    type: 'regulatoryFUD',
    names: [
      '⚖️ Regulatory FUD!',
      '🏛️ SEC Coming!',
      '📋 Compliance Concerns!',
      '🚨 Government Action!',
    ],
    descriptions: [
      'The regulators are looking.',
      'CEXes might delist.',
      'Not your keys, not your coins.',
      'This is why we decentralize.',
    ],
    baseDuration: 4,
    durationVariance: 2,
    baseMagnitude: 0.7,
    isPositive: false,
    baseEffects: {
      yieldRate: -40,
      happinessEffect: -25,
      volatility: 0.3,
    },
    triggerChance: 0.008,
    requiredCategory: 'exchange',
  },
};

// =============================================================================
// CRYPTO EVENT MANAGER CLASS
// =============================================================================

export class CryptoEventManager {
  // Reference to economy manager (for checking state)
  private economyManager: CryptoEconomyManager;
  
  // Currently active events
  private activeEvents: Map<string, CryptoEvent> = new Map();
  
  // Event history for news ticker
  private eventHistory: CryptoEvent[] = [];
  
  // Maximum history to keep
  private maxHistoryLength: number = 50;
  
  // Event ID counter
  private eventIdCounter: number = 0;
  
  // Callbacks for UI updates
  private onEventStart?: (event: CryptoEvent) => void;
  private onEventEnd?: (event: CryptoEvent) => void;
  private onAirdrop?: (amount: number, buildingId?: string) => void;

  // ---------------------------------------------------------------------------
  // CONSTRUCTOR
  // ---------------------------------------------------------------------------

  constructor(economyManager: CryptoEconomyManager) {
    this.economyManager = economyManager;
  }

  // ---------------------------------------------------------------------------
  // EVENT CALLBACKS
  // ---------------------------------------------------------------------------

  /**
   * Register callback for when events start
   */
  onEventStarted(callback: (event: CryptoEvent) => void): void {
    this.onEventStart = callback;
  }

  /**
   * Register callback for when events end
   */
  onEventEnded(callback: (event: CryptoEvent) => void): void {
    this.onEventEnd = callback;
  }

  /**
   * Register callback for airdrops
   */
  onAirdropReceived(callback: (amount: number, buildingId?: string) => void): void {
    this.onAirdrop = callback;
  }

  // ---------------------------------------------------------------------------
  // STATE ACCESSORS
  // ---------------------------------------------------------------------------

  /**
   * Get all currently active events
   */
  getActiveEvents(): CryptoEvent[] {
    return Array.from(this.activeEvents.values());
  }

  /**
   * Get recent event history for news ticker
   */
  getEventHistory(limit: number = 10): CryptoEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Check if a specific event type is currently active
   */
  isEventActive(type: CryptoEventType): boolean {
    return Array.from(this.activeEvents.values())
      .some(e => e.type === type);
  }

  /**
   * Get the current combined effects from all active events
   */
  getCombinedEventEffects(): Partial<CryptoEffects> {
    const combined: Partial<CryptoEffects> = {};

    for (const event of this.activeEvents.values()) {
      for (const [key, value] of Object.entries(event.effects)) {
        const typedKey = key as keyof CryptoEffects;
        // Only combine numeric effects, skip arrays (chainSynergy, categorySynergy)
        if (typeof value === 'number' && typeof combined[typedKey] !== 'object') {
          (combined as Record<string, number>)[typedKey] = ((combined[typedKey] as number) || 0) + value;
        }
      }
    }

    return combined;
  }

  // ---------------------------------------------------------------------------
  // EVENT CREATION
  // ---------------------------------------------------------------------------

  /**
   * Create a new event from a template
   */
  private createEvent(
    template: EventTemplate,
    affectedBuildings: string[] = [],
    affectedChains: string[] = []
  ): CryptoEvent {
    const id = `event_${++this.eventIdCounter}`;
    const currentTick = this.economyManager.getCurrentTick();

    // Random selection of name and description
    const name = template.names[Math.floor(Math.random() * template.names.length)];
    const description = template.descriptions[
      Math.floor(Math.random() * template.descriptions.length)
    ];

    // Calculate duration with variance
    const duration = template.baseDuration + 
      Math.floor((Math.random() - 0.5) * 2 * template.durationVariance);

    // Calculate magnitude (can vary slightly)
    const magnitude = template.baseMagnitude * (0.8 + Math.random() * 0.4);

    // Scale effects by magnitude
    const scaledEffects: Partial<CryptoEffects> = {};
    for (const [key, value] of Object.entries(template.baseEffects)) {
      // Only scale numeric effects, skip arrays (chainSynergy, categorySynergy)
      if (typeof value === 'number') {
        (scaledEffects as Record<string, number>)[key] = value * magnitude;
      }
    }

    return {
      id,
      type: template.type,
      name,
      description,
      affectedBuildings,
      affectedChains,
      startTick: currentTick,
      duration,
      magnitude,
      isPositive: template.isPositive,
      effects: scaledEffects,
    };
  }

  /**
   * Start a new event
   */
  private startEvent(event: CryptoEvent): void {
    this.activeEvents.set(event.id, event);
    this.eventHistory.push(event);

    // Trim history if needed
    if (this.eventHistory.length > this.maxHistoryLength) {
      this.eventHistory.shift();
    }

    // Notify listeners
    if (this.onEventStart) {
      this.onEventStart(event);
    }

    // Handle special event effects
    this.handleEventStart(event);
  }

  /**
   * Handle special actions when an event starts
   */
  private handleEventStart(event: CryptoEvent): void {
    switch (event.type) {
      case 'airdrop':
      case 'airdropSeason':
        // Give treasury bonus
        const airdropAmount = 100 * event.magnitude * 
          (1 + this.economyManager.getPlacedBuildings().length * 0.1);
        this.economyManager.addToTreasury(airdropAmount, `Airdrop: ${event.name}`);
        if (this.onAirdrop) {
          this.onAirdrop(airdropAmount);
        }
        break;

      case 'rugPull':
        // Disable the affected building
        if (event.affectedBuildings.length > 0) {
          const [buildingKey] = event.affectedBuildings;
          const [x, y] = buildingKey.split(',').map(Number);
          this.economyManager.disableBuilding(x, y);
          // Treasury loss
          this.economyManager.removeFromTreasury(
            500 * event.magnitude, 
            `Rug pull loss: ${event.name}`
          );
        }
        break;

      case 'hack':
        // Temporarily disable affected buildings and treasury loss
        const hackLoss = 200 * event.magnitude * event.affectedBuildings.length;
        this.economyManager.removeFromTreasury(hackLoss, `Hack loss: ${event.name}`);
        for (const buildingKey of event.affectedBuildings) {
          const [x, y] = buildingKey.split(',').map(Number);
          this.economyManager.disableBuilding(x, y);
        }
        break;

      case 'bullRun':
      case 'bearMarket':
        // Shift sentiment
        const sentimentShift = event.type === 'bullRun' ? 30 : -30;
        this.economyManager.shiftSentiment(sentimentShift * event.magnitude);
        break;

      case 'whaleEntry':
        // Treasury bonus from whale
        const whaleBonus = 150 * event.magnitude;
        this.economyManager.addToTreasury(whaleBonus, `Whale investment`);
        break;

      case 'liquidation':
        // Treasury loss from cascading liquidations
        const liqLoss = 100 * event.magnitude;
        this.economyManager.removeFromTreasury(liqLoss, `Liquidation cascade`);
        this.economyManager.shiftSentiment(-20 * event.magnitude);
        break;
    }
  }

  /**
   * End an event
   */
  private endEvent(event: CryptoEvent): void {
    this.activeEvents.delete(event.id);

    // Notify listeners
    if (this.onEventEnd) {
      this.onEventEnd(event);
    }

    // Handle cleanup
    this.handleEventEnd(event);
  }

  /**
   * Handle special actions when an event ends
   */
  private handleEventEnd(event: CryptoEvent): void {
    switch (event.type) {
      case 'hack':
        // Re-enable buildings after hack recovery
        for (const buildingKey of event.affectedBuildings) {
          const [x, y] = buildingKey.split(',').map(Number);
          this.economyManager.enableBuilding(x, y);
        }
        break;

      // Rug pulls are permanent - no cleanup
    }
  }

  // ---------------------------------------------------------------------------
  // EVENT TRIGGERING
  // ---------------------------------------------------------------------------

  /**
   * Check if an event should trigger this tick
   */
  private shouldTriggerEvent(template: EventTemplate): boolean {
    // Check sentiment requirement
    if (template.requiredSentiment !== undefined) {
      const sentiment = this.economyManager.getSentiment();
      if (template.requiredSentiment > 0 && sentiment < template.requiredSentiment) {
        return false;
      }
      if (template.requiredSentiment < 0 && sentiment > template.requiredSentiment) {
        return false;
      }
    }

    // Check if event type is already active (prevent stacking same event)
    if (this.isEventActive(template.type)) {
      return false;
    }

    // Check required buildings exist
    const buildings = this.economyManager.getPlacedBuildings();
    
    if (template.requiredTier) {
      const hasRequiredTier = buildings.some(
        b => b.definition.crypto.tier === template.requiredTier && b.isActive
      );
      if (!hasRequiredTier) {
        return false;
      }
    }

    if (template.requiredCategory) {
      const hasRequiredCategory = buildings.some(
        b => b.definition.category === template.requiredCategory && b.isActive
      );
      if (!hasRequiredCategory) {
        return false;
      }
    }

    // Roll for event trigger
    const roll = Math.random();
    return roll < template.triggerChance;
  }

  /**
   * Get buildings that match event requirements
   */
  private getMatchingBuildings(template: EventTemplate): PlacedCryptoBuilding[] {
    const buildings = this.economyManager.getPlacedBuildings();
    
    return buildings.filter(b => {
      if (!b.isActive) return false;
      
      if (template.requiredTier && b.definition.crypto.tier !== template.requiredTier) {
        return false;
      }
      
      if (template.requiredCategory && b.definition.category !== template.requiredCategory) {
        return false;
      }
      
      return true;
    });
  }

  // ---------------------------------------------------------------------------
  // SIMULATION TICK
  // ---------------------------------------------------------------------------

  /**
   * Run one tick of event simulation
   * Call this after CryptoEconomyManager.tick()
   */
  tick(): {
    newEvents: CryptoEvent[];
    endedEvents: CryptoEvent[];
  } {
    const currentTick = this.economyManager.getCurrentTick();
    const newEvents: CryptoEvent[] = [];
    const endedEvents: CryptoEvent[] = [];

    // Check for event endings
    for (const event of this.activeEvents.values()) {
      const eventAge = currentTick - event.startTick;
      if (eventAge >= event.duration) {
        endedEvents.push(event);
        this.endEvent(event);
      }
    }

    // Check for new events
    for (const template of Object.values(EVENT_TEMPLATES)) {
      if (this.shouldTriggerEvent(template)) {
        const matchingBuildings = this.getMatchingBuildings(template);
        
        // For building-specific events, pick a random target
        let affectedBuildings: string[] = [];
        let affectedChains: string[] = [];

        if (matchingBuildings.length > 0) {
          if (template.type === 'rugPull' || template.type === 'hack') {
            // Pick one building to affect
            const target = matchingBuildings[
              Math.floor(Math.random() * matchingBuildings.length)
            ];
            affectedBuildings = [`${target.gridX},${target.gridY}`];
            if (target.definition.crypto.chain) {
              affectedChains = [target.definition.crypto.chain];
            }
          } else if (template.requiredCategory) {
            // Affect all matching buildings in category
            affectedBuildings = matchingBuildings.map(b => `${b.gridX},${b.gridY}`);
            affectedChains = [...new Set(
              matchingBuildings
                .map(b => b.definition.crypto.chain)
                .filter(Boolean) as string[]
            )];
          }
        }

        const event = this.createEvent(template, affectedBuildings, affectedChains);
        this.startEvent(event);
        newEvents.push(event);
      }
    }

    // Also check per-building airdrop chances
    this.checkBuildingAirdrops();

    return { newEvents, endedEvents };
  }

  /**
   * Check each building's individual airdrop chance
   */
  private checkBuildingAirdrops(): void {
    for (const building of this.economyManager.getPlacedBuildings()) {
      if (!building.isActive) continue;

      const airdropChance = building.definition.crypto.effects.airdropChance || 0;
      
      // Apply event modifiers
      const eventEffects = this.getCombinedEventEffects();
      const totalChance = airdropChance + (eventEffects.airdropChance || 0);

      if (Math.random() < totalChance) {
        // Mini airdrop from this building
        const amount = 10 + Math.random() * 40; // 10-50 tokens
        this.economyManager.addToTreasury(amount, `Airdrop from ${building.definition.name}`);
        
        if (this.onAirdrop) {
          this.onAirdrop(amount, building.buildingId);
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // MANUAL EVENT TRIGGERS
  // ---------------------------------------------------------------------------

  /**
   * Manually trigger a specific event type
   * Used for testing or scripted events
   */
  triggerEvent(
    type: CryptoEventType, 
    affectedBuildings?: string[],
    affectedChains?: string[]
  ): CryptoEvent | null {
    const template = EVENT_TEMPLATES[type];
    if (!template) {
      console.warn(`Unknown event type: ${type}`);
      return null;
    }

    const event = this.createEvent(
      template, 
      affectedBuildings || [],
      affectedChains || []
    );
    
    this.startEvent(event);
    return event;
  }

  /**
   * Force end an active event
   */
  forceEndEvent(eventId: string): boolean {
    const event = this.activeEvents.get(eventId);
    if (event) {
      this.endEvent(event);
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // SERIALIZATION
  // ---------------------------------------------------------------------------

  /**
   * Export state for saving
   */
  exportState(): {
    activeEvents: CryptoEvent[];
    eventHistory: CryptoEvent[];
    eventIdCounter: number;
  } {
    return {
      activeEvents: Array.from(this.activeEvents.values()),
      eventHistory: this.eventHistory,
      eventIdCounter: this.eventIdCounter,
    };
  }

  /**
   * Import state from save
   */
  importState(data: ReturnType<typeof this.exportState>): void {
    this.activeEvents.clear();
    for (const event of data.activeEvents) {
      this.activeEvents.set(event.id, event);
    }
    this.eventHistory = data.eventHistory;
    this.eventIdCounter = data.eventIdCounter;
  }
}

