/**
 * Leaderboard Service
 * 
 * Networked leaderboard management with Supabase integration.
 * Includes offline caching, rate limiting, and scoring system.
 * 
 * Issue #50: Networked Leaderboards
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  LeaderboardEntry,
  LeaderboardCategory,
  LeaderboardData,
  LeaderboardSubmission,
  LeaderboardSettings,
  TimePeriod,
  ScoreCalculation,
} from './types';
import {
  RATE_LIMIT_MS,
  LEADERBOARD_CACHE_KEY,
  LEADERBOARD_QUEUE_KEY,
} from './types';
import { logger } from '../logger';

const STORAGE_KEY = 'cryptocity-leaderboard';
const SETTINGS_KEY = 'cryptocity-leaderboard-settings';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const FETCH_DEBOUNCE_MS = 2000; // 2 seconds debounce for fetches

// Supabase client (lazy init)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// Check if we're in a browser environment
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// Check if online
function isOnline(): boolean {
  if (!isBrowser()) return true;
  return navigator.onLine;
}

// =============================================================================
// SCORING SYSTEM
// =============================================================================

/**
 * Calculate score using the scoring formula:
 * - Base score = TVL + (population * 10) + (daysSurvived * 100)
 * - Bonus: +500 per achievement
 * - Multiplier: 1.5x if no rug pulls
 */
export function calculateScore(
  tvl: number,
  population: number,
  daysSurvived: number,
  achievements: number,
  hasRugPulls: boolean
): ScoreCalculation {
  const baseScore = tvl + (population * 10) + (daysSurvived * 100);
  const achievementBonus = achievements * 500;
  const subtotal = baseScore + achievementBonus;
  const multiplier = hasRugPulls ? 1 : 1.5;
  const finalScore = Math.floor(subtotal * multiplier);

  return {
    baseScore,
    achievementBonus,
    subtotal,
    multiplier,
    finalScore,
  };
}

// =============================================================================
// DEMO DATA (Fallback when Supabase not configured)
// =============================================================================

function generateDemoEntries(): LeaderboardEntry[] {
  const demoData = [
    { cityName: 'Satoshi City', playerName: 'Cobie', tvl: 2500000, population: 125000, daysSurvived: 365, achievements: 15, rugPullsSurvived: 12, hasRugPulls: true },
    { cityName: 'DeFi Valley', playerName: 'DegenSpartan', tvl: 1800000, population: 98000, daysSurvived: 280, achievements: 12, rugPullsSurvived: 8, hasRugPulls: true },
    { cityName: 'Moon Base', playerName: 'ZachXBT', tvl: 1500000, population: 85000, daysSurvived: 220, achievements: 18, rugPullsSurvived: 0, hasRugPulls: false },
    { cityName: 'Rug City', playerName: 'DoKwon', tvl: 0, population: 0, daysSurvived: 1, achievements: 0, rugPullsSurvived: 0, hasRugPulls: true },
    { cityName: 'Plasma Paradise', playerName: 'Hsaka', tvl: 1200000, population: 72000, daysSurvived: 180, achievements: 10, rugPullsSurvived: 5, hasRugPulls: true },
    { cityName: 'WAGMI Town', playerName: 'IcedKnife', tvl: 900000, population: 55000, daysSurvived: 150, achievements: 8, rugPullsSurvived: 3, hasRugPulls: true },
    { cityName: 'Diamond Hands', playerName: 'CryptoKaleo', tvl: 750000, population: 42000, daysSurvived: 200, achievements: 20, rugPullsSurvived: 0, hasRugPulls: false },
  ];

  return demoData.map((data, index) => {
    const scoreCalc = calculateScore(data.tvl, data.population, data.daysSurvived, data.achievements, data.hasRugPulls);
    return {
      id: `demo-${index + 1}`,
      cityName: data.cityName,
      playerName: data.playerName,
      score: scoreCalc.finalScore,
      population: data.population,
      tvl: data.tvl,
      buildingCount: Math.floor(data.population / 100),
      cryptoBuildingCount: Math.floor(data.population / 500),
      daysSurvived: data.daysSurvived,
      achievements: data.achievements,
      rugPullsSurvived: data.rugPullsSurvived,
      hasRugPulls: data.hasRugPulls,
      createdAt: Date.now() - (30 - index) * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - index * 1000,
    };
  });
}

