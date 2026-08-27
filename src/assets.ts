import islandBeachBg from "./assets/images/sand_14_ratio_bg_1786468683444.jpg";
import fullscreenTopdownSea from "./assets/images/fullscreen_topdown_sea_1786367444636.jpg";
import pirateIconsPattern from "./assets/images/pirate_icons_pattern_1786366557513.jpg";
import pirateShipLv1 from "./assets/images/ship_v2_lv1_green_1786547858986.jpg";
import pirateShipLv2 from "./assets/images/ship_v2_lv2_green_1786547873059.jpg";
import pirateShipLv3 from "./assets/images/ship_v2_lv3_green_1786547883554.jpg";
import pirateShipLv4 from "./assets/images/ship_v2_lv4_green_1786547894350.jpg";
import pirateShipLv5 from "./assets/images/ship_v2_lv5_green_1786547906375.jpg";
import pirateShipLv6 from "./assets/images/ship_v2_lv6_green_1786547924868.jpg";
import pirateShipLv7 from "./assets/images/ship_v2_lv7_green_1786547939497.jpg";
import pirateShipLv8 from "./assets/images/ship_v2_lv8_green_1786547951397.jpg";
import pirateShipLv9 from "./assets/images/ship_v2_lv9_green_1786547963315.jpg";
import pirateShipLv10 from "./assets/images/ship_v2_lv10_green_1786547975219.jpg";
import pirateCannonLv1 from "./assets/images/pirate_cannon_lv1_1786362622827.jpg";
import pirateCannonLv5 from "./assets/images/pirate_cannon_lv5_1786362665481.jpg";
import pirateShieldLv1 from "./assets/images/shield_v2_lv1_green_1786549192615.jpg";
import pirateShieldLv2 from "./assets/images/shield_v2_lv2_green_1786549216767.jpg";
import pirateShieldLv3 from "./assets/images/shield_v2_lv3_green_1786549233279.jpg";
import pirateShieldLv4 from "./assets/images/shield_v2_lv4_green_1786549247559.jpg";
import pirateShieldLv5 from "./assets/images/shield_v2_lv5_green_1786549262955.jpg";
import pirateShieldLv6 from "./assets/images/shield_v2_lv6_green_1786549501570.jpg";
import pirateBombBtn from "./assets/images/pirate_bomb_btn_1786362650907.jpg";

import pirateAvatarCaptain from "./assets/images/pirate_avatar_captain_1786369408051.jpg";
import pirateAvatarParrot from "./assets/images/pirate_avatar_parrot_1786369428313.jpg";
import pirateAvatarFirstmate from "./assets/images/pirate_avatar_firstmate_1786369444789.jpg";
import pirateAvatarMonkey from "./assets/images/pirate_avatar_monkey_1786369459159.jpg";
import pirateAvatarLady from "./assets/images/pirate_avatar_lady_1786369475175.jpg";

import bossMegalodon from "./assets/images/boss_megalodon_cartoon_1787772421615.jpg";
import bossSiren from "./assets/images/boss_siren_cartoon_1787772432492.jpg";
import bossScylla from "./assets/images/boss_scylla_cartoon_1787772447909.jpg";
import bossKraken from "./assets/images/boss_kraken_cartoon_1787772460147.jpg";

import secretKrakenFigurehead from "./assets/images/kraken_figurehead_1787757784201.jpg";
import secretGhostLanterns from "./assets/images/ghost_lanterns_1787757798527.jpg";
import secretRuneHelm from "./assets/images/rune_helm_1787757819322.jpg";
import secretMythicBanners from "./assets/images/mythic_banners_1787757842859.jpg";
import secretBronzeBell from "./assets/images/bronze_bell_1787757861628.jpg";
import secretCelestialGlobe from "./assets/images/celestial_globe_1787757885208.jpg";
import secretPetPerch from "./assets/images/pet_perch_1787757908614.jpg";
import secretLootPile from "./assets/images/loot_pile_1787757928334.jpg";

import generatedLogo from "./assets/images/seastride_logo_green_ref_1786471379926.jpg";
import menuOceanBg from "./assets/images/menu_ocean_bg_islands_ref_1786471397915.jpg";

import { preloadCutouts } from "./utils/imageUtils";

