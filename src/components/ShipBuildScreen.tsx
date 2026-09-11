import React from "react";
import { useGame } from "../context/GameContext";
import { ShipDisplay } from "./ShipDisplay";
import { ASSETS } from "../assets";
import { Player } from "../types";
import {
  Shield,
  Wrench,
  ShoppingBag,
  History,
} from "lucide-react";

interface ShipBuildScreenProps {
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

export const ShipBuildScreen: React.FC<ShipBuildScreenProps> = ({
  openModal,
}) => {
  const { shipCondition, raidLogs, t } = useGame();

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden select-none bg-sky-950">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={ASSETS.beachBg}
          alt="Backdrop"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover filter brightness-95 saturate-125"
        />
      </div>

      {/* Main Layout Container (Row) */}
      <div className="relative z-10 w-full h-full flex flex-row pb-[env(safe-area-inset-bottom)]">
        
        {/* LEFT VERTICAL ACTION SIDEBAR */}
        <div className="w-[85px] sm:w-[100px] flex flex-col justify-center pl-2 sm:pl-3 z-20 shrink-0 py-4 h-full">
          <div className="tutorial-hub flex flex-col gap-2.5 sm:gap-4 w-full p-1 -m-1 rounded-2xl">
            {/* SHOP BUTTON */}
            <button
              onClick={() => openModal("shop")}
              className="tutorial-shop relative group bg-indigo-500 hover:bg-indigo-400 active:scale-95 transition-all border-b-[4px] border-indigo-700 py-2.5 sm:py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none" />
              <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-100 drop-shadow-md" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-indigo-50">{t("shop")}</span>
            </button>

            {/* UPGRADE BUTTON */}
            <button
              onClick={() => openModal("upgrades")}
              className="tutorial-upgrades relative group bg-sky-500 hover:bg-sky-400 active:scale-95 transition-all border-b-[4px] border-sky-700 py-2.5 sm:py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none" />
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-sky-50">{t("upgrades")}</span>
            </button>

            {/* REPAIR BUTTON */}
            <button
              onClick={() => openModal("repair")}
              className="tutorial-repair relative group bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all border-b-[4px] border-emerald-700 py-2.5 sm:py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none" />
              <Wrench className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-md text-white" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-50">
                {t("repair")}
              </span>
            </button>

            {/* HISTORY / RAID LOG BUTTON */}
            <button
              onClick={() => openModal("raids")}
              className="tutorial-raids relative group bg-rose-500 hover:bg-rose-400 active:scale-95 transition-all border-b-[4px] border-rose-700 py-2.5 sm:py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
            >
              {raidLogs.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-950 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-rose-600 z-10">
                  {raidLogs.length}
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none" />
              <History className="w-6 h-6 sm:w-7 sm:h-7 text-rose-100 drop-shadow-md" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-rose-50">
                {t("history")}
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT/CENTER HERO SECTION */}
        <div className="flex-1 flex flex-col items-center relative min-w-0 pr-2 sm:pr-4 pt-3 h-full">
          
          {shipCondition <= 50 && (
            <div className="absolute top-14 text-[10px] sm:text-[11px] font-bold text-center text-rose-100 bg-rose-900/90 border border-rose-500 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.4)] backdrop-blur-sm animate-pulse z-30 shrink-0">
              {t("critical_damage")}
            </div>
          )}

          {/* SHIP DISPLAY CANVAS - Flex 1 allows it to take remaining vertical space */}
          <div className="flex-1 w-full flex items-center justify-center relative overflow-visible mt-4 pb-12">
            <ShipDisplay
              onInspectShip={() => openModal("shipInspect")}
              isHugeBuildMode={true}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

