import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Player, ServerInfo, BattleResult, RaidLog, StepRecord, StepStats, DailyCoinRecord, CannonItem, ShieldItem, ServerRaidState, SeaMonsterConfig, SeaMonsterId, RaidParticipant, ServerTreasure, TreasureActivityLog, TreasureRewardType, Decoration, UserTodayLoot, SeaGameMode, RaidMilestoneBounty } from '../types';
import { INITIAL_SERVERS } from '../data/mockPlayers';
import { SEA_MONSTERS, getMonsterMilestones } from '../data/monsters';
import { soundFx } from '../utils/audio';
import { PIRATE_AVATARS } from '../assets';
import { generateDailyTreasures, rollTreasureReward, getRarityMetadata } from '../utils/treasureRewards';
import { DEFAULT_COORDS } from '../hooks/useGpsTracker';
import { TRANSLATIONS, Language } from '../utils/translations';
import {
  getRaidSessionInfo,
  getDeterministicSessionBoss,
  getNextTreasureResetTimeUtc7,
  getUtc7DateString,
  RaidSessionInfo,
} from '../utils/timeUtils';
import {
  DbAccount,
  createAccount,
  getAccountByUsername,
  savePlayerProgress,
  addGameRecord,
  applyDamageToPlayer,
  joinOrAssignGlobalServer,
  joinSpecificServer,
  fetchAvailableServers,
  leaveGlobalServer,
  updateShipState,
  fetchServerPlayers,
  subscribeToServerPlayers,
  subscribeToAllServersMembership,
} from '../utils/supabaseClient';

export interface PlayerProfile {
  username: string;
  aboutMe: string;
  avatarUrl: string;
}

export interface RaidCombatLog {
  id: string;
  playerName: string;
  avatarUrl: string;
  damage: number;
  time: string;
  isUser: boolean;
  isCritical?: boolean;
}

interface GameContextType {
  coins: number;
  gems: number;
  energy: number;
  maxEnergy: number;
  
  // Profile
  profile: PlayerProfile;
  updateProfile: (newProfile: Partial<PlayerProfile>) => void;
  
  // Ship State
  shipLevel: number; // 1 - 10
  shipCondition: number; // 0 - 100%
  shipMaxHp: number;
  shipCurrentHp: number;
  
  // Equipment
  ownedCannons: CannonItem[];
  equippedCannons: string[];
  ownedShields: ShieldItem[];
  equippedShield: string | null;
  
  // Computed (kept for compatibility)
  cannonLevel: number; 
  cannonCount: number; 
  shieldLevel: number; 
  shieldCharges: number;
  
  // Customization
  ownedDecorations: string[];
  equippedDecorations: string[];
  
  // Servers
  currentServer: ServerInfo;
  servers: ServerInfo[];
  switchServer: (serverCode: string) => Promise<void> | void;
  createPrivateServer: (serverName: string) => Promise<string> | string;
  refreshServerPlayers: () => Promise<void>;
  
  // Steps & Activity
  totalStepsToday: number;
  stepRecords: StepRecord[];
  dailyCoinsHistory: DailyCoinRecord[];
  stepStats: StepStats;
  addSteps: (amount: number) => void;
  isAutoWalking: boolean;
  toggleAutoWalk: () => void;
  playerLevel: number;
  playerXp: number;
  gainXp: (amount: number) => void;

  // Quests
  questIndex: number;
  questXp: number;
  claimedQuests: Set<string>;
  claimQuest: (questId: string, xp: number) => void;
  
  // Co-op Raid Event Mode
  raidSessionInfo: RaidSessionInfo;
  currentRaidState: ServerRaidState;
  currentMonster: SeaMonsterConfig;
  raidCombatLogs: RaidCombatLog[];
  joinRaid: (serverCode?: string) => void;
  dealRaidDamage: (amount: number, isDirectAttack?: boolean) => { damageDealt: number; isCritical: boolean; bossDefeated: boolean };
  claimRaidPrize: () => { coinsWon: number; gemsWon: number; percent: number; chestName: string } | null;
  claimMilestoneBounty: (hpThreshold: number) => { bounty: RaidMilestoneBounty; coinsWon: number; gemsWon: number; percent: number } | null;
  respawnRaidBoss: (bossId?: SeaMonsterId) => void;

  // Treasure Hunting Game Mode
  serverTreasures: ServerTreasure[];
  treasureLogs: TreasureActivityLog[];
  todayLoot: UserTodayLoot;
  claimTreasure: (treasureId: string) => { reward: TreasureRewardType; success: boolean } | null;
  spawnNewDailyTreasures: (force?: boolean, centerLat?: number, centerLng?: number) => void;
  totalDailyTreasures: number;
  remainingTreasuresCount: number;
  treasureResetTime: number;

  // Game Modes in The Sea
  seaGameMode: SeaGameMode;
  setSeaGameMode: (mode: SeaGameMode) => void;

  // Actions
  attackPlayer: (target: Player, minigameResult?: 'win' | 'lose') => BattleResult | null;
  repairShip: (percentToRepair: number) => boolean;
  rebuildShip: () => boolean;
  upgradeShip: () => boolean;
  
  // Individual item actions
  buyCannon: () => boolean;
  upgradeCannon: (id: string) => boolean;
  equipCannon: (id: string) => void;
  unequipCannon: (id: string) => void;
  
  buyShield: () => boolean;
  upgradeShield: (id: string) => boolean;
  equipShield: (id: string) => void;
  unequipShield: () => void;
  
  buyDecoration: (decId: string, currency: 'coins' | 'gems', price: number) => boolean;
  toggleEquipDecoration: (decId: string) => void;
  watchAdForGems: () => boolean;
  dailyAdWatches: number;
  maxDailyAds: number;
  buyGemsIAP: (tier: { id: string; name: string; price: string; gems: number }) => void;
  exchangeGemsForCoins: (tier: { id: string; name: string; gemsCost: number; coinsReward: number }) => boolean;
  
  // Independent Modal Windows
  isGemsModalOpen: boolean;
  isCoinsModalOpen: boolean;
  openGemsModal: () => void;
  openCoinsModal: () => void;
  closeGemsModal: () => void;
  closeCoinsModal: () => void;

  // Shop Modal State (Decorations)
  isShopModalOpen: boolean;
  openShopModal: () => void;
  closeShopModal: () => void;
  
  // Logs
  raidLogs: RaidLog[];
  unreadDefenseCount: number;
  markDefenseLogsAsRead: () => void;
  
  // Audio state
  isMuted: boolean;
  toggleMute: () => void;

  // Language & Translation
  language: Language;
  changeLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;

