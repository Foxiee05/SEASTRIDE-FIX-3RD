import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { soundFx } from "../../utils/audio";
import { MinigameTutorialOverlay } from "./MinigameTutorialOverlay";

import bombSrc from "../../assets/images/BOMB_v2.png";
import catcherSrc from "../../assets/images/Catcher_v2.png";
import tentacleSrc from "../../assets/images/tentacle.png";
import finSrc from "../../assets/images/fin.png";
import bumSrc from "../../assets/images/bum.png";
import bgImageSrc from "../../assets/images/minibg.png";

interface Props {
  onComplete: (isWin: boolean) => void;
}

interface FallingObject {
  id: number;
  type: 'bomb' | 'obstacle';
  image: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  speed: number;
}

export const CannonballCatchMinigameModal: React.FC<Props> = ({ onComplete }) => {
  const { t } = useGame();
  const [timeLeft, setTimeLeft] = useState(10);
  const [catcherX, setCatcherX] = useState(50);
  const [objects, setObjects] = useState<FallingObject[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string, type: 'good' | 'bad' } | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const objectsRef = useRef<FallingObject[]>([]);
  const catcherXRef = useRef(50);
  const isGameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const obstacleImages = [tentacleSrc, finSrc, bumSrc];

  // Game Loop
  useEffect(() => {
    if (isGameOver || showTutorial) return;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Spawn logic
      if (time - spawnTimerRef.current > 550) { // Spawn every 550ms
        spawnTimerRef.current = time;
        const isBomb = Math.random() > 0.35;
        const newObj: FallingObject = {
          id: Date.now() + Math.random(),
          type: isBomb ? 'bomb' : 'obstacle',
          image: isBomb ? bombSrc : obstacleImages[Math.floor(Math.random() * obstacleImages.length)],
          x: 15 + Math.random() * 70, // 15% to 85%
          y: -5, // Start slightly above
          speed: 0.045 + Math.random() * 0.02, // speed in % per ms
        };
        objectsRef.current.push(newObj);
      }

      // Update positions and check collisions
      const currentCatcherX = catcherXRef.current;
      const catcherY = 82; // % from top
      const catcherWidth = 18;
      const catcherHeight = 12;
      
      let nextObjects = [...objectsRef.current];
      
      for (let i = nextObjects.length - 1; i >= 0; i--) {
        const obj = nextObjects[i];
        obj.y += obj.speed * deltaTime;

        // Collision logic
        const inXBounds = Math.abs(obj.x - currentCatcherX) < catcherWidth / 2 + 4;
        const inYBounds = Math.abs(obj.y - catcherY) < catcherHeight / 2 + 4;

        if (inXBounds && inYBounds) {
          if (obj.type === 'bomb') {
            scoreRef.current += 1;
            setScore(scoreRef.current);
            showFeedback('CATCH!', 'good');
            soundFx.playCoin();
            nextObjects.splice(i, 1);
            continue;
          } else {
            // Hit obstacle
            if (!isGameOverRef.current) {
              isGameOverRef.current = true;
              setIsGameOver(true);
              soundFx.playClose();
              showFeedback('HIT!', 'bad');
              if (animationRef.current) cancelAnimationFrame(animationRef.current);
              setTimeout(() => {
                onComplete(false);
              }, 700);
              return;
            }
          }
        }

        // Clean up out of bounds objects
        if (obj.y > 105) {
          nextObjects.splice(i, 1);
        }
      }

      objectsRef.current = nextObjects;
      setObjects([...nextObjects]);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isGameOver, showTutorial]);

  // Timer logic
  useEffect(() => {
    if (isGameOver || showTutorial) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isGameOverRef.current) {
            isGameOverRef.current = true;
            setIsGameOver(true);
            const isWin = scoreRef.current >= 3;
            soundFx.playCannonBomb();
            setTimeout(() => {
              onComplete(isWin);
            }, 800);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, showTutorial]);

  const showFeedback = (text: string, type: 'good' | 'bad') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 500);
  };

  const updateCatcherPos = (clientX: number) => {
    if (!containerRef.current || isGameOver || showTutorial) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percent = (x / rect.width) * 100;
    percent = Math.max(12, Math.min(88, percent));
    setCatcherX(percent);
    catcherXRef.current = percent;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updateCatcherPos(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches && e.touches[0]) {
      updateCatcherPos(e.touches[0].clientX);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden select-none touch-none flex flex-col justify-between py-2 px-3 sm:px-4 bg-cover bg-center bg-no-repeat z-40"
      style={{ backgroundImage: `url(${bgImageSrc})` }}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerMove}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchMove}
    >
      {showTutorial && (
        <MinigameTutorialOverlay 
          title={t("minigame_catch_title")} 
          instruction={t("minigame_catch_inst")} 
          onDismiss={() => setShowTutorial(false)} 
        />
      )}

      {/* Top HUD */}
      <div className="w-full px-2 pt-2 flex items-center justify-between z-20 pointer-events-none">
        <div className="bg-[#1a0f0d]/85 px-3 py-1 rounded-xl border border-[#4a2c17] shadow-lg flex items-center gap-1.5">
          <span className="text-amber-400 font-black text-xs sm:text-sm uppercase tracking-wider">
            💣 {score} / 3
          </span>
        </div>
        
        <div className="bg-[#1a0f0d]/85 px-3.5 py-1 rounded-xl border border-[#4a2c17] shadow-lg flex items-center gap-1.5">
          <span className="text-red-400 font-mono font-bold text-xs sm:text-sm uppercase tracking-wider">
            ⏱️ {timeLeft}s
          </span>
        </div>
      </div>

      {/* Feedback text */}
      {feedback && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in duration-150">
          <div className={`whitespace-nowrap inline-flex items-center gap-1.5 font-black text-xs sm:text-sm uppercase tracking-wider px-3.5 py-1 rounded-full border shadow-xl backdrop-blur-sm ${
            feedback.type === 'good' 
              ? 'text-emerald-300 bg-emerald-950/95 border-emerald-400/90 shadow-emerald-950/60' 
              : 'text-rose-300 bg-rose-950/95 border-rose-400/90 shadow-rose-950/60'
          }`}>
            <span>{feedback.type === 'good' ? '✨' : '💥'}</span>
            <span>{feedback.text}</span>
          </div>
        </div>
      )}

      {/* Game Area with Falling Objects & Catcher */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        {objects.map(obj => (
          <img 
            key={obj.id}
            src={obj.image}
            alt={obj.type}
            className={`absolute w-11 h-11 sm:w-14 sm:h-14 object-contain -translate-x-1/2 -translate-y-1/2 ${obj.type === 'obstacle' ? 'animate-[spin_2s_linear_infinite]' : ''}`}
            style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
            referrerPolicy="no-referrer"
          />
        ))}

        {/* Catcher Basket (Placed comfortably above bottom edge, completely uncropped) */}
        <div 
          className="absolute bottom-2 sm:bottom-4 w-20 h-20 sm:w-24 sm:h-24 -translate-x-1/2 pointer-events-none"
          style={{ left: `${catcherX}%` }}
        >
          <img 
            src={catcherSrc}
            alt="Catcher"
            className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Times Up / Finished Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center pointer-events-none p-4">
          <div className="bg-[#241511]/95 border-2 border-amber-600/70 px-5 py-3.5 rounded-xl shadow-2xl text-center flex flex-col items-center gap-2 max-w-[280px] animate-in fade-in zoom-in duration-200">
            <div className={`whitespace-nowrap inline-flex items-center gap-1.5 font-black text-sm sm:text-base uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-lg ${
              score >= 3 
                ? 'text-emerald-300 bg-emerald-950/95 border-emerald-400/90 shadow-emerald-950/60' 
                : 'text-rose-300 bg-rose-950/95 border-rose-400/90 shadow-rose-950/60'
            }`}>
              <span>{score >= 3 ? '🎯' : '⚠️'}</span>
              <span>{score >= 3 ? t("minigame_perfect_hit") : t("minigame_glance_hit")}</span>
            </div>
            <p className="text-amber-200 text-xs font-serif whitespace-nowrap">
              {score >= 3 ? `Caught ${score} cannonballs!` : `Only caught ${score} cannonballs.`}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
