import React from "react";
import { motion } from "motion/react";
import { Volume2, VolumeX, Anchor } from "lucide-react";
import { ASSETS } from "../assets";
import { useCutoutImage } from "../utils/imageUtils";
import { useGame } from "../context/GameContext";

interface MenuScreenProps {
  onSelectSteps: () => void;
  onSelectGame: () => void;
  onSelectLeaderboard: () => void;
}

export function MenuScreen({
  onSelectSteps,
  onSelectGame,
  onSelectLeaderboard,
}: MenuScreenProps) {
  const transparentLogo = useCutoutImage(ASSETS.logo, { mode: "edge" });
  const { isMuted, toggleMute } = useGame();

  return (
    <div className="absolute inset-0 w-full h-full z-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${ASSETS.menuBg})` }}
      />
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Top Bar / Controls */}
      <div className="absolute top-0 right-0 p-4 sm:p-6 z-20">
        <button
          onClick={toggleMute}
          className="w-12 h-12 bg-[#4a2c17]/80 backdrop-blur-sm border-2 border-[#d97706] rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full px-4 pt-8 pb-16 sm:pb-24 h-full justify-between">
        {/* Logo Section - Increased Size & Responsive */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          className="w-full flex justify-center drop-shadow-2xl flex-1 items-center"
        >
          <img
            src={transparentLogo}
            alt="SeaStride Logo"
            className="w-full max-w-[85%] sm:max-w-[90%] md:max-w-2xl h-auto object-contain max-h-[50vh]"
          />
        </motion.div>

        {/* Start Voyage Button */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col gap-5 w-full max-w-[280px] sm:max-w-[320px] mb-8"
        >
          <button
            onClick={() => {
              onSelectSteps();
              window.dispatchEvent(new CustomEvent("TUTORIAL_ADVANCE"));
            }}
            className="tutorial-start-voyage relative group w-full bg-gradient-to-b from-[#fbbf24] to-[#d97706] hover:from-[#fcd34d] hover:to-[#ea580c] rounded-2xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-4px_0_rgba(146,64,14,0.8),0_8px_20px_rgba(0,0,0,0.6)] active:scale-[0.96] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.4),0_4px_10px_rgba(0,0,0,0.4)] border border-[#fde68a] ring-4 ring-[#d97706]/40 ring-offset-4 ring-offset-[#2b1d19] transition-all duration-200 ease-out overflow-hidden py-4 sm:py-5 flex flex-col items-center justify-center"
            style={{ pointerEvents: "auto" }}
          >
            {/* Glossy top highlight */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
            
            {/* Subtle radial sheen on hover */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex items-center justify-center gap-3 z-10 relative">
              <Anchor className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] group-hover:rotate-6 transition-transform duration-300" />
              <div className="flex flex-col items-center">
                <span className="font-black text-white text-xl sm:text-2xl tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] uppercase">
                  Start Voyage
                </span>
                <span className="text-[#fffbeb] text-[10px] sm:text-xs font-bold tracking-widest uppercase mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] opacity-90">
                  Begin Your Adventure
                </span>
              </div>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
