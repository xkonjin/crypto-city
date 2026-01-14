/**
 * X402 Integration Utilities
 * 
 * Helper functions for integrating the X402 economy with NPCSimulation.
 * Provides hooks for autonomous NPC trading, service seeking, and gift giving.
 * 
 * "The invisible hand of the market, now with actual wallet addresses."
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { NeedType, NPCNeeds } from '../needs';
import { getNPCWalletManager } from './NPCWalletManager';
import { npcServiceRegistry } from './NPCServiceRegistry';
import { serviceExchange } from './ServiceExchange';
import { giftSystem } from './GiftSystem';
import { getBestItemForNeed, getItem } from './items';
import { NPC_INITIAL_BALANCE } from './constants';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of processing NPC economy for a tick
 */
export interface EconomyTickResult {
  /** Whether any economic activity occurred */
  hadActivity: boolean;
  /** Service exchange result if service was obtained */
  serviceResult?: {
    consumerId: string;
    providerId: string;
    serviceName: string;
    needsSatisfied: { need: NeedType; amount: number }[];
  };
  /** Item purchase result if item was bought */
  itemResult?: {
    buyerId: string;
    sellerId: string;
    itemName: string;
    needsSatisfied: { need: NeedType; amount: number }[];
  };
  /** Gift giving result if gift was given */
  giftResult?: {
    giverId: string;
    receiverId: string;
    itemName: string;
    reaction: string;
  };
}

/**
 * Options for autonomous economic behavior
 */
export interface AutonomousEconomyOptions {
  /** Whether NPCs should autonomously seek services */
  enableServiceSeeking: boolean;
  /** Whether NPCs should autonomously purchase items */
  enableItemPurchasing: boolean;
  /** Whether NPCs should autonomously give gifts */
  enableGiftGiving: boolean;
  /** Minimum balance required before spending */
  minBalanceThreshold: bigint;
  /** Need threshold below which NPC seeks help */
  needCriticalThreshold: number;
  /** Relationship threshold above which NPCs might gift */
  giftRelationshipThreshold: number;
  /** Probability of gifting per tick when conditions are met */
  giftProbability: number;
}

/**
 * Default options for autonomous economy
 */
export const DEFAULT_ECONOMY_OPTIONS: AutonomousEconomyOptions = {
  enableServiceSeeking: true,
  enableItemPurchasing: true,
  enableGiftGiving: true,
  minBalanceThreshold: BigInt(50000), // $0.05 minimum to avoid broke NPCs
  needCriticalThreshold: 30, // Below 30 triggers seeking
  giftRelationshipThreshold: 50, // Relationship > 50 allows gifting
  giftProbability: 0.01, // 1% chance per tick when conditions are met
};

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize X402 wallet for an NPC if not already done
 */
export function ensureNPCHasWallet(npc: CryptoNPC): void {
  if (npc.hasX402Wallet) return;
  
  const walletManager = getNPCWalletManager();
  const wallet = walletManager.getOrCreateWallet(npc.id);
  
  // Fund with initial balance if not funded
  if (!wallet.isFunded) {
    walletManager.fundWallet(npc.id, NPC_INITIAL_BALANCE);
  }
  
  // Update NPC flags
  npc.hasX402Wallet = true;
  npc.x402WalletAddress = wallet.address;
}

/**
 * Initialize X402 services for an NPC based on occupation
 */
export function ensureNPCHasServices(npc: CryptoNPC): void {
  const existingServices = npcServiceRegistry.getServicesForNPC(npc.id);
  if (existingServices.length === 0) {
    npcServiceRegistry.registerNPC(npc.id, npc.occupation);
  }
}

/**
 * Initialize a batch of NPCs for the X402 economy
 */
export function initializeX402Economy(npcs: CryptoNPC[]): void {
  for (const npc of npcs) {
    ensureNPCHasWallet(npc);
    ensureNPCHasServices(npc);
  }
}

// =============================================================================
// NEED-BASED SERVICE SEEKING
// =============================================================================

/**
 * Check if an NPC should seek a service based on their needs
 */
function shouldSeekService(
  npc: CryptoNPC, 
  options: AutonomousEconomyOptions
): NeedType | null {
  const needPriorities: NeedType[] = ['hunger', 'energy', 'social', 'fun', 'purpose'];
  
  for (const needType of needPriorities) {
    const need = npc.needs[needType];
    if (need.current < options.needCriticalThreshold) {
      return needType;
    }
  }
  
  return null;
}

/**
 * Find nearby NPCs that can provide a service
 */
