/**
 * NPC Service Registry
 * 
 * Defines all services that NPCs can offer to other NPCs for payment.
 * Uses x402 payment flow: request → 402 → pay → retry with proof.
 * 
 * "Every citizen of Crypto City has something to offer,
 * and everything has a price. Usually in USDT."
 */

import type { NPCService } from './types';
import type { NPCServiceCategory } from './constants';
import { NPC_SERVICE_PRICES } from './constants';
import type { Occupation } from '@/games/isocity/types/npc';

/**
 * Service definitions by occupation
 * 
 * Each occupation can offer specific services that other NPCs can pay for.
 */
export const OCCUPATION_SERVICES: Record<Occupation, NPCService[]> = {
  trader: [
    {
      serviceId: 'alpha_call',
      npcId: '', // Set dynamically
      name: 'Alpha Call',
      description: "Whispered trading secrets from someone who's probably guessing. NFA.",
      price: NPC_SERVICE_PRICES.alpha_call,
      category: 'trading',
      cooldownMs: 3600000, // 1 hour
      dailyLimit: 5,
    },
    {
      serviceId: 'market_analysis',
      npcId: '',
      name: 'Market Analysis',
      description: 'A detailed chart reading that sounds impressive but may just be astrology.',
      price: NPC_SERVICE_PRICES.alpha_call * BigInt(2),
      category: 'trading',
      cooldownMs: 7200000, // 2 hours
      dailyLimit: 3,
    },
  ],
  
  bartender: [
    {
      serviceId: 'serve_drink',
      npcId: '',
      name: 'Serve Drink',
      description: 'One carefully crafted cocktail, served with unsolicited market opinions.',
      price: NPC_SERVICE_PRICES.drink,
      category: 'hospitality',
      cooldownMs: 60000, // 1 minute
      dailyLimit: 50,
    },
    {
      serviceId: 'listen_to_troubles',
      npcId: '',
      name: 'Bartender Therapy',
      description: 'Professional nodding and sympathetic sounds while you explain your bags.',
      price: NPC_SERVICE_PRICES.drink * BigInt(3),
      category: 'social',
      cooldownMs: 300000, // 5 minutes
      dailyLimit: 10,
    },
  ],
  
  shop_owner: [
    {
      serviceId: 'sell_food',
      npcId: '',
      name: 'Hot Meal',
      description: 'Sustenance for the body. The spirit must seek gains elsewhere.',
      price: NPC_SERVICE_PRICES.food,
      category: 'hospitality',
      cooldownMs: 30000, // 30 seconds
      dailyLimit: 100,
    },
    {
      serviceId: 'sell_merchandise',
      npcId: '',
      name: 'Crypto Merch',
      description: 'A tasteful "HODL" t-shirt to signal your commitment to poor decisions.',
      price: NPC_SERVICE_PRICES.food * BigInt(5),
      category: 'hospitality',
      cooldownMs: 600000, // 10 minutes
      dailyLimit: 10,
    },
  ],
  
  security: [
    {
      serviceId: 'escort',
      npcId: '',
      name: 'Security Escort',
      description: 'Safe passage through the mean streets of Crypto City. Mostly.',
      price: NPC_SERVICE_PRICES.security_escort,
      category: 'security',
      cooldownMs: 1800000, // 30 minutes
      dailyLimit: 10,
    },
    {
      serviceId: 'guard_duty',
      npcId: '',
      name: 'Building Guard',
      description: 'Standing menacingly near your property. Deters 60% of trouble.',
      price: NPC_SERVICE_PRICES.security_escort * BigInt(2),
      category: 'security',
      cooldownMs: 3600000, // 1 hour
      dailyLimit: 5,
    },
  ],
  
  artist: [
    {
      serviceId: 'commission_art',
      npcId: '',
      name: 'Commission Art',
      description: 'A unique digital artwork. May or may not become a valuable NFT.',
      price: NPC_SERVICE_PRICES.entertainment * BigInt(4),
      category: 'creative',
      cooldownMs: 7200000, // 2 hours
      dailyLimit: 3,
    },
    {
      serviceId: 'street_performance',
      npcId: '',
      name: 'Street Performance',
      description: 'Watch an interpretive dance about market volatility.',
      price: NPC_SERVICE_PRICES.tip_medium,
      category: 'creative',
      cooldownMs: 300000, // 5 minutes
      dailyLimit: 20,
    },
  ],
  
  developer: [
    {
      serviceId: 'code_review',
      npcId: '',
      name: 'Smart Contract Review',
      description: "Quick look at your code. Can't promise it won't still get exploited.",
      price: NPC_SERVICE_PRICES.alpha_call * BigInt(2),
      category: 'trading', // Debatable
      cooldownMs: 3600000, // 1 hour
      dailyLimit: 5,
    },
    {
      serviceId: 'tech_consultation',
      npcId: '',
      name: 'Tech Consultation',
      description: "Explain why you shouldn't build that idea. You'll do it anyway.",
      price: NPC_SERVICE_PRICES.alpha_call,
      category: 'social',
      cooldownMs: 1800000, // 30 minutes
      dailyLimit: 8,
    },
  ],
  
  miner: [
    {
      serviceId: 'hash_power',
      npcId: '',
      name: 'Rent Hash Power',
      description: 'Borrow some GPU cycles. Results may vary with market conditions.',
      price: NPC_SERVICE_PRICES.entertainment * BigInt(2),
      category: 'trading',
      cooldownMs: 3600000, // 1 hour
      dailyLimit: 10,
    },
  ],
  
  unemployed: [
    {
      serviceId: 'odd_job',
      npcId: '',
      name: 'Odd Jobs',
      description: 'Will do almost anything for USDT. Dignity is expensive these days.',
      price: NPC_SERVICE_PRICES.tip_small,
      category: 'social',
      cooldownMs: 60000, // 1 minute
      dailyLimit: 50,
    },
  ],
};

