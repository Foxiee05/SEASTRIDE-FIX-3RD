import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Configuration constants
export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  'https://sgjcjojycwnrnnjjfvnq.supabase.co';

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  '';

// Check if credentials have been provided
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
    SUPABASE_ANON_KEY.length > 20
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return clientInstance;
};

// Account validation rules: 3–24 characters; letters, numbers, and underscores only
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  const trimmed = username.trim();
  if (!trimmed) {
    return { valid: false, error: 'Username cannot be empty.' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long.' };
  }
  if (trimmed.length > 24) {
    return { valid: false, error: 'Username must be at most 24 characters long.' };
  }
  const regex = /^[a-zA-Z0-9_]+$/;
  if (!regex.test(trimmed)) {
    return { valid: false, error: 'Username may only contain letters, numbers, and underscores (_).' };
  }
  return { valid: true };
};

export interface DbAccount {
  id: string;
  username: string;
  created_at: string;
  last_seen_at: string;
}

export interface DbPlayerProgress {
  id?: string;
  account_id: string;
  coins: number;
  gems: number;
  energy: number;
  max_energy: number;
  player_level: number;
  player_xp: number;
  ship_level: number;
  ship_condition: number;
  ship_current_hp: number;
  ship_max_hp: number;
  avatar_url: string;
  about_me: string;
  owned_cannons: any[];
  equipped_cannons: string[];
  owned_shields: any[];
  equipped_shield: string | null;
  owned_decorations: string[];
  equipped_decorations: string[];
  total_steps_today: number;
  step_records: any[];
  daily_coins_history: any[];
  quest_index: number;
  quest_xp: number;
  claimed_quests: string[];
  updated_at?: string;
}

export interface DbGlobalServerPlayer {
  id: string;
  server_id: string;
  account_id: string;
  username: string;
  ship_level: number;
  ship_condition: number;
  current_hp: number;
  max_hp: number;
  cannon_level: number;
  cannon_count: number;
  shield_level: number;
  avatar_url: string;
  x_pos: number;
  y_pos: number;
  is_online: boolean;
  last_seen_at: string;
}

// Local Storage Fallback Key Prefix (for offline demo mode when keys are not yet added)
const LOCAL_ACCOUNTS_KEY = 'seastride_demo_accounts';
const LOCAL_PROGRESS_PREFIX = 'seastride_demo_progress_';
const LOCAL_RECORDS_PREFIX = 'seastride_demo_records_';
const LOCAL_SERVER_PLAYERS_PREFIX = 'seastride_demo_server_players_';

// -------------------------------------------------------------
// Database Service APIs
// -------------------------------------------------------------

/**
 * Creates a new account in Supabase (or local fallback), checking for unique case-sensitive name.
 */
