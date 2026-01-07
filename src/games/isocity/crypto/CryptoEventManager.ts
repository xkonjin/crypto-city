/**
 * Crypto Event Manager
 * 
 * Manages random crypto events that affect the city economy.
 * Events include bull runs, bear markets, airdrops, rug pulls, hacks, etc.
 * 
 * Adapted for IsoCity's architecture.
 */

import { CryptoEventType, CryptoEvent, CryptoEventDefinition } from './types';
import { CryptoEconomyManager } from './CryptoEconomyManager';

// =============================================================================
// EVENT DEFINITIONS
// =============================================================================

export const CRYPTO_EVENTS: Record<CryptoEventType, CryptoEventDefinition> = {
  bull_run: {
    type: 'bull_run',
    name: 'Bull Run! 📈',
    description: 'Markets are pumping! Sentiment surges as everyone FOMOs in.',
    icon: '🐂',
    rarity: 0.05,
    duration: 30000, // 30 seconds
    effects: {
      sentimentChange: 25,
      yieldMultiplier: 1.5,
    },
    exclusive: ['bear_market'],
  },
  bear_market: {
    type: 'bear_market',
    name: 'Bear Market 📉',
    description: 'Markets are crashing! Fear spreads as prices dump.',
    icon: '🐻',
    rarity: 0.05,
    duration: 30000,
    effects: {
      sentimentChange: -30,
      yieldMultiplier: 0.6,
    },
    exclusive: ['bull_run'],
  },
  airdrop: {
    type: 'airdrop',
    name: 'Airdrop Season! 🪂',
    description: 'Free tokens rain from the sky! Treasury boosted.',
    icon: '🎁',
    rarity: 0.08,
    duration: 15000,
    effects: {
      treasuryChange: 10000,
      sentimentChange: 10,
    },
  },
  rug_pull: {
    type: 'rug_pull',
    name: 'Rug Pull! 🧹',
    description: 'A project has rugged! Treasury and sentiment take a hit.',
    icon: '💀',
    rarity: 0.03,
    duration: 10000,
    effects: {
      treasuryChange: -5000,
      sentimentChange: -15,
    },
  },
  hack: {
    type: 'hack',
    name: 'Protocol Hacked! 🔓',
    description: 'A major exploit hits the ecosystem. Funds are at risk.',
    icon: '🏴‍☠️',
    rarity: 0.02,
    duration: 20000,
    effects: {
      treasuryMultiplier: 0.9,
      sentimentChange: -25,
    },
  },
  protocol_upgrade: {
    type: 'protocol_upgrade',
    name: 'Protocol Upgrade 🔧',
    description: 'A major protocol upgrade improves efficiency!',
    icon: '⚙️',
    rarity: 0.1,
    duration: 15000,
    effects: {
      yieldMultiplier: 1.2,
      sentimentChange: 10,
    },
  },
  whale_entry: {
    type: 'whale_entry',
    name: 'Whale Alert! 🐋',
    description: 'A whale has entered the city! Big deposits incoming.',
    icon: '🐋',
    rarity: 0.07,
    duration: 10000,
    effects: {
      treasuryChange: 5000,
      sentimentChange: 8,
    },
  },
  ct_drama: {
    type: 'ct_drama',
    name: 'CT Drama 🍿',
    description: 'Crypto Twitter is fighting again. Volatility spikes!',
    icon: '🔥',
    rarity: 0.12,
    duration: 20000,
    effects: {
      sentimentChange: -5,
      volatilitySpike: true,
    },
  },
  liquidation_cascade: {
    type: 'liquidation_cascade',
    name: 'Liquidation Cascade 💥',
    description: 'Overleveraged positions are getting liquidated!',
    icon: '📉',
    rarity: 0.04,
    duration: 15000,
    effects: {
      treasuryChange: -3000,
      sentimentChange: -20,
    },
    exclusive: ['bull_run'],
  },
  merge: {
    type: 'merge',
    name: 'The Merge! ⟠',
    description: 'A major blockchain transition! Historic moment.',
    icon: '🔀',
    rarity: 0.01,
    duration: 45000,
    effects: {
      sentimentChange: 35,
      yieldMultiplier: 1.3,
    },
  },
  halving: {
    type: 'halving',
    name: 'Halving Event ⚡',
    description: 'Block rewards are cut in half! Bullish signal.',
    icon: '✂️',
    rarity: 0.01,
    duration: 60000,
    effects: {
      sentimentChange: 30,
      yieldMultiplier: 1.4,
    },
  },
  airdrop_season: {
    type: 'airdrop_season',
    name: 'Airdrop Season! 🌧️',
    description: 'Multiple projects are distributing tokens!',
    icon: '🎊',
    rarity: 0.03,
    duration: 45000,
    effects: {
      treasuryChange: 25000,
      sentimentChange: 20,
    },
  },
  regulatory_fud: {
    type: 'regulatory_fud',
    name: 'Regulatory FUD 📜',
    description: 'Government announces new crypto regulations.',
    icon: '⚖️',
    rarity: 0.06,
    duration: 25000,
    effects: {
      sentimentChange: -18,
      yieldMultiplier: 0.85,
    },
  },
};

