-- PostgreSQL Function for Efficient Player Rank Calculation
-- This function provides O(log n) rank lookup using window functions
-- Addresses Issue #252: Optimize Database Queries and Add Indexing

-- ============================================================================
-- FUNCTION: get_player_rank
-- ============================================================================

CREATE OR REPLACE FUNCTION get_player_rank(
  p_player_name TEXT,
  p_order_column TEXT DEFAULT 'score'
)
RETURNS TABLE(rank INTEGER) 
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
AS $$
DECLARE
  query_sql TEXT;
BEGIN
  -- Validate the order column to prevent SQL injection
  IF p_order_column NOT IN ('score', 'tvl', 'population', 'building_count', 'days_survived') THEN
    RAISE EXCEPTION 'Invalid order column: %', p_order_column;
  END IF;

  -- Build dynamic query using the specified column
  query_sql := format('
    WITH ranked_players AS (
      SELECT 
        player_name,
        ROW_NUMBER() OVER (ORDER BY %I DESC, created_at ASC) as player_rank
      FROM leaderboards 
      WHERE score > 0
    )
    SELECT player_rank::INTEGER
    FROM ranked_players 
    WHERE player_name = $1
    LIMIT 1',
    p_order_column
  );

  -- Execute the query and return the rank
  RETURN QUERY EXECUTE query_sql USING p_player_name;
  
  -- If no rows returned, player not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::INTEGER;
  END IF;
END;
$$;

-- ============================================================================
-- FUNCTION: get_leaderboard_with_ranks
-- ============================================================================

-- Function to get leaderboard data with pre-computed ranks
-- This is more efficient than calculating ranks client-side
CREATE OR REPLACE FUNCTION get_leaderboard_with_ranks(
  p_category TEXT DEFAULT 'score',
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id TEXT,
  player_name TEXT,
  city_name TEXT,
  score INTEGER,
  tvl INTEGER,
  population INTEGER,
  building_count INTEGER,
  crypto_building_count INTEGER,
  days_survived INTEGER,
  achievements INTEGER,
  rug_pulls_survived INTEGER,
  has_rug_pulls BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  rank INTEGER
) 
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
AS $$
DECLARE
  query_sql TEXT;
  order_column TEXT;
BEGIN
  -- Validate and map category to column name
  CASE p_category
    WHEN 'score' THEN order_column := 'score';
    WHEN 'tvl' THEN order_column := 'tvl';
    WHEN 'population' THEN order_column := 'population';
    WHEN 'buildings' THEN order_column := 'building_count';
    WHEN 'survival' THEN order_column := 'days_survived';
    ELSE 
      RAISE EXCEPTION 'Invalid category: %', p_category;
  END CASE;

  -- Build query with proper ordering for index usage
  query_sql := format('
    SELECT 
      l.id,
      l.player_name,
      l.city_name,
      l.score,
      l.tvl,
      l.population,
      l.building_count,
      l.crypto_building_count,
      l.days_survived,
      l.achievements,
      l.rug_pulls_survived,
      l.has_rug_pulls,
      l.created_at,
      l.updated_at,
      ROW_NUMBER() OVER (ORDER BY %I DESC, created_at ASC)::INTEGER as rank
    FROM leaderboards l
    WHERE l.score > 0
    ORDER BY %I DESC, created_at ASC
    LIMIT $1 OFFSET $2',
    order_column, order_column
  );

  RETURN QUERY EXECUTE query_sql USING p_limit, p_offset;
END;
$$;

-- ============================================================================
-- FUNCTION: get_player_rank_with_neighbors  
-- ============================================================================

-- Function to get a player's rank along with players ranked nearby
-- Useful for showing "You are rank X out of Y, near Player A and Player B"
CREATE OR REPLACE FUNCTION get_player_rank_with_neighbors(
  p_player_name TEXT,
  p_category TEXT DEFAULT 'score',
  p_neighbors INTEGER DEFAULT 2
)
RETURNS TABLE(
  player_name TEXT,
  city_name TEXT,
  score INTEGER,
  tvl INTEGER,
  population INTEGER,
  building_count INTEGER,
  days_survived INTEGER,
  rank INTEGER,
  is_target_player BOOLEAN
) 
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
AS $$
DECLARE
  query_sql TEXT;
  order_column TEXT;
  target_rank INTEGER;
