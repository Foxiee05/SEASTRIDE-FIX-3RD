# SeaStride Supabase Migration Guide

## Migration File
`supabase/migrations/20260912_seastride_account_multiplayer.sql`

### Purpose
1. **Name-Only Demo Account System**:
   - `accounts`: Stores unique, case-sensitive usernames (3–24 characters: letters, numbers, and underscores).
   - Intentionally passwordless, demo/educational system without email or Supabase Auth.
2. **Player Progress & Historical Records**:
   - `player_progress`: Isolated game state per account (gold, gems, energy, ship stats, cannons, shields, decorations, quest progression).
   - `game_records`: Historical battle logs, raid logs, and step tracking linked to the player's account.
3. **Multiplayer Global Servers (30 Ships Max per Room)**:
   - `global_servers`: Identifies rooms (`GLOBAL-1`, `GLOBAL-2`, etc.), capacity (30), and server state.
   - `global_server_players`: Real-time ships currently deployed in the room.
   - `matches` & `match_players`: Multiplayer battle state.
4. **Atomic Server Allocation RPC**:
   - `join_or_assign_global_server()`: Transaction-safe row locking (`FOR UPDATE`) automatically fills `GLOBAL-1` up to 30 ships, then sequentially creates/allocates `GLOBAL-2`, `GLOBAL-3`, etc., preventing race conditions.
   - `leave_global_server()`: Safely unregisters ships when logging out or disconnecting.
   - `update_ship_state()`: Broadcasts real-time ship position and HP updates.
5. **Supabase Realtime Replication**:
   - Adds multiplayer tables (`global_servers`, `global_server_players`, `matches`, `match_players`) to the `supabase_realtime` publication.

### Security & Risk Analysis
- **Demo Account Model**: Anyone who knows an account's exact username can access it. This is explicitly labeled in the UI as a public demo account system.
- **Narrowly Scoped**: No tables in the public schema are dropped or truncated. All `CREATE TABLE` statements use `IF NOT EXISTS`, and foreign keys use `ON DELETE CASCADE`.
- **Idempotent**: Realtime publication changes check for table existence before adding.

### Instructions to Execute in Supabase
1. Open your Supabase Dashboard: [https://supabase.com/dashboard/project/sgjcjojycwnrnnjjfvnq](https://supabase.com/dashboard/project/sgjcjojycwnrnnjjfvnq)
2. In the left navigation, click on **SQL Editor**.
3. Click **New query**.
4. Paste the entire contents of `supabase/migrations/20260912_seastride_account_multiplayer.sql`.
5. Click **Run** (or `Cmd/Ctrl + Enter`).
6. Confirm the tables, policies, functions, and Realtime publications appear under **Database** and **Table Editor**.