// =============================================================================
// EVENT MANAGER CLASS
// =============================================================================

export class CryptoEventManager {
  private activeEvents: Map<string, CryptoEvent> = new Map();
  private eventHistory: CryptoEvent[] = [];
  private economyManager: CryptoEconomyManager | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  // Changed to pass full active events array instead of single event
  private listeners: Set<(events: CryptoEvent[]) => void> = new Set();
  
  // Configuration
  private eventCheckInterval = 5000; // Check every 5 seconds
  private maxActiveEvents = 2;
  private maxHistoryLength = 50;
  
  constructor(economyManager?: CryptoEconomyManager) {
    if (economyManager) {
      this.economyManager = economyManager;
    }
  }
  
  // ---------------------------------------------------------------------------
  // ECONOMY MANAGER INTEGRATION
  // ---------------------------------------------------------------------------
  
  /**
   * Set the economy manager for applying event effects
   */
  setEconomyManager(manager: CryptoEconomyManager): void {
    this.economyManager = manager;
  }
  
  // ---------------------------------------------------------------------------
  // EVENT LIFECYCLE
  // ---------------------------------------------------------------------------
  
  /**
   * Start the event system
   */
  start(): void {
    if (this.checkInterval) return;
    
    this.checkInterval = setInterval(() => {
      this.checkForNewEvent();
      this.updateActiveEvents();
    }, this.eventCheckInterval);
  }
  
  /**
   * Stop the event system
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  /**
   * Check if a new event should trigger
   */
  private checkForNewEvent(): void {
    if (this.activeEvents.size >= this.maxActiveEvents) return;
    
    // Roll for each event type
    for (const [type, definition] of Object.entries(CRYPTO_EVENTS)) {
      // Check if event is exclusive with any active event
      if (this.isExclusiveConflict(type as CryptoEventType)) {
        continue;
      }
      
      // Random check based on rarity
      if (Math.random() < definition.rarity / 10) { // Divide by 10 for per-check probability
        this.triggerEvent(type as CryptoEventType);
        return; // Only one event per check
      }
    }
  }
  
