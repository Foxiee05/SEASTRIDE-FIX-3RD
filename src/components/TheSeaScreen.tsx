import React, { useState, useEffect } from "react";
import { TheSeaView } from "./TheSeaView";
import { Player } from "../types";
import { ASSETS } from "../assets";
import { Bomb, Swords, Check, Compass } from "lucide-react";
import { useGame } from "../context/GameContext";

interface TheSeaScreenProps {
  onSwitchToBuild: () => void;
  openModal: (modal: "attack") => void;
  onSelectTargetForAttack?: (player: Player) => void;
  pendingAttackTarget?: Player | null;
  onClearPendingAttackTarget?: () => void;
}

export const TheSeaScreen: React.FC<TheSeaScreenProps> = ({
  openModal,
  onSelectTargetForAttack,
  onSwitchToBuild,
  pendingAttackTarget,
  onClearPendingAttackTarget,
}) => {
  const { seaGameMode, setSeaGameMode, t, refreshServerPlayers } = useGame();
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState<boolean>(false);
  const [isMinigameActive, setIsMinigameActive] = useState<boolean>(false);

  useEffect(() => {
    refreshServerPlayers();
  }, [refreshServerPlayers]);

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden select-none pb-[env(safe-area-inset-bottom)]">
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.topdownOcean}
          alt="Backdrop"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover filter brightness-95 saturate-110"
        />
      </div>
      
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
        
        {/* Top Floating HUD Overlay: Game Mode Switch (hidden when minigame is active) */}
        {!isMinigameActive && (
          <div className="w-full flex items-center justify-center pt-3 px-3 pointer-events-auto shrink-0 z-30 max-w-4xl mx-auto">
            {/* Game Mode Switch Button */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsModeDropdownOpen((prev) => !prev)}
                className={`tutorial-game-mode-switch flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 shadow-[0_4px_14px_rgba(0,0,0,0.6)] active:scale-95 transition-all ${
                  seaGameMode === "raid"
                    ? "bg-[#881337] hover:bg-[#9f1239] border-rose-400 text-rose-200"
                    : seaGameMode === "treasure"
                    ? "bg-[#064e3b] hover:bg-[#065f46] border-emerald-400 text-emerald-200"
                    : "bg-[#2b1d19] hover:bg-[#4a2c17] border-[#facc15] text-[#fde68a]"
                }`}
                title="Switch Game Mode"
              >
                {seaGameMode === "raid" ? (
                  <Swords className="w-4 h-4 text-rose-300 animate-pulse" />
                ) : seaGameMode === "treasure" ? (
                  <Compass className="w-4 h-4 text-emerald-300 animate-spin" style={{ animationDuration: "8s" }} />
                ) : (
                  <Bomb className="w-4 h-4 text-[#facc15]" />
                )}
                <span className="text-[11px] sm:text-xs font-bold font-serif uppercase tracking-wider">
                  {seaGameMode === "raid"
                    ? t("raid_boss")
                    : seaGameMode === "treasure"
                    ? t("treasure_hunt")
                    : t("bombing")}
                </span>
              </button>

              {isModeDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsModeDropdownOpen(false)}
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 top-11 w-56 sm:w-60 bg-[#2b1d19]/95 border-2 border-[#b45309] rounded-2xl p-2 shadow-2xl backdrop-blur-md text-white z-50 animate-fade-in space-y-1.5">
                    <div className="text-[10px] font-serif font-black uppercase text-[#fde68a] px-2 pt-1 flex items-center justify-between border-b border-[#4a2c17] pb-1">
                      <span>{t("the_sea_mode")}</span>
                      <span className="text-[9px] text-[#fbbf24] font-mono">{t("select")}</span>
                    </div>

                    {/* 1. Ocean Bombing */}
                    <button
                      onClick={() => {
                        setSeaGameMode("bombing");
                        setIsModeDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all ${
                        seaGameMode === "bombing"
                          ? "bg-[#b45309] text-white font-black border border-[#facc15] shadow"
                          : "bg-[#1a0f0d]/80 hover:bg-[#4a2c17] text-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💣</span>
                        <div>
                          <div className="text-xs font-bold font-serif">{t("bombing")}</div>
                          <div className="text-[9px] text-[#fde68a]/70 leading-tight">
                            {t("ocean_bombardment")}
                          </div>
                        </div>
                      </div>
                      {seaGameMode === "bombing" && (
                        <Check className="w-4 h-4 text-[#facc15]" />
                      )}
                    </button>

                    {/* 2. Co-op Fleet Raid */}
                    <button
                      onClick={() => {
                        setSeaGameMode("raid");
                        setIsModeDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all ${
                        seaGameMode === "raid"
                          ? "bg-[#dc2626] text-white font-black border border-red-300 shadow"
                          : "bg-[#1a0f0d]/80 hover:bg-[#4a2c17] text-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚔️</span>
                        <div>
                          <div className="text-xs font-bold font-serif">{t("raid_boss")}</div>
                          <div className="text-[9px] text-red-200/80 leading-tight">
                            {t("boss_desc")}
                          </div>
                        </div>
                      </div>
                      {seaGameMode === "raid" && (
                        <Check className="w-4 h-4 text-yellow-300" />
                      )}
                    </button>

                    {/* 3. Treasure Hunting System */}
                    <button
                      onClick={() => {
                        setSeaGameMode("treasure");
                        setIsModeDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all ${
                        seaGameMode === "treasure"
                          ? "bg-[#059669] text-white font-black border border-emerald-300 shadow"
                          : "bg-[#1a0f0d]/80 hover:bg-[#4a2c17] text-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🧭</span>
                        <div>
                          <div className="text-xs font-bold font-serif">{t("treasure_hunt")}</div>
                          <div className="text-[9px] text-emerald-200/80 leading-tight">
                            {t("treasure_desc")}
                          </div>
                        </div>
                      </div>
                      {seaGameMode === "treasure" && (
                        <Check className="w-4 h-4 text-emerald-200" />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Full Screen Ocean Viewport (Pointer events auto to interact with ships) */}
        <div className={`flex-1 min-h-0 w-full flex flex-col animate-fade-in tutorial-sea-view-area pointer-events-auto relative ${isMinigameActive ? 'mt-0' : 'mt-2 pb-0 sm:pb-2'}`}>
          <TheSeaView
            onOpenAttackModal={() => openModal("attack")}
            onSelectTargetForAttack={onSelectTargetForAttack}
            onSwitchToBuild={onSwitchToBuild}
            onMinigameActive={setIsMinigameActive}
            selectedTargetPlayer={pendingAttackTarget}
            onClearSelectedTarget={onClearPendingAttackTarget}
          />
        </div>
      </div>
    </div>
  );
};
