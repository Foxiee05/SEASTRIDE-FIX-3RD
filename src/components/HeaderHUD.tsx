import React from "react";
import { useGame } from "../context/GameContext";
import {
  Volume2,
  VolumeX,
  Shield,
  Zap,
  Globe,
  Lock,
  HelpCircle,
} from "lucide-react";
import { CurrencyDisplay } from "./CurrencyDisplay";

interface HeaderHUDProps {
  activeTab: "home" | "build" | "sea" | "leaderboard";
  setActiveTab: (tab: "home" | "build" | "sea" | "leaderboard") => void;
  openModal: (
    modal: "upgrades" | "shop" | "server" | "repair" | "raids" | "profile",
  ) => void;
  onBackToMenu: () => void;
  onHelp: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  activeTab,
  setActiveTab,
  openModal,
  onBackToMenu,
  onHelp,
}) => {
  const {
    coins,
    gems,
    energy,
    maxEnergy,
    currentServer,
    isMuted,
    toggleMute,
    shipCondition,
    profile,
  } = useGame();

  return (
    <header
      className="sticky top-0 z-40 bg-[#2b1d19] border-b-4 sm:border-b-8 border-[#4a2c17] shadow-2xl text-amber-100 select-none w-full"
      style={{ paddingTop: "max(4px, env(safe-area-inset-top))" }}
    >
      <div className="px-2 py-2 max-w-4xl mx-auto flex flex-col gap-2">
        {/* Top Row: Navigation, Profile & Settings */}
        <div className="flex items-center justify-between w-full">
          
          {/* Left: Nav & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 pr-2">
            <button
              onClick={() => openModal("profile")}
              className="tutorial-profile w-9 h-9 sm:w-11 sm:h-11 bg-[#f0c242] border-2 sm:border-4 border-[#be9325] shadow-[0_4px_0_#be9325] rounded-full flex items-center justify-center shadow-md overflow-hidden flex-shrink-0 hover:scale-105 active:scale-95 transition-transform"
              title="My Captain Profile"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-lg sm:text-xl">☠️</span>
              )}
            </button>
            <div className="flex flex-col ml-1 flex-1 min-w-0">
              <span className="text-[clamp(0.65rem,2.5vw,0.75rem)] sm:text-xs font-black text-[#f0dec1] leading-none uppercase tracking-wider truncate">
                {profile?.username || "Captain"}
              </span>
              <span className="text-[clamp(0.55rem,2vw,0.65rem)] sm:text-[10px] text-[#fbbf24] font-bold truncate">Lvl 1</span>
            </div>
          </div>

          {/* Right: Settings / Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => openModal("server")}
              className="flex items-center justify-center gap-1 bg-[#34aab2] border-b-[3px] border-[#1e7880] text-white rounded-lg px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs font-bold active:scale-95 transition-transform h-8 sm:h-9"
            >
              {currentServer.type === "global" ? (
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-200" />
              ) : (
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              )}
              <span className="truncate max-w-[50px] sm:max-w-[80px]">
                {currentServer.code}
              </span>
            </button>
            <button
              onClick={onHelp}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#8b5a33] border-b-[3px] border-[#4a2c17] text-white rounded-lg active:scale-90 shadow-sm"
              title="Help & Tutorial"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-100" />
            </button>
            <button
              onClick={toggleMute}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#d75448] border-b-[3px] border-[#9b3026] text-white rounded-lg active:scale-90 shadow-sm"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-200" />
              ) : (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom Row: Currencies & Energy (Resources) */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full bg-[#1e1108]/40 p-1.5 rounded-xl border border-[#4a2c17]">
          {/* Energy Bar (Takes flexible space, min-width to keep readable) */}
          <div className="flex-1 min-w-[100px] flex items-center bg-[#4a2c17] border-2 sm:border-4 border-[#2b1d19] rounded-lg shadow-[0_3px_0_#2b1d19] px-2 py-1 h-8 sm:h-10 tutorial-energy-bar">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#93bb44] fill-[#93bb44] mr-1 flex-shrink-0" />
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#f0dec1] font-black uppercase tracking-wider leading-none mb-0.5">
                <span>Energy</span>
                <span className="text-white">
                  {energy}/{maxEnergy}
                </span>
              </div>
              <div className="flex gap-0.5 w-full">
                {Array.from({ length: maxEnergy }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 sm:h-2 rounded-sm border border-[#2b1d19] ${
                      i < energy
                        ? "bg-[#93bb44] border-t-[#c6f076] shadow-inner"
                        : "bg-[#1a0f0d]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Currencies wrapper */}
          <div className="flex-shrink-0">
             <CurrencyDisplay />
          </div>
        </div>
      </div>

      {/* Quick Ship Repair Alert Button if damaged */}
      {shipCondition <= 50 && (
        <div className="bg-[#1a0f0d] border-t border-[#4a2c17] px-3 py-1.5 flex justify-center w-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openModal("repair");
            }}
            className="bg-[#93bb44] border-b-4 border-[#658627] text-white shadow-sm hover:brightness-110 active:border-b-0 active:translate-y-1 font-black text-xs px-4 py-1.5 rounded-lg border-2 border-[#064e3b] animate-bounce flex items-center gap-1 shadow-md"
          >
            <Shield className="w-4 h-4" />
            <span>CRITICAL: REPAIR SHIP</span>
          </button>
        </div>
      )}
    </header>
  );
};
