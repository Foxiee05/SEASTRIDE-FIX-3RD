import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { DECORATIONS } from "../data/decorations";
import { ShoppingBag, X, Tv, Check, Sparkles, Play } from "lucide-react";
import { CurrencyDisplay } from "./CurrencyDisplay";

interface ShopModalProps {
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ onClose }) => {
  const {
    coins,
    gems,
    ownedDecorations,
    equippedDecorations,
    buyDecoration,
    toggleEquipDecoration,
    watchAdForGems,
  } = useGame();

  const [isWatchingAd, setIsWatchingAd] = useState<boolean>(false);
  const [adTimer, setAdTimer] = useState<number>(5);
  const [viewFilter, setViewFilter] = useState<"all" | "owned">("all");

  const handleStartAd = () => {
    setIsWatchingAd(true);
    setAdTimer(5);

    const interval = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsWatchingAd(false);
          watchAdForGems();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2b1d19] border-b-4 border-[#4a2c17] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-serif font-black uppercase text-[#fde68a] tracking-wider">
              Pirate Bazaar & Ad Haven
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
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Watch Ad Banner for Gems */}
          <div className="bg-[#2b1d19] border-4 border-[#b45309] rounded-2xl p-4 text-center shadow-xl space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-serif font-black uppercase text-sky-300 tracking-wider">
              <Tv className="w-4 h-4 text-sky-400" />
              <span>Watch Pirate Broadcast for Free Gems</span>
            </div>

            {isWatchingAd ? (
              <div className="py-2 space-y-1">
                <div className="text-sm font-black text-[#fbbf24] font-serif animate-pulse">
                  📺 Playing Pirate Commercial... ({adTimer}s)
                </div>
                <div className="w-full bg-[#1a0f0d] h-2.5 rounded-full overflow-hidden border border-[#4a2c17] max-w-xs mx-auto">
                  <div
                    className="bg-[#93bb44] border-b-4 border-[#658627] text-white shadow-sm h-full transition-all duration-1000"
                    style={{ width: `${((5 - adTimer) / 5) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartAd}
                className="bg-[#1d4ed8] hover:bg-[#2563eb] border-b-4 border-r-2 border-[#1e3a8a] text-white font-black py-2.5 px-5 rounded-xl text-xs uppercase italic tracking-wider shadow-lg active:translate-y-1 inline-flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Watch Short Ad (+5 Gems 💎)</span>
              </button>
            )}
          </div>

          {/* Decorations Catalog */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="text-xs font-serif font-black uppercase text-[#fde68a] flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-[#facc15]" />
                <span>Permanent Ship Customizations</span>
              </div>

              {/* Filter Tabs: All Items vs Owned Only */}
              <div className="flex items-center gap-1 bg-[#1a0f0d] p-1 rounded-xl border border-[#4a2c17]">
                <button
                  onClick={() => setViewFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase italic transition-all ${
                    viewFilter === "all"
                      ? "bg-[#b45309] text-white shadow"
                      : "text-[#fde68a]/70 hover:text-white"
                  }`}
                >
                  Shop Catalog
                </button>
                <button
                  onClick={() => setViewFilter("owned")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase italic transition-all ${
                    viewFilter === "owned"
                      ? "bg-[#93bb44] border-b-2 border-[#658627] text-white shadow"
                      : "text-[#fde68a]/70 hover:text-white"
                  }`}
                >
                  Owned ({ownedDecorations.length})
                </button>
              </div>
            </div>

            {/* Grid of Decorations */}
            {(() => {
              const displayedDecorations = DECORATIONS.filter((dec) => {
                const isOwned = ownedDecorations.includes(dec.id);
                // Secret items are not for sale in shop; they only appear in shop when owned
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
                      You have not claimed or purchased any ship decorations yet. Plunder treasure boxes or browse the shop!
                    </p>
                    <button
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
                        className={`p-3 rounded-2xl border-2 flex flex-col justify-between gap-2 ${
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
                              onClick={() => toggleEquipDecoration(dec.id)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase italic border-b-2 ${
                                isEquipped
                                  ? "bg-[#93bb44] border-b-4 border-[#658627] text-white shadow-sm border-[#064e3b] text-white"
                                  : "bg-[#4a2c17] border-[#2b1d19] text-[#fde68a]"
                              }`}
                            >
                              {isEquipped && (
                                <Check className="w-3 h-3 inline mr-1" />
                              )}
                              <span>{isEquipped ? "Equipped" : "Equip"}</span>
                            </button>
                          ) : (
                            <button
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
    </div>
  );
};
