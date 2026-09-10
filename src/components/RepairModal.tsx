import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { Wrench, X, AlertTriangle, ShieldCheck, CircleDollarSign, Sparkles } from "lucide-react";
import { CurrencyDisplay } from "./CurrencyDisplay";

interface RepairModalProps {
  onClose: () => void;
}

export const RepairModal: React.FC<RepairModalProps> = ({ onClose }) => {
  const { coins, shipCondition, repairShip, rebuildShip } = useGame();
  
  const maxRepairPossible = Math.max(0, 100 - shipCondition);
  const minRepair = maxRepairPossible > 0 ? (maxRepairPossible >= 5 ? 5 : maxRepairPossible) : 0;
  
  const [repairAmount, setRepairAmount] = useState<number>(() => {
    return maxRepairPossible > 0 ? Math.min(25, maxRepairPossible) : 0;
  });

  // Keep repairAmount valid if shipCondition changes
  useEffect(() => {
    if (maxRepairPossible > 0) {
      setRepairAmount((prev) => {
        if (prev <= 0 || prev > maxRepairPossible) {
          return maxRepairPossible >= 25 ? 25 : maxRepairPossible;
        }
        return prev;
      });
    } else {
      setRepairAmount(0);
    }
  }, [shipCondition, maxRepairPossible]);

  const effectiveRepairAmount = maxRepairPossible > 0 
    ? Math.max(minRepair, Math.min(repairAmount, maxRepairPossible))
    : 0;

  const repairCost = Math.ceil(effectiveRepairAmount / 5) * 5;
  const fullRepairCost = Math.ceil(maxRepairPossible / 5) * 5;

  const handleRepair = () => {
    if (shipCondition === 0) {
      rebuildShip();
    } else if (effectiveRepairAmount > 0) {
      repairShip(effectiveRepairAmount);
    }
  };

  const handleFullRepair = () => {
    if (maxRepairPossible > 0) {
      repairShip(maxRepairPossible);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none animate-fade-in">
      <div className="bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-amber-100 flex flex-col">
        {/* Header */}
        <div className="bg-[#2b1d19] border-b-4 border-[#4a2c17] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#16a34a]" />
            <h2 className="text-base font-serif font-black uppercase text-[#fde68a] tracking-wider">
              Ship Repair
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <CurrencyDisplay />
            <button
              onClick={onClose}
              className="p-1.5 bg-[#4a2c17] hover:bg-[#92400e] active:scale-95 rounded-lg border border-[#b45309] text-[#fde68a]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status Banner */}
          <div className="bg-[#2b1d19] border-4 border-[#b45309] rounded-2xl p-4 text-center space-y-2.5">
            <div className="text-xs font-serif font-black uppercase text-[#fde68a]">
              Ship Condition Gauge
            </div>

            <div className="text-4xl font-black font-mono tracking-tight text-[#fbbf24] drop-shadow">
              {shipCondition}%
            </div>

            {/* Gauge */}
            <div className="w-full bg-[#1a0f0d] h-4 rounded-full border border-[#4a2c17] overflow-hidden relative">
              {/* Existing Condition */}
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  shipCondition <= 0
                    ? "bg-red-600"
                    : shipCondition <= 50
                      ? "bg-[#fbbf24]"
                      : "bg-[#93bb44] border-b-2 border-[#658627]"
                }`}
                style={{ width: `${shipCondition}%` }}
              />
              {/* Preview Added Condition */}
              {effectiveRepairAmount > 0 && maxRepairPossible > 0 && (
                <div
                  className="absolute top-0 bottom-0 bg-emerald-400/50 animate-pulse rounded-r-full"
                  style={{
                    left: `${shipCondition}%`,
                    width: `${effectiveRepairAmount}%`,
                  }}
                />
              )}
            </div>

            {shipCondition <= 0 ? (
              <div className="text-xs font-bold text-red-300 bg-red-950/80 p-2 rounded-xl border border-red-800 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>SHIP DESTROYED! Must Rebuild first.</span>
              </div>
            ) : shipCondition <= 50 ? (
              <div className="text-xs font-bold text-[#fde68a] bg-[#4a2c17] p-2 rounded-xl border border-[#b45309]">
                ⚠️ Condition is &le; 50%. Raids disabled until repaired above 50%!
              </div>
            ) : shipCondition >= 100 ? (
              <div className="text-xs font-bold text-emerald-200 bg-[#064e3b]/80 p-2 rounded-xl border border-[#16a34a] flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>Ship is in pristine 100% condition!</span>
              </div>
            ) : (
              <div className="text-xs font-bold text-emerald-200 bg-[#064e3b]/80 p-2 rounded-xl border border-[#16a34a] flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Ship condition is combat-ready (&gt;50%)!</span>
              </div>
            )}
          </div>

          {/* Action Area */}
          {shipCondition === 0 ? (
            <div className="space-y-3 bg-[#2b1d19] p-3.5 rounded-xl border-2 border-[#b45309] text-center">
              <p className="text-xs text-[#fde68a]">
                Rebuild increases condition from 0% to 5% so you can perform standard repairs.
              </p>
              <button
                onClick={rebuildShip}
                disabled={coins < 50}
                className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 border-b-4 border-r-2 border-red-950 text-white font-black py-3 rounded-xl uppercase italic tracking-wider text-sm shadow-xl active:translate-y-1 flex items-center justify-center gap-2"
              >
                <span>Rebuild Ship (50</span>
                <CircleDollarSign className="w-4 h-4 text-[#f0c242]" />
                <span>)</span>
              </button>
            </div>
          ) : maxRepairPossible <= 0 ? (
            <div className="bg-[#2b1d19] p-4 rounded-xl border-2 border-[#b45309] text-center space-y-2">
              <p className="text-xs text-[#fde68a] font-serif font-bold">
                No repairs currently needed. Your vessel is ready for battle!
              </p>
              <button
                onClick={onClose}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] border-b-4 border-emerald-900 text-white font-black py-2.5 rounded-xl text-xs uppercase italic shadow-md active:translate-y-0.5"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 bg-[#2b1d19] p-3.5 rounded-xl border-2 border-[#b45309]">
              {/* Slider Header */}
              <div className="flex justify-between items-center text-xs font-serif font-black text-[#fde68a]">
                <span>Repair: +{effectiveRepairAmount}% ({shipCondition}% ➔ {Math.min(100, shipCondition + effectiveRepairAmount)}%)</span>
                <span className="text-[#fbbf24] flex items-center gap-1">
                  Cost: {repairCost}
                  <CircleDollarSign className="w-3.5 h-3.5 text-[#f0c242]" />
                </span>
              </div>

              {/* Range Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={minRepair}
                  max={maxRepairPossible}
                  step={maxRepairPossible >= 5 ? 5 : 1}
                  value={effectiveRepairAmount}
                  onChange={(e) => setRepairAmount(Number(e.target.value))}
                  className="w-full accent-[#fbbf24] cursor-pointer h-2 bg-[#1a0f0d] rounded-lg appearance-none"
                />
                
                {/* Preset Quick Chips */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  {[10, 25, 50, maxRepairPossible].map((preset, idx) => {
                    const presetVal = Math.min(preset, maxRepairPossible);
                    if (idx > 0 && presetVal === Math.min([10, 25, 50, maxRepairPossible][idx - 1], maxRepairPossible)) {
                      return null; // Skip duplicates
                    }
                    const isMax = idx === 3 || presetVal === maxRepairPossible;
                    const isActive = effectiveRepairAmount === presetVal;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRepairAmount(presetVal)}
                        className={`text-[10px] font-bold font-mono px-2 py-1 rounded-lg border transition-all ${
                          isActive
                            ? "bg-[#fbbf24] text-[#2b1d19] border-[#fde68a] shadow"
                            : "bg-[#4a2c17] text-[#fde68a] border-[#b45309] hover:bg-[#5c371d]"
                        }`}
                      >
                        {isMax ? `Max (+${presetVal}%)` : `+${presetVal}%`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleRepair}
                  disabled={coins < repairCost || effectiveRepairAmount <= 0}
                  className="bg-[#1d4ed8] hover:bg-[#2563eb] disabled:opacity-40 disabled:hover:bg-[#1d4ed8] border-b-4 border-r-2 border-[#1e3a8a] text-white font-black py-2.5 rounded-xl text-xs uppercase italic shadow-md active:translate-y-0.5 flex items-center justify-center gap-1.5"
                >
                  <span>Repair +{effectiveRepairAmount}%</span>
                  <span className="text-[10px] font-mono opacity-90 flex items-center">
                    ({repairCost} <CircleDollarSign className="w-3 h-3 ml-0.5 text-[#f0c242]" />)
                  </span>
                </button>

                <button
                  onClick={handleFullRepair}
                  disabled={
                    maxRepairPossible <= 0 ||
                    coins < fullRepairCost
                  }
                  className="bg-[#b45309] hover:bg-[#d97706] disabled:opacity-40 disabled:hover:bg-[#b45309] border-b-4 border-r-2 border-[#2b1d19] text-white font-black py-2.5 rounded-xl text-xs uppercase italic shadow-md active:translate-y-0.5 flex items-center justify-center gap-1.5"
                >
                  <span>Full Repair 100%</span>
                  <span className="text-[10px] font-mono opacity-90 flex items-center">
                    ({fullRepairCost} <CircleDollarSign className="w-3 h-3 ml-0.5 text-[#f0c242]" />)
                  </span>
                </button>
              </div>

              <p className="text-[10px] text-[#fde68a]/70 font-mono text-center pt-1">
                *Rate: 5 Coins for every 5% Condition restored.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
