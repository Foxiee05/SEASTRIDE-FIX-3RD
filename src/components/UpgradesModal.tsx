import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import {
  getShipImageForLevel,
  getCannonImageForLevel,
  getShieldImageForLevel,
} from "../assets";
import { useCutoutImage } from "../utils/imageUtils";
import { X, Shield, Plus, ArrowUp, CircleDollarSign, Info } from "lucide-react";
import { InfoModal } from "./InfoModal";
import { CurrencyDisplay } from "./CurrencyDisplay";

interface UpgradesModalProps {
  onClose: () => void;
}

const ItemImg = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) => {
  const cutoutSrc = useCutoutImage(src);
  return <img src={cutoutSrc} alt={alt} className={className} />;
};

export const UpgradesModal: React.FC<UpgradesModalProps> = ({ onClose }) => {
  const [infoState, setInfoState] = useState<{title: string; message: string} | null>(null);
  const {
    coins,
    shipLevel,
    shipMaxHp,
    cannonLevel,
    cannonCount,
    shieldLevel,
    ownedCannons,
    equippedCannons,
    ownedShields,
    equippedShield,
    upgradeShip,
    buyCannon,
    upgradeCannon,
    equipCannon,
    unequipCannon,
    buyShield,
    upgradeShield,
    equipShield,
    unequipShield,
    t,
  } = useGame();

  const [activeTab, setActiveTab] = useState<"ship" | "cannons" | "shield">(
    "ship",
  );

  // Cutout images for 100% opaque render without translucent background
  const shipImg = useCutoutImage(getShipImageForLevel(shipLevel), {
    mode: "edge",
    keepInternalGreenAsBlack: shipLevel === 1,
  });
  const cannonImg = useCutoutImage(getCannonImageForLevel(cannonLevel));
  const shieldImg = useCutoutImage(getShieldImageForLevel(shieldLevel));

  // Next upgrade cost calculation
  const shipUpgradeCost = shipLevel === 1 ? 1000 : 1000 + (shipLevel - 1) * 500;
  const cannonUpgradeCost = 100;
  const cannonBuyCost = 100;
  const shieldUpgradeCost = 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2b1d19] border-b-4 border-[#4a2c17] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#facc15]" />
            <h2 className="text-base font-serif font-black uppercase text-[#fde68a] tracking-wider">
              {t("ship_upgrades")}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <CurrencyDisplay />

            <button
              onClick={onClose}
              className="p-1.5 bg-[#4a2c17] hover:bg-[#92400e] rounded-lg border border-[#b45309] text-[#fde68a]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-[#2b1d19] p-2 flex border-b-2 border-[#4a2c17] gap-1">
          <button
            onClick={() => setActiveTab("ship")}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase italic transition-all border-b-4 border-r-2 flex items-center justify-center gap-1 ${
              activeTab === "ship"
                ? "bg-[#b45309] border-[#2b1d19] text-white shadow"
                : "text-[#fde68a]/80 hover:text-white bg-[#4a2c17] border-[#2b1d19]"
            }`}
          >
            <span>⛵ {t("ship_tab")} (Lv.{shipLevel})</span>
          </button>

          <button
            onClick={() => setActiveTab("cannons")}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase italic transition-all border-b-4 border-r-2 flex items-center justify-center gap-1 ${
              activeTab === "cannons"
                ? "bg-[#b45309] border-[#2b1d19] text-white shadow"
                : "text-[#fde68a]/80 hover:text-white bg-[#4a2c17] border-[#2b1d19]"
            }`}
          >
            <span>💣 {t("cannons_tab")} (Lv.{cannonLevel})</span>
          </button>

          <button
            onClick={() => setActiveTab("shield")}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase italic transition-all border-b-4 border-r-2 flex items-center justify-center gap-1 ${
              activeTab === "shield"
                ? "bg-[#b45309] border-[#2b1d19] text-white shadow"
                : "text-[#fde68a]/80 hover:text-white bg-[#4a2c17] border-[#2b1d19]"
            }`}
          >
            <span>🛡️ {t("shield_tab")} (Lv.{shieldLevel})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* SHIP TAB */}
          {activeTab === "ship" && (
            <div className="space-y-4 text-center">
              {/* Top Info Button outside box */}
              <div className="flex justify-end -mb-2">
                <button
                  type="button"
                  onClick={() =>
                    setInfoState({
                      title: t("ship_upgrades"),
                      message:
                        "Upgrading your ship increases its Max Hull HP, allowing it to withstand more damage in battles.",
                    })
                  }
                  className="bg-[#4a2c17] hover:bg-[#92400e] text-[#fde68a] border border-[#b45309] p-1.5 rounded-lg shadow-md flex items-center justify-center transition-all active:scale-95"
                  title="Ship Upgrades Info"
                >
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                </button>
              </div>

              <div className="bg-[#2b1d19] border-4 border-[#b45309] rounded-2xl p-4 flex flex-col items-center">
                <img
                  src={shipImg}
                  alt="Ship Level"
                  referrerPolicy="no-referrer"
                  className="w-36 h-36 object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
                />
                <div className="text-lg font-serif font-black text-[#fbbf24] mt-2">
                  {t("level")} {shipLevel} {t("ship_tab")}
                </div>
                <div className="text-xs text-[#fde68a]/80 font-mono mt-1">
                  {t("hull_durability")}:{" "}
                  <span className="font-bold text-white">
                    {shipMaxHp.toLocaleString()} HP
                  </span>
                </div>
              </div>

              {/* Upgrade Interaction Card */}
              <div className="bg-[#2b1d19] border-2 border-[#b45309] rounded-xl p-3.5 text-left space-y-3">
                <div className="flex justify-between items-center text-xs font-serif font-black text-[#fde68a]">
                  <span className="text-[#fbbf24]">{t("ship_upgrade_title")}</span>
                  <div className="font-bold text-[#16a34a]">
                    {t("next")}: {shipLevel < 10 ? `Lv.${shipLevel + 1} (+5,000 HP)` : t("max")}
                  </div>
                </div>

                <button
                  onClick={upgradeShip}
                  disabled={shipLevel >= 10 || coins < shipUpgradeCost}
                  className={`w-full py-3.5 rounded-xl font-black text-sm uppercase italic tracking-wider flex items-center justify-center gap-2 border-b-4 border-r-2 shadow-xl ${
                    shipLevel >= 10
                      ? "bg-stone-800 border-[#2b1d19] text-stone-500 cursor-not-allowed"
                      : coins < shipUpgradeCost
                        ? "bg-[#2b1d19] border-[#4a2c17] text-stone-400 cursor-not-allowed"
                        : "bg-[#b45309] hover:bg-[#d97706] border-[#2b1d19] text-white active:translate-y-1"
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                  {shipLevel >= 10 ? (
                    <span>{t("max_level_reached")}</span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      {t("upgrade_now")} ({shipUpgradeCost.toLocaleString()}{" "}
                      <CircleDollarSign className="w-4 h-4 text-[#f0c242] inline-block" />)
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* CANNONS TAB */}
          {activeTab === "cannons" && (
            <div className="space-y-4">
              {/* Top Info Button outside box */}
              <div className="flex justify-end -mb-2">
                <button
                  type="button"
                  onClick={() =>
                    setInfoState({
                      title: "Cannon Upgrades",
                      message:
                        "Buy and upgrade cannons. Equip them to boost your damage against raid bosses!",
                    })
                  }
                  className="bg-[#4a2c17] hover:bg-[#92400e] text-[#fde68a] border border-[#b45309] p-1.5 rounded-lg shadow-md flex items-center justify-center transition-all active:scale-95"
                  title="Cannon Upgrades Info"
                >
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                </button>
              </div>

              <div className="bg-[#2b1d19] p-3 rounded-xl border border-[#b45309] flex justify-between items-center shadow-inner">
                <div className="text-sm font-bold text-[#fbbf24]">
                  {t("equipped")}: {equippedCannons.length} / 6
                </div>
                <button
                  onClick={buyCannon}
                  disabled={coins < cannonBuyCost}
                  className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase italic flex items-center gap-1 border-b-2 shadow-lg ${
                    coins < cannonBuyCost
                      ? "bg-stone-900 border-[#2b1d19] text-stone-500 cursor-not-allowed"
                      : "bg-[#1d4ed8] hover:bg-[#2563eb] border-[#1e3a8a] text-white active:translate-y-1"
                  }`}
                >
                  <Plus className="w-3 h-3 text-[#facc15]" />
                  <span className="flex items-center gap-1">
                    {t("buy")} (100 <CircleDollarSign className="w-3 h-3 text-[#f0c242]" />)
                  </span>
                </button>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {ownedCannons.map((cannon, index) => {
                  const isEquipped = equippedCannons.includes(cannon.id);
                  const dmg = 2500 + (cannon.level - 1) * 2500;
                  return (
                    <div
                      key={cannon.id}
                      className="bg-[#2b1d19] border-2 border-[#b45309] rounded-xl p-2 flex items-center gap-3"
                    >
                      <div className="bg-[#4a2c17] rounded-lg p-1 border border-[#b45309] flex-shrink-0 relative">
                        <ItemImg
                          src={getCannonImageForLevel(cannon.level)}
                          alt={`Cannon ${cannon.level}`}
                          className="w-12 h-12 object-contain"
                        />
                        {isEquipped && (
                          <div className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full border border-white"></div>
                        )}
                      </div>

                      <div className="flex-1 text-left">
                        <div className="font-bold text-[#fbbf24] text-sm">
                          {t("cannons_tab")} #{index + 1} (Lv.{cannon.level})
                        </div>
                        <div className="text-[10px] font-mono text-[#fde68a]/70">
                          {t("stats")}: {dmg.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 w-24 flex-shrink-0">
                        {isEquipped ? (
                          <button
                            onClick={() => unequipCannon(cannon.id)}
                            className="py-1 rounded bg-stone-700 hover:bg-stone-600 text-white font-bold text-[10px] border-b-2 border-stone-800"
                          >
                            {t("unequip")}
                          </button>
                        ) : (
                          <button
                            onClick={() => equipCannon(cannon.id)}
                            disabled={equippedCannons.length >= 6}
                            className={`py-1 rounded font-bold text-[10px] border-b-2 ${
                              equippedCannons.length >= 6
                                ? "bg-stone-800 text-stone-500 border-[#2b1d19] cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-500 text-white border-green-800"
                            }`}
                          >
                            {t("equip")}
                          </button>
                        )}
                        <button
                          onClick={() => upgradeCannon(cannon.id)}
                          disabled={
                            cannon.level >= 10 || coins < cannonUpgradeCost
                          }
                          className={`py-1 rounded font-bold text-[10px] border-b-2 flex items-center justify-center gap-1 ${
                            cannon.level >= 10 || coins < cannonUpgradeCost
                              ? "bg-stone-800 text-stone-500 border-[#2b1d19] cursor-not-allowed"
                              : "bg-[#b45309] hover:bg-[#d97706] text-white border-[#4a2c17]"
                          }`}
                        >
                          <ArrowUp className="w-3 h-3" />
                          <span className="flex items-center gap-0.5">
                            {t("upgrades")} 100 <CircleDollarSign className="w-2.5 h-2.5 text-[#f0c242]" />
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-[#fde68a]/80 font-mono text-left bg-[#2b1d19] p-3 rounded-xl border border-[#b45309]">
                ⚠️ Warning: Cannons can be looted by enemy raiders if your
                ship's HP falls below 30% during a battle!
              </p>
            </div>
          )}

          {/* SHIELD TAB */}
          {activeTab === "shield" && (
            <div className="space-y-4">
              {/* Top Info Button outside box */}
              <div className="flex justify-end -mb-2">
                <button
                  type="button"
                  onClick={() =>
                    setInfoState({
                      title: "Shield Upgrades",
                      message:
                        "Buy and upgrade aura shields. Equip them to reduce the damage you take from raid boss attacks!",
                    })
                  }
                  className="bg-[#4a2c17] hover:bg-[#92400e] text-[#fde68a] border border-[#b45309] p-1.5 rounded-lg shadow-md flex items-center justify-center transition-all active:scale-95"
                  title="Shield Upgrades Info"
                >
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                </button>
              </div>

              <div className="bg-[#2b1d19] p-3 rounded-xl border border-[#b45309] flex justify-between items-center shadow-inner">
                <div className="text-sm font-bold text-[#fbbf24]">
                  {t("equipped")}: {equippedShield ? "1" : "0"} / 1
                </div>
                <button
                  onClick={buyShield}
                  disabled={coins < shieldUpgradeCost}
                  className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase italic flex items-center gap-1 border-b-2 shadow-lg ${
                    coins < shieldUpgradeCost
                      ? "bg-stone-900 border-[#2b1d19] text-stone-500 cursor-not-allowed"
                      : "bg-[#1d4ed8] hover:bg-[#2563eb] border-[#1e3a8a] text-white active:translate-y-1"
                  }`}
                >
                  <Plus className="w-3 h-3 text-[#facc15]" />
                  <span className="flex items-center gap-1">
                    {t("buy")} {t("shield_tab")} (100 <CircleDollarSign className="w-3 h-3 text-[#f0c242]" />)
                  </span>
                </button>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {ownedShields.length === 0 && (
                  <div className="text-center text-sm font-mono text-[#fde68a]/70 p-4">
                    {t("no_history")}
                  </div>
                )}
                {ownedShields.map((shield, index) => {
                  const isEquipped = equippedShield === shield.id;
                  return (
                    <div
                      key={shield.id}
                      className="bg-[#2b1d19] border-2 border-[#b45309] rounded-xl p-2 flex items-center gap-3"
                    >
                      <div className="bg-[#4a2c17] rounded-lg p-1 border border-[#b45309] flex-shrink-0 relative">
                        <ItemImg
                          src={getShieldImageForLevel(shield.level)}
                          alt={`Shield ${shield.level}`}
                          className="w-12 h-12 object-contain"
                        />
                        {isEquipped && (
                          <div className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full border border-white"></div>
                        )}
                      </div>

                      <div className="flex-1 text-left">
                        <div className="font-bold text-[#fbbf24] text-sm">
                          {t("shield_tab")} #{index + 1} (Lv.{shield.level})
                        </div>
                        <div className="text-[10px] font-mono text-[#fde68a]/70">
                          {t("stats")}: {shield.level}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 w-24 flex-shrink-0">
                        {isEquipped ? (
                          <button
                            onClick={() => unequipShield()}
                            className="py-1 rounded bg-stone-700 hover:bg-stone-600 text-white font-bold text-[10px] border-b-2 border-stone-800"
                          >
                            {t("unequip")}
                          </button>
                        ) : (
                          <button
                            onClick={() => equipShield(shield.id)}
                            className="py-1 rounded bg-green-600 hover:bg-green-500 text-white font-bold text-[10px] border-b-2 border-green-800"
                          >
                            {t("equip")}
                          </button>
                        )}
                        <button
                          onClick={() => upgradeShield(shield.id)}
                          disabled={
                            shield.level >= 3 || coins < shieldUpgradeCost
                          }
                          className={`py-1 rounded font-bold text-[10px] border-b-2 flex items-center justify-center gap-1 ${
                            shield.level >= 3 || coins < shieldUpgradeCost
                              ? "bg-stone-800 text-stone-500 border-[#2b1d19] cursor-not-allowed"
                              : "bg-[#b45309] hover:bg-[#d97706] text-white border-[#4a2c17]"
                          }`}
                        >
                          <ArrowUp className="w-3 h-3" />
                          <span className="flex items-center gap-0.5">
                            {t("upgrades")} 100 <CircleDollarSign className="w-2.5 h-2.5 text-[#f0c242]" />
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <InfoModal isOpen={!!infoState} onClose={() => setInfoState(null)} title={infoState?.title || ""} message={infoState?.message || ""} />
    </div>
  );
};
