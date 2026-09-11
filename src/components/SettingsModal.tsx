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
          <div className="bg-[#2b1d19] p-3.5 sm:p-4 rounded-2xl border-2 border-[#b45309] space-y-3">
            <div className="flex items-center justify-between">
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

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  isMuted
                    ? "bg-red-950/80 text-red-300 border-red-800"
                    : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                }`}
              >
                {isMuted ? t("sound_muted") : t("sound_on")}
              </span>
            </div>

            <p className="text-[11px] text-amber-100/70 leading-relaxed">
              {t("sound_desc")}
            </p>

            {/* Mute / Unmute Button */}
            <button
              type="button"
              onClick={toggleMute}
              className={`w-full py-2.5 px-4 rounded-xl font-black uppercase italic text-xs tracking-wider border-b-4 border-r-2 flex items-center justify-center gap-2 shadow-lg active:translate-y-0.5 transition-all ${
                isMuted
                  ? "bg-emerald-700 hover:bg-emerald-600 border-emerald-950 text-white"
                  : "bg-red-700 hover:bg-red-600 border-red-950 text-white"
              }`}
            >
              {isMuted ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>{t("unmute_button")}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>{t("mute_button")}</span>
                </>
              )}
            </button>
          </div>

          {/* SECTION 2: LANGUAGE SELECTION */}
          <div className="bg-[#2b1d19] p-3.5 sm:p-4 rounded-2xl border-2 border-[#b45309] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-[#4a2c17] border border-[#b45309]/60">
                  <Globe className="w-4 h-4 text-sky-400" />
                </div>
                <span className="text-xs sm:text-sm font-serif font-black text-[#fde68a] uppercase">
                  {t("language_title")}
                </span>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-[#4a2c17] text-amber-200 border border-[#b45309]">
                {language === "vi" ? "Tiếng Việt 🇻🇳" : "English 🇬🇧"}
              </span>
            </div>

            <p className="text-[11px] text-amber-100/70 leading-relaxed">
              {t("language_desc")}
            </p>

            {/* Language Selector Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => changeLanguage("en")}
                className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-between transition-all ${
                  language === "en"
                    ? "bg-[#b45309] text-white border-[#facc15] shadow-md scale-[1.02]"
                    : "bg-[#4a2c17] text-amber-100/80 border-[#b45309]/60 hover:bg-[#5c371d]"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🇬🇧</span>
                  <span className="uppercase text-[11px]">English</span>
                </div>
                {language === "en" && <Check className="w-3.5 h-3.5 text-[#facc15]" />}
              </button>

              <button
                type="button"
                onClick={() => changeLanguage("vi")}
                className={`py-2 px-3 rounded-xl border text-xs font-sans font-black flex items-center justify-between transition-all ${
                  language === "vi"
                    ? "bg-[#b45309] text-white border-[#facc15] shadow-md scale-[1.02]"
                    : "bg-[#4a2c17] text-amber-100/80 border-[#b45309]/60 hover:bg-[#5c371d]"
                }`}
              >
                <div className="flex items-center gap-1.5 font-sans">
                  <span className="text-base">🇻🇳</span>
                  <span className="uppercase text-[11px] font-sans font-black">Tiếng Việt</span>
                </div>
                {language === "vi" && <Check className="w-3.5 h-3.5 text-[#facc15]" />}
              </button>
            </div>

            {/* Quick Switch Button */}
            <button
              type="button"
              onClick={() => changeLanguage(language === "vi" ? "en" : "vi")}
              className="w-full py-2.5 px-4 rounded-xl font-black uppercase italic text-xs tracking-wider border-b-4 border-r-2 bg-[#1d4ed8] hover:bg-[#2563eb] border-[#1e3a8a] text-white flex items-center justify-center gap-2 shadow-lg active:translate-y-0.5 transition-all"
            >
              <Globe className="w-4 h-4" />
              <span>
                {language === "vi"
                  ? t("switch_to_english")
                  : t("switch_to_vietnamese")}
              </span>
            </button>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#4a2c17] hover:bg-[#5c371d] border-2 border-[#b45309] text-[#fde68a] font-serif font-black uppercase text-xs tracking-wider active:scale-95 transition-all shadow-md"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
};