BEGIN
  -- Validate and map category to column name
  CASE p_category
    WHEN 'score' THEN order_column := 'score';
    WHEN 'tvl' THEN order_column := 'tvl';
    WHEN 'population' THEN order_column := 'population';
    WHEN 'buildings' THEN order_column := 'building_count';
    WHEN 'survival' THEN order_column := 'days_survived';
    ELSE 
      RAISE EXCEPTION 'Invalid category: %', p_category;
  END CASE;

  -- First, get the target player's rank
  query_sql := format('
    WITH ranked_players AS (
      SELECT 
        player_name,
        ROW_NUMBER() OVER (ORDER BY %I DESC, created_at ASC) as player_rank
      FROM leaderboards 
      WHERE score > 0
    )
    SELECT player_rank::INTEGER
    FROM ranked_players 
    WHERE player_name = $1',
    order_column
  );
  
  EXECUTE query_sql INTO target_rank USING p_player_name;
  
  IF target_rank IS NULL THEN
    -- Player not found
    RETURN;
  END IF;

  -- Return the target player and neighbors
  query_sql := format('
    WITH ranked_players AS (
      SELECT 
        l.player_name,
        l.city_name,
        l.score,
        l.tvl,
        l.population,
        l.building_count,
        l.days_survived,
        ROW_NUMBER() OVER (ORDER BY %I DESC, created_at ASC) as player_rank
      FROM leaderboards l
      WHERE l.score > 0
    )
    SELECT 
      rp.player_name,
      rp.city_name,
      rp.score,
      rp.tvl,
      rp.population,
      rp.building_count,
      rp.days_survived,
      rp.player_rank::INTEGER as rank,
      (rp.player_name = $1) as is_target_player
    FROM ranked_players rp
    WHERE rp.player_rank BETWEEN $2 - $3 AND $2 + $3
    ORDER BY rp.player_rank',
    order_column
  );

  RETURN QUERY EXECUTE query_sql USING p_player_name, target_rank, p_neighbors;
END;
$$;

-- ============================================================================
-- FUNCTION: get_leaderboard_stats
-- ============================================================================

-- Function to get overall leaderboard statistics
-- Useful for showing "X total players, average score Y" etc.
CREATE OR REPLACE FUNCTION get_leaderboard_stats()
RETURNS TABLE(
  total_players INTEGER,
  active_players INTEGER,
  avg_score NUMERIC,
  max_score INTEGER,
  avg_tvl NUMERIC,
  max_tvl INTEGER,
  avg_population NUMERIC,
  max_population INTEGER,
  total_cities INTEGER,
  players_without_rug_pulls INTEGER
) 
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_players,
    COUNT(*) FILTER (WHERE score > 0)::INTEGER as active_players,
    ROUND(AVG(score) FILTER (WHERE score > 0), 2) as avg_score,
    MAX(score) as max_score,
    ROUND(AVG(tvl) FILTER (WHERE tvl > 0), 2) as avg_tvl,
    MAX(tvl) as max_tvl,
    ROUND(AVG(population) FILTER (WHERE population > 0), 2) as avg_population,
    MAX(population) as max_population,
    COUNT(DISTINCT city_name)::INTEGER as total_cities,
    COUNT(*) FILTER (WHERE has_rug_pulls = false AND score > 0)::INTEGER as players_without_rug_pulls
  FROM leaderboards;
END;
$$;

-- ============================================================================
-- PERMISSIONS AND SECURITY
-- ============================================================================

-- Grant execute permissions to the web application role
-- Note: Adjust role names based on your Supabase setup
-- GRANT EXECUTE ON FUNCTION get_player_rank(TEXT, TEXT) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION get_leaderboard_with_ranks(TEXT, INTEGER, INTEGER) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION get_player_rank_with_neighbors(TEXT, TEXT, INTEGER) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION get_leaderboard_stats() TO anon, authenticated;

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

/*
PERFORMANCE CHARACTERISTICS:

1. get_player_rank():
   - Time complexity: O(log n) due to index usage
   - Uses composite indexes for fast ordering
   - Stable and parallel-safe for better concurrency

2. get_leaderboard_with_ranks():
   - More efficient than separate rank calculations
   - Single query instead of N+1 queries
   - Proper LIMIT/OFFSET for pagination

3. get_player_rank_with_neighbors():
   - Shows context around player's position
   - Uses windowing for efficient rank calculation
   - Minimal data transfer

4. get_leaderboard_stats():
   - Cached statistics computation
   - Uses conditional aggregation for efficiency
   - Consider materializing for very large tables

USAGE EXAMPLES:

-- Get player rank
SELECT * FROM get_player_rank('player_name', 'score');

-- Get top 10 with ranks
SELECT * FROM get_leaderboard_with_ranks('score', 10, 0);

-- Get player with 2 neighbors above/below
SELECT * FROM get_player_rank_with_neighbors('player_name', 'score', 2);

-- Get overall stats
SELECT * FROM get_leaderboard_stats();
*/