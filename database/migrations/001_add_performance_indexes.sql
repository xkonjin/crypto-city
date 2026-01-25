-- Migration: Add Performance Indexes for Plasma City
-- Date: 2025-01-25
-- Addresses Issue #252: Optimize Database Queries and Add Indexing

-- ============================================================================
-- LEADERBOARDS TABLE OPTIMIZATIONS
-- ============================================================================

-- Index for leaderboard sorting by score (most common query)
-- This will dramatically speed up the main leaderboard view
CREATE INDEX IF NOT EXISTS idx_leaderboards_score 
ON leaderboards(score DESC, created_at DESC);

-- Index for leaderboard sorting by TVL
CREATE INDEX IF NOT EXISTS idx_leaderboards_tvl 
ON leaderboards(tvl DESC, created_at DESC);

-- Index for leaderboard sorting by population
CREATE INDEX IF NOT EXISTS idx_leaderboards_population 
ON leaderboards(population DESC, created_at DESC);

-- Index for leaderboard sorting by building_count
CREATE INDEX IF NOT EXISTS idx_leaderboards_building_count 
ON leaderboards(building_count DESC, created_at DESC);

-- Index for leaderboard sorting by days_survived (survival category)
CREATE INDEX IF NOT EXISTS idx_leaderboards_days_survived 
ON leaderboards(days_survived DESC, created_at DESC);

-- Index for finding specific player entries (for rank calculation)
CREATE INDEX IF NOT EXISTS idx_leaderboards_player_name 
ON leaderboards(player_name);

-- Index for city name lookups
CREATE INDEX IF NOT EXISTS idx_leaderboards_city_name 
ON leaderboards(city_name);

-- Composite index for time-based queries and recent entries
CREATE INDEX IF NOT EXISTS idx_leaderboards_created_at 
ON leaderboards(created_at DESC);

-- Index for updated_at to support cache invalidation
CREATE INDEX IF NOT EXISTS idx_leaderboards_updated_at 
ON leaderboards(updated_at DESC);

-- ============================================================================
-- GAME_ROOMS TABLE OPTIMIZATIONS  
-- ============================================================================

-- Index for finding recent rooms (room browser functionality)
CREATE INDEX IF NOT EXISTS idx_game_rooms_created_at 
ON game_rooms(created_at DESC);

-- Index for finding recently updated rooms (active rooms)
CREATE INDEX IF NOT EXISTS idx_game_rooms_updated_at 
ON game_rooms(updated_at DESC);

-- Index for finding rooms by city name
CREATE INDEX IF NOT EXISTS idx_game_rooms_city_name 
ON game_rooms(city_name);

-- Index for finding rooms by player count (for matchmaking)
CREATE INDEX IF NOT EXISTS idx_game_rooms_player_count 
ON game_rooms(player_count DESC);

-- Composite index for active room queries (recently updated + player count)
CREATE INDEX IF NOT EXISTS idx_game_rooms_active 
ON game_rooms(updated_at DESC, player_count DESC) 
WHERE player_count > 0;

-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- Analyze tables to update statistics for query planner
ANALYZE leaderboards;
ANALYZE game_rooms;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_leaderboards_score IS 
'Primary index for leaderboard sorting by score (most frequent query)';

COMMENT ON INDEX idx_leaderboards_player_name IS 
'Index for player rank lookup and duplicate prevention';

COMMENT ON INDEX idx_game_rooms_active IS 
'Composite index for finding active multiplayer rooms';

-- ============================================================================
-- MAINTENANCE RECOMMENDATIONS
-- ============================================================================

-- Consider adding these maintenance tasks to a cron job:
-- 1. Periodic VACUUM and ANALYZE for both tables
-- 2. Archive old inactive game rooms (older than 7 days with 0 players)  
-- 3. Remove duplicate leaderboard entries (keep highest score per player)