export const createAccount = async (username: string): Promise<{ account: DbAccount; progress: DbPlayerProgress }> => {
  const check = validateUsername(username);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const supabase = getSupabase();

  if (supabase) {
    // 1. Check for exact case-sensitive username collision
    const { data: existing, error: findError } = await supabase
      .from('accounts')
      .select('id, username')
      .eq('username', username)
      .maybeSingle();

    if (findError) {
      console.error('Error checking username:', findError);
      throw new Error(`Database error: ${findError.message}`);
    }

    if (existing) {
      throw new Error(`The username "${username}" is already taken. Please choose another.`);
    }

    // 2. Insert new account
    const { data: newAccount, error: createError } = await supabase
      .from('accounts')
      .insert([{ username }])
      .select('id, username, created_at, last_seen_at')
      .single();

    if (createError || !newAccount) {
      throw new Error(`Failed to create account: ${createError?.message || 'Unknown error'}`);
    }

    // 3. Initialize fresh empty player progress
    const initialProgress: DbPlayerProgress = {
      account_id: newAccount.id,
      coins: 1250,
      gems: 20,
      energy: 5,
      max_energy: 5,
      player_level: 1,
      player_xp: 250,
      ship_level: 1,
      ship_condition: 75,
      ship_current_hp: 3750,
      ship_max_hp: 5000,
      avatar_url: '',
      about_me: 'Sailing the Seven Seas!',
      owned_cannons: [{ id: 'c_1', level: 1 }],
      equipped_cannons: ['c_1'],
      owned_shields: [],
      equipped_shield: null,
      owned_decorations: ['dec_jolly_roger'],
      equipped_decorations: ['dec_jolly_roger'],
      total_steps_today: 0,
      step_records: [],
      daily_coins_history: [],
      quest_index: 0,
      quest_xp: 0,
      claimed_quests: [],
    };

    const { data: insertedProgress, error: progressError } = await supabase
      .from('player_progress')
      .insert([initialProgress])
      .select('*')
      .single();

    if (progressError) {
      console.warn('Progress initialization error:', progressError);
    }

    return {
      account: newAccount,
      progress: insertedProgress || initialProgress,
    };
  } else {
    // Local demo storage fallback
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    const accounts: DbAccount[] = raw ? JSON.parse(raw) : [];

    // Case-sensitive check
    if (accounts.some(a => a.username === username)) {
      throw new Error(`The username "${username}" is already taken. Please choose another.`);
    }

    const newAccount: DbAccount = {
      id: `local_acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      username,
      created_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    };

    accounts.push(newAccount);
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));

    const initialProgress: DbPlayerProgress = {
      account_id: newAccount.id,
      coins: 1250,
      gems: 20,
      energy: 5,
      max_energy: 5,
      player_level: 1,
      player_xp: 250,
      ship_level: 1,
      ship_condition: 75,
      ship_current_hp: 3750,
      ship_max_hp: 5000,
      avatar_url: '',
      about_me: 'Sailing the Seven Seas!',
      owned_cannons: [{ id: 'c_1', level: 1 }],
      equipped_cannons: ['c_1'],
      owned_shields: [],
      equipped_shield: null,
      owned_decorations: ['dec_jolly_roger'],
      equipped_decorations: ['dec_jolly_roger'],
      total_steps_today: 0,
      step_records: [],
      daily_coins_history: [],
      quest_index: 0,
      quest_xp: 0,
      claimed_quests: [],
    };

    localStorage.setItem(`${LOCAL_PROGRESS_PREFIX}${newAccount.id}`, JSON.stringify(initialProgress));

    return {
      account: newAccount,
      progress: initialProgress,
    };
  }
};

/**
 * Loads an existing account case-sensitively by username and retrieves saved progress.
 */
export const getAccountByUsername = async (
  username: string
): Promise<{ account: DbAccount; progress: DbPlayerProgress | null; records: any[] }> => {
  const check = validateUsername(username);
  if (!check.valid) {
    throw new Error(check.error);
  }

  const supabase = getSupabase();

  if (supabase) {
    // Exact case-sensitive match
    const { data: account, error: accError } = await supabase
      .from('accounts')
      .select('id, username, created_at, last_seen_at')
      .eq('username', username)
      .maybeSingle();

    if (accError) {
      throw new Error(`Database error: ${accError.message}`);
    }

    if (!account) {
      throw new Error(`Account "${username}" was not found. Please check spelling or create a new account.`);
    }

    // Touch last_seen_at
    await supabase.from('accounts').update({ last_seen_at: new Date().toISOString() }).eq('id', account.id);

    // Fetch progress
    const { data: progress } = await supabase
      .from('player_progress')
      .select('*')
      .eq('account_id', account.id)
      .maybeSingle();

    // Fetch game records
    const { data: records } = await supabase
      .from('game_records')
      .select('*')
      .eq('account_id', account.id)
      .order('created_at', { ascending: false })
      .limit(30);

    return {
      account,
      progress: progress || null,
      records: records || [],
    };
  } else {
    // Local demo storage fallback
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    const accounts: DbAccount[] = raw ? JSON.parse(raw) : [];

    const account = accounts.find(a => a.username === username);
    if (!account) {
      throw new Error(`Account "${username}" was not found. Please check spelling or create a new account.`);
    }

    const progressRaw = localStorage.getItem(`${LOCAL_PROGRESS_PREFIX}${account.id}`);
    const progress: DbPlayerProgress | null = progressRaw ? JSON.parse(progressRaw) : null;

    const recordsRaw = localStorage.getItem(`${LOCAL_RECORDS_PREFIX}${account.id}`);
    const records = recordsRaw ? JSON.parse(recordsRaw) : [];

    return {
      account,
      progress,
      records,
    };
  }
};

/**
 * Persists updated player progress to Supabase
 */
export const savePlayerProgress = async (
  accountId: string,
  progressData: Partial<DbPlayerProgress>
): Promise<void> => {
  const supabase = getSupabase();

  if (supabase) {
    const { error } = await supabase
      .from('player_progress')
      .upsert({
        account_id: accountId,
        ...progressData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'account_id' });

    if (error) {
      console.error('Failed to save player progress:', error);
    }
  } else {
    // Local fallback
    try {
      const existingRaw = localStorage.getItem(`${LOCAL_PROGRESS_PREFIX}${accountId}`);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      const merged = { ...existing, ...progressData, account_id: accountId, updated_at: new Date().toISOString() };
      localStorage.setItem(`${LOCAL_PROGRESS_PREFIX}${accountId}`, JSON.stringify(merged));
    } catch (e) {
      console.error('Error saving local progress:', e);
    }
  }
};

/**
 * Appends a persistent game record (raid, battle, step reward)
 */
export const addGameRecord = async (
  accountId: string,
  recordType: string,
  details: Record<string, any>
): Promise<void> => {
  const supabase = getSupabase();

  if (supabase) {
    const { error } = await supabase.from('game_records').insert([
      {
        account_id: accountId,
        record_type: recordType,
        details,
      },
    ]);

    if (error) {
      console.error('Failed to add game record:', error);
    }
  } else {
    try {
      const existingRaw = localStorage.getItem(`${LOCAL_RECORDS_PREFIX}${accountId}`);
      const records = existingRaw ? JSON.parse(existingRaw) : [];
      records.unshift({
        id: `rec_${Date.now()}`,
        account_id: accountId,
        record_type: recordType,
        details,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(`${LOCAL_RECORDS_PREFIX}${accountId}`, JSON.stringify(records.slice(0, 50)));
    } catch (e) {
      console.error('Error adding local game record:', e);
    }
  }
};

/**
 * RPC: Join or automatically assign to GLOBAL-1 (up to 30 ships), then GLOBAL-2, GLOBAL-3, etc.
 */
export const joinOrAssignGlobalServer = async (
  accountId: string,
  username: string,
  shipStats: {
    ship_level: number;
    ship_condition: number;
    current_hp: number;
    max_hp: number;
    cannon_level: number;
    cannon_count: number;
    shield_level: number;
    avatar_url: string;
  }
): Promise<{ success: boolean; server_code: string; server_id: string; reconnected?: boolean }> => {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase.rpc('join_or_assign_global_server', {
      p_account_id: accountId,
      p_username: username,
      p_ship_stats: shipStats,
    });

    if (error) {
      console.error('Error in join_or_assign_global_server RPC:', error);
      throw new Error(`Server assignment error: ${error.message}`);
    }

    return data as { success: boolean; server_code: string; server_id: string; reconnected?: boolean };
  } else {
    // Local demo allocation (simulates sequential rooms of 30)
    try {
      const raw = localStorage.getItem(`${LOCAL_SERVER_PLAYERS_PREFIX}local_server_global_1`);
      const existing: DbGlobalServerPlayer[] = raw ? JSON.parse(raw) : [];
      const idx = existing.findIndex(p => p.account_id === accountId);
      const playerItem: DbGlobalServerPlayer = {
        id: `local_p_${accountId}`,
        server_id: 'local_server_global_1',
        account_id: accountId,
        username,
        ship_level: shipStats.ship_level,
        ship_condition: shipStats.ship_condition,
        current_hp: shipStats.current_hp,
        max_hp: shipStats.max_hp,
        cannon_level: shipStats.cannon_level,
        cannon_count: shipStats.cannon_count,
        shield_level: shipStats.shield_level,
        avatar_url: shipStats.avatar_url,
        x_pos: 25,
        y_pos: 25,
        is_online: true,
        last_seen_at: new Date().toISOString(),
      };
      if (idx >= 0) {
        existing[idx] = playerItem;
      } else {
        existing.push(playerItem);
      }
      localStorage.setItem(`${LOCAL_SERVER_PLAYERS_PREFIX}local_server_global_1`, JSON.stringify(existing));
    } catch (e) {}

    return {
      success: true,
      server_code: 'GLOBAL-1',
      server_id: 'local_server_global_1',
      reconnected: false,
    };
  }
};

/**
 * RPC: Leave current server on logout or disconnect
 */
export const leaveGlobalServer = async (accountId: string): Promise<void> => {
  const supabase = getSupabase();

  if (supabase) {
    const { error } = await supabase.rpc('leave_global_server', {
      p_account_id: accountId,
    });
    if (error) {
      console.warn('Error in leave_global_server RPC:', error);
    }
  }
};

/**
 * RPC + Table update: Update ship battle condition, position, and upgraded stats
 */
export const updateShipState = async (
  accountId: string,
  params: {
    x?: number;
    y?: number;
    hp?: number;
    condition?: number;
    ship_level?: number;
    max_hp?: number;
    cannon_level?: number;
    cannon_count?: number;
    shield_level?: number;
    avatar_url?: string;
  }
): Promise<void> => {
  const supabase = getSupabase();

  if (supabase) {
    try {
      await supabase.rpc('update_ship_state', {
        p_account_id: accountId,
        p_x: params.x,
        p_y: params.y,
        p_hp: params.hp,
        p_condition: params.condition,
      });
    } catch (e) {
      console.warn('RPC update_ship_state warning:', e);
    }

    // Directly update global_server_players table so all ship upgrades and battle condition are reflected in real-time
    const updateData: Record<string, any> = {
      last_seen_at: new Date().toISOString(),
    };
    if (params.hp !== undefined) updateData.current_hp = params.hp;
    if (params.condition !== undefined) updateData.ship_condition = params.condition;
    if (params.ship_level !== undefined) updateData.ship_level = params.ship_level;
    if (params.max_hp !== undefined) updateData.max_hp = params.max_hp;
    if (params.cannon_level !== undefined) updateData.cannon_level = params.cannon_level;
    if (params.cannon_count !== undefined) updateData.cannon_count = params.cannon_count;
    if (params.shield_level !== undefined) updateData.shield_level = params.shield_level;
    if (params.avatar_url !== undefined) updateData.avatar_url = params.avatar_url;
    if (params.x !== undefined) updateData.x_pos = params.x;
    if (params.y !== undefined) updateData.y_pos = params.y;

    const { error } = await supabase
      .from('global_server_players')
      .update(updateData)
      .eq('account_id', accountId);

    if (error) {
      console.warn('Error updating global_server_players table:', error);
    }
  } else {
    // Local demo mode: update local server player record
    try {
      const raw = localStorage.getItem(`${LOCAL_SERVER_PLAYERS_PREFIX}local_server_global_1`);
      if (raw) {
        const players: DbGlobalServerPlayer[] = JSON.parse(raw);
        const idx = players.findIndex(p => p.account_id === accountId);
        if (idx !== -1) {
          if (params.hp !== undefined) players[idx].current_hp = params.hp;
          if (params.condition !== undefined) players[idx].ship_condition = params.condition;
          if (params.ship_level !== undefined) players[idx].ship_level = params.ship_level;
          if (params.max_hp !== undefined) players[idx].max_hp = params.max_hp;
          if (params.cannon_level !== undefined) players[idx].cannon_level = params.cannon_level;
          if (params.cannon_count !== undefined) players[idx].cannon_count = params.cannon_count;
          if (params.shield_level !== undefined) players[idx].shield_level = params.shield_level;
          if (params.avatar_url !== undefined) players[idx].avatar_url = params.avatar_url;
          players[idx].last_seen_at = new Date().toISOString();
          localStorage.setItem(`${LOCAL_SERVER_PLAYERS_PREFIX}local_server_global_1`, JSON.stringify(players));
        }
      }
    } catch (e) {
      console.warn('Local update error:', e);
    }
  }
};

/**
 * Fetches current players in a given server, merging latest authoritative progress from player_progress
 */
export const fetchServerPlayers = async (serverId: string): Promise<DbGlobalServerPlayer[]> => {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from('global_server_players')
      .select('*')
      .eq('server_id', serverId)
      .eq('is_online', true)
      .order('last_seen_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error fetching server players:', error);
      return [];
    }

    const serverPlayers: DbGlobalServerPlayer[] = data || [];
    if (serverPlayers.length > 0) {
      // Query player_progress table to get the true, most up-to-date ship level, cannons, shields, HP!
      const accountIds = serverPlayers.map(p => p.account_id);
      try {
        const { data: progressRows } = await supabase
          .from('player_progress')
          .select('*')
          .in('account_id', accountIds);

        if (progressRows && progressRows.length > 0) {
          const pMap = new Map(progressRows.map(pr => [pr.account_id, pr]));
          return serverPlayers.map(sp => {
            const pr = pMap.get(sp.account_id);
            if (!pr) return sp;

            const shipLevel = Number(pr.ship_level) || sp.ship_level || 1;
            const maxHp = Number(pr.ship_max_hp) || (5000 + (shipLevel - 1) * 5000);
            const condition = pr.ship_condition !== undefined ? Number(pr.ship_condition) : sp.ship_condition;
            const currentHp = pr.ship_current_hp !== undefined ? Number(pr.ship_current_hp) : Math.round(maxHp * (condition / 100));

            // Calculate exact highest cannon level
            let maxCannonLvl = sp.cannon_level || 1;
            if (Array.isArray(pr.owned_cannons) && pr.owned_cannons.length > 0) {
              maxCannonLvl = Math.max(...pr.owned_cannons.map((c: any) => Number(c.level) || 1));
            }
            const cannonCount = Array.isArray(pr.equipped_cannons) ? pr.equipped_cannons.length : (sp.cannon_count || 1);

            // Calculate exact shield level
            let shieldLvl = sp.shield_level || 0;
            if (pr.equipped_shield && Array.isArray(pr.owned_shields)) {
              const sObj = pr.owned_shields.find((s: any) => s.id === pr.equipped_shield);
              if (sObj) shieldLvl = Number(sObj.level) || 1;
            }

            return {
              ...sp,
              ship_level: shipLevel,
              max_hp: maxHp,
              current_hp: currentHp,
              ship_condition: condition,
              cannon_level: maxCannonLvl,
              cannon_count: Math.max(1, cannonCount),
              shield_level: shieldLvl,
              avatar_url: pr.avatar_url || sp.avatar_url,
            };
          });
        }
      } catch (e) {
        console.warn('Error fetching player_progress join:', e);
      }
    }

    return serverPlayers;
  }

  // Local demo fallback: load all accounts and their progress from localStorage
  try {
    const rawAccs = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (!rawAccs) return [];
    const accounts: DbAccount[] = JSON.parse(rawAccs);
    const result: DbGlobalServerPlayer[] = [];

    for (const acc of accounts) {
      const pRaw = localStorage.getItem(`${LOCAL_PROGRESS_PREFIX}${acc.id}`);
      const pr: Partial<DbPlayerProgress> = pRaw ? JSON.parse(pRaw) : {};
      const shipLevel = Number(pr.ship_level) || 1;
      const maxHp = Number(pr.ship_max_hp) || (5000 + (shipLevel - 1) * 5000);
      const condition = pr.ship_condition !== undefined ? Number(pr.ship_condition) : 75;
      const currentHp = pr.ship_current_hp !== undefined ? Number(pr.ship_current_hp) : Math.round(maxHp * (condition / 100));

      let maxCannonLvl = 1;
      if (Array.isArray(pr.owned_cannons) && pr.owned_cannons.length > 0) {
        maxCannonLvl = Math.max(...pr.owned_cannons.map((c: any) => Number(c.level) || 1));
      }
      const cannonCount = Array.isArray(pr.equipped_cannons) ? pr.equipped_cannons.length : 1;

      let shieldLvl = 0;
      if (pr.equipped_shield && Array.isArray(pr.owned_shields)) {
        const sObj = pr.owned_shields.find((s: any) => s.id === pr.equipped_shield);
        if (sObj) shieldLvl = Number(sObj.level) || 1;
      }

      result.push({
        id: `local_player_${acc.id}`,
        server_id: serverId || 'local_server_global_1',
        account_id: acc.id,
        username: acc.username,
        ship_level: shipLevel,
        ship_condition: condition,
        current_hp: currentHp,
        max_hp: maxHp,
        cannon_level: maxCannonLvl,
        cannon_count: Math.max(1, cannonCount),
        shield_level: shieldLvl,
        avatar_url: pr.avatar_url || '',
        x_pos: 20,
        y_pos: 20,
        is_online: true,
        last_seen_at: new Date().toISOString(),
      });
    }

    return result;
  } catch (e) {
    console.error('Error fetching local server players:', e);
    return [];
  }
};

/**
 * Subscribes to Realtime updates for players in the given server
 */
export const subscribeToServerPlayers = (
  serverId: string,
  onPlayerChange: (payload: any) => void
): { unsubscribe: () => void } => {
  const supabase = getSupabase();

  if (!supabase || !serverId) {
    return { unsubscribe: () => {} };
  }

  const channel: RealtimeChannel = supabase
    .channel(`server_players:${serverId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'global_server_players',
        filter: `server_id=eq.${serverId}`,
      },
      (payload) => {
        onPlayerChange(payload);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Connected to server room
      }
    });

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
};
