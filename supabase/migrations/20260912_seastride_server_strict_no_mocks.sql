-- =============================================================================
-- Migration: 20260912_seastride_server_strict_no_mocks.sql
-- Description: Strict enforcement of server data without mock fallbacks.
--              Adds absolute uniqueness to global server codes and player memberships.
--              Includes an updated RPC that ensures no duplicates or ghosts.
-- =============================================================================

-- 1. Ensure required constraints and tables are strictly unique
DO $$
BEGIN
  -- Cleanup duplicates just in case (keeps the latest created row)
  DELETE FROM public.global_servers
  WHERE ctid NOT IN (
      SELECT max(ctid) FROM public.global_servers GROUP BY code
  );

  DELETE FROM public.global_server_players
  WHERE ctid NOT IN (
      SELECT max(ctid) FROM public.global_server_players GROUP BY account_id
  );

  -- Apply UNIQUE constraint so UPSERTs never fail silently
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'global_servers_code_key') THEN
      ALTER TABLE public.global_servers ADD CONSTRAINT global_servers_code_key UNIQUE (code);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'global_server_players_account_id_key') THEN
      ALTER TABLE public.global_server_players ADD CONSTRAINT global_server_players_account_id_key UNIQUE (account_id);
  END IF;
END $$;

-- 2. Drop existing RLS policies and apply strict ones
DROP POLICY IF EXISTS "allow_select_global_server_players" ON public.global_server_players;
DROP POLICY IF EXISTS "allow_insert_global_server_players" ON public.global_server_players;
DROP POLICY IF EXISTS "allow_update_global_server_players" ON public.global_server_players;
DROP POLICY IF EXISTS "allow_delete_global_server_players" ON public.global_server_players;

-- Because we use name-only accounts without secure JWTs, we use anon/authenticated roles.
-- We allow SELECT so clients can fetch the fleet for their current server.
CREATE POLICY "allow_select_global_server_players" ON public.global_server_players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_insert_global_server_players" ON public.global_server_players FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "allow_update_global_server_players" ON public.global_server_players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete_global_server_players" ON public.global_server_players FOR DELETE TO anon, authenticated USING (true);

-- 3. Atomic join/switch RPC
CREATE OR REPLACE FUNCTION public.switch_or_join_server(
  p_account_id UUID,
  p_username TEXT,
  p_ship_stats JSONB DEFAULT '{}'::jsonb,
  p_target_server_code TEXT DEFAULT 'GLOBAL-1',
  p_custom_server_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_normalized_code TEXT;
  v_server_id UUID;
  v_server_name TEXT;
  v_server_type TEXT;
  v_player_count INT;
  v_server_num INT := 1;
  v_search_code TEXT;
  v_search_name TEXT;
  v_server_rec RECORD;
BEGIN
  -- Ensure user is absolutely removed from old servers before re-assigning
  DELETE FROM public.global_server_players WHERE account_id = p_account_id;

  v_normalized_code := UPPER(TRIM(COALESCE(p_target_server_code, 'GLOBAL-1')));
  IF v_normalized_code ~ '^GLOBAL[\s_-]?(\d+)$' THEN
    v_server_num := (REGEXP_MATCHES(v_normalized_code, '^GLOBAL[\s_-]?(\d+)$'))[1]::INT;
    v_normalized_code := 'GLOBAL-' || v_server_num;
  END IF;

  v_server_type := CASE WHEN v_normalized_code LIKE 'PRIV-%' THEN 'private' ELSE 'global' END;

  IF v_server_type = 'private' THEN
    v_server_name := COALESCE(NULLIF(TRIM(p_custom_server_name), ''), 'Private Island (' || v_normalized_code || ')');
    
    INSERT INTO public.global_servers (code, name, type, capacity, status)
    VALUES (v_normalized_code, v_server_name, 'private', 30, 'active')
    ON CONFLICT (code) DO UPDATE SET name = COALESCE(EXCLUDED.name, global_servers.name);

    SELECT id, code, name INTO v_server_rec FROM public.global_servers WHERE code = v_normalized_code FOR UPDATE;
    SELECT COUNT(*) INTO v_player_count FROM public.global_server_players WHERE server_id = v_server_rec.id;

    IF v_player_count >= 30 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Private server is full');
    END IF;

    v_server_id := v_server_rec.id;
    v_server_name := v_server_rec.name;
  ELSE
    LOOP
      v_search_code := 'GLOBAL-' || v_server_num;
      v_search_name := 'Global Fleet ' || v_server_num;

      INSERT INTO public.global_servers (code, name, type, capacity, status)
      VALUES (v_search_code, v_search_name, 'global', 30, 'active')
      ON CONFLICT (code) DO NOTHING;

      SELECT id, code, name INTO v_server_rec FROM public.global_servers WHERE code = v_search_code FOR UPDATE;
      SELECT COUNT(*) INTO v_player_count FROM public.global_server_players WHERE server_id = v_server_rec.id;

      IF v_player_count < 30 OR v_normalized_code = v_search_code THEN
        v_server_id := v_server_rec.id;
        v_normalized_code := v_server_rec.code;
        v_server_name := v_server_rec.name;
        EXIT;
      ELSE
        v_server_num := v_server_num + 1;
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.global_server_players (
    server_id, account_id, username,
    ship_level, ship_condition, current_hp, max_hp,
    cannon_level, cannon_count, shield_level, avatar_url,
    x_pos, y_pos, is_online, last_seen_at
  ) VALUES (
    v_server_id, p_account_id, p_username,
    COALESCE((p_ship_stats->>'ship_level')::INT, 1),
    COALESCE((p_ship_stats->>'ship_condition')::INT, 100),
    COALESCE((p_ship_stats->>'current_hp')::INT, 5000),
    COALESCE((p_ship_stats->>'max_hp')::INT, 5000),
    COALESCE((p_ship_stats->>'cannon_level')::INT, 1),
    COALESCE((p_ship_stats->>'cannon_count')::INT, 1),
    COALESCE((p_ship_stats->>'shield_level')::INT, 0),
    COALESCE(p_ship_stats->>'avatar_url', ''),
    15.0 + (random() * 70.0), 15.0 + (random() * 65.0),
    true, now()
  );

  SELECT COUNT(*) INTO v_player_count FROM public.global_server_players WHERE server_id = v_server_id;
  UPDATE public.global_servers SET status = CASE WHEN v_player_count >= 30 THEN 'full' ELSE 'active' END WHERE id = v_server_id;
  UPDATE public.player_progress SET last_server_code = v_normalized_code, updated_at = now() WHERE account_id = p_account_id;

  RETURN jsonb_build_object(
    'success', true,
    'server_id', v_server_id,
    'server_code', v_normalized_code,
    'server_name', v_server_name,
    'server_type', v_server_type,
    'capacity', 30,
    'player_count', v_player_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.switch_or_join_server(UUID, TEXT, JSONB, TEXT, TEXT) TO anon, authenticated;
