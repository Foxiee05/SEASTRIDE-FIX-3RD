import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { Player, BattleResult } from "../types";
import { ASSETS, getShipImageForLevel } from "../assets";
import { useCutoutImage } from "../utils/imageUtils";
import { X, Sparkles } from "lucide-react";
import { MinigameSelector } from "./minigames/MinigameSelector";
import confetti from "canvas-confetti";

interface AttackModalProps {
  onClose: () => void;
}

export const AttackModal: React.FC<AttackModalProps> = ({ onClose }) => {
  const { currentServer, attackPlayer, energy, t, shipCondition } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [minigameTarget, setMinigameTarget] = useState<Player | null>(null);
  const [isAttacking, setIsAttacking] = useState<boolean>(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const bombCutout = useCutoutImage(ASSETS.bombBtn);

  const players = currentServer.players;

  // Trigger fireworks on WIN / PERFECT HIT
  useEffect(() => {
    if (battleResult && battleResult.minigameResult === 'win') {
      const duration = 2500;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [battleResult]);


  const handleLaunchAttack = () => {
    if (!selectedPlayer) return;
    if (energy < 1) {
      alert("Not enough Energy! You need 1 Energy to launch a Bomb raid.");
      return;
    }
    if (shipCondition <= 50) {
      alert("Ship condition is too low (<= 50%)! Repair your ship before entering battle.");
      return;
    }
    setMinigameTarget(selectedPlayer);
  };

  const executeAttack = (isWin: boolean) => {
    if (!minigameTarget) return;
    const target = minigameTarget;
    setMinigameTarget(null);
    setIsAttacking(true);

    setTimeout(() => {
      const result = attackPlayer(target, isWin ? 'win' : 'lose');
      setIsAttacking(false);
      if (result) {
        setBattleResult(result);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none">
      {minigameTarget && (
        <MinigameSelector onComplete={executeAttack} />
      )}
      <div className="bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2b1d19] border-b-4 border-[#4a2c17] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={bombCutout}
              alt="Bomb"
              referrerPolicy="no-referrer"
              className="w-7 h-7 object-contain"
            />
            <h2 className="text-base font-serif font-black uppercase text-[#fde68a] tracking-wider">
              {t("launch_raid")} • {currentServer.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-[#4a2c17] hover:bg-[#92400e] rounded-lg border border-[#b45309] text-[#fde68a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* If battle result is ready */}
          {battleResult ? (
            <div className={`bg-[#2b1d19] rounded-2xl p-5 text-center space-y-4 shadow-2xl transition-all ${
              battleResult.minigameResult === 'win'
                ? 'animate-[shake_0.5s_ease-in-out] border-4 border-[#facc15] shadow-[0_0_30px_rgba(250,204,21,0.3)]'
                : 'border-4 border-[#b45309] animate-fade-in'
            }`}>
              {/* Header Title */}
              <div className={`text-3xl font-black font-serif tracking-wide uppercase drop-shadow ${
                battleResult.minigameResult === 'win'
                  ? 'text-[#facc15]'
                  : 'text-[#fbbf24]'
              }`}>
                {battleResult.minigameResult === 'lose' ? t("minigame_glance_hit") : battleResult.minigameResult === 'win' ? t("minigame_perfect_hit") : t("raid_victory")}
              </div>

              <div className="text-xs text-[#fde68a] font-serif">
                {t("you_attacked")}{" "}
                <span className="font-extrabold text-[#fbbf24]">
                  {battleResult.targetPlayer.name}
                </span>
                !
              </div>

              {/* Damage & HP Result */}
              <div className="bg-[#1a0f0d] border-2 border-[#4a2c17] rounded-xl p-3 grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-[#fde68a]/80 font-bold uppercase">
                    {t("damage_dealt")}
                  </div>
                  <div className="text-xl font-mono font-black text-red-400 flex items-center justify-center gap-1">
                    -{battleResult.damageDealt.toLocaleString()} HP
                    {battleResult.minigameResult === 'win' && (
                      <span className="text-xs text-[#facc15]">↑</span>
                    )}
                  </div>
                  {battleResult.shieldBlocked && (
                    <div className="text-[10px] text-sky-400 font-bold mt-0.5">
                      🛡️ {t("shield_absorbed")} -{battleResult.shieldReductionPercent}%
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] text-[#fde68a]/80 font-bold uppercase">
                    {t("enemy_remaining_hp")}
                  </div>
                  <div className="text-xl font-mono font-black text-[#fbbf24]">
                    {battleResult.enemyRemainingHpPercent}%
                  </div>
                  <div className="text-[10px] text-[#fde68a]/70 font-mono">
                    {battleResult.targetPlayer.currentHp.toLocaleString()} /{" "}
                    {battleResult.targetPlayer.maxHp.toLocaleString()} HP
                  </div>
                </div>
              </div>

              {/* Loot Rewards */}
              <div className={`bg-[#1a0f0d] border-2 rounded-xl p-3 space-y-2 border-[#b45309]`}>
                <div className={`text-xs font-black uppercase font-serif text-[#fde68a]`}>
                  {t("plundered_loot")}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1.5 bg-[#4a2c17] border-2 border-[#b45309] px-3.5 py-1.5 rounded-xl text-[#fbbf24] font-extrabold">
                    <span className="text-lg">🪙</span>
                    <span>+{battleResult.coinsEarned} {t("coins")}</span>
                  </div>

                  {battleResult.gemsEarned > 0 && (
                    <div className="flex items-center gap-1.5 bg-[#1e1b4b] border-2 border-[#4338ca] px-3.5 py-1.5 rounded-xl text-sky-200 font-extrabold">
                      <span className="text-lg">💎</span>
                      <span>+{battleResult.gemsEarned} {t("gems")}!</span>
                    </div>
                  )}
                </div>

                {/* Cannon Loot Drop Alert */}
                {battleResult.cannonLooted && (
                  <div className="bg-[#93bb44] border-b-4 border-[#658627] text-white shadow-sm border-2 border-[#064e3b] p-2.5 rounded-xl flex flex-col items-center justify-center gap-0.5 animate-bounce text-white mt-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-5 h-5 text-[#facc15]" />
                      <span className="text-xs font-black uppercase tracking-wide">
                        {t("looted_cannon")} Lv.{battleResult.lootedCannonLevel}!
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-100 font-sans">
                      {t("added_to_armory")}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setBattleResult(null)}
                className={`w-full font-black py-3 rounded-xl uppercase italic tracking-wider text-sm shadow-xl active:translate-y-1 transition-colors bg-[#b45309] hover:bg-[#d97706] border-b-4 border-r-2 border-[#2b1d19] text-white`}
              >
                {t("raid_again")}
              </button>
            </div>
          ) : isAttacking ? (
            /* Cannon Firing Animation Screen */
            <div className="py-12 text-center space-y-4">
              <div className="relative inline-block">
                <img
                  src={bombCutout}
                  alt="Firing"
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 object-contain animate-spin mx-auto filter drop-shadow-[0_0_20px_rgba(230,57,70,1)]"
                />
              </div>
              <div className="text-xl font-black text-[#fbbf24] font-serif tracking-widest uppercase animate-pulse">
                {t("firing_cannons")}
              </div>
              <p className="text-xs text-[#fde68a]">
                {t("calculating_impact")}
              </p>
            </div>
          ) : (
            /* Target Selector Screen */
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <span className="text-xs font-serif font-black uppercase text-[#fde68a]">
                  {t("select_target")} ({players.length} {t("ships")})
                </span>
              </div>

              {/* Player list */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {players.map((p) => (
                  <PlayerTargetItem
                    key={p.id}
                    player={p}
                    isSelected={selectedPlayer?.id === p.id}
                    onSelect={() => setSelectedPlayer(p)}
                  />
                ))}
              </div>

              {/* Selected Target Summary & Fire Button */}
              {selectedPlayer && (
                <div className="bg-[#2b1d19] border-4 border-[#b45309] rounded-2xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs font-serif font-black text-[#fde68a]">
                    <span>{t("target_locked")}: {selectedPlayer.name}</span>
                    <span className="text-[#fbbf24]">{t("cost")}: 1 {t("energy")}</span>
                  </div>

                  <button
                    onClick={handleLaunchAttack}
                    disabled={energy < 1}
                    className="w-full bg-red-700 hover:bg-red-600 border-b-4 border-r-2 border-red-950 text-white font-black py-3 rounded-xl uppercase italic tracking-wider text-base shadow-2xl active:translate-y-1 flex items-center justify-center gap-2"
                  >
                    <span>💣 {t("fire_bomb_salvo")}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PlayerTargetItem: React.FC<{
  player: Player;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ player: p, isSelected, onSelect }) => {
  const { t } = useGame();
  const rawShipImg = getShipImageForLevel(p.shipLevel);
  const shipImg = useCutoutImage(rawShipImg, {
    mode: "edge",
    keepInternalGreenAsBlack: p.shipLevel === 1,
  });

  return (
    <div
      onClick={onSelect}
      className={`p-2.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
        isSelected
          ? "bg-[#2b1d19] border-[#facc15] shadow-lg"
          : "bg-[#2b1d19] border-[#b45309] hover:border-[#fde68a]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 bg-[#1a0f0d] rounded-lg p-1 border border-[#4a2c17] overflow-hidden flex items-center justify-center">
          <img
            src={shipImg}
            alt={p.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain"
          />
        </div>

        <div>
          <div className="text-sm font-black text-white font-serif">
            {p.name}
          </div>
          <div className="text-[10px] text-[#fde68a]/80">{p.title}</div>
          <div className="text-[10px] text-[#fbbf24] font-mono">
            {t("ship")} Lv.{p.shipLevel} • {p.currentHp.toLocaleString()} / {p.maxHp.toLocaleString()} HP ({p.shipCondition}%)
            {p.shieldLevel > 0 && (
              <span className="text-sky-300 ml-1">🛡️ Lv.{p.shieldLevel}</span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right">
        {p.shipCondition < 30 && (
          <span className="text-[9px] bg-red-950 border border-red-600 text-red-300 font-black px-1.5 py-0.5 rounded uppercase block mb-1">
            {t("lootable_cannons")}
          </span>
        )}
        <span className="text-xs font-extrabold text-[#fde68a]">
          {isSelected ? `🎯 ${t("target_locked")}` : t("select")}
        </span>
      </div>
    </div>
  );
};