/**
 * Generic social services available to all NPCs
 */
export const UNIVERSAL_SERVICES: NPCService[] = [
  {
    serviceId: 'receive_tip',
    npcId: '',
    name: 'Accept Tip',
    description: 'A gesture of appreciation in the only language that matters.',
    price: NPC_SERVICE_PRICES.tip_small,
    category: 'social',
    dailyLimit: 100,
  },
  {
    serviceId: 'conversation',
    npcId: '',
    name: 'Have Conversation',
    description: 'Exchange words about markets, weather, or the futility of existence.',
    price: BigInt(0), // Free
    category: 'social',
    dailyLimit: 50,
  },
];

/**
 * NPC Service Registry
 * 
 * Central registry for discovering and accessing NPC services.
 */
class ServiceRegistry {
  private services: Map<string, NPCService> = new Map();
  private servicesByNpc: Map<string, NPCService[]> = new Map();
  private serviceUsage: Map<string, { count: number; lastUsed: number }[]> = new Map();

  /**
   * Register services for an NPC based on their occupation
   */
  registerNPC(npcId: string, occupation: Occupation): NPCService[] {
    const occupationServices = OCCUPATION_SERVICES[occupation] || [];
    const npcServices: NPCService[] = [];

    // Add occupation-specific services
    for (const template of occupationServices) {
      const service: NPCService = {
        ...template,
        npcId,
        serviceId: `${npcId}_${template.serviceId}`,
      };
      this.services.set(service.serviceId, service);
      npcServices.push(service);
    }

    // Add universal services
    for (const template of UNIVERSAL_SERVICES) {
      const service: NPCService = {
        ...template,
        npcId,
        serviceId: `${npcId}_${template.serviceId}`,
      };
      this.services.set(service.serviceId, service);
      npcServices.push(service);
    }

    this.servicesByNpc.set(npcId, npcServices);
    return npcServices;
  }

  /**
   * Unregister all services for an NPC
   */
  unregisterNPC(npcId: string): void {
    const services = this.servicesByNpc.get(npcId) || [];
    for (const service of services) {
      this.services.delete(service.serviceId);
    }
    this.servicesByNpc.delete(npcId);
    this.serviceUsage.delete(npcId);
  }

  /**
   * Get a specific service by ID
   */
  getService(serviceId: string): NPCService | null {
    return this.services.get(serviceId) || null;
  }

  /**
   * Get all services offered by an NPC
   */
  getServicesForNPC(npcId: string): NPCService[] {
    return this.servicesByNpc.get(npcId) || [];
  }

  /**
   * Get all services in a category
   */
  getServicesByCategory(category: NPCServiceCategory): NPCService[] {
    return Array.from(this.services.values()).filter(s => s.category === category);
  }

  /**
   * Check if a service can be used (cooldown, daily limit)
   */
  canUseService(serviceId: string, requesterId: string): { 
    canUse: boolean; 
    reason?: string 
  } {
    const service = this.services.get(serviceId);
    if (!service) {
      return { canUse: false, reason: 'Service not found' };
    }

    const usageKey = `${serviceId}_${requesterId}`;
    const usage = this.serviceUsage.get(usageKey) || [];
    const now = Date.now();

    // Check cooldown
    if (service.cooldownMs) {
      const lastUsage = usage[usage.length - 1];
      if (lastUsage && now - lastUsage.lastUsed < service.cooldownMs) {
        const remainingMs = service.cooldownMs - (now - lastUsage.lastUsed);
        return { 
          canUse: false, 
          reason: `Cooldown: ${Math.ceil(remainingMs / 1000)}s remaining` 
        };
      }
    }

    // Check daily limit
    if (service.dailyLimit) {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayUsage = usage.filter(u => u.lastUsed >= todayStart);
      if (todayUsage.length >= service.dailyLimit) {
        return { canUse: false, reason: 'Daily limit reached' };
      }
    }

    return { canUse: true };
  }

  /**
   * Record service usage
   */
  recordUsage(serviceId: string, requesterId: string): void {
    const usageKey = `${serviceId}_${requesterId}`;
    const usage = this.serviceUsage.get(usageKey) || [];
    usage.push({ count: 1, lastUsed: Date.now() });
    this.serviceUsage.set(usageKey, usage);
  }

  /**
   * Find NPCs that offer a specific type of service
   */
  findProvidersForServiceType(serviceType: string): string[] {
    const providers: string[] = [];
    for (const [npcId, services] of this.servicesByNpc) {
      if (services.some(s => s.serviceId.includes(serviceType))) {
        providers.push(npcId);
      }
    }
    return providers;
  }

  /**
   * Get statistics about services
   */
  getStats(): {
    totalServices: number;
    servicesByCategory: Record<NPCServiceCategory, number>;
    npcsWithServices: number;
  } {
    const servicesByCategory: Record<NPCServiceCategory, number> = {
      hospitality: 0,
      trading: 0,
      security: 0,
      creative: 0,
      housing: 0,
      social: 0,
    };

    for (const service of this.services.values()) {
      servicesByCategory[service.category]++;
    }

    return {
      totalServices: this.services.size,
      servicesByCategory,
      npcsWithServices: this.servicesByNpc.size,
    };
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.services.clear();
    this.servicesByNpc.clear();
    this.serviceUsage.clear();
  }
}

// Singleton instance
export const npcServiceRegistry = new ServiceRegistry();

/**
 * Get price for a service in formatted USDT
 */
export function formatServicePrice(price: bigint): string {
  const dollars = Number(price) / 1_000_000;
  return `$${dollars.toFixed(2)}`;
}
