export type ServerType = "global" | "private";

export interface StepRecord {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Mon, Tue, etc.
  steps: number;
}

export interface DailyCoinRecord {
  day: string;
  coins: number;
}

export interface StepStats {
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  totalStepsToday: number;
  stepsToNextReward: number; // steps out of 100
}

export interface CannonItem {
  id: string;
  level: number; // 1 to 10
}

export interface ShieldItem {
  id: string;
  level: number; // 1 to 3
}

export interface Player {
  id: string; // account_id UUID
  account_id: string; // stable Supabase account_id UUID
  name: string;
  title: string;
  avatarUrl: string;
  shipLevel: number;
  shipCondition: number; // %
  currentHp: number;
  maxHp: number;
  cannonLevel: number; // We might want to remove this and replace with total damage, but let's just keep as average or max for display.
  cannonCount: number; // For backward compatibility in Player type if needed, or update to show damage.
  shieldLevel: number;
  equippedDecorations?: string[];
  isOnline: boolean;
}

export interface ServerInfo {
  code: string;
  type: ServerType;
  name: string;
  playerCount: number;
  maxPlayers: number; // 30 ships max
  players: Player[];
}

export interface BattleResult {
  targetPlayer: Player;
  damageDealt: number;
  rawDamage?: number;
  shieldReducedDamage?: number;
  shieldReductionPercent?: number;
  enemyRemainingHpPercent: number;
  coinsEarned: number;
  gemsEarned: number;
  cannonLooted: boolean;
  lootedCannonLevel?: number;
  shieldBlocked: boolean;
  minigameResult?: 'win' | 'lose';
  xpEarned?: number;
}

export interface RaidLog {
  id: string;
  timestamp: string;
  createdAt?: number;
  type: "attack" | "defense";
  opponentName: string;
  outcome: "victory" | "defeat" | "defended";
  coinsChange: number;
  damage: number;
  cannonLostOrWon?: string;
  viewed?: boolean;
}

export interface Decoration {
  id: string;
  name: string;
  description: string;
  currency: "coins" | "gems";
  price: number;
  icon: string;
  imageUrl?: string;
  category: "flag" | "figurehead" | "lantern" | "effect";
  isSecret?: boolean;
  rarity?: "common" | "uncommon" | "rare" | "legendary";
}

export type TreasureRarity = "common" | "uncommon" | "rare" | "legendary";

export type TreasureRewardType = 
  | { type: "coins"; amount: 100; rarity: "common"; label: string }
  | { type: "gems"; amount: 1; rarity: "common"; label: string }
  | { type: "coins"; amount: 1000; rarity: "uncommon"; label: string }
  | { type: "gems"; amount: 5; rarity: "uncommon"; label: string }
  | { type: "coins"; amount: 10000; rarity: "rare"; label: string }
  | { type: "gems"; amount: 100; rarity: "rare"; label: string }
  | { type: "secret_item"; secretItem: Decoration; rarity: "legendary"; label: string };

export interface ServerTreasure {
  id: string;
  serverCode: string;
  lat: number;
  lng: number;
  distanceMeters?: number;
  isClaimed: boolean;
  claimedBy?: string;
  claimedAt?: number;
  reward: TreasureRewardType;
  title: string;
  rarity: TreasureRarity;
}

export interface TreasureActivityLog {
  id: string;
  serverCode?: string;
  playerName: string;
  avatarUrl: string;
  serverName: string;
  locationName: string;
  rewardLabel: string;
  rarity: TreasureRarity;
  timestamp: number;
  isUser: boolean;
}

export interface UserTodayLoot {
  totalChestsOpened: number;
  totalCoins: number;
  totalGems: number;
  secretRelics: Decoration[];
  claimedHistory: {
    id: string;
    title: string;
    reward: TreasureRewardType;
    claimedAt: number;
  }[];
}

export type SeaGameMode = "bombing" | "raid" | "treasure";

export type SeaMonsterId = 'megalodon' | 'siren' | 'scylla' | 'kraken';

export interface RaidMilestoneBounty {
  id: string;
  hpThresholdPercent: number; // e.g. 80, 60, 40, 20, 10, 0
  name: string;
  coins: number;
  gems: number;
  icon: string;
  description: string;
  isFinal?: boolean;
}

export interface SeaMonsterConfig {
  id: SeaMonsterId;
  name: string;
  shortName: string;
  subtitle: string;
  maxHp: number;
  totalPrizeCoins: number;
  totalPrizeGems: number;
  chestName: string;
  lore: string;
  element: string;
  themeColor: {
    accent: string;
    bgGradient: string;
    border: string;
    badge: string;
    glow: string;
  };
  milestoneBounties?: RaidMilestoneBounty[];
}

export interface RaidParticipant {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  damage: number;
  isUser: boolean;
  shipLevel: number;
  isNpc?: boolean;
  joinedAt?: number;
  joinedAtHp?: number;
  joinedHpPercent?: number;
}

export interface ServerRaidState {
  serverCode: string;
  sessionId?: string;
  bossId: SeaMonsterId;
  currentHp: number;
  maxHp: number;
  participants: RaidParticipant[];
  isDefeated: boolean;
  dailyPrizeClaimed: boolean;
  claimedMilestones?: number[];
  expiresAt: number; // timestamp
  hasJoined?: boolean;
  joinedHpPercent?: number;
  joinedAtHp?: number;
}

// Supabase Name-Only Account System Types
export interface PlayerAccount {
  id: string;
  username: string;
  created_at: string;
  last_login_at: string;
}

export interface PlayerProgressData {
  account_id: string;
  coins: number;
  gems: number;
  energy: number;
  player_level: number;
  player_xp: number;
  ship_level: number;
  ship_condition: number;
  ship_current_hp: number;
  ship_max_hp: number;
  avatar_url: string;
  about_me: string;
  owned_cannons: CannonItem[];
  equipped_cannons: string[];
  owned_shields: ShieldItem[];
  equipped_shield: string | null;
  owned_decorations: string[];
  equipped_decorations: string[];
  total_steps_today: number;
  step_records: StepRecord[];
  daily_coins_history?: DailyCoinRecord[];
  quest_index?: number;
  quest_xp?: number;
  claimed_quests?: number[];
  updated_at?: string;
}

export interface GlobalServerRow {
  id: string;
  name: string;
  capacity: number;
  current_players: number;
  created_at: string;
}

export interface GlobalServerPlayerRow {
  id: string;
  server_id: string;
  account_id: string;
  username: string;
  avatar_url: string;
  title: string;
  ship_level: number;
  ship_condition: number;
  current_hp: number;
  max_hp: number;
  is_online: boolean;
  last_seen_at: string;
}
