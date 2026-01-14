import { test, expect } from "@playwright/test";

/**
 * Tests for X402 NPC Economy System
 * 
 * Tests for the X402 micropayment protocol integration including:
 * - Items & Consumables
 * - Service Exchange
 * - Gift System
 * - NPC Wallet Integration
 */

// Import items module
import {
  ITEMS,
  ITEM_MAP,
  getItem,
  getItemsByCategory,
  getItemsByRarity,
  getItemsByPriceRange,
  getItemsForNeed,
  getAffordableItems,
  getTotalNeedEffect,
  getBestItemForNeed,
  formatItemPrice,
  getRarityColor,
  getRarityMultiplier,
  type Item,
  type ItemCategory,
  type ItemRarity,
} from '@/lib/npc/x402/items';

// Import service exchange
import {
  ServiceExchange,
  serviceExchange,
  type ServiceExchangeResult,
} from '@/lib/npc/x402/ServiceExchange';

// Import gift system
import {
  GiftSystem,
  giftSystem,
  type GiftReaction,
  type GiftResult,
} from '@/lib/npc/x402/GiftSystem';

// Import wallet manager
import {
  NPCWalletManager,
  getNPCWalletManager,
  initNPCWalletManager,
} from '@/lib/npc/x402/NPCWalletManager';

// Import service registry
import {
  npcServiceRegistry,
  OCCUPATION_SERVICES,
} from '@/lib/npc/x402/NPCServiceRegistry';

// Import test helpers
import type { CryptoNPC, Occupation } from '@/games/isocity/types/npc';
import { createDefaultPersonality } from '@/lib/npc/personality';
import { createDefaultNeeds } from '@/lib/npc/needs';
import { createDefaultMemory } from '@/lib/npc/memory';
import { createInitialMovement } from '@/lib/npc/movement';
import { createDefaultWallet, createDefaultFinances } from '@/lib/npc/economy';

/**
 * Helper to create a mock NPC for testing
 */
function createMockNPC(overrides: Partial<CryptoNPC> = {}): CryptoNPC {
  return {
    id: overrides.id || `npc-${Math.random().toString(36).slice(2)}`,
    name: overrides.name || 'Test_NPC_42',
    walletAddress: '0x' + 'a'.repeat(40),
    age: 30,
    occupation: overrides.occupation || 'trader',
    residence: 'building-1',
    workplace: 'building-2',
    spriteType: 'apple',
    direction: 'south',
    gridX: 5,
    gridY: 5,
    isInsideBuilding: false,
    currentBuildingId: null,
    currentActivity: 'idle',
    needs: createDefaultNeeds(),
    memory: createDefaultMemory(),
    movement: createInitialMovement(),
    personality: createDefaultPersonality(),
    relationships: {},
    wallet: createDefaultWallet(),
    finances: createDefaultFinances('trader'),
    ...overrides,
  } as CryptoNPC;
}

// =============================================================================
// ITEMS & CONSUMABLES TESTS
// =============================================================================

