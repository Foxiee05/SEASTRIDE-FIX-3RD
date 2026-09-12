import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  Check,
  User,
  Edit3,
  Image as ImageIcon,
  Sparkles,
  Lock,
  Keyboard,
} from "lucide-react";
import { useGame } from "../context/GameContext";
import { PIRATE_AVATARS } from "../assets";
import { soundFx } from "../utils/audio";
import { NameTypingOverlay } from "./NameTypingOverlay";

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { profile, updateProfile, t, currentAccount, openAccountModal } = useGame();

  const [username, setUsername] = useState(currentAccount?.username || profile.username);
  const [aboutMe, setAboutMe] = useState(profile.aboutMe);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTypingOverlayOpen, setIsTypingOverlayOpen] = useState(false);

  useEffect(() => {
    if (currentAccount?.username) {
      setUsername(currentAccount.username);
    }
  }, [currentAccount?.username]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local image file upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size is too large! Please select an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
          soundFx.playClick();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert("Username cannot be empty!");
      return;
    }

    updateProfile({
      username: username.trim(),
      aboutMe: aboutMe.trim(),
      avatarUrl,
    });

    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#2b1d19] border-4 sm:border-6 border-[#4a2c17] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden text-amber-100 max-h-[88vh] flex flex-col">
        {/* Header Title Bar */}
        <div className="bg-[#1a0f0d] px-3.5 py-2 border-b-2 sm:border-b-4 border-[#4a2c17] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#facc15]" />
            <h2 className="text-base font-black italic tracking-wide text-[#facc15] uppercase font-serif">
              {t("captain_profile")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-[#4a2c17] hover:bg-[#92400e] rounded-lg border border-[#b45309] text-[#fde68a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form
          onSubmit={handleSave}
          className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1"
        >
          {/* Main Avatar Preview (Centered Big Circle) */}
          <div className="flex justify-center my-1">
            <div className="relative">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-3 border-[#facc15] shadow-[0_0_15px_rgba(250,204,21,0.5)] overflow-hidden bg-[#4a2c17] flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Captain Avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-3xl">☠️</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[#b45309] hover:bg-[#d97706] text-white p-1.5 rounded-full border border-amber-200 shadow-md active:scale-90 transition-transform"
                title={t("upload_image", "Upload image from device")}
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Avatar Selector Grid */}
          <div>
            <label className="block text-[10px] font-bold text-[#fde68a] uppercase tracking-wider mb-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-[#facc15]" />
              {t("choose_avatar")}
            </label>

            <div className="grid grid-cols-5 gap-1.5">
              {PIRATE_AVATARS.map((avatar) => {
                const isSelected = avatarUrl === avatar.url;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(avatar.url);
                      soundFx.playClick();
                    }}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all p-0.5 bg-[#1a0f0d] aspect-square flex items-center justify-center ${
                      isSelected
                        ? "border-[#facc15] ring-2 ring-[#facc15] scale-105 shadow-[0_0_10px_rgba(250,204,21,0.6)]"
                        : "border-[#4a2c17] opacity-75 hover:opacity-100 hover:border-[#b45309]"
                    }`}
                    title={avatar.name}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full h-full object-cover rounded"
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute top-0.5 right-0.5 bg-[#f0c242] border-b-4 border-[#be9325] text-white text-[#451a03] p-0.5 rounded-full shadow-md">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Upload Button */}
            <div className="mt-1.5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-1.5 px-2.5 bg-[#4a2c17] hover:bg-[#b45309] border border-[#b45309] rounded-lg text-[11px] font-bold text-[#fde68a] flex items-center justify-center gap-1.5 active:scale-98 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-[#facc15]" />
                <span>{t("upload_custom")}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* Username Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold text-[#fde68a] uppercase tracking-wider flex items-center gap-1">
                {currentAccount ? <Lock className="w-3 h-3 text-[#facc15]" /> : <Edit3 className="w-3 h-3 text-[#facc15]" />}
                {t("captain_username")}
              </label>
              {currentAccount && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openAccountModal();
                  }}
                  className="text-[10px] text-amber-300 hover:text-amber-100 underline font-semibold"
                >
                  Switch Player
                </button>
              )}
            </div>
            {currentAccount ? (
              <input
                type="text"
                value={username}
                disabled
                maxLength={24}
                className="w-full bg-[#140b0a] border border-[#b45309] rounded-lg px-2.5 py-1.5 text-xs text-white opacity-80 cursor-not-allowed font-semibold"
              />
            ) : (
              <div
                onClick={() => setIsTypingOverlayOpen(true)}
                className="w-full bg-[#1a0f0d] border border-[#b45309] hover:border-[#facc15] cursor-pointer rounded-lg px-2.5 py-1.5 text-xs text-white flex items-center justify-between transition-colors shadow-inner"
              >
                <span className="font-semibold truncate">{username || t("captain_username")}</span>
                <span className="flex items-center gap-1 text-[9px] bg-[#4a2c17] text-amber-200 px-1.5 py-0.5 rounded border border-amber-600/40">
                  <Keyboard className="w-2.5 h-2.5 text-[#facc15]" />
                  Type
                </span>
              </div>
            )}
            {currentAccount && (
              <p className="text-[9px] text-amber-300/70 mt-0.5">
                Account ID linked to this player name. Progress saves to Supabase automatically.
              </p>
            )}
          </div>

          {/* About Me Input */}
          <div>
            <label className="block text-[10px] font-bold text-[#fde68a] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#facc15]" />
              {t("about_me")}
            </label>
            <textarea
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              rows={2}
              maxLength={120}
              placeholder={t("about_me")}
              className="w-full bg-[#1a0f0d] border border-[#b45309] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#facc15] resize-none font-medium"
            />
            <div className="text-right text-[9px] text-amber-200/60 mt-0.5">
              {aboutMe.length}/120
            </div>
          </div>

          {/* Submit Save Button */}
          <div className="pt-1">
            <button
              type="submit"
              className={`w-full py-2 px-3 rounded-xl font-black text-xs uppercase italic tracking-wider shadow-xl flex items-center justify-center gap-1.5 border-b-2 border-r transition-all active:translate-y-0.5 ${
                saveSuccess
                  ? "bg-emerald-600 border-emerald-900 text-white"
                  : "bg-[#b45309] hover:bg-[#d97706] border-[#2b1d19] text-white"
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>{t("profile_saved")}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#facc15]" />
                  <span>{t("save_profile")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <NameTypingOverlay
        isOpen={isTypingOverlayOpen}
        value={username}
        onChange={setUsername}
        onClose={() => setIsTypingOverlayOpen(false)}
        title={t("captain_username")}
        placeholder="Enter captain name..."
        maxLength={24}
      />
    </div>
  );
};
