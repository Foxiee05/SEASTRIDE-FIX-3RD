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
