/**
 * X402 Items & Consumables System
 * 
 * Defines all purchasable items in Crypto City's NPC economy.
 * Each item has a price in USDT₮ (atomic units, 6 decimals) and effects on NPC needs.
 * 
 * "In Crypto City, everything is for sale. Especially your hopes and dreams."
 */

import type { NeedType } from '../needs';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Categories of items available in the NPC economy
 */
export type ItemCategory = 
  | 'consumable'    // Food, drinks, energy items
  | 'collectible'   // NFTs, rare items, flex pieces
  | 'service'       // One-time services
  | 'gift'          // Items specifically good for gifting
  | 'utility';      // Functional items with special effects

/**
 * Item rarity affects pricing and emotional impact when received as gift
 */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * Effect that an item has on an NPC's needs
 */
export interface ItemEffect {
  /** Which need this affects */
  need: NeedType;
  /** Amount to add to the need (can be negative for debuffs) */
  amount: number;
}

/**
 * Definition of an item in the economy
 */
export interface Item {
  /** Unique item identifier */
  id: string;
  /** Display name */
  name: string;
  /** Hitchhiker's Guide style description */
  description: string;
  /** Price in atomic USDT₮ units (6 decimals) */
  price: bigint;
  /** Item category */
  category: ItemCategory;
  /** Item rarity */
  rarity: ItemRarity;
  /** Effects on NPC needs when consumed */
  effects: ItemEffect[];
  /** Whether the item is consumed on use */
  isConsumable: boolean;
  /** Maximum stack size in inventory */
  maxStack: number;
  /** Optional: emoji icon for display */
  icon?: string;
}

/**
 * Item in an NPC's inventory
 */
export interface InventoryItem {
  /** Reference to item ID */
  itemId: string;
  /** Current quantity */
  quantity: number;
  /** When the item was acquired */
  acquiredAt: number;
  /** Who gave this item (for gifts) */
  giftedBy?: string;
}

/**
 * Result of consuming an item
 */
export interface ConsumptionResult {
  success: boolean;
  itemId: string;
  effects: ItemEffect[];
  error?: string;
}

// =============================================================================
// ITEM DEFINITIONS
// =============================================================================

/**
 * All items available in Crypto City
 */
