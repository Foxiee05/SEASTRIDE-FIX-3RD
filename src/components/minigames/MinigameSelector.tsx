import React, { useState, useEffect } from "react";
import { CalibrationMinigameModal } from "./CalibrationMinigameModal";
import { CannonAimMinigameModal } from "./CannonAimMinigameModal";
import { CannonballCatchMinigameModal } from "./CannonballCatchMinigameModal";

interface Props {
  onComplete: (isWin: boolean) => void;
}

export const MinigameSelector: React.FC<Props> = ({ onComplete }) => {
  const [minigameType, setMinigameType] = useState<1 | 2 | 3 | null>(null);

  useEffect(() => {
    // 1/3 Random Minigame Selection
    const rand = Math.random();
    if (rand < 1/3) {
      setMinigameType(1);
    } else if (rand < 2/3) {
      setMinigameType(2);
    } else {
      setMinigameType(3);
    }
  }, []);

  if (minigameType === 1) {
    return <CalibrationMinigameModal onComplete={onComplete} />;
  }
  
  if (minigameType === 2) {
    return <CannonAimMinigameModal onComplete={onComplete} />;
  }

  if (minigameType === 3) {
    return <CannonballCatchMinigameModal onComplete={onComplete} />;
  }

  return null; // Loading state while selecting
};
