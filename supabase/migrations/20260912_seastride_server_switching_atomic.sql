-- =============================================================================
-- Migration: 20260912_seastride_server_switching_atomic.sql
-- Description: Atomic server switching/joining with PostgreSQL row locks,
--              strict 30-ship capacity enforcement, server UUID mapping,
--              and automatic cleanup of previous server memberships.
-- =============================================================================

-- 1. Ensure capacity on existing global_servers is capped at 30
UPDATE public.global_servers
SET capacity = 30
WHERE capacity != 30;

-- 2. Atomic Server Switching & Joining Function
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
  v_capacity INT := 30;
  v_existing_server_id UUID;
  v_player_count INT;
  v_server_num INT := 1;
  v_search_code TEXT;
  v_search_name TEXT;
  v_server_rec RECORD;
BEGIN
  -- 1. Normalize target server code
  v_normalized_code := UPPER(TRIM(COALESCE(p_target_server_code, 'GLOBAL-1')));
  IF v_normalized_code ~ '^GLOBAL[\s_-]?(\d+)$' THEN
    v_server_num := (REGEXP_MATCHES(v_normalized_code, '^GLOBAL[\s_-]?(\d+)$'))[1]::INT;
    v_normalized_code := 'GLOBAL-' || v_server_num;
  END IF;

  v_server_type := CASE WHEN v_normalized_code LIKE 'PRIV-%' THEN 'private' ELSE 'global' END;

  -- 2. If user target is a specific global or private server, look up or create server row
  IF v_server_type = 'private' THEN
    v_server_name := COALESCE(NULLIF(TRIM(p_custom_server_name), ''), 'Private Island (' || v_normalized_code || ')');

    INSERT INTO public.global_servers (code, name, type, capacity, status)
    VALUES (v_normalized_code, v_server_name, 'private', 30, 'active')
    ON CONFLICT (code) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, global_servers.name),
        capacity = 30;

    -- Lock private server row to check capacity atomically
    SELECT id, code, name, type, capacity, status
    INTO v_server_rec
    FROM public.global_servers
    WHERE code = v_normalized_code
    FOR UPDATE;

    -- Count existing ships in this private server
    SELECT COUNT(*) INTO v_player_count
    FROM public.global_server_players
    WHERE server_id = v_server_rec.id AND account_id != p_account_id;

    IF v_player_count >= 30 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Private server is full (30/30 ships)'
      );
    END IF;

    v_server_id := v_server_rec.id;
    v_server_name := v_server_rec.name;

  ELSE
    -- Global server join flow: Lock target room (GLOBAL-1, etc.) or overflow to GLOBAL-2, GLOBAL-3
    LOOP
      v_search_code := 'GLOBAL-' || v_server_num;
      v_search_name := 'Global Fleet ' || v_server_num;

      INSERT INTO public.global_servers (code, name, type, capacity, status)
      VALUES (v_search_code, v_search_name, 'global', 30, 'active')
      ON CONFLICT (code) DO UPDATE SET capacity = 30;

      SELECT id, code, name, type, capacity, status
      INTO v_server_rec
      FROM public.global_servers
      WHERE code = v_search_code
      FOR UPDATE;

      -- Count existing assigned ships excluding current user
      SELECT COUNT(*) INTO v_player_count
      FROM public.global_server_players
      WHERE server_id = v_server_rec.id AND account_id != p_account_id;

      IF v_player_count < 30 OR v_normalized_code = v_search_code THEN
        v_server_id := v_server_rec.id;
        v_normalized_code := v_server_rec.code;
        v_server_name := v_server_rec.name;
        EXIT;
      ELSE
        v_server_num := v_server_num + 1;
      END IF;

      IF v_server_num > 500 THEN
        RAISE EXCEPTION 'All global server rooms are at full capacity';
      END IF;
    END LOOP;
  END IF;

  -- 3. Check if player is already assigned to a different server and remove previous membership
  SELECT server_id INTO v_existing_server_id
  FROM public.global_server_players
  WHERE account_id = p_account_id;

  IF v_existing_server_id IS NOT NULL AND v_existing_server_id != v_server_id THEN
    DELETE FROM public.global_server_players
    WHERE account_id = p_account_id;
  END IF;

  -- 4. Upsert ship membership into target server
  INSERT INTO public.global_server_players (
    server_id,
    account_id,
    username,
    ship_level,
    ship_condition,
    current_hp,
    max_hp,
    cannon_level,
    cannon_count,
    shield_level,
    avatar_url,
    x_pos,
    y_pos,
    is_online,
    last_seen_at
  ) VALUES (
    v_server_id,
    p_account_id,
    p_username,
    COALESCE((p_ship_stats->>'ship_level')::INT, 1),
    COALESCE((p_ship_stats->>'ship_condition')::INT, 100),
    COALESCE((p_ship_stats->>'current_hp')::INT, 5000),
    COALESCE((p_ship_stats->>'max_hp')::INT, 5000),
    COALESCE((p_ship_stats->>'cannon_level')::INT, 1),
    COALESCE((p_ship_stats->>'cannon_count')::INT, 1),
    COALESCE((p_ship_stats->>'shield_level')::INT, 0),
    COALESCE(p_ship_stats->>'avatar_url', ''),
    15.0 + (random() * 70.0),
    15.0 + (random() * 65.0),
    true,
    now()
  )
  ON CONFLICT (account_id) DO UPDATE
  SET server_id = v_server_id,
      username = EXCLUDED.username,
      ship_level = EXCLUDED.ship_level,
      ship_condition = EXCLUDED.ship_condition,
      current_hp = EXCLUDED.current_hp,
      max_hp = EXCLUDED.max_hp,
      cannon_level = EXCLUDED.cannon_level,
      cannon_count = EXCLUDED.cannon_count,
      shield_level = EXCLUDED.shield_level,
      avatar_url = EXCLUDED.avatar_url,
      is_online = true,
      last_seen_at = now();

  -- 5. Calculate authoritative updated ship count for target server
  SELECT COUNT(*) INTO v_player_count
  FROM public.global_server_players
  WHERE server_id = v_server_id;

  -- Update server status if full
  IF v_player_count >= 30 THEN
    UPDATE public.global_servers SET status = 'full' WHERE id = v_server_id;
  ELSE
    UPDATE public.global_servers SET status = 'active' WHERE id = v_server_id;
  END IF;

  -- 6. Update last_server_code in player_progress
  UPDATE public.player_progress
  SET last_server_code = v_normalized_code,
      updated_at = now()
  WHERE account_id = p_account_id;

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

-- Grant permissions for RPC
GRANT EXECUTE ON FUNCTION public.switch_or_join_server(UUID, TEXT, JSONB, TEXT, TEXT) TO anon, authenticated;
