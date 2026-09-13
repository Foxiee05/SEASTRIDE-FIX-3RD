import React, { useState, useMemo, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { History, X, ShieldAlert, Crosshair, Swords } from "lucide-react";

interface RaidHistoryModalProps {
  onClose: () => void;
}

export const RaidHistoryModal: React.FC<RaidHistoryModalProps> = ({
  onClose,
}) => {
  const { raidLogs, t, unreadDefenseCount, markDefenseLogsAsRead } = useGame();

  // If there are unread enemy attacks, open directly to enemy attacks tab
  const [activeTab, setActiveTab] = useState<"strikes" | "assaults">(() => {
    return unreadDefenseCount > 0 ? "assaults" : "strikes";
  });

  // Automatically mark defense logs as read when user checks the "enemy attacks" page (tab)
  useEffect(() => {
    if (activeTab === "assaults") {
      markDefenseLogsAsRead();
    }
  }, [activeTab, markDefenseLogsAsRead]);

  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  const validLogs = useMemo(() => {
    const now = Date.now();
    return raidLogs.filter((log) => {
      if (!log.createdAt) return true;
      return now - log.createdAt < THREE_DAYS_MS;
    });
  }, [raidLogs]);

  const strikeLogs = useMemo(
    () => validLogs.filter((log) => log.type === "attack"),
    [validLogs]
  );

  const assaultLogs = useMemo(
    () => validLogs.filter((log) => log.type === "defense"),
    [validLogs]
  );

  const displayedLogs = activeTab === "strikes" ? strikeLogs : assaultLogs;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#2b1d19] border-b-4 border-[#4a2c17] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#facc15] shrink-0" />
            <div>
              <h2 className="text-base font-serif font-black uppercase text-[#fde68a] tracking-wider leading-none">
                {t("raid_history")}
              </h2>
              <p className="text-[10px] text-[#fde68a]/70 font-sans mt-0.5 font-normal">
                {t("logs_deleted_3_days", "Attack logs will be deleted after 3 days")}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-[#4a2c17] hover:bg-[#92400e] rounded-lg border border-[#b45309] text-[#fde68a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs: My Strikes vs Enemy Assaults */}
        <div className="px-3 pt-3 bg-[#3a2212] border-b-2 border-[#2b1d19]">
          <div className="flex bg-[#231510] p-1 rounded-2xl border-2 border-[#4a2c17] gap-1.5">
            {/* Tab 1: My Strikes */}
            <button
              onClick={() => setActiveTab("strikes")}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-serif font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "strikes"
                  ? "bg-gradient-to-b from-[#b45309] to-[#92400e] text-white shadow-md border border-[#f59e0b]"
                  : "text-[#fde68a]/70 hover:text-[#fde68a] hover:bg-[#341d13]"
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">{t("my_strikes", "My Strikes")}</span>
            </button>

            {/* Tab 2: Enemy Attacks */}
            <button
              onClick={() => setActiveTab("assaults")}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-serif font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "assaults"
                  ? "bg-gradient-to-b from-rose-700 to-rose-900 text-white shadow-md border border-rose-500"
                  : "text-[#fde68a]/70 hover:text-[#fde68a] hover:bg-[#341d13]"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span className="truncate">{t("enemy_attacks", "Enemy Attacks")}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 overflow-y-auto space-y-2 flex-1">
          {displayedLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#fde68a]/70 font-serif flex flex-col items-center justify-center gap-2">
              {activeTab === "strikes" ? (
                <>
                  <Crosshair className="w-9 h-9 text-amber-500/40" />
                  <p className="max-w-[240px] leading-relaxed">
                    {t("no_strikes_yet", "No strikes launched yet. Bomb rival ships in The Sea!")}
                  </p>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-9 h-9 text-emerald-500/40" />
                  <p className="max-w-[240px] leading-relaxed">
                    {t("no_assaults_yet", "No enemy attacks recorded. Your ship is safe and sound!")}
                  </p>
                </>
              )}
            </div>
          ) : (
            displayedLogs.map((log) => (
              <div
                key={log.id}
                className="bg-[#2b1d19] border-2 border-[#b45309] rounded-2xl p-3 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl border shrink-0 ${
                      log.type === "attack"
                        ? "bg-amber-950/70 border-amber-600 text-amber-300"
                        : "bg-rose-950/80 border-rose-600 text-rose-300"
                    }`}
                  >
                    {log.type === "attack" ? (
                      <Crosshair className="w-4 h-4" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-black text-white font-serif truncate">
                      {log.type === "attack"
                        ? `${t("bombed", "Bombed")} ${log.opponentName}`
                        : `${t("attacked_by", "Attacked by")} ${log.opponentName}`}
                    </div>
                    <div className="text-[10px] text-[#fde68a]/80 font-mono">
                      {log.type === "attack"
                        ? `${t("damage_dealt")}: ${log.damage.toLocaleString()} HP`
                        : `${t("damage_taken", "Damage Taken")}: -${log.damage.toLocaleString()} HP`}{" "}
                      • {log.timestamp}
                    </div>
                    {log.cannonLostOrWon && (
                      <div className="text-[10px] font-black text-[#fbbf24] uppercase mt-0.5">
                        ✨ {log.cannonLostOrWon}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status / Coins Impact */}
                {log.type === "attack" ? (
                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-[#fbbf24]">
                      +{log.coinsChange} 🪙
                    </span>
                  </div>
                ) : (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-700/60 block">
                      {log.coinsChange < 0 ? `${log.coinsChange} 🪙` : "Defended"}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
