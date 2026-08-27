import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { Wrench, X, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { CurrencyDisplay } from "./CurrencyDisplay";

interface RepairModalProps {
  onClose: () => void;
}

export const RepairModal: React.FC<RepairModalProps> = ({ onClose }) => {
  const { coins, shipCondition, repairShip, rebuildShip } = useGame();
  const [repairAmount, setRepairAmount] = useState<number>(25);

  const repairCost = Math.ceil(repairAmount / 5) * 5;
  const maxRepairPossible = 100 - shipCondition;

  const handleRepair = () => {
    if (shipCondition === 0) {
      rebuildShip();
    } else {
      repairShip(repairAmount);
    }
  };

  const handleFullRepair = () => {
    if (maxRepairPossible > 0) {
      repairShip(maxRepairPossible);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none">
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
              className="p-1.5 bg-[#4a2c17] hover:bg-[#92400e] rounded-lg border border-[#b45309] text-[#fde68a]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status Banner */}
          <div className="bg-[#2b1d19] border-4 border-[#b45309] rounded-2xl p-4 text-center space-y-2">
            <div className="text-xs font-serif font-black uppercase text-[#fde68a]">
              Ship Condition Gauge
            </div>

            <div className="text-4xl font-black font-mono tracking-tight text-[#fbbf24] drop-shadow">
              {shipCondition}%
            </div>

            {/* Gauge */}
            <div className="w-full bg-[#1a0f0d] h-4 rounded-full border border-[#4a2c17] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  shipCondition <= 0
                    ? "bg-red-600"
                    : shipCondition <= 50
                      ? "bg-[#fbbf24]"
                      : "bg-[#93bb44] border-b-4 border-[#658627] text-white shadow-sm"
                }`}
                style={{ width: `${shipCondition}%` }}
              />
            </div>

            {shipCondition <= 0 ? (
              <div className="text-xs font-bold text-red-300 bg-red-950/80 p-2 rounded-xl border border-red-800 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>SHIP DESTROYED! Must Rebuild first.</span>
              </div>
            ) : shipCondition <= 50 ? (
              <div className="text-xs font-bold text-[#fde68a] bg-[#4a2c17] p-2 rounded-xl border border-[#b45309]">
                ⚠️ Condition is &le; 50%. Raids disabled until repaired above
                50%!
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
                Rebuild increases condition from 0% to 5% so you can perform
                standard repairs.
              </p>
              <button
                onClick={rebuildShip}
                disabled={coins < 50}
                className="w-full bg-red-700 hover:bg-red-600 border-b-4 border-r-2 border-red-950 text-white font-black py-3 rounded-xl uppercase italic tracking-wider text-sm shadow-xl active:translate-y-1"
              >
                <span>Rebuild Ship (50 Coins)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 bg-[#2b1d19] p-3.5 rounded-xl border-2 border-[#b45309]">
              <div className="flex justify-between items-center text-xs font-serif font-black text-[#fde68a]">
                <span>Repair Slider (+{repairAmount}%)</span>
                <span className="text-[#fbbf24]">Cost: {repairCost} Coins</span>
              </div>

              <input
                type="range"
                min={5}
                max={Math.max(5, maxRepairPossible)}
                step={5}
                value={repairAmount}
                onChange={(e) => setRepairAmount(Number(e.target.value))}
                className="w-full accent-[#fbbf24] cursor-pointer"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleRepair}
                  disabled={coins < repairCost || maxRepairPossible <= 0}
                  className="bg-[#1d4ed8] hover:bg-[#2563eb] border-b-4 border-r-2 border-[#1e3a8a] text-white font-black py-2.5 rounded-xl text-xs uppercase italic shadow-md active:translate-y-0.5"
                >
                  Repair +{repairAmount}% ({repairCost} 🪙)
                </button>

                <button
                  onClick={handleFullRepair}
                  disabled={
                    maxRepairPossible <= 0 ||
                    coins < Math.ceil(maxRepairPossible / 5) * 5
                  }
                  className="bg-[#b45309] hover:bg-[#d97706] border-b-4 border-r-2 border-[#2b1d19] text-white font-black py-2.5 rounded-xl text-xs uppercase italic shadow-md active:translate-y-0.5"
                >
                  Full Repair 100%
                </button>
              </div>

              <p className="text-[10px] text-[#fde68a]/70 font-mono text-center pt-1">
                *Rate: 5 Gold Coins for every 5% Condition restored.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
