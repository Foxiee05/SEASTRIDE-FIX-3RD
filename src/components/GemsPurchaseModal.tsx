import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../context/GameContext";
import {
  Gem,
  X,
  Play,
  Lock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { soundFx } from "../utils/audio";

interface GemsPurchaseModalProps {
  onClose: () => void;
}

interface GemPackage {
  id: string;
  name: string;
  price: string;
  gems: number;
  badge?: string;
  icon: string;
  description?: string;
}

const GEM_PACKAGES: GemPackage[] = [
  {
    id: "gem_handful",
    name: "Handful",
    price: "$0.99",
    gems: 50,
    icon: "💎",
  },
  {
    id: "gem_pouch",
    name: "Pouch",
    price: "$4.99",
    gems: 100,
    icon: "👝",
  },
  {
    id: "gem_sack",
    name: "Sack",
    price: "$9.99",
    gems: 300,
    icon: "🎒",
  },
  {
    id: "gem_chest",
    name: "Chest",
    price: "$19.99",
    gems: 600,
    icon: "📦",
  },
  {
    id: "gem_vault",
    name: "Vault",
    price: "$49.99",
    gems: 800,
    icon: "🏛️",
  },
];

export const GemsPurchaseModal: React.FC<GemsPurchaseModalProps> = ({
  onClose,
}) => {
  const {
    gems,
    watchAdForGems,
    dailyAdWatches,
    maxDailyAds,
    buyGemsIAP,
    t,
  } = useGame();

  const [isWatchingAd, setIsWatchingAd] = useState<boolean>(false);
  const [adTimer, setAdTimer] = useState<number>(5);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);
  const [purchasingGemTier, setPurchasingGemTier] = useState<GemPackage | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Manage ad watch countdown effect safely without side-effects in state updaters
  useEffect(() => {
    if (!isWatchingAd) return;

    if (adTimer <= 0) {
      setIsWatchingAd(false);
      const ok = watchAdForGems();
      if (ok) {
        setPurchaseSuccessMessage(t("free_gems_added", "+1 Free Gem added to your balance!"));
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setPurchaseSuccessMessage(null), 3500);
      }
      return;
    }

    const timer = setTimeout(() => {
      setAdTimer(t => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isWatchingAd, adTimer, watchAdForGems]);

  // Cleanup toasts on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleStartAd = () => {
    if (dailyAdWatches >= maxDailyAds) {
      alert(`Daily limit reached (${maxDailyAds}/${maxDailyAds} watched today). Please return tomorrow!`);
      return;
    }

    setAdTimer(5);
    setIsWatchingAd(true);
  };

  const handleBuyGems = (pkg: GemPackage) => {
    setPurchasingGemTier(pkg);
    // Simulate instantaneous in-app purchase validation
    setTimeout(() => {
      buyGemsIAP(pkg);
      setPurchasingGemTier(null);
      setPurchaseSuccessMessage(t("purchased_gems_success", `Successfully purchased ${pkg.gems} Gems (${pkg.name})!`).replace("{gems}", pkg.gems.toString()).replace("{name}", t(pkg.name, pkg.name)));
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setPurchaseSuccessMessage(null), 3500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-3 select-none animate-fade-in">
      <div className="bg-[#1e4a6d] border-4 sm:border-8 border-[#0c283d] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-sky-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0c283d] border-b-4 border-[#163a56] p-3 sm:p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#0284c7] rounded-xl border border-[#38bdf8] shadow-inner">
              <Gem className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-serif font-black uppercase text-[#e0f2fe] tracking-wider">
                {t("gems_vault", "GEMS VAULT")}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Current Gem Balance */}
            <div className="flex items-center justify-center gap-1 bg-[#0284c7] border-2 border-[#38bdf8] rounded-xl px-2.5 py-1 shadow-md h-8 sm:h-9">
              <Gem className="w-3.5 h-3.5 text-white" />
              <span className="text-white font-serif font-black text-xs sm:text-sm leading-none tracking-wide">
                {gems.toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-[#163a56] rounded-lg border border-[#38bdf8]/40 text-sky-100 active:scale-95 transition-transform"
              title={t("close", "Close")}
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

        {/* Content Area */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3.5 flex-1 bg-gradient-to-b from-[#133852] to-[#0c283d]">
          
          {/* Daily Free Ad Watch Section */}
          <div className="bg-[#0e2c43] border-2 border-[#38bdf8] rounded-2xl p-3.5 shadow-xl space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  dailyAdWatches >= maxDailyAds
                    ? "bg-red-950 text-red-300 border-red-800"
                    : "bg-sky-950 text-sky-300 border-sky-600"
                }`}
              >
                {dailyAdWatches >= maxDailyAds
                  ? t("ad_limit_used", "Limit (3/3 Used)")
                  : t("ads_available_today", `${maxDailyAds - dailyAdWatches}/3 Available Today`).replace("{count}", (maxDailyAds - dailyAdWatches).toString())}
              </span>
            </div>

            {isWatchingAd ? (
              <div className="py-2.5 space-y-1.5 text-center bg-[#071927] rounded-xl border border-sky-600/40 p-3">
                <div className="text-xs sm:text-sm font-black text-amber-300 font-serif animate-pulse">
                  {t("streaming_ad", "📺 Streaming Pirate Commercial... ({time}s)").replace("{time}", adTimer.toString())}
                </div>
                <div className="w-full bg-[#0c283d] h-2.5 rounded-full overflow-hidden border border-sky-800 max-w-xs mx-auto">
                  <div
                    className="bg-[#38bdf8] h-full transition-all duration-1000"
                    style={{ width: `${((5 - adTimer) / 5) * 100}%` }}
                  />
                </div>
              </div>
            ) : dailyAdWatches >= maxDailyAds ? (
              <div className="bg-[#071927] border border-red-900/50 rounded-xl p-2.5 text-center flex items-center justify-center gap-1.5 text-xs text-red-300 font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>{t("ad_limit_reached")}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartAd}
                className="w-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#0284c7] active:scale-95 border-b-4 border-[#0369a1] text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase italic tracking-wider shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{t("watch_short_ad")}</span>
              </button>
            )}
          </div>

          {/* In-App Purchase Tier Grid */}
          <div className="grid grid-cols-1 gap-2.5">
            {GEM_PACKAGES.map((pkg) => {
              const isPurchasingThis = purchasingGemTier?.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  className="bg-[#0e2c43] border-2 border-sky-700/60 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-[#071927] border border-sky-600/50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                      {pkg.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-serif font-black text-sm text-white">
                          {t(pkg.name)}
                        </span>
                        <span className="bg-[#0284c7] text-white text-[11px] font-black px-2 py-0.5 rounded-md border border-[#38bdf8]/40 shadow-sm">
                          +{pkg.gems} 💎
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPurchasingThis}
                    onClick={() => handleBuyGems(pkg)}
                    className="bg-gradient-to-b from-[#38bdf8] to-[#0284c7] active:scale-95 border-b-4 border-[#075985] text-white px-4 py-2 rounded-xl font-black text-xs uppercase shadow-md flex-shrink-0 transition-all flex items-center gap-1"
                  >
                    {isPurchasingThis ? (
                      <span className="animate-pulse">{t("loading")}</span>
                    ) : (
                      <span>{pkg.price}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
