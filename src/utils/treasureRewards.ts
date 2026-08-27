import { ServerTreasure, TreasureRewardType, TreasureRarity, Decoration } from "../types";
import { SECRET_ITEMS } from "../data/decorations";
import { calculateDistance } from "../hooks/useGpsTracker";

/**
 * Drop Rate Table specified by user:
 * Total: 100%
 * - 100 coins (Common): 30.0%
 * - 1 gem (Common): 30.0%
 * - 1000 coins (Uncommon): 12.5%
 * - 5 gems (Uncommon): 12.5%
 * - 10000 coins (Rare): 6.5%
 * - 100 gems (Rare): 6.5%
 * - Secret item (Legendary): 2.0%
 */
export function rollTreasureReward(ownedDecorationIds: string[] = []): TreasureRewardType {
  const rand = Math.random() * 100; // 0 to 100

  if (rand < 30.0) {
    return { type: "coins", amount: 100, rarity: "common", label: "100 Gold Coins" };
  } else if (rand < 60.0) {
    return { type: "gems", amount: 1, rarity: "common", label: "1 Precious Gem" };
  } else if (rand < 72.5) {
    return { type: "coins", amount: 1000, rarity: "uncommon", label: "1,000 Gold Coins" };
  } else if (rand < 85.0) {
    return { type: "gems", amount: 5, rarity: "uncommon", label: "5 Shiny Gems" };
  } else if (rand < 91.5) {
    return { type: "coins", amount: 10000, rarity: "rare", label: "10,000 Stashed Coins" };
  } else if (rand < 98.0) {
    return { type: "gems", amount: 100, rarity: "rare", label: "100 Flawless Gems" };
  } else {
    // 2.0% Secret Legendary Item
    // Prioritize unowned secret items first
    const unownedSecrets = SECRET_ITEMS.filter((item) => !ownedDecorationIds.includes(item.id));
    const pool = unownedSecrets.length > 0 ? unownedSecrets : SECRET_ITEMS;
    const selectedItem = pool[Math.floor(Math.random() * pool.length)];

    return {
      type: "secret_item",
      secretItem: selectedItem,
      rarity: "legendary",
      label: selectedItem.name,
    };
  }
}

export interface ChestMetadata {
  name: string;
  badge: string;
  glowColor: string;
  borderStyle: string;
  textColor: string;
  icon: string;
}

export function getRarityMetadata(rarity: TreasureRarity): ChestMetadata {
  switch (rarity) {
    case "legendary":
      return {
        name: "Legendary Relic Chest",
        badge: "LEGENDARY",
        glowColor: "#f59e0b",
        borderStyle: "border-amber-400 bg-gradient-to-b from-amber-950/90 to-amber-900/60 shadow-[0_0_25px_rgba(245,158,11,0.6)]",
        textColor: "text-amber-300",
        icon: "👑",
      };
    case "rare":
      return {
        name: "Sunken Royal Strongbox",
        badge: "RARE",
        glowColor: "#a855f7",
        borderStyle: "border-purple-400 bg-gradient-to-b from-purple-950/90 to-purple-900/60 shadow-[0_0_20px_rgba(168,85,247,0.5)]",
        textColor: "text-purple-300",
        icon: "💎",
      };
    case "uncommon":
      return {
        name: "Reinforced Iron Coffer",
        badge: "UNCOMMON",
        glowColor: "#0ea5e9",
        borderStyle: "border-sky-400 bg-gradient-to-b from-sky-950/90 to-sky-900/60 shadow-[0_0_15px_rgba(14,165,233,0.4)]",
        textColor: "text-sky-300",
        icon: "🗝️",
      };
    case "common":
    default:
      return {
        name: "Barnacle Oak Chest",
        badge: "COMMON",
        glowColor: "#94a3b8",
        borderStyle: "border-slate-400 bg-gradient-to-b from-slate-900/90 to-slate-800/60 shadow-[0_0_10px_rgba(148,163,184,0.3)]",
        textColor: "text-slate-200",
        icon: "📦",
      };
  }
}

/**
 * Generate daily randomized treasure coordinates around a base center (player's current GPS location)
 * strictly within a 2km radius (e.g. 150m to 1900m away), spawning 5 to 15 treasures randomly each day.
 */
export function generateDailyTreasures(
  serverCode: string,
  baseLat: number,
  baseLng: number,
  count?: number,
  ownedDecorations: string[] = []
): ServerTreasure[] {
  // Compute server-specific seed offset so different servers have distinct treasure distributions
  let serverHash = 0;
  for (let s = 0; s < serverCode.length; s++) {
    serverHash = ((serverHash << 5) - serverHash + serverCode.charCodeAt(s)) | 0;
  }
  const serverAngleShift = ((Math.abs(serverHash) % 360) * Math.PI) / 180;
  const countMod = Math.abs(serverHash) % 7;

  const actualCount =
    count !== undefined && count > 0
      ? count
      : Math.floor(Math.random() * 6) + 6 + (countMod % 4); // 6 to 15 treasures per server

  const treasures: ServerTreasure[] = [];
  const timestampSeed = Date.now();

  for (let i = 0; i < actualCount; i++) {
    // Angular distribution distributed around captain with server-specific base offset and random jitter
    const angle = serverAngleShift + (i * ((2 * Math.PI) / actualCount)) + ((Math.random() - 0.5) * 0.5);
    
    // Distribute distances between 180m and 1750m (strictly within 2.0 km radar)
    let distMeters: number;
    if (i % 3 === 0) {
      distMeters = 180 + Math.random() * 320; // Closer range: 180m - 500m
    } else if (i % 3 === 1) {
      distMeters = 520 + Math.random() * 580; // Mid range: 520m - 1100m
    } else {
      distMeters = 1120 + Math.random() * 630; // Far range: 1120m - 1750m
    }

    // Convert meters to lat/lng offsets (1 deg lat ~= 111,320m)
    const dLat = (distMeters * Math.cos(angle)) / 111320;
    const dLng = (distMeters * Math.sin(angle)) / (111320 * Math.cos((baseLat * Math.PI) / 180));

    const lat = baseLat + dLat;
    const lng = baseLng + dLng;

    const reward = rollTreasureReward(ownedDecorations);
    const meta = getRarityMetadata(reward.rarity);

    treasures.push({
      id: `treasure_${serverCode}_${timestampSeed}_${i + 1}`,
      serverCode,
      lat,
      lng,
      distanceMeters: Math.round(distMeters),
      isClaimed: false,
      reward,
      title: `${meta.name} #${i + 1}`,
      rarity: reward.rarity,
    });
  }

  return treasures;
}

/**
 * Filter treasures within radar range (default 2000m)
 */
export function getTreasuresWithinRange(
  treasures: ServerTreasure[],
  userLat: number,
  userLng: number,
  maxRangeMeters: number = 2000
): (ServerTreasure & { currentDistance: number })[] {
  return treasures
    .filter((t) => !t.isClaimed)
    .map((t) => {
      const dist = calculateDistance(userLat, userLng, t.lat, t.lng);
      return { ...t, currentDistance: dist };
    })
    .filter((t) => t.currentDistance <= maxRangeMeters)
    .sort((a, b) => a.currentDistance - b.currentDistance);
}