// =============================================================================
// CACHING
// =============================================================================

interface CachedLeaderboard {
  data: LeaderboardData;
  timestamp: number;
}

function getCachedLeaderboard(category: LeaderboardCategory): CachedLeaderboard | null {
  if (!isBrowser()) return null;
  
  try {
    const cached = localStorage.getItem(LEADERBOARD_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as Record<string, CachedLeaderboard>;
      const categoryCache = parsed[category];
      if (categoryCache && Date.now() - categoryCache.timestamp < CACHE_TTL) {
        return categoryCache;
      }
    }
  } catch (e) {
    logger.error('[Leaderboard] Failed to read cache:', e);
  }
  return null;
}

function setCachedLeaderboard(category: LeaderboardCategory, data: LeaderboardData): void {
  if (!isBrowser()) return;
  
  try {
    const cached = localStorage.getItem(LEADERBOARD_CACHE_KEY);
    const parsed = cached ? JSON.parse(cached) : {};
    parsed[category] = { data, timestamp: Date.now() };
    localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify(parsed));
  } catch (e) {
    logger.error('[Leaderboard] Failed to write cache:', e);
  }
}

// =============================================================================
// OFFLINE QUEUE
// =============================================================================

interface QueuedSubmission {
  submission: LeaderboardSubmission;
  timestamp: number;
}

function getSubmissionQueue(): QueuedSubmission[] {
  if (!isBrowser()) return [];
  
  try {
    const queue = localStorage.getItem(LEADERBOARD_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (e) {
    logger.error('[Leaderboard] Failed to read queue:', e);
    return [];
  }
}

function addToSubmissionQueue(submission: LeaderboardSubmission): void {
  if (!isBrowser()) return;
  
  try {
    const queue = getSubmissionQueue();
    queue.push({ submission, timestamp: Date.now() });
    localStorage.setItem(LEADERBOARD_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    logger.error('[Leaderboard] Failed to add to queue:', e);
  }
}

function clearSubmissionQueue(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(LEADERBOARD_QUEUE_KEY);
}

// Process queued submissions when back online
async function processSubmissionQueue(): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isOnline()) return;
  
  const queue = getSubmissionQueue();
  if (queue.length === 0) return;
  
  logger.debug('[Leaderboard] Processing queued submissions:', queue.length);
  
  for (const item of queue) {
    try {
      await submitToSupabase(item.submission);
    } catch (e) {
      logger.error('[Leaderboard] Failed to process queued submission:', e);
    }
  }
  
  clearSubmissionQueue();
}

// =============================================================================
// SUPABASE OPERATIONS
// =============================================================================

async function submitToSupabase(submission: LeaderboardSubmission): Promise<{ success: boolean; id?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false };
  }
  
  const scoreCalc = calculateScore(
    submission.tvl,
    submission.population,
    submission.daysSurvived,
    submission.achievements,
    submission.hasRugPulls
  );
  
  const { data, error } = await client
    .from('leaderboards')
    .upsert({
      id: submission.cityId,
      player_name: submission.playerName,
      city_name: submission.cityName,
      score: scoreCalc.finalScore,
      tvl: submission.tvl,
      population: submission.population,
      days_survived: submission.daysSurvived,
      achievements: submission.achievements,
      has_rug_pulls: submission.hasRugPulls,
    }, { onConflict: 'id' })
    .select('id')
    .single();
  
  if (error) {
    logger.error('[Leaderboard] Supabase submit error:', error);
    return { success: false };
  }
  
  return { success: true, id: data?.id };
}

async function fetchFromSupabase(
  category: LeaderboardCategory,
  limit: number
): Promise<LeaderboardEntry[] | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }
  
  // Map category to column name
  const orderColumn = category === 'score' ? 'score' :
                      category === 'tvl' ? 'tvl' :
                      category === 'population' ? 'population' :
                      category === 'buildings' ? 'building_count' :
                      'days_survived';
  
  const { data, error } = await client
    .from('leaderboards')
    .select('*')
    .order(orderColumn, { ascending: false })
    .limit(limit);
  
  if (error) {
    logger.error('[Leaderboard] Supabase fetch error:', error);
    return null;
  }
  
  // Transform to LeaderboardEntry
  return data?.map(row => ({
    id: row.id,
    cityName: row.city_name || 'Unknown City',
    playerName: row.player_name,
    score: row.score || 0,
    population: row.population || 0,
    tvl: row.tvl || 0,
    buildingCount: row.building_count || 0,
    cryptoBuildingCount: row.crypto_building_count || 0,
    daysSurvived: row.days_survived || 1,
    achievements: row.achievements || 0,
    rugPullsSurvived: row.rug_pulls_survived || 0,
    hasRugPulls: row.has_rug_pulls ?? true,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at || row.created_at).getTime(),
  })) || null;
}

