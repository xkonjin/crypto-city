-- Apply Database Performance Migrations for Plasma City
-- Run this file in your Supabase SQL Editor or PostgreSQL client
-- Addresses Issue #252: Optimize Database Queries and Add Indexing

-- ============================================================================
-- SAFETY CHECKS
-- ============================================================================

-- Ensure we're working with the correct tables
SELECT 'Checking table existence...' as status;

DO $$
DECLARE
  game_rooms_exists boolean;
  leaderboards_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'game_rooms'
  ) INTO game_rooms_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'leaderboards'
  ) INTO leaderboards_exists;
  
  IF NOT game_rooms_exists THEN
    RAISE EXCEPTION 'Table "game_rooms" does not exist. Please create it first.';
  END IF;
  
  IF NOT leaderboards_exists THEN
    RAISE EXCEPTION 'Table "leaderboards" does not exist. Please create it first.';
  END IF;
  
  RAISE NOTICE 'All required tables exist. Proceeding with migrations...';
END $$;

-- ============================================================================
-- MIGRATION 001: Performance Indexes
-- ============================================================================

\echo 'Applying Migration 001: Performance Indexes...'

-- Leaderboards indexes
CREATE INDEX IF NOT EXISTS idx_leaderboards_score 
ON leaderboards(score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_tvl 
ON leaderboards(tvl DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_population 
ON leaderboards(population DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_building_count 
ON leaderboards(building_count DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_days_survived 
ON leaderboards(days_survived DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_player_name 
ON leaderboards(player_name);

CREATE INDEX IF NOT EXISTS idx_leaderboards_city_name 
ON leaderboards(city_name);

CREATE INDEX IF NOT EXISTS idx_leaderboards_created_at 
ON leaderboards(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_updated_at 
ON leaderboards(updated_at DESC);

-- Game rooms indexes
CREATE INDEX IF NOT EXISTS idx_game_rooms_created_at 
ON game_rooms(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_rooms_updated_at 
ON game_rooms(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_rooms_city_name 
ON game_rooms(city_name);

CREATE INDEX IF NOT EXISTS idx_game_rooms_player_count 
ON game_rooms(player_count DESC);

CREATE INDEX IF NOT EXISTS idx_game_rooms_active 
ON game_rooms(updated_at DESC, player_count DESC) 
WHERE player_count > 0;

\echo 'Migration 001 completed successfully.'

-- ============================================================================
-- MIGRATION 002: Constraints and Advanced Optimizations  
-- ============================================================================

\echo 'Applying Migration 002: Constraints and Advanced Optimizations...'

-- Add missing columns with proper error handling
DO $$
BEGIN
  BEGIN
    ALTER TABLE leaderboards ADD COLUMN IF NOT EXISTS rug_pulls_survived INTEGER DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN
    -- Column already exists, ignore
  END;
END $$;

-- Add constraints (with IF NOT EXISTS equivalent)
DO $$
BEGIN
  -- Add check constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'chk_leaderboards_score_positive'
  ) THEN
    ALTER TABLE leaderboards 
    ADD CONSTRAINT chk_leaderboards_score_positive 
      CHECK (score >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'chk_leaderboards_tvl_positive'
  ) THEN
    ALTER TABLE leaderboards 
    ADD CONSTRAINT chk_leaderboards_tvl_positive 
      CHECK (tvl >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'chk_leaderboards_population_positive'
  ) THEN
    ALTER TABLE leaderboards 
    ADD CONSTRAINT chk_leaderboards_population_positive 
      CHECK (population >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'chk_leaderboards_days_survived_positive'
  ) THEN
    ALTER TABLE leaderboards 
    ADD CONSTRAINT chk_leaderboards_days_survived_positive 
      CHECK (days_survived >= 1);
  END IF;
END $$;

-- Partial indexes
CREATE INDEX IF NOT EXISTS idx_leaderboards_active_scores 
ON leaderboards(score DESC, created_at DESC) 
WHERE score > 0;

CREATE INDEX IF NOT EXISTS idx_leaderboards_no_rug_pulls 
ON leaderboards(score DESC) 
WHERE has_rug_pulls = false;

CREATE INDEX IF NOT EXISTS idx_game_rooms_active_only 
ON game_rooms(updated_at DESC) 
WHERE player_count > 0 AND updated_at > NOW() - INTERVAL '1 day';

-- Expression indexes
CREATE INDEX IF NOT EXISTS idx_leaderboards_player_name_lower 
ON leaderboards(LOWER(player_name));

CREATE INDEX IF NOT EXISTS idx_leaderboards_city_name_lower 
ON leaderboards(LOWER(city_name));

CREATE INDEX IF NOT EXISTS idx_game_rooms_room_code_upper 
ON game_rooms(UPPER(room_code));

\echo 'Migration 002 completed successfully.'

-- ============================================================================
-- PERFORMANCE TUNING
-- ============================================================================

\echo 'Applying performance tuning...'

-- Update table statistics
ANALYZE leaderboards;
ANALYZE game_rooms;

\echo 'Performance tuning completed.'

-- ============================================================================
-- VERIFICATION
-- ============================================================================

\echo 'Verifying migrations...'

-- Check that all indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('leaderboards', 'game_rooms')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check table statistics
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables 
WHERE relname IN ('leaderboards', 'game_rooms');

\echo 'All migrations applied successfully! 🚀'
\echo 'Database performance optimizations are now active.'
\echo ''
\echo 'Next steps:'
\echo '1. Monitor query performance using the performance monitoring queries'
\echo '2. Consider setting up automated maintenance (see maintenance recommendations)'
\echo '3. Test the application to ensure leaderboard and multiplayer performance improvements'