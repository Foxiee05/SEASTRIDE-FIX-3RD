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
  const [hitResult, setHitResult] = useState<'hit' | 'miss' | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);

  const requestRef = useRef<number>(0);
  const direction = useRef<number>(1);
  const lastTimeRef = useRef<number>(0);
  const powerRef = useRef<number>(0);
  
  // Keep track of real-time distance for collision closures
  const enemyDistanceRef = useRef<number>(70);
  const enemyReqRef = useRef<number>(0);
  const enemyDirRef = useRef<number>(1);
  
  const powerSpeed = 0.12; // power per ms

  // Handle enemy patrol
  useEffect(() => {
    if (showTutorial) return;

    // Start anywhere between 60 and 85
    const startDist = 60 + Math.random() * 25;
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
        if (next >= 85) {
          next = 85;
          enemyDirRef.current = -1;
        } else if (next <= 55) {
          next = 55;
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
        powerRef.current = next;
        return next;
      });
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isCharging, isFired, showTutorial]);

  const handleChargeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isFired || showTutorial) return;
    setIsCharging(true);
    setPower(0);
    powerRef.current = 0;
    direction.current = 1;
    lastTimeRef.current = 0;
    soundFx.playClick();
  };

  const handleChargeEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isCharging || isFired || showTutorial) return;
    setIsCharging(false);
    setIsFired(true);
    soundFx.playCannonBomb();
    fireBomb();
  };

  const adjustAngle = (delta: number) => {
    if (isFired || showTutorial) return;
    soundFx.playClick();
    setAngle(prev => Math.min(85, Math.max(10, prev + delta)));
  };

  const fireBomb = () => {
    // Origin is player ship (x: 16%, y: 48%)
    const startX = 16; 
    const startY = 48;
    
    const angleRad = (angle * Math.PI) / 180;
    const currentPower = powerRef.current || power;
    const v0 = currentPower * 0.92; 
    const vx = v0 * Math.cos(angleRad);
    const vy = -v0 * Math.sin(angleRad);
    
    const g = 9.8;
    let t = 0;

    const animateBomb = () => {
      t += 0.2; 
      
      const currentX = startX + vx * t;
      const currentY = startY + vy * t + 0.5 * g * t * t;
      
      setBombPos({ x: currentX, y: currentY });
      
      const hitBoxX = 7;
      const hitBoxY = 12;
      const isDirectHit = Math.abs(currentX - enemyDistanceRef.current) < hitBoxX && Math.abs(currentY - 48) < hitBoxY;
      
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
    setExplosionPos({ x: finalX, y: Math.min(finalY, 70) });
    setShowExplosion(true);
    setHitResult(isHit ? 'hit' : 'miss');
    
    setTimeout(() => {
      onComplete(isHit);
    }, 1000);
  };

  // Generate dotted line for aiming
  const renderAimLine = () => {
    if (isFired) return null;
    
    const dots = [];
    const startX = 16;
    const startY = 48;
    const angleRad = (angle * Math.PI) / 180;
    const v0 = 50 * 0.92;
    const vx = v0 * Math.cos(angleRad);
    const vy = -v0 * Math.sin(angleRad);
    const g = 9.8;
    
    for (let t = 0; t < 6; t += 0.45) {
      const x = startX + vx * t;
      const y = startY + vy * t + 0.5 * g * t * t;
      if (y > 90 || x > 95) break;
      
      dots.push(
        <div 
          key={t}
          className="absolute w-2 h-2 bg-red-600 rounded-full opacity-70 border border-white/40 shadow-sm"
          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        />
      );
    }
    
    return dots;
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden select-none flex flex-col bg-cover bg-no-repeat bg-center z-40"
      style={{ backgroundImage: `url(${bgImageSrc})` }}
    >
      {showTutorial && (
        <MinigameTutorialOverlay 
          title={t("minigame_cannon_aim_title")} 
          instruction={t("minigame_cannon_aim_inst")} 
          onDismiss={() => setShowTutorial(false)} 
        />
      )}

      {/* Top Floating HUD Overlay: Title & Distance */}
      <div className="absolute top-3 left-0 right-0 flex items-center justify-center z-20 pointer-events-none px-4">
        <div className="bg-[#1a0f0d]/85 px-4 py-1.5 rounded-full border border-[#facc15]/40 shadow-xl text-center flex items-center gap-3">
          <span className="text-amber-200 text-xs sm:text-sm font-black uppercase tracking-wider font-serif">
            {t("minigame_cannon_aim_title")}
          </span>
          <span className="text-stone-400">•</span>
          <span className="text-red-400 font-mono font-bold text-xs sm:text-sm">
            {t("target")}: {Math.round(enemyDistance)}m
          </span>
        </div>
      </div>

      {/* Player Ship */}
      <div 
        className="absolute z-10 w-20 h-20 sm:w-24 sm:h-24 drop-shadow-2xl pointer-events-none"
        style={{ left: '16%', top: '48%', transform: 'translate(-50%, -50%)' }}
      >
        <img src={playerShipSrc} alt="Player" className="w-full h-full object-contain" />
      </div>

      {/* Enemy Ship */}
      <div 
        className="absolute z-10 w-20 h-20 sm:w-24 sm:h-24 drop-shadow-2xl pointer-events-none"
        style={{ left: `${enemyDistance}%`, top: '48%', transform: 'translate(-50%, -50%)' }}
      >
        <img src={enemyShipSrc} alt="Enemy" className="w-full h-full object-contain -scale-x-100" />
      </div>

      {/* Aim Trajectory Line */}
      {!isFired && renderAimLine()}

      {/* Flying Bomb */}
      {bombPos && (
        <div 
          className="absolute w-4 h-4 bg-black rounded-full shadow-lg z-20 border border-amber-500"
          style={{ left: `${bombPos.x}%`, top: `${bombPos.y}%`, transform: 'translate(-50%, -50%)' }}
        />
      )}

      {/* Explosion Effect */}
      {showExplosion && explosionPos && (
        <div 
          className="absolute z-30 w-28 h-28 flex items-center justify-center animate-ping"
          style={{ left: `${explosionPos.x}%`, top: `${explosionPos.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-full h-full bg-orange-500 rounded-full blur-md opacity-80" />
          <div className="absolute w-1/2 h-1/2 bg-yellow-300 rounded-full blur-sm" />
        </div>
      )}

      {/* Hit / Miss Result Indicator */}
      {hitResult && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in duration-200">
          <div className={`whitespace-nowrap inline-flex items-center gap-1.5 font-black text-sm sm:text-base uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-xl backdrop-blur-sm ${
            hitResult === 'hit' 
              ? 'text-emerald-300 bg-emerald-950/95 border-emerald-400/90 shadow-emerald-950/60' 
              : 'text-rose-300 bg-rose-950/95 border-rose-400/90 shadow-rose-950/60'
          }`}>
            <span>{hitResult === 'hit' ? '🎯' : '⚠️'}</span>
            <span>{hitResult === 'hit' ? t("minigame_perfect_hit") : t("minigame_glance_hit")}</span>
          </div>
        </div>
      )}

      {/* Vertical Power Gauge (Dynamically spans between top and bottom, never overflows) */}
      <div className="absolute right-3 sm:right-5 top-16 bottom-24 w-5 sm:w-6 bg-[#1a0f0d]/90 rounded-xl border-2 border-[#4a2c17] overflow-hidden shadow-2xl flex flex-col justify-end z-20 pointer-events-none">
        {/* Tick Marks */}
        <div className="absolute top-[25%] left-0 w-full h-[1.5px] bg-black/80 z-10" />
        <div className="absolute top-[50%] left-0 w-full h-[1.5px] bg-black/80 z-10" />
        <div className="absolute top-[75%] left-0 w-full h-[1.5px] bg-black/80 z-10" />
        
        {/* Visual Fill */}
        <div 
          className="w-full absolute bottom-0 left-0"
          style={{ 
            height: `${power}%`,
            background: 'linear-gradient(to top, #22c55e, #eab308, #ef4444)'
          }}
        />
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 px-4 sm:px-8 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex items-center justify-between z-20">
        
        {/* Angle Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button 
            onPointerDown={() => adjustAngle(-5)} 
            className="w-9 h-9 sm:w-10 sm:h-10 bg-[#f5e5c0] hover:bg-white active:scale-95 rounded-lg border-2 border-amber-500 shadow-md flex items-center justify-center transition-transform text-[#4a2c17] font-black"
            title="Decrease Angle"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <div className="text-amber-200 font-mono font-black text-sm sm:text-base w-14 text-center bg-[#1a0f0d] py-1 px-1.5 rounded-lg border-2 border-[#4a2c17] shadow-inner">
            {angle}°
          </div>
          <button 
            onPointerDown={() => adjustAngle(5)} 
            className="w-9 h-9 sm:w-10 sm:h-10 bg-[#f5e5c0] hover:bg-white active:scale-95 rounded-lg border-2 border-amber-500 shadow-md flex items-center justify-center transition-transform text-[#4a2c17] font-black"
            title="Increase Angle"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>

        {/* Center Fire Button with Hold Instruction */}
        <div className="flex flex-col items-center justify-center relative">
          <button
            onMouseDown={handleChargeStart}
            onTouchStart={handleChargeStart}
            onMouseUp={handleChargeEnd}
            onTouchEnd={handleChargeEnd}
            onMouseLeave={handleChargeEnd}
            onTouchCancel={handleChargeEnd}
            disabled={isFired}
            className="relative w-14 h-14 sm:w-16 sm:h-16 bg-[#f5e5c0] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.6)] border-4 border-amber-400 hover:bg-white active:scale-95 transition-transform z-30 flex items-center justify-center"
            style={{ opacity: isFired ? 0.5 : 1 }}
          >
            <img src={fuseBtnSrc} alt="FIRE" className="absolute w-full h-full object-contain scale-[1.7] drop-shadow-[0_0_12px_rgba(255,100,0,0.6)] z-10 pointer-events-none" />
          </button>
          <span className="text-amber-200 font-black text-[10px] sm:text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wider text-center mt-0.5">
            {isCharging ? `${Math.round(power)}%` : t("minigame_hold")}
          </span>
        </div>

        {/* Right: Power Indicator */}
        <div className="text-right">
          <div className="text-[10px] sm:text-xs text-amber-300 font-bold uppercase tracking-wider">
            {t("power")}
          </div>
          <div className="text-amber-200 font-mono font-black text-sm sm:text-base">
            {Math.round(power)}%
          </div>
        </div>

      </div>
    </div>
  );
};