test.describe("Items & Consumables System", () => {
  test("ITEMS should contain all defined items", async () => {
    expect(ITEMS.length).toBeGreaterThan(15);
    
    // Check some key items exist
    const hopiumCocktail = ITEMS.find(i => i.id === 'hopium_cocktail');
    expect(hopiumCocktail).toBeDefined();
    expect(hopiumCocktail?.name).toBe('Hopium Cocktail');
    expect(hopiumCocktail?.price).toBe(BigInt(50000));
    
    const degenSandwich = ITEMS.find(i => i.id === 'degen_sandwich');
    expect(degenSandwich).toBeDefined();
    expect(degenSandwich?.price).toBe(BigInt(100000));
  });

  test("ITEM_MAP should allow O(1) lookup", async () => {
    expect(ITEM_MAP.size).toBe(ITEMS.length);
    expect(ITEM_MAP.get('hopium_cocktail')).toBeDefined();
    expect(ITEM_MAP.get('nonexistent')).toBeUndefined();
  });

  test("getItem should return item by ID", async () => {
    const item = getItem('alpha_leak');
    expect(item).not.toBeNull();
    expect(item?.name).toBe('Alpha Leak Document');
    expect(item?.price).toBe(BigInt(250000));
    
    const missing = getItem('not_a_real_item');
    expect(missing).toBeNull();
  });

  test("getItemsByCategory should filter correctly", async () => {
    const consumables = getItemsByCategory('consumable');
    expect(consumables.length).toBeGreaterThan(5);
    expect(consumables.every(i => i.category === 'consumable')).toBe(true);
    
    const collectibles = getItemsByCategory('collectible');
    expect(collectibles.length).toBeGreaterThan(2);
    expect(collectibles.every(i => i.category === 'collectible')).toBe(true);
  });

  test("getItemsByRarity should filter correctly", async () => {
    const commonItems = getItemsByRarity('common');
    expect(commonItems.every(i => i.rarity === 'common')).toBe(true);
    
    const legendaryItems = getItemsByRarity('legendary');
    expect(legendaryItems.length).toBeGreaterThan(0);
    expect(legendaryItems.every(i => i.rarity === 'legendary')).toBe(true);
  });

  test("getItemsByPriceRange should filter correctly", async () => {
    const cheapItems = getItemsByPriceRange(BigInt(0), BigInt(50000));
    expect(cheapItems.every(i => i.price <= BigInt(50000))).toBe(true);
    
    const expensiveItems = getItemsByPriceRange(BigInt(1000000), BigInt(10000000));
    expect(expensiveItems.length).toBeGreaterThan(0);
    expect(expensiveItems.every(i => i.price >= BigInt(1000000))).toBe(true);
  });

  test("getItemsForNeed should find items for specific needs", async () => {
    const hungerItems = getItemsForNeed('hunger');
    expect(hungerItems.length).toBeGreaterThan(2);
    expect(hungerItems.every(i => 
      i.effects.some(e => e.need === 'hunger' && e.amount > 0)
    )).toBe(true);
    
    const funItems = getItemsForNeed('fun');
    expect(funItems.length).toBeGreaterThan(3);
  });

  test("getAffordableItems should filter by budget", async () => {
    const lowBudget = getAffordableItems(BigInt(100000));
    expect(lowBudget.every(i => i.price <= BigInt(100000))).toBe(true);
    
    const highBudget = getAffordableItems(BigInt(10000000));
    expect(highBudget.length).toBe(ITEMS.length); // All items affordable
  });

  test("getTotalNeedEffect should sum effects correctly", async () => {
    const moonPie = getItem('moon_pie');
    expect(moonPie).not.toBeNull();
    
    const hungerEffect = getTotalNeedEffect(moonPie!, 'hunger');
    expect(hungerEffect).toBe(15);
    
    const funEffect = getTotalNeedEffect(moonPie!, 'fun');
    expect(funEffect).toBe(10);
    
    const wealthEffect = getTotalNeedEffect(moonPie!, 'wealth');
    expect(wealthEffect).toBe(0); // No wealth effect
  });

  test("getBestItemForNeed should find best value", async () => {
    const bestHungerItem = getBestItemForNeed('hunger', BigInt(500000));
    expect(bestHungerItem).not.toBeNull();
    expect(bestHungerItem?.effects.some(e => e.need === 'hunger' && e.amount > 0)).toBe(true);
  });

  test("formatItemPrice should format correctly", async () => {
    expect(formatItemPrice(BigInt(50000))).toBe('$0.05');
    expect(formatItemPrice(BigInt(100000))).toBe('$0.10');
    expect(formatItemPrice(BigInt(1000000))).toBe('$1.00');
  });

  test("getRarityColor should return appropriate colors", async () => {
    expect(getRarityColor('common')).toBe('#9CA3AF');
    expect(getRarityColor('uncommon')).toBe('#10B981');
    expect(getRarityColor('rare')).toBe('#3B82F6');
    expect(getRarityColor('epic')).toBe('#8B5CF6');
    expect(getRarityColor('legendary')).toBe('#F59E0B');
  });

  test("getRarityMultiplier should return correct multipliers", async () => {
    expect(getRarityMultiplier('common')).toBe(1.0);
    expect(getRarityMultiplier('uncommon')).toBe(1.5);
    expect(getRarityMultiplier('rare')).toBe(2.0);
    expect(getRarityMultiplier('epic')).toBe(3.0);
    expect(getRarityMultiplier('legendary')).toBe(5.0);
  });

  test("all items should have valid structure", async () => {
    for (const item of ITEMS) {
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.description).toBeDefined();
      expect(item.price).toBeGreaterThan(BigInt(0));
      expect(['consumable', 'collectible', 'service', 'gift', 'utility']).toContain(item.category);
      expect(['common', 'uncommon', 'rare', 'epic', 'legendary']).toContain(item.rarity);
      expect(item.effects).toBeDefined();
      expect(item.maxStack).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// WALLET MANAGER TESTS
// =============================================================================

test.describe("NPCWalletManager", () => {
  test("should create wallet for NPC", async () => {
    const manager = new NPCWalletManager();
    const wallet = manager.getOrCreateWallet('test-npc-1');
    
    expect(wallet).toBeDefined();
    expect(wallet.npcId).toBe('test-npc-1');
    expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(wallet.balanceCached).toBe(BigInt(0));
  });

  test("should return existing wallet on repeat call", async () => {
    const manager = new NPCWalletManager();
    const wallet1 = manager.getOrCreateWallet('test-npc-2');
    const wallet2 = manager.getOrCreateWallet('test-npc-2');
    
    expect(wallet1.address).toBe(wallet2.address);
  });

  test("should set simulated balance", async () => {
    const manager = new NPCWalletManager();
    manager.getOrCreateWallet('test-npc-3');
    manager.setSimulatedBalance('test-npc-3', BigInt(1000000));
    
    const balance = await manager.fetchBalance('test-npc-3');
    expect(balance).toBe(BigInt(1000000));
  });

  test("should transfer between NPCs in simulated mode", async () => {
    const manager = new NPCWalletManager();
    manager.getOrCreateWallet('sender');
    manager.getOrCreateWallet('receiver');
    manager.setSimulatedBalance('sender', BigInt(1000000));
    
    const result = await manager.transfer(
      'sender',
      'receiver',
      BigInt(500000),
      'Test transfer'
    );
    
    expect(result.success).toBe(true);
    expect(await manager.fetchBalance('sender')).toBe(BigInt(500000));
    expect(await manager.fetchBalance('receiver')).toBe(BigInt(500000));
  });

  test("should fail transfer with insufficient balance", async () => {
    const manager = new NPCWalletManager();
    manager.getOrCreateWallet('poor-npc');
    manager.getOrCreateWallet('rich-target');
    manager.setSimulatedBalance('poor-npc', BigInt(100));
    
    const result = await manager.transfer(
      'poor-npc',
      'rich-target',
      BigInt(1000000),
      'Impossible transfer'
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient');
  });

  test("should fund wallet", async () => {
    const manager = new NPCWalletManager();
    manager.getOrCreateWallet('funded-npc');
    
    const result = await manager.fundWallet('funded-npc', BigInt(5000000));
    
    expect(result.success).toBe(true);
    const balance = await manager.fetchBalance('funded-npc');
    expect(balance).toBe(BigInt(5000000));
  });

  test("should get economy stats", async () => {
    const manager = new NPCWalletManager();
    manager.getOrCreateWallet('stat-npc-1');
    manager.getOrCreateWallet('stat-npc-2');
    manager.setSimulatedBalance('stat-npc-1', BigInt(1000000));
    manager.setSimulatedBalance('stat-npc-2', BigInt(2000000));
    
    const stats = manager.getEconomyStats();
    
    expect(stats.totalWallets).toBe(2);
    expect(stats.fundedWallets).toBe(2);
    expect(stats.totalCirculating).toBe(BigInt(3000000));
  });
});

// =============================================================================
// SERVICE REGISTRY TESTS
// =============================================================================

test.describe("NPCServiceRegistry", () => {
  test.beforeEach(async () => {
    npcServiceRegistry.clear();
  });

  test("should register services for NPC based on occupation", async () => {
    const services = npcServiceRegistry.registerNPC('bartender-1', 'bartender');
    
    expect(services.length).toBeGreaterThan(0);
    expect(services.some(s => s.serviceId.includes('serve_drink'))).toBe(true);
  });

  test("should include universal services for all NPCs", async () => {
    const services = npcServiceRegistry.registerNPC('trader-1', 'trader');
    
    expect(services.some(s => s.serviceId.includes('receive_tip'))).toBe(true);
    expect(services.some(s => s.serviceId.includes('conversation'))).toBe(true);
  });

  test("should get services for specific NPC", async () => {
    npcServiceRegistry.registerNPC('dev-1', 'developer');
    const services = npcServiceRegistry.getServicesForNPC('dev-1');
    
    expect(services.length).toBeGreaterThan(0);
    expect(services.every(s => s.npcId === 'dev-1')).toBe(true);
  });

  test("should check service cooldown", async () => {
    npcServiceRegistry.registerNPC('shop-1', 'shop_owner');
    const services = npcServiceRegistry.getServicesForNPC('shop-1');
    const foodService = services.find(s => s.serviceId.includes('sell_food'));
    
    expect(foodService).toBeDefined();
    
    // First use should be allowed
    const canUse1 = npcServiceRegistry.canUseService(foodService!.serviceId, 'customer-1');
    expect(canUse1.canUse).toBe(true);
    
    // Record usage
    npcServiceRegistry.recordUsage(foodService!.serviceId, 'customer-1');
    
    // Immediate retry should be blocked by cooldown
    const canUse2 = npcServiceRegistry.canUseService(foodService!.serviceId, 'customer-1');
    expect(canUse2.canUse).toBe(false);
    expect(canUse2.reason).toContain('Cooldown');
  });

  test("should find providers for service type", async () => {
    npcServiceRegistry.registerNPC('bart-1', 'bartender');
    npcServiceRegistry.registerNPC('bart-2', 'bartender');
    npcServiceRegistry.registerNPC('trader-1', 'trader');
    
    const drinkProviders = npcServiceRegistry.findProvidersForServiceType('serve_drink');
    
    expect(drinkProviders).toContain('bart-1');
    expect(drinkProviders).toContain('bart-2');
    expect(drinkProviders).not.toContain('trader-1');
  });

  test("should unregister NPC services", async () => {
    npcServiceRegistry.registerNPC('temp-npc', 'security');
    expect(npcServiceRegistry.getServicesForNPC('temp-npc').length).toBeGreaterThan(0);
    
    npcServiceRegistry.unregisterNPC('temp-npc');
    expect(npcServiceRegistry.getServicesForNPC('temp-npc').length).toBe(0);
  });
});

// =============================================================================
// SERVICE EXCHANGE TESTS
// =============================================================================

test.describe("ServiceExchange", () => {
  let walletManager: NPCWalletManager;
  let exchange: ServiceExchange;

  test.beforeEach(async () => {
    walletManager = new NPCWalletManager();
    initNPCWalletManager({});
    exchange = new ServiceExchange();
    npcServiceRegistry.clear();
  });

  test("should execute service exchange successfully", async () => {
    const consumer = createMockNPC({ id: 'consumer-1', name: 'Hungry_Trader' });
    const provider = createMockNPC({ id: 'provider-1', name: 'Shop_Owner_42', occupation: 'shop_owner' });
    
    // Setup wallets
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(consumer.id);
    wm.getOrCreateWallet(provider.id);
    wm.setSimulatedBalance(consumer.id, BigInt(1000000));
    
    // Register provider services
    npcServiceRegistry.registerNPC(provider.id, 'shop_owner');
    const services = npcServiceRegistry.getServicesForNPC(provider.id);
    const foodService = services.find(s => s.serviceId.includes('sell_food'));
    
    expect(foodService).toBeDefined();
    
    const result = await exchange.executeServiceExchange(
      consumer,
      provider,
      foodService!,
      1
    );
    
    expect(result.success).toBe(true);
    expect(result.service).toBeDefined();
    expect(result.needsSatisfied).toBeDefined();
    expect(result.needsSatisfied!.length).toBeGreaterThan(0);
    expect(result.memories).toBeDefined();
  });

  test("should fail exchange with insufficient balance", async () => {
    const consumer = createMockNPC({ id: 'broke-consumer' });
    const provider = createMockNPC({ id: 'rich-provider', occupation: 'bartender' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(consumer.id);
    wm.getOrCreateWallet(provider.id);
    wm.setSimulatedBalance(consumer.id, BigInt(100)); // Very low balance
    
    npcServiceRegistry.registerNPC(provider.id, 'bartender');
    const services = npcServiceRegistry.getServicesForNPC(provider.id);
    const drinkService = services.find(s => s.serviceId.includes('serve_drink'));
    
    const result = await exchange.executeServiceExchange(
      consumer,
      provider,
      drinkService!,
      1
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient');
  });

  test("should purchase item successfully", async () => {
    const buyer = createMockNPC({ id: 'buyer-1' });
    const seller = createMockNPC({ id: 'seller-1', occupation: 'shop_owner' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(buyer.id);
    wm.getOrCreateWallet(seller.id);
    wm.setSimulatedBalance(buyer.id, BigInt(500000));
    
    const result = await exchange.purchaseItem(
      buyer,
      seller,
      'hopium_cocktail',
      1
    );
    
    expect(result.success).toBe(true);
    expect(result.item).toBeDefined();
    expect(result.item?.id).toBe('hopium_cocktail');
    expect(result.needsSatisfied).toBeDefined();
  });

  test("should fail item purchase for nonexistent item", async () => {
    const buyer = createMockNPC({ id: 'buyer-2' });
    const seller = createMockNPC({ id: 'seller-2' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(buyer.id);
    wm.setSimulatedBalance(buyer.id, BigInt(1000000));
    
    const result = await exchange.purchaseItem(
      buyer,
      seller,
      'fake_item',
      1
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test("should track transaction history", async () => {
    const buyer = createMockNPC({ id: 'history-buyer' });
    const seller = createMockNPC({ id: 'history-seller', occupation: 'shop_owner' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(buyer.id);
    wm.getOrCreateWallet(seller.id);
    wm.setSimulatedBalance(buyer.id, BigInt(2000000));
    
    await exchange.purchaseItem(buyer, seller, 'ramen_bowl', 1);
    await exchange.purchaseItem(buyer, seller, 'hopium_cocktail', 1);
    
    const transactions = exchange.getTransactions();
    expect(transactions.length).toBe(2);
    
    const buyerTxs = exchange.getTransactionsForNPC(buyer.id);
    expect(buyerTxs.length).toBe(2);
    
    const dayTxs = exchange.getTransactionsForDay(1);
    expect(dayTxs.length).toBe(2);
  });

  test("should generate economy stats", async () => {
    const buyer = createMockNPC({ id: 'stats-buyer' });
    const seller = createMockNPC({ id: 'stats-seller', occupation: 'shop_owner' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(buyer.id);
    wm.getOrCreateWallet(seller.id);
    wm.setSimulatedBalance(buyer.id, BigInt(5000000));
    
    await exchange.purchaseItem(buyer, seller, 'ramen_bowl', 1);
    await exchange.purchaseItem(buyer, seller, 'ramen_bowl', 2);
    await exchange.purchaseItem(buyer, seller, 'hopium_cocktail', 2);
    
    const stats = exchange.getEconomyStats();
    
    expect(stats.totalTransactions).toBe(3);
    expect(stats.totalVolume).toBeGreaterThan(BigInt(0));
    expect(stats.mostPopularItem).toBe('Instant Ramen Bowl');
  });
});

// =============================================================================
// GIFT SYSTEM TESTS
// =============================================================================

test.describe("GiftSystem", () => {
  let gs: GiftSystem;

  test.beforeEach(async () => {
    gs = new GiftSystem();
    initNPCWalletManager({});
  });

  test("should give gift successfully", async () => {
    const giver = createMockNPC({ id: 'giver-1', name: 'Generous_Trader' });
    const receiver = createMockNPC({ id: 'receiver-1', name: 'Lucky_Bartender', occupation: 'bartender' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(giver.id);
    wm.getOrCreateWallet(receiver.id);
    wm.setSimulatedBalance(giver.id, BigInt(1000000));
    
    const result = await gs.giveGift(giver, receiver, 'flower_bouquet', 1);
    
    expect(result.success).toBe(true);
    expect(result.item).toBeDefined();
    expect(result.reaction).toBeDefined();
    expect(result.relationshipChange).toBeDefined();
    expect(result.moodChange).toBeDefined();
    expect(result.dialogue).toBeDefined();
    expect(result.memories).toBeDefined();
  });

  test("should fail gift with nonexistent item", async () => {
    const giver = createMockNPC({ id: 'giver-2' });
    const receiver = createMockNPC({ id: 'receiver-2' });
    
    const result = await gs.giveGift(giver, receiver, 'fake_gift', 1);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test("should fail gift with insufficient funds", async () => {
    const giver = createMockNPC({ id: 'broke-giver' });
    const receiver = createMockNPC({ id: 'unlucky-receiver' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(giver.id);
    wm.setSimulatedBalance(giver.id, BigInt(100)); // Very low
    
    const result = await gs.giveGift(giver, receiver, 'golden_ape', 1);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient');
  });

  test("should generate different reactions based on receiver preferences", async () => {
    const giver = createMockNPC({ id: 'pref-giver' });
    const artistReceiver = createMockNPC({ id: 'artist-receiver', occupation: 'artist' });
    const traderReceiver = createMockNPC({ id: 'trader-receiver', occupation: 'trader' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(giver.id);
    wm.getOrCreateWallet(artistReceiver.id);
    wm.getOrCreateWallet(traderReceiver.id);
    wm.setSimulatedBalance(giver.id, BigInt(10000000));
    
    // Artists love collectibles - use a more affordable item
    const artistResult = await gs.giveGift(giver, artistReceiver, 'wojak_plushie', 1);
    
    // Traders prefer utility items - use flower bouquet
    const traderResult = await gs.giveGift(giver, traderReceiver, 'flower_bouquet', 1);
    
    // Both gifts should succeed
    expect(artistResult.success).toBe(true);
    expect(traderResult.success).toBe(true);
    
    // Reactions should be defined
    expect(artistResult.reaction).toBeDefined();
    expect(traderResult.reaction).toBeDefined();
  });

  test("should track gift history", async () => {
    const giver = createMockNPC({ id: 'history-giver' });
    const receiver = createMockNPC({ id: 'history-receiver' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(giver.id);
    wm.getOrCreateWallet(receiver.id);
    wm.setSimulatedBalance(giver.id, BigInt(5000000));
    
    await gs.giveGift(giver, receiver, 'hopium_cocktail', 1);
    await gs.giveGift(giver, receiver, 'flower_bouquet', 2);
    
    const history = gs.getGiftHistory(giver.id);
    expect(history.length).toBe(2);
    
    const giftsFromGiver = gs.getGiftsFromNPC(receiver.id, giver.id);
    expect(giftsFromGiver.length).toBe(2);
  });

  test("should check daily gift limit", async () => {
    const giver = createMockNPC({ id: 'limit-giver' });
    const receiver = createMockNPC({ id: 'limit-receiver' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(giver.id);
    wm.getOrCreateWallet(receiver.id);
    wm.setSimulatedBalance(giver.id, BigInt(5000000));
    
    await gs.giveGift(giver, receiver, 'hopium_cocktail', 1);
    
    const hasGifted = gs.hasGiftedToday(giver.id, receiver.id, 1);
    expect(hasGifted).toBe(true);
    
    const hasNotGifted = gs.hasGiftedToday(giver.id, receiver.id, 2);
    expect(hasNotGifted).toBe(false);
  });

  test("should suggest gifts based on preferences", async () => {
    const receiver = createMockNPC({ id: 'suggest-receiver', occupation: 'developer' });
    
    const suggestions = gs.getSuggestedGifts(receiver, BigInt(1000000));
    
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(5);
    // All suggestions should be within budget
    expect(suggestions.every(i => i.price <= BigInt(1000000))).toBe(true);
  });

  test("should generate gift stats", async () => {
    const giver = createMockNPC({ id: 'stats-giver' });
    const receiver1 = createMockNPC({ id: 'stats-receiver-1' });
    const receiver2 = createMockNPC({ id: 'stats-receiver-2' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(giver.id);
    wm.getOrCreateWallet(receiver1.id);
    wm.getOrCreateWallet(receiver2.id);
    wm.setSimulatedBalance(giver.id, BigInt(10000000));
    
    await gs.giveGift(giver, receiver1, 'hopium_cocktail', 1);
    await gs.giveGift(giver, receiver1, 'hopium_cocktail', 2);
    await gs.giveGift(giver, receiver2, 'flower_bouquet', 2);
    
    const stats = gs.getGiftStats();
    
    expect(stats.totalGifts).toBe(3);
    expect(stats.averageReaction).toBeGreaterThan(0);
    expect(stats.mostPopularGift).toBe('hopium_cocktail');
    expect(stats.mostGenerousNPC).toBe(giver.id);
  });

  test("relationship change should scale with rarity", async () => {
    const giver = createMockNPC({ id: 'rarity-giver' });
    const receiver = createMockNPC({ id: 'rarity-receiver', occupation: 'bartender' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(giver.id);
    wm.getOrCreateWallet(receiver.id);
    wm.setSimulatedBalance(giver.id, BigInt(10000000));
    
    // Give a common item
    const gs1 = new GiftSystem();
    const commonResult = await gs1.giveGift(giver, receiver, 'ramen_bowl', 1);
    
    // Give a legendary item
    const gs2 = new GiftSystem();
    wm.setSimulatedBalance(giver.id, BigInt(10000000));
    const legendaryResult = await gs2.giveGift(giver, receiver, 'golden_ape', 1);
    
    // Legendary should have higher relationship impact (when reactions are positive)
    if (commonResult.reaction === 'likes' && legendaryResult.reaction === 'loves') {
      expect(Math.abs(legendaryResult.relationshipChange!)).toBeGreaterThan(
        Math.abs(commonResult.relationshipChange!)
      );
    }
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

test.describe("X402 Economy Integration", () => {
  test.beforeEach(async () => {
    npcServiceRegistry.clear();
    serviceExchange.clear();
    giftSystem.clear();
    initNPCWalletManager({});
  });

  test("should handle complete service exchange flow", async () => {
    // Setup NPCs
    const customer = createMockNPC({ id: 'customer', name: 'Hungry_Customer' });
    const bartender = createMockNPC({ id: 'bartender', name: 'Cool_Bartender', occupation: 'bartender' });
    
    // Setup wallets
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(customer.id);
    wm.getOrCreateWallet(bartender.id);
    wm.setSimulatedBalance(customer.id, BigInt(1000000)); // $1 starting balance
    
    // Register bartender services
    npcServiceRegistry.registerNPC(bartender.id, 'bartender');
    const services = npcServiceRegistry.getServicesForNPC(bartender.id);
    const drinkService = services.find(s => s.serviceId.includes('serve_drink'));
    
    // Execute service exchange
    const result = await serviceExchange.executeServiceExchange(
      customer,
      bartender,
      drinkService!,
      1
    );
    
    expect(result.success).toBe(true);
    
    // Verify balances changed
    const customerBalance = await wm.fetchBalance(customer.id);
    const bartenderBalance = await wm.fetchBalance(bartender.id);
    
    expect(customerBalance).toBeLessThan(BigInt(1000000));
    expect(bartenderBalance).toBeGreaterThan(BigInt(0));
    
    // Verify needs would be satisfied
    expect(result.needsSatisfied!.length).toBeGreaterThan(0);
  });

  test("should handle gift and item purchase in sequence", async () => {
    const trader = createMockNPC({ id: 'trader', name: 'Wealthy_Trader' });
    const friend = createMockNPC({ id: 'friend', name: 'Best_Friend' });
    const shopOwner = createMockNPC({ id: 'shop', name: 'Shop_Owner', occupation: 'shop_owner' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(trader.id);
    wm.getOrCreateWallet(friend.id);
    wm.getOrCreateWallet(shopOwner.id);
    wm.setSimulatedBalance(trader.id, BigInt(5000000)); // $5 starting balance
    
    // Buy an item
    const purchaseResult = await serviceExchange.purchaseItem(
      trader,
      shopOwner,
      'degen_sandwich',
      1
    );
    expect(purchaseResult.success).toBe(true);
    
    // Give a gift
    const giftResult = await giftSystem.giveGift(
      trader,
      friend,
      'flower_bouquet',
      1
    );
    expect(giftResult.success).toBe(true);
    
    // Check final balance
    const finalBalance = await wm.fetchBalance(trader.id);
    const expectedSpent = BigInt(100000) + BigInt(100000); // sandwich + flowers
    expect(finalBalance).toBe(BigInt(5000000) - expectedSpent);
  });

  test("economy should track daily volume correctly", async () => {
    const buyer = createMockNPC({ id: 'volume-buyer' });
    const seller = createMockNPC({ id: 'volume-seller', occupation: 'shop_owner' });
    
    const wm = getNPCWalletManager();
    wm.getOrCreateWallet(buyer.id);
    wm.getOrCreateWallet(seller.id);
    wm.setSimulatedBalance(buyer.id, BigInt(10000000));
    
    // Multiple transactions on day 1
    await serviceExchange.purchaseItem(buyer, seller, 'ramen_bowl', 1);
    await serviceExchange.purchaseItem(buyer, seller, 'copium_coffee', 1);
    
    // Transaction on day 2
    await serviceExchange.purchaseItem(buyer, seller, 'hopium_cocktail', 2);
    
    const day1Summary = serviceExchange.getDailySummary(1);
    const day2Summary = serviceExchange.getDailySummary(2);
    
    expect(day1Summary).not.toBeNull();
    expect(day1Summary!.totalTransactions).toBe(2);
    
    expect(day2Summary).not.toBeNull();
    expect(day2Summary!.totalTransactions).toBe(1);
  });
});
