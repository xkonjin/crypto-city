-- Performance Monitoring Queries for Plasma City Database
-- Use these queries to monitor database performance after applying optimizations
-- Run these periodically to ensure optimal performance

-- ============================================================================
-- SLOW QUERY MONITORING
-- ============================================================================

-- Enable query statistics tracking (run once)
-- Note: This requires superuser privileges, may need to be done by Supabase admin
-- SELECT pg_stat_statements_reset(); -- Reset stats for fresh monitoring

-- Top 10 slowest queries (if pg_stat_statements is available)
-- Uncomment and run if pg_stat_statements extension is enabled
/*
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  stddev_time,
  (total_time / sum(total_time) OVER()) * 100 AS percent_total_time
FROM pg_stat_statements 
WHERE query LIKE '%leaderboards%' OR query LIKE '%game_rooms%'
ORDER BY total_time DESC 
LIMIT 10;
*/

-- ============================================================================
-- INDEX USAGE ANALYSIS  
-- ============================================================================

-- Check index usage for leaderboards table
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  CASE 
    WHEN idx_scan = 0 THEN 'UNUSED INDEX'
    WHEN idx_scan < 10 THEN 'LOW USAGE'
    WHEN idx_scan < 100 THEN 'MODERATE USAGE'
    ELSE 'HIGH USAGE'
  END as usage_level
FROM pg_stat_user_indexes 
WHERE tablename IN ('leaderboards', 'game_rooms')
ORDER BY tablename, idx_scan DESC;

-- Identify unused indexes (candidates for removal)
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as index_size,
  idx_scan as scans
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
  AND tablename IN ('leaderboards', 'game_rooms')
  AND indexname NOT LIKE '%_pkey'; -- Exclude primary keys

-- ============================================================================
-- TABLE STATISTICS
-- ============================================================================

-- Current table sizes and row counts
SELECT 
  schemaname,
  tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_stat_user_tables 
WHERE tablename IN ('leaderboards', 'game_rooms')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Table bloat analysis
SELECT 
  tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  CASE 
    WHEN n_live_tup > 0 THEN ROUND((n_dead_tup::float / n_live_tup::float) * 100, 2)
    ELSE 0 
  END as bloat_percentage,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename IN ('leaderboards', 'game_rooms');

-- ============================================================================
-- QUERY PERFORMANCE TESTING
-- ============================================================================

-- Test leaderboard queries with EXPLAIN ANALYZE
-- Score-based leaderboard (most common query)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, player_name, city_name, score, tvl, population, building_count, days_survived, achievements
FROM leaderboards 
WHERE score > 0
ORDER BY score DESC, created_at DESC 
LIMIT 100;

-- TVL-based leaderboard
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, player_name, city_name, score, tvl, population, building_count, days_survived, achievements
FROM leaderboards 
WHERE tvl > 0
ORDER BY tvl DESC, created_at DESC 
LIMIT 100;

-- Player rank lookup
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) + 1 as rank
FROM leaderboards 
WHERE score > (
  SELECT score FROM leaderboards WHERE player_name = 'test_player' LIMIT 1
);

-- Recent game rooms lookup
EXPLAIN (ANALYZE, BUFFERS) 
SELECT room_code, city_name, player_count, created_at, updated_at
FROM game_rooms 
WHERE player_count > 0 
ORDER BY updated_at DESC 
LIMIT 20;

-- ============================================================================
-- MAINTENANCE RECOMMENDATIONS
-- ============================================================================

-- Check if tables need vacuuming
SELECT 
  tablename,
  n_dead_tup as dead_tuples,
  CASE 
    WHEN n_dead_tup > n_live_tup * 0.1 THEN 'VACUUM RECOMMENDED'
    WHEN n_dead_tup > n_live_tup * 0.05 THEN 'VACUUM SUGGESTED' 
    ELSE 'OK'
  END as vacuum_status,
  CASE 
    WHEN last_analyze < NOW() - INTERVAL '1 day' THEN 'ANALYZE RECOMMENDED'
    WHEN last_analyze < NOW() - INTERVAL '12 hours' THEN 'ANALYZE SUGGESTED'
    ELSE 'OK'
  END as analyze_status
FROM pg_stat_user_tables 
WHERE tablename IN ('leaderboards', 'game_rooms');

-- ============================================================================
-- CACHE HIT RATIOS
-- ============================================================================

-- Database cache hit ratio (should be > 95%)
SELECT 
  'Database Cache Hit Ratio' as metric,
  ROUND(
    (sum(blks_hit) * 100.0) / (sum(blks_hit) + sum(blks_read)), 2
  ) as percentage
FROM pg_stat_database;

-- Table-specific cache hit ratios
SELECT 
  tablename,
  CASE 
    WHEN heap_blks_hit + heap_blks_read > 0 THEN
      ROUND((heap_blks_hit * 100.0) / (heap_blks_hit + heap_blks_read), 2)
    ELSE NULL 
  END as table_cache_hit_ratio,
  CASE 
    WHEN idx_blks_hit + idx_blks_read > 0 THEN
      ROUND((idx_blks_hit * 100.0) / (idx_blks_hit + idx_blks_read), 2)
    ELSE NULL 
  END as index_cache_hit_ratio
FROM pg_statio_user_tables 
WHERE tablename IN ('leaderboards', 'game_rooms');

-- ============================================================================
-- PERFORMANCE BENCHMARKS
-- ============================================================================

-- Benchmark: Time common leaderboard queries
\timing on

-- Test 1: Score leaderboard with limit
SELECT COUNT(*) FROM (
  SELECT id, player_name, score 
  FROM leaderboards 
  WHERE score > 0 
  ORDER BY score DESC 
  LIMIT 100
) t;

-- Test 2: Player rank calculation  
SELECT COUNT(*) FROM leaderboards WHERE score > 50000;

-- Test 3: Room lookup
SELECT COUNT(*) FROM game_rooms WHERE player_count > 0;

\timing off

-- ============================================================================
-- AUTOMATED MONITORING RECOMMENDATIONS
-- ============================================================================

/*
RECOMMENDED MONITORING SCHEDULE:

1. Run these performance queries daily:
   - Table statistics
   - Index usage analysis
   - Cache hit ratios

2. Run weekly:
   - Slow query analysis (if pg_stat_statements available)
   - Bloat analysis
   - Maintenance recommendations

3. Set up alerts for:
   - Cache hit ratio below 95%
   - Table bloat above 20%
   - Unused indexes taking significant space
   - Query response times above 100ms

4. Automate maintenance:
   - VACUUM ANALYZE daily during low traffic
   - Refresh materialized views every 5-10 minutes
   - Clean up inactive game rooms daily
*/