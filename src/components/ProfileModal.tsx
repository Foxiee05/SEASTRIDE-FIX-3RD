import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Check,
  User,
  Edit3,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { useGame } from "../context/GameContext";
import { PIRATE_AVATARS } from "../assets";
import { soundFx } from "../utils/audio";

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { profile, updateProfile } = useGame();

  const [username, setUsername] = useState(profile.username);
  const [aboutMe, setAboutMe] = useState(profile.aboutMe);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
              Captain Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#4a2c17] hover:bg-red-700 rounded-lg text-amber-200 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
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
                title="Upload image from device"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Avatar Selector Grid */}
          <div>
            <label className="block text-[10px] font-bold text-[#fde68a] uppercase tracking-wider mb-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-[#facc15]" />
              Choose Cartoon Pirate Avatar
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
                <span>Upload Custom Image From Device</span>
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
            <label className="block text-[10px] font-bold text-[#fde68a] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-[#facc15]" />
              Captain Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={24}
              placeholder="Enter captain name..."
              className="w-full bg-[#1a0f0d] border border-[#b45309] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#facc15] font-semibold"
            />
          </div>

          {/* About Me Input */}
          <div>
            <label className="block text-[10px] font-bold text-[#fde68a] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#facc15]" />
              About Me
            </label>
            <textarea
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              rows={2}
              maxLength={120}
              placeholder="Share your pirate motto or journey..."
              className="w-full bg-[#1a0f0d] border border-[#b45309] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#facc15] resize-none font-medium"
            />
            <div className="text-right text-[9px] text-amber-200/60 mt-0.5">
              {aboutMe.length}/120 characters
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
                  <span>Profile Saved!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#facc15]" />
                  <span>Save Captain Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
