import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { ServerInfo, ServerType } from '../types';
import { PIRATE_AVATARS } from '../assets';

// Configuration constants
export const getSupabaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('seastride_supabase_url');
    if (custom && custom.trim().startsWith('http')) return custom.trim();
  }
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta.env as any)?.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta.env as any)?.SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
    'https://sgjcjojycwnrnnjjfvnq.supabase.co'
  );
};

export const getSupabaseAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('seastride_supabase_anon_key');
    if (custom && custom.trim().length > 20) return custom.trim();
  }
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta.env as any)?.VITE_SUPABASE_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta.env as any)?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta.env as any)?.SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta.env as any)?.SUPABASE_KEY) ||
    (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
    ''
  );
};

export const SUPABASE_URL = getSupabaseUrl();
export const SUPABASE_ANON_KEY = getSupabaseAnonKey();

// Check if credentials have been provided
export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    key !== 'YOUR_SUPABASE_ANON_KEY' &&
    key.length > 20
  );
};

let clientInstance: SupabaseClient | null = null;
let currentClientKey = '';

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const signature = `${url}::${key}`;

  if (!clientInstance || currentClientKey !== signature) {
    currentClientKey = signature;
    clientInstance = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return clientInstance;
};

export const setCustomSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('seastride_supabase_url', url.trim());
    } else {
      localStorage.removeItem('seastride_supabase_url');
    }
    if (key && key.trim()) {
      localStorage.setItem('seastride_supabase_anon_key', key.trim());
    } else {
      localStorage.removeItem('seastride_supabase_anon_key');
    }
    clientInstance = null;
    currentClientKey = '';
  }
};

