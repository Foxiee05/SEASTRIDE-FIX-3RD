import React, { useState } from "react";
import { TheSeaView } from "./TheSeaView";
import { Player } from "../types";
import { ASSETS } from "../assets";
import { Globe, Lock, Bomb, Swords, Check, Compass } from "lucide-react";
import { useGame } from "../context/GameContext";

interface TheSeaScreenProps {
  onSwitchToBuild: () => void;
  openModal: (modal: "attack" | "server") => void;
  onSelectTargetForAttack?: (player: Player) => void;
}

export const TheSeaScreen: React.FC<TheSeaScreenProps> = ({
  openModal,
  onSelectTargetForAttack,
  onSwitchToBuild,
}) => {
  const { currentServer, seaGameMode, setSeaGameMode } = useGame();
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState<boolean>(false);

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden select-none pb-[env(safe-area-inset-bottom)]">
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.topdownOcean}
          alt="Backdrop"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover filter brightness-95 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c0a02]/80 via-transparent to-[#1c0a02]/30" />
      </div>
      
      <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
        
        {/* Top Floating HUD Overlay: Server Switch and Game Mode Switch on the same horizontal line */}
        <div className="w-full flex items-center justify-center gap-2 pt-3 px-3 pointer-events-auto shrink-0 z-30 max-w-md mx-auto">
          {/* Server Info Bar with Switch Button */}
          <div className="flex-1 bg-[#1a2938]/90 border border-[#38bdf8]/50 rounded-full p-1 text-amber-100 shadow-[0_4px_12px_rgba(56,189,248,0.25)] backdrop-blur-md flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 pl-1.5 min-w-0">
              {currentServer.type === "global" ? (
                <div className="p-1 bg-[#0ea5e9]/20 rounded-full text-sky-400 flex-shrink-0">
                  <Globe className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="p-1 bg-[#fbbf24]/20 rounded-full text-[#facc15] flex-shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-sky-100 uppercase tracking-wider leading-none mb-0.5 truncate">
                  {currentServer.name}
                </span>
                <span className="text-[8px] sm:text-[9px] text-sky-300/80 font-mono leading-none truncate">
                  {currentServer.playerCount} Ships
                </span>
              </div>
            </div>
            <button
              onClick={() => openModal("server")}
              className="bg-sky-500 hover:bg-sky-400 active:scale-95 border-b-2 border-sky-700 text-white px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-md transition-all mr-0.5 flex-shrink-0"
              title="Switch Server"
            >
              Switch
            </button>
          </div>

          {/* Game Mode Switch Button (Circular Button on the same horizontal line) */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsModeDropdownOpen((prev) => !prev)}
              className={`tutorial-game-mode-switch w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 shadow-[0_4px_14px_rgba(0,0,0,0.6)] flex items-center justify-center active:scale-95 transition-all ${
                seaGameMode === "raid"
                  ? "bg-[#881337] hover:bg-[#9f1239] border-rose-400 text-rose-200"
                  : seaGameMode === "treasure"
                  ? "bg-[#064e3b] hover:bg-[#065f46] border-emerald-400 text-emerald-200"
                  : "bg-[#2b1d19] hover:bg-[#4a2c17] border-[#facc15] text-[#fde68a]"
              }`}
              title="Switch Game Mode"
            >
              {seaGameMode === "raid" ? (
                <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300 animate-pulse" />
              ) : seaGameMode === "treasure" ? (
                <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 animate-spin" style={{ animationDuration: "8s" }} />
              ) : (
                <Bomb className="w-4 h-4 sm:w-5 sm:h-5 text-[#facc15]" />
              )}
            </button>

            {isModeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsModeDropdownOpen(false)}
                />
                <div className="absolute right-0 top-11 w-56 sm:w-60 bg-[#2b1d19]/95 border-2 border-[#b45309] rounded-2xl p-2 shadow-2xl backdrop-blur-md text-white z-50 animate-fade-in space-y-1.5">
                  <div className="text-[10px] font-serif font-black uppercase text-[#fde68a] px-2 pt-1 flex items-center justify-between border-b border-[#4a2c17] pb-1">
                    <span>THE SEA MODE</span>
                    <span className="text-[9px] text-[#fbbf24] font-mono">Select</span>
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
                        <div className="text-xs font-bold font-serif">Bombing</div>
                        <div className="text-[9px] text-[#fde68a]/70 leading-tight">
                          Ocean Ship Bombardment
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
                        <div className="text-xs font-bold font-serif">Raid Boss</div>
                        <div className="text-[9px] text-red-200/80 leading-tight">
                          Abyssal Co-op Beast
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
                        <div className="text-xs font-bold font-serif">Treasure Hunt</div>
                        <div className="text-[9px] text-emerald-200/80 leading-tight">
                          2km Radar & Shared Loot
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

        {/* Full Screen Ocean Viewport (Pointer events auto to interact with ships) */}
        <div className="flex-1 min-h-0 w-full flex flex-col animate-fade-in tutorial-sea-view-area pointer-events-auto relative mt-2 pb-0 sm:pb-2">
          <TheSeaView
            onOpenAttackModal={() => openModal("attack")}
            onSelectTargetForAttack={onSelectTargetForAttack}
            onSwitchToBuild={onSwitchToBuild}
          />
        </div>
      </div>
    </div>
  );
};
