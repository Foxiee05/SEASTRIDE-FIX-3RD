import React from 'react';
import { Info } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[#2b1d19] border-4 border-[#4a2c17] rounded-2xl w-full max-w-sm p-4 shadow-2xl relative flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3 border-b-2 border-[#4a2c17] pb-2">
          <Info className="w-5 h-5 text-sky-400" />
          <h3 className="font-serif font-black text-[#fde68a] text-sm uppercase">{title}</h3>
        </div>
        <p className="text-xs text-amber-100/90 leading-relaxed mb-4">{message}</p>
        <button onClick={onClose} className="w-full bg-[#b45309] hover:bg-[#d97706] text-white py-2 rounded-lg font-black uppercase text-xs border-b-2 border-[#facc15] active:scale-95 transition-all">
          Got it
        </button>
      </div>
    </div>
  );
};