  /**
   * Check if an event type conflicts with active events
   */
  private isExclusiveConflict(eventType: CryptoEventType): boolean {
    const definition = CRYPTO_EVENTS[eventType];
    if (!definition.exclusive) return false;
    
    for (const activeEvent of this.activeEvents.values()) {
      if (definition.exclusive.includes(activeEvent.type)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Trigger a specific event
   */
  triggerEvent(type: CryptoEventType, magnitude: number = 1.0): CryptoEvent {
    const definition = CRYPTO_EVENTS[type];
    const now = Date.now();
    
    const event: CryptoEvent = {
      id: `${type}_${now}`,
      type,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      startTime: now,
      endTime: now + definition.duration,
      magnitude,
      active: true,
    };
    
    this.activeEvents.set(event.id, event);
    this.eventHistory.push(event);
    
    // Trim history if needed
    if (this.eventHistory.length > this.maxHistoryLength) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistoryLength);
    }
    
    // Apply immediate effects to economy
    this.applyEventEffects(event, definition);
    
    // Notify listeners with updated active events array
    this.notifyListeners();
    
    return event;
  }
  
  /**
   * Apply event effects to the economy
   */
  private applyEventEffects(event: CryptoEvent, definition: CryptoEventDefinition): void {
    if (!this.economyManager) return;
    
    const effects = definition.effects;
    const magnitude = event.magnitude;
    
    // Apply treasury change
    if (effects.treasuryChange) {
      if (effects.treasuryChange > 0) {
        this.economyManager.deposit(effects.treasuryChange * magnitude);
      } else {
        this.economyManager.spend(Math.abs(effects.treasuryChange * magnitude));
      }
    }
    
    // Apply treasury multiplier
    if (effects.treasuryMultiplier) {
      const state = this.economyManager.getState();
      const change = state.treasury * (1 - effects.treasuryMultiplier);
      if (change > 0) {
        this.economyManager.spend(change);
      }
    }
    
    // Apply the event through the economy manager
    this.economyManager.applyEvent(event.type, magnitude);
  }
  
  /**
   * Update active events (remove expired ones)
   */
  private updateActiveEvents(): void {
    const now = Date.now();
    let hasChanges = false;
    
    for (const [id, event] of this.activeEvents) {
      if (now >= event.endTime) {
        event.active = false;
        this.activeEvents.delete(id);
        hasChanges = true;
      }
    }
    
    // Only notify if events changed
    if (hasChanges) {
      this.notifyListeners();
    }
  }
  
  // ---------------------------------------------------------------------------
  // STATE ACCESS
  // ---------------------------------------------------------------------------
  
  /**
   * Get all active events
   */
  getActiveEvents(): CryptoEvent[] {
    return Array.from(this.activeEvents.values());
  }
  
  /**
   * Get event history
   */
  getEventHistory(): CryptoEvent[] {
    return [...this.eventHistory];
  }
  
  /**
   * Get most recent event (for display)
   */
  getMostRecentEvent(): CryptoEvent | null {
    if (this.eventHistory.length === 0) return null;
    return this.eventHistory[this.eventHistory.length - 1];
  }
  
  /**
   * Check if a specific event type is active
   */
  isEventActive(type: CryptoEventType): boolean {
    for (const event of this.activeEvents.values()) {
      if (event.type === type) return true;
    }
    return false;
  }
  
  // ---------------------------------------------------------------------------
  // NEWS GENERATION
  // ---------------------------------------------------------------------------
  
  /**
   * Generate news headlines from recent events
   */
  generateNewsHeadlines(count: number = 5): string[] {
    const headlines: string[] = [];
    
    // Add active events
    for (const event of this.activeEvents.values()) {
      headlines.push(`🔴 LIVE: ${event.name} - ${event.description}`);
    }
    
    // Add recent events from history
    const recentEvents = this.eventHistory
      .filter(e => !e.active)
      .slice(-count);
    
    for (const event of recentEvents.reverse()) {
      headlines.push(`${event.icon} ${event.name}`);
    }
    
    // Fill with generic news if needed
    const genericNews = [
      '📊 Market analysis: Crypto showing strength',
      '💹 Trading volume up across major exchanges',
      '🌐 New partnerships announced in DeFi space',
      '🔐 Security improvements deployed by leading protocols',
      '📱 Mobile wallet adoption continues to grow',
      '🏛️ Institutional interest in crypto remains high',
      '🎮 GameFi sector shows renewed activity',
      '🎨 NFT market stabilizes with quality focus',
      '🔗 Cross-chain bridges see increased usage',
      '💎 Long-term holders remain confident',
    ];
    
    while (headlines.length < count) {
      const randomNews = genericNews[Math.floor(Math.random() * genericNews.length)];
      if (!headlines.includes(randomNews)) {
        headlines.push(randomNews);
      }
    }
    
    return headlines.slice(0, count);
  }
  
  // ---------------------------------------------------------------------------
  // LISTENER MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to event notifications
   * Listeners receive the full array of active events whenever events change
   */
  subscribe(listener: (events: CryptoEvent[]) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.getActiveEvents());
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners with the current active events array
   */
  private notifyListeners(): void {
    const activeEvents = this.getActiveEvents();
    for (const listener of this.listeners) {
      listener(activeEvents);
    }
  }
  
  // ---------------------------------------------------------------------------
  // STATE PERSISTENCE
  // ---------------------------------------------------------------------------
  
  /**
   * Export state for saving
   */
  exportState(): {
    activeEvents: CryptoEvent[];
    eventHistory: CryptoEvent[];
  } {
    return {
      activeEvents: this.getActiveEvents(),
      eventHistory: this.getEventHistory(),
    };
  }
  
  /**
   * Import state from save
   */
  importState(data: {
    activeEvents?: CryptoEvent[];
    eventHistory?: CryptoEvent[];
  }): void {
    this.activeEvents.clear();
    
    if (data.activeEvents) {
      const now = Date.now();
      for (const event of data.activeEvents) {
        // Only restore events that haven't expired
        if (event.endTime > now) {
          this.activeEvents.set(event.id, event);
        }
      }
    }
    
    if (data.eventHistory) {
      this.eventHistory = data.eventHistory;
    }
  }
  
  // ---------------------------------------------------------------------------
  // CLEANUP
  // ---------------------------------------------------------------------------
  
  /**
   * Cleanup and destroy the manager
   */
  destroy(): void {
    this.stop();
    this.listeners.clear();
    this.activeEvents.clear();
    this.eventHistory = [];
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const cryptoEvents = new CryptoEventManager();

export default CryptoEventManager;

