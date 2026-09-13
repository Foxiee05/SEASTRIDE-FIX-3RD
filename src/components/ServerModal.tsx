import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { Globe, Lock, Plus, Check, X } from "lucide-react";

interface ServerModalProps {
  onClose: () => void;
}

export const ServerModal: React.FC<ServerModalProps> = ({ onClose }) => {
  const { currentServer, servers, switchServer, createPrivateServer, refreshServerPlayers, isSwitchingServer, gems, t } =
    useGame();
  const [newIslandName, setNewIslandName] = useState<string>("");
  const [customCodeInput, setCustomCodeInput] = useState<string>("");

  // Refresh authoritative counts on mount
  useEffect(() => {
    refreshServerPlayers?.();
  }, [refreshServerPlayers]);

  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIslandName.trim()) return;
    createPrivateServer(newIslandName.trim());
    setNewIslandName("");
  };

  const handleJoinCustomCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCodeInput.trim()) return;
    switchServer(customCodeInput.trim().toUpperCase());
    setCustomCodeInput("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-amber-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2b1d19] border-b-4 border-[#4a2c17] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-serif font-black uppercase text-[#fde68a] tracking-wider">
              {t("servers")}
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
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Current Active Server Badge */}
          <div className="bg-[#2b1d19] border-4 border-[#b45309] rounded-2xl p-3 text-center space-y-1">
            <span className="text-[10px] font-serif font-black uppercase text-[#fde68a]">
              {t("current_server")}
            </span>
            <div className="text-base font-black text-[#fbbf24] font-serif flex items-center justify-center gap-1.5">
              {currentServer.type === "global" ? (
                <Globe className="w-4 h-4 text-sky-400" />
              ) : (
                <Lock className="w-4 h-4 text-[#fbbf24]" />
              )}
              <span>{currentServer.name}</span>
            </div>
            <div className="text-xs text-[#fde68a] font-mono">
              {t("server_code")}:{" "}
              <span className="font-extrabold text-white">
                {currentServer.code}
              </span>{" "}
              ({currentServer.playerCount}/{currentServer.maxPlayers} {t("ships")})
            </div>
          </div>

          {/* List of Available Servers */}
          <div className="space-y-2">
            <span className="text-xs font-serif font-black uppercase text-[#fde68a]">
              {t("available_servers")}
            </span>

            <div className="space-y-2">
              {servers.map((s) => {
                const isCurrent = s.code === currentServer.code;

                return (
                  <button
                    key={s.code}
                    disabled={isSwitchingServer}
                    onClick={() => switchServer(s.code)}
                    className={`w-full p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                      isCurrent
                        ? "bg-[#2b1d19] border-[#facc15] shadow-lg"
                        : "bg-[#2b1d19] border-[#b45309] hover:border-[#fde68a]"
                    } ${isSwitchingServer ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      {s.type === "global" ? (
                        <div className="p-2 bg-[#1e1b4b] border-2 border-[#4338ca] rounded-lg text-sky-300">
                          <Globe className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-2 bg-[#4a2c17] border-2 border-[#b45309] rounded-lg text-[#fbbf24]">
                          <Lock className="w-4 h-4" />
                        </div>
                      )}

                      <div>
                        <div className="text-xs font-black text-white font-serif">
                          {s.name}
                        </div>
                        <div className="text-[10px] text-[#fde68a]/80 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{t("server_code")}: <span className="text-white font-bold">{s.code}</span></span>
                          <span>•</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-black/40 text-[#fbbf24] font-bold border border-[#b45309]/50">
                            {s.playerCount}/{s.maxPlayers} {t("ships")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <span className="text-xs font-black text-white flex items-center gap-1 bg-[#93bb44] border-b-4 border-[#658627] text-white shadow-sm px-2.5 py-1 rounded-lg border border-[#064e3b]">
                          <Check className="w-3.5 h-3.5 text-white" /> {t("active")}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#fde68a] bg-[#4a2c17] px-2.5 py-1 rounded-lg border border-[#b45309]">
                          {isSwitchingServer ? "..." : t("switch")}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Join By Code */}
          <form
            onSubmit={handleJoinCustomCode}
            className="bg-[#2b1d19] border-2 border-[#b45309] p-3.5 rounded-2xl space-y-2"
          >
            <span className="text-xs font-serif font-black uppercase text-[#fde68a]">
              {t("enter_server_code")}
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. BEACH-PRIV-030"
                value={customCodeInput}
                onChange={(e) => setCustomCodeInput(e.target.value)}
                className="flex-1 bg-[#1a0f0d] border-2 border-[#4a2c17] rounded-xl px-3 py-1.5 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-[#fbbf24]"
              />
              <button
                type="submit"
                className="bg-[#1d4ed8] hover:bg-[#2563eb] border-b-4 border-r-2 border-[#1e3a8a] px-3.5 py-1.5 rounded-xl text-xs font-black text-white italic active:translate-y-0.5"
              >
                {t("join")}
              </button>
            </div>
          </form>

          {/* Create Private Beach */}
          <form
            onSubmit={handleCreateServer}
            className="bg-[#2b1d19] border-4 border-[#b45309] p-3.5 rounded-2xl space-y-2"
          >
            <div className="flex justify-between items-center text-xs font-serif font-black uppercase text-[#fde68a]">
              <span className="flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-[#facc15]" /> {t("create_private_server")} (20 {t("ships")})
              </span>
              <span className="text-sky-300 font-bold">10 💎</span>
            </div>

            <input
              type="text"
              placeholder="e.g. Blackbeard's Secret Cove"
              value={newIslandName}
              onChange={(e) => setNewIslandName(e.target.value)}
              className="w-full bg-[#1a0f0d] border-2 border-[#4a2c17] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fbbf24]"
            />

            <button
              type="submit"
              disabled={gems < 10 || !newIslandName.trim()}
              className={`w-full py-2.5 rounded-xl text-xs font-black uppercase italic tracking-wider border-b-4 border-r-2 shadow-md active:translate-y-0.5 ${
                gems < 10 || !newIslandName.trim()
                  ? "bg-stone-800 border-[#2b1d19] text-stone-500 cursor-not-allowed"
                  : "bg-[#b45309] hover:bg-[#d97706] border-[#2b1d19] text-white"
              }`}
            >
              {t("create_server_btn")} (10 {t("gems")})
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