export const PIRATE_AVATARS = [
  { id: "captain", name: "Captain Jack", url: pirateAvatarCaptain },
  { id: "parrot", name: "Polly Parrot", url: pirateAvatarParrot },
  { id: "firstmate", name: "Matey Pete", url: pirateAvatarFirstmate },
  { id: "monkey", name: "Cap'n Chimpy", url: pirateAvatarMonkey },
  { id: "lady", name: "Anne Bonny", url: pirateAvatarLady },
];

export const ASSETS = {
  logo: generatedLogo,
  menuBg: menuOceanBg,
  beachBg: islandBeachBg,
  topdownOcean: fullscreenTopdownSea,
  piratePatternBg: pirateIconsPattern,
  ships: {
    lv1: pirateShipLv1,
    lv2: pirateShipLv2,
    lv3: pirateShipLv3,
    lv4: pirateShipLv4,
    lv5: pirateShipLv5,
    lv6: pirateShipLv6,
    lv7: pirateShipLv7,
    lv8: pirateShipLv8,
    lv9: pirateShipLv9,
    lv10: pirateShipLv10,
  },
  cannons: {
    lv1: pirateCannonLv1,
    lv5: pirateCannonLv5,
  },
  shields: {
    lv1: pirateShieldLv1,
    lv2: pirateShieldLv2,
    lv3: pirateShieldLv3,
    lv4: pirateShieldLv4,
    lv5: pirateShieldLv5,
    lv6: pirateShieldLv6,
  },
  bombBtn: pirateBombBtn,
  monsters: {
    megalodon: bossMegalodon,
    siren: bossSiren,
    scylla: bossScylla,
    kraken: bossKraken,
  },
  secretItems: {
    krakenFigurehead: secretKrakenFigurehead,
    ghostLanterns: secretGhostLanterns,
    runeHelm: secretRuneHelm,
    mythicBanners: secretMythicBanners,
    bronzeBell: secretBronzeBell,
    celestialGlobe: secretCelestialGlobe,
    petPerch: secretPetPerch,
    lootPile: secretLootPile,
  },
};

// Immediately pre-warm ship cutouts with edge detection for green screen
preloadCutouts(
  [
    pirateShipLv1,
    pirateShipLv2,
    pirateShipLv3,
    pirateShipLv4,
    pirateShipLv5,
    pirateShipLv6,
    pirateShipLv7,
    pirateShipLv8,
    pirateShipLv9,
    pirateShipLv10,
    pirateShieldLv1,
    pirateShieldLv2,
    pirateShieldLv3,
    pirateShieldLv4,
    pirateShieldLv5,
    pirateShieldLv6,
    bossMegalodon,
    bossSiren,
    bossScylla,
    bossKraken,
    secretKrakenFigurehead,
    secretGhostLanterns,
    secretRuneHelm,
    secretMythicBanners,
    secretBronzeBell,
    secretCelestialGlobe,
    secretPetPerch,
    secretLootPile,
  ],
  { mode: "edge", keepInternalGreenAsBlack: false },
);

// Pre-warm cannons with default white background removal
preloadCutouts([pirateCannonLv1, pirateCannonLv5]);

export function getShipImageForLevel(level: number): string {
  if (level <= 1) return ASSETS.ships.lv1;
  if (level === 2) return ASSETS.ships.lv2;
  if (level === 3) return ASSETS.ships.lv3;
  if (level === 4) return ASSETS.ships.lv4;
  if (level === 5) return ASSETS.ships.lv5;
  if (level === 6) return ASSETS.ships.lv6;
  if (level === 7) return ASSETS.ships.lv7;
  if (level === 8) return ASSETS.ships.lv8;
  if (level === 9) return ASSETS.ships.lv9;
  return ASSETS.ships.lv10;
}

export function getCannonImageForLevel(level: number): string {
  if (level <= 4) return ASSETS.cannons.lv1;
  return ASSETS.cannons.lv5;
}

export function getShieldImageForLevel(level: number): string {
  if (level <= 1) return ASSETS.shields.lv1;
  if (level === 2) return ASSETS.shields.lv2;
  if (level === 3) return ASSETS.shields.lv3;
  if (level === 4) return ASSETS.shields.lv4;
  if (level === 5) return ASSETS.shields.lv5;
  return ASSETS.shields.lv6;
}
