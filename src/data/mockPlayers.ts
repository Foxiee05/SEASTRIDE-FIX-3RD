import { Player, ServerInfo } from "../types";
import { PIRATE_AVATARS } from "../assets";

export const getAvatar = (index: number) => {
  return PIRATE_AVATARS[index % PIRATE_AVATARS.length].url;
};

export const getPlayerMaxHp = (shipLevel: number): number => {
  return 5000 + (shipLevel - 1) * 5000;
};

export const getPlayerCurrentHp = (shipLevel: number, shipCondition: number): number => {
  return Math.round(getPlayerMaxHp(shipLevel) * (shipCondition / 100));
};

export const SEED_RIVAL_PLAYERS: Player[] = [];
export const MOCK_PLAYERS_GLOBAL: Player[] = [];
export const MOCK_PLAYERS_PRIVATE: Player[] = [];

// Default initial global servers (30-player limit)
export const INITIAL_SERVERS: ServerInfo[] = [
  {
    code: "GLOBAL-1",
    type: "global",
    name: "Global Fleet 1",
    playerCount: 0,
    maxPlayers: 30,
    players: [],
  },
  {
    code: "GLOBAL-2",
    type: "global",
    name: "Global Fleet 2",
    playerCount: 0,
    maxPlayers: 30,
    players: [],
  },
];
