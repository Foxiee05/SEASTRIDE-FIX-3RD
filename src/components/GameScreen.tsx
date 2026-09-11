import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { ShipDisplay } from "./ShipDisplay";
import { TheSeaView } from "./TheSeaView";
import { ASSETS } from "../assets";
import { Player } from "../types";
import {
  Shield,
  Wrench,
  ShoppingBag,
  Globe,
  Lock,
  History,
  ChevronRight,
  Zap,
  Anchor,
  Waves,
} from "lucide-react";

interface GameScreenProps {
  openModal: (
    modal:
      | "upgrades"
      | "shop"
      | "server"
      | "repair"
      | "raids"
      | "attack"
      | "shipInspect",
  ) => void;
  onSelectTargetForAttack?: (player: Player) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  openModal,
  onSelectTargetForAttack,
}) => {
  const { energy, currentServer, shipCondition, raidLogs, t } = useGame();

  const [activeTab, setActiveTab] = useState<"build" | "sea">("build");

  return (
    <div className="relative h-full flex-1 p-2 sm:p-3 flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none pb-24 sm:pb-32">
      {/* Dynamic Background: Cartoon Beach Landscape for Ship Build, Cartoon top-down ocean for The Sea */}
      <div className="absolute inset-0 z-0">
        <img
          src={activeTab === "build" ? ASSETS.beachBg : ASSETS.topdownOcean}
          alt="Backdrop"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover filter brightness-95 saturate-110 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c0a02]/80 via-transparent to-[#1c0a02]/30" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col space-y-3 my-auto">
        {/* VIEW SWITCHER TABS: "Ship Build" vs "The Sea" */}
        <div className="tutorial-sea-switch flex items-center justify-center gap-2 max-w-md mx-auto w-full bg-[#2b1d19]/90 border-4 border-[#4a2c17] rounded-2xl p-1.5 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab("build")}
            className={`flex-1 py-2 px-3 rounded-xl font-serif font-black text-xs uppercase italic flex items-center justify-center gap-1.5 transition-all shadow-md ${
              activeTab === "build"
                ? "bg-[#b45309] border-2 border-[#facc15] text-white scale-102"
                : "bg-[#4a2c17] text-[#fde68a] hover:bg-[#92400e]"
            }`}
          >
            <Anchor className="w-4 h-4 text-[#facc15]" />
            <span>{t("ship_build_tab")}</span>
          </button>

          <button
            onClick={() => setActiveTab("sea")}
            className={`flex-1 py-2 px-3 rounded-xl font-serif font-black text-xs uppercase italic flex items-center justify-center gap-1.5 transition-all shadow-md ${
              activeTab === "sea"
                ? "bg-[#1d4ed8] border-2 border-[#facc15] text-white scale-102"
                : "bg-[#4a2c17] text-[#fde68a] hover:bg-[#92400e]"
            }`}
          >
            <Waves className="w-4 h-4 text-sky-300" />
            <span>{t("the_sea_tab")}</span>
          </button>
        </div>

        {/* MODE 1: SHIP BUILD SCREEN */}
        {activeTab === "build" ? (
          <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in w-full">
            {/* GIANT SHIP BUILD CANVAS - NO CONTAINER BOX OR BORDER */}
            <ShipDisplay
              onInspectShip={() => openModal("shipInspect")}
              isHugeBuildMode={true}
            />

            {/* SHIP BUILDING CONTROL HUB */}
            <div className="tutorial-ship-actions w-full max-w-md space-y-2">
              {shipCondition <= 50 && (
                <div className="text-[11px] font-bold text-center text-red-200 bg-red-950/90 border border-red-700 p-2 rounded-xl shadow-lg">
                  ⚠️ Hull damaged ({shipCondition}%). Use Repair in the Shipyard
                  below before setting sail!
                </div>
              )}

              {/* Grid of Shipyard Features */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                <button
                  onClick={() => openModal("upgrades")}
                  className="tutorial-upgrades bg-[#b45309] hover:bg-[#d97706] active:translate-y-0.5 border-b-2 sm:border-b-4 border-r-2 border-[#2b1d19] py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 text-white shadow-xl italic font-black uppercase"
                >
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#facc15]" />
                  <span className="text-[9px] sm:text-[10px] truncate w-full">
                    Upgrades
                  </span>
                </button>

                <button
                  onClick={() => openModal("repair")}
                  className="tutorial-repair bg-[#93bb44] border-b-4 border-[#658627] text-white shadow-sm hover:brightness-110 active:border-b-0 active:translate-y-1 active:translate-y-0.5 border-b-2 sm:border-b-4 border-r-2 border-[#064e3b] py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 text-white shadow-xl italic font-black uppercase"
                >
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-[9px] sm:text-[10px] truncate w-full">
                    Repair
                  </span>
                </button>

                <button
                  onClick={() => openModal("shop")}
                  className="tutorial-shop bg-[#1d4ed8] hover:bg-[#2563eb] active:translate-y-0.5 border-b-2 sm:border-b-4 border-r-2 border-[#1e3a8a] py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 text-white shadow-xl italic font-black uppercase"
                >
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />
                  <span className="text-[9px] sm:text-[10px] truncate w-full">
                    Shop
                  </span>
                </button>

                <button
                  onClick={() => openModal("raids")}
                  className="tutorial-raids bg-[#2b1d19] hover:bg-[#4a2c17] active:translate-y-0.5 border-b-2 sm:border-b-4 border-r-2 border-[#1a0f0d] py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 text-[#fde68a] shadow-xl relative italic font-black uppercase"
                >
                  <History className="w-4 h-4 sm:w-5 sm:h-5 text-[#facc15]" />
                  <span className="text-[9px] sm:text-[10px] truncate w-full">
                    Raid Log
                  </span>
                  {raidLogs.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] sm:text-[9px] font-black w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border border-white">
                      {raidLogs.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MODE 2: THE SEA SCREEN */
          <div className="w-full animate-fade-in">
            <TheSeaView
              onOpenAttackModal={() => openModal("attack")}
              onSelectTargetForAttack={onSelectTargetForAttack}
              onSwitchToBuild={() => setActiveTab("build")}
            />
          </div>
        )}
      </div>
    </div>
  );
};
