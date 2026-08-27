import React from "react";
import { Compass as CompassIcon, Navigation } from "lucide-react";

interface CompassRoseProps {
  heading: number; // in degrees (0 - 360)
  cardinalDirection?: string;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRotate?: (newHeading: number) => void;
}

export const CompassRose: React.FC<CompassRoseProps> = ({
  heading,
  cardinalDirection = "N",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24 sm:w-28 sm:h-28",
    lg: "w-36 h-36 sm:w-44 sm:h-44",
  }[size];

  const normalizedHeading = ((heading % 360) + 360) % 360;

  return (
    <div className="relative flex flex-col items-center select-none group pointer-events-auto">
      {/* Antique Brass Outer Bezel with Shadow */}
      <div
        className={`relative ${sizeClasses} rounded-full bg-gradient-to-br from-[#78350f] via-[#451a03] to-[#1c0a02] p-1 border-2 sm:border-3 border-[#facc15] shadow-[0_4px_16px_rgba(0,0,0,0.8),inset_0_0_10px_rgba(0,0,0,0.9)] flex items-center justify-center`}
      >
        {/* Subtle Decorative Tick Ring */}
        <div className="absolute inset-1 rounded-full border border-dashed border-[#ca8a04]/40 pointer-events-none" />

        {/* Vintage Parchment Compass Dial - Rotates according to heading */}
        <div
          className="relative w-full h-full rounded-full bg-[#fef3c7] shadow-inner overflow-hidden flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${-normalizedHeading}deg)` }}
        >
          {/* Subtle Parchment Texture & Nautical Graduations */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#fef3c7_40%,#fde68a_80%,#d97706_100%)] opacity-90" />

          {/* SVG 16-Point Nautical Compass Star */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full p-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
          >
            {/* Compass Rings */}
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#78350f"
              strokeWidth="0.8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#b45309"
              strokeWidth="0.5"
              strokeDasharray="1.5,1.5"
            />
            <circle
              cx="50"
              cy="50"
              r="28"
              fill="none"
              stroke="#78350f"
              strokeWidth="0.6"
            />
            <circle
              cx="50"
              cy="50"
              r="14"
              fill="none"
              stroke="#b45309"
              strokeWidth="0.5"
            />

            {/* Minor 8-point Secondary Points (Warm Gold & Amber) */}
            <g opacity="0.85">
              {/* NE */}
              <polygon
                points="50,50 50,22 55,50"
                fill="#b45309"
                transform="rotate(45 50 50)"
              />
              <polygon
                points="50,50 50,22 45,50"
                fill="#fde68a"
                transform="rotate(45 50 50)"
              />
              {/* SE */}
              <polygon
                points="50,50 50,22 55,50"
                fill="#b45309"
                transform="rotate(135 50 50)"
              />
              <polygon
                points="50,50 50,22 45,50"
                fill="#fde68a"
                transform="rotate(135 50 50)"
              />
              {/* SW */}
              <polygon
                points="50,50 50,22 55,50"
                fill="#b45309"
                transform="rotate(225 50 50)"
              />
              <polygon
                points="50,50 50,22 45,50"
                fill="#fde68a"
                transform="rotate(225 50 50)"
              />
              {/* NW */}
              <polygon
                points="50,50 50,22 55,50"
                fill="#b45309"
                transform="rotate(315 50 50)"
              />
              <polygon
                points="50,50 50,22 45,50"
                fill="#fde68a"
                transform="rotate(315 50 50)"
              />
            </g>

            {/* Principal 4-point Cardinal Points (Bold Seafaring Red, Gold & Dark Wood) */}
            {/* North Point (Prominent Fleur-De-Lis Accent & Ruby Red) */}
            <polygon points="50,50 50,6 56,50" fill="#991b1b" />
            <polygon points="50,50 50,6 44,50" fill="#ef4444" />

            {/* East Point */}
            <polygon
              points="50,50 50,10 55,50"
              fill="#78350f"
              transform="rotate(90 50 50)"
            />
            <polygon
              points="50,50 50,10 45,50"
              fill="#fbbf24"
              transform="rotate(90 50 50)"
            />

            {/* South Point */}
            <polygon
              points="50,50 50,10 55,50"
              fill="#78350f"
              transform="rotate(180 50 50)"
            />
            <polygon
              points="50,50 50,10 45,50"
              fill="#fbbf24"
              transform="rotate(180 50 50)"
            />

            {/* West Point */}
            <polygon
              points="50,50 50,10 55,50"
              fill="#78350f"
              transform="rotate(270 50 50)"
            />
            <polygon
              points="50,50 50,10 45,50"
              fill="#fbbf24"
              transform="rotate(270 50 50)"
            />

            {/* Cardinal Letter Labels */}
            <text
              x="50"
              y="16"
              textAnchor="middle"
              fontSize="6.5"
              fontWeight="900"
              fontFamily="serif"
              fill="#7f1d1d"
            >
              N
            </text>
            <text
              x="86"
              y="52"
              textAnchor="middle"
              fontSize="5.5"
              fontWeight="800"
              fontFamily="serif"
              fill="#451a03"
            >
              E
            </text>
            <text
              x="50"
              y="88"
              textAnchor="middle"
              fontSize="5.5"
              fontWeight="800"
              fontFamily="serif"
              fill="#451a03"
            >
              S
            </text>
            <text
              x="14"
              y="52"
              textAnchor="middle"
              fontSize="5.5"
              fontWeight="800"
              fontFamily="serif"
              fill="#451a03"
            >
              W
            </text>

            {/* Center Pivot Boss */}
            <circle
              cx="50"
              cy="50"
              r="5"
              fill="#f59e0b"
              stroke="#78350f"
              strokeWidth="1.2"
            />
            <circle cx="50" cy="50" r="2.2" fill="#451a03" />
          </svg>
        </div>

        {/* Fixed Top North Marker Pip (Lubber's line pointing up) */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-[#facc15] drop-shadow-md z-10" />
      </div>

      {/* Heading Readout Badge */}
      <div className="mt-1 bg-[#2b1d19]/90 backdrop-blur-sm border border-[#b45309] px-2 py-0.5 rounded-md text-center shadow-lg">
        <span className="text-[9px] sm:text-[10px] font-mono font-black text-[#fbbf24] tracking-wider">
          {Math.round(normalizedHeading)}° {cardinalDirection}
        </span>
      </div>
    </div>
  );
};