async function getPlayerRankFromSupabase(
  playerName: string,
  category: LeaderboardCategory
): Promise<number | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  
  // Get all scores to calculate rank
  const entries = await fetchFromSupabase(category, 1000);
  if (!entries) return null;
  
  const rank = entries.findIndex(e => e.playerName === playerName);
  return rank >= 0 ? rank + 1 : null;
}

// =============================================================================
// SETTINGS
// =============================================================================

export function getLeaderboardSettings(): LeaderboardSettings {
  if (!isBrowser()) {
    return { optedIn: false, playerName: 'Anonymous', lastSubmission: null };
  }
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    logger.error('[Leaderboard] Failed to load settings:', e);
  }
  
  return { optedIn: false, playerName: 'Anonymous', lastSubmission: null };
}

export function saveLeaderboardSettings(settings: LeaderboardSettings): void {
  if (!isBrowser()) return;
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    logger.error('[Leaderboard] Failed to save settings:', e);
  }
}

export function setLeaderboardOptIn(optIn: boolean, playerName?: string): void {
  const settings = getLeaderboardSettings();
  saveLeaderboardSettings({
    ...settings,
    optedIn: optIn,
    playerName: playerName || settings.playerName,
  });
}

// =============================================================================
// RATE LIMITING
// =============================================================================

export function canSubmitScore(): { allowed: boolean; remainingMs: number } {
  const settings = getLeaderboardSettings();
  if (!settings.lastSubmission) {
    return { allowed: true, remainingMs: 0 };
  }
  
  const elapsed = Date.now() - settings.lastSubmission;
  if (elapsed >= RATE_LIMIT_MS) {
    return { allowed: true, remainingMs: 0 };
  }
  
  return { allowed: false, remainingMs: RATE_LIMIT_MS - elapsed };
}

export function formatRateLimitTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

// =============================================================================
// FETCH DEBOUNCING
// =============================================================================

let lastFetchTime = 0;
let fetchPromise: Promise<LeaderboardData> | null = null;

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Fetch leaderboard data with caching and offline support
 */
export async function fetchLeaderboard(
  category: LeaderboardCategory = 'score',
  _period: TimePeriod = 'all_time',
  limit = 100
): Promise<LeaderboardData> {
  // Debounce rapid fetches
  const now = Date.now();
  if (fetchPromise && now - lastFetchTime < FETCH_DEBOUNCE_MS) {
    return fetchPromise;
  }
  lastFetchTime = now;
  
  fetchPromise = (async () => {
    const settings = getLeaderboardSettings();
    let entries: LeaderboardEntry[] | null = null;
    let isOffline = !isOnline();
    
    // Try Supabase first if online
    if (!isOffline) {
      entries = await fetchFromSupabase(category, limit);
      
      // Process any queued submissions
      processSubmissionQueue();
    }
    
    // Fall back to cache if Supabase fails or offline
    if (!entries) {
      const cached = getCachedLeaderboard(category);
      if (cached) {
        return { ...cached.data, isOffline: true };
      }
      
      // Fall back to demo entries
      entries = generateDemoEntries();
      isOffline = true;
    }
    
    // Sort entries by category
    const sortedEntries = [...entries].sort((a, b) => {
      switch (category) {
        case 'score':
          return b.score - a.score;
        case 'tvl':
          return b.tvl - a.tvl;
        case 'population':
          return b.population - a.population;
        case 'buildings':
          return b.buildingCount - a.buildingCount;
        case 'survival':
          return b.daysSurvived - a.daysSurvived;
        default:
          return b.score - a.score;
      }
    }).slice(0, limit);
    
    // Get user's entry and rank
    const userEntry = getUserEntry();
    let myRank: number | null = null;
    
    if (settings.optedIn && userEntry) {
      const allEntries = [...sortedEntries];
      // Only add user entry if not already in list
      if (!allEntries.some(e => e.id === userEntry.id)) {
        allEntries.push(userEntry);
      }
      
      allEntries.sort((a, b) => {
        switch (category) {
          case 'score': return b.score - a.score;
          case 'tvl': return b.tvl - a.tvl;
          case 'population': return b.population - a.population;
          case 'buildings': return b.buildingCount - a.buildingCount;
          case 'survival': return b.daysSurvived - a.daysSurvived;
          default: return b.score - a.score;
        }
      });
      
      myRank = allEntries.findIndex(e => e.id === userEntry.id) + 1;
    }
    
    const result: LeaderboardData = {
      category,
      entries: sortedEntries,
      myRank,
      totalEntries: sortedEntries.length,
      lastUpdated: Date.now(),
      isOffline,
    };
    
    // Cache the result
    setCachedLeaderboard(category, result);
    
    return result;
  })();
  
  return fetchPromise;
}

