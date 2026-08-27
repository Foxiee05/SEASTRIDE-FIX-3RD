import React from "react";
import { ArrowLeft } from "lucide-react";

interface BackToSeaStrideProps {
  onClick: () => void;
}

export const BackToSeaStride: React.FC<BackToSeaStrideProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="p-1.5 sm:p-2 bg-[#4a2c17] hover:bg-[#92400e] border-2 border-[#b45309] rounded-lg text-[#fde68a] active:scale-95 transition-transform shadow-md"
    >
      <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
    </button>
  );
};
