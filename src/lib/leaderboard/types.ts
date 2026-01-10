/**
 * Leaderboard Types
 * 
 * Types for the city comparison leaderboard system.
 */

export interface LeaderboardEntry {
  id: string;
  cityName: string;
  playerName: string;
  population: number;
  tvl: number;
  buildingCount: number;
  cryptoBuildingCount: number;
  daysSurvived: number;
  rugPullsSurvived: number;
  createdAt: number;
  updatedAt: number;
}

export type LeaderboardCategory = 'tvl' | 'population' | 'buildings' | 'survival';

export interface LeaderboardData {
  category: LeaderboardCategory;
  entries: LeaderboardEntry[];
  myRank: number | null;
  totalEntries: number;
  lastUpdated: number;
}

export interface LeaderboardSubmission {
  cityId: string;
  cityName: string;
  playerName: string;
  population: number;
  tvl: number;
  buildingCount: number;
  cryptoBuildingCount: number;
  daysSurvived: number;
  rugPullsSurvived: number;
}

export interface LeaderboardSettings {
  optedIn: boolean;
  playerName: string;
  lastSubmission: number | null;
}

// Time periods for leaderboards
export type TimePeriod = 'all_time' | 'weekly' | 'monthly';