function findNearbyProviders(
  npc: CryptoNPC,
  allNPCs: CryptoNPC[],
  maxDistance: number = 10
): CryptoNPC[] {
  return allNPCs.filter(other => {
    if (other.id === npc.id) return false;
    
    const distance = Math.sqrt(
      Math.pow(other.gridX - npc.gridX, 2) + 
      Math.pow(other.gridY - npc.gridY, 2)
    );
    
    return distance <= maxDistance;
  });
}

// =============================================================================
// AUTONOMOUS ECONOMY PROCESSING
// =============================================================================

/**
 * Process autonomous economic behavior for an NPC during a simulation tick
 * 
 * @param npc - The NPC to process
 * @param allNPCs - All NPCs in the simulation
 * @param gameDay - Current game day
 * @param options - Options controlling autonomous behavior
 * @returns Result of any economic activity
 */
export async function processNPCEconomyTick(
  npc: CryptoNPC,
  allNPCs: CryptoNPC[],
  gameDay: number,
  options: AutonomousEconomyOptions = DEFAULT_ECONOMY_OPTIONS
): Promise<EconomyTickResult> {
  const result: EconomyTickResult = { hadActivity: false };
  
  // Ensure NPC has wallet and services
  ensureNPCHasWallet(npc);
  ensureNPCHasServices(npc);
  
  const walletManager = getNPCWalletManager();
  const balance = await walletManager.fetchBalance(npc.id);
  
  // Skip if balance too low
  if (balance < options.minBalanceThreshold) {
    return result;
  }
  
  // 1. Check for service seeking
  if (options.enableServiceSeeking) {
    const urgentNeed = shouldSeekService(npc, options);
    
    if (urgentNeed) {
      const nearbyProviders = findNearbyProviders(npc, allNPCs);
      
      const exchangeResult = await serviceExchange.seekServiceForNeed(
        npc,
        nearbyProviders,
        gameDay
      );
      
      if (exchangeResult?.success) {
        result.hadActivity = true;
        result.serviceResult = {
          consumerId: npc.id,
          providerId: exchangeResult.service!.npcId,
          serviceName: exchangeResult.service!.name,
          needsSatisfied: exchangeResult.needsSatisfied || [],
        };
        
        // Apply needs satisfaction to NPC
        applyNeedsSatisfaction(npc, exchangeResult.needsSatisfied || []);
        
        return result; // Only one activity per tick
      }
    }
  }
  
  // 2. Check for item purchasing (for self-care)
  if (options.enableItemPurchasing && !result.hadActivity) {
    const urgentNeed = shouldSeekService(npc, options);
    
    if (urgentNeed) {
      const bestItem = getBestItemForNeed(urgentNeed, balance);
      
      if (bestItem) {
        // Find a shop owner to buy from
        const shopOwners = allNPCs.filter(
          other => other.occupation === 'shop_owner' && other.id !== npc.id
        );
        
        if (shopOwners.length > 0) {
          const seller = shopOwners[Math.floor(Math.random() * shopOwners.length)];
          ensureNPCHasWallet(seller);
          
          const purchaseResult = await serviceExchange.purchaseItem(
            npc,
            seller,
            bestItem.id,
            gameDay
          );
          
          if (purchaseResult.success) {
            result.hadActivity = true;
            result.itemResult = {
              buyerId: npc.id,
              sellerId: seller.id,
              itemName: bestItem.name,
              needsSatisfied: purchaseResult.needsSatisfied || [],
            };
            
            // Apply needs satisfaction
            applyNeedsSatisfaction(npc, purchaseResult.needsSatisfied || []);
            
            return result;
          }
        }
      }
    }
  }
  
  // 3. Check for gift giving (relationship building)
  if (options.enableGiftGiving && !result.hadActivity) {
    if (Math.random() < options.giftProbability) {
      const giftResult = await tryGiveGift(npc, allNPCs, gameDay, options, balance);
      
      if (giftResult) {
        result.hadActivity = true;
        result.giftResult = giftResult;
      }
    }
  }
  
  return result;
}

/**
 * Try to give a gift to a friendly NPC
 */
