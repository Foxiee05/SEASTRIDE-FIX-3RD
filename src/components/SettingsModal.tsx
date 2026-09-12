import React from "react";
import { X, Settings, Volume2, VolumeX, Globe, Check } from "lucide-react";
import { useGame } from "../context/GameContext";

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { isMuted, toggleMute, language, changeLanguage, t } = useGame();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-amber-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2b1d19] px-4 py-3 border-b-4 border-[#1a0f0d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#4a2c17] border border-[#b45309]">
              <Settings className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-black tracking-wider text-[#fde68a] uppercase leading-none">
                {t("settings")}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#3d2417] border-2 border-[#b45309] flex items-center justify-center text-amber-200 hover:text-white hover:bg-red-900 transition-colors shadow-md active:scale-95"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* SECTION 1: SOUND & AUDIO */}
          <div className="bg-[#2b1d19] p-3.5 sm:p-4 rounded-2xl border-2 border-[#b45309] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[#4a2c17] border border-[#b45309]/60">
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-serif font-black text-[#fde68a] uppercase">
                {t("sound_music")}
              </span>
            </div>

            {/* Mute / Unmute Switch */}
            <button
              type="button"
              onClick={toggleMute}
              className="relative flex h-8 w-20 items-center rounded-full border-2 border-[#b45309] bg-[#1a0f0d] p-0.5 cursor-pointer shadow-inner"
            >
              <div
                className={`absolute h-6 w-9 rounded-full transition-transform ${
                  !isMuted ? 'bg-emerald-600 translate-x-0' : 'bg-red-600 translate-x-9'
                }`}
              />
              <span className="relative z-10 flex-1 text-center text-[10px] font-black text-white">ON</span>
              <span className="relative z-10 flex-1 text-center text-[10px] font-black text-white">OFF</span>
            </button>
          </div>

          {/* SECTION 2: LANGUAGE SELECTION */}
          <div className="bg-[#2b1d19] p-3.5 sm:p-4 rounded-2xl border-2 border-[#b45309] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[#4a2c17] border border-[#b45309]/60">
                <Globe className="w-4 h-4 text-sky-400" />
              </div>
              <span className="text-xs sm:text-sm font-serif font-black text-[#fde68a] uppercase">
                {t("language_title")}
              </span>
            </div>

            {/* Language Selector Switch */}
            <button
              type="button"
              onClick={() => changeLanguage(language === "vi" ? "en" : "vi")}
              className="relative flex h-8 w-20 items-center rounded-full border-2 border-[#b45309] bg-[#1a0f0d] p-0.5 cursor-pointer shadow-inner"
            >
              <div
                className={`absolute h-6 w-9 rounded-full bg-[#3b82f6] transition-transform ${
                  language === "en" ? 'translate-x-0' : 'translate-x-9'
                }`}
              />
              <span className="relative z-10 flex-1 text-center text-[10px] font-black text-white">ENG</span>
              <span className="relative z-10 flex-1 text-center text-[10px] font-black text-white">VIE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
