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
  id: string;
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
  isOnline: boolean;
}

export interface ServerInfo {
  code: string;
  type: ServerType;
  name: string;
  playerCount: number;
  maxPlayers: number; // 100 for global, 30 for private
  players: Player[];
}

export interface BattleResult {
  targetPlayer: Player;
  damageDealt: number;
  enemyRemainingHpPercent: number;
  coinsEarned: number;
  gemsEarned: number;
  cannonLooted: boolean;
  lootedCannonLevel?: number;
  shieldBlocked: boolean;
}

export interface RaidLog {
  id: string;
  timestamp: string;
  type: "attack" | "defense";
  opponentName: string;
  outcome: "victory" | "defeat" | "defended";
  coinsChange: number;
  damage: number;
  cannonLostOrWon?: string;
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
}

export interface RaidParticipant {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  damage: number;
  isUser: boolean;
  shipLevel: number;
}

export interface ServerRaidState {
  serverCode: string;
  bossId: SeaMonsterId;
  currentHp: number;
  maxHp: number;
  participants: RaidParticipant[];
  isDefeated: boolean;
  dailyPrizeClaimed: boolean;
  expiresAt: number; // timestamp
  hasJoined?: boolean;
}
