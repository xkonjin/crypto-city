/**
 * X402 Service Exchange System
 * 
 * Handles NPC-to-NPC service exchanges using the X402 payment protocol.
 * Simulates the HTTP 402 Payment Required flow for NPC transactions.
 * 
 * Flow:
 * 1. Consumer requests service from provider
 * 2. Provider returns 402 Payment Required with price
 * 3. Consumer makes payment (simulated or on-chain)
 * 4. Service is fulfilled, needs are satisfied
 * 5. Memories are created for both NPCs
 * 
 * "In Crypto City, every transaction is a story. Most of them are tragedies."
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { NeedType } from '../needs';
import type { NPCService, NPCTransaction, PaymentResult } from './types';
import { getNPCWalletManager } from './NPCWalletManager';
import { npcServiceRegistry } from './NPCServiceRegistry';
import { getItem, type Item } from './items';
import { formatUnits } from 'viem';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result of a service exchange
 */
export interface ServiceExchangeResult {
  success: boolean;
  /** The service that was exchanged */
  service?: NPCService;
  /** Payment details */
  payment?: PaymentResult;
  /** Error message if failed */
  error?: string;
  /** Transaction record */
  transaction?: NPCTransaction;
  /** Needs that were satisfied */
  needsSatisfied?: { need: NeedType; amount: number }[];
  /** Memories created for provider and consumer */
  memories?: {
    provider: string;
    consumer: string;
  };
}

/**
 * Result of an item purchase
 */
export interface ItemPurchaseResult {
  success: boolean;
  item?: Item;
  payment?: PaymentResult;
  error?: string;
  transaction?: NPCTransaction;
  needsSatisfied?: { need: NeedType; amount: number }[];
}

/**
 * Service request from consumer to provider
 */
export interface ServiceExchangeRequest {
  consumerId: string;
  providerId: string;
  serviceId: string;
  gameDay: number;
}

/**
 * Transaction history for economy tracking
 */
export interface DailyTransactionSummary {
  gameDay: number;
  totalTransactions: number;
  totalVolume: bigint;
  serviceBreakdown: Record<string, number>;
  itemBreakdown: Record<string, number>;
}

// =============================================================================
// SERVICE EXCHANGE CLASS
// =============================================================================

/**
 * Service Exchange Manager
 * 
 * Handles all service and item exchanges between NPCs.
 */
export class ServiceExchange {
  private transactions: NPCTransaction[] = [];
  private dailySummaries: Map<number, DailyTransactionSummary> = new Map();
  private transactionIdCounter = 0;

