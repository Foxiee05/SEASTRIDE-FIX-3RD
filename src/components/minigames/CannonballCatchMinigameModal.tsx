import React, { useState, useEffect, useRef, useCallback } from "react";
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
      if (time - spawnTimerRef.current > 600) { // Spawn every 600ms
        spawnTimerRef.current = time;
        const isBomb = Math.random() > 0.4;
        const newObj: FallingObject = {
          id: Date.now() + Math.random(),
          type: isBomb ? 'bomb' : 'obstacle',
          image: isBomb ? bombSrc : obstacleImages[Math.floor(Math.random() * obstacleImages.length)],
          x: 10 + Math.random() * 80, // 10% to 90%
          y: -10, // Start above screen
          speed: 0.04 + Math.random() * 0.02, // speed in % per ms
        };
        objectsRef.current.push(newObj);
      }

      // Update positions and check collisions
      const currentCatcherX = catcherXRef.current;
      const catcherY = 85; // % from top
      const catcherWidth = 20; // approximate hit width in %
      const catcherHeight = 10; // approximate hit height in %
      
      let nextObjects = [...objectsRef.current];
      
      for (let i = nextObjects.length - 1; i >= 0; i--) {
        const obj = nextObjects[i];
        obj.y += obj.speed * deltaTime;

        // Collision logic
        const inXBounds = Math.abs(obj.x - currentCatcherX) < catcherWidth / 2 + 5;
        const inYBounds = Math.abs(obj.y - catcherY) < catcherHeight / 2 + 5;

        if (inXBounds && inYBounds) {
          // Hit!
          if (obj.type === 'bomb') {
            setScore(s => s + 1);
            showFeedback('CATCH!', 'good');
            soundFx.playClick(); // placeholder for catch sound
            nextObjects.splice(i, 1);
            continue;
          } else {
            // Hit obstacle - IMMEDIATE GLANCE HIT
            if (!isGameOverRef.current) {
              isGameOverRef.current = true;
              if (animationRef.current) cancelAnimationFrame(animationRef.current);
              onComplete(false); // Immediate GLANCE HIT
              return;
            }
          }
        }

        // Out of bounds
        if (obj.y > 110) {
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

  // Timer
  useEffect(() => {
    if (isGameOver || showTutorial) return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (isGameOverRef.current) return t; // prevent triggering handleGameOver if already completed
        if (t <= 1) {
          handleGameOver();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

      return () => clearInterval(timer);
    }, [isGameOver, showTutorial]);

  const handleGameOver = () => {
    if (isGameOverRef.current) return;
    isGameOverRef.current = true;
    setIsGameOver(true);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };
  
  const showFeedback = (text: string, type: 'good'|'bad') => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback(null);
    }, 500);
  };

  // Interaction handlers
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isGameOver || showTutorial) return;
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let percent = (x / rect.width) * 100;
    percent = Math.max(10, Math.min(90, percent));
    
    setCatcherX(percent);
    catcherXRef.current = percent;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none touch-none">
      <div 
        ref={containerRef}
        className="relative w-[95%] max-w-lg h-[80dvh] bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-between py-6 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImageSrc})` }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
      >
        
        {showTutorial && (
          <MinigameTutorialOverlay 
            title={t("minigame_catch_title")} 
            instruction={t("minigame_catch_inst")} 
            onDismiss={() => setShowTutorial(false)} 
          />
        )}

        {/* HUD */}
        <div className="w-full px-6 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-[#1a0f0d]/80 px-4 py-2 rounded-xl border-2 border-[#4a2c17] shadow-lg">
            <h3 className="text-amber-400 font-black text-sm uppercase tracking-wider">{t("minigame_time")}: {timeLeft}s</h3>
          </div>
        </div>

        {/* Feedback text */}
        {feedback && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
            <span className={`font-black text-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,1)] uppercase tracking-widest ${feedback.type === 'good' ? 'text-green-400' : 'text-red-500'}`}>
              {feedback.text}
            </span>
          </div>
        )}

        {/* Game Area */}
        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
          {objects.map(obj => (
            <img 
              key={obj.id}
              src={obj.image}
              alt={obj.type}
              className={`absolute w-12 h-12 sm:w-16 sm:h-16 object-contain -translate-x-1/2 -translate-y-1/2 ${obj.type === 'obstacle' ? 'animate-[spin_2s_linear_infinite]' : ''}`}
              style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
              referrerPolicy="no-referrer"
            />
          ))}

          {/* Catcher */}
          <div 
            className="absolute bottom-[5%] w-20 h-20 sm:w-28 sm:h-28 -translate-x-1/2"
            style={{ left: `${catcherX}%` }}
          >
            <img 
              src={catcherSrc}
              alt="Catcher"
              className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        
        {/* Title/Instructions overlay at start? We can just keep it simple */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/60 z-40 flex items-center justify-center">
             <div className="bg-[#2b1d19] border-4 border-[#b45309] p-8 rounded-2xl shadow-2xl text-center animate-fade-in flex flex-col items-center gap-4">
               <h2 className="text-4xl font-black text-amber-400 drop-shadow-md">{t("minigame_times_up")}!</h2>
               <button 
                 onClick={() => onComplete(true)}
                 className="mt-2 bg-[#b45309] hover:bg-[#d97706] border-b-4 border-r-2 border-[#2b1d19] text-white font-black py-3 px-8 rounded-xl uppercase italic tracking-wider text-sm shadow-xl active:translate-y-1 transition-all"
               >
                 {t("continue_patrol").replace("Continue Patrol", "Continue").replace("Tiếp Tục Tuần Tra", "Tiếp Tục")} 
               </button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
