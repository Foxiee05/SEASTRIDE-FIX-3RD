import React from "react";
import { useGame } from "../context/GameContext";
import { History, X, ShieldAlert, Crosshair } from "lucide-react";

interface RaidHistoryModalProps {
  onClose: () => void;
}

export const RaidHistoryModal: React.FC<RaidHistoryModalProps> = ({
  onClose,
}) => {
  const { raidLogs } = useGame();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#2b1d19] border-b-4 border-[#4a2c17] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#facc15]" />
            <h2 className="text-base font-serif font-black uppercase text-[#fde68a] tracking-wider">
              Battle & Raid History Log
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-[#4a2c17] hover:bg-[#92400e] rounded-lg border border-[#b45309] text-[#fde68a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {raidLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#fde68a] font-serif">
              No battle history yet. Launch a BOMB raid on other ships!
            </div>
          ) : (
            raidLogs.map((log) => (
              <div
                key={log.id}
                className="bg-[#2b1d19] border-2 border-[#b45309] rounded-2xl p-3 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl border ${
                      log.type === "attack"
                        ? "bg-red-950 border-red-600 text-red-300"
                        : "bg-[#064e3b] border-[#16a34a] text-emerald-200"
                    }`}
                  >
                    {log.type === "attack" ? (
                      <Crosshair className="w-4 h-4" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-black text-white font-serif">
                      {log.type === "attack"
                        ? `Raid on ${log.opponentName}`
                        : `Defended against ${log.opponentName}`}
                    </div>
                    <div className="text-[10px] text-[#fde68a]/80 font-mono">
                      Damage: {log.damage.toLocaleString()} HP • {log.timestamp}
                    </div>
                    {log.cannonLostOrWon && (
                      <div className="text-[10px] font-black text-[#fbbf24] uppercase mt-0.5">
                        ✨ {log.cannonLostOrWon}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-[#fbbf24]">
                    +{log.coinsChange} 🪙
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
