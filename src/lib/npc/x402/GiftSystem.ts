/**
 * X402 Gift System
 * 
 * Handles NPC-to-NPC gift giving with relationship effects.
 * Gifts cost USDT₮ to give (transferred to recipient) and affect relationships.
 * 
 * "The art of gift-giving in Crypto City: 90% strategy, 10% genuine affection."
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { NPCTransaction, PaymentResult } from './types';
import type { Item, ItemCategory, ItemRarity } from './items';
import { getItem, getRarityMultiplier, formatItemPrice, ITEMS } from './items';
import { getNPCWalletManager } from './NPCWalletManager';
import { formatUnits } from 'viem';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Gift preference reaction level
 */
export type GiftReaction = 'loves' | 'likes' | 'neutral' | 'dislikes' | 'hates';

/**
 * Gift preference profile for an NPC
 */
export interface GiftPreferenceProfile {
  /** Categories this NPC loves */
  lovedCategories: ItemCategory[];
  /** Categories this NPC dislikes */
  dislikedCategories: ItemCategory[];
  /** Specific item IDs they love */
  lovedItems: string[];
  /** Specific item IDs they hate */
  hatedItems: string[];
  /** Minimum rarity they respect */
  minRespectedRarity: ItemRarity;
}

/**
 * Result of giving a gift
 */
export interface GiftResult {
  success: boolean;
  /** The gift item */
  item?: Item;
  /** Gift recipient's reaction */
  reaction?: GiftReaction;
  /** Relationship boost/penalty */
  relationshipChange?: number;
  /** Mood boost for both NPCs */
  moodChange?: {
    giver: number;
    receiver: number;
  };
  /** Payment result */
  payment?: PaymentResult;
  /** Transaction record */
  transaction?: NPCTransaction;
  /** Generated dialogue for the reaction */
  dialogue?: string;
  /** Error message if failed */
  error?: string;
  /** Memories created */
  memories?: {
    giver: string;
    receiver: string;
  };
}

/**
 * Gift history entry
 */
export interface GiftHistoryEntry {
  itemId: string;
  giverId: string;
  receiverId: string;
  reaction: GiftReaction;
  relationshipChange: number;
  timestamp: number;
  gameDay: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Base relationship change per reaction type
 */
const REACTION_BASE_POINTS: Record<GiftReaction, number> = {
  loves: 25,
  likes: 12,
  neutral: 5,
  dislikes: -8,
  hates: -20,
};

/**
 * Mood change per reaction type for receiver
 */
const RECEIVER_MOOD_CHANGE: Record<GiftReaction, number> = {
  loves: 30,
  likes: 15,
  neutral: 5,
  dislikes: -10,
  hates: -25,
};

/**
 * Mood change for giver based on receiver's reaction
 */
const GIVER_MOOD_CHANGE: Record<GiftReaction, number> = {
  loves: 20,
  likes: 10,
  neutral: 5,
  dislikes: -15,
  hates: -30,
};

/**
 * Gift reaction dialogues
 */
const REACTION_DIALOGUES: Record<GiftReaction, string[]> = {
  loves: [
    "No way! This is exactly what I wanted! You're amazing!",
    "I... I can't believe it. This is perfect. Thank you so much!",
    "Holy shitcoins, you actually got me a {item}! Best day ever!",
    "This is incredible! How did you know?! I'm holding this forever!",
  ],
  likes: [
    "Oh nice, {item}! Thanks, I really appreciate it.",
    "A {item}! Pretty solid choice, thank you!",
    "Hey, this is cool! Thanks for thinking of me.",
  ],
  neutral: [
    "Oh, a {item}. Thanks, I guess? Not really my thing but I appreciate it.",
    "A {item}... interesting choice. Thanks anyway.",
    "Hmm, {item}. Well, it's the thought that counts, right?",
  ],
  dislikes: [
    "{item}? Uh... thanks I guess. Not really my style though.",
    "Oh... {item}. I mean, thanks but... yeah.",
    "A {item}? Do you... not know me at all?",
  ],
  hates: [
    "{item}?! Are you serious right now? This is basically an insult.",
    "You got me {item}? Did I do something to offend you?",
    "{item}... wow. I don't even know what to say. Just... wow.",
    "Please tell me this is some kind of joke. {item}? Really?",
  ],
};

// =============================================================================
// GIFT SYSTEM CLASS
// =============================================================================

/**
 * Gift System Manager
 * 
 * Handles gift giving between NPCs with relationship and mood effects.
 */
export class GiftSystem {
  private giftHistory: GiftHistoryEntry[] = [];
  private preferenceProfiles: Map<string, GiftPreferenceProfile> = new Map();
  private transactionIdCounter = 0;

