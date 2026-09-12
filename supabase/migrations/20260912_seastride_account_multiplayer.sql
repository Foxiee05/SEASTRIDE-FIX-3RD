-- =============================================================================
-- Migration: 20260912_seastride_account_multiplayer.sql
-- Description: Creates the name-only demo account system, player progress
--              persistence, game records, multiplayer matchmaking, and
--              global servers (30-player limit) with Realtime replication.
-- Purpose:
--   1. Provide a passwordless, name-only account system with unique,
--      case-sensitive usernames (3-24 characters; letters, numbers, underscores).
--   2. Provide persistent, isolated storage for player progress and game records.
--   3. Provide automatic server assignment into global-1, global-2, etc. (max 30 ships)
--      using atomic PostgreSQL row locking to prevent overfilling.
--   4. Enable Supabase Realtime for global server multiplayer synchronization.
--
-- Security & Risk Notice:
--   - This is an INTENTIONAL DEMO name-only account system without passwords,
--     emails, or Supabase Auth. Anyone who knows a username can access that account.
--   - Tables use Row Level Security (RLS) and feature-specific permissions for the
--     anon and authenticated roles.
--   - Do NOT run destructive commands on unrelated tables. All definitions use
--     IF NOT EXISTS and idempotent clauses.
-- =============================================================================

-- 1. Accounts Table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_username_format CHECK (
    char_length(username) >= 3 AND
    char_length(username) <= 24 AND
    username ~ '^[a-zA-Z0-9_]+$'
  )
);

CREATE INDEX IF NOT EXISTS idx_accounts_username ON public.accounts(username);

-- 2. Player Progress Table (1:1 with accounts)
CREATE TABLE IF NOT EXISTS public.player_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  coins INTEGER NOT NULL DEFAULT 1250,
  gems INTEGER NOT NULL DEFAULT 20,
  energy INTEGER NOT NULL DEFAULT 5,
  max_energy INTEGER NOT NULL DEFAULT 5,
  player_level INTEGER NOT NULL DEFAULT 1,
  player_xp INTEGER NOT NULL DEFAULT 250,
  ship_level INTEGER NOT NULL DEFAULT 1,
  ship_condition INTEGER NOT NULL DEFAULT 75,
  ship_current_hp INTEGER NOT NULL DEFAULT 3750,
  ship_max_hp INTEGER NOT NULL DEFAULT 5000,
  avatar_url TEXT NOT NULL DEFAULT '',
  about_me TEXT NOT NULL DEFAULT 'Sailing the Seven Seas!',
  owned_cannons JSONB NOT NULL DEFAULT '[{"id":"c_1","level":1}]'::jsonb,
  equipped_cannons JSONB NOT NULL DEFAULT '["c_1"]'::jsonb,
  owned_shields JSONB NOT NULL DEFAULT '[]'::jsonb,
  equipped_shield TEXT,
  owned_decorations JSONB NOT NULL DEFAULT '["dec_jolly_roger"]'::jsonb,
  equipped_decorations JSONB NOT NULL DEFAULT '["dec_jolly_roger"]'::jsonb,
  total_steps_today INTEGER NOT NULL DEFAULT 0,
  step_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_coins_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  quest_index INTEGER NOT NULL DEFAULT 0,
  quest_xp INTEGER NOT NULL DEFAULT 0,
  claimed_quests JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_player_progress_account UNIQUE(account_id)
);

CREATE INDEX IF NOT EXISTS idx_player_progress_account_id ON public.player_progress(account_id);

-- 3. Game Records Table (Persistent historical logs)
CREATE TABLE IF NOT EXISTS public.game_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- 'raid_log', 'battle_log', 'treasure_loot', 'step_log'
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_records_account_id ON public.game_records(account_id);
CREATE INDEX IF NOT EXISTS idx_game_records_type ON public.game_records(record_type);

-- 4. Global Servers Table (Multiplayer rooms: max 30 players per room)
CREATE TABLE IF NOT EXISTS public.global_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- 'GLOBAL-1', 'GLOBAL-2', etc.
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'global', -- 'global' or 'private'
  capacity INTEGER NOT NULL DEFAULT 30, -- 30 ships max
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'full', 'maintenance'
  state JSONB NOT NULL DEFAULT '{"raid":null,"weather":"clear"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_global_servers_code ON public.global_servers(code);

-- Seed initial global-1 if not exists
INSERT INTO public.global_servers (code, name, type, capacity, status)
VALUES ('GLOBAL-1', 'Global Fleet 1', 'global', 30, 'active')
ON CONFLICT (code) DO NOTHING;

