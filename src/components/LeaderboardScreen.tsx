import React, { useState, useEffect, useMemo } from "react";
import {
  CircleDollarSign,
  Calendar,
  Footprints,
  Loader2,
} from "lucide-react";
import { useGame } from "../context/GameContext";
import { fetchLeaderboard, LeaderboardPlayer } from "../utils/supabaseClient";

interface LeaderboardScreenProps {
  onBack: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  onBack,
}) => {
  const { profile, coins, playerLevel, currentServer, currentAccount, dailyCoinsHistory, t } =
    useGame();
  const [activeTab, setActiveTab] = useState<"level" | "coins">("level");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      // Default to Global All Fleets ranking across all servers
      const data = await fetchLeaderboard(undefined, "global");

      if (isMounted) {
        setLeaderboardData(data);
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedLeaderboard = useMemo(() => {
    let list = [...leaderboardData];

    // Check if current logged-in account is in list; if not, add or update current user row
    const currentAccId = currentAccount?.id;
    const currentUsername = profile?.username || currentAccount?.username || "Captain";
    const currentAvatar = profile?.avatarUrl || "";

    const userIndex = list.findIndex(
      (p) => (currentAccId && p.account_id === currentAccId) || p.username === currentUsername
    );

    if (userIndex >= 0) {
      list[userIndex] = {
        ...list[userIndex],
        player_level: playerLevel,
        coins: coins,
        username: currentUsername,
        avatar_url: currentAvatar || list[userIndex].avatar_url,
      };
    } else {
      list.push({
        account_id: currentAccId || "current_user",
        username: currentUsername,
        avatar_url: currentAvatar,
        player_level: playerLevel,
        ship_level: playerLevel,
        coins: coins,
        total_steps_today: 0,
        server_code: currentServer?.code || "GLOBAL-1",
        is_online: true,
      });
    }

    list.sort((a, b) => {
      if (activeTab === "level") {
        return b.player_level === a.player_level
          ? b.coins - a.coins
          : b.player_level - a.player_level;
      } else {
        return b.coins === a.coins
          ? b.player_level - a.player_level
          : b.coins - a.coins;
      }
    });

    return list.map((player, index) => {
      const isCurrentUser =
        (currentAccId && player.account_id === currentAccId) ||
        player.username === currentUsername;

      return {
        ...player,
        rank: index + 1,
        isCurrentUser,
      };
    });
  }, [leaderboardData, currentAccount?.id, currentAccount?.username, profile?.username, profile?.avatarUrl, playerLevel, coins, activeTab, currentServer?.code]);

  return (
    <div className="flex flex-col h-full bg-[#f0dec1] text-[#4a2c17] font-serif selection:bg-[#f0c242] border-b-4 border-[#be9325] text-white selection:text-stone-950 overflow-hidden relative">
      {/* Main Content Area */}
      <div className="tutorial-leaderboard flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        {/* Metric Tabs */}
        <div className="tutorial-fleet-tabs flex bg-[#8b5a33] rounded-xl border-4 border-[#4a2c17] p-1.5 mb-6 shadow-inner">
          <button
            onClick={() => setActiveTab("level")}
            className={`flex-1 py-2 sm:py-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "level"
                ? "bg-[#f0dec1] text-[#4a2c17] border-4 border-[#d1b794] shadow-sm"
                : "text-[#f0dec1]/80 hover:text-white hover:bg-[#4a2c17] border-4 border-transparent"
            }`}
          >
            {t("player_level")}
          </button>
          <button
            onClick={() => setActiveTab("coins")}
            className={`flex-1 py-2 sm:py-3 px-4 text-xs sm:text-sm font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "coins"
                ? "bg-[#f0dec1] text-[#4a2c17] border-4 border-[#d1b794] shadow-sm"
                : "text-[#f0dec1]/80 hover:text-white hover:bg-[#4a2c17] border-4 border-transparent"
            }`}
          >
            {t("coins_earned")}
          </button>
        </div>

        {/* Weekly Voyage Dashboard (Only visible in Coins Earned tab) */}
        {activeTab === "coins" && (
          <div className="bg-[#2b1d19] border-2 border-[#b45309] rounded-2xl p-4 sm:p-5 mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Calendar className="w-32 h-32 text-[#facc15]" />
            </div>

            <h2 className="text-sm sm:text-base font-black text-[#facc15] uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#facc15]" />{" "}
              {t("my_weekly_voyage")}
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
              {/* Distance Card */}
              <div className="bg-[#1a0f0d] rounded-xl border-2 border-[#4a2c17] p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Footprints className="w-10 h-10 text-white" />
                </div>
                <span className="text-[10px] sm:text-xs font-black text-[#8b5a33] uppercase tracking-wider mb-1 z-10">
                  {t("distance_this_week")}
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
                  {t("coins_earned_this_week")}
                </span>
                <div className="flex items-center gap-1.5 z-10">
                  <CircleDollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#facc15] drop-shadow-md" />
                  <span className="text-xl sm:text-2xl font-black text-[#fbbf24] drop-shadow-md">
                    {coins.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Daily Coins Chart */}
            <div className="mt-5 pt-5 border-t-2 border-dashed border-[#4a2c17] relative z-10">
              <h3 className="text-[10px] sm:text-xs font-black text-[#d1b794] tracking-widest uppercase mb-4 text-center">
                {t("daily_coins_earned")}
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
          <div className="text-center">{t("rank")}</div>
          <div className="px-1">{t("pirate")}</div>
          <div className="text-center">{t("level")}</div>
          <div className="text-right">{t("gold")}</div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-[#8b5a33] gap-2">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-bold">Summoning Fleet Captains...</span>
          </div>
        ) : sortedLeaderboard.length === 0 ? (
          <div className="p-8 text-center text-[#8b5a33] font-bold">
            No captains found in this fleet yet.
          </div>
        ) : (
          /* Leaderboard List */
          <div className="tutorial-fleet-list flex flex-col gap-2 sm:gap-3">
            {sortedLeaderboard.map((player) => (
              <div
                key={player.account_id || player.username}
                className={`grid grid-cols-[2.5rem_1fr_3.5rem_4.5rem] sm:grid-cols-[4rem_1fr_4.5rem_6.5rem] gap-2 sm:gap-4 items-center p-2.5 sm:p-4 rounded-xl border-2 transition-all shadow-md ${
                  player.isCurrentUser
                    ? "bg-sky-800 border-sky-600 shadow-[0_0_15px_rgba(2,132,199,0.3)]"
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
                              ? "text-sky-200"
                              : "text-[#b89f81]"
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
                        ? "border-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.3)]"
                        : "border-[#b45309]"
                    }`}
                  >
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs sm:text-sm flex-shrink-0">☠️</span>
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden min-w-0">
                    <span
                      className={`font-black text-[clamp(0.85rem,3.5vw,1.15rem)] truncate ${
                        player.isCurrentUser ? "text-white" : "text-white"
                      }`}
                    >
                      {player.username} {player.isCurrentUser && `(${t("you")})`}
                    </span>
                    {player.server_code && (
                      <span className={`text-[10px] font-mono ${player.isCurrentUser ? "text-sky-300" : "text-[#b45309]"}`}>
                        {player.server_code}
                      </span>
                    )}
                  </div>
                </div>
                {/* Player Level */}
                <div className="text-center">
                  <span className={`font-extrabold text-[clamp(0.7rem,2.5vw,0.9rem)] sm:text-[clamp(0.85rem,3vw,1rem)] ${player.isCurrentUser ? "text-sky-100" : "text-sky-300"}`}>
                    {t("lvl")} {player.player_level}
                  </span>
                </div>
                {/* Gold */}
                <div className="flex items-center justify-end gap-1 text-right overflow-hidden min-w-0">
                  <CircleDollarSign className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${player.isCurrentUser ? "text-sky-200" : "text-[#facc15]"}`} />
                  <span className={`font-black text-[clamp(0.85rem,3.5vw,1.15rem)] truncate ${player.isCurrentUser ? "text-white" : "text-[#fbbf24]"}`}>
                    {player.coins.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decorative gradient at bottom to indicate scroll */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0c4a6e]/50 to-transparent pointer-events-none" />
    </div>
  );
};