  /**
   * Give a gift from one NPC to another
   * 
   * @param giver - NPC giving the gift
   * @param receiver - NPC receiving the gift
   * @param itemId - ID of the item being gifted
   * @param gameDay - Current game day
   * @returns Result of the gift giving
   */
  async giveGift(
    giver: CryptoNPC,
    receiver: CryptoNPC,
    itemId: string,
    gameDay: number
  ): Promise<GiftResult> {
    const walletManager = getNPCWalletManager();
    const item = getItem(itemId);

    if (!item) {
      return {
        success: false,
        error: `Item not found: ${itemId}`,
      };
    }

    // Check giver has wallet and balance
    const giverWallet = walletManager.getWallet(giver.id);
    if (!giverWallet) {
      return {
        success: false,
        error: 'Giver has no wallet',
      };
    }

    const balance = await walletManager.fetchBalance(giver.id);
    if (balance < item.price) {
      return {
        success: false,
        error: `Insufficient balance for ${item.name}`,
      };
    }

    // Ensure receiver has a wallet
    walletManager.getOrCreateWallet(receiver.id);

    // Execute payment (gift value transfers to receiver)
    const paymentResult = await walletManager.transfer(
      giver.id,
      receiver.id,
      item.price,
      `Gift: ${item.name}`
    );

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error,
      };
    }

    // Calculate gift reaction
    const reaction = this.calculateGiftReaction(receiver, item);
    const relationshipChange = this.calculateRelationshipChange(item, reaction);
    const moodChange = {
      giver: GIVER_MOOD_CHANGE[reaction],
      receiver: RECEIVER_MOOD_CHANGE[reaction],
    };

    // Create transaction record
    const transaction = this.createTransaction(
      giver.id,
      receiver.id,
      item.price,
      item.name,
      paymentResult.txHash,
      gameDay
    );

    // Generate dialogue
    const dialogue = this.generateDialogue(item, reaction);

    // Record in history
    this.giftHistory.push({
      itemId,
      giverId: giver.id,
      receiverId: receiver.id,
      reaction,
      relationshipChange,
      timestamp: Date.now(),
      gameDay,
    });

    // Create memories
    const memories = {
      giver: `Gave ${item.name} to ${receiver.name}. They ${reaction} it.`,
      receiver: `Received ${item.name} from ${giver.name}. ${reaction === 'loves' ? 'Amazing gift!' : reaction === 'hates' ? 'Terrible choice...' : 'Appreciated the gesture.'}`,
    };

