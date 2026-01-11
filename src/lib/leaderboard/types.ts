/**
 * Leaderboard Types
 * 
 * Types for the city comparison leaderboard system.
 * Updated for Issue #50: Networked Leaderboards
 */

export interface LeaderboardEntry {
  id: string;
  cityName: string;
  playerName: string;
  score: number; // Calculated score using scoring formula
  population: number;
  tvl: number;
  buildingCount: number;
  cryptoBuildingCount: number;
  daysSurvived: number;
  achievements: number; // Number of achievements unlocked
  rugPullsSurvived: number;
  hasRugPulls: boolean; // For 1.5x multiplier calculation
  createdAt: number;
  updatedAt: number;
}

export type LeaderboardCategory = 'score' | 'tvl' | 'population' | 'buildings' | 'survival';

export interface LeaderboardData {
  category: LeaderboardCategory;
  entries: LeaderboardEntry[];
  myRank: number | null;
  totalEntries: number;
  lastUpdated: number;
  isOffline: boolean;
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
  achievements: number;
  rugPullsSurvived: number;
  hasRugPulls: boolean;
}

export interface LeaderboardSettings {
  optedIn: boolean;
  playerName: string;
  lastSubmission: number | null;
}

// Time periods for leaderboards
export type TimePeriod = 'all_time' | 'weekly' | 'monthly';

// Scoring formula result
export interface ScoreCalculation {
  baseScore: number;
  achievementBonus: number;
  subtotal: number;
  multiplier: number;
  finalScore: number;
}

// Rate limiting constants
export const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour in milliseconds
export const LEADERBOARD_CACHE_KEY = 'cryptocity-leaderboard-cache';
export const LEADERBOARD_QUEUE_KEY = 'cryptocity-leaderboard-queue';
