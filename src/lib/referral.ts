/**
 * Referral System for Crypto City
 * 
 * Implements a referral program where players can invite others:
 * - Referrer gets: $5,000 per successful referral
 * - Referred gets: $25,000 starting bonus
 * - Tiers: Bronze (0-4), Silver (5-9), Gold (10-24), Whale (25+)
 */

export type ReferralTier = 'bronze' | 'silver' | 'gold' | 'whale';

export interface ReferralState {
  myCode: string;
  referredBy: string | null;
  referralCount: number;
  totalRewards: number;
  tier: ReferralTier;
  pendingReferralCode?: string | null; // Code from URL awaiting application
}

const STORAGE_KEY = 'cryptoCityReferral';

// Reward amounts
export const REFERRER_REWARD = 5000;   // $5,000 per referral
export const REFERRED_BONUS = 25000;   // $25,000 starting bonus

// Tier thresholds
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 5,
  gold: 10,
  whale: 25,
};

/**
 * Generate a unique 6-character referral code from a player ID
 * Uses a simple hash to create deterministic codes
 */
export function generateReferralCode(playerId: string): string {
  // Simple hash function for deterministic codes
  let hash = 0;
  const str = playerId + 'referral-salt-v1';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and base36
  const positiveHash = Math.abs(hash);
  const base36 = positiveHash.toString(36).toUpperCase();
  
  // Pad or truncate to exactly 6 characters
  if (base36.length >= 6) {
    return base36.slice(0, 6);
  }
  return base36.padStart(6, '0');
}

/**
 * Get referral tier based on referral count
 */
export function getReferralTier(count: number): ReferralTier {
  if (count >= TIER_THRESHOLDS.whale) return 'whale';
  if (count >= TIER_THRESHOLDS.gold) return 'gold';
  if (count >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

/**
 * Get the display name for a tier
 */
export function getTierDisplayName(tier: ReferralTier): string {
  const names: Record<ReferralTier, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    whale: 'Whale 🐋',
  };
  return names[tier];
}

/**
 * Get the minimum referrals needed for next tier
 */
export function getNextTierThreshold(currentTier: ReferralTier): number | null {
  switch (currentTier) {
    case 'bronze': return TIER_THRESHOLDS.silver;
    case 'silver': return TIER_THRESHOLDS.gold;
    case 'gold': return TIER_THRESHOLDS.whale;
    case 'whale': return null; // Max tier
  }
}

/**
 * Load referral state from localStorage
 */
export function loadReferralState(): ReferralState {
  if (typeof window === 'undefined') {
    return createDefaultState('');
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate and ensure all required fields
      return {
        myCode: parsed.myCode || generateReferralCode(getOrCreatePlayerId()),
        referredBy: parsed.referredBy || null,
        referralCount: typeof parsed.referralCount === 'number' ? parsed.referralCount : 0,
        totalRewards: typeof parsed.totalRewards === 'number' ? parsed.totalRewards : 0,
        tier: getReferralTier(parsed.referralCount || 0),
        pendingReferralCode: parsed.pendingReferralCode || null,
      };
    }
  } catch {
    // Ignore parse errors
  }
  
  // Create new state with generated code
  const playerId = getOrCreatePlayerId();
  return createDefaultState(playerId);
}

/**
 * Save referral state to localStorage
 */
export function saveReferralState(state: ReferralState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Create a default referral state for a player
 */
function createDefaultState(playerId: string): ReferralState {
  return {
    myCode: playerId ? generateReferralCode(playerId) : '',
    referredBy: null,
    referralCount: 0,
    totalRewards: 0,
    tier: 'bronze',
    pendingReferralCode: null,
  };
}

/**
 * Get or create a unique player ID
 */
function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return '';
  
  const PLAYER_ID_KEY = 'cryptoCityPlayerId';
  let playerId = localStorage.getItem(PLAYER_ID_KEY);
  
  if (!playerId) {
    // Generate a unique ID
    playerId = `player-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }
  
  return playerId;
}

/**
 * Store a pending referral code (from URL parameter)
 * This will be applied when the player starts their game
 */
export function storePendingReferralCode(code: string): void {
  const state = loadReferralState();
  
  // Don't store if already referred or if it's their own code
  if (state.referredBy) return;
  if (state.myCode === code.toUpperCase()) return;
  
  state.pendingReferralCode = code.toUpperCase();
  saveReferralState(state);
}

/**
 * Apply a referral code and return the bonus amount for the referred player
 * Returns null if the code is invalid, already used, or is the player's own code
 */
export function applyReferralCode(code: string): number | null {
  const state = loadReferralState();
  
  // Normalize the code
  const normalizedCode = code.toUpperCase().trim();
  
  // Validation checks
  if (normalizedCode.length !== 6) return null;
  if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) return null;
  
  // Can't use your own code
  if (normalizedCode === state.myCode) return null;
  
  // Can't be referred twice
  if (state.referredBy) return null;
  
  // Apply the referral
  state.referredBy = normalizedCode;
  state.pendingReferralCode = null;
  saveReferralState(state);
  
  // Record the referral for the referrer (if they're a known player)
  // In a real system, this would be server-side
  recordReferralForReferrer(normalizedCode);
  
  return REFERRED_BONUS;
}

/**
 * Apply a pending referral code if one exists
 * Returns the bonus amount or null if no pending code or invalid
 */
export function applyPendingReferral(): number | null {
  const state = loadReferralState();
  
  if (!state.pendingReferralCode) return null;
  
  return applyReferralCode(state.pendingReferralCode);
}

/**
 * Record a referral for the referrer (increments their count and rewards)
 * Note: In production, this would be server-side to prevent manipulation
 */
function recordReferralForReferrer(referrerCode: string): void {
  // In a real implementation, this would be a server call
  // For now, we'll store referrer stats locally (demo purposes)
  
  // Check if this is our own code (we're the referrer)
  const state = loadReferralState();
  if (state.myCode === referrerCode) {
    state.referralCount += 1;
    state.totalRewards += REFERRER_REWARD;
    state.tier = getReferralTier(state.referralCount);
    saveReferralState(state);
  }
  
  // Store a record of referrals made (for demo/local purposes)
  const REFERRALS_KEY = 'cryptoCityReferrals';
  try {
    const existing = localStorage.getItem(REFERRALS_KEY);
    const referrals: Record<string, number> = existing ? JSON.parse(existing) : {};
    referrals[referrerCode] = (referrals[referrerCode] || 0) + 1;
    localStorage.setItem(REFERRALS_KEY, JSON.stringify(referrals));
  } catch {
    // Ignore errors
  }
}

/**
 * Get the shareable referral link
 */
export function getReferralLink(code: string): string {
  return `https://crypto-city.game/?ref=${code}`;
}

/**
 * Check if the player can still enter a referral code
 * (hasn't been referred yet)
 */
export function canEnterReferralCode(): boolean {
  const state = loadReferralState();
  return !state.referredBy;
}

/**
 * Get referral statistics
 */
export function getReferralStats(): {
  count: number;
  totalRewards: number;
  tier: ReferralTier;
  nextTierAt: number | null;
  referralsToNextTier: number | null;
} {
  const state = loadReferralState();
  const nextTierAt = getNextTierThreshold(state.tier);
  
  return {
    count: state.referralCount,
    totalRewards: state.totalRewards,
    tier: state.tier,
    nextTierAt,
    referralsToNextTier: nextTierAt ? nextTierAt - state.referralCount : null,
  };
}