/**
 * Get user's cached entry
 */
function getUserEntry(): LeaderboardEntry | null {
  if (!isBrowser()) return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    logger.error('[Leaderboard] Failed to load user entry:', e);
  }
  
  return null;
}

/**
 * Submit score to leaderboard with rate limiting
 */
export async function submitToLeaderboard(
  submission: LeaderboardSubmission
): Promise<{ success: boolean; rank: number | null; error?: string; rateLimited?: boolean; remainingMs?: number }> {
  const settings = getLeaderboardSettings();
  
  if (!settings.optedIn) {
    return { success: false, rank: null, error: 'Not opted into leaderboard' };
  }
  
  // Check rate limit
  const rateLimit = canSubmitScore();
  if (!rateLimit.allowed) {
    return { 
      success: false, 
      rank: null, 
      error: `Rate limited. Try again in ${formatRateLimitTime(rateLimit.remainingMs)}`,
      rateLimited: true,
      remainingMs: rateLimit.remainingMs,
    };
  }
  
  // Calculate score
  const scoreCalc = calculateScore(
    submission.tvl,
    submission.population,
    submission.daysSurvived,
    submission.achievements,
    submission.hasRugPulls
  );
  
  // Create entry
  const entry: LeaderboardEntry = {
    id: submission.cityId,
    cityName: submission.cityName,
    playerName: settings.playerName,
    score: scoreCalc.finalScore,
    population: submission.population,
    tvl: submission.tvl,
    buildingCount: submission.buildingCount,
    cryptoBuildingCount: submission.cryptoBuildingCount,
    daysSurvived: submission.daysSurvived,
    achievements: submission.achievements,
    rugPullsSurvived: submission.rugPullsSurvived,
    hasRugPulls: submission.hasRugPulls,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  // Save locally first (always)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    
    // Update settings with submission timestamp
    saveLeaderboardSettings({
      ...settings,
      lastSubmission: Date.now(),
    });
  } catch (e) {
    logger.error('[Leaderboard] Failed to save locally:', e);
    return { success: false, rank: null, error: 'Failed to save entry' };
  }
  
  // Try to submit to Supabase
  if (isOnline()) {
    const result = await submitToSupabase(submission);
    if (!result.success) {
      // Queue for later if Supabase fails
      addToSubmissionQueue(submission);
    }
  } else {
    // Queue for when online
    addToSubmissionQueue(submission);
  }
  
  // Calculate rank
  const leaderboard = await fetchLeaderboard('score');
  
  return { success: true, rank: leaderboard.myRank };
}

/**
 * Get player rank
 */
export async function getPlayerRank(playerName: string): Promise<number | null> {
  // Try Supabase first
  if (isOnline()) {
    const rank = await getPlayerRankFromSupabase(playerName, 'score');
    if (rank !== null) return rank;
  }
  
  // Fall back to cached/demo data
  const leaderboard = await fetchLeaderboard('score');
  const rank = leaderboard.entries.findIndex(e => e.playerName === playerName);
  return rank >= 0 ? rank + 1 : null;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function formatLeaderboardNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function getRankSuffix(rank: number): string {
  if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
  switch (rank % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!getSupabaseClient();
}

// Get connection status
export function getConnectionStatus(): { online: boolean; supabaseConfigured: boolean } {
  return {
    online: isOnline(),
    supabaseConfigured: isSupabaseConfigured(),
  };
}
