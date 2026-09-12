import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { soundFx } from "../../utils/audio";
import { MinigameTutorialOverlay } from "./MinigameTutorialOverlay";

import gaugeTrackSrc from "../../assets/images/calibration_gauge_track.png";
import gaugeNeedleSrc from "../../assets/images/calibration_needle_indicator.png";
import bgImageSrc from "../../assets/images/simple_menu_bg_1786470898720.jpg";
import miniCannonSrc from "../../assets/images/Mini_Cannon.png";
import shipSrc from "../../assets/images/ship_v2_lv3_green_1786547883554.png";

interface Props {
  onComplete: (isWin: boolean) => void;
}

export const CalibrationMinigameModal: React.FC<Props> = ({ onComplete }) => {
  const { t } = useGame();
  const [timeLeft, setTimeLeft] = useState(5.0);
  const [needlePos, setNeedlePos] = useState(0); // 0 to 100
  const [isLocked, setIsLocked] = useState(false);
  const [lockStatus, setLockStatus] = useState<'none' | 'hit' | 'miss'>('none');
  const [showTutorial, setShowTutorial] = useState(true);
  const requestRef = useRef<number>(0);
  const direction = useRef<number>(1);
  const lastTimeRef = useRef<number>(0);
  const needlePosRef = useRef<number>(0);
  
  // High speed oscillation
  const speed = 0.14; // pos per ms

  // Countdown timer
  useEffect(() => {
    if (isLocked || showTutorial) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timer);
          handleLock(true);
          return 0;
        }
        return Math.max(0, +(prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isLocked, showTutorial]);

  // Needle oscillation animation
  useEffect(() => {
    if (isLocked || showTutorial) return;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      setNeedlePos(prev => {
        let next = prev + speed * deltaTime * direction.current;
        if (next >= 100) {
          next = 100;
          direction.current = -1;
        } else if (next <= 0) {
          next = 0;
          direction.current = 1;
        }
        needlePosRef.current = next;
        return next;
      });
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isLocked, showTutorial]);

  const handleLock = (isTimeout: boolean = false) => {
    if (isLocked) return;
    setIsLocked(true);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    soundFx.playCannonBomb();

    const currentPos = needlePosRef.current;
    // Check if needle is in optimal center target zone (40% to 60%)
    const isWin = !isTimeout && currentPos >= 38 && currentPos <= 62;
    setLockStatus(isWin ? 'hit' : 'miss');
    
    setTimeout(() => {
      onComplete(isWin);
    }, 600);
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden select-none flex flex-col justify-between py-3 px-3 sm:py-5 sm:px-6 bg-cover bg-center bg-no-repeat z-40"
      style={{ backgroundImage: `url(${bgImageSrc})` }}
    >
      {showTutorial && (
        <MinigameTutorialOverlay 
          title={t("minigame_calibration_title")} 
          instruction={t("minigame_calibration_inst")} 
          onDismiss={() => setShowTutorial(false)} 
        />
      )}
      
      {/* Upper Area: Target Ship & Reticle HUD */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative pointer-events-none">
        {/* Targeting Reticle */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 sm:w-36 sm:h-36 border-2 border-dashed border-red-500/70 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute w-20 h-20 sm:w-24 sm:h-24 border border-red-400/50 rounded-full" />
          <div className="absolute w-32 sm:w-40 h-[1.5px] bg-red-500/40" />
          <div className="absolute h-32 sm:h-40 w-[1.5px] bg-red-500/40" />
          <img 
            src={shipSrc} 
            alt="Enemy Ship" 
            className="w-24 sm:w-32 md:w-36 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)] animate-[pulse_3s_ease-in-out_infinite]"
          />
        </div>

        {/* HUD Indicator */}
        <div className="mt-2 bg-[#1a0f0d]/85 px-3 py-1 rounded-full border border-[#facc15]/50 text-amber-200 text-xs font-serif font-black tracking-wider uppercase shadow-lg flex items-center gap-2">
          <span className="text-red-400 font-mono font-bold text-xs sm:text-sm">⏱️ {timeLeft.toFixed(1)}s</span>
          <span className="text-stone-400">•</span>
          <span>{t("minigame_calibration_title")}</span>
        </div>

        {/* Lock Result Badge */}
        {lockStatus !== 'none' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-in fade-in zoom-in duration-200">
            <div className={`whitespace-nowrap inline-flex items-center gap-1.5 font-black text-sm sm:text-base uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-xl backdrop-blur-sm ${
              lockStatus === 'hit' 
                ? 'text-emerald-300 bg-emerald-950/95 border-emerald-400/90 shadow-emerald-950/60' 
                : 'text-rose-300 bg-rose-950/95 border-rose-400/90 shadow-rose-950/60'
            }`}>
              <span>{lockStatus === 'hit' ? '🎯' : '⚠️'}</span>
              <span>{lockStatus === 'hit' ? t("minigame_perfect_hit") : t("minigame_glance_hit")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Middle Area: Gauge Track & Needle */}
      <div className="relative z-10 w-full flex flex-col items-center px-4 my-1 sm:my-2">
        <div className="w-full max-w-[280px] sm:max-w-[320px] relative h-14 sm:h-16 flex flex-col items-center justify-center">
          {/* Target Zone Highlight */}
          <div className="absolute left-[38%] right-[38%] top-0 bottom-0 bg-green-500/35 blur-sm rounded-full pointer-events-none" />
          
          {/* Track Layer */}
          <img 
            src={gaugeTrackSrc}
            alt="Gauge Track"
            className="w-full h-full z-10 object-contain drop-shadow-2xl relative"
            referrerPolicy="no-referrer"
          />

          {/* Needle overlaying the track container */}
          <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-20 flex items-end">
            <img 
              src={gaugeNeedleSrc}
              alt="Needle"
              className="absolute bottom-0 w-7 sm:w-8 object-contain origin-bottom"
              style={{ 
                left: `${needlePos}%`, 
                transform: 'translateX(-50%) scale(0.9)',
                filter: 'drop-shadow(0 -2px 10px rgba(255,0,0,0.8))'
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="text-[10px] sm:text-xs text-amber-300 font-bold uppercase tracking-wider mt-1 drop-shadow text-center">
          {t("minigame_calibration_inst")}
        </div>
      </div>

      {/* Bottom Area: Cannon Fire Button */}
      <div className="relative z-10 w-full flex flex-col items-center mb-1 sm:mb-2">
        <button
          onClick={() => {
            soundFx.playClick();
            handleLock(false);
          }}
          disabled={isLocked || showTutorial}
          className="w-28 sm:w-36 max-w-[160px] focus:outline-none hover:scale-105 active:scale-95 transition-transform drop-shadow-2xl z-30 flex flex-col items-center"
          style={{ opacity: isLocked ? 0.7 : 1 }}
        >
          <img 
            src={miniCannonSrc} 
            alt="Fire Cannon" 
            className="w-full h-auto object-contain pointer-events-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]" 
          />
          <span className="mt-1 text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider bg-black/70 px-4 py-0.5 rounded-full border border-amber-500/50 shadow">
            {t("fire")}!
          </span>
        </button>
      </div>

    </div>
  );
};
