import React from "react";
import { useGame } from "../context/GameContext";
import {
  getShipImageForLevel,
  getCannonImageForLevel,
  getShieldImageForLevel,
} from "../assets";
import { useCutoutImage } from "../utils/imageUtils";
import { X, Shield, Wrench, Heart } from "lucide-react";

interface ShipInspectModalProps {
  onClose: () => void;
  onOpenRepair: () => void;
  onOpenUpgrades: () => void;
}

export const ShipInspectModal: React.FC<ShipInspectModalProps> = ({
  onClose,
  onOpenRepair,
  onOpenUpgrades,
}) => {
  const {
    shipLevel,
    shipCondition,
    shipCurrentHp,
    shipMaxHp,
    cannonLevel,
    cannonCount,
    shieldLevel,
  } = useGame();

  const shipImg = useCutoutImage(getShipImageForLevel(shipLevel), {
    mode: "edge",
    keepInternalGreenAsBlack: shipLevel === 1,
  });
  const cannonImg = useCutoutImage(getCannonImageForLevel(cannonLevel));
  const shieldImg = useCutoutImage(getShieldImageForLevel(shieldLevel));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-amber-100 flex flex-col">
        {/* Header */}
        <div className="bg-[#2b1d19] border-b-4 border-[#4a2c17] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⛵</span>
            <h2 className="text-base font-serif font-black uppercase text-[#fde68a] tracking-wider">
              Flagship Condition & Diagnostics
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-[#4a2c17] hover:bg-[#92400e] rounded-lg border border-[#b45309] text-[#fde68a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Rendered Ship Display */}
          <div className="bg-[#2b1d19] border-4 border-[#b45309] rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
            <img
              src={shipImg}
              alt="Ship"
              referrerPolicy="no-referrer"
              className="w-40 h-40 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
            />

            <div className="text-lg font-serif font-black text-[#fbbf24] mt-2">
              Level {shipLevel} Pirate Flagship
            </div>

            <div className="text-xs text-[#fde68a] font-mono mt-0.5">
              Hull HP: {shipCurrentHp.toLocaleString()} /{" "}
              {shipMaxHp.toLocaleString()} HP
            </div>
          </div>

          {/* Condition Gauge */}
          <div className="bg-[#2b1d19] border-2 border-[#b45309] rounded-2xl p-3.5 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-serif font-black">
              <span className="text-[#fde68a] flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                <span>Ship Hull Condition</span>
              </span>
              <span
                className={`font-mono text-xs px-2.5 py-0.5 rounded-lg font-black ${
                  shipCondition <= 0
                    ? "bg-red-950 text-red-300 border border-red-600"
                    : shipCondition <= 50
                      ? "bg-[#4a2c17] text-[#fde68a] border border-[#b45309]"
                      : "bg-[#064e3b] text-emerald-200 border border-[#16a34a]"
                }`}
              >
                {shipCondition}% Condition
              </span>
            </div>

            <div className="w-full bg-[#1a0f0d] h-3.5 rounded-full border border-[#4a2c17] overflow-hidden">
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
          </div>

          {/* Equipment Summary Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#2b1d19] border-2 border-[#b45309] p-3 rounded-2xl flex items-center gap-2.5">
              <img
                src={cannonImg}
                alt="Cannon"
                referrerPolicy="no-referrer"
                className="w-8 h-8 object-contain"
              />
              <div>
                <div className="text-[10px] text-[#fde68a]/80 uppercase font-bold">
                  Cannons
                </div>
                <div className="text-xs font-black text-white">
                  Lv.{cannonLevel} x{cannonCount} Mounted
                </div>
              </div>
            </div>

            <div className="bg-[#2b1d19] border-2 border-[#b45309] p-3 rounded-2xl flex items-center gap-2.5">
              <img
                src={shieldImg}
                alt="Shield"
                referrerPolicy="no-referrer"
                className="w-8 h-8 object-contain"
              />
              <div>
                <div className="text-[10px] text-[#fde68a]/80 uppercase font-bold">
                  Shield Aura
                </div>
                <div className="text-xs font-black text-white">
                  {shieldLevel > 0
                    ? `Lv.${shieldLevel} Shield Active`
                    : "No Shield"}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onClose();
                onOpenRepair();
              }}
              className="bg-[#1d4ed8] hover:bg-[#2563eb] border-b-4 border-r-2 border-[#1e3a8a] text-white font-black py-2.5 rounded-xl text-xs uppercase italic shadow-md active:translate-y-0.5 flex items-center justify-center gap-1.5"
            >
              <Wrench className="w-4 h-4 text-white" />
              <span>Repair Ship</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenUpgrades();
              }}
              className="bg-[#b45309] hover:bg-[#d97706] border-b-4 border-r-2 border-[#2b1d19] text-white font-black py-2.5 rounded-xl text-xs uppercase italic shadow-md active:translate-y-0.5 flex items-center justify-center gap-1.5"
            >
              <Shield className="w-4 h-4" />
              <span>Upgrade Ship</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
