import { SeaMonsterConfig, SeaMonsterId } from '../types';
import { ASSETS } from '../assets';

export const SEA_MONSTERS: Record<SeaMonsterId, SeaMonsterConfig> = {
  megalodon: {
    id: 'megalodon',
    name: 'Megalodon: Tidal colossus',
    shortName: 'Megalodon',
    subtitle: 'Tidal colossus',
    maxHp: 200000,
    totalPrizeCoins: 50000,
    totalPrizeGems: 250,
    chestName: 'Ancient Megalodon Skull Chest',
    element: 'Tidal Fury',
    lore: 'A colossal apex predator from the primordial oceans, clad in razor bone armor and magma fissures.',
    themeColor: {
      accent: '#ef4444',
      bgGradient: 'from-[#7f1d1d] via-[#1e293b] to-[#0f172a]',
      border: '#f87171',
      badge: 'bg-red-500/20 text-red-300 border-red-500/40',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.4)]',
    },
  },
  siren: {
    id: 'siren',
    name: 'Siren: Voices of the depth',
    shortName: 'Siren',
    subtitle: 'Voices of the depth',
    maxHp: 300000,
    totalPrizeCoins: 80000,
    totalPrizeGems: 400,
    chestName: 'Sirens Pearlescent Reliquary',
    element: 'Abyssal Melody',
    lore: 'An enchanting empress of the deep ocean whose hypnotic songs summon whirlpools to drown careless fleets.',
    themeColor: {
      accent: '#06b6d4',
      bgGradient: 'from-[#164e63] via-[#1e1b4b] to-[#0f172a]',
      border: '#22d3ee',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      glow: 'shadow-[0_0_30px_rgba(6,182,212,0.4)]',
    },
  },
  scylla: {
    id: 'scylla',
    name: 'Scylla: Abyssal monster',
    shortName: 'Scylla',
    subtitle: 'Abyssal monster',
    maxHp: 400000,
    totalPrizeCoins: 120000,
    totalPrizeGems: 600,
    chestName: 'Abyssal Hydra Fang Coffer',
    element: 'Draconic Maelstrom',
    lore: 'A monstrous six-headed abyssal hydra that devours entire flagships in a single snap of its jaws.',
    themeColor: {
      accent: '#f97316',
      bgGradient: 'from-[#7c2d12] via-[#311042] to-[#0f172a]',
      border: '#fb923c',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      glow: 'shadow-[0_0_30px_rgba(249,115,22,0.4)]',
    },
  },
  kraken: {
    id: 'kraken',
    name: 'Kraken: Leviathan’s Wrath',
    shortName: 'Kraken',
    subtitle: 'Leviathan’s Wrath',
    maxHp: 500000,
    totalPrizeCoins: 180000,
    totalPrizeGems: 1000,
    chestName: 'Crowned Leviathan Vault',
    element: 'Eldritch Void',
    lore: 'The legendary sovereign of the deepest trenches, whose crowned tentacles crush armada hulls to splinters.',
    themeColor: {
      accent: '#a855f7',
      bgGradient: 'from-[#581c87] via-[#1e1b4b] to-[#09090b]',
      border: '#c084fc',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      glow: 'shadow-[0_0_35px_rgba(168,85,247,0.45)]',
    },
  },
};

export function getMonsterImage(id: SeaMonsterId): string {
  return ASSETS.monsters[id] || ASSETS.monsters.kraken;
}
