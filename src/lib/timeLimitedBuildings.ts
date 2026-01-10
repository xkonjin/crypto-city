/**
 * Time-Limited Buildings System
 * 
 * Implements FOMO/time-limited building offers for Crypto City.
 * Creates urgency with rotating flash sales, limited editions, and special offers.
 * 
 * Issue #49
 */

// =============================================================================
// TYPES
// =============================================================================

export type OfferType = 'flash_sale' | 'limited_edition' | 'early_bird' | 'weekend_special';

export interface TimeLimitedOffer {
  id: string;
  buildingId: string;
  name: string;
  description: string;
  type: OfferType;
  discount: number; // 0-50%
  bonusYield: number; // Extra yield %
  expiresAt: number; // Timestamp
  maxPurchases: number;
  purchased: number;
  cobieComment: string;
}

export interface TimeLimitedState {
  offers: TimeLimitedOffer[];
  lastRotation: number; // Date string YYYY-MM-DD
  purchaseHistory: Record<string, number>; // offerId -> purchase count
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = 'cryptoCityTimeLimitedOffers';

// Building IDs that can have time-limited offers
// Using actual building IDs from the crypto buildings registry
const ELIGIBLE_BUILDINGS = [
  'aave_lending_tower',
  'uniswap_exchange',
  'compound_vault',
  'curve_pool',
  'lido_stake_hub',
  'maker_dao_forge',
  'yearn_vault',
  'sushiswap_dojo',
  'pancakeswap_kitchen',
  'gmx_arena',
  'jupiter_station',
  'raydium_reactor',
  'orca_whirlpool',
  'drift_terminal',
  'binance_tower',
  'coinbase_campus',
  'kraken_citadel',
  'ethereum_tower',
  'solana_spire',
  'bitcoin_citadel',
  'arbitrum_gateway',
  'optimism_bridge',
  'polygon_plaza',
  'base_basecamp',
  'doge_fountain',
  'pepe_plaza',
  'shib_shrine',
  'wojak_statue',
  'chainlink_oracle_tower',
  'layerzero_bridge',
];

// Cobie's sardonic FOMO commentary
const COBIE_FOMO_COMMENTS: Record<OfferType, string[]> = {
  flash_sale: [
    "This is definitely not market manipulation.",
    "Limited supply creates value, right?",
    "NGMI if you miss this. Or maybe NGMI if you don't. Who knows.",
    "The best time to buy was yesterday. The second best time is... still not now.",
    "Artificial scarcity is my favorite kind of scarcity.",
  ],
  limited_edition: [
    "Only 5 available. Because 6 would be too many.",
    "Exclusivity is just another word for 'we made less of them'.",
    "Limited edition = regular edition with a different colored box.",
    "You're not buying a building, you're buying the feeling of owning something rare.",
    "Remember: scarcity doesn't equal value. But it might.",
  ],
  early_bird: [
    "The early bird gets the worm. The late bird gets... less worm.",
    "First mover advantage is real. So is first mover disadvantage.",
    "Be greedy when others are fearful. This is financial advice. (It's not.)",
    "Early = smart. Late = dumb. Obviously.",
    "Getting in early is great until you realize everyone thinks they're early.",
  ],
  weekend_special: [
    "Weekend vibes only. And by vibes I mean discounts.",
    "Because nothing says 'relaxation' like FOMO.",
    "Enjoy your weekend by stressing about limited time offers.",
    "The market doesn't sleep. Neither should you.",
    "Saturday is for the builders. And the buyers.",
  ],
};

// Offer templates
const OFFER_TEMPLATES: Omit<TimeLimitedOffer, 'id' | 'expiresAt' | 'purchased' | 'cobieComment'>[] = [
  // Flash Sales (30% off, 24 hours)
  {
    buildingId: 'aave_lending_tower',
    name: 'Flash Sale: Aave Tower',
    description: '30% off the iconic lending tower! 24 hours only.',
    type: 'flash_sale',
    discount: 30,
    bonusYield: 0,
    maxPurchases: 10,
  },
  {
    buildingId: 'uniswap_exchange',
    name: 'Flash Sale: Uniswap Exchange',
    description: 'Unicorn power at 30% off! Limited time.',
    type: 'flash_sale',
    discount: 30,
    bonusYield: 0,
    maxPurchases: 10,
  },
  {
    buildingId: 'compound_vault',
    name: 'Flash Sale: Compound Vault',
    description: 'Compound your savings with 30% off!',
    type: 'flash_sale',
    discount: 30,
    bonusYield: 0,
    maxPurchases: 10,
  },
  {
    buildingId: 'ethereum_tower',
    name: 'Flash Sale: Ethereum Tower',
    description: 'The original smart contract HQ, 30% off!',
    type: 'flash_sale',
    discount: 30,
    bonusYield: 0,
    maxPurchases: 8,
  },
  {
    buildingId: 'solana_spire',
    name: 'Flash Sale: Solana Spire',
    description: 'Fast finality, fast sale! 30% off.',
    type: 'flash_sale',
    discount: 30,
    bonusYield: 0,
    maxPurchases: 10,
  },
  // Limited Edition (+10% yield, only 5 available)
  {
    buildingId: 'bitcoin_citadel',
    name: 'Limited Edition: Golden Citadel',
    description: 'Special gold variant with +10% yield. Only 5 ever!',
    type: 'limited_edition',
    discount: 0,
    bonusYield: 10,
    maxPurchases: 5,
  },
  {
    buildingId: 'binance_tower',
    name: 'Limited Edition: VIP Binance Tower',
    description: 'Exclusive VIP version with boosted yield.',
    type: 'limited_edition',
    discount: 0,
    bonusYield: 10,
    maxPurchases: 5,
  },
  {
    buildingId: 'chainlink_oracle_tower',
    name: 'Limited Edition: Oracle Prime',
    description: 'Enhanced oracle with premium data feeds.',
    type: 'limited_edition',
    discount: 0,
    bonusYield: 10,
    maxPurchases: 5,
  },
  {
    buildingId: 'gmx_arena',
    name: 'Limited Edition: GMX Pro Arena',
    description: 'Professional trading floor with boosted fees.',
    type: 'limited_edition',
    discount: 0,
    bonusYield: 10,
    maxPurchases: 5,
  },
  // Early Bird (first 3 get 50% bonus yield)
  {
    buildingId: 'lido_stake_hub',
    name: 'Early Bird: Lido Stake Hub',
    description: 'First 3 buyers get 50% bonus yield!',
    type: 'early_bird',
    discount: 0,
    bonusYield: 50,
    maxPurchases: 3,
  },
  {
    buildingId: 'maker_dao_forge',
    name: 'Early Bird: MakerDAO Forge',
    description: 'Early adopters get massive yield boost!',
    type: 'early_bird',
    discount: 0,
    bonusYield: 50,
    maxPurchases: 3,
  },
  {
    buildingId: 'yearn_vault',
    name: 'Early Bird: Yearn Vault',
    description: 'Be early to the yield optimization!',
    type: 'early_bird',
    discount: 0,
    bonusYield: 50,
    maxPurchases: 3,
  },
  {
    buildingId: 'jupiter_station',
    name: 'Early Bird: Jupiter Station',
    description: 'First movers get the best routes.',
    type: 'early_bird',
    discount: 0,
    bonusYield: 50,
    maxPurchases: 3,
  },
  // Weekend Specials (Friday-Sunday, moderate bonuses)
  {
    buildingId: 'pepe_plaza',
    name: 'Weekend Special: Pepe Plaza',
    description: 'Weekend meme magic! 20% off + 5% yield.',
    type: 'weekend_special',
    discount: 20,
    bonusYield: 5,
    maxPurchases: 15,
  },
  {
    buildingId: 'doge_fountain',
    name: 'Weekend Special: Doge Fountain',
    description: 'Much discount. Very wow. Such weekend.',
    type: 'weekend_special',
    discount: 20,
    bonusYield: 5,
    maxPurchases: 15,
  },
  {
    buildingId: 'shib_shrine',
    name: 'Weekend Special: Shib Shrine',
    description: 'The Shiba army marches on weekends.',
    type: 'weekend_special',
    discount: 20,
    bonusYield: 5,
    maxPurchases: 15,
  },
  {
    buildingId: 'coinbase_campus',
    name: 'Weekend Special: Coinbase Campus',
    description: 'Institutional grade, weekend price.',
    type: 'weekend_special',
    discount: 15,
    bonusYield: 5,
    maxPurchases: 10,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Simple seeded random number generator for deterministic offer selection
 */
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * Get a deterministic seed from a date string
 */
function getDateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Check if today is a weekend (Friday, Saturday, or Sunday)
 */
function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 5 || day === 6; // Sunday = 0, Friday = 5, Saturday = 6
}

/**
 * Get offer duration based on type
 */
function getOfferDuration(type: OfferType): number {
  switch (type) {
    case 'flash_sale':
      return 24 * 60 * 60 * 1000; // 24 hours
    case 'limited_edition':
      return 48 * 60 * 60 * 1000; // 48 hours
    case 'early_bird':
      return 36 * 60 * 60 * 1000; // 36 hours
    case 'weekend_special':
      return 72 * 60 * 60 * 1000; // 72 hours (full weekend)
    default:
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * Get a random Cobie comment for an offer type
 */
function getCobieComment(type: OfferType, seed: number): string {
  const comments = COBIE_FOMO_COMMENTS[type];
  const random = seededRandom(seed);
  const index = Math.floor(random() * comments.length);
  return comments[index];
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Load time-limited offer state from localStorage
 */
export function loadTimeLimitedState(): TimeLimitedState {
  if (typeof window === 'undefined') {
    return { offers: [], lastRotation: 0, purchaseHistory: {} };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  
  return { offers: [], lastRotation: 0, purchaseHistory: {} };
}

/**
 * Save time-limited offer state to localStorage
 */
export function saveTimeLimitedState(state: TimeLimitedState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Generate today's offers (deterministic based on date)
 */
export function generateDailyOffers(): TimeLimitedOffer[] {
  const today = getTodayString();
  const seed = getDateSeed(today);
  const random = seededRandom(seed);
  
  const now = Date.now();
  const offers: TimeLimitedOffer[] = [];
  
  // Shuffle templates using seeded random
  const shuffled = [...OFFER_TEMPLATES].sort(() => random() - 0.5);
  
  // Select 1-3 offers based on conditions
  const numOffers = isWeekend() ? 3 : Math.floor(random() * 2) + 1; // 1-2 weekdays, 3 on weekends
  
  // Priority: Weekend specials on weekends, otherwise mix
  let selected: typeof OFFER_TEMPLATES = [];
  
  if (isWeekend()) {
    // On weekends, always include at least one weekend special
    const weekendOffers = shuffled.filter(o => o.type === 'weekend_special');
    const otherOffers = shuffled.filter(o => o.type !== 'weekend_special');
    
    if (weekendOffers.length > 0) {
      selected.push(weekendOffers[0]);
    }
    
    // Fill remaining slots
    while (selected.length < numOffers && otherOffers.length > 0) {
      selected.push(otherOffers.shift()!);
    }
  } else {
    // Weekdays: mix of flash sales, limited editions, early birds
    const nonWeekendOffers = shuffled.filter(o => o.type !== 'weekend_special');
    selected = nonWeekendOffers.slice(0, numOffers);
  }
  
  // Convert templates to offers with IDs and expiration
  for (let i = 0; i < selected.length; i++) {
    const template = selected[i];
    const offerId = `${today}-${template.buildingId}-${i}`;
    
    offers.push({
      ...template,
      id: offerId,
      expiresAt: now + getOfferDuration(template.type),
      purchased: 0,
      cobieComment: getCobieComment(template.type, seed + i),
    });
  }
  
  return offers;
}

/**
 * Get current active offers (checks expiration and daily rotation)
 */
export function getActiveOffers(): TimeLimitedOffer[] {
  const state = loadTimeLimitedState();
  const today = getTodayString();
  const now = Date.now();
  
  // Check if we need to rotate offers (new day)
  if (state.lastRotation !== now || state.offers.length === 0) {
    const todayNum = new Date(today).getTime();
    const lastRotationDate = typeof state.lastRotation === 'number' 
      ? new Date(state.lastRotation).toISOString().split('T')[0]
      : '';
    
    if (lastRotationDate !== today || state.offers.length === 0) {
      // Generate new offers
      const newOffers = generateDailyOffers();
      
      // Restore purchase counts for offers that still exist
      for (const offer of newOffers) {
        if (state.purchaseHistory[offer.id]) {
          offer.purchased = state.purchaseHistory[offer.id];
        }
      }
      
      const newState: TimeLimitedState = {
        offers: newOffers,
        lastRotation: todayNum,
        purchaseHistory: state.purchaseHistory,
      };
      
      saveTimeLimitedState(newState);
      return newOffers.filter(o => o.expiresAt > now && o.purchased < o.maxPurchases);
    }
  }
  
  // Return non-expired, non-sold-out offers
  return state.offers.filter(o => o.expiresAt > now && o.purchased < o.maxPurchases);
}

/**
 * Check if an offer is still valid
 */
export function isOfferValid(offer: TimeLimitedOffer): boolean {
  const now = Date.now();
  return offer.expiresAt > now && offer.purchased < offer.maxPurchases;
}

/**
 * Check if an offer is sold out
 */
export function isOfferSoldOut(offer: TimeLimitedOffer): boolean {
  return offer.purchased >= offer.maxPurchases;
}

/**
 * Check if an offer is expired
 */
export function isOfferExpired(offer: TimeLimitedOffer): boolean {
  return Date.now() > offer.expiresAt;
}

/**
 * Purchase a limited offer
 * Returns true if purchase was successful
 */
export function purchaseOffer(offerId: string): boolean {
  const state = loadTimeLimitedState();
  
  const offerIndex = state.offers.findIndex(o => o.id === offerId);
  if (offerIndex === -1) {
    return false;
  }
  
  const offer = state.offers[offerIndex];
  
  // Check if offer is still valid
  if (!isOfferValid(offer)) {
    return false;
  }
  
  // Increment purchase count
  offer.purchased += 1;
  state.purchaseHistory[offerId] = offer.purchased;
  
  // Save updated state
  saveTimeLimitedState(state);
  
  return true;
}

/**
 * Get the discounted price for an offer
 */
export function getDiscountedPrice(offer: TimeLimitedOffer, originalPrice: number): number {
  if (offer.discount <= 0) {
    return originalPrice;
  }
  return Math.floor(originalPrice * (1 - offer.discount / 100));
}

/**
 * Get the effective yield for an offer
 */
export function getEffectiveYield(offer: TimeLimitedOffer, baseYield: number): number {
  if (offer.bonusYield <= 0) {
    return baseYield;
  }
  return baseYield * (1 + offer.bonusYield / 100);
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(expiresAt: number): string {
  const now = Date.now();
  const remaining = expiresAt - now;
  
  if (remaining <= 0) {
    return 'Expired';
  }
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}

/**
 * Get all offers including expired/sold out for display purposes
 */
export function getAllOffers(): TimeLimitedOffer[] {
  const state = loadTimeLimitedState();
  
  // If no offers exist, generate them
  if (state.offers.length === 0) {
    const newOffers = generateDailyOffers();
    const today = getTodayString();
    const todayNum = new Date(today).getTime();
    
    const newState: TimeLimitedState = {
      offers: newOffers,
      lastRotation: todayNum,
      purchaseHistory: {},
    };
    
    saveTimeLimitedState(newState);
    return newOffers;
  }
  
  return state.offers;
}

/**
 * Reset offers (for testing/debugging)
 */
export function resetOffers(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Get a random active Cobie comment about FOMO
 */
export function getRandomFomoComment(): string {
  const allComments = Object.values(COBIE_FOMO_COMMENTS).flat();
  const index = Math.floor(Math.random() * allComments.length);
  return allComments[index];
}
