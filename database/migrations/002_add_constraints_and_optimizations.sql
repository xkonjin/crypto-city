-- Migration: Add Constraints and Advanced Optimizations
-- Date: 2025-01-25  
-- Addresses Issue #252: Additional database optimizations

-- ============================================================================
-- ADD MISSING COLUMNS AND CONSTRAINTS
-- ============================================================================

-- Add missing columns to leaderboards table if they don't exist
-- Note: These may already exist, so we use ALTER TABLE ... ADD COLUMN IF NOT EXISTS

-- Add rug_pulls_survived column if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'leaderboards' AND column_name = 'rug_pulls_survived') THEN
    ALTER TABLE leaderboards ADD COLUMN rug_pulls_survived INTEGER DEFAULT 0;
  END IF;
END $$;

-- Ensure all numeric columns have proper constraints
ALTER TABLE leaderboards 
  ALTER COLUMN score SET DEFAULT 0,
  ALTER COLUMN tvl SET DEFAULT 0,
  ALTER COLUMN population SET DEFAULT 0,
  ALTER COLUMN building_count SET DEFAULT 0,
  ALTER COLUMN crypto_building_count SET DEFAULT 0,
  ALTER COLUMN days_survived SET DEFAULT 1,
  ALTER COLUMN achievements SET DEFAULT 0,
  ALTER COLUMN rug_pulls_survived SET DEFAULT 0;

-- Add check constraints for data quality
ALTER TABLE leaderboards 
  ADD CONSTRAINT chk_leaderboards_score_positive 
    CHECK (score >= 0);

ALTER TABLE leaderboards 
  ADD CONSTRAINT chk_leaderboards_tvl_positive 
    CHECK (tvl >= 0);

ALTER TABLE leaderboards 
  ADD CONSTRAINT chk_leaderboards_population_positive 
    CHECK (population >= 0);

ALTER TABLE leaderboards 
  ADD CONSTRAINT chk_leaderboards_days_survived_positive 
    CHECK (days_survived >= 1);

-- ============================================================================
-- PARTIAL INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Partial index for active leaderboard entries (score > 0)
-- This will speed up queries for meaningful entries only
CREATE INDEX IF NOT EXISTS idx_leaderboards_active_scores 
ON leaderboards(score DESC, created_at DESC) 
WHERE score > 0;

-- Partial index for cities without rug pulls (for multiplier calculation)
CREATE INDEX IF NOT EXISTS idx_leaderboards_no_rug_pulls 
ON leaderboards(score DESC) 
WHERE has_rug_pulls = false;

-- Partial index for active game rooms only
CREATE INDEX IF NOT EXISTS idx_game_rooms_active_only 
ON game_rooms(updated_at DESC) 
WHERE player_count > 0 AND updated_at > NOW() - INTERVAL '1 day';

-- ============================================================================
-- EXPRESSION INDEXES FOR COMPUTED VALUES
-- ============================================================================

-- Index for normalized player names (case-insensitive searches)
CREATE INDEX IF NOT EXISTS idx_leaderboards_player_name_lower 
ON leaderboards(LOWER(player_name));

-- Index for normalized city names (case-insensitive searches)
CREATE INDEX IF NOT EXISTS idx_leaderboards_city_name_lower 
ON leaderboards(LOWER(city_name));

-- Index for room codes in uppercase (since the app converts to uppercase)
CREATE INDEX IF NOT EXISTS idx_game_rooms_room_code_upper 
ON game_rooms(UPPER(room_code));

-- ============================================================================
-- ADVANCED PERFORMANCE TUNING
-- ============================================================================

-- Set table storage parameters for better performance
ALTER TABLE leaderboards SET (
  fillfactor = 90,  -- Leave 10% free space for updates
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE game_rooms SET (
  fillfactor = 80,  -- More free space due to frequent game_state updates
  autovacuum_vacuum_scale_factor = 0.2,
  autovacuum_analyze_scale_factor = 0.1
);

-- ============================================================================
-- CREATE MATERIALIZED VIEW FOR LEADERBOARD RANKINGS
-- ============================================================================

-- Create a materialized view for faster leaderboard queries
-- This pre-computes rankings and can be refreshed periodically
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_leaderboard_rankings AS
SELECT 
  id,
  player_name,
  city_name,
  score,
  tvl,
  population,
  building_count,
  days_survived,
  achievements,
  has_rug_pulls,
  created_at,
  updated_at,
  ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as score_rank,
  ROW_NUMBER() OVER (ORDER BY tvl DESC, created_at ASC) as tvl_rank,
  ROW_NUMBER() OVER (ORDER BY population DESC, created_at ASC) as population_rank,
  ROW_NUMBER() OVER (ORDER BY building_count DESC, created_at ASC) as building_rank,
  ROW_NUMBER() OVER (ORDER BY days_survived DESC, created_at ASC) as survival_rank
FROM leaderboards 
WHERE score > 0
ORDER BY score DESC;

-- Add indexes to the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_leaderboard_rankings_id 
ON mv_leaderboard_rankings(id);

CREATE INDEX IF NOT EXISTS idx_mv_leaderboard_rankings_score_rank 
ON mv_leaderboard_rankings(score_rank);

CREATE INDEX IF NOT EXISTS idx_mv_leaderboard_rankings_player 
ON mv_leaderboard_rankings(player_name);

-- ============================================================================
-- FUNCTIONS FOR AUTOMATED MAINTENANCE
-- ============================================================================

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_leaderboard_rankings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_leaderboard_rankings;
END;
$$;

-- Function to clean up old inactive game rooms
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms(days_old INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM game_rooms 
  WHERE player_count = 0 
    AND updated_at < NOW() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON MATERIALIZED VIEW mv_leaderboard_rankings IS 
'Pre-computed leaderboard rankings for fast query performance. Refresh every 5-10 minutes.';

COMMENT ON FUNCTION refresh_leaderboard_rankings() IS 
'Refreshes the leaderboard rankings materialized view. Run this every 5-10 minutes.';

COMMENT ON FUNCTION cleanup_inactive_rooms(INTEGER) IS 
'Removes inactive game rooms older than specified days. Run this daily.';