import React, { useEffect, useRef } from "react";
import { Check, X, Anchor, AlertCircle } from "lucide-react";

interface NameTypingOverlayProps {
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  placeholder?: string;
  maxLength?: number;
  validationError?: string;
}

export const NameTypingOverlay: React.FC<NameTypingOverlayProps> = ({
  isOpen,
  value,
  onChange,
  onClose,
  onConfirm,
  title = "PIRATE NAME",
  placeholder = "Type your name...",
  maxLength = 24,
  validationError,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scrolling/jumping when mobile keyboard appears
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      window.scrollTo(0, 0);

      // Focus input without smooth scrolling delay
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus({ preventScroll: true });
        }
      }, 60);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (onConfirm) onConfirm();
      else onClose();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const handleDone = () => {
    if (onConfirm) onConfirm();
    else onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-start p-3 pt-3 sm:pt-10 select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDone();
        }
      }}
    >
      <div
        className="w-full max-w-sm sm:max-w-md bg-[#2b1d19] border-4 border-[#b45309] rounded-3xl p-4 sm:p-5 shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col gap-3 text-amber-100 relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-amber-900/50 pb-2">
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5 text-[#facc15]" />
            <span className="text-xs sm:text-sm font-serif font-black uppercase text-[#fde68a] tracking-wider">
              {title}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDone}
            className="p-1 rounded-lg bg-[#4a2c17] hover:bg-[#5c371d] text-[#fde68a] border border-amber-700/50 transition-colors"
            title="Done"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct Input Field placed at the top safe zone so keyboard won't move screen */}
        <div className="space-y-1">
          <div className="flex justify-end items-center text-[10px] font-mono text-[#fde68a]/80 px-1">
            <span>
              {value.length}/{maxLength}
            </span>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={maxLength}
            placeholder={placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            className="w-full bg-[#1a0f0d] border-2 border-[#b45309] focus:border-[#facc15] rounded-xl px-3 py-2.5 text-base sm:text-lg text-white font-mono text-center tracking-wide focus:outline-none focus:ring-2 focus:ring-[#facc15]/30 shadow-inner"
          />
        </div>

        {/* Validation or Hint */}
        {validationError ? (
          <div className="px-2.5 py-1.5 bg-rose-950/90 border border-rose-600 rounded-xl text-rose-200 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{validationError}</span>
          </div>
        ) : (
          <p className="text-[10px] text-amber-200/70 font-mono text-center">
            Requirement: 3–24 characters (letters, numbers, underscore)
          </p>
        )}

        {/* Done / Confirm Button */}
        <button
          type="button"
          onClick={handleDone}
          className="w-full py-2.5 sm:py-3 bg-[#15803d] hover:bg-[#16a34a] border-b-4 border-[#14532d] rounded-xl font-serif font-black uppercase text-xs sm:text-sm tracking-wider text-white shadow-lg active:translate-y-0.5 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-200 stroke-[3]" />
          <span>Confirm Name ✓</span>
        </button>
      </div>
    </div>
  );
};
