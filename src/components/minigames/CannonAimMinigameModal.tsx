import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { soundFx } from "../../utils/audio";
import { ChevronUp, ChevronDown } from "lucide-react";
import { MinigameTutorialOverlay } from "./MinigameTutorialOverlay";

import bgImageSrc from "../../assets/images/clean_cartoon_beach_bg_1786367953119.jpg";
import playerShipSrc from "../../assets/images/ship_v2_lv1_green_17865478589866.png";
import enemyShipSrc from "../../assets/images/ship_lv5_green_1786545852946.png";
import fuseBtnSrc from "../../assets/images/fuse_spark_ember.png";

interface Props {
  onComplete: (isWin: boolean) => void;
}

export const CannonAimMinigameModal: React.FC<Props> = ({ onComplete }) => {
  const { t } = useGame();
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [isFired, setIsFired] = useState(false);
  const [enemyDistance, setEnemyDistance] = useState(70);
  
  const [bombPos, setBombPos] = useState<{ x: number; y: number } | null>(null);
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPos, setExplosionPos] = useState<{ x: number; y: number } | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);

  const requestRef = useRef<number>(0);
  const direction = useRef<number>(1);
  const lastTimeRef = useRef<number>(0);
  
  // Keep track of real-time distance for collision closures
  const enemyDistanceRef = useRef<number>(70);
  const enemyReqRef = useRef<number>(0);
  const enemyDirRef = useRef<number>(1);
  
  const powerSpeed = 0.1; // power per ms

  // Handle enemy patrol
  useEffect(() => {
    if (showTutorial) return;

    // Start anywhere between 60 and 90
    const startDist = 60 + Math.random() * 30;
    setEnemyDistance(startDist);
    enemyDistanceRef.current = startDist;
    enemyDirRef.current = Math.random() > 0.5 ? 1 : -1;

    let lastEnemyTime = 0;
    const animateEnemy = (time: number) => {
      if (!lastEnemyTime) lastEnemyTime = time;
      const delta = time - lastEnemyTime;
      lastEnemyTime = time;

      const speed = 0.012; // units per ms
      setEnemyDistance(prev => {
        let next = prev + speed * delta * enemyDirRef.current;
        if (next >= 90) {
          next = 90;
          enemyDirRef.current = -1;
        } else if (next <= 60) {
          next = 60;
          enemyDirRef.current = 1;
        }
        enemyDistanceRef.current = next;
        return next;
      });
      enemyReqRef.current = requestAnimationFrame(animateEnemy);
    };
    
    enemyReqRef.current = requestAnimationFrame(animateEnemy);
    return () => { if (enemyReqRef.current) cancelAnimationFrame(enemyReqRef.current); };
  }, [showTutorial]);

  // Handle power charging
  useEffect(() => {
    if (!isCharging || isFired || showTutorial) return;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      setPower(prev => {
        let next = prev + powerSpeed * deltaTime * direction.current;
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
  }, [isCharging, isFired]);

  const handleChargeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isFired || showTutorial) return;
    setIsCharging(true);
    setPower(0);
    direction.current = 1;
    lastTimeRef.current = 0;
    soundFx.playClick();
  };

  const handleChargeEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isCharging || isFired || showTutorial) return;
    setIsCharging(false);
    setIsFired(true);
    fireBomb();
  };

  const adjustAngle = (delta: number) => {
    if (isFired || showTutorial) return;
    setAngle(prev => Math.min(90, Math.max(0, prev + delta)));
  };

  const fireBomb = () => {
    // Origin is player ship around (x: 20, y: 50) in percentage
    const startX = 20; 
    const startY = 50;
    
    // Convert angle to radians
    const angleRad = (angle * Math.PI) / 180;
    
    // Scale power to a reasonable initial velocity
    const v0 = power * 0.9; 
    const vx = v0 * Math.cos(angleRad);
    const vy = -v0 * Math.sin(angleRad);
    
    const g = 9.8;
    
    let t = 0;
    const animateBomb = () => {
      t += 0.2; 
      
      const currentX = startX + vx * t;
      const currentY = startY + vy * t + 0.5 * g * t * t;
      
      setBombPos({ x: currentX, y: currentY });
      
      const hitBoxX = 6;
      const hitBoxY = 10;
      // Evaluate impact against real-time enemy position via ref
      const isDirectHit = Math.abs(currentX - enemyDistanceRef.current) < hitBoxX && Math.abs(currentY - 50) < hitBoxY;
      
      if (isDirectHit) {
        finishShot(currentX, currentY, true);
      } else if (currentY > 75 || currentX > 100) {
        finishShot(currentX, currentY, false);
      } else {
        requestAnimationFrame(animateBomb);
      }
    };
    
    requestAnimationFrame(animateBomb);
  };

  const finishShot = (finalX: number, finalY: number, isHit: boolean) => {
    setBombPos(null);
    setExplosionPos({ x: finalX, y: finalY });
    setShowExplosion(true);
    
    setTimeout(() => {
      onComplete(isHit);
    }, 1000);
  };

  // Generate dotted line for aiming
  const renderAimLine = () => {
    if (isFired) return null;
    
    const dots = [];
    const startX = 20;
    const startY = 50;
    const angleRad = (angle * Math.PI) / 180;
    const v0 = 50 * 0.9;
    const vx = v0 * Math.cos(angleRad);
    const vy = -v0 * Math.sin(angleRad);
    const g = 9.8;
    
    for (let t = 0; t < 7; t += 0.4) {
      const x = startX + vx * t;
      const y = startY + vy * t + 0.5 * g * t * t;
      if (y > 100 || x > 100) break;
      
      dots.push(
        <div 
          key={t}
          className="absolute w-1.5 h-1.5 bg-red-600 rounded-full opacity-60"
          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        />
      );
    }
    
    return dots;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-[95%] max-w-2xl h-[85dvh] transform scale-[0.85] sm:scale-90 origin-center bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Minigame Viewport */}
        <div 
          className="flex-1 bg-cover bg-no-repeat bg-center relative overflow-hidden"
          style={{ backgroundImage: `url(${bgImageSrc})` }}
        >
          {showTutorial && (
            <MinigameTutorialOverlay 
              title={t("minigame_cannon_aim_title")} 
              instruction={t("minigame_cannon_aim_inst")} 
              onDismiss={() => setShowTutorial(false)} 
            />
          )}

          {/* Player Ship */}
          <div 
            className="absolute z-10 w-20 h-20 sm:w-24 sm:h-24 drop-shadow-xl"
            style={{ left: '20%', top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <img src={playerShipSrc} alt="Player" className="w-full h-full object-contain" />
          </div>

          {/* Enemy Ship */}
          <div 
            className="absolute z-10 w-20 h-20 sm:w-24 sm:h-24 drop-shadow-xl"
            style={{ left: `${enemyDistance}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <img src={enemyShipSrc} alt="Enemy" className="w-full h-full object-contain -scale-x-100" />
          </div>

          {/* Aim Line */}
          {!isFired && renderAimLine()}

          {/* Bomb */}
          {bombPos && (
            <div 
              className="absolute w-4 h-4 bg-black rounded-full shadow-lg z-20"
              style={{ left: `${bombPos.x}%`, top: `${bombPos.y}%`, transform: 'translate(-50%, -50%)' }}
            />
          )}

          {/* Explosion */}
          {showExplosion && explosionPos && (
            <div 
              className="absolute z-30 w-32 h-32 flex items-center justify-center animate-ping"
              style={{ left: `${explosionPos.x}%`, top: `${explosionPos.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-full h-full bg-orange-500 rounded-full blur-md opacity-80" />
              <div className="absolute w-1/2 h-1/2 bg-yellow-300 rounded-full blur-sm" />
            </div>
          )}

          {/* Vertical Power Bar (Ruler Style) - Elevated on right side */}
          <div className="absolute right-4 sm:right-6 bottom-40 sm:bottom-48 w-5 sm:w-6 h-56 sm:h-64 bg-[#1a0f0d]/90 rounded-md border-2 border-[#4a2c17] overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] flex flex-col justify-end z-20 pointer-events-none">
            {/* Tick Marks (Ruler Overlay) */}
            <div className="absolute top-[25%] left-0 w-full h-[2px] bg-black/80 z-10" />
            <div className="absolute top-[50%] left-0 w-full h-[2px] bg-black/80 z-10" />
            <div className="absolute top-[75%] left-0 w-full h-[2px] bg-black/80 z-10" />
            
            {/* Visual Fill */}
            <div 
              className="w-full absolute bottom-0 left-0"
              style={{ 
                height: `${power}%`,
                background: 'linear-gradient(to top, #22c55e, #eab308, #ef4444)'
              }}
            />
          </div>

          {/* Floating Controls HUD - Equal spacing */}
          <div className="absolute bottom-0 left-0 w-full px-4 pb-8 sm:pb-12 pt-20 bg-gradient-to-t from-black/50 to-transparent flex flex-row items-center justify-evenly z-20 pointer-events-none">
            
            {/* Angle Controls (Scaled down) */}
            <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-auto">
              <button 
                onPointerDown={() => adjustAngle(5)} 
                className="w-10 h-8 bg-[#F5E5C0] hover:bg-white active:scale-95 rounded-t-md shadow-[inset_0_-2px_0_rgba(217,165,102,1)] border-b-2 border-amber-400 flex items-center justify-center transition-transform"
              >
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-[#8b5a2b]" />
              </button>
              <div className="text-amber-200 font-mono font-black text-sm w-12 text-center bg-[#1a0f0d] p-1 rounded-sm border-2 border-[#4a2c17] shadow-inner">
                {angle}°
              </div>
              <button 
                onPointerDown={() => adjustAngle(-5)} 
                className="w-10 h-8 bg-[#F5E5C0] hover:bg-white active:scale-95 rounded-b-md shadow-[inset_0_-2px_0_rgba(217,165,102,1)] border-b-2 border-amber-400 flex items-center justify-center transition-transform"
              >
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-[#8b5a2b]" />
              </button>
            </div>

            {/* Fire Button (Scaled down) */}
            <div className="flex flex-col items-center justify-center relative pointer-events-auto">
              <button
                onMouseDown={handleChargeStart}
                onTouchStart={handleChargeStart}
                onMouseUp={handleChargeEnd}
                onTouchEnd={handleChargeEnd}
                onMouseLeave={handleChargeEnd}
                onTouchCancel={handleChargeEnd}
                disabled={isFired}
                className="relative w-16 h-16 sm:w-20 sm:h-20 bg-[#F5E5C0] rounded-full shadow-[inset_0_-4px_0_rgba(217,165,102,1),0_4px_10px_rgba(0,0,0,0.5)] border-4 border-amber-400 hover:bg-white active:scale-95 transition-transform z-30 flex items-center justify-center mb-1"
                style={{ opacity: isFired ? 0.5 : 1 }}
              >
                <img src={fuseBtnSrc} alt="FIRE" className="absolute w-full h-full object-contain scale-[1.75] drop-shadow-[0_0_15px_rgba(255,100,0,0.6)] z-10 pointer-events-none" />
              </button>
              <div className="absolute -bottom-5 sm:-bottom-6 flex items-center justify-center w-full pointer-events-none">
                {!isCharging && !isFired && (
                  <span className="text-amber-100 font-black text-xs sm:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wider text-center">
                    {t("minigame_hold")}
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