  // Supabase Name-Only Account System
  currentAccount: DbAccount | null;
  isAccountModalOpen: boolean;
  accountError: string | null;
  clearAccountError: () => void;
  registerNewAccount: (username: string) => Promise<void>;
  loginExistingAccount: (username: string) => Promise<void>;
  logoutAccount: () => Promise<void>;
  openAccountModal: () => void;
  closeAccountModal: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_STEP_RECORDS: StepRecord[] = [
  { date: '2026-08-04', dayOfWeek: 'Mon', steps: 6200 },
  { date: '2026-08-05', dayOfWeek: 'Tue', steps: 8400 },
  { date: '2026-08-06', dayOfWeek: 'Wed', steps: 4900 },
  { date: '2026-08-07', dayOfWeek: 'Thu', steps: 9100 },
  { date: '2026-08-08', dayOfWeek: 'Fri', steps: 7300 },
  { date: '2026-08-09', dayOfWeek: 'Sat', steps: 11200 },
  { date: '2026-08-10', dayOfWeek: 'Sun', steps: 4250 },
];

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pirate_coins');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) return val;
      }
    } catch (e) {}
    return 1250;
  });

  const [gems, setGems] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pirate_gems');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) return val;
      }
    } catch (e) {}
    return 20;
  });

  const [energy, setEnergy] = useState<number>(5);
  const maxEnergy = 5;

  // Supabase Name-Only Account State
  const [currentAccount, setCurrentAccount] = useState<DbAccount | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [assignedServerId, setAssignedServerId] = useState<string | null>(null);

  const clearAccountError = () => setAccountError(null);
  const openAccountModal = () => setIsAccountModalOpen(true);
  const closeAccountModal = () => {
    if (currentAccount) {
      setIsAccountModalOpen(false);
    }
  };

  // Profile State
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem('pirate_player_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) return parsed;
      }
    } catch (e) {}
    return {
      username: 'Captain',
      aboutMe: 'Sailing the Seven Seas in search of legendary step treasures and gold!',
      avatarUrl: PIRATE_AVATARS[0]?.url || '',
    };
  });

  const updateProfile = (newProfile: Partial<PlayerProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...newProfile };
      try {
        localStorage.setItem('pirate_player_profile', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    soundFx.playUpgrade();
  };

  // Player Ship Specs
  const [shipLevel, setShipLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pirate_ship_level');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) return val;
      }
    } catch (e) {}
    return 1;
  });

  const [shipCondition, setShipCondition] = useState<number>(() => {
    try {
      const initialized = localStorage.getItem('pirate_ship_condition_v75');
      if (!initialized) {
        localStorage.setItem('pirate_ship_condition_v75', 'true');
        return 75;
      }
      const saved = localStorage.getItem('pirate_ship_condition');
      if (saved !== null) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) return val;
      }
    } catch (e) {}
    return 75;
  });

  // Derived ship HP
  const shipMaxHp = 5000 + (shipLevel - 1) * 5000;
  const shipCurrentHp = Math.round(shipMaxHp * (shipCondition / 100));
  
  // Equipment & Inventory
  const [ownedCannons, setOwnedCannons] = useState<CannonItem[]>(() => {
    try {
      const saved = localStorage.getItem('pirate_owned_cannons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [{ id: 'c_1', level: 1 }];
  });

  const [equippedCannons, setEquippedCannons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pirate_equipped_cannons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return ['c_1'];
  });

  const [ownedShields, setOwnedShields] = useState<ShieldItem[]>(() => {
    try {
      const saved = localStorage.getItem('pirate_owned_shields');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [equippedShield, setEquippedShield] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('pirate_equipped_shield');
      if (saved) return saved;
    } catch (e) {}
    return null;
  });

  // Daily Ad Watches Tracking (Max 3 per day)
  const maxDailyAds = 3;
  const [dailyAdWatches, setDailyAdWatches] = useState<number>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedDate = localStorage.getItem('pirate_ad_date');
      if (savedDate === today) {
        const count = parseInt(localStorage.getItem('pirate_ad_count') || '0', 10);
        return isNaN(count) ? 0 : count;
      }
    } catch (e) {}
    return 0;
  });

  // Separate Modal Windows State
  const [isGemsModalOpen, setIsGemsModalOpen] = useState<boolean>(false);
  const [isCoinsModalOpen, setIsCoinsModalOpen] = useState<boolean>(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState<boolean>(false);

  const openGemsModal = () => {
    setIsGemsModalOpen(true);
  };

  const closeGemsModal = () => {
    setIsGemsModalOpen(false);
  };

  const openCoinsModal = () => {
    setIsCoinsModalOpen(true);
  };

  const closeCoinsModal = () => {
    setIsCoinsModalOpen(false);
  };

  const openShopModal = () => {
    setIsShopModalOpen(true);
  };

  const closeShopModal = () => {
    setIsShopModalOpen(false);
  };

  useEffect(() => {
    try {
      localStorage.setItem('pirate_coins', coins.toString());
    } catch (e) {}
  }, [coins]);

  useEffect(() => {
    try {
      localStorage.setItem('pirate_gems', gems.toString());
    } catch (e) {}
  }, [gems]);

  useEffect(() => {
    try {
      localStorage.setItem('pirate_ship_level', shipLevel.toString());
    } catch (e) {}
  }, [shipLevel]);

  useEffect(() => {
    try {
      localStorage.setItem('pirate_ship_condition', shipCondition.toString());
    } catch (e) {}
  }, [shipCondition]);

  useEffect(() => {
    try {
      localStorage.setItem('pirate_owned_cannons', JSON.stringify(ownedCannons));
    } catch (e) {}
  }, [ownedCannons]);

  useEffect(() => {
    try {
      localStorage.setItem('pirate_equipped_cannons', JSON.stringify(equippedCannons));
    } catch (e) {}
  }, [equippedCannons]);

  useEffect(() => {
    try {
      localStorage.setItem('pirate_owned_shields', JSON.stringify(ownedShields));
    } catch (e) {}
  }, [ownedShields]);

  useEffect(() => {
    try {
      if (equippedShield) {
        localStorage.setItem('pirate_equipped_shield', equippedShield);
      } else {
        localStorage.removeItem('pirate_equipped_shield');
      }
    } catch (e) {}
  }, [equippedShield]);

  // Computed values for backward compatibility
  const cannonCount = equippedCannons.length;
  const cannonLevel = equippedCannons.length > 0 
    ? Math.max(...equippedCannons.map(id => ownedCannons.find(c => c.id === id)?.level || 1)) 
    : 1;
    
  const activeShield = equippedShield ? ownedShields.find(s => s.id === equippedShield) : null;
  const shieldLevel = activeShield ? activeShield.level : 0;
  
  // We'll keep shieldCharges as state, but reset it if shield changes
  const [shieldCharges, setShieldCharges] = useState<number>(0);
  
  // Refill shield charges when equipping a new shield
  useEffect(() => {
    const targetCharges = activeShield ? activeShield.level : 0;
    setShieldCharges((prev) => (prev === targetCharges ? prev : targetCharges));
  }, [equippedShield, activeShield?.level]);

  // Customization
  const [ownedDecorations, setOwnedDecorations] = useState<string[]>(['dec_jolly_roger']);
  const [equippedDecorations, setEquippedDecorations] = useState<string[]>(['dec_jolly_roger']);

  // Servers
  const [servers, setServers] = useState<ServerInfo[]>(INITIAL_SERVERS);
  const [currentServer, setCurrentServer] = useState<ServerInfo>(INITIAL_SERVERS[0]);

  // Steps
  const [totalStepsToday, setTotalStepsToday] = useState<number>(4250);
  const totalStepsTodayRef = useRef<number>(4250);
  // Track gold coins awarded from steps today so possessed gold and "energy charged" match exactly
  const [stepCoinsAwardedToday, setStepCoinsAwardedToday] = useState<number>(() => {
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`seastride_step_coins_awarded_${todayKey}`);
      if (saved) return Number(saved);
    } catch (e) {}
    return 0;
  });

  const [stepRecords, setStepRecords] = useState<StepRecord[]>(INITIAL_STEP_RECORDS);
  const [dailyCoinsHistory] = useState<DailyCoinRecord[]>([
    { day: 'Mon', coins: 150 },
    { day: 'Tue', coins: 280 },
    { day: 'Wed', coins: 210 },
    { day: 'Thu', coins: 340 },
    { day: 'Fri', coins: 190 },
    { day: 'Sat', coins: 420 },
    { day: 'Sun', coins: 250 },
  ]);
  const [isAutoWalking, setIsAutoWalking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // App Language ('en' | 'vi')
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('pirate_app_language');
      if (saved === 'en' || saved === 'vi') {
        if (typeof document !== 'undefined') {
          document.documentElement.lang = saved;
          document.documentElement.setAttribute('data-lang', saved);
          if (saved === 'vi') {
            document.documentElement.classList.add('lang-vi');
            document.body?.classList.add('lang-vi');
          }
        }
        return saved;
      }
    } catch (e) {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
      document.documentElement.setAttribute('data-lang', 'en');
    }
    return 'en';
  });

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.setAttribute('data-lang', lang);
      if (lang === 'vi') {
        document.documentElement.classList.add('lang-vi');
        document.body?.classList.add('lang-vi');
      } else {
        document.documentElement.classList.remove('lang-vi');
        document.body?.classList.remove('lang-vi');
      }
    }
    try {
      localStorage.setItem('pirate_app_language', lang);
    } catch (e) {}
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.setAttribute('data-lang', language);
      if (language === 'vi') {
        document.documentElement.classList.add('lang-vi');
        document.body?.classList.add('lang-vi');
      } else {
        document.documentElement.classList.remove('lang-vi');
        document.body?.classList.remove('lang-vi');
      }
    }
  }, [language]);

  const toggleLanguage = () => {
    const next = language === 'en' ? 'vi' : 'en';
    changeLanguage(next);
  };

  const t = useCallback((key: string, fallback?: string): string => {
    if (!key) return fallback || "";
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    if (language === "vi") {
      const trimmed = key.trim();
      if (langDict?.[trimmed]) return langDict[trimmed];
      const lower = trimmed.toLowerCase();
      if (langDict?.[lower]) return langDict[lower];
      if (fallback && langDict?.[fallback]) return langDict[fallback];
    }
    return fallback || key;
  }, [language]);

  // Player Level & XP (500 XP per level, grants 200 coins on every level up)
  const [playerLevel, setPlayerLevel] = useState<number>(1);
  const [playerXp, setPlayerXp] = useState<number>(0);

  const gainXp = (amount: number) => {
    if (amount <= 0) return;
    setPlayerXp(prev => {
      const newXp = prev + amount;
      if (newXp >= 500) {
        const levelsGained = Math.floor(newXp / 500);
        setPlayerLevel(l => l + levelsGained);
        // Every time user levels up, they get 200 coins per level
        const bonusCoins = levelsGained * 200;
        setCoins(c => c + bonusCoins);
        soundFx.playVictory();
      }
      return newXp % 500;
    });
  };

  // Quests
  const [questIndex, setQuestIndex] = useState(0);
  const [questXp, setQuestXp] = useState(0);
  const [claimedQuests, setClaimedQuests] = useState<Set<string>>(new Set());

  const claimQuest = (questId: string, xp: number) => {
    setClaimedQuests(prev => new Set(prev).add(questId));
    setQuestXp(prev => prev + xp);
    setQuestIndex(prev => prev + 1);
    gainXp(xp);
  };

  // Helper: auto-assign and connect to global multiplayer server
  const syncAndAssignServer = async (
    acc: DbAccount,
    stats: {
      ship_level: number;
      ship_condition: number;
      current_hp: number;
      max_hp: number;
      cannon_level: number;
      cannon_count: number;
      shield_level: number;
      avatar_url: string;
    },
    preferredServerCode?: string
  ) => {
    try {
      const assignment = preferredServerCode
        ? await joinSpecificServer(acc.id, acc.username, stats, preferredServerCode)
        : await joinOrAssignGlobalServer(acc.id, acc.username, stats);

      if (assignment && assignment.server_code) {
        setAssignedServerId(assignment.server_id);
        const [dbPlayers, allServers] = await Promise.all([
          fetchServerPlayers(assignment.server_id),
          fetchAvailableServers(),
        ]);

        const mappedPlayers: Player[] = dbPlayers
          .filter((p) => p.account_id !== acc.id)
          .map((p) => ({
            id: p.account_id,
            name: p.username,
            title: p.ship_level >= 5 ? 'Fleet Commander' : 'Sea Strider',
            avatarUrl: p.avatar_url || PIRATE_AVATARS[0].url,
            shipLevel: p.ship_level,
            shipCondition: p.ship_condition,
            currentHp: p.current_hp,
            maxHp: p.max_hp,
            cannonLevel: p.cannon_level,
            cannonCount: p.cannon_count,
            shieldLevel: p.shield_level,
            equippedDecorations: p.equipped_decorations || [],
            isOnline: p.is_online,
          }));

        const isPriv = assignment.server_code.startsWith('PRIV-');
        const assignAny = assignment as any;
        const newServer: ServerInfo = {
          code: assignment.server_code,
          type: assignAny.server_type || (isPriv ? 'private' : 'global'),
          name:
            assignAny.server_name ||
            (isPriv
              ? `Private Island (${assignment.server_code})`
              : `Global Fleet ${assignment.server_code.split('-')[1] || '1'}`),
          playerCount: dbPlayers.length,
          maxPlayers: assignAny.max_players || 30, // 30 ships max!
          players: mappedPlayers,
        };

        setCurrentServer(newServer);
        if (allServers && allServers.length > 0) {
          setServers(allServers);
        } else {
          setServers((prev) => {
            const others = prev.filter((s) => s.code !== assignment.server_code);
            return [newServer, ...others];
          });
        }
      }
    } catch (err: any) {
      console.error('Server allocation error:', err);
    }
  };

  // Register New Player
  const registerNewAccount = async (username: string) => {
    setAccountError(null);
    try {
      const { account, progress } = await createAccount(username);
      setCurrentAccount(account);

      setProfile({
        username: account.username,
        aboutMe: progress.about_me || 'Sailing the Seven Seas!',
        avatarUrl: progress.avatar_url || PIRATE_AVATARS[0].url,
      });
      setCoins(progress.coins);
      setGems(progress.gems);
      setEnergy(progress.energy);
      setShipLevel(progress.ship_level);
      setShipCondition(progress.ship_condition);
      setOwnedCannons(progress.owned_cannons || [{ id: 'c_1', level: 1 }]);
      setEquippedCannons(progress.equipped_cannons || ['c_1']);
      setOwnedShields(progress.owned_shields || []);
      setEquippedShield(progress.equipped_shield || null);
      setOwnedDecorations(progress.owned_decorations || ['dec_jolly_roger']);
      setEquippedDecorations(progress.equipped_decorations || ['dec_jolly_roger']);
      setTotalStepsToday(0);
      totalStepsTodayRef.current = 0;
      setStepRecords([]);
      setPlayerLevel(progress.player_level || 1);
      setPlayerXp(progress.player_xp ?? 0);
      setQuestIndex(0);
      setQuestXp(0);
      setClaimedQuests(new Set());
      setRaidLogs([]);

      try {
        localStorage.setItem('seastride_active_username', account.username);
      } catch (e) {}

      setIsAccountModalOpen(false);

      await syncAndAssignServer(account, {
        ship_level: progress.ship_level,
        ship_condition: progress.ship_condition,
        current_hp: progress.ship_current_hp,
        max_hp: progress.ship_max_hp,
        cannon_level: 1,
        cannon_count: 1,
        shield_level: 0,
        avatar_url: progress.avatar_url || PIRATE_AVATARS[0].url,
      });

      soundFx.playVictory();
    } catch (err: any) {
      setAccountError(err.message || 'Failed to create account');
      throw err;
    }
  };

  // Login Existing Player
  const loginExistingAccount = async (username: string) => {
    setAccountError(null);
    try {
      const { account, progress, records } = await getAccountByUsername(username);
      setCurrentAccount(account);

      if (progress) {
        setProfile({
          username: account.username,
          aboutMe: progress.about_me || 'Sailing the Seven Seas!',
          avatarUrl: progress.avatar_url || PIRATE_AVATARS[0].url,
        });
        setCoins(progress.coins ?? 1250);
        setGems(progress.gems ?? 20);
        setEnergy(progress.energy ?? 5);
        setShipLevel(progress.ship_level ?? 1);
        setShipCondition(progress.ship_condition ?? 75);
        setOwnedCannons(progress.owned_cannons || [{ id: 'c_1', level: 1 }]);
        setEquippedCannons(progress.equipped_cannons || ['c_1']);
        setOwnedShields(progress.owned_shields || []);
        setEquippedShield(progress.equipped_shield || null);
        setOwnedDecorations(progress.owned_decorations || ['dec_jolly_roger']);
        setEquippedDecorations(progress.equipped_decorations || ['dec_jolly_roger']);
        setTotalStepsToday(progress.total_steps_today ?? 0);
        setStepRecords(progress.step_records || []);
        setPlayerLevel(progress.player_level ?? 1);
        setPlayerXp(progress.player_xp ?? 0);
        setQuestIndex(progress.quest_index ?? 0);
        setQuestXp(progress.quest_xp ?? 0);
        setClaimedQuests(new Set(progress.claimed_quests || []));

        const now = Date.now();
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        const mappedLogs: RaidLog[] = (records || [])
          .filter((r) => r.record_type === 'battle_log' || r.record_type === 'raid_log')
          .filter((r) => {
            const createdTime = r.created_at ? new Date(r.created_at).getTime() : (r.details?.createdAt || 0);
            if (!createdTime) return true;
            return now - createdTime < THREE_DAYS_MS;
          })
          .map((r) => {
            const createdTime = r.created_at ? new Date(r.created_at).getTime() : (r.details?.createdAt || Date.now());
            return {
              id: r.id,
              timestamp: new Date(createdTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              createdAt: createdTime,
              type: r.details?.type || 'attack',
              opponentName: r.details?.opponentName || 'Rival Captain',
              outcome: r.details?.outcome || 'victory',
              coinsChange: r.details?.coinsChange || 0,
              damage: r.details?.damage || 0,
              cannonLostOrWon: r.details?.cannonLostOrWon,
              viewed: r.details?.viewed ?? true,
            };
          });
        setRaidLogs(mappedLogs);
      }

      try {
        localStorage.setItem('seastride_active_username', account.username);
      } catch (e) {}

      setIsAccountModalOpen(false);

      let computedCannonLvl = 1;
      if (progress?.owned_cannons && progress.owned_cannons.length > 0) {
        computedCannonLvl = Math.max(...progress.owned_cannons.map((c: any) => Number(c.level) || 1));
      }
      const computedCannonCnt = progress?.equipped_cannons?.length || 1;
      let computedShieldLvl = 0;
      if (progress?.equipped_shield && progress?.owned_shields) {
        const sObj = progress.owned_shields.find((s: any) => s.id === progress.equipped_shield);
        if (sObj) computedShieldLvl = Number(sObj.level) || 1;
      }

      const accShipLevel = Number(progress?.ship_level) || 1;
      const accMaxHp = Number(progress?.ship_max_hp) || (5000 + (accShipLevel - 1) * 5000);
      const accCondition = progress?.ship_condition !== undefined ? Number(progress.ship_condition) : 75;
      const accCurrentHp = progress?.ship_current_hp !== undefined ? Number(progress.ship_current_hp) : Math.round(accMaxHp * (accCondition / 100));

      const stepsToday = Number(progress?.total_steps_today) || 0;
      setTotalStepsToday(stepsToday);
      totalStepsTodayRef.current = stepsToday;
      const eligibleStepCoins = Math.floor(stepsToday / 100) * 10;
      setStepCoinsAwardedToday(eligibleStepCoins);

      await syncAndAssignServer(
        account,
        {
          ship_level: accShipLevel,
          ship_condition: accCondition,
          current_hp: accCurrentHp,
          max_hp: accMaxHp,
          cannon_level: computedCannonLvl,
          cannon_count: Math.max(1, computedCannonCnt),
          shield_level: computedShieldLvl,
          avatar_url: progress?.avatar_url || profile.avatarUrl,
        },
        progress?.last_server_code
      );

      soundFx.playClick();
    } catch (err: any) {
      setAccountError(err.message || 'Failed to login account');
      throw err;
    }
  };

  // Logout Account
  const logoutAccount = async () => {
    if (currentAccount) {
      await leaveGlobalServer(currentAccount.id);
    }
    setAssignedServerId(null);
    setCurrentAccount(null);
    setRaidLogs([]);
    try {
      localStorage.removeItem('seastride_active_username');
    } catch (e) {}
    setIsAccountModalOpen(true);
    soundFx.playClose();
  };

  // Initial account restoration or prompt
  useEffect(() => {
    const active = localStorage.getItem('seastride_active_username');
    if (active) {
      loginExistingAccount(active).catch(() => {
        setIsAccountModalOpen(true);
      });
    } else {
      setIsAccountModalOpen(true);
    }
  }, []);

  // Supabase Realtime Subscription for Room
  useEffect(() => {
    if (!assignedServerId || !currentAccount) return;

    const subscription = subscribeToServerPlayers(assignedServerId, (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (eventType === 'INSERT' && newRecord) {
        if (newRecord.account_id !== currentAccount.id) {
          const newPlayer: Player = {
            id: newRecord.account_id,
            name: newRecord.username,
            title: newRecord.ship_level >= 5 ? 'Fleet Commander' : 'Sea Strider',
            avatarUrl: newRecord.avatar_url || PIRATE_AVATARS[0].url,
            shipLevel: newRecord.ship_level,
            shipCondition: newRecord.ship_condition,
            currentHp: newRecord.current_hp,
            maxHp: newRecord.max_hp,
            cannonLevel: newRecord.cannon_level,
            cannonCount: newRecord.cannon_count,
            shieldLevel: newRecord.shield_level,
            equippedDecorations: newRecord.equipped_decorations || [],
            isOnline: newRecord.is_online,
          };

          setCurrentServer((prev) => {
            const exists = prev.players.some((p) => p.id === newPlayer.id);
            const updated = exists
              ? prev.players.map((p) => (p.id === newPlayer.id ? newPlayer : p))
              : [...prev.players, newPlayer];
            return {
              ...prev,
              playerCount: updated.length + 1,
              players: updated,
            };
          });
        }
      } else if (eventType === 'UPDATE' && newRecord) {
        if (newRecord.account_id !== currentAccount.id) {
          setCurrentServer((prev) => ({
            ...prev,
            players: prev.players.map((p) => {
              if (p.id === newRecord.account_id) {
                const updatedShipLevel = Number(newRecord.ship_level) || p.shipLevel;
                const updatedMaxHp = Number(newRecord.max_hp) || (5000 + (updatedShipLevel - 1) * 5000);
                const updatedCondition = newRecord.ship_condition !== undefined ? Number(newRecord.ship_condition) : p.shipCondition;
                const updatedCurrentHp = newRecord.current_hp !== undefined ? Number(newRecord.current_hp) : Math.round(updatedMaxHp * (updatedCondition / 100));

                return {
                  ...p,
                  name: newRecord.username || p.name,
                  shipLevel: updatedShipLevel,
                  shipCondition: updatedCondition,
                  currentHp: updatedCurrentHp,
                  maxHp: updatedMaxHp,
                  cannonLevel: Number(newRecord.cannon_level) || p.cannonLevel,
                  cannonCount: Number(newRecord.cannon_count) || p.cannonCount,
                  shieldLevel: newRecord.shield_level !== undefined ? Number(newRecord.shield_level) : p.shieldLevel,
                  equippedDecorations: newRecord.equipped_decorations !== undefined ? newRecord.equipped_decorations : p.equippedDecorations,
                  isOnline: newRecord.is_online !== undefined ? newRecord.is_online : p.isOnline,
                };
              }
              return p;
            }),
          }));
        } else {
          // If we receive an update about OURSELVES from the server
          // (e.g. another player bombed us, reducing our HP)
          if (newRecord.ship_condition !== undefined) {
            setShipCondition(prev => {
              if (newRecord.ship_condition < prev) {
                // We were damaged by someone! Fetch the new raid logs so the red dot appears.
                getAccountByUsername(currentAccount.username).then(res => {
                  const now = Date.now();
                  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
                  const mappedLogs = (res.records || [])
                    .filter((r: any) => r.record_type === 'battle_log' || r.record_type === 'raid_log')
                    .filter((r: any) => {
                      const createdTime = r.created_at ? new Date(r.created_at).getTime() : (r.details?.createdAt || 0);
                      if (!createdTime) return true;
                      return now - createdTime < THREE_DAYS_MS;
                    })
                    .map((r: any) => {
                      const createdTime = r.created_at ? new Date(r.created_at).getTime() : (r.details?.createdAt || Date.now());
                      return {
                        id: r.id,
                        timestamp: new Date(createdTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        }),
                        createdAt: createdTime,
                        type: r.details?.type || 'attack',
                        opponentName: r.details?.opponentName || 'Rival Captain',
                        outcome: r.details?.outcome || 'victory',
                        coinsChange: r.details?.coinsChange || 0,
                        damage: r.details?.damage || 0,
                        cannonLostOrWon: r.details?.cannonLostOrWon,
                        viewed: r.details?.viewed ?? true,
                      };
                    });
                  setRaidLogs(mappedLogs);
                }).catch(() => {});
                return newRecord.ship_condition;
              }
              return prev;
            });
          }
        }
      } else if (eventType === 'DELETE' && oldRecord) {
        setCurrentServer((prev) => {
          const filtered = prev.players.filter((p) => p.id !== oldRecord.account_id);
          return {
            ...prev,
            playerCount: filtered.length + 1,
            players: filtered,
          };
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [assignedServerId, currentAccount?.id]);

  // Periodic server player refresh to guarantee other users' ship level, cannon level & HP are always exact
  const refreshServerPlayers = useCallback(async () => {
    if (!assignedServerId || !currentAccount) return;
    try {
      const [dbPlayers, allServers] = await Promise.all([
        fetchServerPlayers(assignedServerId),
        fetchAvailableServers(),
      ]);

      const mappedPlayers: Player[] = dbPlayers
        .filter((p) => p.account_id !== currentAccount.id)
        .map((p) => ({
          id: p.account_id,
          name: p.username,
          title: p.ship_level >= 5 ? 'Fleet Commander' : 'Sea Strider',
          avatarUrl: p.avatar_url || PIRATE_AVATARS[0].url,
          shipLevel: p.ship_level,
          shipCondition: p.ship_condition,
          currentHp: p.current_hp,
          maxHp: p.max_hp,
          cannonLevel: p.cannon_level,
          cannonCount: p.cannon_count,
          shieldLevel: p.shield_level,
          equippedDecorations: p.equipped_decorations || [],
          isOnline: p.is_online,
        }));

      if (allServers && allServers.length > 0) {
        setServers(allServers);
        const currentInList = allServers.find((s) => s.code === currentServer.code);
        setCurrentServer((prev) => ({
          ...prev,
          playerCount: currentInList ? currentInList.playerCount : dbPlayers.length,
          players: mappedPlayers,
        }));
      } else {
        setCurrentServer((prev) => ({
          ...prev,
          playerCount: dbPlayers.length,
          players: mappedPlayers,
        }));
      }
    } catch (e) {
      console.warn('Error refreshing server players:', e);
    }
  }, [assignedServerId, currentAccount?.id, currentServer.code]);

  useEffect(() => {
    if (!assignedServerId || !currentAccount) return;
    refreshServerPlayers();
    const interval = setInterval(() => {
      refreshServerPlayers();
    }, 5000);
    return () => clearInterval(interval);
  }, [assignedServerId, currentAccount?.id, refreshServerPlayers]);

  // Realtime subscription across all servers to keep server list counts updated live
  useEffect(() => {
    const sub = subscribeToAllServersMembership(() => {
      fetchAvailableServers().then((allServers) => {
        if (allServers && allServers.length > 0) {
          setServers(allServers);
          const curr = allServers.find((s) => s.code === currentServer.code);
          if (curr) {
            setCurrentServer((prev) => ({
              ...prev,
              playerCount: curr.playerCount,
            }));
          }
        }
      });
    });
    return () => {
      sub.unsubscribe();
    };
  }, [currentServer.code]);

  // Clean up server player presence on beforeunload
  useEffect(() => {
    const handleUnload = () => {
      if (currentAccount) {
        leaveGlobalServer(currentAccount.id);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [currentAccount?.id]);

  // Debounced auto-save of player progress to Supabase and multiplayer sync
  useEffect(() => {
    if (!currentAccount) return;

    const timer = setTimeout(() => {
      savePlayerProgress(currentAccount.id, {
        coins,
        gems,
        energy,
        max_energy: maxEnergy,
        player_level: playerLevel,
        player_xp: playerXp,
        ship_level: shipLevel,
        ship_condition: shipCondition,
        ship_current_hp: shipCurrentHp,
        ship_max_hp: shipMaxHp,
        avatar_url: profile.avatarUrl,
        about_me: profile.aboutMe,
        owned_cannons: ownedCannons,
        equipped_cannons: equippedCannons,
        owned_shields: ownedShields,
        equipped_shield: equippedShield,
        owned_decorations: ownedDecorations,
        equipped_decorations: equippedDecorations,
        total_steps_today: totalStepsToday,
        step_records: stepRecords,
        daily_coins_history: dailyCoinsHistory,
        quest_index: questIndex,
        quest_xp: questXp,
        claimed_quests: Array.from(claimedQuests),
      });

      // Also broadcast current complete ship state to multiplayer room so other players see exact upgrades
      const maxCannonLvl = ownedCannons.length > 0 ? Math.max(...ownedCannons.map(c => c.level)) : 1;
      const equippedCannonCount = equippedCannons.length > 0 ? equippedCannons.length : 1;
      let equippedShieldLvl = 0;
      if (equippedShield) {
        const sh = ownedShields.find(s => s.id === equippedShield);
        if (sh) equippedShieldLvl = sh.level;
      }

      updateShipState(currentAccount.id, {
        hp: shipCurrentHp,
        condition: shipCondition,
        ship_level: shipLevel,
        max_hp: shipMaxHp,
        cannon_level: maxCannonLvl,
        cannon_count: equippedCannonCount,
        shield_level: equippedShieldLvl,
        avatar_url: profile.avatarUrl,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [
    currentAccount?.id,
    coins,
    gems,
    energy,
    playerLevel,
    playerXp,
    shipLevel,
    shipCondition,
    shipCurrentHp,
    shipMaxHp,
    profile.avatarUrl,
    profile.aboutMe,
    ownedCannons,
    equippedCannons,
    ownedShields,
    equippedShield,
    ownedDecorations,
    equippedDecorations,
    totalStepsToday,
    stepRecords,
    dailyCoinsHistory,
    questIndex,
    questXp,
    claimedQuests,
  ]);

  // ==================== RAID BOSS SYSTEM (UTC+7 SCHEDULE) ====================
  // Raid session runs from Friday 00:00:00 AM to Monday 23:59:59 PM (UTC+7).
  // Each time the session starts, ONE RANDOM boss appears and remains until the session ends.
  const [raidSessionInfo, setRaidSessionInfo] = useState<RaidSessionInfo>(() => getRaidSessionInfo(Date.now()));

  const getOrInitSessionBoss = (sessionId: string): SeaMonsterId => {
    try {
      const saved = localStorage.getItem('pirate_session_boss_' + sessionId);
      if (saved && (saved === 'megalodon' || saved === 'siren' || saved === 'scylla' || saved === 'kraken')) {
        return saved as SeaMonsterId;
      }
    } catch (e) {}
    const deterministicBoss = getDeterministicSessionBoss(sessionId);
    try {
      localStorage.setItem('pirate_session_boss_' + sessionId, deterministicBoss);
    } catch (e) {}
    return deterministicBoss;
  };

  // Raid State per Server
  const [raidStates, setRaidStates] = useState<Record<string, ServerRaidState>>(() => {
    const session = getRaidSessionInfo(Date.now());
    const sessionBossId = getOrInitSessionBoss(session.sessionId);
    const monster = SEA_MONSTERS[sessionBossId];

    try {
      const saved = localStorage.getItem('pirate_raid_states_v7');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const first = Object.values(parsed)[0] as ServerRaidState | undefined;
          if (first && first.sessionId === session.sessionId && first.bossId === sessionBossId) {
            return parsed;
          }
        }
      }
    } catch (e) {}

    const initialMap: Record<string, ServerRaidState> = {};

    INITIAL_SERVERS.forEach((server) => {
      const participants: RaidParticipant[] = server.players.slice(0, 8).map((p, idx) => {
        const damage = Math.round(monster.maxHp * (0.02 + ((8 - idx) / 8) * 0.03));
        return {
          id: p.id,
          name: p.name,
          title: p.title,
          avatarUrl: p.avatarUrl,
          damage,
          isUser: false,
          shipLevel: p.shipLevel,
        };
      });

      // Add user
      participants.push({
        id: 'user_player',
        name: 'Captain Blackbeard',
        title: 'Dread Navigator',
        avatarUrl: PIRATE_AVATARS[0]?.url || '',
        damage: 0,
        isUser: true,
        shipLevel: 1,
      });

      const totalDmg = participants.reduce((sum, p) => sum + p.damage, 0);
      const currentHp = Math.max(0, monster.maxHp - totalDmg);

      initialMap[server.code] = {
        serverCode: server.code,
        sessionId: session.sessionId,
        bossId: sessionBossId,
        currentHp,
        maxHp: monster.maxHp,
        participants,
        isDefeated: currentHp <= 0,
        dailyPrizeClaimed: false,
        claimedMilestones: [],
        expiresAt: session.sessionEndTime,
        hasJoined: false,
      };
    });
    return initialMap;
  });

  useEffect(() => {
    try {
      localStorage.setItem('pirate_raid_states_v7', JSON.stringify(raidStates));
    } catch (e) {}
  }, [raidStates]);

  // Periodic Raid Session monitor in UTC+7 (every second)
  useEffect(() => {
    const sessionTimer = setInterval(() => {
      const currentInfo = getRaidSessionInfo(Date.now());
      setRaidSessionInfo(currentInfo);

      // Check if session ID changed (e.g., rollover into new weekend session)
      setRaidStates(prev => {
        const first = Object.values(prev)[0];
        if (first && first.sessionId && first.sessionId !== currentInfo.sessionId) {
          // New session started! Choose ONE random boss for this new session
          const newBossId = getOrInitSessionBoss(currentInfo.sessionId);
          const monster = SEA_MONSTERS[newBossId];
          const newMap: Record<string, ServerRaidState> = {};

          INITIAL_SERVERS.forEach(server => {
            const participants: RaidParticipant[] = server.players.slice(0, 8).map((p, idx) => ({
              id: p.id,
              name: p.name,
              title: p.title,
              avatarUrl: p.avatarUrl,
              damage: Math.round(monster.maxHp * (0.02 + ((8 - idx) / 8) * 0.03)),
              isUser: false,
              shipLevel: p.shipLevel,
            }));

            participants.push({
              id: 'user_player',
              name: profile.username || 'Captain Blackbeard',
              title: 'Dread Navigator',
              avatarUrl: profile.avatarUrl || PIRATE_AVATARS[0]?.url || '',
              damage: 0,
              isUser: true,
              shipLevel: 1,
            });

            const totalDmg = participants.reduce((sum, p) => sum + p.damage, 0);
            const currentHp = Math.max(0, monster.maxHp - totalDmg);

            newMap[server.code] = {
              serverCode: server.code,
              sessionId: currentInfo.sessionId,
              bossId: newBossId,
              currentHp,
              maxHp: monster.maxHp,
              participants,
              isDefeated: currentHp <= 0,
              dailyPrizeClaimed: false,
              claimedMilestones: [],
              expiresAt: currentInfo.sessionEndTime,
              hasJoined: false,
            };
          });
          return newMap;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(sessionTimer);
  }, [profile.username, profile.avatarUrl]);

  const [raidCombatLogs, setRaidCombatLogs] = useState<RaidCombatLog[]>([
    {
      id: 'clog_1',
      playerName: 'Anne Bonny',
      avatarUrl: PIRATE_AVATARS[4]?.url || '',
      damage: 180,
      time: 'Just now',
      isUser: false,
    },
    {
      id: 'clog_2',
      playerName: 'Captain Jack',
      avatarUrl: PIRATE_AVATARS[0]?.url || '',
      damage: 420,
      time: '1m ago',
      isUser: false,
      isCritical: true,
    },
  ]);

  // Current server active raid state
  const sessionBossId = getOrInitSessionBoss(raidSessionInfo.sessionId);
  const currentRaidState: ServerRaidState = raidStates[currentServer.code] || {
    serverCode: currentServer.code,
    sessionId: raidSessionInfo.sessionId,
    bossId: sessionBossId,
    currentHp: SEA_MONSTERS[sessionBossId]?.maxHp || 200000,
    maxHp: SEA_MONSTERS[sessionBossId]?.maxHp || 200000,
    participants: [
      {
        id: 'user_player',
        name: profile.username,
        title: 'Dread Navigator',
        avatarUrl: profile.avatarUrl,
        damage: 0,
        isUser: true,
        shipLevel,
      }
    ],
    isDefeated: false,
    dailyPrizeClaimed: false,
    expiresAt: raidSessionInfo.sessionEndTime,
    hasJoined: false,
  };

  const currentMonster = SEA_MONSTERS[currentRaidState.bossId] || SEA_MONSTERS[sessionBossId] || SEA_MONSTERS.megalodon;

  // Join Raid Function
  const joinRaid = (targetServerCode?: string) => {
    const code = targetServerCode || currentServer.code;
    setRaidStates(prev => {
      const serverState = prev[code] || currentRaidState;
      if (serverState.hasJoined) return prev;

      const currentHpPercent = Math.max(0, Math.min(100, (serverState.currentHp / serverState.maxHp) * 100));

      const hasUser = serverState.participants.some(p => p.isUser || p.id === 'user_player');
      const updatedParticipants = hasUser
        ? serverState.participants.map(p => (p.isUser || p.id === 'user_player') ? { ...p, name: profile.username, avatarUrl: profile.avatarUrl, shipLevel } : p)
        : [
            ...serverState.participants,
            {
              id: 'user_player',
              name: profile.username,
              title: 'Dread Navigator',
              avatarUrl: profile.avatarUrl,
              damage: 0,
              isUser: true,
              shipLevel,
            }
          ];

      return {
        ...prev,
        [code]: {
          ...serverState,
          hasJoined: true,
          joinedHpPercent: Math.round(currentHpPercent * 10) / 10,
          joinedAtHp: serverState.currentHp,
          participants: updatedParticipants,
        }
      };
    });

    // Add join announcement log
    setRaidCombatLogs(prev => [
      {
        id: `clog_join_${Date.now()}`,
        playerName: profile.username,
        avatarUrl: profile.avatarUrl,
        damage: 0,
        time: 'Just now',
        isUser: true,
      },
      ...prev.slice(0, 19),
    ]);

    soundFx.playMonsterRoar();
  };

  // Deal Raid Damage Function (1 step = 1 HP, or direct attack)
  const dealRaidDamage = (amount: number, isDirectAttack: boolean = false): { damageDealt: number; isCritical: boolean; bossDefeated: boolean } => {
    if (amount <= 0) return { damageDealt: 0, isCritical: false, bossDefeated: false };

    // Critical strike chance based on equipped cannons & ship level
    const isCritical = isDirectAttack && Math.random() < 0.25;
    const finalDamage = isCritical ? Math.round(amount * 1.75) : amount;

    let isDefeated = false;

    setRaidStates(prev => {
      const serverState = prev[currentServer.code] || currentRaidState;
      if (serverState.isDefeated) return prev;

      const nextHp = Math.max(0, serverState.currentHp - finalDamage);
      isDefeated = nextHp <= 0;

      // Update user participant
      const nextParticipants = serverState.participants.map(p => {
        if (p.isUser || p.id === 'user_player') {
          return {
            ...p,
            name: profile.username,
            avatarUrl: profile.avatarUrl,
            shipLevel,
            damage: p.damage + finalDamage,
          };
        }
        return p;
      });

      return {
        ...prev,
        [currentServer.code]: {
          ...serverState,
          currentHp: nextHp,
          isDefeated,
          participants: nextParticipants,
        }
      };
    });

    // Add battle log
    setRaidCombatLogs(prev => [
      {
        id: `clog_${Date.now()}_${Math.random()}`,
        playerName: profile.username,
        avatarUrl: profile.avatarUrl,
        damage: finalDamage,
        time: 'Just now',
        isUser: true,
        isCritical,
      },
      ...prev.slice(0, 19),
    ]);

    if (isDirectAttack) {
      soundFx.playBossHit();
      if (isCritical) {
        soundFx.playMonsterRoar();
      }
    }

    return { damageDealt: finalDamage, isCritical, bossDefeated: isDefeated };
  };

  // Claim Daily Prize Share
  const claimRaidPrize = () => {
    if (currentRaidState.dailyPrizeClaimed) {
      alert('You have already claimed today\'s prize share for this Sea Monster!');
      return null;
    }

    const joinedHpPercent = currentRaidState.joinedHpPercent !== undefined ? currentRaidState.joinedHpPercent : 100;
    if (joinedHpPercent <= 0) {
      alert('You cannot claim the victory bounty because this Sea Monster was already defeated before you joined.');
      return null;
    }

    const userParticipant = currentRaidState.participants.find(p => p.isUser || p.id === 'user_player');
    const userDamage = userParticipant ? userParticipant.damage : 0;
    const totalDamage = currentRaidState.participants.reduce((sum, p) => sum + p.damage, 0);

    if (userDamage <= 0 || totalDamage <= 0) {
      return null;
    }

    const pct = userDamage / totalDamage;
    if (pct <= 0) return null;

    const coinsWon = Math.max(1, Math.round(currentMonster.totalPrizeCoins * pct));
    const gemsWon = Math.round(currentMonster.totalPrizeGems * pct);

    setCoins(c => c + coinsWon);
    setGems(g => g + gemsWon);

    setRaidStates(prev => {
      const serverState = prev[currentServer.code];
      if (!serverState) return prev;
      return {
        ...prev,
        [currentServer.code]: {
          ...serverState,
          dailyPrizeClaimed: true,
        }
      };
    });

    soundFx.playPrizeFanfare();

    const newLog: RaidLog = {
      id: `raid_prize_${Date.now()}`,
      timestamp: 'Just now',
      createdAt: Date.now(),
      type: 'attack',
      opponentName: currentMonster.shortName,
      outcome: 'victory',
      coinsChange: coinsWon,
      damage: userDamage,
      cannonLostOrWon: `Claimed ${(pct * 100).toFixed(1)}% Prize Pool: +${coinsWon} Coins & +${gemsWon} Gems!`,
    };
    setRaidLogs(prev => [newLog, ...prev]);
    if (currentAccount) {
      addGameRecord(currentAccount.id, 'raid_log', newLog);
    }

    return {
      coinsWon,
      gemsWon,
      percent: Math.round(pct * 1000) / 10,
      chestName: currentMonster.chestName,
    };
  };

  // Claim Milestone Bounty based on damage share %
  const claimMilestoneBounty = (hpThreshold: number): { bounty: RaidMilestoneBounty; coinsWon: number; gemsWon: number; percent: number } | null => {
    const serverState = raidStates[currentServer.code] || currentRaidState;
    const claimed = serverState.claimedMilestones || [];
    if (claimed.includes(hpThreshold)) {
      alert('You have already claimed this milestone reward!');
      return null;
    }

    const joinedHpPercent = serverState.joinedHpPercent !== undefined ? serverState.joinedHpPercent : 100;
    if (hpThreshold >= joinedHpPercent) {
      alert('You cannot claim this milestone because it was reached before you joined this raid battle. You can only contribute towards and claim upcoming milestones!');
      return null;
    }

    const hpPercent = (serverState.currentHp / serverState.maxHp) * 100;
    if (hpPercent > hpThreshold) {
      alert(`This milestone is locked! The server must bring the boss down to ${hpThreshold}% HP.`);
      return null;
    }

    const userParticipant = serverState.participants.find(p => p.isUser || p.id === 'user_player');
    const userDamage = userParticipant ? userParticipant.damage : 0;
    const totalDamage = serverState.participants.reduce((sum, p) => sum + p.damage, 0);

    if (userDamage <= 0 || totalDamage <= 0) {
      return null;
    }

    const milestones = getMonsterMilestones(currentMonster);
    const targetBounty = milestones.find(m => m.hpThresholdPercent === hpThreshold);
    if (!targetBounty) return null;

    const pct = totalDamage > 0 ? (userDamage / totalDamage) : 0;
    if (pct <= 0) return null;

    const coinsWon = Math.max(1, Math.round(targetBounty.coins * pct));
    const gemsWon = Math.round(targetBounty.gems * pct);

    setCoins(c => c + coinsWon);
    setGems(g => g + gemsWon);

    setRaidStates(prev => {
      const sState = prev[currentServer.code] || currentRaidState;
      const prevClaimed = sState.claimedMilestones || [];
      return {
        ...prev,
        [currentServer.code]: {
          ...sState,
          claimedMilestones: [...prevClaimed, hpThreshold],
        }
      };
    });

    soundFx.playPrizeFanfare();

    const newLog: RaidLog = {
      id: `milestone_${hpThreshold}_${Date.now()}`,
      timestamp: 'Just now',
      createdAt: Date.now(),
      type: 'attack',
      opponentName: currentMonster.shortName,
      outcome: 'victory',
      coinsChange: coinsWon,
      damage: 0,
      cannonLostOrWon: `Claimed ${(pct * 100).toFixed(1)}% Share of ${hpThreshold}% HP Reward: +${coinsWon.toLocaleString()} Coins & +${gemsWon} Gems!`,
    };
    setRaidLogs(prev => [newLog, ...prev]);
    if (currentAccount) {
      addGameRecord(currentAccount.id, 'raid_log', newLog);
    }

    return {
      bounty: targetBounty,
      coinsWon,
      gemsWon,
      percent: Math.round(pct * 1000) / 10,
    };
  };

  // Respawn or change monster
  const respawnRaidBoss = (newBossId?: SeaMonsterId) => {
    const nextBoss = newBossId || currentRaidState.bossId || sessionBossId;
    const monster = SEA_MONSTERS[nextBoss];

    setRaidStates(prev => {
      const serverState = prev[currentServer.code] || currentRaidState;
      const resetParticipants = serverState.participants.map(p => ({
        ...p,
        damage: p.isUser ? 0 : Math.round(monster.maxHp * 0.03),
      }));

      const totalNpcDamage = resetParticipants.filter(p => !p.isUser).reduce((acc, p) => acc + p.damage, 0);

      return {
        ...prev,
        [currentServer.code]: {
          ...serverState,
          sessionId: raidSessionInfo.sessionId,
          bossId: nextBoss,
          maxHp: monster.maxHp,
          currentHp: monster.maxHp - totalNpcDamage,
          isDefeated: false,
          dailyPrizeClaimed: false,
          participants: resetParticipants,
          expiresAt: raidSessionInfo.sessionEndTime,
        }
      };
    });

    soundFx.playMonsterRoar();
  };

  // Periodic NPC Crewmate Strikes simulation
  useEffect(() => {
    const npcInterval = setInterval(() => {
      if (currentRaidState.isDefeated) return;
      const npcs = currentRaidState.participants.filter(p => !p.isUser);
      if (npcs.length === 0) return;

      const randomNpc = npcs[Math.floor(Math.random() * npcs.length)];
      const strikeDmg = Math.floor(40 + Math.random() * 120);

      setRaidStates(prev => {
        const serverState = prev[currentServer.code];
        if (!serverState || serverState.isDefeated) return prev;

        const nextHp = Math.max(0, serverState.currentHp - strikeDmg);
        const nextParticipants = serverState.participants.map(p => 
          p.id === randomNpc.id ? { ...p, damage: p.damage + strikeDmg } : p
        );

        return {
          ...prev,
          [currentServer.code]: {
            ...serverState,
            currentHp: nextHp,
            isDefeated: nextHp <= 0,
            participants: nextParticipants,
          }
        };
      });

      setRaidCombatLogs(prev => [
        {
          id: `npc_clog_${Date.now()}`,
          playerName: randomNpc.name,
          avatarUrl: randomNpc.avatarUrl,
          damage: strikeDmg,
          time: 'Just now',
          isUser: false,
        },
        ...prev.slice(0, 19),
      ]);
    }, 10000);

    return () => clearInterval(npcInterval);
  }, [currentServer.code, currentRaidState.isDefeated]);

  // Logs and unread defense tracking
  const [raidLogs, setRaidLogs] = useState<RaidLog[]>([]);

  // Auto-prune raid logs older than 3 days (continuous 3-day countdown from appearance)
  useEffect(() => {
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const pruneExpiredLogs = () => {
      const now = Date.now();
      setRaidLogs(prev => {
        const filtered = prev.filter(log => {
          if (!log.createdAt) return true;
          return now - log.createdAt < THREE_DAYS_MS;
        });
        return filtered.length !== prev.length ? filtered : prev;
      });
    };

    pruneExpiredLogs();
    const interval = setInterval(pruneExpiredLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Unread enemy assaults on my ship (defense logs only)
  const unreadDefenseCount = useMemo(() => {
    return raidLogs.filter(log => log.type === 'defense' && !log.viewed).length;
  }, [raidLogs]);

  const markDefenseLogsAsRead = useCallback(() => {
    setRaidLogs(prev => {
      let hasUnread = false;
      const updated = prev.map(log => {
        if (log.type === 'defense' && !log.viewed) {
          hasUnread = true;
          return { ...log, viewed: true };
        }
        return log;
      });
      return hasUnread ? updated : prev;
    });
  }, []);

  // ==================== SEA GAME MODE SELECTION ====================
  const [seaGameMode, setSeaGameMode] = useState<SeaGameMode>(() => {
    try {
      const saved = localStorage.getItem('pirate_sea_game_mode');
      if (saved === 'bombing' || saved === 'raid' || saved === 'treasure') {
        return saved;
      }
    } catch (e) {
      console.error(e);
    }
    return 'bombing';
  });

  useEffect(() => {
    try {
      localStorage.setItem('pirate_sea_game_mode', seaGameMode);
    } catch (e) {}
  }, [seaGameMode]);

  // ==================== TREASURE HUNT SYSTEM (UTC+7 COUNTDOWN & CLEAN FEED) ====================
  // Calculate next 24-hour reset time (00:00:00 midnight UTC+7)
  const calculateNextResetTime = (): number => {
    return getNextTreasureResetTimeUtc7(Date.now());
  };

  const [treasureResetTime, setTreasureResetTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pirate_treasure_reset_time_utc7');
      if (saved) {
        const time = parseInt(saved, 10);
        if (!isNaN(time) && time > Date.now()) {
          return time;
        }
      }
    } catch (e) {}
    const nextTime = calculateNextResetTime();
    try {
      localStorage.setItem('pirate_treasure_reset_time_utc7', nextTime.toString());
    } catch (e) {}
    return nextTime;
  });

  const [todayLoot, setTodayLoot] = useState<UserTodayLoot>(() => {
    try {
      const saved = localStorage.getItem('pirate_walk_today_loot_utc7');
      if (saved) {
        const parsed = JSON.parse(saved);
        const todayStr = getUtc7DateString(Date.now());
        if (parsed.date === todayStr && parsed.loot) {
          return parsed.loot;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return {
      totalChestsOpened: 0,
      totalCoins: 0,
      totalGems: 0,
      secretRelics: [],
      claimedHistory: [],
    };
  });

  // Server-isolated Daily Treasures of the Day
  const [serverTreasuresMap, setServerTreasuresMap] = useState<Record<string, ServerTreasure[]>>(() => {
    try {
      const saved = localStorage.getItem('pirate_server_treasures_map_utc7');
      const savedDate = localStorage.getItem('pirate_server_treasures_date_utc7');
      const todayStr = getUtc7DateString(Date.now());
      if (saved && savedDate === todayStr) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch (e) {}

    // Initialize distinct daily treasures for each server
    const initialMap: Record<string, ServerTreasure[]> = {};
    INITIAL_SERVERS.forEach((server) => {
      initialMap[server.code] = generateDailyTreasures(
        server.code,
        DEFAULT_COORDS.lat,
        DEFAULT_COORDS.lng,
        undefined,
        ['dec_jolly_roger']
      );
    });
    return initialMap;
  });

  useEffect(() => {
    try {
      localStorage.setItem('pirate_server_treasures_map_utc7', JSON.stringify(serverTreasuresMap));
      localStorage.setItem('pirate_server_treasures_date_utc7', getUtc7DateString(Date.now()));
    } catch (e) {}
  }, [serverTreasuresMap]);

  // Server-isolated Treasure Hunting Feed Logs (NO PLACEHOLDERS)
  const [treasureLogsMap, setTreasureLogsMap] = useState<Record<string, TreasureActivityLog[]>>(() => {
    try {
      const saved = localStorage.getItem('pirate_server_treasure_logs_clean_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          const cleaned: Record<string, TreasureActivityLog[]> = {};
          Object.keys(parsed).forEach(k => {
            cleaned[k] = (parsed[k] || []).filter((l: TreasureActivityLog) => 
              !l.id.includes('_init') && !l.id.includes('_init_auto')
            );
          });
          return cleaned;
        }
      }
    } catch (e) {}

    const initialMap: Record<string, TreasureActivityLog[]> = {};
    INITIAL_SERVERS.forEach((server) => {
      initialMap[server.code] = [];
    });
    return initialMap;
  });

  useEffect(() => {
    try {
      localStorage.setItem('pirate_server_treasure_logs_clean_v1', JSON.stringify(treasureLogsMap));
    } catch (e) {}
  }, [treasureLogsMap]);

  // Ensure active server always has treasures populated
  useEffect(() => {
    const code = currentServer.code;
    setServerTreasuresMap(prev => {
      if (!prev[code] || prev[code].length === 0) {
        return {
          ...prev,
          [code]: generateDailyTreasures(
            code,
            DEFAULT_COORDS.lat,
            DEFAULT_COORDS.lng,
            undefined,
            ownedDecorations
          ),
        };
      }
      return prev;
    });
  }, [currentServer.code, ownedDecorations]);

  // Periodic 24-Hour Reset Monitor in UTC+7 (checks every second)
  useEffect(() => {
    const checkReset = () => {
      if (Date.now() >= treasureResetTime) {
        const nextTime = calculateNextResetTime();
        setTreasureResetTime(nextTime);
        try {
          localStorage.setItem('pirate_treasure_reset_time_utc7', nextTime.toString());
        } catch (e) {}

        // Reset today's plunder stash for new UTC+7 day
        const freshLoot: UserTodayLoot = {
          totalChestsOpened: 0,
          totalCoins: 0,
          totalGems: 0,
          secretRelics: [],
          claimedHistory: [],
        };
        setTodayLoot(freshLoot);
        try {
          localStorage.setItem('pirate_walk_today_loot_utc7', JSON.stringify({
            date: getUtc7DateString(Date.now()),
            loot: freshLoot,
          }));
        } catch (e) {}

        // Respawn fresh daily treasures across all servers
        const freshTreasuresMap: Record<string, ServerTreasure[]> = {};
        servers.forEach((server) => {
          freshTreasuresMap[server.code] = generateDailyTreasures(
            server.code,
            DEFAULT_COORDS.lat,
            DEFAULT_COORDS.lng,
            undefined,
            ownedDecorations
          );
        });
        setServerTreasuresMap(freshTreasuresMap);

        // Reset logs feed for new day
        const cleanLogs: Record<string, TreasureActivityLog[]> = {};
        servers.forEach((server) => {
          cleanLogs[server.code] = [];
        });
        setTreasureLogsMap(cleanLogs);
      }
    };

    const interval = setInterval(checkReset, 1000);
    return () => clearInterval(interval);
  }, [treasureResetTime, servers, ownedDecorations]);

  // Current server's daily treasures
  const serverTreasures: ServerTreasure[] = serverTreasuresMap[currentServer.code] || [];

  // Current server's hunting feed (strictly isolated to current server)
  const treasureLogs: TreasureActivityLog[] = (treasureLogsMap[currentServer.code] || []).filter(
    (log) => !log.serverCode || log.serverCode === currentServer.code
  );

  // Respawn or update daily treasures on current server
  const spawnNewDailyTreasures = (force: boolean = false, centerLat?: number, centerLng?: number) => {
    const lat = centerLat || DEFAULT_COORDS.lat;
    const lng = centerLng || DEFAULT_COORDS.lng;
    const newTreasures = generateDailyTreasures(
      currentServer.code,
      lat,
      lng,
      undefined,
      ownedDecorations
    );
    setServerTreasuresMap(prev => ({
      ...prev,
      [currentServer.code]: newTreasures,
    }));
    soundFx.playVictory();
  };

  // Claim a treasure (Server-Wide Isolated: only treasures in currentServer can be claimed)
  const claimTreasure = (treasureId: string): { reward: TreasureRewardType; success: boolean } | null => {
    const currentList = serverTreasuresMap[currentServer.code] || [];
    const target = currentList.find(t => t.id === treasureId);
    if (!target || target.isClaimed || target.serverCode !== currentServer.code) {
      return null;
    }

    // Mark claimed in this server's treasure pool only
    setServerTreasuresMap(prev => {
      const serverList = prev[currentServer.code] || [];
      return {
        ...prev,
        [currentServer.code]: serverList.map(t => 
          t.id === treasureId 
            ? { ...t, isClaimed: true, claimedBy: profile.username, claimedAt: Date.now() }
            : t
        ),
      };
    });

    const reward = target.reward;

    // Apply rewards
    if (reward.type === 'coins') {
      setCoins(c => c + reward.amount);
    } else if (reward.type === 'gems') {
      setGems(g => g + reward.amount);
    } else if (reward.type === 'secret_item') {
      const secretItem = reward.secretItem;
      setOwnedDecorations(prev => {
        if (!prev.includes(secretItem.id)) {
          return [...prev, secretItem.id];
        }
        return prev;
      });
      setEquippedDecorations(prev => {
        if (!prev.includes(secretItem.id)) {
          return [...prev, secretItem.id];
        }
        return prev;
      });
    }

    // Update Today's Loot record
    setTodayLoot(prev => {
      const newCoins = reward.type === 'coins' ? prev.totalCoins + reward.amount : prev.totalCoins;
      const newGems = reward.type === 'gems' ? prev.totalGems + reward.amount : prev.totalGems;
      const newRelics = reward.type === 'secret_item' && !prev.secretRelics.some(r => r.id === reward.secretItem.id)
        ? [...prev.secretRelics, reward.secretItem]
        : prev.secretRelics;
      
      const updated: UserTodayLoot = {
        totalChestsOpened: prev.totalChestsOpened + 1,
        totalCoins: newCoins,
        totalGems: newGems,
        secretRelics: newRelics,
        claimedHistory: [
          {
            id: target.id,
            title: target.title,
            reward,
            claimedAt: Date.now(),
          },
          ...prev.claimedHistory,
        ],
      };

      try {
        localStorage.setItem('pirate_walk_today_loot', JSON.stringify({
          date: new Date().toDateString(),
          loot: updated,
        }));
      } catch (e) {}

      return updated;
    });

    // Add activity log to current server's feed only
    const userLogId = `tlog_user_${currentServer.code}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const userLog: TreasureActivityLog = {
      id: userLogId,
      serverCode: currentServer.code,
      playerName: profile.username,
      avatarUrl: profile.avatarUrl,
      serverName: currentServer.name,
      locationName: 'Captain Radar Range',
      rewardLabel: reward.label,
      rarity: target.rarity,
      timestamp: Date.now(),
      isUser: true,
    };

    setTreasureLogsMap(prev => ({
      ...prev,
      [currentServer.code]: [userLog, ...(prev[currentServer.code] || []).slice(0, 19)],
    }));

    soundFx.playVictory();
    gainXp(reward.rarity === 'legendary' ? 250 : reward.rarity === 'rare' ? 100 : reward.rarity === 'uncommon' ? 50 : 25);

    return { reward, success: true };
  };

  const totalDailyTreasures = serverTreasures.length;
  const remainingTreasuresCount = serverTreasures.filter(t => !t.isClaimed).length;

  // Add Steps & Reward logic:
  // 100 steps = 10 coins (added to possessed gold). Exactly 10 coins per 100 steps.
  // WALKING DOES NOT GAIN EXP (only bombing and daily quests gain EXP for leveling up).
  // 1 step = 1 HP boss damage during raid.
  const addSteps = (amount: number) => {
    if (amount <= 0) return;

    const prev = totalStepsTodayRef.current;
    const updated = prev + amount;
    totalStepsTodayRef.current = updated;

    const prevEligibleCoins = Math.floor(prev / 100) * 10;
    const newEligibleCoins = Math.floor(updated / 100) * 10;
    const coinsToAdd = newEligibleCoins - prevEligibleCoins;

    setTotalStepsToday(updated);

    if (coinsToAdd > 0) {
      setCoins(c => c + coinsToAdd);
      setStepCoinsAwardedToday(awarded => {
        const next = awarded + coinsToAdd;
        try {
          const todayKey = new Date().toISOString().split('T')[0];
          localStorage.setItem(`seastride_step_coins_awarded_${todayKey}`, String(next));
        } catch (e) {}
        return next;
      });
      soundFx.playCoin();
    }

    // NOTE: Walking does NOT gain EXP for leveling up (only bombing other ships and daily quests gain EXP)

    // If user has joined the raid and it's active, every step counts as 1 HP damage!
    if (currentRaidState.hasJoined && !currentRaidState.isDefeated) {
      dealRaidDamage(amount, false);
    }

    // update today's record in chart
    setStepRecords(prevRecords => {
      const next = [...prevRecords];
      const todayIndex = next.length - 1;
      if (todayIndex >= 0) {
        next[todayIndex] = { ...next[todayIndex], steps: next[todayIndex].steps + amount };
      }
      return next;
    });
  };

  // Auto walk simulator timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAutoWalking) {
      interval = setInterval(() => {
        addSteps(15);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAutoWalking]);

  // Step statistics
  const weeklyTotal = stepRecords.reduce((acc, r) => acc + r.steps, 0);
  const stepStats: StepStats = {
    dailyAverage: Math.round(weeklyTotal / stepRecords.length),
    weeklyAverage: Math.round(weeklyTotal),
    monthlyAverage: Math.round((weeklyTotal / 7) * 30),
    totalStepsToday,
    stepsToNextReward: 100 - (totalStepsToday % 100),
  };

  const toggleAutoWalk = () => {
    setIsAutoWalking(prev => !prev);
    soundFx.playClick();
  };

  const toggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  // Switch server
  const switchServer = async (serverCode: string, customServerName?: string) => {
    if (!currentAccount) {
      const target = servers.find((s) => s.code === serverCode);
      if (target) {
        setCurrentServer(target);
        soundFx.playClick();
      }
      return;
    }

    const stats = {
      ship_level: shipLevel,
      ship_condition: shipCondition,
      current_hp: shipCurrentHp,
      max_hp: shipMaxHp,
      cannon_level: cannonLevel,
      cannon_count: cannonCount,
      shield_level: shieldLevel,
      avatar_url: profile?.avatarUrl || '',
    };

    try {
      const res = await joinSpecificServer(
        currentAccount.id,
        currentAccount.username,
        stats,
        serverCode,
        customServerName
      );

      if (res && res.success) {
        setAssignedServerId(res.server_id);
        const [dbPlayers, allServers] = await Promise.all([
          fetchServerPlayers(res.server_id),
          fetchAvailableServers(),
        ]);

        const mappedPlayers: Player[] = dbPlayers
          .filter((p) => p.account_id !== currentAccount.id)
          .map((p) => ({
            id: p.account_id,
            name: p.username,
            title: p.ship_level >= 5 ? 'Fleet Commander' : 'Sea Strider',
            avatarUrl: p.avatar_url || PIRATE_AVATARS[0].url,
            shipLevel: p.ship_level,
            shipCondition: p.ship_condition,
            currentHp: p.current_hp,
            maxHp: p.max_hp,
            cannonLevel: p.cannon_level,
            cannonCount: p.cannon_count,
            shieldLevel: p.shield_level,
            equippedDecorations: p.equipped_decorations || [],
            isOnline: p.is_online,
          }));

        const isPriv = res.server_code.startsWith('PRIV-');
        const newServer: ServerInfo = {
          code: res.server_code,
          type: res.server_type || (isPriv ? 'private' : 'global'),
          name:
            res.server_name ||
            (isPriv
              ? `Private Island (${res.server_code})`
              : `Global Fleet ${res.server_code.split('-')[1] || '1'}`),
          playerCount: mappedPlayers.length + 1,
          maxPlayers: res.max_players || 30,
          players: mappedPlayers,
        };

        setCurrentServer(newServer);
        if (allServers && allServers.length > 0) {
          setServers(allServers);
        }

        // Persist preferred server choice
        savePlayerProgress(currentAccount.id, {
          last_server_code: res.server_code,
        });

        soundFx.playClick();
      }
    } catch (e) {
      console.error('Failed to switch server:', e);
    }
  };

  // Create private beach server
  const createPrivateServer = async (serverName: string): Promise<string> => {
    if (gems < 10) {
      alert('Not enough gems! Creating a Private Beach costs 10 gems.');
      return '';
    }
    setGems((g) => g - 10);
    const newCode = `PRIV-${Math.floor(100 + Math.random() * 900)}`;
    await switchServer(newCode, serverName.trim());
    soundFx.playVictory();
    return newCode;
  };

  // BOMB / Attack Player logic
  const attackPlayer = (target: Player, minigameResult?: 'win' | 'lose'): BattleResult | null => {
    if (energy < 1) {
      alert('Not enough Energy! You need 1 Energy to launch a Bomb raid. Energy refills daily!');
      return null;
    }
    if (shipCondition <= 0) {
      alert('Ship is destroyed (0% condition)! Repair or rebuild your ship before entering battle.');
      return null;
    }

    setEnergy(e => e - 1);
    soundFx.playCannonBomb();

    // Damage calculation: sum of equipped cannons' damage * condition factor
    const baseDamage = equippedCannons.reduce((sum, id) => {
      const c = ownedCannons.find(x => x.id === id);
      return sum + (c ? 2500 + (c.level - 1) * 2500 : 0);
    }, 0);
    const rawDamage = Math.round(baseDamage * (shipCondition / 100));

    // Shield damage reduction logic:
    // Each level of enemy shield reduces incoming bomb damage by 15% (Lv.1: 15%, Lv.2: 30%, Lv.3: 45%, capped at 75%)
    const enemyShieldLevel = target.shieldLevel || 0;
    const shieldReductionPercent = enemyShieldLevel > 0 ? Math.min(75, enemyShieldLevel * 15) : 0;
    const shieldReducedDamage = Math.round(rawDamage * (shieldReductionPercent / 100));
    const actualDamage = Math.max(1, rawDamage - shieldReducedDamage);
    const shieldBlocked = shieldReductionPercent > 0;

    // Apply minigame result modifiers
    let finalDamage = actualDamage;
    if (minigameResult === 'win') {
      finalDamage = Math.round(actualDamage * 1.2); // 20% boost
    } else if (minigameResult === 'lose') {
      finalDamage = Math.round(actualDamage * 0.5); // reduced damage (Glance Hit)
    }

    // Target HP logic
    const enemyRemainingHp = Math.max(0, target.currentHp - finalDamage);
    const enemyHpPercent = Math.round((enemyRemainingHp / target.maxHp) * 100);

    // Damage percentage relative to target's existing HP before attack
    const hpReduced = target.currentHp - enemyRemainingHp;
    const hpRatioReduced = target.currentHp > 0 ? (hpReduced / target.currentHp) : 1;

    let coinsEarned = 0;
    if (hpRatioReduced >= 1) {
      coinsEarned = 150; // 100% of existing HP destroyed
    } else if (hpRatioReduced >= 0.5) {
      coinsEarned = 100; // 50% of existing HP
    } else if (hpRatioReduced >= 0.3) {
      coinsEarned = 50;  // 30% of existing HP
    } else {
      coinsEarned = 25;  // minor hit
    }

    // Apply PERFECT HIT gold coin bonus
    if (minigameResult === 'win') {
      coinsEarned = Math.round(coinsEarned * 1.5);
    }

    // 1% chance for gems drop
    const dropGemChance = Math.random();
    const gemsEarned = dropGemChance <= 0.05 ? 1 : 0; // boosted slightly to 5% for fun demo feel!

    // Cannon Looting logic: if enemy ship HP drops below 30%, chance to loot their cannon
    // If minigameResult === 'lose', Cannon Loot chance is forced to 0%
    let cannonLooted = false;
    let lootedCannonLevel = target.cannonLevel || 1;
    if (minigameResult !== 'lose' && enemyHpPercent < 30 && target.cannonCount > 0) {
      const lootChance = Math.random();
      if (lootChance <= 0.6) {
        cannonLooted = true;
        const newId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        setOwnedCannons(prev => [...prev, { id: newId, level: lootedCannonLevel }]);
      }
    }

    setCoins(c => c + coinsEarned);
    if (gemsEarned > 0) setGems(g => g + gemsEarned);

    // Level XP gain from bombing other ships (10-50 EXP depending on hit quality)
    let xpEarned = 25;
    if (minigameResult === 'win') {
      // Perfect Hit / Bullseye
      xpEarned = 50;
    } else if (minigameResult === 'lose') {
      // Glance Hit / Deflected
      xpEarned = 10;
    } else {
      // Direct hit: calculate based on damage impact ratio
      if (hpRatioReduced >= 0.75) {
        xpEarned = 45;
      } else if (hpRatioReduced >= 0.5) {
        xpEarned = 35;
      } else if (hpRatioReduced >= 0.25) {
        xpEarned = 25;
      } else {
        xpEarned = 15;
      }
    }
    gainXp(xpEarned);

    // Update target player in current server and server list
    const updatedTargetPlayer: Player = {
      ...target,
      currentHp: enemyRemainingHp,
      shipCondition: enemyHpPercent,
      cannonCount: cannonLooted ? Math.max(0, target.cannonCount - 1) : target.cannonCount,
    };

    // Broadcast target damage state to server
    updateShipState(target.id, {
      hp: enemyRemainingHp,
      condition: enemyHpPercent,
      cannon_count: updatedTargetPlayer.cannonCount,
    });
    applyDamageToPlayer(target.id, enemyRemainingHp, enemyHpPercent);

    setServers(prevServers =>
      prevServers.map(srv => {
        if (srv.code === currentServer.code) {
          return {
            ...srv,
            players: srv.players.map(p => (p.id === target.id ? updatedTargetPlayer : p)),
          };
        }
        return srv;
      })
    );

    setCurrentServer(prev => ({
      ...prev,
      players: prev.players.map(p => (p.id === target.id ? updatedTargetPlayer : p)),
    }));

    // Log the raid (My Strikes)
    const newLog: RaidLog = {
      id: `log_${Date.now()}`,
      timestamp: 'Just now',
      createdAt: Date.now(),
      type: 'attack',
      opponentName: target.name,
      outcome: 'victory',
      coinsChange: coinsEarned,
      damage: finalDamage,
      cannonLostOrWon: cannonLooted ? `Looted Lv${lootedCannonLevel} Cannon!` : undefined,
      viewed: true,
    };
    setRaidLogs(prev => [newLog, ...prev]);
    if (currentAccount) { addGameRecord(currentAccount.id, 'raid_log', newLog); }

    // Add defense log for the target player
    const targetDefenseLog: RaidLog = {
      id: `defense_${Date.now()}`,
      timestamp: 'Just now',
      createdAt: Date.now(),
      type: 'defense',
      opponentName: currentAccount ? currentAccount.username : 'Unknown Captain',
      outcome: 'defended',
      coinsChange: -coinsEarned, // Target loses what you earned? (Actually we can just say 0 or negative)
      damage: finalDamage,
      viewed: false,
    };
    addGameRecord(target.id, 'raid_log', targetDefenseLog);

    // 40% chance of an enemy assault retaliation after attacking
    if (Math.random() <= 0.4) {
      setTimeout(() => {
        const incomingDamage = Math.floor(40 + Math.random() * 80);
        const coinsLost = Math.floor(10 + Math.random() * 25);
        setShipCondition(sc => Math.max(10, sc - Math.floor(incomingDamage / 25)));
        const counterAssaultLog: RaidLog = {
          id: `defense_${Date.now()}`,
          timestamp: 'Just now',
          createdAt: Date.now(),
          type: 'defense',
          opponentName: target.name,
          outcome: 'defended',
          coinsChange: -coinsLost,
          damage: incomingDamage,
          viewed: false,
        };
        setRaidLogs(prev => [counterAssaultLog, ...prev]);
        if (currentAccount) { addGameRecord(currentAccount.id, 'raid_log', counterAssaultLog); }
        soundFx.playCannonBomb();
      }, 4000);
    }

    return {
      targetPlayer: updatedTargetPlayer,
      damageDealt: finalDamage,
      rawDamage,
      shieldReducedDamage,
      shieldReductionPercent,
      enemyRemainingHpPercent: enemyHpPercent,
      coinsEarned,
      gemsEarned,
      cannonLooted,
      lootedCannonLevel,
      shieldBlocked,
      minigameResult,
      xpEarned,
    };
  };

  // Repair ship (5 coins per 5% condition)
  const repairShip = (percentToRepair: number): boolean => {
    if (shipCondition === 0) {
      alert('Ship condition is at 0%! You must REBUILD the ship first.');
      return false;
    }
    const cost = Math.ceil(percentToRepair / 5) * 5;
    if (coins < cost) {
      alert(`Not enough coins! Repairing costs ${cost} coins.`);
      return false;
    }

    setCoins(c => c - cost);
    setShipCondition(prev => Math.min(100, prev + percentToRepair));
    soundFx.playUpgrade();
    return true;
  };

  // Rebuild ship from 0% to 50% (costs 100 coins)
  const rebuildShip = (): boolean => {
    if (shipCondition > 0) {
      alert('Ship is not destroyed (condition > 0%). Use Repair instead!');
      return false;
    }
    if (coins < 100) {
      alert('Not enough coins! Rebuilding requires 100 coins.');
      return false;
    }

    setCoins(c => c - 100);
    setShipCondition(50);
    soundFx.playUpgrade();
    return true;
  };

  // Upgrade Ship: Lv1->2 costs 1000, Lv2->3 costs 1500, Lv3->4 costs 2000... (+500 coins per level)
  const upgradeShip = (): boolean => {
    if (shipLevel >= 10) {
      alert('Ship is already at max level (10)!');
      return false;
    }
    const cost = shipLevel === 1 ? 1000 : 1000 + (shipLevel - 1) * 500;
    if (coins < cost) {
      alert(`Not enough coins! Ship upgrade costs ${cost} coins.`);
      return false;
    }

    setCoins(c => c - cost);
    setShipLevel(l => l + 1);
    soundFx.playUpgrade();
    return true;
  };

  // Buy or Upgrade Cannons: 100 coins to buy/upgrade
  const buyCannon = (): boolean => {
    if (coins < 100) {
      alert('Not enough coins! Cannons cost 100 coins.');
      return false;
    }

    setCoins(c => c - 100);
    const newId = `c_${Date.now()}`;
    setOwnedCannons(prev => [...prev, { id: newId, level: 1 }]);
    // Auto equip if space available
    if (equippedCannons.length < 6) {
      setEquippedCannons(prev => [...prev, newId]);
    }
    soundFx.playUpgrade();
    return true;
  };

  const upgradeCannon = (id: string): boolean => {
    const cannon = ownedCannons.find(c => c.id === id);
    if (!cannon) return false;
    
    if (cannon.level >= 10) {
      alert('Cannon is at maximum level (10)!');
      return false;
    }
    if (coins < 100) {
      alert('Not enough coins! Cannon upgrade costs 100 coins.');
      return false;
    }

    setCoins(c => c - 100);
    setOwnedCannons(prev => prev.map(c => c.id === id ? { ...c, level: c.level + 1 } : c));
    soundFx.playUpgrade();
    return true;
  };
  
  const equipCannon = (id: string) => {
    if (equippedCannons.includes(id)) return;
    if (equippedCannons.length >= 6) {
      alert('Maximum cannons equipped (6)! Unequip one first.');
      return;
    }
    setEquippedCannons(prev => [...prev, id]);
    soundFx.playClick();
  };
  
  const unequipCannon = (id: string) => {
    setEquippedCannons(prev => prev.filter(c => c !== id));
    soundFx.playClick();
  };

  // Shield: Lv 1-3, 100 coins to buy/upgrade
  const buyShield = (): boolean => {
    if (coins < 100) {
      alert('Not enough coins! Shield costs 100 coins.');
      return false;
    }
    setCoins(c => c - 100);
    const newId = `s_${Date.now()}`;
    setOwnedShields(prev => [...prev, { id: newId, level: 1 }]);
    if (!equippedShield) {
      setEquippedShield(newId);
    }
    soundFx.playUpgrade();
    return true;
  };

  const upgradeShield = (id: string): boolean => {
    const shield = ownedShields.find(s => s.id === id);
    if (!shield) return false;
    if (shield.level >= 3) {
      alert('Shield is at max level (3)!');
      return false;
    }
    if (coins < 100) {
      alert('Not enough coins! Shield costs 100 coins.');
      return false;
    }

    setCoins(c => c - 100);
    setOwnedShields(prev => prev.map(s => s.id === id ? { ...s, level: s.level + 1 } : s));
    // If it's equipped, refill charges
    if (equippedShield === id) {
      setShieldCharges(shield.level + 1);
    }
    soundFx.playUpgrade();
    return true;
  };
  
  const equipShield = (id: string) => {
    setEquippedShield(id);
    soundFx.playClick();
  };
  
  const unequipShield = () => {
    setEquippedShield(null);
    soundFx.playClick();
  };

  // Shop Decor Purchase
  const buyDecoration = (decId: string, currency: 'coins' | 'gems', price: number): boolean => {
    if (ownedDecorations.includes(decId)) {
      alert('You already own this decoration!');
      return false;
    }
    if (currency === 'coins') {
      if (coins < price) {
        alert(`Not enough coins! Required: ${price}`);
        return false;
      }
      setCoins(c => c - price);
    } else {
      if (gems < price) {
        alert(`Not enough gems! Required: ${price}`);
        return false;
      }
      setGems(g => g - price);
    }

    setOwnedDecorations(prev => [...prev, decId]);
    setEquippedDecorations(prev => [...prev, decId]);
    soundFx.playVictory();
    return true;
  };

  const toggleEquipDecoration = (decId: string) => {
    if (equippedDecorations.includes(decId)) {
      setEquippedDecorations(prev => prev.filter(id => id !== decId));
    } else {
      setEquippedDecorations(prev => [...prev, decId]);
    }
    soundFx.playClick();
  };

  // Watch Ad for Gems (+1 gem, maximum 3 times a day)
  const watchAdForGems = (): boolean => {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('pirate_ad_date');
    let currentCount = dailyAdWatches;
    if (savedDate !== today) {
      currentCount = 0;
    }
    
    if (currentCount >= maxDailyAds) {
      alert(`You have already claimed all ${maxDailyAds} daily broadcast rewards today! Check back tomorrow.`);
      return false;
    }

    const nextCount = currentCount + 1;
    setDailyAdWatches(nextCount);
    try {
      localStorage.setItem('pirate_ad_date', today);
      localStorage.setItem('pirate_ad_count', nextCount.toString());
    } catch (e) {}

    setGems(g => g + 1);
    soundFx.playVictory();
    return true;
  };

  // In-App Purchase Gems Tier
  const buyGemsIAP = (tier: { id: string; name: string; price: string; gems: number }) => {
    setGems(g => g + tier.gems);
    soundFx.playVictory();
  };

  // Exchange Gems for Gold Coins
  const exchangeGemsForCoins = (tier: { id: string; name: string; gemsCost: number; coinsReward: number }): boolean => {
    if (gems < tier.gemsCost) {
      alert(`Not enough gems! Required: ${tier.gemsCost} 💎 gems.`);
      return false;
    }
    setGems(g => g - tier.gemsCost);
    setCoins(c => c + tier.coinsReward);
    soundFx.playVictory();
    return true;
  };

  return (
    <GameContext.Provider
      value={{
        coins,
        gems,
        energy,
        maxEnergy,
        profile,
        updateProfile,
        shipLevel,
        shipCondition,
        shipMaxHp,
        shipCurrentHp,
        ownedCannons,
        equippedCannons,
        ownedShields,
        equippedShield,
        cannonLevel,
        cannonCount,
        shieldLevel,
        shieldCharges,
        ownedDecorations,
        equippedDecorations,
        currentServer,
        servers,
        switchServer,
        createPrivateServer,
        refreshServerPlayers,
        totalStepsToday,
        stepRecords,
        dailyCoinsHistory,
        stepStats,
        addSteps,
        isAutoWalking,
        toggleAutoWalk,
        playerLevel,
        playerXp,
        gainXp,
        questIndex,
        questXp,
        claimedQuests,
        claimQuest,
        raidSessionInfo,
        currentRaidState,
        currentMonster,
        raidCombatLogs,
        joinRaid,
        dealRaidDamage,
        claimRaidPrize,
        claimMilestoneBounty,
        respawnRaidBoss,
        serverTreasures,
        treasureLogs,
        todayLoot,
        claimTreasure,
        spawnNewDailyTreasures,
        totalDailyTreasures,
        remainingTreasuresCount,
        treasureResetTime,
        seaGameMode,
        setSeaGameMode,
        attackPlayer,
        repairShip,
        rebuildShip,
        upgradeShip,
        buyCannon,
        upgradeCannon,
        equipCannon,
        unequipCannon,
        buyShield,
        upgradeShield,
        equipShield,
        unequipShield,
        buyDecoration,
        toggleEquipDecoration,
        watchAdForGems,
        dailyAdWatches,
        maxDailyAds,
        buyGemsIAP,
        exchangeGemsForCoins,
        isGemsModalOpen,
        isCoinsModalOpen,
        openGemsModal,
        openCoinsModal,
        closeGemsModal,
        closeCoinsModal,
        isShopModalOpen,
        openShopModal,
        closeShopModal,
        raidLogs,
        unreadDefenseCount,
        markDefenseLogsAsRead,
        isMuted,
        toggleMute,
        language,
        changeLanguage,
        toggleLanguage,
        t,
        // Supabase Account
        currentAccount,
        isAccountModalOpen,
        accountError,
        clearAccountError,
        registerNewAccount,
        loginExistingAccount,
        logoutAccount,
        openAccountModal,
        closeAccountModal,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
