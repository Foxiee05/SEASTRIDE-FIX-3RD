import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../context/GameContext";
import {
  ASSETS,
  getShipImageForLevel,
  getCannonImageForLevel,
  getShieldImageForLevel,
} from "../assets";
import { useCutoutImage } from "../utils/imageUtils";
import { Player, BattleResult } from "../types";
import {
  Crosshair,
  Shield,
  Zap,
  Sparkles,
  ChevronRight,
  Eye,
  Dices,
  List,
  Bomb,
  Swords,
  Check,
  Gamepad2,
} from "lucide-react";
import { RaidBossScreen } from "./RaidBossScreen";
import { TreasureHuntScreen } from "./TreasureHuntScreen";

interface SailingShip {
  id: string;
  name: string;
  title: string;
  isPlayer: boolean;
  playerData?: Player;
  x: number; // % (0-100)
  y: number; // % (0-100)
  vx: number;
  vy: number;
  shipLevel: number;
  shipCondition: number;
  currentHp: number;
  maxHp: number;
  cannonLevel: number;
  cannonCount: number;
  shieldLevel: number;
  equippedDecorations: string[];
}

interface TheSeaViewProps {
  onOpenAttackModal: () => void;
  onSelectTargetForAttack?: (player: Player) => void;
  onSwitchToBuild: () => void;
}