async function tryGiveGift(
  giver: CryptoNPC,
  allNPCs: CryptoNPC[],
  gameDay: number,
  options: AutonomousEconomyOptions,
  balance: bigint
): Promise<{ giverId: string; receiverId: string; itemName: string; reaction: string } | null> {
  // Find NPCs with good relationships
  const potentialReceivers = Object.entries(giver.relationships || {})
    .filter(([, rel]) => 
      (rel.trust + rel.respect) / 2 > options.giftRelationshipThreshold
    )
    .map(([npcId]) => allNPCs.find(n => n.id === npcId))
    .filter((npc): npc is CryptoNPC => npc !== undefined);
  
  if (potentialReceivers.length === 0) return null;
  
  // Pick a random receiver
  const receiver = potentialReceivers[Math.floor(Math.random() * potentialReceivers.length)];
  
  // Check if already gifted today
  if (giftSystem.hasGiftedToday(giver.id, receiver.id, gameDay)) {
    return null;
  }
  
  // Get suggested gifts within budget
  const suggestions = giftSystem.getSuggestedGifts(receiver, balance);
  
  if (suggestions.length === 0) return null;
  
  // Pick best affordable gift
  const gift = suggestions[0];
  
  // Ensure receiver has wallet
  ensureNPCHasWallet(receiver);
  
  // Give the gift
  const giftResult = await giftSystem.giveGift(giver, receiver, gift.id, gameDay);
  
  if (giftResult.success) {
    // Apply relationship change
    applyRelationshipChange(giver, receiver.id, giftResult.relationshipChange || 0);
    
    return {
      giverId: giver.id,
      receiverId: receiver.id,
      itemName: gift.name,
      reaction: giftResult.reaction || 'neutral',
    };
  }
  
  return null;
}

// =============================================================================
// EFFECT APPLICATION
// =============================================================================

/**
 * Apply needs satisfaction effects to an NPC
 */
function applyNeedsSatisfaction(
  npc: CryptoNPC,
  effects: { need: NeedType; amount: number }[]
): void {
  for (const effect of effects) {
    const need = npc.needs[effect.need];
    need.current = Math.min(need.max, need.current + effect.amount);
  }
}

/**
 * Apply relationship change from a gift or interaction
 */
function applyRelationshipChange(
  npc: CryptoNPC,
  targetId: string,
  change: number
): void {
  if (!npc.relationships) {
    npc.relationships = {};
  }
  
  if (!npc.relationships[targetId]) {
    // Create new relationship
    npc.relationships[targetId] = {
      targetId,
      trust: 0,
      respect: 0,
      familiarity: 10,
      attraction: 0,
      type: 'acquaintance',
      firstMet: Date.now(),
      lastInteraction: Date.now(),
      interactionCount: 1,
      owedFavors: 0,
    };
  }
  
  // Apply change evenly to trust and respect
  const rel = npc.relationships[targetId];
  rel.trust = Math.max(-100, Math.min(100, rel.trust + change / 2));
  rel.respect = Math.max(-100, Math.min(100, rel.respect + change / 2));
  rel.lastInteraction = Date.now();
  rel.interactionCount++;
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get economy overview statistics
 */
export function getX402EconomyOverview(): {
  walletStats: {
    totalWallets: number;
    fundedWallets: number;
    totalCirculating: bigint;
  };
  serviceStats: {
    totalServices: number;
    npcsWithServices: number;
  };
  transactionStats: {
    totalTransactions: number;
    totalVolume: bigint;
    mostPopularService: string | null;
    mostPopularItem: string | null;
  };
  giftStats: {
    totalGifts: number;
    averageReaction: number;
    mostPopularGift: string | null;
  };
} {
  const walletManager = getNPCWalletManager();
  const walletStats = walletManager.getEconomyStats();
  const serviceStats = npcServiceRegistry.getStats();
  const transactionStats = serviceExchange.getEconomyStats();
  const giftStats = giftSystem.getGiftStats();
  
  return {
    walletStats,
    serviceStats: {
      totalServices: serviceStats.totalServices,
      npcsWithServices: serviceStats.npcsWithServices,
    },
    transactionStats,
    giftStats,
  };
}

/**
 * Get NPC's economic status
 */
export async function getNPCEconomicStatus(npc: CryptoNPC): Promise<{
  balance: bigint;
  formattedBalance: string;
  services: number;
  transactionCount: number;
  giftsGiven: number;
  giftsReceived: number;
}> {
  const walletManager = getNPCWalletManager();
  
  ensureNPCHasWallet(npc);
  
  const balance = await walletManager.fetchBalance(npc.id);
  const formattedBalance = await walletManager.getFormattedBalance(npc.id);
  const services = npcServiceRegistry.getServicesForNPC(npc.id).length;
  const transactions = serviceExchange.getTransactionsForNPC(npc.id);
  const giftHistory = giftSystem.getGiftHistory(npc.id);
  
  return {
    balance,
    formattedBalance,
    services,
    transactionCount: transactions.length,
    giftsGiven: giftHistory.filter(g => g.giverId === npc.id).length,
    giftsReceived: giftHistory.filter(g => g.receiverId === npc.id).length,
  };
}
