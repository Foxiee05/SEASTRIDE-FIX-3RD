import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../context/GameContext";
import {
  CircleDollarSign,
  Gem,
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CoinsExchangeModalProps {
  onClose: () => void;
  onOpenGemsModal?: () => void;
}

interface CoinPackage {
  id: string;
  name: string;
  gemsCost: number;
  coinsReward: number;
  badge?: string;
  icon: string;
  description?: string;
}

const COIN_PACKAGES: CoinPackage[] = [
  {
    id: "coin_small_pile",
    name: "Small Pile",
    gemsCost: 50,
    coinsReward: 500,
    icon: "🪙",
  },
  {
    id: "coin_medium_bag",
    name: "Medium Bag",
    gemsCost: 100,
    coinsReward: 1500,
    icon: "💰",
  },
  {
    id: "coin_large_crate",
    name: "Large Crate",
    gemsCost: 300,
    coinsReward: 5000,
    icon: "📦",
  },
  {
    id: "coin_huge_hoard",
    name: "Huge Hoard",
    gemsCost: 500,
    coinsReward: 10000,
    icon: "👑",
  },
  {
    id: "coin_treasury",
    name: "Treasury",
    gemsCost: 1000,
    coinsReward: 25000,
    icon: "🏛️",
  },
];

export const CoinsExchangeModal: React.FC<CoinsExchangeModalProps> = ({
  onClose,
  onOpenGemsModal,
}) => {
  const {
    coins,
    gems,
    exchangeGemsForCoins,
    t,
  } = useGame();

  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);
  const [insufficientGemsAlert, setInsufficientGemsAlert] = useState<string | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, []);

  const handleExchangeCoins = (pkg: CoinPackage) => {
    if (gems < pkg.gemsCost) {
      setInsufficientGemsAlert(
        `Need ${pkg.gemsCost} 💎 gems (you have ${gems} 💎). Top up gems first!`,
      );
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = setTimeout(() => setInsufficientGemsAlert(null), 4000);
      return;
    }

    const success = exchangeGemsForCoins(pkg);
    if (success) {
      setInsufficientGemsAlert(null);
      setPurchaseSuccessMessage(
        `Exchanged ${pkg.gemsCost} Gems for +${pkg.coinsReward.toLocaleString()} Coins!`,
      );
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setPurchaseSuccessMessage(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-3 select-none animate-fade-in">
      <div className="bg-[#4a2c17] border-4 sm:border-8 border-[#2b1d19] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#2b1d19] border-b-4 border-[#4a2c17] p-3 sm:p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#b45309] rounded-xl border border-[#fde047] shadow-inner">
              <CircleDollarSign className="w-5 h-5 text-[#fde047]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-serif font-black uppercase text-[#fde68a] tracking-wider">
                {t("exchange_coins")}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Coins Balance */}
            <div className="flex items-center justify-center gap-1 bg-[#4a2c17] border-2 border-[#f0c242] rounded-xl px-2.5 py-1 shadow-md h-8 sm:h-9">
              <CircleDollarSign className="w-3.5 h-3.5 text-[#f0c242]" />
              <span className="text-[#f0c242] font-serif font-black text-xs sm:text-sm leading-none tracking-wide">
                {coins.toLocaleString()}
              </span>
            </div>

            {/* Gems Balance */}
            <div className="flex items-center justify-center gap-1 bg-[#0284c7] border-2 border-[#38bdf8] rounded-xl px-2 py-1 shadow-md h-8 sm:h-9">
              <Gem className="w-3.5 h-3.5 text-white" />
              <span className="text-white font-serif font-black text-xs sm:text-sm leading-none tracking-wide">
                {gems.toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-[#4a2c17] hover:bg-[#92400e] rounded-lg border border-[#b45309] text-[#fde68a] active:scale-95 transition-transform"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast Banner */}
        {purchaseSuccessMessage && (
          <div className="bg-emerald-900/95 border-b-2 border-emerald-400 text-emerald-100 px-3 py-2 text-xs font-black flex items-center justify-center gap-1.5 animate-fade-in shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{purchaseSuccessMessage}</span>
          </div>
        )}

        {/* Insufficient Gems Banner */}
        {insufficientGemsAlert && (
          <div className="bg-red-950 border-b-2 border-red-500 text-red-100 px-3 py-2 text-xs font-black flex items-center justify-between gap-2 animate-fade-in shadow-md">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{insufficientGemsAlert}</span>
            </div>
            {onOpenGemsModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGemsModal();
                }}
                className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wide flex-shrink-0"
              >
                Get Gems
              </button>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3.5 flex-1 bg-gradient-to-b from-[#3d2311] to-[#2b1d19]">
          
          {/* Pricing List */}
          <div className="grid grid-cols-1 gap-2.5">
            {COIN_PACKAGES.map((pkg) => {
              const canAfford = gems >= pkg.gemsCost;

              return (
                <div
                  key={pkg.id}
                  className={`bg-[#2b1d19] border-2 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg transition-all ${
                    canAfford
                      ? "border-[#b45309]/60 hover:border-[#facc15]"
                      : "border-[#4a2c17] opacity-85"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-[#1a0f0d] border border-[#b45309] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                      {pkg.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-serif font-black text-sm text-white">
                          {pkg.name}
                        </span>
                        <span className="bg-[#854d0e] text-[#fef08a] text-[11px] font-black px-2 py-0.5 rounded-md border border-[#facc15]/40 shadow-sm">
                          +{pkg.coinsReward.toLocaleString()} 🪙
                        </span>
                        {pkg.badge && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      {pkg.description && (
                        <p className="text-[10px] text-[#fde68a]/70 truncate mt-0.5">
                          {pkg.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExchangeCoins(pkg)}
                    className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase shadow-md flex-shrink-0 transition-all flex items-center gap-1.5 border-b-4 ${
                      canAfford
                        ? "bg-gradient-to-b from-[#facc15] to-[#ca8a04] hover:brightness-110 active:scale-95 border-[#854d0e] text-[#451a03]"
                        : "bg-[#4a2c17] hover:bg-[#78350f] active:scale-95 border-[#2b1d19] text-[#fde68a]"
                    }`}
                  >
                    <span>{pkg.gemsCost} 💎</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Need More Gems CTA */}
          {onOpenGemsModal && (
            <div className="bg-[#1a0f0d] border border-[#4a2c17] rounded-xl p-3 flex items-center justify-between gap-2">
              <div className="text-[11px] text-amber-200/80">
                <span>{t("need_gems_hint")}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGemsModal();
                }}
                className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex-shrink-0 shadow flex items-center gap-1"
              >
                <Gem className="w-3 h-3 text-white" />
                <span>{t("gems")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