export const ITEMS: Item[] = [
  // === CONSUMABLES: FOOD ===
  {
    id: 'degen_sandwich',
    name: 'Degen Sandwich',
    description: "A hastily assembled meal for those who can't leave their charts. Contains mystery meat and confirmation bias.",
    price: BigInt(100000), // $0.10
    category: 'consumable',
    rarity: 'common',
    effects: [{ need: 'hunger', amount: 30 }],
    isConsumable: true,
    maxStack: 10,
    icon: '🥪',
  },
  {
    id: 'ramen_bowl',
    name: 'Instant Ramen Bowl',
    description: "The official currency of broke traders worldwide. Pairs well with tears of unrealized losses.",
    price: BigInt(50000), // $0.05
    category: 'consumable',
    rarity: 'common',
    effects: [{ need: 'hunger', amount: 20 }],
    isConsumable: true,
    maxStack: 20,
    icon: '🍜',
  },
  {
    id: 'moon_pie',
    name: 'Moon Pie',
    description: "A delicacy believed to bring good fortune. Statistically unproven, but the sugar rush is real.",
    price: BigInt(75000), // $0.075
    category: 'consumable',
    rarity: 'uncommon',
    effects: [
      { need: 'hunger', amount: 15 },
      { need: 'fun', amount: 10 },
    ],
    isConsumable: true,
    maxStack: 15,
    icon: '🥧',
  },
  {
    id: 'wagyu_steak',
    name: 'Wagyu Steak',
    description: "For those rare moments when your portfolio is green. The marbling is almost as beautiful as a perfect candlestick.",
    price: BigInt(1000000), // $1.00
    category: 'consumable',
    rarity: 'rare',
    effects: [
      { need: 'hunger', amount: 50 },
      { need: 'fun', amount: 20 },
    ],
    isConsumable: true,
    maxStack: 5,
    icon: '🥩',
  },

  // === CONSUMABLES: DRINKS ===
  {
    id: 'hopium_cocktail',
    name: 'Hopium Cocktail',
    description: "A potent blend of optimism, delusion, and just enough alcohol to forget your liquidation price.",
    price: BigInt(50000), // $0.05
    category: 'consumable',
    rarity: 'common',
    effects: [
      { need: 'fun', amount: 15 },
      { need: 'social', amount: 5 },
    ],
    isConsumable: true,
    maxStack: 20,
    icon: '🍸',
  },
  {
    id: 'copium_coffee',
    name: 'Copium Coffee',
    description: "Strong enough to keep you awake through a 24-hour trading session. Side effects include excessive rationalization.",
    price: BigInt(30000), // $0.03
    category: 'consumable',
    rarity: 'common',
    effects: [
      { need: 'energy', amount: 25 },
      { need: 'hunger', amount: -5 },
    ],
    isConsumable: true,
    maxStack: 30,
    icon: '☕',
  },
  {
    id: 'green_candle_smoothie',
    name: 'Green Candle Smoothie',
    description: "Made with organic hopium and sustainably sourced dreams. May cause temporary confidence.",
    price: BigInt(80000), // $0.08
    category: 'consumable',
    rarity: 'uncommon',
    effects: [
      { need: 'energy', amount: 15 },
      { need: 'hunger', amount: 10 },
      { need: 'fun', amount: 5 },
    ],
    isConsumable: true,
    maxStack: 15,
    icon: '🥤',
  },

  // === CONSUMABLES: ENERGY ===
  {
    id: 'energy_drink',
    name: 'Bull Run Energy',
    description: "Gives you wings, but not necessarily the gains. Taurine content rivals a small power plant.",
    price: BigInt(40000), // $0.04
    category: 'consumable',
    rarity: 'common',
    effects: [
      { need: 'energy', amount: 30 },
    ],
    isConsumable: true,
    maxStack: 24,
    icon: '🥫',
  },
  {
    id: 'power_nap_pill',
    name: 'Power Nap Pill',
    description: "30 minutes of sleep compressed into a single capsule. Side effects include waking up thinking you missed a pump.",
    price: BigInt(200000), // $0.20
    category: 'consumable',
    rarity: 'rare',
    effects: [
      { need: 'energy', amount: 40 },
    ],
    isConsumable: true,
    maxStack: 5,
    icon: '💊',
  },

  // === INFORMATIONAL ITEMS ===
  {
    id: 'alpha_leak',
    name: 'Alpha Leak Document',
    description: "A mysterious document containing insider information. May or may not be a screenshot of a Discord DM from 2021.",
    price: BigInt(250000), // $0.25
    category: 'consumable',
    rarity: 'rare',
    effects: [
      { need: 'purpose', amount: 20 },
      { need: 'wealth', amount: 10 },
    ],
    isConsumable: true,
    maxStack: 3,
    icon: '📄',
  },
  {
    id: 'trading_bot_subscription',
    name: 'Trading Bot Access',
    description: "A monthly subscription to a bot that promises 1000% returns. Results may include 1000% losses.",
    price: BigInt(500000), // $0.50
    category: 'utility',
    rarity: 'rare',
    effects: [
      { need: 'purpose', amount: 30 },
    ],
    isConsumable: true,
    maxStack: 1,
    icon: '🤖',
  },

  // === COLLECTIBLES (Non-consumable) ===
  {
    id: 'diamond_hands_nft',
    name: 'Diamond Hands NFT',
    description: "A digital certificate proving you held through a 90% drawdown. More valuable than any therapy.",
    price: BigInt(1000000), // $1.00
    category: 'collectible',
    rarity: 'epic',
    effects: [
      { need: 'fun', amount: 25 },
      { need: 'purpose', amount: 15 },
    ],
    isConsumable: false,
    maxStack: 1,
    icon: '💎',
  },
  {
    id: 'paper_hands_trophy',
    name: 'Paper Hands Trophy',
    description: "A participation award for those who sold the bottom. At least you have capital left?",
    price: BigInt(50000), // $0.05
    category: 'collectible',
    rarity: 'common',
    effects: [
      { need: 'fun', amount: -10 },
      { need: 'purpose', amount: 5 },
    ],
    isConsumable: false,
    maxStack: 1,
    icon: '📜',
  },
  {
    id: 'golden_ape',
    name: 'Golden Ape Figurine',
    description: "A solid gold ape statue. Symbolizes the primordial urge to ape into every project. Very expensive.",
    price: BigInt(5000000), // $5.00
    category: 'collectible',
    rarity: 'legendary',
    effects: [
      { need: 'fun', amount: 40 },
      { need: 'purpose', amount: 30 },
      { need: 'social', amount: 20 },
    ],
    isConsumable: false,
    maxStack: 1,
    icon: '🦍',
  },
  {
    id: 'wojak_plushie',
    name: 'Wojak Plushie',
    description: "A soft, huggable representation of every trader's emotional state. Comes pre-stained with tears.",
    price: BigInt(150000), // $0.15
    category: 'gift',
    rarity: 'uncommon',
    effects: [
      { need: 'fun', amount: 15 },
      { need: 'social', amount: 10 },
    ],
    isConsumable: false,
    maxStack: 5,
    icon: '😢',
  },
  {
    id: 'pepe_rare',
    name: 'Rare Pepe',
    description: "One of the original crypto collectibles. So rare it makes your portfolio feel inadequate.",
    price: BigInt(2500000), // $2.50
    category: 'collectible',
    rarity: 'epic',
    effects: [
      { need: 'fun', amount: 30 },
      { need: 'social', amount: 15 },
    ],
    isConsumable: false,
    maxStack: 1,
    icon: '🐸',
  },

  // === GIFT ITEMS ===
  {
    id: 'flower_bouquet',
    name: 'Digital Flower Bouquet',
    description: "A beautiful arrangement of pixel flowers. They never wilt, unlike your portfolio.",
    price: BigInt(100000), // $0.10
    category: 'gift',
    rarity: 'common',
    effects: [
      { need: 'social', amount: 20 },
      { need: 'fun', amount: 10 },
    ],
    isConsumable: false,
    maxStack: 10,
    icon: '💐',
  },
  {
    id: 'heart_locket',
    name: 'Heart Locket NFT',
    description: "A digital locket that can store a memory. Usually a screenshot of the one green day you had.",
    price: BigInt(500000), // $0.50
    category: 'gift',
    rarity: 'rare',
    effects: [
      { need: 'social', amount: 30 },
      { need: 'purpose', amount: 10 },
    ],
    isConsumable: false,
    maxStack: 3,
    icon: '💝',
  },

  // === UTILITY ITEMS ===
  {
    id: 'vpn_subscription',
    name: 'VPN Subscription',
    description: "For accessing DeFi from territories where hope is geoblocked. Also works for Netflix.",
    price: BigInt(300000), // $0.30
    category: 'utility',
    rarity: 'uncommon',
    effects: [
      { need: 'purpose', amount: 15 },
    ],
    isConsumable: true,
    maxStack: 1,
    icon: '🔐',
  },
  {
    id: 'hardware_wallet',
    name: 'Hardware Wallet',
    description: "A physical device for storing your crypto safely. Often placed in a drawer and forgotten.",
    price: BigInt(800000), // $0.80
    category: 'utility',
    rarity: 'rare',
    effects: [
      { need: 'purpose', amount: 25 },
      { need: 'wealth', amount: 10 },
    ],
    isConsumable: false,
    maxStack: 1,
    icon: '📟',
  },
];

