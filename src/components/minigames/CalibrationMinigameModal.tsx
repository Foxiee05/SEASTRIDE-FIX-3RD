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
  const [showTutorial, setShowTutorial] = useState(true);
  const requestRef = useRef<number>(0);
  const direction = useRef<number>(1);
  const lastTimeRef = useRef<number>(0);
  
  // High speed oscillation
  const speed = 0.14; // pos per ms

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

    let isWin = false;
    if (!isTimeout) {
      // Check if needle is between 40 and 60 (center)
      setNeedlePos(currentPos => {
        isWin = currentPos >= 40 && currentPos <= 60;
        return currentPos;
      });
    }
    
    setTimeout(() => {
      onComplete(isWin);
    }, 400); // Shorter delay so feedback feels faster
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div 
        className="relative w-[95%] max-w-lg h-[80dvh] bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-between py-6 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImageSrc})` }}
      >
        {showTutorial && (
          <MinigameTutorialOverlay 
            title={t("minigame_calibration_title")} 
            instruction={t("minigame_calibration_inst")} 
            onDismiss={() => setShowTutorial(false)} 
          />
        )}
        
        {/* Ship Decoration - Upper Half */}
        <div className="w-full flex-1 flex flex-col items-center justify-start pt-8 sm:pt-12 pointer-events-none z-10">
          <img 
            src={shipSrc} 
            alt="Enemy Ship" 
            className="w-24 sm:w-32 md:w-40 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] animate-[pulse_4s_ease-in-out_infinite]"
          />
        </div>

        {/* Lower Half Content: Gauge and Cannon */}
        <div className="relative z-10 w-full flex flex-col items-center px-4 mt-auto">
          {/* Gauge Track & Needle - pushed down */}
          <div className="w-full max-w-[280px] relative h-14 sm:h-16 flex flex-col items-center justify-center mb-6 mt-8">
            {/* Optimal Zone Highlight (behind track) */}
            <div className="absolute left-[38%] right-[38%] top-0 bottom-0 bg-green-500/30 blur-sm rounded-full pointer-events-none" />
            
            {/* Track Layer */}
            <img 
              src={gaugeTrackSrc}
              alt="Gauge Track"
              className="w-full h-full z-10 object-contain drop-shadow-2xl relative"
              referrerPolicy="no-referrer"
            />

            {/* Needle overlaying the track container in layout (visually above the track) */}
            <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-20 flex items-end">
              <img 
                src={gaugeNeedleSrc}
                alt="Needle"
                className="absolute bottom-0 w-8 object-contain origin-bottom"
                style={{ 
                  left: `${needlePos}%`, 
                  transform: 'translateX(-50%) scale(0.85)',
                  filter: 'drop-shadow(0 -2px 10px rgba(255,0,0,0.8))'
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Action Button: Cannon */}
          <div className="relative z-10 w-full flex justify-center mb-2">
            <button
              onClick={() => {
                soundFx.playClick();
                handleLock(false);
              }}
              disabled={isLocked || showTutorial}
              className="w-32 sm:w-40 md:w-48 max-w-[200px] focus:outline-none hover:scale-105 active:scale-95 transition-transform drop-shadow-2xl z-30"
              style={{ opacity: isLocked ? 0.8 : 1 }}
            >
              <img 
                src={miniCannonSrc} 
                alt="Fire Cannon" 
                className="w-full h-auto object-contain pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" 
              />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

