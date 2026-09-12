import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { Anchor, ShieldAlert, UserPlus, LogIn, AlertCircle, Sparkles, Check, Database, X } from "lucide-react";
import { isSupabaseConfigured, validateUsername } from "../utils/supabaseClient";

interface AccountAuthModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const AccountAuthModal: React.FC<AccountAuthModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  canClose = false,
}) => {
  const { registerNewAccount, loginExistingAccount, accountError, clearAccountError } = useGame();

  const [mode, setMode] = useState<"choose" | "new" | "existing">("choose");
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [localValidationMessage, setLocalValidationMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsernameInput(val);
    clearAccountError();

    if (!val) {
      setLocalValidationMessage("");
      return;
    }

    const check = validateUsername(val);
    if (!check.valid) {
      setLocalValidationMessage(check.error || "Invalid username");
    } else {
      setLocalValidationMessage("");
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateUsername(usernameInput);
    if (!check.valid) {
      setLocalValidationMessage(check.error || "Invalid username");
      return;
    }

    setIsLoading(true);
    try {
      await registerNewAccount(usernameInput.trim());
      onSuccess?.();
    } catch (err: any) {
      // Error is caught and stored in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateUsername(usernameInput);
    if (!check.valid) {
      setLocalValidationMessage(check.error || "Invalid username");
      return;
    }

    setIsLoading(true);
    try {
      await loginExistingAccount(usernameInput.trim());
      onSuccess?.();
    } catch (err: any) {
      // Error is caught and stored in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none animate-fade-in">
      <div className="bg-[#4a2c17] border-8 border-[#2b1d19] rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] relative text-amber-100 flex flex-col">
        {/* Decorative Top Accent Bar */}
        <div className="bg-gradient-to-r from-[#be9325] via-[#fde68a] to-[#be9325] h-2 w-full" />

        {/* Header */}
        <div className="bg-[#2b1d19] border-b-4 border-[#4a2c17] p-4 text-center relative">
          {canClose && (
            <button
              onClick={onClose}
              className="absolute right-3 top-3 p-1.5 rounded-full bg-[#4a2c17] hover:bg-[#5c371d] text-amber-200 border border-amber-700/50 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="inline-flex p-3 bg-[#4a2c17] border-2 border-[#b45309] rounded-2xl mb-2 shadow-inner">
            <Anchor className="w-8 h-8 text-[#facc15] animate-pulse" />
          </div>
          <h1 className="text-xl font-serif font-black uppercase text-[#fde68a] tracking-wider drop-shadow-md">
            SeaStride Pirates
          </h1>
          <p className="text-xs text-[#fde68a]/80 font-serif italic mt-0.5">
            Step Tracker & Naval Warfare
          </p>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {/* Demo Account System Notice (Mandatory Labeling) */}
          <div className="bg-[#1a0f0d] border-2 border-amber-500/50 rounded-2xl p-3 text-xs text-amber-200/90 flex gap-2.5 items-start">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300 block uppercase tracking-wide text-[11px]">
                Demo / Name-Only Account Notice
              </span>
              <p className="text-[11px] leading-relaxed text-stone-300">
                This app uses an intentional demo name-only account system with no password, email, or OTP. Anyone who knows or types an account name can access that account. Do not share confidential data.
              </p>
            </div>
          </div>

          {/* Database Connection Status Info */}
          {!isConfigured && (
            <div className="bg-[#1e1b4b]/80 border border-sky-600/40 rounded-xl p-2.5 text-[11px] text-sky-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Operating with persistent local demo storage. Add <code className="text-amber-300">SUPABASE_ANON_KEY</code> to enable live Supabase cloud sync.
              </span>
            </div>
          )}

          {/* MODE: Choose Choice */}
          {mode === "choose" && (
            <div className="space-y-3 pt-1">
              <p className="text-center text-xs font-serif text-[#fde68a] font-bold">
                Welcome to the high seas, sailor! Choose your path:
              </p>

              <button
                type="button"
                onClick={() => {
                  setMode("new");
                  clearAccountError();
                  setLocalValidationMessage("");
                }}
                className="w-full bg-[#15803d] hover:bg-[#16a34a] border-b-4 border-[#14532d] p-3.5 rounded-2xl flex items-center justify-between text-white font-serif font-black uppercase tracking-wider shadow-lg active:translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black/20 rounded-xl">
                    <UserPlus className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm">New Player</div>
                    <div className="text-[10px] text-emerald-200 font-normal lowercase">
                      Create a fresh ship & start journey
                    </div>
                  </div>
                </div>
                <Sparkles className="w-5 h-5 text-emerald-300" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("existing");
                  clearAccountError();
                  setLocalValidationMessage("");
                }}
                className="w-full bg-[#1d4ed8] hover:bg-[#2563eb] border-b-4 border-[#1e3a8a] p-3.5 rounded-2xl flex items-center justify-between text-white font-serif font-black uppercase tracking-wider shadow-lg active:translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black/20 rounded-xl">
                    <LogIn className="w-5 h-5 text-sky-200" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm">Existing Player</div>
                    <div className="text-[10px] text-sky-200 font-normal lowercase">
                      Restore saved ship, coins & records
                    </div>
                  </div>
                </div>
                <Check className="w-5 h-5 text-sky-300" />
              </button>
            </div>
          )}

          {/* MODE: New Player */}
          {mode === "new" && (
            <form onSubmit={handleCreateAccount} className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-black uppercase text-[#fde68a]">
                  Create New Account
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("choose");
                    clearAccountError();
                  }}
                  className="text-[11px] text-[#facc15] hover:underline"
                >
                  ← Back to choices
                </button>
              </div>

              <div>
                <label className="text-[11px] text-[#fde68a]/90 font-serif block mb-1">
                  Choose your pirate account name:
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Captain_Sparrow99"
                  value={usernameInput}
                  onChange={handleInputChange}
                  maxLength={24}
                  className="w-full bg-[#1a0f0d] border-2 border-[#b45309] focus:border-[#facc15] rounded-xl px-3 py-2 text-sm text-white font-mono tracking-wide focus:outline-none"
                />
                <p className="text-[10px] text-[#fde68a]/70 font-mono mt-1">
                  Requirement: 3–24 characters; letters, numbers, and underscores only. Unique & case-sensitive.
                </p>
              </div>

              {localValidationMessage && (
                <div className="p-2 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{localValidationMessage}</span>
                </div>
              )}

              {accountError && (
                <div className="p-2.5 bg-rose-950 border-2 border-rose-700 rounded-xl text-rose-100 text-xs flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Account Error</span>
                  </div>
                  <span>{accountError}</span>
                  {accountError.includes("already taken") && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("existing");
                        clearAccountError();
                      }}
                      className="text-left text-sky-300 underline font-semibold text-[11px] mt-1"
                    >
                      Is this your account? Click here to load it as Existing Player
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !usernameInput.trim()}
                className={`w-full py-3 rounded-2xl text-xs font-serif font-black uppercase tracking-wider border-b-4 shadow-lg transition-all active:translate-y-0.5 ${
                  isLoading || !usernameInput.trim()
                    ? "bg-stone-800 border-stone-900 text-stone-500 cursor-not-allowed"
                    : "bg-[#15803d] hover:bg-[#16a34a] border-[#14532d] text-white"
                }`}
              >
                {isLoading ? "Forging Account..." : "Set Sail (Create Account)"}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("existing");
                    clearAccountError();
                  }}
                  className="text-xs text-[#fde68a] hover:underline"
                >
                  Already have an account? <span className="text-[#facc15] font-bold">Log in here</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE: Existing Player */}
          {mode === "existing" && (
            <form onSubmit={handleLoginAccount} className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-black uppercase text-[#fde68a]">
                  Load Existing Account
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("choose");
                    clearAccountError();
                  }}
                  className="text-[11px] text-[#facc15] hover:underline"
                >
                  ← Back to choices
                </button>
              </div>

              <div>
                <label className="text-[11px] text-[#fde68a]/90 font-serif block mb-1">
                  Type your exact account name (case-sensitive):
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Captain_Sparrow99"
                  value={usernameInput}
                  onChange={handleInputChange}
                  maxLength={24}
                  className="w-full bg-[#1a0f0d] border-2 border-[#b45309] focus:border-[#facc15] rounded-xl px-3 py-2 text-sm text-white font-mono tracking-wide focus:outline-none"
                />
                <p className="text-[10px] text-[#fde68a]/70 font-mono mt-1">
                  Must match the exact case-sensitive name you registered with.
                </p>
              </div>

              {localValidationMessage && (
                <div className="p-2 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{localValidationMessage}</span>
                </div>
              )}

              {accountError && (
                <div className="p-2.5 bg-rose-950 border-2 border-rose-700 rounded-xl text-rose-100 text-xs flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Account Not Found</span>
                  </div>
                  <span>{accountError}</span>
                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("new");
                        clearAccountError();
                      }}
                      className="px-2.5 py-1 bg-[#15803d] hover:bg-[#16a34a] rounded-lg text-white font-bold text-[11px]"
                    >
                      Create as New Account
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !usernameInput.trim()}
                className={`w-full py-3 rounded-2xl text-xs font-serif font-black uppercase tracking-wider border-b-4 shadow-lg transition-all active:translate-y-0.5 ${
                  isLoading || !usernameInput.trim()
                    ? "bg-stone-800 border-stone-900 text-stone-500 cursor-not-allowed"
                    : "bg-[#1d4ed8] hover:bg-[#2563eb] border-[#1e3a8a] text-white"
                }`}
              >
                {isLoading ? "Restoring Fleet..." : "Restore Account & Board Ship"}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("new");
                    clearAccountError();
                  }}
                  className="text-xs text-[#fde68a] hover:underline"
                >
                  Need a new account? <span className="text-[#facc15] font-bold">Register here</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