export const TheSeaView: React.FC<TheSeaViewProps> = ({
  onOpenAttackModal,
  onSelectTargetForAttack,
  onSwitchToBuild,
}) => {
  const {
    currentServer,
    shipLevel,
    shipCondition,
    shipCurrentHp,
    shipMaxHp,
    cannonLevel,
    cannonCount,
    shieldLevel,
    equippedDecorations,
    attackPlayer,
    energy,
    seaGameMode,
    setSeaGameMode,
  } = useGame();

  const [selectedShip, setSelectedShip] = useState<SailingShip | null>(null);

  // Direct battle state inside Sea view for immediate action feedback
  const [isFiringSalvo, setIsFiringSalvo] = useState<boolean>(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);

  // Initialize sailing ships array
  const [ships, setShips] = useState<SailingShip[]>([]);
  const shipsRef = useRef<SailingShip[]>([]);
  const animationRef = useRef<number | null>(null);

  // Keep shipsRef synced
  useEffect(() => {
    shipsRef.current = ships;
  }, [ships]);

  // Create initial fleet
  useEffect(() => {
    const list: SailingShip[] = [];

    // 1. Add Player's own flagship
    list.push({
      id: "player_flagship",
      name: "Your Flagship",
      title: "Captain",
      isPlayer: true,
      x: 45 + (Math.random() * 10 - 5),
      y: 50 + (Math.random() * 10 - 5),
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      shipLevel,
      shipCondition,
      currentHp: shipCurrentHp,
      maxHp: shipMaxHp,
      cannonLevel,
      cannonCount,
      shieldLevel,
      equippedDecorations,
    });

    // 2. Add server opponent ships
    currentServer.players.forEach((p, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const startX = 15 + col * 22 + (Math.random() * 8 - 4);
      const startY = 15 + row * 22 + (Math.random() * 8 - 4);

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.03 + Math.random() * 0.04;

      const decs: string[] = [];
      if (idx % 2 === 0) decs.push("dec_jolly_roger");
      if (idx % 3 === 0) decs.push("dec_kraken_figurehead");
      if (p.shipCondition < 30) decs.push("dec_ghost_glow");
      if (idx === 1) decs.push("dec_golden_cannons");

      list.push({
        id: p.id,
        name: p.name,
        title: p.title,
        isPlayer: false,
        playerData: p,
        x: Math.max(10, Math.min(85, startX)),
        y: Math.max(10, Math.min(80, startY)),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        shipLevel: p.shipLevel,
        shipCondition: p.shipCondition,
        currentHp: p.currentHp,
        maxHp: p.maxHp,
        cannonLevel: p.cannonLevel,
        cannonCount: p.cannonCount,
        shieldLevel: p.shieldLevel,
        equippedDecorations: decs,
      });
    });

    setShips(list);
    shipsRef.current = list;
  }, [
    currentServer,
    shipLevel,
    shipCondition,
    shipCurrentHp,
    shipMaxHp,
    cannonLevel,
    cannonCount,
    shieldLevel,
    equippedDecorations,
  ]);

  // Optimized Physics loop with throttled React state flushing (12 FPS state update + CSS interpolation = 60 FPS silky smooth visuals with 80% lower CPU load)
  useEffect(() => {
    let lastTime = performance.now();
    let lastRenderTime = 0;

    const animate = (time: number) => {
      const dt = Math.min(50, time - lastTime);
      lastTime = time;

      if (shipsRef.current.length > 0) {
        const nextShips = shipsRef.current.map((ship) => {
          let nx = ship.x + ship.vx * (dt / 16);
          let ny = ship.y + ship.vy * (dt / 16);
          let nvx = ship.vx;
          let nvy = ship.vy;

          if (nx < 8) {
            nx = 8;
            nvx = Math.abs(nvx);
          } else if (nx > 88) {
            nx = 88;
            nvx = -Math.abs(nvx);
          }

          if (ny < 12) {
            ny = 12;
            nvy = Math.abs(nvy);
          } else if (ny > 82) {
            ny = 82;
            nvy = -Math.abs(nvy);
          }

          return {
            ...ship,
            x: nx,
            y: ny,
            vx: nvx,
            vy: nvy,
          };
        });

        shipsRef.current = nextShips;

        // Flush React state every 80ms (~12 FPS)
        if (time - lastRenderTime > 80) {
          lastRenderTime = time;
          setShips(nextShips);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handler for Bomb Random Ship
  const handleBombRandomShip = () => {
    const enemyShips = ships.filter((s) => !s.isPlayer && s.playerData);
    if (enemyShips.length === 0) return;
    const randomIndex = Math.floor(Math.random() * enemyShips.length);
    const target = enemyShips[randomIndex];
    setSelectedShip(target);
  };

  // Handler to execute bomb attack on target ship
  const handleFireBombOnShip = (targetShip: SailingShip) => {
    if (!targetShip.playerData) return;
    if (energy < 1) {
      alert("Not enough Energy! You need 1 Energy to launch a Bomb raid.");
      return;
    }
    if (shipCondition <= 50) {
      alert(
        "Ship condition is too low (<= 50%)! Repair your ship before entering battle.",
      );
      return;
    }

    setIsFiringSalvo(true);

    setTimeout(() => {
      const res = attackPlayer(targetShip.playerData!);
      setIsFiringSalvo(false);
      if (res) {
        setBattleResult(res);
      }
    }, 1200);
  };

  if (seaGameMode === "raid") {
    return (
      <div className="relative w-full h-full min-h-0 flex flex-col overflow-hidden select-none">
        <RaidBossScreen
          onBackToMenu={() => setSeaGameMode("bombing")}
        />
      </div>
    );
  }

  if (seaGameMode === "treasure") {
    return (
      <div className="relative w-full h-full min-h-0 flex flex-col overflow-y-auto select-none p-1 sm:p-2">
        <TreasureHuntScreen />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden select-none group">
      {/* Cartoon Wave Motion Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,30,60,0.3)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-sky-400/10 mix-blend-overlay animate-pulse pointer-events-none" />

      {/* Action Controls: Random Bomb & Ship List */}
      {!selectedShip && !isFiringSalvo && !battleResult && (
        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30 px-4 flex justify-center pointer-events-none">
          <div className="flex items-center gap-2 sm:gap-3 w-full max-w-sm pointer-events-auto">
            {/* Target Ship List Modal Button */}
            <button
              onClick={onOpenAttackModal}
              className="flex-1 bg-[#d75448] hover:brightness-110 active:scale-95 transition-transform border-b-[3px] border-[#9b3026] text-white h-[clamp(44px,10vh,48px)] rounded-xl text-xs sm:text-sm font-black uppercase italic tracking-wider shadow-sm flex items-center justify-center gap-1 sm:gap-1.5 px-2"
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5 text-red-200" />
              <span>Ship List</span>
            </button>
            {/* Bomb Random Ship Button */}
            <button
              onClick={handleBombRandomShip}
              className="flex-1 bg-[#34aab2] hover:brightness-110 active:scale-95 transition-transform border-2 sm:border-4 border-[#1e7880] text-white h-[clamp(44px,10vh,48px)] rounded-xl text-xs sm:text-sm font-black uppercase italic tracking-wider shadow-[0_3px_0_#1e7880] flex items-center justify-center gap-1 sm:gap-1.5 px-2"
              title="Randomly target an opponent ship"
            >
              <Dices className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>Bomb Random</span>
            </button>
          </div>
        </div>
      )}

      {/* Sailing Ships Container */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        {ships.map((ship) => (
          <ShipOnSeaItem
            key={ship.id}
            ship={ship}
            isSelected={selectedShip?.id === ship.id}
            onClick={() => setSelectedShip(ship)}
            onFireBomb={() => handleFireBombOnShip(ship)}
          />
        ))}
      </div>

      {/* Firing Salvo Animation Banner */}
      {isFiringSalvo && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 animate-fade-in p-4 text-center">
          <img
            src={ASSETS.bombBtn}
            alt="Firing"
            referrerPolicy="no-referrer"
            className="w-24 h-24 object-contain animate-bounce filter drop-shadow-[0_0_20px_rgba(230,57,70,1)]"
          />
          <div className="text-2xl font-black text-[#fbbf24] font-serif uppercase tracking-wider animate-pulse">
            💣 FIRING CANNON SALVO! 💣
          </div>
          <p className="text-xs text-[#fde68a]">
            Bombarding target ship on the high seas...
          </p>
        </div>
      )}

      {/* Battle Result Victory Card Popup */}
      {battleResult && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#2b1d19] border-4 border-[#b45309] rounded-2xl p-5 text-center space-y-4 animate-fade-in shadow-2xl max-w-sm w-full text-amber-100">
            <div className="text-2xl font-black text-[#fbbf24] font-serif tracking-wide uppercase drop-shadow">
              ⚔️ RAID VICTORY! ⚔️
            </div>

            <div className="text-xs text-[#fde68a] font-serif">
              You attacked{" "}
              <span className="font-extrabold text-[#fbbf24]">
                {battleResult.targetPlayer.name}
              </span>
              !
            </div>

            <div className="bg-[#1a0f0d] border-2 border-[#4a2c17] rounded-xl p-3 grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-[10px] text-[#fde68a]/80 font-bold uppercase">
                  Damage Dealt
                </div>
                <div className="text-lg font-mono font-black text-red-400">
                  -{battleResult.damageDealt.toLocaleString()} HP
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#fde68a]/80 font-bold uppercase">
                  Enemy Remaining
                </div>
                <div className="text-lg font-mono font-black text-[#fbbf24]">
                  {battleResult.enemyRemainingHpPercent}% HP
                </div>
              </div>
            </div>

            <div className="bg-[#1a0f0d] border-2 border-[#b45309] rounded-xl p-3 space-y-2">
              <div className="text-xs font-black uppercase text-[#fde68a] font-serif">
                Plundered Loot:
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1 bg-[#4a2c17] border-2 border-[#b45309] px-3 py-1 rounded-xl text-[#fbbf24] font-black text-xs">
                  <span>🪙</span>
                  <span>+{battleResult.coinsEarned} Gold</span>
                </div>

                {battleResult.gemsEarned > 0 && (
                  <div className="flex items-center gap-1 bg-[#1e1b4b] border-2 border-[#4338ca] px-3 py-1 rounded-xl text-sky-200 font-black text-xs">
                    <span>💎</span>
                    <span>+{battleResult.gemsEarned} Gem!</span>
                  </div>
                )}
              </div>

              {battleResult.cannonLooted && (
                <div className="bg-[#93bb44] border-b-4 border-[#658627] text-white shadow-sm border-2 border-[#064e3b] p-2 rounded-xl flex items-center justify-center gap-1.5 text-white text-[10px] font-black uppercase">
                  <Sparkles className="w-4 h-4 text-[#facc15]" />
                  <span>
                    Stole enemy Lv{battleResult.lootedCannonLevel} Cannon!
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setBattleResult(null);
                setSelectedShip(null);
              }}
              className="w-full bg-[#b45309] hover:bg-[#d97706] border-b-4 border-r-2 border-[#2b1d19] text-white font-black py-2.5 rounded-xl uppercase italic tracking-wider text-xs shadow-xl active:translate-y-1"
            >
              Continue Ocean Patrol
            </button>
          </div>
        </div>
      )}

      {/* Selected Ship Bottom Info Drawer */}
      {selectedShip && !battleResult && !isFiringSalvo && (
        <div className="absolute bottom-4 left-4 right-4 z-40 max-w-md mx-auto bg-[#4a2c17] border-4 border-[#2b1d19] rounded-2xl p-3 shadow-2xl text-amber-100 animate-fade-in">
          <div className="flex justify-between items-center border-b-2 border-[#b45309] pb-1.5 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {selectedShip.isPlayer ? "⛵" : "🏴‍☠️"}
              </span>
              <div>
                <div className="text-xs font-serif font-black text-white">
                  {selectedShip.name}{" "}
                  {selectedShip.isPlayer && "(Your Flagship)"}
                </div>
                <div className="text-[10px] text-[#fde68a]/80 font-mono">
                  {selectedShip.title} • Lv.{selectedShip.shipLevel} Vessel
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedShip(null)}
              className="text-xs font-black bg-[#2b1d19] border border-[#b45309] text-[#fde68a] px-2 py-0.5 rounded-lg"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
            <div className="bg-[#1a0f0d] p-1.5 rounded-xl border border-[#4a2c17]">
              <div className="text-[9px] text-[#fde68a]/80 font-bold uppercase">
                Condition
              </div>
              <div className="text-xs font-black text-[#fbbf24]">
                {selectedShip.shipCondition}% HP
              </div>
            </div>
            <div className="bg-[#1a0f0d] p-1.5 rounded-xl border border-[#4a2c17]">
              <div className="text-[9px] text-[#fde68a]/80 font-bold uppercase">
                Mounted Cannons
              </div>
              <div className="text-xs font-black text-amber-200">
                Lv.{selectedShip.cannonLevel} x{selectedShip.cannonCount}
              </div>
            </div>
          </div>

          {selectedShip.isPlayer ? (
            <button
              onClick={onSwitchToBuild}
              className="w-full bg-[#1d4ed8] hover:bg-[#2563eb] border-b-4 border-[#1e3a8a] text-white py-2 rounded-xl font-black text-xs uppercase italic flex items-center justify-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>Modify In Ship Build Yard</span>
            </button>
          ) : (
            <button
              onClick={() => handleFireBombOnShip(selectedShip)}
              className="w-full bg-red-700 hover:bg-red-600 border-b-4 border-red-950 text-white py-2.5 rounded-xl font-black text-xs uppercase italic flex items-center justify-center gap-2 shadow-xl active:translate-y-1"
            >
              <img
                src={ASSETS.bombBtn}
                alt="Bomb"
                referrerPolicy="no-referrer"
                className="w-5 h-5 object-contain animate-bounce"
              />
              <span>💣 FIRE BOMBS AT THIS SHIP! (1 Energy)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Individual Sailing Ship Component on the Ocean
const ShipOnSeaItem = React.memo(
  ({
    ship,
    isSelected,
    onClick,
    onFireBomb,
  }: {
    ship: SailingShip;
    isSelected: boolean;
    onClick: () => void;
    onFireBomb: () => void;
  }) => {
    const shipRawImg = getShipImageForLevel(ship.shipLevel);
    const cannonRawImg = getCannonImageForLevel(ship.cannonLevel);
    const shieldRawImg = getShieldImageForLevel(ship.shieldLevel);

    // Opaque Cutout Hooks so images are completely solid with 0 background
    const shipImg = useCutoutImage(shipRawImg, {
      mode: "edge",
      keepInternalGreenAsBlack: ship.shipLevel === 1,
    });
    const cannonImg = useCutoutImage(cannonRawImg);
    const shieldImg = useCutoutImage(shieldRawImg);

    // Angle heading direction from velocity
    const angleDeg = (Math.atan2(ship.vy, ship.vx) * 180) / Math.PI;

    return (
      <div
        onClick={onClick}
        style={{
          left: `${ship.x}%`,
          top: `${ship.y}%`,
          transform: "translate(-50%, -50%)",
          transition: "left 80ms linear, top 80ms linear",
        }}
        className={`absolute cursor-pointer transition-transform duration-300 group z-20 ${
          isSelected ? "scale-110 z-30" : "hover:scale-105"
        }`}
      >
        {/* Light Water Ripple Base */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-cyan-400/20 rounded-full animate-pulse pointer-events-none" />

        {/* Name Tag & HP Bar above ship */}
        <div className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 whitespace-nowrap flex flex-col items-center pointer-events-none z-30">
          <div
            className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black font-serif shadow-lg border ${
              ship.isPlayer
                ? "bg-[#93bb44] border-b-4 border-[#658627] text-white shadow-sm border-[#064e3b] text-white"
                : isSelected
                  ? "bg-[#b45309] border-[#facc15] text-[#fde68a]"
                  : "bg-[#2b1d19]/90 border-[#4a2c17] text-white"
            }`}
          >
            {ship.name}
          </div>

          {/* Mini HP Bar */}
          <div className="w-10 sm:w-14 bg-[#1a0f0d] h-1 sm:h-1.5 rounded-full overflow-hidden border border-[#4a2c17] mt-0.5">
            <div
              className={`h-full ${
                ship.shipCondition <= 30
                  ? "bg-red-500"
                  : ship.shipCondition <= 60
                    ? "bg-amber-400"
                    : "bg-emerald-400"
              }`}
              style={{ width: `${ship.shipCondition}%` }}
            />
          </div>
        </div>

        {/* TARGET LOCK & BOMB BUTTON FOLLOWING THIS TARGET SHIP DIRECTLY ON THE SEA */}
        {isSelected && !ship.isPlayer && (
          <div className="absolute -top-14 sm:-top-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center animate-bounce pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFireBomb();
              }}
              className="bg-red-600 hover:bg-red-500 text-white font-black text-[9px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl border-2 border-[#facc15] shadow-[0_0_15px_rgba(220,38,38,0.9)] uppercase italic whitespace-nowrap flex items-center gap-1 active:scale-95"
            >
              <span>💣 BOMB!</span>
            </button>
            <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-6 border-t-[#facc15]" />
          </div>
        )}

        {/* Rotating Ship Graphic according to sailing heading */}
        <div
          className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center transition-transform duration-500"
          style={{ transform: `rotate(${angleDeg + 90}deg)` }}
        >
          {/* Target Crosshair Circle around selected ship */}
          {isSelected && (
            <div className="absolute -inset-2 rounded-full border-2 border-dashed border-red-500 animate-spin pointer-events-none z-10" />
          )}

          {/* Shield Barrier if active */}
          {ship.shieldLevel > 0 && (
            <div className="absolute -inset-2 rounded-full border-2 border-cyan-400 bg-cyan-400/20 shadow-[0_0_12px_rgba(0,210,255,0.6)] animate-pulse pointer-events-none z-10" />
          )}

          {/* Decorations Overlays */}
          {ship.equippedDecorations.includes("dec_jolly_roger") && (
            <span className="absolute top-0 right-1 text-[10px] sm:text-xs z-30">
              🏴‍☠️
            </span>
          )}
          {ship.equippedDecorations.includes("dec_kraken_figurehead") && (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs z-30">
              🦑
            </span>
          )}
          {ship.equippedDecorations.includes("dec_ghost_glow") && (
            <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-sm pointer-events-none" />
          )}
          {ship.equippedDecorations.includes("dec_golden_cannons") && (
            <Sparkles className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#facc15] animate-spin" />
          )}

          {/* Completely Opaque Cutout Ship Image */}
          <img
            src={shipImg}
            alt={ship.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]"
          />

          {/* Mounted Cannon badges */}
          {ship.cannonCount > 0 && (
            <div className="absolute -bottom-1 -right-1 bg-[#1a0f0d] border border-[#b45309] rounded p-0.5 text-[8px] font-black text-[#fbbf24] z-20">
              x{ship.cannonCount}
            </div>
          )}
        </div>
      </div>
    );
  },
);
