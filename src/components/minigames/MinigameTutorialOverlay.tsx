import React from "react";
import { useGame } from "../../context/GameContext";

interface Props {
  title: string;
  instruction: string;
  onDismiss: () => void;
}

export const MinigameTutorialOverlay: React.FC<Props> = ({ title, instruction, onDismiss }) => {
  const { t } = useGame();

  return (
    <div 
      className="absolute inset-0 z-[10005] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-[#f0dec1] text-[#4a2c17] rounded-2xl border-4 border-[#8b5a33] shadow-[0_6px_0_#4a2c17] p-4 sm:p-5 font-serif box-border w-[min(320px,calc(100vw-32px))] select-none flex flex-col items-center text-center">
        <h3 className="text-xl sm:text-2xl font-black text-[#4a2c17] mb-2 uppercase tracking-wide">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-[#8b5a33] font-bold leading-relaxed mb-6">
          {instruction}
        </p>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="bg-[#93bb44] border-b-4 border-[#658627] text-white font-black text-sm sm:text-base px-8 py-2.5 rounded-xl shadow-md active:border-b-0 active:translate-y-1 active:scale-95 transition-all cursor-pointer w-full tracking-wider uppercase"
        >
          {t("got_it")}
        </button>
      </div>
    </div>
  );
};
