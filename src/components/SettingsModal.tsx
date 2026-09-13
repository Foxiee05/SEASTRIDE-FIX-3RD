import React, { useState } from "react";
import { X, Settings, Volume2, VolumeX, Globe, User, LogOut, ArrowRightLeft, ShieldAlert, Database, Wifi, RefreshCw, Key, CheckCircle2, AlertTriangle } from "lucide-react";
import { useGame } from "../context/GameContext";
import { isSupabaseConfigured, getSupabaseUrl, getSupabaseAnonKey, testSupabaseConnection, setCustomSupabaseConfig } from "../utils/supabaseClient";

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const {
    isMuted,
    toggleMute,
    language,
    changeLanguage,
    t,
    currentAccount,
    currentServer,
    openAccountModal,
    logoutAccount,
    refreshServerPlayers,
  } = useGame();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(getSupabaseUrl());
  const [keyInput, setKeyInput] = useState(getSupabaseAnonKey());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    serversCount?: number;
    playersCount?: number;
    accountsCount?: number;
  } | null>(null);

  const isConfigured = isSupabaseConfigured();

  const handleSwitchAccount = () => {
    onClose();
    openAccountModal();
  };

  const handleLogout = async () => {
    onClose();
    await logoutAccount();
  };

  const handleRunDiagnostic = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.success) {
        await refreshServerPlayers();
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || "Diagnostic test encountered an unexpected error.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveCustomConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSupabaseConfig(urlInput.trim(), keyInput.trim());
    await handleRunDiagnostic();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-amber-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2b1d19] px-4 py-3 border-b-4 border-[#1a0f0d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#4a2c17] border border-[#b45309]">
              <Settings className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-black tracking-wider text-[#fde68a] uppercase leading-none">
                {t("settings")}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#3d2417] border-2 border-[#b45309] flex items-center justify-center text-amber-200 hover:text-white hover:bg-red-900 transition-colors shadow-md active:scale-95"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* SECTION 1: SOUND & AUDIO */}
          <div className="bg-[#2b1d19] p-3.5 sm:p-4 rounded-2xl border-2 border-[#b45309] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[#4a2c17] border border-[#b45309]/60">
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-serif font-black text-[#fde68a] uppercase">
                {t("sound_music")}
              </span>
            </div>

            {/* Mute / Unmute Switch */}
            <button
              type="button"
              onClick={toggleMute}
              className="relative flex h-8 w-20 items-center rounded-full border-2 border-[#b45309] bg-[#1a0f0d] p-0.5 cursor-pointer shadow-inner"
            >
              <div
                className={`absolute h-6 w-9 rounded-full transition-transform ${
                  !isMuted ? 'bg-emerald-600 translate-x-0' : 'bg-red-600 translate-x-9'
                }`}
              />
              <span className="relative z-10 flex-1 text-center text-[10px] font-black text-white">ON</span>
              <span className="relative z-10 flex-1 text-center text-[10px] font-black text-white">OFF</span>
            </button>
          </div>

          {/* SECTION 2: LANGUAGE SELECTION */}
          <div className="bg-[#2b1d19] p-3.5 sm:p-4 rounded-2xl border-2 border-[#b45309] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-[#4a2c17] border border-[#b45309]/60">
                <Globe className="w-4 h-4 text-sky-400" />
              </div>
              <span className="text-xs sm:text-sm font-serif font-black text-[#fde68a] uppercase">
                {t("language_title")}
              </span>
            </div>

            {/* Language Selector Switch */}
            <button
              type="button"
              onClick={() => changeLanguage(language === "vi" ? "en" : "vi")}
              className="relative flex h-8 w-20 items-center rounded-full border-2 border-[#b45309] bg-[#1a0f0d] p-0.5 cursor-pointer shadow-inner"
            >
              <div
                className={`absolute h-6 w-9 rounded-full bg-[#3b82f6] transition-transform ${
                  language === "en" ? 'translate-x-0' : 'translate-x-9'
                }`}
              />
              <span className="relative z-10 flex-1 text-center text-[10px] font-black text-white">ENG</span>
              <span className="relative z-10 flex-1 text-center text-[10px] font-black text-white">VIE</span>
            </button>
          </div>

          {/* SECTION 3: MULTIPLAYER & DATABASE DIAGNOSTICS */}
          <div className="bg-[#2b1d19] p-3.5 sm:p-4 rounded-2xl border-2 border-[#b45309] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-[#4a2c17] border border-[#b45309]/60">
                  <Database className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-serif font-black text-[#fde68a] uppercase block">
                    Multiplayer & Cloud DB
                  </span>
                  <span className="text-[10px] text-amber-200/70 font-mono">
                    Room: {currentServer.code} • {currentServer.players.length} Ships Visible
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isConfigured
                    ? "bg-emerald-950 text-emerald-300 border-emerald-500/50"
                    : "bg-amber-950 text-amber-300 border-amber-500/50"
                }`}
              >
                {isConfigured ? "🟢 Live Cloud" : "🟡 Local Storage"}
              </span>
            </div>

            {/* Diagnostic Action & Status */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRunDiagnostic}
                disabled={isTesting}
                className="flex-1 py-1.5 px-3 rounded-xl bg-[#4a2c17] hover:bg-[#5c371d] border border-[#b45309] text-xs font-bold text-amber-100 flex items-center justify-center gap-1.5 transition-colors shadow disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#facc15] ${isTesting ? "animate-spin" : ""}`} />
                <span>{isTesting ? "Testing..." : "Test Connection"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="py-1.5 px-3 rounded-xl bg-[#4a2c17] hover:bg-[#5c371d] border border-[#b45309] text-xs font-bold text-amber-200 flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                <Key className="w-3.5 h-3.5 text-sky-400" />
                <span>{isConfigOpen ? "Hide Key" : "Config Key"}</span>
              </button>
            </div>

            {/* Test Results Output */}
            {testResult && (
              <div
                className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                  testResult.success
                    ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-200"
                    : "bg-red-950/80 border-red-500/60 text-red-200"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{testResult.success ? "Connection Verified" : "Connection Issue"}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-stone-200">{testResult.message}</p>
                {testResult.success && (
                  <div className="text-[10px] text-emerald-300 font-mono pt-1">
                    Servers: {testResult.serversCount} | Online Ships: {testResult.playersCount} | Accounts: {testResult.accountsCount}
                  </div>
                )}
              </div>
            )}

            {/* Manual Supabase Key Setup Form */}
            {isConfigOpen && (
              <form onSubmit={handleSaveCustomConfig} className="bg-[#1a0f0d] p-3 rounded-xl border border-amber-900/60 space-y-2.5">
                <span className="text-[11px] font-bold text-amber-300 block">
                  Custom Supabase Credentials (Saved Locally):
                </span>
                <div>
                  <label className="text-[10px] text-amber-200/70 block mb-0.5">Project URL</label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://xyz.supabase.co"
                    className="w-full bg-[#2b1d19] border border-[#b45309] rounded-lg px-2.5 py-1.5 text-xs text-amber-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-amber-200/70 block mb-0.5">Anon Key</label>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGci..."
                    className="w-full bg-[#2b1d19] border border-[#b45309] rounded-lg px-2.5 py-1.5 text-xs text-amber-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-[#b45309] hover:bg-[#d97706] text-white font-bold text-xs rounded-lg uppercase tracking-wider transition-colors shadow"
                >
                  Save & Connect
                </button>
              </form>
            )}
          </div>

          {/* SECTION 4: SUPABASE ACCOUNT */}
          <div className="bg-[#2b1d19] p-3.5 sm:p-4 rounded-2xl border-2 border-[#b45309] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-[#4a2c17] border border-[#b45309]/60">
                  <User className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-serif font-black text-[#fde68a] uppercase block">
                    Account (Name-Only)
                  </span>
                  <span className="text-[11px] text-amber-200/80 font-mono">
                    {currentAccount ? `@${currentAccount.username}` : "Not logged in"}
                  </span>
                </div>
              </div>

              {currentAccount && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                  Synced
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="py-2 px-3 rounded-xl bg-[#4a2c17] hover:bg-[#b45309] border border-[#b45309] text-xs font-bold text-amber-100 flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#facc15]" />
                <span>Switch Player</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="py-2 px-3 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-xs font-bold text-red-200 flex items-center justify-center gap-1.5 transition-colors shadow"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Log Out</span>
              </button>
            </div>

            <div className="bg-[#1a0f0d] p-2 rounded-lg text-[10px] text-stone-400 flex items-start gap-1.5 border border-amber-900/40">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>Demo system without passwords or emails. Any user with this name can resume this game save.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