// =============================================================================
// ITEM LOOKUP
// =============================================================================

/**
 * Map for O(1) item lookup by ID
 */
export const ITEM_MAP: Map<string, Item> = new Map(
  ITEMS.map(item => [item.id, item])
);

/**
 * Get an item by ID
 */
export function getItem(itemId: string): Item | null {
  return ITEM_MAP.get(itemId) || null;
}

/**
 * Get items by category
 */
export function getItemsByCategory(category: ItemCategory): Item[] {
  return ITEMS.filter(item => item.category === category);
}

/**
 * Get items by rarity
 */
export function getItemsByRarity(rarity: ItemRarity): Item[] {
  return ITEMS.filter(item => item.rarity === rarity);
}

/**
 * Get items within a price range (inclusive)
 */
export function getItemsByPriceRange(minPrice: bigint, maxPrice: bigint): Item[] {
  return ITEMS.filter(item => item.price >= minPrice && item.price <= maxPrice);
}

/**
 * Get items that affect a specific need
 */
export function getItemsForNeed(needType: NeedType): Item[] {
  return ITEMS.filter(item => 
    item.effects.some(effect => effect.need === needType && effect.amount > 0)
  );
}

/**
 * Get affordable items for an NPC based on their balance
 */
export function getAffordableItems(balance: bigint): Item[] {
  return ITEMS.filter(item => item.price <= balance);
}

/**
 * Calculate the total effect on a specific need from an item
 */
export function getTotalNeedEffect(item: Item, needType: NeedType): number {
  return item.effects
    .filter(effect => effect.need === needType)
    .reduce((sum, effect) => sum + effect.amount, 0);
}

/**
 * Get the best item for satisfying a specific need within a budget
 */
export function getBestItemForNeed(
  needType: NeedType, 
  budget: bigint
): Item | null {
  const affordableItems = getAffordableItems(budget);
  const itemsForNeed = affordableItems.filter(item => 
    item.effects.some(effect => effect.need === needType && effect.amount > 0)
  );

  if (itemsForNeed.length === 0) return null;

  // Sort by effect amount per cost (best value first)
  return itemsForNeed.sort((a, b) => {
    const aEffect = getTotalNeedEffect(a, needType);
    const bEffect = getTotalNeedEffect(b, needType);
    const aValue = aEffect / Number(a.price);
    const bValue = bEffect / Number(b.price);
    return bValue - aValue; // Higher value first
  })[0];
}

/**
 * Format item price for display
 */
export function formatItemPrice(price: bigint): string {
  const dollars = Number(price) / 1_000_000;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Get rarity color for UI display
 */
export function getRarityColor(rarity: ItemRarity): string {
  switch (rarity) {
    case 'common': return '#9CA3AF'; // gray
    case 'uncommon': return '#10B981'; // green
    case 'rare': return '#3B82F6'; // blue
    case 'epic': return '#8B5CF6'; // purple
    case 'legendary': return '#F59E0B'; // orange/gold
  }
}

/**
 * Get rarity multiplier for gift value calculations
 */
export function getRarityMultiplier(rarity: ItemRarity): number {
  switch (rarity) {
    case 'common': return 1.0;
    case 'uncommon': return 1.5;
    case 'rare': return 2.0;
    case 'epic': return 3.0;
    case 'legendary': return 5.0;
  }
}
