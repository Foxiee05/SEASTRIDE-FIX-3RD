import React from "react";
import { Footprints, Anchor, Waves, Trophy } from "lucide-react";

interface BottomNavigationProps {
  activeTab: "home" | "build" | "sea" | "leaderboard";
  setActiveTab: (tab: "home" | "build" | "sea" | "leaderboard") => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="bg-[#4a2c17] border-t-8 border-[#2b1d19] pb-[env(safe-area-inset-bottom)] z-50 flex-shrink-0 w-full shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center px-2 py-2 sm:px-6">
        <button
          onClick={() => setActiveTab("home")}
          className={`tutorial-steps-bar flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === "home"
              ? "scale-110 drop-shadow-md"
              : "hover:bg-[#2b1d19]/30"
          }`}
        >
          <Footprints
            className={`w-6 h-6 sm:w-7 sm:h-7 ${activeTab === "home" ? "text-[#38bdf8]" : "text-[#f0dec1]/50"}`}
          />
          <span
            className={`text-[10px] sm:text-xs font-black uppercase mt-1 ${activeTab === "home" ? "text-[#38bdf8]" : "text-[#f0dec1]/50"}`}
          >
            Steps
          </span>
        </button>

        <button
          onClick={() => setActiveTab("build")}
          className={`tutorial-build-nav flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === "build"
              ? "scale-110 drop-shadow-md"
              : "hover:bg-[#2b1d19]/30"
          }`}
        >
          <Anchor
            className={`w-6 h-6 sm:w-7 sm:h-7 ${activeTab === "build" ? "text-[#38bdf8]" : "text-[#f0dec1]/50"}`}
          />
          <span
            className={`text-[10px] sm:text-xs font-black uppercase mt-1 ${activeTab === "build" ? "text-[#38bdf8]" : "text-[#f0dec1]/50"}`}
          >
            Build
          </span>
        </button>

        <button
          onClick={() => setActiveTab("sea")}
          className={`tutorial-sea-nav flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === "sea"
              ? "scale-110 drop-shadow-md"
              : "hover:bg-[#2b1d19]/30"
          }`}
        >
          <Waves
            className={`w-6 h-6 sm:w-7 sm:h-7 ${activeTab === "sea" ? "text-[#38bdf8]" : "text-[#f0dec1]/50"}`}
          />
          <span
            className={`text-[10px] sm:text-xs font-black uppercase mt-1 ${activeTab === "sea" ? "text-[#38bdf8]" : "text-[#f0dec1]/50"}`}
          >
            The Sea
          </span>
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`tutorial-fleet-nav flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            activeTab === "leaderboard"
              ? "scale-110 drop-shadow-md"
              : "hover:bg-[#2b1d19]/30"
          }`}
        >
          <Trophy
            className={`w-6 h-6 sm:w-7 sm:h-7 ${activeTab === "leaderboard" ? "text-[#38bdf8]" : "text-[#f0dec1]/50"}`}
          />
          <span
            className={`text-[10px] sm:text-xs font-black uppercase mt-1 ${activeTab === "leaderboard" ? "text-[#38bdf8]" : "text-[#f0dec1]/50"}`}
          >
            Fleet
          </span>
        </button>
      </div>
    </div>
  );
};
