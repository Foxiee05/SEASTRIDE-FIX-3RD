import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { Wrench, X, AlertTriangle, ShieldCheck, CircleDollarSign, Sparkles, Info } from "lucide-react";
import { InfoModal } from "./InfoModal";
import { CurrencyDisplay } from "./CurrencyDisplay";

interface RepairModalProps {
  onClose: () => void;
}

export const RepairModal: React.FC<RepairModalProps> = ({ onClose }) => {
  const [infoState, setInfoState] = useState<{title: string; message: string} | null>(null);
  const { coins, shipCondition, repairShip, rebuildShip, t } = useGame();
  
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

  const handleRepair = () => {
    if (shipCondition === 0) {
      rebuildShip();
    } else if (effectiveRepairAmount > 0) {
      repairShip(effectiveRepairAmount);
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
              {t("ship_repair")}
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
          {/* Top Info Button outside box */}
          <div className="flex justify-end -mb-2">
            <button
              type="button"
              onClick={() =>
                setInfoState({
                  title: t("ship_repair"),
                  message: t("ship_repair_desc"),
                })
              }
              className="bg-[#4a2c17] hover:bg-[#92400e] text-[#fde68a] border border-[#b45309] p-1.5 rounded-lg shadow-md flex items-center justify-center transition-all active:scale-95"
              title={t("ship_repair_info", "Ship Repair Info")}
            >
              <Info className="w-3.5 h-3.5 text-sky-400" />
            </button>
          </div>

          {/* Status Banner */}
          <div className="bg-[#2b1d19] border-4 border-[#b45309] rounded-2xl p-4 text-center space-y-2.5">
            <div className="text-xs font-serif font-black uppercase text-[#fde68a]">
              {t("ship_condition_gauge")}
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
                <span>{t("ship_destroyed_rebuild")}</span>
              </div>
            ) : shipCondition <= 50 ? (
              <div className="text-xs font-bold text-[#fde68a] bg-[#4a2c17] p-2 rounded-xl border border-[#b45309]">
                {t("condition_low_warning")}
              </div>
            ) : shipCondition >= 100 ? (
              <div className="text-xs font-bold text-emerald-200 bg-[#064e3b]/80 p-2 rounded-xl border border-[#16a34a] flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>{t("ship_pristine")}</span>
              </div>
            ) : (
              <div className="text-xs font-bold text-emerald-200 bg-[#064e3b]/80 p-2 rounded-xl border border-[#16a34a] flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{t("ship_combat_ready")}</span>
              </div>
            )}
          </div>

          {/* Action Area */}
          {shipCondition === 0 ? (
            <div className="space-y-3 bg-[#2b1d19] p-3.5 rounded-xl border-2 border-[#b45309] text-center">
              <p className="text-xs text-[#fde68a]">
                {t("rebuild_desc")}
              </p>
              <button
                onClick={rebuildShip}
                disabled={coins < 100}
                className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 border-b-4 border-r-2 border-red-950 text-white font-black py-3 rounded-xl uppercase italic tracking-wider text-sm shadow-xl active:translate-y-1 flex items-center justify-center gap-2"
              >
                <span>{t("rebuild_ship")} (100</span>
                <CircleDollarSign className="w-4 h-4 text-[#f0c242]" />
                <span>)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 bg-[#2b1d19] p-3.5 rounded-xl border-2 border-[#b45309]">
              {/* Slider Header */}
              <div className="flex justify-center items-center font-serif font-black text-[#fde68a]">
                <span className={`${shipCondition >= 100 ? "text-stone-400" : "text-[#fbbf24]"} flex items-center justify-center gap-1.5 text-base`}>
                  {t("cost")}: {repairCost}
                  <CircleDollarSign className={`w-[18px] h-[18px] ${shipCondition >= 100 ? "text-stone-400" : "text-[#f0c242]"}`} />
                </span>
              </div>

              {/* Range Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, maxRepairPossible)}
                  step={maxRepairPossible >= 5 ? 5 : 1}
                  value={effectiveRepairAmount}
                  disabled={shipCondition >= 100}
                  onChange={(e) => setRepairAmount(Number(e.target.value))}
                  className={`w-full accent-[#fbbf24] h-2 bg-[#1a0f0d] rounded-lg appearance-none ${
                    shipCondition >= 100 ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                  }`}
                />
                
                {/* Preset Quick Chips */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  {[10, 25, 50, maxRepairPossible].map((preset, idx) => {
                    const presetVal = Math.min(preset, maxRepairPossible);
                    if (idx > 0 && presetVal === Math.min([10, 25, 50, maxRepairPossible][idx - 1], maxRepairPossible)) {
                      return null; // Skip duplicates
                    }
                    const isMax = idx === 3 || presetVal === maxRepairPossible;
                    const isActive = effectiveRepairAmount === presetVal && shipCondition < 100;
                    const isDisabled = shipCondition >= 100 || maxRepairPossible <= 0;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setRepairAmount(presetVal)}
                        className={`text-[10px] font-bold font-mono px-2 py-1 rounded-lg border transition-all ${
                          isDisabled
                            ? "bg-stone-800 text-stone-500 border-stone-700 opacity-60 cursor-not-allowed"
                            : isActive
                            ? "bg-[#fbbf24] text-[#2b1d19] border-[#fde68a] shadow"
                            : "bg-[#4a2c17] text-[#fde68a] border-[#b45309] hover:bg-[#5c371d]"
                        }`}
                      >
                        {isMax ? `${t("max")} (+${presetVal}%)` : `+${presetVal}%`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center pt-1">
                <button
                  onClick={handleRepair}
                  disabled={shipCondition >= 100 || coins < repairCost || effectiveRepairAmount <= 0}
                  className={`w-full max-w-[240px] border-b-4 border-r-2 py-2.5 rounded-xl text-xs uppercase italic shadow-md active:translate-y-0.5 flex items-center justify-center font-black transition-all ${
                    shipCondition >= 100 || coins < repairCost || effectiveRepairAmount <= 0
                      ? "bg-stone-700 hover:bg-stone-700 border-stone-900 text-stone-400 cursor-not-allowed opacity-75"
                      : "bg-[#1d4ed8] hover:bg-[#2563eb] border-[#1e3a8a] text-white"
                  }`}
                >
                  <span>{t("repair")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <InfoModal isOpen={!!infoState} onClose={() => setInfoState(null)} title={infoState?.title || ""} message={infoState?.message || ""} />
    </div>
  );
};