    return {
      success: true,
      item,
      reaction,
      relationshipChange,
      moodChange,
      payment: paymentResult,
      transaction,
      dialogue,
      memories,
    };
  }

  /**
   * Calculate the receiver's reaction to a gift
   */
  private calculateGiftReaction(receiver: CryptoNPC, item: Item): GiftReaction {
    // Get or generate preference profile
    const profile = this.getOrCreatePreferenceProfile(receiver);

    // Check specific loved/hated items first
    if (profile.lovedItems.includes(item.id)) {
      return 'loves';
    }
    if (profile.hatedItems.includes(item.id)) {
      return 'hates';
    }

    // Check category preferences
    if (profile.lovedCategories.includes(item.category)) {
      return item.rarity >= profile.minRespectedRarity ? 'loves' : 'likes';
    }
    if (profile.dislikedCategories.includes(item.category)) {
      return 'dislikes';
    }

    // Check rarity threshold
    const rarityScore = this.getRarityScore(item.rarity);
    const minScore = this.getRarityScore(profile.minRespectedRarity);

    if (rarityScore >= minScore + 2) {
      return 'loves'; // Very high quality gift
    }
    if (rarityScore >= minScore) {
      return 'likes';
    }
    if (rarityScore < minScore - 1) {
      return 'dislikes'; // Cheap gift, perceived as insult
    }

    return 'neutral';
  }

  /**
   * Calculate relationship change from gift
   */
  private calculateRelationshipChange(item: Item, reaction: GiftReaction): number {
    const basePoints = REACTION_BASE_POINTS[reaction];
    const rarityMultiplier = getRarityMultiplier(item.rarity);
    
    // Price factor - more expensive gifts have more impact
    const priceInDollars = Number(item.price) / 1_000_000;
    const priceFactor = Math.min(2.0, 1.0 + priceInDollars * 0.2);

    return Math.round(basePoints * rarityMultiplier * priceFactor);
  }

  /**
   * Get or create a preference profile for an NPC
   */
  private getOrCreatePreferenceProfile(npc: CryptoNPC): GiftPreferenceProfile {
    const existing = this.preferenceProfiles.get(npc.id);
    if (existing) return existing;

    // Generate based on personality and occupation
    const profile = this.generatePreferenceProfile(npc);
    this.preferenceProfiles.set(npc.id, profile);
    return profile;
  }

  /**
   * Generate a preference profile based on NPC characteristics
   */
  private generatePreferenceProfile(npc: CryptoNPC): GiftPreferenceProfile {
    const profile: GiftPreferenceProfile = {
      lovedCategories: [],
      dislikedCategories: [],
      lovedItems: [],
      hatedItems: [],
      minRespectedRarity: 'common',
    };

    // Base preferences on occupation
    switch (npc.occupation) {
      case 'trader':
        profile.lovedCategories = ['utility', 'consumable'];
        profile.dislikedCategories = ['gift']; // Too sentimental
        profile.lovedItems = ['alpha_leak', 'trading_bot_subscription'];
        profile.minRespectedRarity = 'uncommon';
        break;
      case 'developer':
        profile.lovedCategories = ['utility', 'collectible'];
        profile.lovedItems = ['hardware_wallet', 'vpn_subscription'];
        profile.minRespectedRarity = 'uncommon';
        break;
      case 'artist':
        profile.lovedCategories = ['collectible', 'gift'];
        profile.lovedItems = ['rare_pepe', 'golden_ape'];
        profile.hatedItems = ['paper_hands_trophy'];
        profile.minRespectedRarity = 'rare';
        break;
      case 'bartender':
        profile.lovedCategories = ['consumable', 'gift'];
        profile.lovedItems = ['hopium_cocktail', 'wojak_plushie'];
        profile.minRespectedRarity = 'common';
        break;
      case 'shop_owner':
        profile.lovedCategories = ['utility'];
        profile.dislikedCategories = ['consumable']; // They sell those
        profile.minRespectedRarity = 'uncommon';
        break;
      case 'miner':
        profile.lovedCategories = ['consumable', 'utility'];
        profile.lovedItems = ['energy_drink', 'copium_coffee'];
        profile.minRespectedRarity = 'common';
        break;
      case 'security':
        profile.lovedCategories = ['utility'];
        profile.lovedItems = ['vpn_subscription', 'hardware_wallet'];
        profile.dislikedCategories = ['gift']; // Too soft
        profile.minRespectedRarity = 'uncommon';
        break;
      case 'unemployed':
        profile.lovedCategories = ['consumable', 'gift'];
        profile.lovedItems = ['ramen_bowl', 'hopium_cocktail'];
        profile.minRespectedRarity = 'common'; // Appreciates anything
        break;
    }

    // Adjust based on personality if available
    if (npc.personality?.bigFive) {
      // Extroverts like social/gift items more
      if (npc.personality.bigFive.extraversion > 0.7) {
        if (!profile.lovedCategories.includes('gift')) {
          profile.lovedCategories.push('gift');
        }
      }
      
      // High openness = appreciates collectibles
      if (npc.personality.bigFive.openness > 0.7) {
        if (!profile.lovedCategories.includes('collectible')) {
          profile.lovedCategories.push('collectible');
        }
      }

      // High conscientiousness = dislikes frivolous items
      if (npc.personality.bigFive.conscientiousness > 0.8) {
        if (!profile.dislikedCategories.includes('consumable')) {
          profile.dislikedCategories.push('consumable');
        }
        profile.minRespectedRarity = 'rare';
      }
    }

    return profile;
  }

  /**
   * Get numeric score for rarity
   */
  private getRarityScore(rarity: ItemRarity): number {
    switch (rarity) {
      case 'common': return 1;
      case 'uncommon': return 2;
      case 'rare': return 3;
      case 'epic': return 4;
      case 'legendary': return 5;
    }
  }

  /**
   * Generate dialogue for gift reaction
   */
  private generateDialogue(item: Item, reaction: GiftReaction): string {
    const dialogues = REACTION_DIALOGUES[reaction];
    const template = dialogues[Math.floor(Math.random() * dialogues.length)];
    return template.replace('{item}', item.name);
  }

  /**
   * Create a transaction record
   */
  private createTransaction(
    fromNpcId: string,
    toNpcId: string,
    amount: bigint,
    itemName: string,
    txHash: `0x${string}` | undefined,
    gameDay: number
  ): NPCTransaction {
    return {
      id: `gift_${++this.transactionIdCounter}`,
      fromNpcId,
      toNpcId,
      amount,
      type: 'gift',
      reason: `Gift: ${itemName}`,
      txHash,
      status: 'confirmed',
      timestamp: Date.now(),
      gameDay,
    };
  }

  /**
   * Get suggested gifts for an NPC based on their preferences
   */
  getSuggestedGifts(receiver: CryptoNPC, budget: bigint): Item[] {
    const profile = this.getOrCreatePreferenceProfile(receiver);
    
    return ITEMS
      .filter(item => item.price <= budget)
      .map(item => {
        // Score each item based on preferences
        let score = 0;
        
        if (profile.lovedItems.includes(item.id)) score += 100;
        if (profile.hatedItems.includes(item.id)) score -= 100;
        if (profile.lovedCategories.includes(item.category)) score += 50;
        if (profile.dislikedCategories.includes(item.category)) score -= 50;
        
        const rarityScore = this.getRarityScore(item.rarity);
        const minScore = this.getRarityScore(profile.minRespectedRarity);
        score += (rarityScore - minScore) * 20;
        
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ item }) => item);
  }

  /**
   * Get gift history for an NPC
   */
  getGiftHistory(npcId: string): GiftHistoryEntry[] {
    return this.giftHistory.filter(
      entry => entry.giverId === npcId || entry.receiverId === npcId
    );
  }

  /**
   * Get gifts received by an NPC from a specific giver
   */
  getGiftsFromNPC(receiverId: string, giverId: string): GiftHistoryEntry[] {
    return this.giftHistory.filter(
      entry => entry.receiverId === receiverId && entry.giverId === giverId
    );
  }

  /**
   * Check if an NPC has gifted today (for daily limits)
   */
  hasGiftedToday(giverId: string, receiverId: string, gameDay: number): boolean {
    return this.giftHistory.some(
      entry => 
        entry.giverId === giverId && 
        entry.receiverId === receiverId && 
        entry.gameDay === gameDay
    );
  }

  /**
   * Get statistics about gifting
   */
  getGiftStats(): {
    totalGifts: number;
    averageReaction: number;
    mostPopularGift: string | null;
    mostGenerousNPC: string | null;
  } {
    if (this.giftHistory.length === 0) {
      return {
        totalGifts: 0,
        averageReaction: 0,
        mostPopularGift: null,
        mostGenerousNPC: null,
      };
    }

    const reactionScores: Record<GiftReaction, number> = {
      loves: 5,
      likes: 4,
      neutral: 3,
      dislikes: 2,
      hates: 1,
    };

    const totalReactionScore = this.giftHistory.reduce(
      (sum, entry) => sum + reactionScores[entry.reaction],
      0
    );

    // Count items
    const itemCounts: Record<string, number> = {};
    const giverCounts: Record<string, number> = {};

    for (const entry of this.giftHistory) {
      itemCounts[entry.itemId] = (itemCounts[entry.itemId] || 0) + 1;
      giverCounts[entry.giverId] = (giverCounts[entry.giverId] || 0) + 1;
    }

    const mostPopularGift = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const mostGenerousNPC = Object.entries(giverCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      totalGifts: this.giftHistory.length,
      averageReaction: totalReactionScore / this.giftHistory.length,
      mostPopularGift,
      mostGenerousNPC,
    };
  }

  /**
   * Clear gift history (for testing/reset)
   */
  clear(): void {
    this.giftHistory = [];
    this.preferenceProfiles.clear();
    this.transactionIdCounter = 0;
  }
}

// Singleton instance
export const giftSystem = new GiftSystem();
