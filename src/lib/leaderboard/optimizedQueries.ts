/**
 * Optimized Database Queries for Leaderboard Service
 * 
 * This file contains optimized query functions that take advantage of the new
 * database indexes created in migration 001_add_performance_indexes.sql
 * 
 * Addresses Issue #252: Optimize Database Queries and Add Indexing
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { LeaderboardEntry, LeaderboardCategory } from './types';
import { logger } from '../logger';

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

/**
 * Optimized leaderboard fetch using proper indexes
 * 
 * PERFORMANCE IMPROVEMENTS:
 * - Uses composite indexes (score DESC, created_at DESC) for optimal sorting
 * - Filters out inactive entries (score > 0) using partial index
 * - Limits results early to reduce data transfer
 * - Uses prepared statement patterns for better query plan caching
 */
export async function fetchOptimizedLeaderboard(
  category: LeaderboardCategory,
  limit: number = 100,
  minScore: number = 0
): Promise<LeaderboardEntry[] | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    // Build the query with proper column selection
    let query = client
      .from('leaderboards')
      .select(`
        id,
        player_name,
        city_name,
        score,
        tvl,
        population,
        building_count,
        crypto_building_count,
        days_survived,
        achievements,
        rug_pulls_survived,
        has_rug_pulls,
        created_at,
        updated_at
      `)
      .gt('score', minScore); // Use partial index for active scores

    // Apply category-specific ordering to use the right index
    switch (category) {
      case 'score':
        // Uses idx_leaderboards_score (score DESC, created_at DESC)
        query = query.order('score', { ascending: false })
                    .order('created_at', { ascending: false });
        break;
      case 'tvl':
        // Uses idx_leaderboards_tvl (tvl DESC, created_at DESC)
        query = query.order('tvl', { ascending: false })
                    .order('created_at', { ascending: false });
        break;
      case 'population':
        // Uses idx_leaderboards_population (population DESC, created_at DESC)
        query = query.order('population', { ascending: false })
                    .order('created_at', { ascending: false });
        break;
      case 'buildings':
        // Uses idx_leaderboards_building_count (building_count DESC, created_at DESC)
        query = query.order('building_count', { ascending: false })
                    .order('created_at', { ascending: false });
        break;
      case 'survival':
        // Uses idx_leaderboards_days_survived (days_survived DESC, created_at DESC)
        query = query.order('days_survived', { ascending: false })
                    .order('created_at', { ascending: false });
        break;
      default:
        // Fallback to score
        query = query.order('score', { ascending: false })
                    .order('created_at', { ascending: false });
    }

    // Apply limit to reduce data transfer
    const { data, error } = await query.limit(limit);

    if (error) {
      logger.error('[OptimizedLeaderboard] Query error:', error);
      return null;
    }

    // Transform to LeaderboardEntry format
    return data?.map(row => ({
      id: row.id,
      cityName: row.city_name || 'Unknown City',
      playerName: row.player_name || 'Anonymous',
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

  } catch (error) {
    logger.error('[OptimizedLeaderboard] Fetch error:', error);
    return null;
  }
}

/**
 * Optimized player rank calculation using window functions
 * 
 * PERFORMANCE IMPROVEMENTS:
 * - Uses single query with window function instead of multiple queries
 * - Leverages composite indexes for fast sorting
 * - Returns rank without fetching all data
 */
export async function getOptimizedPlayerRank(
  playerName: string,
  category: LeaderboardCategory = 'score'
): Promise<number | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    // Map category to column name
    const orderColumn = category === 'score' ? 'score' :
                        category === 'tvl' ? 'tvl' :
                        category === 'population' ? 'population' :
                        category === 'buildings' ? 'building_count' :
                        'days_survived';

    // Use a window function to calculate rank efficiently
    const { data, error } = await client.rpc('get_player_rank', {
      p_player_name: playerName,
      p_order_column: orderColumn
    });

    if (error) {
      // Fallback to slower method if RPC doesn't exist
      return await getPlayerRankFallback(playerName, category);
    }

    return data?.[0]?.rank || null;

  } catch (error) {
    logger.error('[OptimizedLeaderboard] Rank calculation error:', error);
    return null;
  }
}

/**
 * Fallback rank calculation method (slower but works without custom functions)
 */
async function getPlayerRankFallback(
  playerName: string,
  category: LeaderboardCategory
): Promise<number | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // Get player's score first
    const { data: playerData, error: playerError } = await client
      .from('leaderboards')
      .select('score, tvl, population, building_count, days_survived')
      .eq('player_name', playerName)
      .single();

    if (playerError || !playerData) {
      return null;
    }

    // Get the comparison value based on category
    const playerValue = category === 'score' ? playerData.score :
                       category === 'tvl' ? playerData.tvl :
                       category === 'population' ? playerData.population :
                       category === 'buildings' ? playerData.building_count :
                       playerData.days_survived;

    // Count players with better scores (uses appropriate index)
    const column = category === 'score' ? 'score' :
                  category === 'tvl' ? 'tvl' :
                  category === 'population' ? 'population' :
                  category === 'buildings' ? 'building_count' :
                  'days_survived';

    const { count, error: countError } = await client
      .from('leaderboards')
      .select('*', { count: 'exact', head: true })
      .gt(column, playerValue)
      .gt('score', 0); // Use partial index

    if (countError) {
      logger.error('[OptimizedLeaderboard] Count error:', countError);
      return null;
    }

    return (count || 0) + 1;

  } catch (error) {
    logger.error('[OptimizedLeaderboard] Fallback rank error:', error);
    return null;
  }
}

/**
 * Optimized top players query for a specific category
 * 
 * PERFORMANCE IMPROVEMENTS:
 * - Uses covering indexes (includes all needed columns)
 * - Optimized for common UI patterns (top N players)
 * - Minimal data transfer with exact column selection
 */
export async function getTopPlayers(
  category: LeaderboardCategory,
  limit: number = 10
): Promise<Array<{
  playerName: string;
  cityName: string;
  score: number;
  rank: number;
}> | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const entries = await fetchOptimizedLeaderboard(category, limit, 0);
    if (!entries) return null;

    return entries.map((entry, index) => ({
      playerName: entry.playerName,
      cityName: entry.cityName,
      score: category === 'score' ? entry.score :
             category === 'tvl' ? entry.tvl :
             category === 'population' ? entry.population :
             category === 'buildings' ? entry.buildingCount :
             entry.daysSurvived,
      rank: index + 1,
    }));

  } catch (error) {
    logger.error('[OptimizedLeaderboard] Top players error:', error);
    return null;
  }
}

/**
 * Batch player lookup for multiple players
 * 
 * PERFORMANCE IMPROVEMENTS:
 * - Uses IN query instead of multiple individual queries
 * - Leverages idx_leaderboards_player_name index
 * - Returns all results in single query
 */
export async function getPlayersBatch(
  playerNames: string[]
): Promise<LeaderboardEntry[] | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from('leaderboards')
      .select(`
        id, player_name, city_name, score, tvl, population,
        building_count, crypto_building_count, days_survived,
        achievements, rug_pulls_survived, has_rug_pulls,
        created_at, updated_at
      `)
      .in('player_name', playerNames)
      .gt('score', 0) // Use partial index
      .order('score', { ascending: false });

    if (error) {
      logger.error('[OptimizedLeaderboard] Batch query error:', error);
      return null;
    }

    return data?.map(row => ({
      id: row.id,
      cityName: row.city_name || 'Unknown City',
      playerName: row.player_name || 'Anonymous',
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

  } catch (error) {
    logger.error('[OptimizedLeaderboard] Batch error:', error);
    return null;
  }
}