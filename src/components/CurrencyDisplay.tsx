import React from "react";
import { CircleDollarSign, Gem } from "lucide-react";
import { useGame } from "../context/GameContext";

export const CurrencyDisplay: React.FC = () => {
  const { coins, gems } = useGame();

  return (
    <div className="flex justify-end items-center gap-1.5 sm:gap-2 flex-nowrap tutorial-currency">
      {/* Gold Coins - Gamified Wood Look */}
      <div className="flex items-center justify-center gap-1 bg-[#4a2c17] border-2 sm:border-4 border-[#2b1d19] rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 shadow-[0_3px_0_#2b1d19] h-8 sm:h-10">
        <CircleDollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#f0c242]" />
        <span className="text-[#f0c242] font-serif font-black text-xs sm:text-sm leading-none tracking-wide">
          {coins.toLocaleString()}
        </span>
      </div>
      {/* Gems - Gamified Blue Look */}
      <div className="flex items-center justify-center gap-1 bg-[#34aab2] border-2 sm:border-4 border-[#1e7880] rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 shadow-[0_3px_0_#1e7880] h-8 sm:h-10">
        <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        <span className="text-white font-serif font-black text-xs sm:text-sm leading-none tracking-wide">
          {gems}
        </span>
      </div>
    </div>
  );
};