export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  serversCount?: number;
  playersCount?: number;
  accountsCount?: number;
  url: string;
}> => {
  const url = getSupabaseUrl();
  const configured = isSupabaseConfigured();
  if (!configured) {
    return {
      success: false,
      message: 'Supabase Anon Key is missing or empty in browser environment (VITE_SUPABASE_ANON_KEY).',
      url,
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Failed to initialize Supabase client instance.',
      url,
    };
  }

  try {
    const { data: servers, error: serverErr } = await supabase
      .from('global_servers')
      .select('id, code, name')
      .limit(10);

    if (serverErr) {
      return {
        success: false,
        message: `Database query error: ${serverErr.message || JSON.stringify(serverErr)}`,
        url,
      };
    }

    const { count: playerCount, error: playerErr } = await supabase
      .from('global_server_players')
      .select('*', { count: 'exact', head: true });

    const { count: accCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true });

    return {
      success: true,
      message: `Connected successfully! Found ${servers?.length || 0} server rooms, ${playerCount ?? 0} active ships, and ${accCount ?? 0} accounts in database.`,
      serversCount: servers?.length || 0,
      playersCount: playerCount ?? 0,
      accountsCount: accCount ?? 0,
      url,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection failed: ${err?.message || 'Network error'}`,
      url,
    };
  }
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
  last_server_code?: string;
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
  equipped_decorations?: string[];
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
const LOCAL_SERVER_PLAYERS_KEY = 'seastride_demo_all_server_players';

/**
 * Helper to retrieve local server players array
 */
export const getLocalServerPlayers = (sId: string): DbGlobalServerPlayer[] => {
  const serverKey = `${LOCAL_SERVER_PLAYERS_PREFIX}${sId}`;
  try {
    const rawPlayers = localStorage.getItem(serverKey);
    let assignedPlayers: DbGlobalServerPlayer[] = rawPlayers ? JSON.parse(rawPlayers) : [];

    // Filter out any legacy seed/mock players if present
    const cleanPlayers = assignedPlayers.filter(
      (p) => !p.account_id.startsWith('seed_') && !p.id.startsWith('seed_')
    );

    if (cleanPlayers.length !== assignedPlayers.length) {
      try {
        localStorage.setItem(serverKey, JSON.stringify(cleanPlayers));
      } catch (e) {}
    }

    return cleanPlayers;
  } catch (e) {
    return [];
  }
};

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
      player_xp: 0,
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
      player_xp: 0,
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

    // Touch last_seen_at asynchronously without blocking the user
    supabase.from('accounts').update({ last_seen_at: new Date().toISOString() }).eq('id', account.id).then();

    // Fetch progress and game records in parallel for instant loading
    const [progressResult, recordsResult] = await Promise.all([
      supabase
        .from('player_progress')
        .select('*')
        .eq('account_id', account.id)
        .maybeSingle(),
      supabase
        .from('game_records')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    return {
      account,
      progress: progressResult.data || null,
      records: recordsResult.data || [],
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
    let progress: DbPlayerProgress | null = progressRaw ? JSON.parse(progressRaw) : null;

    if (progress) {
      if (!progress.last_server_code) {
        // Look up which local server contains this account
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith(LOCAL_SERVER_PLAYERS_PREFIX));
        for (const key of allKeys) {
          const r = localStorage.getItem(key);
          if (r) {
            try {
              const list: DbGlobalServerPlayer[] = JSON.parse(r);
              if (list.some(p => p.account_id === account.id)) {
                const sId = key.replace(LOCAL_SERVER_PLAYERS_PREFIX, '');
                if (sId.includes('global_2')) progress.last_server_code = 'GLOBAL-2';
                else if (sId.includes('global_1')) progress.last_server_code = 'GLOBAL-1';
                else if (sId.includes('priv_')) {
                  const match = sId.match(/priv_(\d+)/i);
                  if (match) progress.last_server_code = `PRIV-${match[1]}`;
                }
              }
            } catch (e) {}
          }
        }
      }
    }

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

export const applyDamageToPlayer = async (accountId: string, newHp: number, newCondition: number): Promise<void> => {
  const supabase = getSupabase();
  if (supabase) {
    await Promise.all([
      supabase.from('player_progress').update({
        ship_current_hp: newHp,
        ship_condition: newCondition,
      }).eq('account_id', accountId),
      supabase.from('global_server_players').update({
        current_hp: newHp,
        ship_condition: newCondition,
        last_seen_at: new Date().toISOString(),
      }).eq('account_id', accountId),
    ]);
  } else {
    try {
      const raw = localStorage.getItem(`${LOCAL_PROGRESS_PREFIX}${accountId}`);
      if (raw) {
        const progress = JSON.parse(raw);
        progress.ship_current_hp = newHp;
        progress.ship_condition = newCondition;
        localStorage.setItem(`${LOCAL_PROGRESS_PREFIX}${accountId}`, JSON.stringify(progress));
      }
    } catch (e) {}
  }
};

export const savePlayerProgress = async (
  accountId: string,
  progressData: Partial<DbPlayerProgress>
): Promise<void> => {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data: updated, error: updateErr } = await supabase
        .from('player_progress')
        .update({
          ...progressData,
          updated_at: new Date().toISOString(),
        })
        .eq('account_id', accountId)
        .select('account_id');

      if (!updateErr && (!updated || updated.length === 0)) {
        await supabase
          .from('player_progress')
          .insert({
            account_id: accountId,
            ...progressData,
            updated_at: new Date().toISOString(),
          });
      }
    } catch (error) {
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
      const rawRecords = existingRaw ? JSON.parse(existingRaw) : [];
      const now = Date.now();
      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
      const validRecords = rawRecords.filter((r: any) => {
        const time = r.created_at ? new Date(r.created_at).getTime() : 0;
        return !time || (now - time < THREE_DAYS_MS);
      });
      validRecords.unshift({
        id: `rec_${Date.now()}`,
        account_id: accountId,
        record_type: recordType,
        details,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(`${LOCAL_RECORDS_PREFIX}${accountId}`, JSON.stringify(validRecords.slice(0, 50)));
    } catch (e) {
      console.error('Error adding local game record:', e);
    }
  }
};

/**
 * Normalizes a server code to uppercase, trimmed format (e.g. "GLOBAL-1", "PRIV-123")
 */
export const normalizeServerCode = (code: string): string => {
  if (!code) return 'GLOBAL-1';
  const trimmed = code.trim().toUpperCase();
  if (/^GLOBAL[\s_-]?(\d+)$/i.test(trimmed)) {
    const match = trimmed.match(/^GLOBAL[\s_-]?(\d+)$/i);
    return `GLOBAL-${match ? match[1] : '1'}`;
  }
  return trimmed;
};

/**
 * Returns a deterministic, stable canonical UUID for any server code.
 * Ensures GLOBAL-1 always maps to '00000000-0000-0000-0001-000000000001', etc.
 */
// Cache in-memory to prevent repeated redundant queries for canonical servers
const canonicalServerCache = new Map<string, { id: string; code: string; name: string; type: 'global' | 'private'; capacity: number }>();

/**
 * Retrieves a server by code, or inserts it safely without forcing an ID.
 * Caches in memory for zero-latency retrieval.
 */
export const getOrCreateCanonicalServer = async (
  rawCode: string,
  serverName?: string,
  serverType?: 'global' | 'private'
): Promise<{ id: string; code: string; name: string; type: 'global' | 'private'; capacity: number }> => {
  const code = normalizeServerCode(rawCode);
  const isPriv = code.startsWith('PRIV-');
  const type = serverType || (isPriv ? 'private' : 'global');
  const defaultName = serverName || (isPriv
    ? `Private Island (${code})`
    : `Global Fleet ${code.split('-')[1] || '1'}`);
  const capacity = 30;

  if (canonicalServerCache.has(code)) {
    const cached = canonicalServerCache.get(code)!;
    if (serverName && cached.name !== serverName) {
      cached.name = serverName;
    }
    return cached;
  }

  const supabase = getSupabase();
  if (!supabase) {
    const localObj = {
      id: `local_srv_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      code,
      name: defaultName,
      type,
      capacity,
    };
    canonicalServerCache.set(code, localObj);
    return localObj;
  }

  try {
    const { data: existing } = await supabase
      .from('global_servers')
      .select('id, code, name, type, capacity')
      .eq('code', code)
      .maybeSingle();

    if (existing && existing.id) {
      const serverObj = {
        id: existing.id,
        code: existing.code,
        name: existing.name || defaultName,
        type: (existing.type as 'global' | 'private') || type,
        capacity: existing.capacity || capacity,
      };
      canonicalServerCache.set(code, serverObj);
      return serverObj;
    }

    const { data: created } = await supabase
      .from('global_servers')
      .insert({
        code,
        name: defaultName,
        type,
        capacity,
        status: 'active',
      })
      .select('id, code, name, type, capacity')
      .maybeSingle();

    if (created && created.id) {
      const serverObj = {
        id: created.id,
        code: created.code,
        name: created.name || defaultName,
        type: created.type as 'global' | 'private',
        capacity: created.capacity || capacity,
      };
      canonicalServerCache.set(code, serverObj);
      return serverObj;
    }

    // In case another client created it simultaneously
    const { data: retry } = await supabase
      .from('global_servers')
      .select('id, code, name, type, capacity')
      .eq('code', code)
      .maybeSingle();

    if (retry && retry.id) {
      const serverObj = {
        id: retry.id,
        code: retry.code,
        name: retry.name || defaultName,
        type: retry.type as 'global' | 'private',
        capacity: retry.capacity || capacity,
      };
      canonicalServerCache.set(code, serverObj);
      return serverObj;
    }
  } catch (err) {
    console.error('getOrCreateCanonicalServer error:', err);
  }

  const fallback = {
    id: `srv_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    code,
    name: defaultName,
    type,
    capacity,
  };
  canonicalServerCache.set(code, fallback);
  return fallback;
};

/**
 * Direct & Immediate: Join a specific server code (e.g. GLOBAL-1, GLOBAL-2, or custom/private code).
 * Performs direct, resilient upsert into global_server_players without failing RPCs or fallback cascades.
 */
export const joinSpecificServer = async (
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
  },
  targetServerCode: string,
  customServerName?: string
): Promise<{
  success: boolean;
  server_code: string;
  server_id: string;
  server_name?: string;
  server_type?: 'global' | 'private';
  max_players?: number;
}> => {
  const normalizedCode = normalizeServerCode(targetServerCode);
  const canonical = await getOrCreateCanonicalServer(normalizedCode, customServerName);
  const supabase = getSupabase();

  if (supabase && canonical.id) {
    try {
      // 1. Check if player record already exists in global_server_players
      const { data: existingPlayer } = await supabase
        .from('global_server_players')
        .select('id')
        .eq('account_id', accountId)
        .maybeSingle();

      const playerData = {
        server_id: canonical.id,
        username,
        ship_level: shipStats.ship_level,
        ship_condition: shipStats.ship_condition,
        current_hp: shipStats.current_hp,
        max_hp: shipStats.max_hp,
        cannon_level: shipStats.cannon_level,
        cannon_count: shipStats.cannon_count,
        shield_level: shipStats.shield_level,
        avatar_url: shipStats.avatar_url,
        is_online: true,
        last_seen_at: new Date().toISOString(),
      };

      if (existingPlayer) {
        await supabase
          .from('global_server_players')
          .update(playerData)
          .eq('account_id', accountId);
      } else {
        await supabase
          .from('global_server_players')
          .insert({
            ...playerData,
            account_id: accountId,
            x_pos: 15.0 + Math.random() * 70.0,
            y_pos: 15.0 + Math.random() * 65.0,
          });
      }

      // 2. Non-blocking update of player_progress last_server_code
      supabase
        .from('player_progress')
        .update({ last_server_code: canonical.code })
        .eq('account_id', accountId)
        .then();

      return {
        success: true,
        server_code: canonical.code,
        server_id: canonical.id,
        server_name: canonical.name,
        server_type: canonical.type,
        max_players: canonical.capacity,
      };
    } catch (err) {
      console.warn('joinSpecificServer error:', err);
      return {
        success: true,
        server_code: canonical.code,
        server_id: canonical.id,
        server_name: canonical.name,
        server_type: canonical.type,
        max_players: canonical.capacity,
      };
    }
  } else {
    // Local demo mode
    const targetId = canonical.id;
    try {
      const allKeys = Object.keys(localStorage).filter((k) =>
        k.startsWith(LOCAL_SERVER_PLAYERS_PREFIX)
      );
      for (const key of allKeys) {
        if (key !== `${LOCAL_SERVER_PLAYERS_PREFIX}${targetId}`) {
          const sId = key.replace(LOCAL_SERVER_PLAYERS_PREFIX, '');
          const list: DbGlobalServerPlayer[] = getLocalServerPlayers(sId);
          const filtered = list.filter((p) => p.account_id !== accountId);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      }

      // Add to target server
      const targetKey = `${LOCAL_SERVER_PLAYERS_PREFIX}${targetId}`;
      const r = localStorage.getItem(targetKey);
      let list: DbGlobalServerPlayer[] = r ? JSON.parse(r) : [];
      list = list.filter((p) => p.account_id !== accountId);

      const playerItem: DbGlobalServerPlayer = {
        id: `local_p_${accountId}`,
        server_id: targetId,
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
      list.push(playerItem);
      localStorage.setItem(targetKey, JSON.stringify(list));

      // Also persist to local progress
      const pRaw = localStorage.getItem(`${LOCAL_PROGRESS_PREFIX}${accountId}`);
      if (pRaw) {
        const pr = JSON.parse(pRaw);
        pr.last_server_code = normalizedCode;
        localStorage.setItem(`${LOCAL_PROGRESS_PREFIX}${accountId}`, JSON.stringify(pr));
      }
    } catch (e) {
      console.warn('Local joinSpecificServer error:', e);
    }

    const isPriv = normalizedCode.startsWith('PRIV-');
    return {
      success: true,
      server_code: normalizedCode,
      server_id: targetId,
      server_name: isPriv
        ? `Private Island (${normalizedCode})`
        : `Global Fleet ${normalizedCode.split('-')[1] || normalizedCode}`,
      server_type: isPriv ? 'private' : 'global',
      max_players: 30,
    };
  }
};

/**
 * Fetches all available servers with their authoritative membership counts from global_server_players in a single fast parallel query.
 */
export const fetchAvailableServers = async (): Promise<ServerInfo[]> => {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const [serversRes, membershipRes] = await Promise.all([
        supabase
          .from('global_servers')
          .select('id, code, name, type, capacity')
          .order('created_at', { ascending: true }),
        supabase
          .from('global_server_players')
          .select('server_id, account_id'),
      ]);

      let serverRows = serversRes.data || [];
      const membershipRows = membershipRes.data || [];

      // If no servers exist at all, ensure GLOBAL-1 is created
      if (serverRows.length === 0) {
        const g1 = await getOrCreateCanonicalServer('GLOBAL-1');
        serverRows = [{
          id: g1.id,
          code: g1.code,
          name: g1.name,
          type: g1.type,
          capacity: g1.capacity,
        } as any];
      }

      // Populate in-memory cache for all servers
      serverRows.forEach(row => {
        if (row.code) {
          canonicalServerCache.set(normalizeServerCode(row.code), {
            id: row.id,
            code: row.code,
            name: row.name || row.code,
            type: (row.type as any) || 'global',
            capacity: row.capacity || 30,
          });
        }
      });

      const serverMembershipMap = new Map<string, Set<string>>();
      membershipRows.forEach((row: any) => {
        if (!row.server_id || !row.account_id) return;
        if (!serverMembershipMap.has(row.server_id)) {
          serverMembershipMap.set(row.server_id, new Set());
        }
        serverMembershipMap.get(row.server_id)!.add(row.account_id);
      });

      const result: ServerInfo[] = serverRows.map(row => {
        const uniqueAccounts = serverMembershipMap.get(row.id);
        const playerCount = uniqueAccounts ? uniqueAccounts.size : 0;
        
        return {
          code: row.code,
          name: row.name || row.code,
          type: (row.type as ServerType) || 'global',
          playerCount,
          maxPlayers: row.capacity || 30,
          players: [],
        };
      });

      result.sort((a, b) => {
        if (a.code === 'GLOBAL-1') return -1;
        if (b.code === 'GLOBAL-1') return 1;
        if (a.code === 'GLOBAL-2') return -1;
        if (b.code === 'GLOBAL-2') return 1;
        return a.code.localeCompare(b.code);
      });

      return result;
    } catch (e) {
      console.warn('Error fetching available servers from Supabase:', e);
    }
  }

  return [];
};

/**
 * Subscribes to Realtime membership changes across all servers to keep server list counts updated live.
 * Debounced to prevent thrashing.
 */
export const subscribeToAllServersMembership = (
  onMembershipChange: () => void
): { unsubscribe: () => void } => {
  const supabase = getSupabase();

  if (!supabase) {
    return { unsubscribe: () => {} };
  }

  let debounceTimer: any = null;
  const debouncedHandler = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onMembershipChange();
    }, 1500);
  };

  const channel: RealtimeChannel = supabase
    .channel('all_server_memberships_feed')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'global_server_players',
      },
      debouncedHandler
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'global_server_players',
      },
      debouncedHandler
    )
    .subscribe();

  return {
    unsubscribe: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    },
  };
};

/**
 * Join or automatically assign to GLOBAL-1 or player's existing server.
 * Operates immediately without RPC failures or slow sequential fallbacks.
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
    try {
      // 1. Check if user already has an assigned server in global_server_players
      const { data: existingPlayer } = await supabase
        .from('global_server_players')
        .select('server_id')
        .eq('account_id', accountId)
        .maybeSingle();

      let targetCode = 'GLOBAL-1';
      if (existingPlayer?.server_id) {
        for (const [code, srv] of canonicalServerCache.entries()) {
          if (srv.id === existingPlayer.server_id) {
            targetCode = code;
            break;
          }
        }
        if (targetCode === 'GLOBAL-1') {
          const { data: srv } = await supabase
            .from('global_servers')
            .select('code')
            .eq('id', existingPlayer.server_id)
            .maybeSingle();
          if (srv?.code) {
            targetCode = srv.code;
          }
        }
      }

      const res = await joinSpecificServer(accountId, username, shipStats, targetCode);
      return {
        success: res.success,
        server_code: res.server_code,
        server_id: res.server_id,
        reconnected: !!existingPlayer,
      };
    } catch (e) {
      console.warn('Error in joinOrAssignGlobalServer:', e);
      const canonical = await getOrCreateCanonicalServer('GLOBAL-1');
      return {
        success: true,
        server_code: 'GLOBAL-1',
        server_id: canonical.id,
        reconnected: false,
      };
    }
  } else {
    // Local demo allocation
    try {
      let targetServerCode = 'GLOBAL-1';
      const allKeys = Object.keys(localStorage).filter((k) =>
        k.startsWith(LOCAL_SERVER_PLAYERS_PREFIX)
      );
      let alreadyAssignedId: string | null = null;
      for (const k of allKeys) {
        const r = localStorage.getItem(k);
        if (r) {
          const list: DbGlobalServerPlayer[] = JSON.parse(r);
          if (list.some((p) => p.account_id === accountId)) {
            alreadyAssignedId = k.replace(LOCAL_SERVER_PLAYERS_PREFIX, '');
            break;
          }
        }
      }

      if (alreadyAssignedId) {
        targetServerCode = alreadyAssignedId.includes('global_2') ? 'GLOBAL-2' : 'GLOBAL-1';
      }

      const res = await joinSpecificServer(accountId, username, shipStats, targetServerCode);
      return {
        success: true,
        server_code: res.server_code,
        server_id: res.server_id,
        reconnected: !!alreadyAssignedId,
      };
    } catch (e) {
      console.error('Local joinOrAssignGlobalServer error:', e);
      const canonical = await getOrCreateCanonicalServer('GLOBAL-1');
      return {
        success: true,
        server_code: 'GLOBAL-1',
        server_id: canonical.id,
        reconnected: false,
      };
    }
  }
};

/**
 * Leave current server on logout or disconnect
 */
export const leaveGlobalServer = async (accountId: string): Promise<void> => {
  const supabase = getSupabase();

  if (supabase) {
    try {
      await supabase
        .from('global_server_players')
        .delete()
        .eq('account_id', accountId);
    } catch (err) {
      console.warn('leaveGlobalServer error:', err);
    }
  } else {
    try {
      const allKeys = Object.keys(localStorage).filter((k) =>
        k.startsWith(LOCAL_SERVER_PLAYERS_PREFIX)
      );
      for (const k of allKeys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const players: DbGlobalServerPlayer[] = JSON.parse(raw);
          const filtered = players.filter((p) => p.account_id !== accountId);
          localStorage.setItem(k, JSON.stringify(filtered));
        }
      }
    } catch (e) {}
  }
};

/**
 * Direct & fast: Update ship battle condition, position, and upgraded stats
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

    supabase
      .from('global_server_players')
      .update(updateData)
      .eq('account_id', accountId)
      .then();
  } else {
    // Local demo mode: update local server player record across all local servers
    try {
      const allKeys = Object.keys(localStorage).filter((k) =>
        k.startsWith(LOCAL_SERVER_PLAYERS_PREFIX)
      );
      for (const k of allKeys) {
        const raw = localStorage.getItem(k);
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
            if (params.x !== undefined) players[idx].x_pos = params.x;
            if (params.y !== undefined) players[idx].y_pos = params.y;
            players[idx].last_seen_at = new Date().toISOString();
            localStorage.setItem(k, JSON.stringify(players));
          }
        }
      }
    } catch (e) {
      console.warn('Local update error:', e);
    }
  }
};

/**
 * Fetches current players in a given server, merging latest authoritative progress from player_progress.
 * Resolves all duplicate server IDs matching the same server code.
 */
export const fetchServerPlayers = async (serverId: string): Promise<DbGlobalServerPlayer[]> => {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from('global_server_players')
      .select('*')
      .eq('server_id', serverId)
      .order('is_online', { ascending: false })
      .order('last_seen_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error fetching server players:', error);
      return getLocalServerPlayers(serverId);
    }

    // Deduplicate by account_id
    const uniquePlayersMap = new Map<string, DbGlobalServerPlayer>();
    (data || []).forEach((p: DbGlobalServerPlayer) => {
      if (!uniquePlayersMap.has(p.account_id)) {
        uniquePlayersMap.set(p.account_id, p);
      }
    });

    const serverPlayers: DbGlobalServerPlayer[] = Array.from(uniquePlayersMap.values());
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
              equipped_decorations: Array.isArray(pr.equipped_decorations) ? pr.equipped_decorations : [],
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
  return getLocalServerPlayers(serverId);
};


export interface LeaderboardPlayer {
  account_id: string;
  username: string;
  avatar_url: string;
  player_level: number;
  ship_level: number;
  coins: number;
  total_steps_today: number;
  server_code?: string;
  is_online?: boolean;
}

/**
 * Fetches true leaderboard players from Supabase (or Local fallback), sorted by progress or coins.
 */
export const fetchLeaderboard = async (
  serverId?: string,
  scope: 'server' | 'global' = 'server'
): Promise<LeaderboardPlayer[]> => {
  const supabase = getSupabase();

  if (supabase) {
    try {
      let targetAccountIds: string[] | null = null;
      const serverCodeMap = new Map<string, string>();

      if (scope === 'server' && serverId) {
        const { data: sPlayers } = await supabase
          .from('global_server_players')
          .select('account_id, username, is_online, server_id, global_servers ( code )')
          .eq('server_id', serverId);

        if (sPlayers && sPlayers.length > 0) {
          targetAccountIds = sPlayers.map((p: any) => p.account_id);
          sPlayers.forEach((p: any) => {
            const rawCode = (p as any).global_servers?.code || 'GLOBAL-1';
            serverCodeMap.set(p.account_id, normalizeServerCode(rawCode));
          });
        } else {
          return [];
        }
      }

      let progressQuery = supabase
        .from('player_progress')
        .select(`
          account_id,
          coins,
          player_level,
          ship_level,
          total_steps_today,
          avatar_url,
          accounts ( username )
        `)
        .order('player_level', { ascending: false })
        .order('coins', { ascending: false })
        .limit(50);

      if (targetAccountIds && targetAccountIds.length > 0) {
        progressQuery = progressQuery.in('account_id', targetAccountIds);
      }

      const { data: progressRows, error } = await progressQuery;

      if (error) {
        console.error('Leaderboard query error:', error);
        return [];
      }

      if (scope === 'global') {
        const { data: allSPlayers } = await supabase
          .from('global_server_players')
          .select('account_id, global_servers ( code )');
        (allSPlayers || []).forEach((p: any) => {
          const rawCode = p.global_servers?.code || 'GLOBAL-1';
          serverCodeMap.set(p.account_id, normalizeServerCode(rawCode));
        });
      }

      const result: LeaderboardPlayer[] = (progressRows || []).map((row: any) => {
        const username = row.accounts?.username || 'Captain';
        return {
          account_id: row.account_id,
          username,
          avatar_url: row.avatar_url || PIRATE_AVATARS[0].url,
          player_level: Number(row.player_level) || 1,
          ship_level: Number(row.ship_level) || 1,
          coins: Number(row.coins) || 0,
          total_steps_today: Number(row.total_steps_today) || 0,
          server_code: serverCodeMap.get(row.account_id) || 'GLOBAL-1',
          is_online: true,
        };
      });

      return result;
    } catch (e) {
      console.error('fetchLeaderboard error:', e);
      return [];
    }
  }

  // Local fallback
  try {
    const rawAccounts = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    const accounts: DbAccount[] = rawAccounts ? JSON.parse(rawAccounts) : [];

    let targetAccountIds: string[] | null = null;
    if (scope === 'server' && serverId) {
      const assigned = getLocalServerPlayers(serverId);
      targetAccountIds = assigned.map((p) => p.account_id);
    }

    const list: LeaderboardPlayer[] = [];
    for (const acc of accounts) {
      if (targetAccountIds && !targetAccountIds.includes(acc.id)) continue;

      const pRaw = localStorage.getItem(`${LOCAL_PROGRESS_PREFIX}${acc.id}`);
      const pr: Partial<DbPlayerProgress> = pRaw ? JSON.parse(pRaw) : {};

      list.push({
        account_id: acc.id,
        username: acc.username,
        avatar_url: pr.avatar_url || PIRATE_AVATARS[0].url,
        player_level: pr.player_level || 1,
        ship_level: pr.ship_level || 1,
        coins: pr.coins || 1250,
        total_steps_today: pr.total_steps_today || 0,
        server_code: pr.last_server_code || 'GLOBAL-1',
        is_online: true,
      });
    }

    list.sort((a, b) => b.player_level - a.player_level || b.coins - a.coins);
    return list;
  } catch (e) {
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
        filter: `server_id=eq.${serverId}`
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
