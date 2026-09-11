import React, { useState, useEffect, useRef } from "react";
import { Joyride, STATUS, Step, EVENTS, ACTIONS, TooltipRenderProps } from "react-joyride";
import { useGame } from "../context/GameContext";

interface TutorialProps {
  activeTab: string;
  setActiveTab: (tab: "menu" | "home" | "build" | "sea" | "leaderboard") => void;
  tutorialTrigger?: { tab?: string; step?: number; timestamp: number } | null;
  onTutorialEnd?: () => void;
}

const CustomTooltip: React.FC<TooltipRenderProps> = ({
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  isLastStep,
  size,
  tooltipProps,
}) => {
  const { t, language } = useGame();

  return (
    <div
      {...tooltipProps}
      className="bg-[#f0dec1] text-[#4a2c17] rounded-2xl border-4 border-[#8b5a33] shadow-[0_6px_0_#4a2c17] p-3 sm:p-4 font-serif box-border max-w-[calc(100vw-16px)] w-[min(320px,calc(100vw-100px))] z-[10002] select-none"
    >
      {/* Top Header: Step Badge & Skip Button (replaces 'X' icon) */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#8b5a33]/25">
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#8b5a33] bg-[#d1b794]/60 px-2 py-0.5 rounded-md">
          {language === "vi" ? `Hướng dẫn ${index + 1}/${size}` : `Guide ${index + 1} of ${size}`}
        </span>

        {/* Skip button with text replacing 'x' */}
        <button
          {...skipProps}
          type="button"
          className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#d75448] hover:text-[#9b3026] active:scale-90 px-2 py-0.5 rounded transition-all cursor-pointer hover:bg-[#d75448]/10"
          title="Skip tutorial"
        >
          {t("tutorial_skip")}
        </button>
      </div>

      {/* Main Content Body */}
      <div className="text-left mb-3.5 text-[#4a2c17]">{step.content}</div>

      {/* Bottom Footer with Back / Next / Finish (hidden if hideFooter is true) */}
      {!(step as any).hideFooter && (
        <div className="flex items-center justify-between pt-2 border-t border-[#8b5a33]/25">
          <div>
            {index > 0 ? (
              <button
                {...backProps}
                type="button"
                className="text-xs sm:text-sm font-bold text-[#8b5a33] hover:text-[#4a2c17] px-2.5 py-1 rounded-lg active:scale-95 transition-transform cursor-pointer"
              >
                {t("tutorial_prev")}
              </button>
            ) : (
              <div />
            )}
          </div>

          <button
            {...primaryProps}
            type="button"
            className="bg-[#93bb44] border-b-4 border-[#658627] text-white font-black text-xs sm:text-sm px-4 py-1.5 rounded-xl shadow-md active:border-b-0 active:translate-y-1 active:scale-95 transition-all cursor-pointer"
          >
            {isLastStep ? t("tutorial_finish") : t("tutorial_next")}
          </button>
        </div>
      )}
    </div>
  );
};

const getGlobalSteps = (t: (key: string) => string): (Step & { _tab: string; [key: string]: any })[] => [
  // Home
  {
    target: ".tutorial-steps-bar",
    placement: "top",
    _tab: "home",
    content: (
      <div className="font-serif">
        <h3 className="text-[clamp(0.95rem,3.2vw,1.15rem)] font-black text-[#4a2c17] mb-1">
          {t("tutorial_daily_steps_title")}
        </h3>
        <p className="text-[clamp(0.75rem,2.5vw,0.85rem)] text-[#8b5a33] font-bold leading-relaxed">
          {t("tutorial_daily_steps_desc")}
        </p>
      </div>
    ),
  },
  {
    target: ".tutorial-level",
    placement: "bottom",
    _tab: "home",
    content: (
      <div className="font-serif">
        <h3 className="text-[clamp(0.95rem,3.2vw,1.15rem)] font-black text-[#4a2c17] mb-1">
          {t("tutorial_level_title")}
        </h3>
        <p className="text-[clamp(0.75rem,2.5vw,0.85rem)] text-[#8b5a33] font-bold leading-relaxed">
          {t("tutorial_level_desc")}
        </p>
      </div>
    ),
  },
  {
    target: ".tutorial-booty-safety",
    placement: "top",
    _tab: "home",
    content: (
      <div className="font-serif">
        <h3 className="text-[clamp(0.95rem,3.2vw,1.15rem)] font-black text-[#4a2c17] mb-1">
          {t("tutorial_energy_charged_title")}
        </h3>
        <p className="text-[clamp(0.75rem,2.5vw,0.85rem)] text-[#8b5a33] font-bold leading-relaxed">
          {t("tutorial_energy_charged_desc")}
        </p>
      </div>
    ),
  },
  {
    target: ".tutorial-quests",
    placement: "top",
    _tab: "home",
    content: (
      <div className="font-serif">
        <h3 className="text-[clamp(0.95rem,3.2vw,1.15rem)] font-black text-[#4a2c17] mb-1">
          {t("tutorial_quests_title")}
        </h3>
        <p className="text-[clamp(0.75rem,2.5vw,0.85rem)] text-[#8b5a33] font-bold leading-relaxed">
          {t("tutorial_quests_desc")}
        </p>
      </div>
    ),
  },
  // Build
  {
    target: ".tutorial-build-nav",
    placement: "top",
    _tab: "build",
    content: (
      <div className="font-serif">
        <h3 className="text-[clamp(0.95rem,3.2vw,1.15rem)] font-black text-[#4a2c17] mb-1">
          {t("tutorial_ship_build_title")}
        </h3>
        <p className="text-[clamp(0.75rem,2.5vw,0.85rem)] text-[#8b5a33] font-bold leading-relaxed">
          {t("tutorial_ship_build_desc")}
        </p>
      </div>
    ),
  },
  {
    target: ".tutorial-energy-bar",
    placement: "bottom",
    _tab: "build",
    content: (
      <div className="font-serif">
        <h3 className="text-[clamp(0.95rem,3.2vw,1.15rem)] font-black text-[#4a2c17] mb-1">
          {t("tutorial_energy_title")}
        </h3>
        <p className="text-[clamp(0.75rem,2.5vw,0.85rem)] text-[#8b5a33] font-bold leading-relaxed">
          {t("tutorial_energy_desc")}
        </p>
      </div>
    ),
  },
  {
    target: ".tutorial-hub",
    placement: "right",
    offset: 8,
    _tab: "build",
    content: (
      <div className="font-serif">
        <h3 className="text-[clamp(0.95rem,3.2vw,1.15rem)] font-black text-[#4a2c17] mb-1">
          {t("tutorial_hub_title")}
        </h3>
        <p className="text-[clamp(0.75rem,2.5vw,0.85rem)] text-[#8b5a33] font-bold leading-relaxed">
          {t("tutorial_hub_desc")}
        </p>
      </div>
    ),
  },
  // Sea
  {
    target: ".tutorial-sea-nav",
    placement: "top",
    _tab: "sea",
    content: (
      <div className="font-serif">
        <h3 className="text-[clamp(0.95rem,3.2vw,1.15rem)] font-black text-[#4a2c17] mb-1">
          {t("tutorial_the_sea_title")}
        </h3>
        <p className="text-[clamp(0.75rem,2.5vw,0.85rem)] text-[#8b5a33] font-bold leading-relaxed">
          {t("tutorial_the_sea_desc")}
        </p>
      </div>
    ),
  },
  {
    target: ".tutorial-game-mode-switch",
    placement: "bottom",
    _tab: "sea",
    content: (
      <div className="font-serif">
        <h3 className="text-[clamp(0.95rem,3.2vw,1.15rem)] font-black text-[#4a2c17] mb-1">
          {t("tutorial_game_modes_title")}
        </h3>
        <p className="text-[clamp(0.75rem,2.5vw,0.85rem)] text-[#8b5a33] font-bold leading-relaxed">
          {t("tutorial_game_modes_desc")}
        </p>
      </div>
    ),
  },
  // Fleet
  {
    target: ".tutorial-fleet-nav",
    placement: "top",
    _tab: "leaderboard",
    content: (
      <div className="font-serif">
        <h3 className="text-[clamp(0.95rem,3.2vw,1.15rem)] font-black text-[#4a2c17] mb-1">
          {t("tutorial_fleet_title")}
        </h3>
        <p className="text-[clamp(0.75rem,2.5vw,0.85rem)] text-[#8b5a33] font-bold leading-relaxed">
          {t("tutorial_fleet_desc")}
        </p>
      </div>
    ),
  },
];

export const TutorialOverlay: React.FC<TutorialProps> = ({
  activeTab,
  setActiveTab,
  tutorialTrigger,
  onTutorialEnd,
}) => {
  const { t } = useGame();
  const globalSteps = React.useMemo(() => getGlobalSteps(t), [t]);
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    const handleAdvance = () => {
      setStepIndex((prev) => prev + 1);
    };
    window.addEventListener("TUTORIAL_ADVANCE", handleAdvance);
    return () => window.removeEventListener("TUTORIAL_ADVANCE", handleAdvance);
  }, []);

  // Auto-Trigger on Entering Home / Game for First-Time Users (runs only once upon initial launch)
  useEffect(() => {
    if (hasAutoStartedRef.current || run) return;
    const hasSeen = localStorage.getItem("seastride_has_seen_global_tutorial_v7");
    if (!hasSeen && activeTab !== "menu") {
      hasAutoStartedRef.current = true;
      const timer = setTimeout(() => {
        setStepIndex(0);
        setRun(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [activeTab, run]);

  // Explicit Trigger (When user clicks "?" help button on HUD)
  useEffect(() => {
    if (!tutorialTrigger) return;

    const currentTab = tutorialTrigger.tab || activeTab;

    // Find the right start index for the requested tab
    let targetIndex = 0;
    if (tutorialTrigger.step !== undefined && tutorialTrigger.step !== null) {
      targetIndex = tutorialTrigger.step;
    } else {
      const tabStepIndex = globalSteps.findIndex((s) => s._tab === currentTab);
      if (tabStepIndex !== -1) {
        targetIndex = tabStepIndex;
      }
    }

    const step = globalSteps[targetIndex];
    if (!step) return;

    // Stop current run first to cleanly reset Floating UI calculations
    setRun(false);

    if (step._tab !== activeTab) {
      setActiveTab(step._tab as any);
    }

    const timer = setTimeout(() => {
      if (step.target !== "body") {
        const el = document.querySelector(step.target as string);
        if (el) {
          el.scrollIntoView({
            behavior: "auto",
            block: "nearest",
            inline: "nearest",
          });
        }
      }
      setStepIndex(targetIndex);

      setTimeout(() => {
        setRun(true);
      }, 50);
    }, 100);

    return () => clearTimeout(timer);
  }, [tutorialTrigger, globalSteps]);

  // Instant scroll alignment to current tutorial target whenever step or tab changes
  useEffect(() => {
    if (!run) return;
    const currentStep = globalSteps[stepIndex];
    if (!currentStep || currentStep.target === "body") return;

    const el = document.querySelector(currentStep.target as string);
    if (el) {
      el.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [stepIndex, run, activeTab, globalSteps]);

  const handleJoyrideCallback = (data: any) => {
    const { action, index, status, type, step } = data;

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Cleanup active styles on step change, finish or skip
    if (
      type === EVENTS.STEP_AFTER ||
      type === EVENTS.TARGET_NOT_FOUND ||
      finishedStatuses.includes(status as any) ||
      action === ACTIONS.SKIP ||
      action === ACTIONS.CLOSE
    ) {
      document.querySelectorAll(".tutorial-active-target").forEach((el) => {
        el.classList.remove("tutorial-active-target");
      });
    }

    // Skip or finish skips all follow-up steps and persists to localStorage
    if (
      action === ACTIONS.SKIP ||
      action === ACTIONS.CLOSE ||
      finishedStatuses.includes(status as any)
    ) {
      setRun(false);
      localStorage.setItem("seastride_has_seen_global_tutorial_v7", "true");
      if (onTutorialEnd) onTutorialEnd();
      return;
    }

    if (type === EVENTS.TOOLTIP || type === EVENTS.STEP_BEFORE) {
      const targetEl = document.querySelector(step.target as string);
      if (targetEl && step.target !== "body") {
        targetEl.scrollIntoView({
          behavior: "auto",
          block: "nearest",
          inline: "nearest",
        });
        targetEl.classList.add("tutorial-active-target");
      }
    }

    if (type === EVENTS.STEP_AFTER) {
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);

      if (nextIndex >= 0 && nextIndex < globalSteps.length) {
        const nextStep = globalSteps[nextIndex];
        // If the next step is on a different tab, switch tab first
        if (nextStep._tab !== activeTab) {
          setActiveTab(nextStep._tab as any);
          setTimeout(() => {
            if (nextStep.target !== "body") {
              const el = document.querySelector(nextStep.target as string);
              if (el) {
                el.scrollIntoView({
                  behavior: "auto",
                  block: "nearest",
                  inline: "nearest",
                });
              }
            }
            setStepIndex(nextIndex);
          }, 80);
        } else {
          if (nextStep.target !== "body") {
            const el = document.querySelector(nextStep.target as string);
            if (el) {
              el.scrollIntoView({
                behavior: "auto",
                block: "nearest",
                inline: "nearest",
              });
            }
          }
          setStepIndex(nextIndex);
        }
      } else {
        setRun(false);
        localStorage.setItem("seastride_has_seen_global_tutorial_v7", "true");
        if (onTutorialEnd) onTutorialEnd();
      }
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      // Advance to next valid step safely
      const nextIndex = index + 1;
      if (nextIndex < globalSteps.length) {
        const nextStep = globalSteps[nextIndex];
        if (nextStep._tab !== activeTab) {
          setActiveTab(nextStep._tab as any);
          setTimeout(() => setStepIndex(nextIndex), 80);
        } else {
          setStepIndex(nextIndex);
        }
      } else {
        setRun(false);
        localStorage.setItem("seastride_has_seen_global_tutorial_v7", "true");
        if (onTutorialEnd) onTutorialEnd();
      }
    }
  };

  return (
    <Joyride
      steps={globalSteps}
      run={run}
      stepIndex={stepIndex}
      continuous={true}
      scrollToFirstStep={false}
      tooltipComponent={CustomTooltip}
      styles={{
        spotlight: {
          stroke: "#f59e0b",
          strokeWidth: 2,
        },
      }}
      options={{
        arrowColor: "#f0dec1",
        overlayColor: "rgba(0, 0, 0, 0.45)",
        zIndex: 10000,
        scrollDuration: 0,
        scrollOffset: 60,
        spotlightPadding: 4,
        spotlightRadius: 14,
        overlayClickAction: false,
        dismissKeyAction: false,
        skipBeacon: true,
      }}
      floatingOptions={{
        shiftOptions: {
          padding: 8,
          crossAxis: true,
        },
        flipOptions: {
          padding: 8,
          fallbackPlacements: ["bottom", "top", "right"],
        },
      }}
      onEvent={handleJoyrideCallback}
    />
  );
};
