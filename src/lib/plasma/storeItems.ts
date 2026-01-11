/**
 * Store Items
 * 
 * Definition of in-game purchasable items with Plasma USDT0.
 */

import type { StoreItem } from './types';
import { toAtomicUnits } from './eip3009';

// Store item definitions
export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'starter-pack',
    name: 'Starter Pack',
    description: '1000 credits + 3 bonus buildings to jumpstart your city',
    price: 0.99,
    priceAtomic: toAtomicUnits(0.99),
    icon: '🎁',
    category: 'credits',
  },
  {
    id: 'credit-boost',
    name: 'Credit Boost',
    description: '5000 credits for expanding your empire',
    price: 3.99,
    priceAtomic: toAtomicUnits(3.99),
    icon: '💰',
    category: 'credits',
  },
  {
    id: 'city-expansion',
    name: 'City Expansion',
    description: 'Unlock larger 64x64 grid for mega cities',
    price: 4.99,
    priceAtomic: toAtomicUnits(4.99),
    icon: '🗺️',
    category: 'expansion',
  },
  {
    id: 'premium-buildings',
    name: 'Premium Buildings',
    description: 'Access to legendary crypto buildings and landmarks',
    price: 6.99,
    priceAtomic: toAtomicUnits(6.99),
    icon: '🏛️',
    category: 'expansion',
  },
  {
    id: 'whale-estate',
    name: 'Whale Estate',
    description: 'Exclusive whale mansion with golden textures',
    price: 9.99,
    priceAtomic: toAtomicUnits(9.99),
    icon: '🐋',
    category: 'cosmetic',
  },
  {
    id: 'defi-tower',
    name: 'DeFi Tower',
    description: 'Towering DeFi headquarters for your financial district',
    price: 7.99,
    priceAtomic: toAtomicUnits(7.99),
    icon: '🏢',
    category: 'cosmetic',
  },
  {
    id: 'season-pass',
    name: 'Season Pass',
    description: 'All seasonal content and exclusive monthly rewards',
    price: 14.99,
    priceAtomic: toAtomicUnits(14.99),
    icon: '⭐',
    category: 'subscription',
  },
  {
    id: 'ad-free',
    name: 'Ad-Free Forever',
    description: 'Remove all advertisements permanently',
    price: 9.99,
    priceAtomic: toAtomicUnits(9.99),
    icon: '🚫',
    category: 'subscription',
  },
];

// Get items by category
export function getStoreItemsByCategory(category: StoreItem['category']): StoreItem[] {
  return STORE_ITEMS.filter(item => item.category === category);
}

// Get item by ID
export function getStoreItem(id: string): StoreItem | undefined {
  return STORE_ITEMS.find(item => item.id === id);
}

// Storage key for owned items
const OWNED_ITEMS_KEY = 'crypto-city-owned-items';

// Get owned items from localStorage
export function getOwnedItems(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(OWNED_ITEMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Add owned item to localStorage
export function addOwnedItem(itemId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const owned = getOwnedItems();
    if (!owned.includes(itemId)) {
      owned.push(itemId);
      localStorage.setItem(OWNED_ITEMS_KEY, JSON.stringify(owned));
    }
  } catch (e) {
    console.error('Failed to save owned item:', e);
  }
}

// Check if item is owned
export function isItemOwned(itemId: string): boolean {
  return getOwnedItems().includes(itemId);
}
