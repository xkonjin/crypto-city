/**
 * Leaderboard Service
 * 
 * Client-side leaderboard management with localStorage caching.
 * In production, this would connect to Supabase.
 */

import type {
  LeaderboardEntry,
  LeaderboardCategory,
  LeaderboardData,
  LeaderboardSubmission,
  LeaderboardSettings,
  TimePeriod,
} from './types';

const STORAGE_KEY = 'cryptocity-leaderboard';
const SETTINGS_KEY = 'cryptocity-leaderboard-settings';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Simulated leaderboard data for demo purposes
const DEMO_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'demo-1',
    cityName: 'Satoshi City',
    playerName: 'Cobie',
    population: 125000,
    tvl: 2500000,
    buildingCount: 450,
    cryptoBuildingCount: 45,
    daysSurvived: 365,
    rugPullsSurvived: 12,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1000,
  },
  {
    id: 'demo-2',
    cityName: 'DeFi Valley',
    playerName: 'DegenSpartan',
    population: 98000,
    tvl: 1800000,
    buildingCount: 380,
    cryptoBuildingCount: 52,
    daysSurvived: 280,
    rugPullsSurvived: 8,
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5000,
  },
  {
    id: 'demo-3',
    cityName: 'Moon Base',
    playerName: 'ZachXBT',
    population: 85000,
    tvl: 1500000,
    buildingCount: 320,
    cryptoBuildingCount: 38,
    daysSurvived: 220,
    rugPullsSurvived: 15,
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 10000,
  },
  {
    id: 'demo-4',
    cityName: 'Rug City',
    playerName: 'DoKwon',
    population: 0,
    tvl: 0,
    buildingCount: 0,
    cryptoBuildingCount: 0,
    daysSurvived: 1,
    rugPullsSurvived: 0,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'demo-5',
    cityName: 'Plasma Paradise',
    playerName: 'Hsaka',
    population: 72000,
    tvl: 1200000,
    buildingCount: 280,
    cryptoBuildingCount: 42,
    daysSurvived: 180,
    rugPullsSurvived: 5,
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 20000,
  },
];

// Get leaderboard settings from localStorage
export function getLeaderboardSettings(): LeaderboardSettings {
  if (typeof window === 'undefined') {
    return { optedIn: false, playerName: 'Anonymous', lastSubmission: null };
  }
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[Leaderboard] Failed to load settings:', e);
  }
  
  return { optedIn: false, playerName: 'Anonymous', lastSubmission: null };
}

// Save leaderboard settings
export function saveLeaderboardSettings(settings: LeaderboardSettings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[Leaderboard] Failed to save settings:', e);
  }
}

// Fetch leaderboard data
export async function fetchLeaderboard(
  category: LeaderboardCategory,
  _period: TimePeriod = 'all_time',
  limit = 100
): Promise<LeaderboardData> {
  // Sort demo entries by category
  const sortedEntries = [...DEMO_ENTRIES].sort((a, b) => {
    switch (category) {
      case 'tvl':
        return b.tvl - a.tvl;
      case 'population':
        return b.population - a.population;
      case 'buildings':
        return b.buildingCount - a.buildingCount;
      case 'survival':
        return b.daysSurvived - a.daysSurvived;
      default:
        return b.tvl - a.tvl;
    }
  });
  
  // Get user's entry if opted in
  const settings = getLeaderboardSettings();
  const userEntry = getUserEntry();
  
  let myRank: number | null = null;
  if (settings.optedIn && userEntry) {
    // Insert user entry and find rank
    const allEntries = [...sortedEntries, userEntry].sort((a, b) => {
      switch (category) {
        case 'tvl':
          return b.tvl - a.tvl;
        case 'population':
          return b.population - a.population;
        case 'buildings':
          return b.buildingCount - a.buildingCount;
        case 'survival':
          return b.daysSurvived - a.daysSurvived;
        default:
          return b.tvl - a.tvl;
      }
    });
    
    myRank = allEntries.findIndex(e => e.id === userEntry.id) + 1;
  }
  
  return {
    category,
    entries: sortedEntries.slice(0, limit),
    myRank,
    totalEntries: sortedEntries.length,
    lastUpdated: Date.now(),
  };
}

// Get user's cached entry
function getUserEntry(): LeaderboardEntry | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[Leaderboard] Failed to load user entry:', e);
  }
  
  return null;
}

// Submit to leaderboard
export async function submitToLeaderboard(
  submission: LeaderboardSubmission
): Promise<{ success: boolean; rank: number | null; error?: string }> {
  const settings = getLeaderboardSettings();
  
  if (!settings.optedIn) {
    return { success: false, rank: null, error: 'Not opted into leaderboard' };
  }
  
  // Create entry
  const entry: LeaderboardEntry = {
    id: submission.cityId,
    cityName: submission.cityName,
    playerName: settings.playerName,
    population: submission.population,
    tvl: submission.tvl,
    buildingCount: submission.buildingCount,
    cryptoBuildingCount: submission.cryptoBuildingCount,
    daysSurvived: submission.daysSurvived,
    rugPullsSurvived: submission.rugPullsSurvived,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  // Save locally
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    
    // Update settings
    saveLeaderboardSettings({
      ...settings,
      lastSubmission: Date.now(),
    });
    
    // Calculate rank
    const leaderboard = await fetchLeaderboard('tvl');
    
    return { success: true, rank: leaderboard.myRank };
  } catch (e) {
    console.error('[Leaderboard] Failed to submit:', e);
    return { success: false, rank: null, error: 'Failed to save entry' };
  }
}

// Opt in/out of leaderboard
export function setLeaderboardOptIn(optIn: boolean, playerName?: string): void {
  const settings = getLeaderboardSettings();
  saveLeaderboardSettings({
    ...settings,
    optedIn: optIn,
    playerName: playerName || settings.playerName,
  });
}

// Format number for display
export function formatLeaderboardNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// Get rank suffix (1st, 2nd, 3rd, etc)
export function getRankSuffix(rank: number): string {
  if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
  switch (rank % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