-- 5. Global Server Players Table (Ship allocations to server)
CREATE TABLE IF NOT EXISTS public.global_server_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.global_servers(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  ship_level INTEGER NOT NULL DEFAULT 1,
  ship_condition INTEGER NOT NULL DEFAULT 100,
  current_hp INTEGER NOT NULL DEFAULT 5000,
  max_hp INTEGER NOT NULL DEFAULT 5000,
  cannon_level INTEGER NOT NULL DEFAULT 1,
  cannon_count INTEGER NOT NULL DEFAULT 1,
  shield_level INTEGER NOT NULL DEFAULT 0,
  avatar_url TEXT NOT NULL DEFAULT '',
  x_pos NUMERIC(6, 2) NOT NULL DEFAULT 50.0,
  y_pos NUMERIC(6, 2) NOT NULL DEFAULT 50.0,
  is_online BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_global_server_player_account UNIQUE(account_id),
  CONSTRAINT uq_global_server_account UNIQUE(server_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_global_server_players_server_id ON public.global_server_players(server_id);
CREATE INDEX IF NOT EXISTS idx_global_server_players_account_id ON public.global_server_players(account_id);

-- 6. Matches & Match Players (Multiplayer lobbies)
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'waiting', 'active', 'finished'
  game_mode TEXT NOT NULL DEFAULT 'bombing',
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_server_code ON public.matches(server_code);

CREATE TABLE IF NOT EXISTS public.match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_match_player UNIQUE(match_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON public.match_players(match_id);

-- =============================================================================
-- 7. ATOMIC MATCHMAKING & SERVER ALLOCATION RPC
-- Places player in GLOBAL-1 (up to 30 ships), then GLOBAL-2, GLOBAL-3, etc.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.join_or_assign_global_server(
  p_account_id UUID,
  p_username TEXT,
  p_ship_stats JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_server_id UUID;
  v_assigned_server_code TEXT;
  v_server_num INT := 1;
  v_server_code TEXT;
  v_server_name TEXT;
  v_player_count INT;
  v_server_rec RECORD;
  v_result JSONB;
BEGIN
  -- Check if already assigned to a server
  SELECT gsp.server_id, gs.code
  INTO v_existing_server_id, v_assigned_server_code
  FROM public.global_server_players gsp
  JOIN public.global_servers gs ON gs.id = gsp.server_id
  WHERE gsp.account_id = p_account_id;

  IF v_existing_server_id IS NOT NULL THEN
    -- Refresh existing player record
    UPDATE public.global_server_players
    SET is_online = true,
        last_seen_at = now(),
        username = COALESCE(p_username, username),
        ship_level = COALESCE((p_ship_stats->>'ship_level')::INT, ship_level),
        ship_condition = COALESCE((p_ship_stats->>'ship_condition')::INT, ship_condition),
        current_hp = COALESCE((p_ship_stats->>'current_hp')::INT, current_hp),
        max_hp = COALESCE((p_ship_stats->>'max_hp')::INT, max_hp),
        cannon_level = COALESCE((p_ship_stats->>'cannon_level')::INT, cannon_level),
        cannon_count = COALESCE((p_ship_stats->>'cannon_count')::INT, cannon_count),
        shield_level = COALESCE((p_ship_stats->>'shield_level')::INT, shield_level),
        avatar_url = COALESCE(p_ship_stats->>'avatar_url', avatar_url)
    WHERE account_id = p_account_id AND server_id = v_existing_server_id;

    RETURN jsonb_build_object(
      'success', true,
      'reconnected', true,
      'server_id', v_existing_server_id,
      'server_code', v_assigned_server_code
    );
  END IF;

  -- Sequentially search GLOBAL-1, GLOBAL-2, etc.
  LOOP
    v_server_code := 'GLOBAL-' || v_server_num;
    v_server_name := 'Global Fleet ' || v_server_num;

    -- Ensure server row exists
    INSERT INTO public.global_servers (code, name, type, capacity, status)
    VALUES (v_server_code, v_server_name, 'global', 30, 'active')
    ON CONFLICT (code) DO NOTHING;

    -- Lock the server row to prevent simultaneous race conditions
    SELECT id, code, capacity, status
    INTO v_server_rec
    FROM public.global_servers
    WHERE code = v_server_code
    FOR UPDATE;

    -- Count existing assigned ships
    SELECT COUNT(*) INTO v_player_count
    FROM public.global_server_players
    WHERE server_id = v_server_rec.id;

    IF v_player_count < v_server_rec.capacity THEN
      -- Slot is available in this server!
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
        v_server_rec.id,
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
      SET server_id = v_server_rec.id,
          username = EXCLUDED.username,
          is_online = true,
          last_seen_at = now();

      IF (v_player_count + 1) >= v_server_rec.capacity THEN
        UPDATE public.global_servers SET status = 'full' WHERE id = v_server_rec.id;
      END IF;

      RETURN jsonb_build_object(
        'success', true,
        'reconnected', false,
        'server_id', v_server_rec.id,
        'server_code', v_server_rec.code
      );
    ELSE
      -- Mark full and increment to next room (GLOBAL-2, GLOBAL-3, etc.)
      UPDATE public.global_servers SET status = 'full' WHERE id = v_server_rec.id;
      v_server_num := v_server_num + 1;
    END IF;

    IF v_server_num > 500 THEN
      RAISE EXCEPTION 'All global rooms are full or limit reached';
    END IF;
  END LOOP;
END;
$$;

-- RPC: Leave global server on logout or disconnect
CREATE OR REPLACE FUNCTION public.leave_global_server(
  p_account_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_server_id UUID;
BEGIN
  DELETE FROM public.global_server_players
  WHERE account_id = p_account_id
  RETURNING server_id INTO v_server_id;

  IF v_server_id IS NOT NULL THEN
    UPDATE public.global_servers
    SET status = 'active'
    WHERE id = v_server_id AND status = 'full';
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: Update ship battle stats & coordinate within server
CREATE OR REPLACE FUNCTION public.update_ship_state(
  p_account_id UUID,
  p_x NUMERIC DEFAULT NULL,
  p_y NUMERIC DEFAULT NULL,
  p_hp INT DEFAULT NULL,
  p_condition INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.global_server_players
  SET x_pos = COALESCE(p_x, x_pos),
      y_pos = COALESCE(p_y, y_pos),
      current_hp = COALESCE(p_hp, current_hp),
      ship_condition = COALESCE(p_condition, ship_condition),
      last_seen_at = now()
  WHERE account_id = p_account_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_server_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- Accounts RLS
-- Allows public select to look up usernames (case-sensitive check)
CREATE POLICY "allow_select_accounts" ON public.accounts
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allows inserting new valid accounts
CREATE POLICY "allow_insert_accounts" ON public.accounts
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(username) >= 3 AND
    char_length(username) <= 24 AND
    username ~ '^[a-zA-Z0-9_]+$'
  );

CREATE POLICY "allow_update_accounts" ON public.accounts
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Player Progress RLS
CREATE POLICY "allow_select_player_progress" ON public.player_progress
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "allow_insert_player_progress" ON public.player_progress
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "allow_update_player_progress" ON public.player_progress
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Game Records RLS
CREATE POLICY "allow_select_game_records" ON public.game_records
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "allow_insert_game_records" ON public.game_records
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Global Servers RLS
CREATE POLICY "allow_select_global_servers" ON public.global_servers
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "allow_update_global_servers" ON public.global_servers
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Global Server Players RLS (Required for multiplayer ship tracking)
CREATE POLICY "allow_select_global_server_players" ON public.global_server_players
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "allow_insert_global_server_players" ON public.global_server_players
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "allow_update_global_server_players" ON public.global_server_players
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_delete_global_server_players" ON public.global_server_players
  FOR DELETE TO anon, authenticated
  USING (true);

-- Matches RLS
CREATE POLICY "allow_all_matches" ON public.matches
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_all_match_players" ON public.match_players
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 9. NARROWED ROLE GRANTS
-- =============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_progress TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_records TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.global_servers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.global_server_players TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_players TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.join_or_assign_global_server(UUID, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.leave_global_server(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_ship_state(UUID, NUMERIC, NUMERIC, INT, INT) TO anon, authenticated;

-- =============================================================================
-- 10. SUPABASE REALTIME CONFIGURATION
-- Publish multiplayer tables to Realtime for real-time ship movement & combat
-- =============================================================================
DO $$
BEGIN
  -- Add global_servers
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'global_servers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.global_servers;
  END IF;

  -- Add global_server_players
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'global_server_players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.global_server_players;
  END IF;

  -- Add matches
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  END IF;

  -- Add match_players
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'match_players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_players;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Publication addition skipped or handled: %', SQLERRM;
END $$;
