import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { Player, BattleResult } from "../types";
import { ASSETS, getShipImageForLevel } from "../assets";
import { useCutoutImage } from "../utils/imageUtils";
import { X, Sparkles } from "lucide-react";

interface AttackModalProps {
  onClose: () => void;
}

export const AttackModal: React.FC<AttackModalProps> = ({ onClose }) => {
  const { currentServer, attackPlayer, energy } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isAttacking, setIsAttacking] = useState<boolean>(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);

  const players = currentServer.players;

  const handleLaunchAttack = () => {
    if (!selectedPlayer) return;
    setIsAttacking(true);

    setTimeout(() => {
      const result = attackPlayer(selectedPlayer);
      setIsAttacking(false);
      if (result) {
        setBattleResult(result);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2b1d19] border-b-4 border-[#4a2c17] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={ASSETS.bombBtn}
              alt="Bomb"
              referrerPolicy="no-referrer"
              className="w-7 h-7 object-contain"
            />
            <h2 className="text-base font-serif font-black uppercase text-[#fde68a] tracking-wider">
              Launch Raid • {currentServer.name}
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
            <div className="bg-[#2b1d19] border-4 border-[#b45309] rounded-2xl p-5 text-center space-y-4 animate-fade-in shadow-2xl">
              <div className="text-3xl font-black text-[#fbbf24] font-serif tracking-wide uppercase drop-shadow">
                ⚔️ RAID VICTORY! ⚔️
              </div>

              <div className="text-xs text-[#fde68a] font-serif">
                You attacked{" "}
                <span className="font-extrabold text-[#fbbf24]">
                  {battleResult.targetPlayer.name}
                </span>
                !
              </div>

              {/* Damage & HP Result */}
              <div className="bg-[#1a0f0d] border-2 border-[#4a2c17] rounded-xl p-3 grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-[#fde68a]/80 font-bold uppercase">
                    Damage Dealt
                  </div>
                  <div className="text-xl font-mono font-black text-red-400">
                    -{battleResult.damageDealt.toLocaleString()} HP
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#fde68a]/80 font-bold uppercase">
                    Enemy Remaining HP
                  </div>
                  <div className="text-xl font-mono font-black text-[#fbbf24]">
                    {battleResult.enemyRemainingHpPercent}%
                  </div>
                </div>
              </div>

              {/* Loot Rewards */}
              <div className="bg-[#1a0f0d] border-2 border-[#b45309] rounded-xl p-3 space-y-2">
                <div className="text-xs font-black uppercase text-[#fde68a] font-serif">
                  Plundered Loot:
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1.5 bg-[#4a2c17] border-2 border-[#b45309] px-3.5 py-1.5 rounded-xl text-[#fbbf24] font-extrabold">
                    <span className="text-lg">🪙</span>
                    <span>+{battleResult.coinsEarned} Gold</span>
                  </div>

                  {battleResult.gemsEarned > 0 && (
                    <div className="flex items-center gap-1.5 bg-[#1e1b4b] border-2 border-[#4338ca] px-3.5 py-1.5 rounded-xl text-sky-200 font-extrabold">
                      <span className="text-lg">💎</span>
                      <span>+{battleResult.gemsEarned} Gem!</span>
                    </div>
                  )}
                </div>

                {/* Cannon Loot Drop Alert */}
                {battleResult.cannonLooted && (
                  <div className="bg-[#93bb44] border-b-4 border-[#658627] text-white shadow-sm border-2 border-[#064e3b] p-2.5 rounded-xl flex items-center justify-center gap-2 animate-bounce text-white">
                    <Sparkles className="w-5 h-5 text-[#facc15]" />
                    <span className="text-xs font-black uppercase tracking-wide">
                      LOOTED CANNON! You stole an enemy Lv
                      {battleResult.lootedCannonLevel} Cannon!
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setBattleResult(null)}
                className="w-full bg-[#b45309] hover:bg-[#d97706] border-b-4 border-r-2 border-[#2b1d19] text-white font-black py-3 rounded-xl uppercase italic tracking-wider text-sm shadow-xl active:translate-y-1"
              >
                Raid Again
              </button>
            </div>
          ) : isAttacking ? (
            /* Cannon Firing Animation Screen */
            <div className="py-12 text-center space-y-4">
              <div className="relative inline-block">
                <img
                  src={ASSETS.bombBtn}
                  alt="Firing"
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 object-contain animate-spin mx-auto filter drop-shadow-[0_0_20px_rgba(230,57,70,1)]"
                />
              </div>
              <div className="text-xl font-black text-[#fbbf24] font-serif tracking-widest uppercase animate-pulse">
                💣 FIRING CANNONSALVO... 💣
              </div>
              <p className="text-xs text-[#fde68a]">
                Calculating impact damage & looting pirate treasure...
              </p>
            </div>
          ) : (
            /* Target Selector Screen */
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <span className="text-xs font-serif font-black uppercase text-[#fde68a]">
                  Select Target Ship ({players.length} Ships In Server)
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
                    <span>Target Locked: {selectedPlayer.name}</span>
                    <span className="text-[#fbbf24]">Cost: 1 Energy</span>
                  </div>

                  <button
                    onClick={handleLaunchAttack}
                    disabled={energy < 1}
                    className="w-full bg-red-700 hover:bg-red-600 border-b-4 border-r-2 border-red-950 text-white font-black py-3 rounded-xl uppercase italic tracking-wider text-base shadow-2xl active:translate-y-1 flex items-center justify-center gap-2"
                  >
                    <span>💣 FIRE BOMB SALVO!</span>
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
            Ship Lv.{p.shipLevel} • {p.currentHp.toLocaleString()} HP (
            {p.shipCondition}%)
          </div>
        </div>
      </div>

      <div className="text-right">
        {p.shipCondition < 30 && (
          <span className="text-[9px] bg-red-950 border border-red-600 text-red-300 font-black px-1.5 py-0.5 rounded uppercase block mb-1">
            Lootable Cannons!
          </span>
        )}
        <span className="text-xs font-extrabold text-[#fde68a]">
          {isSelected ? "🎯 Target" : "Select"}
        </span>
      </div>
    </div>
  );
};
