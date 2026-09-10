import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { DECORATIONS } from "../data/decorations";
import {
  ShoppingBag,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import { CurrencyDisplay } from "./CurrencyDisplay";

interface ShopModalProps {
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ onClose }) => {
  const {
    ownedDecorations,
    equippedDecorations,
    buyDecoration,
    toggleEquipDecoration,
  } = useGame();

  const [viewFilter, setViewFilter] = useState<"all" | "owned">("all");

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-3 select-none animate-fade-in">
      <div className="bg-[#4a2c17] border-4 sm:border-8 border-[#2b1d19] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#2b1d19] border-b-4 border-[#4a2c17] p-3 sm:p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#854d0e] rounded-xl border border-[#fde047] shadow-inner">
              <ShoppingBag className="w-5 h-5 text-[#fde047]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-serif font-black uppercase text-[#fde68a] tracking-wider">
                SHOP
              </h2>
              <p className="text-[10px] text-amber-300/80 font-bold uppercase">Ship Customizations & Relics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CurrencyDisplay />
            <button
              onClick={onClose}
              className="p-1.5 bg-[#4a2c17] hover:bg-[#92400e] rounded-lg border border-[#b45309] text-[#fde68a] active:scale-95 transition-transform"
              title="Close Shop"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="bg-[#1a0f0d] p-1.5 border-b-2 border-[#4a2c17] flex items-center justify-between gap-2 px-3">
          <div className="text-xs font-serif font-black uppercase text-[#fde68a] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#facc15]" />
            <span>Decorations Catalog</span>
          </div>

          <div className="flex items-center gap-1 bg-[#2b1d19] p-1 rounded-xl border border-[#4a2c17]">
            <button
              type="button"
              onClick={() => setViewFilter("all")}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase italic transition-all ${
                viewFilter === "all"
                  ? "bg-[#b45309] text-white shadow"
                  : "text-[#fde68a]/70 hover:text-white"
              }`}
            >
              All Items
            </button>
            <button
              type="button"
              onClick={() => setViewFilter("owned")}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase italic transition-all ${
                viewFilter === "owned"
                  ? "bg-[#93bb44] border-b-2 border-[#658627] text-white shadow"
                  : "text-[#fde68a]/70 hover:text-white"
              }`}
            >
              Owned ({ownedDecorations.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1 bg-gradient-to-b from-[#3d2311] to-[#2b1d19]">
          {(() => {
            const displayedDecorations = DECORATIONS.filter((dec) => {
              const isOwned = ownedDecorations.includes(dec.id);
              if (dec.isSecret && !isOwned) {
                return false;
              }
              if (viewFilter === "owned") {
                return isOwned;
              }
              return true;
            });

            if (displayedDecorations.length === 0 && viewFilter === "owned") {
              return (
                <div className="bg-[#2b1d19] border-2 border-dashed border-[#b45309]/50 rounded-2xl p-6 text-center space-y-2">
                  <div className="text-3xl">🏴‍☠️</div>
                  <div className="text-xs font-serif font-black uppercase text-[#fde68a]">
                    No Owned Items Yet
                  </div>
                  <p className="text-[10px] text-amber-200/70 max-w-xs mx-auto">
                    You have not claimed or purchased any ship decorations yet. Plunder treasure boxes or browse the catalog below!
                  </p>
                  <button
                    type="button"
                    onClick={() => setViewFilter("all")}
                    className="mt-2 px-3 py-1.5 bg-[#b45309] hover:bg-[#d97706] text-white font-black text-[10px] uppercase rounded-xl shadow"
                  >
                    Browse Shop Catalog
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {displayedDecorations.map((dec) => {
                  const isOwned = ownedDecorations.includes(dec.id);
                  const isEquipped = equippedDecorations.includes(dec.id);

                  return (
                    <div
                      key={dec.id}
                      className={`p-3 rounded-2xl border-2 flex flex-col justify-between gap-2 transition-all ${
                        dec.isSecret
                          ? "bg-gradient-to-b from-[#2b1d19] to-[#3a1d0e] border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                          : isEquipped
                          ? "bg-[#2b1d19] border-[#facc15] shadow-lg"
                          : isOwned
                          ? "bg-[#2b1d19] border-[#b45309]"
                          : "bg-[#2b1d19] border-[#4a2c17]"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-3xl p-1 bg-[#1a0f0d] border border-[#4a2c17] rounded-xl flex-shrink-0">
                          {dec.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-xs font-black text-white font-serif">
                              {dec.name}
                            </span>
                            {dec.isSecret && (
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 border border-amber-400/50">
                                👑 Secret Relic
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#fde68a]/80 leading-tight mt-0.5">
                            {dec.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-[#4a2c17]">
                        <span className="text-[10px] font-bold uppercase text-[#fbbf24]">
                          {dec.isSecret ? (
                            <span className="text-amber-300 font-black">⭐ Legendary</span>
                          ) : dec.currency === "coins" ? (
                            `${dec.price} 🪙`
                          ) : (
                            `${dec.price} 💎`
                          )}
                        </span>

                        {isOwned ? (
                          <button
                            type="button"
                            onClick={() => toggleEquipDecoration(dec.id)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase italic border-b-2 transition-all ${
                              isEquipped
                                ? "bg-[#93bb44] border-[#658627] text-white shadow-sm"
                                : "bg-[#4a2c17] border-[#2b1d19] text-[#fde68a] hover:bg-[#78350f]"
                            }`}
                          >
                            {isEquipped && (
                              <Check className="w-3 h-3 inline mr-1" />
                            )}
                            <span>{isEquipped ? "Equipped" : "Equip"}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              buyDecoration(dec.id, dec.currency, dec.price)
                            }
                            className="px-3 py-1 rounded-lg text-[10px] font-black uppercase italic bg-[#b45309] hover:bg-[#d97706] border-b-2 border-[#2b1d19] text-white shadow active:translate-y-0.5"
                          >
                            Buy Item
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