  /**
   * Execute a service exchange between provider and consumer
   * 
   * @param consumer - NPC requesting the service
   * @param provider - NPC providing the service
   * @param service - The service being requested
   * @param gameDay - Current game day for transaction recording
   * @returns Result of the exchange
   */
  async executeServiceExchange(
    consumer: CryptoNPC,
    provider: CryptoNPC,
    service: NPCService,
    gameDay: number
  ): Promise<ServiceExchangeResult> {
    const walletManager = getNPCWalletManager();

    // 1. Check if service can be used (cooldowns, daily limits)
    const canUse = npcServiceRegistry.canUseService(service.serviceId, consumer.id);
    if (!canUse.canUse) {
      return {
        success: false,
        error: canUse.reason,
      };
    }

    // 2. Check consumer has sufficient balance
    const consumerWallet = walletManager.getWallet(consumer.id);
    if (!consumerWallet) {
      return {
        success: false,
        error: 'Consumer has no wallet',
      };
    }

    const balance = await walletManager.fetchBalance(consumer.id);
    if (balance < service.price) {
      return {
        success: false,
        error: `Insufficient balance: ${formatUnits(balance, 6)} < ${formatUnits(service.price, 6)}`,
      };
    }

    // 3. Ensure provider has a wallet
    walletManager.getOrCreateWallet(provider.id);

    // 4. Execute payment (simulated or on-chain)
    const paymentResult = await walletManager.transfer(
      consumer.id,
      provider.id,
      service.price,
      `Service: ${service.name}`
    );

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error,
      };
    }

    // 5. Record service usage
    npcServiceRegistry.recordUsage(service.serviceId, consumer.id);

    // 6. Create transaction record
    const transaction = this.createTransaction(
      consumer.id,
      provider.id,
      service.price,
      'service',
      `Service: ${service.name}`,
      paymentResult.txHash,
      gameDay
    );
    this.transactions.push(transaction);
    this.updateDailySummary(gameDay, transaction, service.name, undefined);

    // 7. Determine needs satisfied by the service
    const needsSatisfied = this.getServiceNeedEffects(service);

    // 8. Create memories for both NPCs
    const memories = {
      provider: `Provided ${service.name} to ${consumer.name} for ${formatUnits(service.price, 6)} USDT`,
      consumer: `Received ${service.name} from ${provider.name} for ${formatUnits(service.price, 6)} USDT`,
    };

    return {
      success: true,
      service,
      payment: paymentResult,
      transaction,
      needsSatisfied,
      memories,
    };
  }

  /**
   * Execute an item purchase from a shop owner NPC
   * 
   * @param buyer - NPC buying the item
   * @param seller - NPC selling the item
   * @param itemId - ID of the item being purchased
   * @param gameDay - Current game day
   * @returns Result of the purchase
   */
  async purchaseItem(
    buyer: CryptoNPC,
    seller: CryptoNPC,
    itemId: string,
    gameDay: number
  ): Promise<ItemPurchaseResult> {
    const walletManager = getNPCWalletManager();
    const item = getItem(itemId);

    if (!item) {
      return {
        success: false,
        error: `Item not found: ${itemId}`,
      };
    }

    // Check buyer has wallet and balance
    const buyerWallet = walletManager.getWallet(buyer.id);
    if (!buyerWallet) {
      return {
        success: false,
        error: 'Buyer has no wallet',
      };
    }

    const balance = await walletManager.fetchBalance(buyer.id);
    if (balance < item.price) {
      return {
        success: false,
        error: `Insufficient balance for ${item.name}`,
      };
    }

    // Ensure seller has a wallet
    walletManager.getOrCreateWallet(seller.id);

    // Execute payment
    const paymentResult = await walletManager.transfer(
      buyer.id,
      seller.id,
      item.price,
      `Item: ${item.name}`
    );

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error,
      };
    }

    // Create transaction record
    const transaction = this.createTransaction(
      buyer.id,
      seller.id,
      item.price,
      'trade',
      `Item: ${item.name}`,
      paymentResult.txHash,
      gameDay
    );
    this.transactions.push(transaction);
    this.updateDailySummary(gameDay, transaction, undefined, item.name);

    // Get needs satisfied from item effects
    const needsSatisfied = item.effects.map(effect => ({
      need: effect.need,
      amount: effect.amount,
    }));

    return {
      success: true,
      item,
      payment: paymentResult,
      transaction,
      needsSatisfied,
    };
  }

  /**
   * Process autonomous service-seeking behavior for an NPC
   * NPCs with low needs will seek out providers
   * 
   * @param npc - The NPC seeking services
   * @param availableProviders - NPCs that could provide services
   * @param gameDay - Current game day
   * @returns The exchange result if a service was obtained, null otherwise
   */
  async seekServiceForNeed(
    npc: CryptoNPC,
    availableProviders: CryptoNPC[],
    gameDay: number
  ): Promise<ServiceExchangeResult | null> {
    // Find the most urgent need
    const needPriorities: { need: NeedType; serviceType: string }[] = [
      { need: 'hunger', serviceType: 'sell_food' },
      { need: 'fun', serviceType: 'serve_drink' },
      { need: 'social', serviceType: 'listen_to_troubles' },
      { need: 'energy', serviceType: 'serve_drink' }, // Coffee for energy
      { need: 'purpose', serviceType: 'alpha_call' },
    ];

    for (const { need, serviceType } of needPriorities) {
      const needValue = npc.needs[need].current;
      const threshold = npc.needs[need].criticalThreshold;

      // Only seek service if need is below threshold + 20
      if (needValue > threshold + 20) continue;

      // Find a provider for this service
      for (const provider of availableProviders) {
        if (provider.id === npc.id) continue;

        const services = npcServiceRegistry.getServicesForNPC(provider.id);
        const matchingService = services.find(s => 
          s.serviceId.includes(serviceType)
        );

        if (matchingService) {
          const result = await this.executeServiceExchange(
            npc,
            provider,
            matchingService,
            gameDay
          );

          if (result.success) {
            return result;
          }
        }
      }
    }

    return null;
  }

  /**
   * Determine what needs a service satisfies based on its category
   */
  private getServiceNeedEffects(service: NPCService): { need: NeedType; amount: number }[] {
    const effects: { need: NeedType; amount: number }[] = [];

    switch (service.category) {
      case 'hospitality':
        if (service.serviceId.includes('drink')) {
          effects.push({ need: 'fun', amount: 15 });
        }
        if (service.serviceId.includes('food') || service.serviceId.includes('meal')) {
          effects.push({ need: 'hunger', amount: 30 });
        }
        break;
      case 'trading':
        effects.push({ need: 'purpose', amount: 20 });
        effects.push({ need: 'wealth', amount: 10 });
        break;
      case 'security':
        effects.push({ need: 'purpose', amount: 10 });
        break;
      case 'creative':
        effects.push({ need: 'fun', amount: 20 });
        break;
      case 'social':
        effects.push({ need: 'social', amount: 25 });
        if (service.serviceId.includes('troubles')) {
          effects.push({ need: 'fun', amount: 10 });
        }
        break;
      case 'housing':
        effects.push({ need: 'energy', amount: 15 });
        break;
    }

    return effects;
  }

  /**
   * Create a transaction record
   */
  private createTransaction(
    fromNpcId: string,
    toNpcId: string,
    amount: bigint,
    type: NPCTransaction['type'],
    reason: string,
    txHash: `0x${string}` | undefined,
    gameDay: number
  ): NPCTransaction {
    return {
      id: `tx_${++this.transactionIdCounter}`,
      fromNpcId,
      toNpcId,
      amount,
      type,
      reason,
      txHash,
      status: txHash ? 'confirmed' : 'confirmed', // Simulated = instant confirm
      timestamp: Date.now(),
      gameDay,
    };
  }

  /**
   * Update daily summary with a new transaction
   */
  private updateDailySummary(
    gameDay: number,
    transaction: NPCTransaction,
    serviceName?: string,
    itemName?: string
  ): void {
    let summary = this.dailySummaries.get(gameDay);
    
    if (!summary) {
      summary = {
        gameDay,
        totalTransactions: 0,
        totalVolume: BigInt(0),
        serviceBreakdown: {},
        itemBreakdown: {},
      };
      this.dailySummaries.set(gameDay, summary);
    }

    summary.totalTransactions++;
    summary.totalVolume += transaction.amount;

    if (serviceName) {
      summary.serviceBreakdown[serviceName] = 
        (summary.serviceBreakdown[serviceName] || 0) + 1;
    }

    if (itemName) {
      summary.itemBreakdown[itemName] = 
        (summary.itemBreakdown[itemName] || 0) + 1;
    }
  }

  /**
   * Get all transactions
   */
  getTransactions(): NPCTransaction[] {
    return [...this.transactions];
  }

  /**
   * Get transactions for a specific NPC
   */
  getTransactionsForNPC(npcId: string): NPCTransaction[] {
    return this.transactions.filter(
      tx => tx.fromNpcId === npcId || tx.toNpcId === npcId
    );
  }

  /**
   * Get transactions for a specific day
   */
  getTransactionsForDay(gameDay: number): NPCTransaction[] {
    return this.transactions.filter(tx => tx.gameDay === gameDay);
  }

  /**
   * Get daily summary
   */
  getDailySummary(gameDay: number): DailyTransactionSummary | null {
    return this.dailySummaries.get(gameDay) || null;
  }

  /**
   * Get economy statistics
   */
  getEconomyStats(): {
    totalTransactions: number;
    totalVolume: bigint;
    averageTransactionSize: bigint;
    mostPopularService: string | null;
    mostPopularItem: string | null;
  } {
    const totalTransactions = this.transactions.length;
    const totalVolume = this.transactions.reduce(
      (sum, tx) => sum + tx.amount,
      BigInt(0)
    );

    // Find most popular service
    const serviceCounts: Record<string, number> = {};
    const itemCounts: Record<string, number> = {};

    for (const summary of this.dailySummaries.values()) {
      for (const [service, count] of Object.entries(summary.serviceBreakdown)) {
        serviceCounts[service] = (serviceCounts[service] || 0) + count;
      }
      for (const [item, count] of Object.entries(summary.itemBreakdown)) {
        itemCounts[item] = (itemCounts[item] || 0) + count;
      }
    }

    const mostPopularService = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const mostPopularItem = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      totalTransactions,
      totalVolume,
      averageTransactionSize: totalTransactions > 0 
        ? totalVolume / BigInt(totalTransactions) 
        : BigInt(0),
      mostPopularService,
      mostPopularItem,
    };
  }

  /**
   * Clear all transaction history (for testing/reset)
   */
  clear(): void {
    this.transactions = [];
    this.dailySummaries.clear();
    this.transactionIdCounter = 0;
  }
}

// Singleton instance
export const serviceExchange = new ServiceExchange();
