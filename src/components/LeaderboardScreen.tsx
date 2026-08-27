import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Anchor,
  CircleDollarSign,
  Medal,
  Calendar,
  Footprints,
  TrendingUp,
} from "lucide-react";
import { useGame } from "../context/GameContext";

import { BackToSeaStride } from "./BackToSeaStride";
import { PIRATE_AVATARS } from "../assets";

interface LeaderboardScreenProps {
  onBack: () => void;
}

const baseLeaderboard = [
  {
    id: "bot_1",
    name: "Captain Silver",
    level: 6,
    gold: 15200,
    isCurrentUser: false,
    avatarUrl: PIRATE_AVATARS[1]?.url,
  },
  {
    id: "bot_2",
    name: "Scurvy Sally",
    level: 5,
    gold: 11850,
    isCurrentUser: false,
    avatarUrl: PIRATE_AVATARS[4]?.url,
  },
  {
    id: "bot_3",
    name: "Captain Pegleg",
    level: 3,
    gold: 3400,
    isCurrentUser: false,
    avatarUrl: PIRATE_AVATARS[2]?.url,
  },
  {
    id: "bot_4",
    name: "Walkin' Willie",
    level: 2,
    gold: 800,
    isCurrentUser: false,
    avatarUrl: PIRATE_AVATARS[3]?.url,
  },
];

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  onBack,
}) => {
  const { profile, shipLevel, coins, playerLevel, dailyCoinsHistory } =
    useGame();
  const [activeTab, setActiveTab] = useState<"level" | "coins">("level");

  const sortedLeaderboard = useMemo(() => {
    const currentUser = {
      id: "current_user",
      name: profile?.username || "Wanderer",
      level: playerLevel,
      gold: coins,
      isCurrentUser: true,
      avatarUrl: profile?.avatarUrl,
    };

    const combined = [...baseLeaderboard, currentUser];

    return combined
      .sort((a, b) => {
        if (activeTab === "level") {
          return b.level === a.level ? b.gold - a.gold : b.level - a.level;
        } else {
          return b.gold === a.gold ? b.level - a.level : b.gold - a.gold;
        }
      })
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }));
  }, [playerLevel, coins, profile?.username, activeTab]);

  return (
    <div className="flex flex-col h-full bg-[#f0dec1] text-[#4a2c17] font-serif selection:bg-[#f0c242] border-b-4 border-[#be9325] text-white selection:text-stone-950 overflow-hidden relative">
      {/* Main Content Area */}
      <div className="tutorial-leaderboard flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        {/* Tabs */}
        <div className="tutorial-fleet-tabs flex bg-[#8b5a33] rounded-xl border-4 border-[#4a2c17] p-1.5 mb-6 shadow-inner">
          <button
            onClick={() => setActiveTab("level")}
            className={`flex-1 py-2 sm:py-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "level"
                ? "bg-[#f0dec1] text-[#4a2c17] border-4 border-[#d1b794] shadow-sm"
                : "text-[#f0dec1]/80 hover:text-white hover:bg-[#4a2c17] border-4 border-transparent"
            }`}
          >
            Player Level
          </button>
          <button
            onClick={() => setActiveTab("coins")}
            className={`flex-1 py-2 sm:py-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "coins"
                ? "bg-[#f0dec1] text-[#4a2c17] border-4 border-[#d1b794] shadow-sm"
                : "text-[#f0dec1]/80 hover:text-white hover:bg-[#4a2c17] border-4 border-transparent"
            }`}
          >
            Coins Earned
          </button>
        </div>

        {/* Weekly Voyage Dashboard (Only visible in Coins Earned tab) */}
        {activeTab === "coins" && (
          <div className="bg-[#2b1d19] border-2 border-[#b45309] rounded-2xl p-4 sm:p-5 mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Calendar className="w-32 h-32 text-[#facc15]" />
            </div>

            <h2 className="text-sm sm:text-base font-black text-[#facc15] uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#facc15]" /> My
              Weekly Voyage
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
              {/* Distance Card */}
              <div className="bg-[#1a0f0d] rounded-xl border-2 border-[#4a2c17] p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Footprints className="w-10 h-10 text-white" />
                </div>
                <span className="text-[10px] sm:text-xs font-black text-[#8b5a33] uppercase tracking-wider mb-1 z-10">
                  Distance This Week
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#f0dec1] z-10">
                  18.6 <span className="text-xs text-[#8b5a33]">km</span>
                </span>
              </div>

              {/* Coins Card */}
              <div className="bg-gradient-to-br from-[#b45309]/30 to-[#78350f]/60 rounded-xl border-2 border-[#facc15]/40 p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(250,204,21,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <CircleDollarSign className="w-10 h-10 text-[#facc15]" />
                </div>
                <span className="text-[10px] sm:text-xs font-black text-[#facc15]/90 uppercase tracking-wider mb-1 z-10">
                  Coins Earned This Week
                </span>
                <div className="flex items-center gap-1.5 z-10">
                  <CircleDollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#facc15] drop-shadow-md" />
                  <span className="text-xl sm:text-2xl font-black text-[#fbbf24] drop-shadow-md">
                    1,450
                  </span>
                </div>
              </div>
            </div>

            {/* Daily Coins Chart */}
            <div className="mt-5 pt-5 border-t-2 border-dashed border-[#4a2c17] relative z-10">
              <h3 className="text-[10px] sm:text-xs font-black text-[#d1b794] tracking-widest uppercase mb-4 text-center">
                Daily Coins Earned
              </h3>
              <div className="flex items-end justify-between h-32 gap-1 sm:gap-2">
                {dailyCoinsHistory.map((data, index) => {
                  const maxCoins = Math.max(
                    ...dailyCoinsHistory.map((d) => d.coins),
                    100,
                  );
                  const isMax = data.coins === maxCoins && data.coins > 0;
                  const heightPercent = Math.min(
                    100,
                    Math.max(10, (data.coins / maxCoins) * 100),
                  );
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1 group relative"
                    >
                      {/* Hover tooltip for coins */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#1a0f0d] border border-[#facc15]/50 rounded px-2 py-1 text-[10px] sm:text-xs text-[#facc15] font-bold whitespace-nowrap pointer-events-none shadow-lg z-20 flex items-center gap-1">
                        <CircleDollarSign className="w-3 h-3" />
                        {data.coins.toLocaleString()}
                      </div>

                      {/* Bar container */}
                      <div className="w-full relative flex items-end justify-center h-[100px] mb-2">
                        <div
                          className={`w-full max-w-[24px] sm:max-w-[32px] rounded-t-md transition-all duration-500 ease-out border-t border-white/20 ${
                            isMax
                              ? "bg-gradient-to-t from-[#b45309] to-[#facc15] shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                              : "bg-gradient-to-t from-[#451a03] to-[#92400e] group-hover:from-[#78350f] group-hover:to-[#b45309]"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>

                      {/* Day label */}
                      <span
                        className={`text-[10px] sm:text-xs font-black uppercase ${
                          isMax
                            ? "text-[#facc15]"
                            : "text-[#8b5a33] group-hover:text-[#d1b794]"
                        }`}
                      >
                        {data.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Table Headers */}
        <div className="grid grid-cols-[2.5rem_1fr_3.5rem_4.5rem] sm:grid-cols-[4rem_1fr_4.5rem_6.5rem] items-center px-2 sm:px-4 mb-2 text-[clamp(0.65rem,2.5vw,0.85rem)] font-black text-[#8b5a33] uppercase tracking-widest opacity-80 gap-2 sm:gap-4">
          <div className="text-center">Rank</div>
          <div className="px-1">Pirate</div>
          <div className="text-center">Level</div>
          <div className="text-right">Gold</div>
        </div>

        {/* Leaderboard List */}
        <div className="tutorial-fleet-list flex flex-col gap-2 sm:gap-3">
          {sortedLeaderboard.map((player) => (
            <div
              key={player.id}
              className={`grid grid-cols-[2.5rem_1fr_3.5rem_4.5rem] sm:grid-cols-[4rem_1fr_4.5rem_6.5rem] gap-2 sm:gap-4 items-center p-2.5 sm:p-4 rounded-xl border-2 transition-all shadow-md ${
                player.isCurrentUser
                  ? "bg-[#eebb3f] border-[#b58c27] shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                  : "bg-[#2b1d19] border-[#4a2c17]"
              }`}
            >
              {/* Rank */}
              <div className="flex justify-center">
                <span
                  className={`font-black text-[clamp(1rem,4vw,1.5rem)] ${
                    player.rank === 1
                      ? "text-[#facc15] drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                      : player.rank === 2
                        ? "text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]"
                        : player.rank === 3
                          ? "text-amber-500 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]"
                          : player.isCurrentUser
                            ? "text-[#8b5a33]"
                            : "text-[#f0dec1]/70"
                  }`}
                >
                  #{player.rank}
                </span>
              </div>

              {/* Pirate Avatar & Name */}
              <div className="flex items-center gap-2 sm:gap-3 px-1 overflow-hidden">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 bg-[#4a2c17] overflow-hidden ${
                    player.isCurrentUser
                      ? "border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                      : "border-[#b45309]"
                  }`}
                >
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs sm:text-sm flex-shrink-0">☠️</span>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden min-w-0">
                  <span
                    className={`font-black text-[clamp(0.85rem,3.5vw,1.15rem)] truncate ${
                      player.isCurrentUser ? "text-stone-900" : "text-white"
                    }`}
                  >
                    {player.isCurrentUser && profile?.username
                      ? `${profile.username} (You)`
                      : player.name}
                  </span>
                </div>
              </div>

              {/* Player Level */}
              <div className="text-center">
                <span className={`font-extrabold text-[clamp(0.7rem,2.5vw,0.9rem)] sm:text-[clamp(0.85rem,3vw,1rem)] ${player.isCurrentUser ? "text-stone-800" : "text-sky-300"}`}>
                  Lvl {player.level}
                </span>
              </div>

              {/* Gold */}
              <div className="flex items-center justify-end gap-1 text-right overflow-hidden min-w-0">
                <CircleDollarSign className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${player.isCurrentUser ? "text-stone-800" : "text-[#facc15]"}`} />
                <span className={`font-black text-[clamp(0.85rem,3.5vw,1.15rem)] truncate ${player.isCurrentUser ? "text-stone-900" : "text-[#fbbf24]"}`}>
                  {player.gold.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative gradient at bottom to indicate scroll */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0c4a6e]/50 to-transparent pointer-events-none" />
    </div>
  );
};
