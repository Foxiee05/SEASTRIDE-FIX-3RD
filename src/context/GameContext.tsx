import React, { createContext, useContext, useState, useEffect } from 'react';
import { Player, ServerInfo, BattleResult, RaidLog, StepRecord, StepStats, DailyCoinRecord, CannonItem, ShieldItem, ServerRaidState, SeaMonsterConfig, SeaMonsterId, RaidParticipant, ServerTreasure, TreasureActivityLog, TreasureRewardType, Decoration, UserTodayLoot, SeaGameMode } from '../types';
import { INITIAL_SERVERS } from '../data/mockPlayers';
import { SEA_MONSTERS } from '../data/monsters';
import { soundFx } from '../utils/audio';
import { PIRATE_AVATARS } from '../assets';
import { generateDailyTreasures, rollTreasureReward, getRarityMetadata } from '../utils/treasureRewards';
import { DEFAULT_COORDS } from '../hooks/useGpsTracker';

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
  switchServer: (serverCode: string) => void;
  createPrivateServer: (serverName: string) => string;
  
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
  currentRaidState: ServerRaidState;
  currentMonster: SeaMonsterConfig;
  raidCombatLogs: RaidCombatLog[];
  joinRaid: (serverCode?: string) => void;
  dealRaidDamage: (amount: number, isDirectAttack?: boolean) => { damageDealt: number; isCritical: boolean; bossDefeated: boolean };
  claimRaidPrize: () => { coinsWon: number; gemsWon: number; percent: number; chestName: string } | null;
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
  attackPlayer: (target: Player) => BattleResult | null;
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
  watchAdForGems: () => void;
  
  // Logs
  raidLogs: RaidLog[];
  
  // Audio state
  isMuted: boolean;
  toggleMute: () => void;
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
  const [coins, setCoins] = useState<number>(1250);
  const [gems, setGems] = useState<number>(20);
  const [energy, setEnergy] = useState<number>(5);
  const maxEnergy = 5;

  // Profile State
  const [profile, setProfile] = useState<PlayerProfile>({
    username: 'Captain Blackbeard',
    aboutMe: 'Sailing the Seven Seas in search of legendary step treasures and gold!',
    avatarUrl: PIRATE_AVATARS[0]?.url || '',
  });

  const updateProfile = (newProfile: Partial<PlayerProfile>) => {
    setProfile(prev => ({ ...prev, ...newProfile }));
    soundFx.playUpgrade();
  };

  // Player Ship Specs
  const [shipLevel, setShipLevel] = useState<number>(1);
  const [shipCondition, setShipCondition] = useState<number>(95);
  
  // Equipment
  const [ownedCannons, setOwnedCannons] = useState<CannonItem[]>([{ id: 'c_1', level: 1 }]);
  const [equippedCannons, setEquippedCannons] = useState<string[]>(['c_1']);
  const [ownedShields, setOwnedShields] = useState<ShieldItem[]>([]);
  const [equippedShield, setEquippedShield] = useState<string | null>(null);

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

  // Player Level & XP (500 XP per level, grants 200 coins on every level up)
  const [playerLevel, setPlayerLevel] = useState<number>(1);
  const [playerXp, setPlayerXp] = useState<number>(250);

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

  // Raid State per Server with Random Boss Spawned on Launch
  const [raidStates, setRaidStates] = useState<Record<string, ServerRaidState>>(() => {
    const ALL_MONSTER_KEYS: SeaMonsterId[] = ['megalodon', 'siren', 'scylla', 'kraken'];
    const initialMap: Record<string, ServerRaidState> = {};

    INITIAL_SERVERS.forEach((server) => {
      // Pick a random sea monster boss each time the app opens
      const bossId: SeaMonsterId = ALL_MONSTER_KEYS[Math.floor(Math.random() * ALL_MONSTER_KEYS.length)];

      const monster = SEA_MONSTERS[bossId];
      const participants: RaidParticipant[] = server.players.slice(0, 8).map((p, idx) => {
        const damage = Math.round(monster.maxHp * (0.04 + ((8 - idx) / 8) * 0.05));
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
        bossId,
        currentHp,
        maxHp: monster.maxHp,
        participants,
        isDefeated: currentHp <= 0,
        dailyPrizeClaimed: false,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        hasJoined: false,
      };
    });
    return initialMap;
  });

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
  const currentRaidState: ServerRaidState = raidStates[currentServer.code] || {
    serverCode: currentServer.code,
    bossId: 'megalodon',
    currentHp: SEA_MONSTERS.megalodon.maxHp,
    maxHp: SEA_MONSTERS.megalodon.maxHp,
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
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    hasJoined: false,
  };

  const currentMonster = SEA_MONSTERS[currentRaidState.bossId] || SEA_MONSTERS.megalodon;

  // Join Raid Function
  const joinRaid = (targetServerCode?: string) => {
    const code = targetServerCode || currentServer.code;
    setRaidStates(prev => {
      const serverState = prev[code] || currentRaidState;
      if (serverState.hasJoined) return prev;

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

    const userParticipant = currentRaidState.participants.find(p => p.isUser || p.id === 'user_player');
    const userDamage = userParticipant ? userParticipant.damage : 0;
    const totalDamage = currentRaidState.participants.reduce((sum, p) => sum + p.damage, 0);

    if (userDamage <= 0 || totalDamage <= 0) {
      alert('You have not contributed any damage to this Sea Monster yet. Walk or strike to earn your share!');
      return null;
    }

    const pct = (userDamage / totalDamage);
    const coinsWon = Math.max(100, Math.round(currentMonster.totalPrizeCoins * pct));
    const gemsWon = Math.max(5, Math.round(currentMonster.totalPrizeGems * pct));

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

    setRaidLogs(prev => [
      {
        id: `raid_prize_${Date.now()}`,
        timestamp: 'Just now',
        type: 'attack',
        opponentName: currentMonster.shortName,
        outcome: 'victory',
        coinsChange: coinsWon,
        damage: userDamage,
        cannonLostOrWon: `Claimed ${(pct * 100).toFixed(1)}% Prize Pool: +${coinsWon} Coins & +${gemsWon} Gems!`,
      },
      ...prev,
    ]);

    return {
      coinsWon,
      gemsWon,
      percent: Math.round(pct * 1000) / 10,
      chestName: currentMonster.chestName,
    };
  };

  // Respawn or change monster
  const respawnRaidBoss = (newBossId?: SeaMonsterId) => {
    const nextBoss = newBossId || currentRaidState.bossId;
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
          bossId: nextBoss,
          maxHp: monster.maxHp,
          currentHp: monster.maxHp - totalNpcDamage,
          isDefeated: false,
          dailyPrizeClaimed: false,
          participants: resetParticipants,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
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

  // Logs
  const [raidLogs, setRaidLogs] = useState<RaidLog[]>([
    {
      id: 'log_1',
      timestamp: '10 mins ago',
      type: 'attack',
      opponentName: 'Calico Jack',
      outcome: 'victory',
      coinsChange: 100,
      damage: 5000,
      cannonLostOrWon: 'Looted Cannon Lv1!',
    },
    {
      id: 'log_2',
      timestamp: '1 hour ago',
      type: 'defense',
      opponentName: 'Redbeard Drake',
      outcome: 'defended',
      coinsChange: 0,
      damage: 2500,
    }
  ]);

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

  // ==================== TREASURE HUNT SYSTEM ====================
  // Calculate next 24-hour reset time (00:00:00 midnight)
  const calculateNextResetTime = (): number => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return nextMidnight.getTime();
  };

  const [treasureResetTime, setTreasureResetTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pirate_treasure_reset_time');
      if (saved) {
        const time = parseInt(saved, 10);
        if (!isNaN(time) && time > Date.now()) {
          return time;
        }
      }
    } catch (e) {}
    const nextTime = calculateNextResetTime();
    try {
      localStorage.setItem('pirate_treasure_reset_time', nextTime.toString());
    } catch (e) {}
    return nextTime;
  });

  const [todayLoot, setTodayLoot] = useState<UserTodayLoot>(() => {
    try {
      const saved = localStorage.getItem('pirate_walk_today_loot');
      if (saved) {
        const parsed = JSON.parse(saved);
        const todayStr = new Date().toDateString();
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
      const saved = localStorage.getItem('pirate_server_treasures_map_v3');
      const savedDate = localStorage.getItem('pirate_server_treasures_date_v3');
      const todayStr = new Date().toDateString();
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
      localStorage.setItem('pirate_server_treasures_map_v3', JSON.stringify(serverTreasuresMap));
      localStorage.setItem('pirate_server_treasures_date_v3', new Date().toDateString());
    } catch (e) {}
  }, [serverTreasuresMap]);

  // Server-isolated Treasure Hunting Feed Logs
  const [treasureLogsMap, setTreasureLogsMap] = useState<Record<string, TreasureActivityLog[]>>(() => {
    try {
      const saved = localStorage.getItem('pirate_server_treasure_logs_map_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch (e) {}

    const initialMap: Record<string, TreasureActivityLog[]> = {};
    INITIAL_SERVERS.forEach((server) => {
      const p1 = server.players[0] || { name: 'Captain Anne Bonny', avatarUrl: PIRATE_AVATARS[4]?.url || '' };
      const p2 = server.players[1] || { name: 'Firstmate Pete', avatarUrl: PIRATE_AVATARS[2]?.url || '' };
      initialMap[server.code] = [
        {
          id: `tlog_${server.code}_init_1`,
          serverCode: server.code,
          playerName: p1.name,
          avatarUrl: p1.avatarUrl || PIRATE_AVATARS[4]?.url || '',
          serverName: server.name,
          locationName: `${server.name} Cove (540m)`,
          rewardLabel: '1,000 Gold Coins',
          rarity: 'uncommon',
          timestamp: Date.now() - 120000,
          isUser: false,
        },
        {
          id: `tlog_${server.code}_init_2`,
          serverCode: server.code,
          playerName: p2.name,
          avatarUrl: p2.avatarUrl || PIRATE_AVATARS[2]?.url || '',
          serverName: server.name,
          locationName: `${server.name} Shoals (1.2km)`,
          rewardLabel: '100 Gold Coins',
          rarity: 'common',
          timestamp: Date.now() - 340000,
          isUser: false,
        }
      ];
    });
    return initialMap;
  });

  useEffect(() => {
    try {
      localStorage.setItem('pirate_server_treasure_logs_map_v3', JSON.stringify(treasureLogsMap));
    } catch (e) {}
  }, [treasureLogsMap]);

  // Ensure active server always has treasures and logs populated
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

    setTreasureLogsMap(prev => {
      if (!prev[code] || prev[code].length === 0) {
        const lead = currentServer.players[0] || { name: 'Quartermaster Jack', avatarUrl: PIRATE_AVATARS[1]?.url || '' };
        return {
          ...prev,
          [code]: [
            {
              id: `tlog_${code}_init_auto`,
              serverCode: code,
              playerName: lead.name,
              avatarUrl: lead.avatarUrl || PIRATE_AVATARS[1]?.url || '',
              serverName: currentServer.name,
              locationName: `${currentServer.name} Anchorage`,
              rewardLabel: '1,000 Gold Coins',
              rarity: 'uncommon',
              timestamp: Date.now() - 90000,
              isUser: false,
            }
          ],
        };
      }
      return prev;
    });
  }, [currentServer.code, currentServer.name, currentServer.players, ownedDecorations]);

  // Periodic 24-Hour Reset Monitor (checks every second)
  useEffect(() => {
    const checkReset = () => {
      if (Date.now() >= treasureResetTime) {
        const nextTime = calculateNextResetTime();
        setTreasureResetTime(nextTime);
        try {
          localStorage.setItem('pirate_treasure_reset_time', nextTime.toString());
        } catch (e) {}

        // Reset today's plunder stash
        const freshLoot: UserTodayLoot = {
          totalChestsOpened: 0,
          totalCoins: 0,
          totalGems: 0,
          secretRelics: [],
          claimedHistory: [],
        };
        setTodayLoot(freshLoot);
        try {
          localStorage.setItem('pirate_walk_today_loot', JSON.stringify({
            date: new Date().toDateString(),
            loot: freshLoot,
          }));
        } catch (e) {}

        // Respawn fresh daily treasures across all servers (each server has unique seeds/positions)
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

  // Simulated Server Fleet Treasure Claims (Strictly server-isolated: crew on currentServer claims only on currentServer)
  useEffect(() => {
    const fleetInterval = setInterval(() => {
      const serverCode = currentServer.code;
      const serverName = currentServer.name;

      setServerTreasuresMap(prevMap => {
        const currentList = prevMap[serverCode] || [];
        const unclaimed = currentList.filter(t => !t.isClaimed);
        if (unclaimed.length <= 1) return prevMap; // Keep at least 1 for the player

        // Pick a random treasure that a pirate on THIS server discovers
        const randomTarget = unclaimed[Math.floor(Math.random() * unclaimed.length)];
        
        // Pick captain from current server's roster
        const roster = currentServer.players.filter(p => p.name !== profile.username);
        const randomCaptain = roster.length > 0
          ? roster[Math.floor(Math.random() * roster.length)]
          : { name: 'Corsair Thorne', avatarUrl: PIRATE_AVATARS[0]?.url || '' };

        const uniqueFleetLogId = `tlog_${serverCode}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Schedule log addition to this server only
        setTimeout(() => {
          setTreasureLogsMap(prevLogsMap => {
            const serverLogs = prevLogsMap[serverCode] || [];
            const newLog: TreasureActivityLog = {
              id: uniqueFleetLogId,
              serverCode: serverCode,
              playerName: randomCaptain.name,
              avatarUrl: randomCaptain.avatarUrl || PIRATE_AVATARS[Math.floor(Math.random() * PIRATE_AVATARS.length)]?.url || '',
              serverName: serverName,
              locationName: `${serverName} Waters`,
              rewardLabel: randomTarget.reward.label,
              rarity: randomTarget.rarity,
              timestamp: Date.now(),
              isUser: false,
            };
            return {
              ...prevLogsMap,
              [serverCode]: [newLog, ...serverLogs.slice(0, 19)],
            };
          });
        }, 0);

        return {
          ...prevMap,
          [serverCode]: currentList.map(t => 
            t.id === randomTarget.id 
              ? { ...t, isClaimed: true, claimedBy: `${randomCaptain.name} (${serverName})`, claimedAt: Date.now() }
              : t
          ),
        };
      });
    }, 28000); // Every 28 seconds

    return () => clearInterval(fleetInterval);
  }, [currentServer.code, currentServer.name, currentServer.players, profile.username]);

  const totalDailyTreasures = serverTreasures.length;
  const remainingTreasuresCount = serverTreasures.filter(t => !t.isClaimed).length;

  // Derived ship HP
  const shipMaxHp = 5000 + (shipLevel - 1) * 5000;
  const shipCurrentHp = Math.round(shipMaxHp * (shipCondition / 100));

  // Add Steps & Reward logic (100 steps = 10 coins, + steps gain XP toward level up, + 1 step = 1 HP boss damage)
  const addSteps = (amount: number) => {
    setTotalStepsToday(prev => {
      const updated = prev + amount;
      const coinsEarned = Math.floor(amount / 100) * 10;
      if (coinsEarned > 0) {
        setCoins(c => c + coinsEarned);
        soundFx.playCoin();
      }
      return updated;
    });

    gainXp(amount);

    // If user has joined the raid and it's active, every step counts as 1 HP damage!
    if (currentRaidState.hasJoined && !currentRaidState.isDefeated) {
      dealRaidDamage(amount, false);
    }

    // update today's record in chart
    setStepRecords(prev => {
      const next = [...prev];
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
  const switchServer = (serverCode: string) => {
    const target = servers.find(s => s.code === serverCode);
    if (target) {
      setCurrentServer(target);
      soundFx.playClick();
    }
  };

  // Create private beach server
  const createPrivateServer = (serverName: string): string => {
    if (gems < 10) {
      alert('Not enough gems! Creating a Private Beach costs 10 gems.');
      return '';
    }
    setGems(g => g - 10);
    const newCode = `PRIV-${Math.floor(100 + Math.random() * 900)}`;
    const newServer: ServerInfo = {
      code: newCode,
      type: 'private',
      name: serverName || 'My Private Island Cove',
      playerCount: 1,
      maxPlayers: 20,
      players: INITIAL_SERVERS[1].players.slice(0, 10),
    };
    setServers(prev => [...prev, newServer]);
    setCurrentServer(newServer);
    soundFx.playVictory();
    return newCode;
  };

  // BOMB / Attack Player logic
  const attackPlayer = (target: Player): BattleResult | null => {
    if (energy < 1) {
      alert('Not enough Energy! You need 1 Energy to launch a Bomb raid. Energy refills daily!');
      return null;
    }
    if (shipCondition <= 50) {
      alert('Ship condition is too low (<= 50%)! Repair your ship before entering battle.');
      return null;
    }

    setEnergy(e => e - 1);
    soundFx.playCannonBomb();

    // Damage calculation: sum of equipped cannons' damage * condition factor
    const baseDamage = equippedCannons.reduce((sum, id) => {
      const c = ownedCannons.find(x => x.id === id);
      return sum + (c ? 2500 + (c.level - 1) * 2500 : 0);
    }, 0);
    const actualDamage = Math.round(baseDamage * (shipCondition / 100));

    // Target HP logic
    const enemyRemainingHp = Math.max(0, target.currentHp - actualDamage);
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

    // 1% chance for gems drop
    const dropGemChance = Math.random();
    const gemsEarned = dropGemChance <= 0.05 ? 1 : 0; // boosted slightly to 5% for fun demo feel!

    // Cannon Looting logic: if enemy ship HP drops below 30%, chance to loot their cannon
    let cannonLooted = false;
    let lootedCannonLevel = target.cannonLevel;
    if (enemyHpPercent < 30 && target.cannonCount > 0) {
      const lootChance = Math.random();
      if (lootChance <= 0.6) {
        cannonLooted = true;
        const newId = `c_${Date.now()}`;
        setOwnedCannons(prev => [...prev, { id: newId, level: 1 }]);
        setEquippedCannons(prev => prev.length < 6 ? [...prev, newId] : prev);
      }
    }

    setCoins(c => c + coinsEarned);
    if (gemsEarned > 0) setGems(g => g + gemsEarned);

    // Log the raid
    const newLog: RaidLog = {
      id: `log_${Date.now()}`,
      timestamp: 'Just now',
      type: 'attack',
      opponentName: target.name,
      outcome: 'victory',
      coinsChange: coinsEarned,
      damage: actualDamage,
      cannonLostOrWon: cannonLooted ? `Looted Lv${lootedCannonLevel} Cannon!` : undefined,
    };
    setRaidLogs(prev => [newLog, ...prev]);

    return {
      targetPlayer: target,
      damageDealt: actualDamage,
      enemyRemainingHpPercent: enemyHpPercent,
      coinsEarned,
      gemsEarned,
      cannonLooted,
      lootedCannonLevel,
      shieldBlocked: false,
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

  // Rebuild ship from 0% to 5% (costs 50 coins)
  const rebuildShip = (): boolean => {
    if (shipCondition > 0) {
      alert('Ship is not destroyed (condition > 0%). Use Repair instead!');
      return false;
    }
    if (coins < 50) {
      alert('Not enough coins! Rebuilding requires 50 coins.');
      return false;
    }

    setCoins(c => c - 50);
    setShipCondition(5);
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

  // Watch Ad for Gems (+5 gems)
  const watchAdForGems = () => {
    setGems(g => g + 5);
    soundFx.playVictory();
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
        currentRaidState,
        currentMonster,
        raidCombatLogs,
        joinRaid,
        dealRaidDamage,
        claimRaidPrize,
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
        raidLogs,
        isMuted,
        toggleMute,
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
