import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, 
  Trophy, 
  Crown, 
  Footprints, 
  Flame, 
  Gift, 
  Clock, 
  Globe, 
  CheckCircle2, 
  Lock,
  Sparkles,
  Star,
  ChevronRight,
  Users,
  ArrowLeft,
  X
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ASSETS } from '../assets';
import { getMonsterMilestones } from '../data/monsters';
import { RaidMilestoneBounty } from '../types';
import { soundFx } from '../utils/audio';
import { useCutoutImage } from '../utils/imageUtils';
import { formatDuration, getRaidSessionInfo } from '../utils/timeUtils';

interface FloatingDamage {
  id: number;
  damage: number;
  isCritical: boolean;
  x: number;
  y: number;
}

interface RaidBossScreenProps {
  onBackToMenu?: () => void;
  openServerModal?: () => void;
  embeddedMode?: boolean;
}

export function RaidBossScreen({ onBackToMenu, openServerModal, embeddedMode = false }: RaidBossScreenProps) {
  const { 
    currentServer, 
    currentRaidState, 
    currentMonster, 
    raidSessionInfo,
    joinRaid,
    claimRaidPrize, 
    claimMilestoneBounty,
    t,
  } = useGame();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showBountiesModal, setShowBountiesModal] = useState(false);
  const [showYourDamageModal, setShowYourDamageModal] = useState(false);
  const [showDamageShareModal, setShowDamageShareModal] = useState(false);
  const [floatingDamages] = useState<FloatingDamage[]>([]);
  const [claimResult, setClaimResult] = useState<{ coinsWon: number; gemsWon: number; percent: number; chestName: string } | null>(null);
  const [milestoneClaimResult, setMilestoneClaimResult] = useState<{ bounty: RaidMilestoneBounty; coinsWon: number; gemsWon: number; percent: number } | null>(null);
  const [selectedMilestonePreview, setSelectedMilestonePreview] = useState<RaidMilestoneBounty | null>(null);

  // UTC+7 Raid Session Info & Countdown
  const effectiveSessionInfo = raidSessionInfo || getRaidSessionInfo(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<string>(() => {
    return effectiveSessionInfo.isActive
      ? formatDuration(effectiveSessionInfo.msUntilEnd)
      : formatDuration(effectiveSessionInfo.msUntilNextStart);
  });

  useEffect(() => {
    const updateCountdown = () => {
      const info = getRaidSessionInfo(Date.now());
      if (info.isActive) {
        setTimeRemaining(formatDuration(info.msUntilEnd));
      } else {
        setTimeRemaining(formatDuration(info.msUntilNextStart));
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const userParticipant = currentRaidState.participants.find(p => p.isUser || p.id === 'user_player');
  const userDamage = userParticipant ? userParticipant.damage : 0;
  const totalDamageDealt = currentRaidState.participants.reduce((sum, p) => sum + p.damage, 0);
  const userDamagePercent = totalDamageDealt > 0 ? ((userDamage / totalDamageDealt) * 100) : 0;

  const hpPercent = Math.max(0, Math.min(100, (currentRaidState.currentHp / currentRaidState.maxHp) * 100));
  const joinedHpPercent = currentRaidState.joinedHpPercent !== undefined ? currentRaidState.joinedHpPercent : 100;

  // All 6 Bounties (5 Milestone Bounties + 1 Final Bounty)
  const allBounties = getMonsterMilestones(currentMonster);
  const claimedMilestones = currentRaidState.claimedMilestones || [];

  const availableToClaimCount = allBounties.filter(b => {
    const isPassedBeforeJoin = joinedHpPercent !== undefined && b.hpThresholdPercent >= joinedHpPercent;
    if (isPassedBeforeJoin) return false;

    if (b.isFinal) {
      return currentRaidState.isDefeated && !currentRaidState.dailyPrizeClaimed && userDamage > 0;
    }
    return hpPercent <= b.hpThresholdPercent && !claimedMilestones.includes(b.hpThresholdPercent) && userDamage > 0;
  }).length;

  // Calculate user's damage share % and reward amounts
  const userShareRatio = totalDamageDealt > 0 ? (userDamage / totalDamageDealt) : 0;
  const userSharePercent = Math.round(userShareRatio * 1000) / 10;

  const getBountyRewardShare = (bounty: RaidMilestoneBounty) => {
    const isPassedBeforeJoin = joinedHpPercent !== undefined && bounty.hpThresholdPercent >= joinedHpPercent;
    if (isPassedBeforeJoin || userDamage <= 0 || userShareRatio <= 0) {
      return {
        coins: 0,
        gems: 0,
        percent: 0,
        poolCoins: bounty.coins,
        poolGems: bounty.gems,
        hasDamage: false,
        isPassedBeforeJoin,
      };
    }
    return {
      coins: Math.max(1, Math.round(bounty.coins * userShareRatio)),
      gems: Math.round(bounty.gems * userShareRatio),
      percent: userSharePercent,
      poolCoins: bounty.coins,
      poolGems: bounty.gems,
      hasDamage: true,
      isPassedBeforeJoin: false,
    };
  };

  const handleClaim = () => {
    const res = claimRaidPrize();
    if (res) {
      setClaimResult(res);
    }
  };

  const handleClaimMilestone = (threshold: number) => {
    const res = claimMilestoneBounty(threshold);
    if (res) {
      setMilestoneClaimResult(res);
    }
  };

  // Sorted participants by damage
  const sortedParticipants = [...currentRaidState.participants].sort((a, b) => b.damage - a.damage);
  const userRankIndex = sortedParticipants.findIndex(p => p.isUser || p.id === 'user_player') + 1;

  // Nearest upcoming milestone (first threshold strictly below current HP)
  const upcomingMilestones = allBounties.filter(b => hpPercent > b.hpThresholdPercent);
  const nearestUpcomingMilestone = upcomingMilestones.length > 0
    ? upcomingMilestones.reduce((prev, curr) => curr.hpThresholdPercent > prev.hpThresholdPercent ? curr : prev)
    : (allBounties.find(b => b.isFinal) || allBounties[allBounties.length - 1]);
  const nearestMilestoneReward = nearestUpcomingMilestone ? getBountyRewardShare(nearestUpcomingMilestone) : null;
  const isNearestPassedBeforeJoin = nearestUpcomingMilestone && joinedHpPercent !== undefined && nearestUpcomingMilestone.hpThresholdPercent >= joinedHpPercent;

  const rawMonsterImg = ASSETS.monsters[currentMonster.id] || ASSETS.monsters.kraken;
  const monsterImg = useCutoutImage(rawMonsterImg, { mode: 'edge', keepInternalGreenAsBlack: false });

  // -------------------------------------------------------------
  // VIEW DORMANT: NO ACTIVE RAID SESSION (TUE 00:00 - THU 23:59:59 UTC+7)
  // -------------------------------------------------------------
  if (!effectiveSessionInfo.isActive) {
    return (
      <div 
        id="raid-boss-dormant-screen"
        data-no-swipe="true"
        className="w-full h-full min-h-0 flex flex-col justify-center items-center bg-gradient-to-b from-[#1c120c] via-[#101b2b] to-[#070c14] text-amber-100 overflow-hidden relative select-none p-3 sm:p-4"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(180,83,9,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-xs sm:max-w-sm mx-auto w-full gap-3 sm:gap-4 my-auto">
          {/* Leviathan Icon in Dormant Slumber */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900/90 border-2 border-amber-500/40 flex items-center justify-center shadow-xl relative shrink-0">
            <span className="text-3xl sm:text-4xl filter grayscale opacity-75 animate-pulse">🌊</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-black font-serif uppercase tracking-wider text-amber-300">
              {t("raid_session_inactive", "Sea Monster Has Retreated")}
            </h2>
            <p className="text-[11px] sm:text-xs text-amber-200/80 leading-relaxed px-1">
              {t("raid_session_desc", "Raid Boss session appears from Friday 00:00:00 AM until Monday 23:59:59 PM (UTC+7).")}
            </p>
          </div>

          {/* Countdown Card to next session */}
          <div className="w-full bg-[#2b1d19]/90 border-2 border-[#b45309] rounded-xl p-3 shadow-lg flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-serif font-black uppercase text-amber-400">
              <Clock size={13} className="animate-spin" style={{ animationDuration: '10s' }} />
              <span>{t("next_session_starts_in", "Next Raid Awakens In")}</span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-yellow-300 tracking-wider">
              {timeRemaining}
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onBackToMenu?.();
            }}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg border-2 border-yellow-200 active:scale-95 transition-all flex items-center justify-center gap-2 font-serif"
          >
            <ArrowLeft size={15} /> {t("return_to_ocean", "Return to Ocean")}
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW A: "JOIN RAID?" PROMPT & CONFIRMATION LOBBY
  // -------------------------------------------------------------
  if (!currentRaidState.hasJoined) {
    return (
      <div 
        id="pokemon-go-join-raid-prompt" 
        data-no-swipe="true"
        className="w-full max-w-full h-full flex flex-col bg-gradient-to-b from-[#1c120c] via-[#101b2b] to-[#070c14] text-amber-100 overflow-y-auto overflow-x-hidden relative select-none p-2.5 sm:p-4 pb-12 overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Atmospheric Ambient Pirate Ocean Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(180,83,9,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        {/* Main Encounter Card */}
        <div className="relative z-10 flex flex-col items-center justify-start py-2 text-center max-w-sm mx-auto w-full gap-3 min-w-0 flex-shrink-0 pb-6">
          
          {/* 1. Question / Joining Rule Contract Box & Action Options */}
          <div className="w-full bg-gradient-to-b from-[#2b1d19] via-[#211613] to-[#170e0c] border-2 border-[#b45309] rounded-2xl p-3.5 shadow-2xl text-left min-w-0">
            <div className="flex flex-col items-center justify-center text-center w-full gap-1.5 mb-2">
              <div className="flex items-center justify-center gap-2 font-black text-xs sm:text-sm text-[#facc15] font-serif uppercase tracking-wider">
                <Swords size={16} className="text-[#facc15] flex-shrink-0" /> 
                <span className="truncate">{t("join_fleet_raid")}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-0.5 bg-[#120a08]/90 border border-amber-400/50 rounded-full text-[10px] font-bold text-amber-300 shadow">
                <Clock size={11} className="text-amber-400 flex-shrink-0 animate-pulse" />
                <span className="text-amber-200/80">{t("raid_ends_in", "Leaves in")}:</span>
                <span className="font-mono font-black text-yellow-300 tracking-tight">{timeRemaining}</span>
                <span className="text-[8.5px] font-mono text-amber-400/80 bg-black/40 px-1 py-0.2 rounded border border-amber-500/30">UTC+7</span>
              </div>
            </div>
            
            <div className="mt-2 p-2 bg-[#120a08]/80 border border-[#8b5a2b]/50 rounded-xl flex items-center gap-2 text-[10px] sm:text-[11px] text-amber-200">
              <Footprints size={15} className="text-emerald-400 flex-shrink-0 animate-bounce" />
              <span>
                {t("every_footstep_deals")} <span className="text-emerald-300 font-black">{t("hp_damage")}</span> {t("to_the_leviathan")}
              </span>
            </div>

            {/* Action Choice Buttons */}
            <div className="w-full flex flex-col sm:flex-row gap-2 mt-3">
              <button
                id="confirm-join-raid-btn"
                onClick={() => {
                  joinRaid();
                }}
                className="flex-1 py-2.5 sm:py-3 px-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-[0_4px_16px_rgba(245,158,11,0.4)] border-2 border-yellow-200 active:scale-95 transition-all flex items-center justify-center gap-1.5 truncate font-serif"
              >
                <Swords size={15} className="flex-shrink-0" /> {t("yes_join_raid")}
              </button>

              <button
                id="decline-join-raid-btn"
                onClick={() => {
                  soundFx.playClick();
                  onBackToMenu?.();
                }}
                className="py-2.5 px-3 bg-[#2b1d19] hover:bg-[#3d291f] text-stone-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-[#8b5a2b] active:scale-95 transition-all flex-shrink-0"
              >
                {t("no_return")}
              </button>
            </div>
          </div>

          {/* 2. Dramatic Eye-Catching Title */}
          <div className="w-full flex items-center justify-center gap-2 py-1 px-2 relative min-w-0 max-w-full overflow-hidden flex-shrink-0">
            <div className="h-[2px] flex-1 min-w-[12px] bg-gradient-to-r from-transparent via-amber-400 to-amber-600" />
            <div className="py-1 px-3 bg-[#2b1d19]/90 rounded-xl border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.25)] flex-shrink min-w-0 text-center">
              <span className="text-xs sm:text-sm md:text-base font-black uppercase tracking-[0.16em] text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-serif block leading-tight">
                {t("from_the_abyss")}
              </span>
            </div>
            <div className="h-[2px] flex-1 min-w-[12px] bg-gradient-to-l from-transparent via-amber-400 to-amber-600" />
          </div>

          {/* 3. Target Boss Information Showcase */}
          <div className="w-full bg-[#1c130e]/90 border-2 border-[#b45309]/80 rounded-2xl p-3 flex flex-col items-center shadow-xl min-w-0">
            {/* Floating Boss Stage with Transparent Cutout Image */}
            <div className="relative my-1 w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center max-w-full overflow-visible">
              {/* Perspective Pedestal */}
              <div className="absolute bottom-1 w-40 sm:w-48 h-10 rounded-[100%] border-2 border-amber-400/60 bg-amber-950/40 shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-pulse" style={{ transform: 'rotateX(68deg)' }} />
              
              <motion.img
                src={monsterImg}
                alt={currentMonster.name}
                animate={{ y: [0, -8, 0], scale: [1, 1.03, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,1)] relative z-10"
              />
            </div>

            {/* Monster Name */}
            <h2 className="text-sm sm:text-base font-black text-amber-200 uppercase tracking-wider flex items-center justify-center gap-1.5 mt-1 mb-2 truncate max-w-full font-serif">
              <span className="truncate">{currentMonster.name}</span>
            </h2>
            
            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              <span className="px-2.5 py-0.5 bg-rose-950/80 border border-rose-500/60 rounded-md text-[9px] font-bold text-rose-300 font-mono">
                {currentRaidState.currentHp.toLocaleString()} HP
              </span>
              <span className="px-2.5 py-0.5 bg-[#2b1d19] border border-[#8b5a2b] rounded-md text-[9px] font-bold text-amber-200 flex items-center gap-1">
                <Users size={10} className="text-sky-400" /> {currentRaidState.participants.length} Active
              </span>
            </div>

            {/* List of currently joined captains */}
            {currentRaidState.participants.length > 0 && (
              <div className="w-full mt-2.5 pt-2 border-t border-[#8b5a2b]/40 flex flex-col gap-1 text-left">
                <div className="flex items-center justify-between text-[9.5px] font-bold uppercase tracking-wider text-amber-300/90 font-serif px-0.5">
                  <span>{t("active_captains", "Joined Captains")}</span>
                  <span className="text-sky-400 font-mono font-bold">{currentRaidState.participants.length}</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
                  {currentRaidState.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-1.5 bg-[#2b1d19]/95 border border-amber-500/40 rounded-lg px-2 py-1 shrink-0 shadow"
                    >
                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        className="w-4 h-4 rounded-full object-cover border border-amber-400/60"
                      />
                      <span className="text-[10px] font-bold text-amber-100 truncate max-w-[80px]">
                        {p.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW B: ACTIVE RAID BOSS BATTLE ARENA
  // -------------------------------------------------------------
  return (
    <div 
      id="pokemon-go-raid-screen" 
      data-no-swipe="true"
      className="w-full max-w-full h-full flex flex-col bg-gradient-to-b from-[#1c120c] via-[#101b2b] to-[#070c14] text-amber-100 overflow-hidden relative select-none no-swipe"
    >
      {/* Atmospheric Pirate Ocean Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(180,83,9,0.18)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      {/* Top Header Navigation Bar */}
      {openServerModal && (
        <div className="relative z-30 px-3 py-1.5 flex items-center justify-end bg-[#1c120c]/90 backdrop-blur-md border-b border-[#8b5a2b]/40 flex-shrink-0">
          <button
            id="switch-server-btn"
            onClick={() => {
              soundFx.playClick();
              openServerModal();
            }}
            className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 border border-sky-400 text-white rounded text-[9px] font-bold active:scale-95 transition-all flex items-center gap-1"
          >
            <Globe size={10} /> {t("switch_server")}
          </button>
        </div>
      )}

      {/* MAIN RAID STAGE */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden relative z-10 px-2.5 sm:px-3 pt-1.5 pb-2 min-w-0">
        
        {/* 1. TOP FLOATING BOSS HUD */}
        <div className="w-full bg-gradient-to-b from-[#2b1d19] via-[#211613] to-[#170e0c] border-2 border-[#b45309] rounded-xl p-2 shadow-lg backdrop-blur-md relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Boss Name */}
          <div className="flex items-center justify-between gap-1.5">
            <h1 className="text-sm sm:text-base font-black text-[#fde68a] uppercase tracking-wider drop-shadow-md flex items-center gap-1 truncate font-serif">
              <span className="truncate">{currentMonster.name}</span>
            </h1>
          </div>

          {/* {t("boss_hp")} Gauge with 5 Milestone Bounties + Final Bounty */}
          <div className="mt-1 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] sm:text-xs font-black leading-none">
              <span className="text-rose-400 flex items-center gap-1">
                <Flame size={13} className="text-rose-500" /> {t("boss_hp")}
              </span>
              <div className="flex items-center gap-2">
                {availableToClaimCount > 0 && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setShowBountiesModal(true);
                    }}
                    className="px-2 py-0.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-stone-950 font-black text-[9px] uppercase rounded-full animate-bounce shadow-md flex items-center gap-1"
                  >
                    <Gift size={11} /> {availableToClaimCount} REWARD READY!
                  </button>
                )}
                <span className="text-amber-100 font-mono tracking-tight font-bold">
                  {currentRaidState.currentHp.toLocaleString()} / {currentRaidState.maxHp.toLocaleString()} <span className="text-yellow-400 font-black">({hpPercent.toFixed(1)}%)</span>
                </span>
              </div>
            </div>

            {/* Interactive HP Bar with Pinned Bounties */}
            <div className="relative pt-3 pb-6 px-3 select-none">
              {/* Background Bar Track */}
              <div className="w-full h-5 sm:h-6 bg-[#120a08] rounded-full border-2 border-[#8b5a2b] overflow-hidden relative shadow-inner">
                <motion.div
                  className={`h-full rounded-full ${
                    hpPercent <= 25
                      ? 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-400 animate-pulse'
                      : hpPercent <= 60
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300'
                  }`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${hpPercent}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>

              {/* 5 Milestone Bounties + Final Bounty Pins along the HP Bar */}
              <div className="absolute inset-0 flex items-center pointer-events-none px-3">
                <div className="relative w-full h-full flex items-center">
                  {allBounties.map((bounty) => {
                    const isPassedBeforeJoin = joinedHpPercent !== undefined && bounty.hpThresholdPercent >= joinedHpPercent;
                    const isReached = hpPercent <= bounty.hpThresholdPercent;
                    const isClaimed = bounty.isFinal 
                      ? currentRaidState.dailyPrizeClaimed 
                      : claimedMilestones.includes(bounty.hpThresholdPercent);
                    const isReady = isReached && !isClaimed && userDamage > 0 && !isPassedBeforeJoin;
                    const posPercent = bounty.hpThresholdPercent; // 80, 60, 40, 20, 10, 0

                    return (
                      <div
                        key={bounty.id}
                        style={{ left: `${posPercent}%` }}
                        className="absolute -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer z-10 p-1 -m-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFx.playClick();
                          setSelectedMilestonePreview(bounty);
                        }}
                      >
                        {/* Marker Pin Icon with touch area */}
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center text-sm sm:text-base shadow-xl transition-transform active:scale-90 ${
                            isClaimed
                              ? 'bg-emerald-950 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/50'
                              : isReady
                              ? 'bg-gradient-to-b from-amber-400 via-yellow-300 to-amber-600 border-yellow-200 text-stone-950 ring-2 ring-yellow-400 animate-bounce scale-110 shadow-[0_0_16px_rgba(245,158,11,0.95)]'
                              : isPassedBeforeJoin
                              ? 'bg-stone-950/90 border-stone-800 text-stone-600 opacity-60'
                              : isReached
                              ? 'bg-[#2b1d19] border-amber-400 text-amber-200 shadow-md'
                              : 'bg-[#170e0c]/95 border-stone-600 text-stone-400 opacity-85 active:opacity-100'
                          }`}
                        >
                          {isClaimed ? (
                            <CheckCircle2 size={16} className="text-emerald-300" />
                          ) : isPassedBeforeJoin ? (
                            <Lock size={14} className="text-stone-600" />
                          ) : (
                            <span className="leading-none">{bounty.icon}</span>
                          )}
                        </div>

                        {/* Threshold Tag underneath pin */}
                        <span
                          className={`text-[8px] sm:text-[9px] font-black font-mono px-1.5 py-0.5 rounded mt-1 tracking-tight whitespace-nowrap leading-none shadow-md ${
                            isClaimed
                              ? 'text-emerald-400 bg-emerald-950/95 border border-emerald-500/50'
                              : isReady
                              ? 'text-stone-950 bg-yellow-400 font-bold uppercase animate-pulse font-serif border border-yellow-200'
                              : isPassedBeforeJoin
                              ? 'text-stone-500 bg-stone-950/95 border border-stone-800'
                              : isReached
                              ? 'text-amber-300 bg-black/90 border border-amber-500/50'
                              : 'text-stone-400 bg-black/80 border border-stone-700'
                          }`}
                        >
                          {isReady ? t("claim_upper", "CLAIM!") : isPassedBeforeJoin ? t("missed_upper", "MISSED") : bounty.isFinal ? t("final_upper", "FINAL") : `${bounty.hpThresholdPercent}%`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. CENTER MASSIVE BOSS VISUAL ARENA */}
        <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center my-1 py-0.5 overflow-hidden">
          
          {/* Circular Battle Ring / 3D Pedestal */}
          <div className="absolute bottom-1 sm:bottom-2 w-52 sm:w-64 h-12 sm:h-16 flex items-center justify-center pointer-events-none">
            <div 
              className="absolute inset-0 rounded-[100%] border-2 border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.35)] animate-pulse"
              style={{ transform: 'rotateX(68deg)' }}
            />
            <div 
              className="absolute inset-1.5 rounded-[100%] border border-[#b45309] bg-amber-950/40 shadow-inner"
              style={{ transform: 'rotateX(68deg)' }}
            />
            <div 
              className="w-24 h-6 rounded-[100%] bg-gradient-to-r from-amber-500/30 via-yellow-400/30 to-amber-500/30 blur-md"
              style={{ transform: 'rotateX(68deg)' }}
            />
          </div>

          {/* Imposing Boss Model */}
          <motion.div
            animate={{
              y: [0, -6, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="relative z-20 h-full max-h-[150px] sm:max-h-[210px] w-full flex items-center justify-center drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)]"
          >
            <img
              src={monsterImg}
              alt={currentMonster.name}
              className={`h-full max-h-full max-w-[85%] object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,1)] transition-all duration-500 ${
                currentRaidState.isDefeated ? 'grayscale opacity-60' : ''
              }`}
            />

            {/* Floating Damage Strikes Numbers */}
            <AnimatePresence>
              {floatingDamages.map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 1, y: 0, scale: f.isCritical ? 1.4 : 1 }}
                  animate={{ opacity: 0, y: -60, scale: f.isCritical ? 1.6 : 1.1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  style={{ left: `calc(50% + ${f.x}px)`, top: `calc(35% + ${f.y}px)` }}
                  className={`absolute z-40 font-black pointer-events-none whitespace-nowrap drop-shadow-[0_3px_6px_rgba(0,0,0,1)] ${
                    f.isCritical
                      ? 'text-yellow-300 text-lg sm:text-xl font-serif'
                      : 'text-rose-400 text-sm sm:text-base font-mono'
                  }`}
                >
                  {f.isCritical ? `⚡ CRIT -${f.damage} HP!` : `-${f.damage} HP`}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Boss Defeated Victory Shield Overlay */}
          {currentRaidState.isDefeated && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 rounded-2xl flex flex-col items-center justify-center p-3 text-center border-2 border-yellow-400/80 shadow-2xl"
            >
              <Crown size={32} className="text-yellow-400 animate-bounce mb-0.5" />
              <span className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-widest font-serif">
                {t("raid_boss_defeated")}
              </span>
              <p className="text-[10px] text-white/80 max-w-xs mt-0.5">
                Your server fleet conquered {currentMonster.shortName}! The sealed mystery bounty is unlocked.
              </p>
              {!currentRaidState.dailyPrizeClaimed ? (
                userDamage > 0 ? (
                  <button
                    id="claim-revealed-bounty-btn"
                    onClick={handleClaim}
                    className="mt-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-stone-950 font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-xl shadow border border-yellow-200 active:scale-95 transition-all flex items-center gap-1.5 animate-pulse font-serif cursor-pointer"
                  >
                    <Gift size={13} /> Unseal Mystery Bounty ({userDamagePercent.toFixed(1)}% Share)
                  </button>
                ) : (
                  <div className="mt-2 px-3 py-1.5 bg-stone-900/90 border border-stone-700 rounded-xl text-stone-400 text-[10px] font-bold">
                    {t("no_participation")}
                  </div>
                )
              ) : (
                <div className="mt-1.5 px-2.5 py-0.5 bg-emerald-950/90 border border-emerald-500 rounded-lg text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 size={11} /> {t("bounty_claimed")}
                </div>
              )}
            </motion.div>
          )}

          {/* Monster Leaves Countdown Badge (Left) */}
          <div className="absolute top-0 left-1 z-20 flex items-center gap-1.5 px-2.5 py-0.5 bg-[#2b1d19]/95 backdrop-blur-md rounded-full border border-amber-400/60 text-[9.5px] font-bold text-amber-300 shadow-md">
            <Clock size={10} className="text-amber-400 flex-shrink-0 animate-pulse" />
            <span className="text-amber-200/80">{t("raid_ends_in", "Leaves in")}:</span>
            <span className="font-mono font-black text-yellow-300 tracking-tight">{timeRemaining}</span>
            <span className="text-[8.5px] font-mono text-amber-400/80 bg-black/40 px-1 py-0.2 rounded border border-amber-500/30">UTC+7</span>
          </div>

          {/* Active Captains Badge (Right) */}
          <div className="absolute top-0 right-1 z-20 flex items-center gap-1 px-2.5 py-0.5 bg-[#2b1d19]/90 backdrop-blur-md rounded-full border border-[#8b5a2b] text-[9px] font-bold text-amber-200 shadow">
            <Users size={10} className="text-sky-400" />
            <span>{currentRaidState.participants.length} {t("in_battle", "In Battle")}</span>
          </div>


        </div>

        {/* 3. BOTTOM HUD SECTION */}
        <div className="w-full flex flex-col gap-1.5 flex-shrink-0 relative z-20">
          
          {/* THE 3 HERO STAT CARDS */}
          <div className="grid grid-cols-3 gap-1.5 w-full">
            
            {/* 1. YOUR DEALT DAMAGE (TAP TO VIEW DETAILS) */}
            <button 
              type="button"
              id="stat-your-damage"
              onClick={() => {
                soundFx.playClick();
                setShowYourDamageModal(true);
              }}
              className="bg-gradient-to-b from-[#3d1808] via-[#2c1206] to-[#1e0a03] hover:from-[#4d200b] hover:to-[#280e04] border-2 border-amber-500 hover:border-amber-400 rounded-xl p-1.5 flex flex-col items-center justify-center shadow-md relative overflow-hidden group min-w-0 cursor-pointer active:scale-95 transition-all"
            >
              <div className="flex items-center gap-0.5 mb-0.5">
                <Footprints size={10} className="text-amber-300 flex-shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-200 truncate font-serif">
                  {t("your_damage")}
                </span>
              </div>

              <div className="text-xs sm:text-sm font-black font-mono text-white drop-shadow tracking-tight my-0.5 text-center leading-none truncate w-full">
                {userDamage.toLocaleString()} <span className="text-[8px] sm:text-[9px] text-amber-300 font-serif">{t("hp")}</span>
              </div>
            </button>

            {/* 2. {t("damage_share")} (TAP TO VIEW UPCOMING MILESTONE REWARD) */}
            <button 
              type="button"
              id="stat-damage-share"
              onClick={() => {
                soundFx.playClick();
                setShowDamageShareModal(true);
              }}
              className="bg-gradient-to-b from-[#064e3b] via-[#047857] to-[#022c22] hover:from-[#065f46] hover:to-[#03362a] border-2 border-emerald-400 hover:border-emerald-300 rounded-xl p-1.5 flex flex-col items-center justify-between shadow-md relative overflow-hidden group min-w-0 cursor-pointer active:scale-95 transition-all"
            >
              <div className="flex items-center gap-0.5 mb-0.5">
                <Flame size={10} className="text-emerald-300 flex-shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-200 truncate font-serif">
                  {t("damage_share")}
                </span>
              </div>

              <div className="text-xs sm:text-sm font-black font-mono text-emerald-300 drop-shadow tracking-tight my-0.5 text-center leading-none truncate w-full">
                {userDamagePercent.toFixed(1)}%
              </div>

              <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden border border-emerald-500/40">
                <div 
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, userDamagePercent)}%` }}
                />
              </div>
            </button>

            {/* 3. {t("server_rank")} (TAP TO VIEW RANKINGS) */}
            <button 
              type="button"
              id="stat-server-rank"
              onClick={() => {
                soundFx.playClick();
                setShowLeaderboard(true);
              }}
              className="bg-gradient-to-b from-[#5c2a07] via-[#451e04] to-[#2e1302] hover:from-[#6e3309] hover:to-[#381703] border-2 border-yellow-400 hover:border-yellow-300 rounded-xl p-1.5 flex flex-col items-center justify-center shadow-md relative overflow-hidden group min-w-0 cursor-pointer active:scale-95 transition-all text-left"
            >
              <div className="flex items-center gap-0.5 mb-0.5">
                <Trophy size={10} className="text-yellow-300 flex-shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-yellow-200 truncate font-serif">
                  {t("server_rank")}
                </span>
              </div>

              <div className="text-xs sm:text-sm font-black font-mono text-yellow-300 drop-shadow tracking-tight my-0.5 text-center leading-none truncate w-full">
                #{userRankIndex > 0 ? userRankIndex : '-'}
              </div>
            </button>

          </div>

        </div>

      </div>

      {/* FIRMLY ANCHORED LEADERBOARD RANKINGS PANEL */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            data-no-swipe="true"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-0 z-40 bg-[#170e0c]/95 backdrop-blur-xl flex flex-col p-3 select-none no-swipe"
          >
            {/* Panel Top Header Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-[#8b5a2b]/50 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center flex-shrink-0">
                  <Trophy size={14} className="text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-[#fde68a] uppercase tracking-wider truncate font-serif">
                    {t("fleet_damage_rankings")}
                  </h3>
                  <p className="text-[9px] text-amber-300/80 truncate">
                    {currentServer.name} • {sortedParticipants.length} Captains
                  </p>
                </div>
              </div>

              <button
                id="close-raid-rankings-btn"
                onClick={() => {
                  soundFx.playClick();
                  setShowLeaderboard(false);
                }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold flex items-center justify-center text-xs active:scale-95 transition-all flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {/* User's Standout Rank Banner */}
            <div className="my-2 p-2.5 bg-gradient-to-r from-[#3d1808] via-[#2c1206] to-[#3d1808] border-2 border-amber-400 rounded-xl flex items-center justify-between shadow flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-gradient-to-b from-yellow-300 to-amber-600 text-stone-950 font-black text-[10px] flex items-center justify-center flex-shrink-0">
                  #{userRankIndex > 0 ? userRankIndex : '-'}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black text-amber-200 uppercase tracking-wide flex items-center gap-1 font-serif">
                    <span>{t("your_performance")}</span>
                    <span className="px-1 py-0.2 bg-amber-400 text-stone-950 text-[7px] font-black uppercase rounded">{t("you").toUpperCase()}</span>
                  </div>
                  <div className="text-[8px] text-amber-300/80 font-sans">
                    {userDamage.toLocaleString()} Steps • {userDamagePercent.toFixed(1)}% Share
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-xs font-black text-rose-300 font-mono">
                  {userDamage.toLocaleString()} HP
                </div>
              </div>
            </div>

            {/* Scrollable Rankings List */}
            <div 
              data-no-swipe="true"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0 no-swipe"
            >
              {sortedParticipants.map((p, index) => {
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;
                const pct = totalDamageDealt > 0 ? ((p.damage / totalDamageDealt) * 100) : 0;

                return (
                  <div
                    key={p.id}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      p.isUser
                        ? 'bg-gradient-to-r from-[#3d1808]/90 via-[#2c1206]/90 to-[#3d1808]/90 border-amber-400 shadow ring-1 ring-amber-400/50'
                        : 'bg-[#120a08]/80 border-[#8b5a2b]/40 hover:border-[#8b5a2b]'
                    }`}
                  >
                    {/* Rank Medal & Avatar */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0 ${
                        isTop1
                          ? 'bg-gradient-to-b from-yellow-300 to-amber-600 text-stone-950 shadow'
                          : isTop2
                          ? 'bg-gradient-to-b from-slate-200 to-slate-400 text-stone-950'
                          : isTop3
                          ? 'bg-gradient-to-b from-amber-700 to-amber-900 text-amber-100'
                          : 'bg-white/10 text-white/70'
                      }`}>
                        {index + 1}
                      </div>

                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        className="w-8 h-8 rounded-lg object-cover border border-[#8b5a2b] shadow flex-shrink-0"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={`text-[11px] font-black truncate ${p.isUser ? 'text-amber-300 font-serif' : 'text-stone-200'}`}>
                            {p.name}
                          </span>
                          {p.isUser && (
                            <span className="px-1 py-0.2 bg-amber-400 text-stone-950 text-[7px] font-black uppercase rounded flex-shrink-0">{t("you").toUpperCase()}</span>
                          )}
                        </div>
                        <div className="text-[8px] text-stone-400 truncate">{p.title}</div>
                      </div>
                    </div>

                    {/* Output Numbers */}
                    <div className="flex flex-col items-end whitespace-nowrap flex-shrink-0">
                      <div className="text-xs font-black text-rose-400 font-mono">
                        {p.damage.toLocaleString()} HP
                      </div>
                      <div className="text-[8px] text-emerald-400 font-bold">
                        {pct.toFixed(1)}% Share
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. ALL 6 BOUNTIES (5 MILESTONES + FINAL) OVERVIEW MODAL */}
      <AnimatePresence>
        {showBountiesModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            data-no-swipe="true"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 no-swipe"
          >
            <div className="w-full max-w-sm max-h-[90vh] bg-gradient-to-b from-[#2b1d19] via-[#211613] to-[#120a08] border-2 border-amber-500/80 rounded-2xl p-3.5 shadow-2xl flex flex-col relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#8b5a2b]/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
                    <Crown size={16} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[#fde68a] uppercase tracking-wider font-serif">
                      {t("raid_milestone_rewards")}
                    </h3>
                    <p className="text-[9px] text-amber-200/70">
                      {t("stage_milestones")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setShowBountiesModal(false);
                  }}
                  className="w-6 h-6 rounded-full bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center border border-stone-600"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Boss Current Health & User Share Indicator */}
              <div className="bg-[#170e0c] border border-amber-500/30 rounded-xl p-2 my-2 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1.5 font-bold text-amber-200">
                    <Flame size={12} className="text-rose-400" />
                    <span>{t("boss_hp_label")}</span>
                    <span className="text-amber-100 font-mono font-black">{hpPercent.toFixed(1)}%</span>
                  </div>
                  <div className="text-stone-300 font-mono text-[9px]">
                    {t("your_dmg")} <span className="text-emerald-400 font-bold">{userDamage.toLocaleString()} HP</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px] pt-1 border-t border-white/5">
                  <span className="text-amber-200/80 font-bold">{t("your_reward_share")}</span>
                  <span className="font-mono font-black text-yellow-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                    {userDamage > 0 ? `${userDamagePercent.toFixed(1)}% of Pools` : '0% (Deal damage to earn share)'}
                  </span>
                </div>
              </div>

              {/* Bounties List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[50vh]">
                {allBounties.map((bounty, idx) => {
                  const isPassedBeforeJoin = joinedHpPercent !== undefined && bounty.hpThresholdPercent >= joinedHpPercent;
                  const isReached = hpPercent <= bounty.hpThresholdPercent;
                  const isClaimed = bounty.isFinal 
                    ? currentRaidState.dailyPrizeClaimed 
                    : claimedMilestones.includes(bounty.hpThresholdPercent);
                  const isReady = isReached && !isClaimed && userDamage > 0 && !isPassedBeforeJoin;
                  const rewardShare = getBountyRewardShare(bounty);

                  return (
                    <div
                      key={bounty.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isClaimed
                          ? 'bg-emerald-950/40 border-emerald-500/40 opacity-80'
                          : isReady
                          ? 'bg-gradient-to-r from-amber-950/70 via-[#2f1f13] to-amber-950/70 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : isPassedBeforeJoin
                          ? 'bg-[#120a08]/80 border-stone-800/80 opacity-60'
                          : isReached
                          ? 'bg-[#1a120e] border-amber-500/30'
                          : 'bg-[#150d0b] border-stone-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base border flex-shrink-0 ${
                            isClaimed
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                              : isReady
                              ? 'bg-amber-500/30 border-amber-400 text-yellow-300 animate-pulse'
                              : isPassedBeforeJoin
                              ? 'bg-stone-900 border-stone-800 text-stone-600'
                              : 'bg-stone-900 border-stone-700 text-stone-400'
                          }`}>
                            {isClaimed ? <CheckCircle2 size={18} className="text-emerald-400" /> : isPassedBeforeJoin ? <Lock size={16} className="text-stone-600" /> : bounty.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black text-amber-100 font-serif">
                                {bounty.isFinal ? t("final_victory_caps", "🏆 FINAL VICTORY") : t("milestone_hash", "MILESTONE #{num}").replace("{num}", (idx + 1).toString())}
                              </span>
                              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                isPassedBeforeJoin
                                  ? 'bg-stone-900 text-stone-500 border border-stone-800'
                                  : isReached 
                                  ? 'bg-amber-500/20 text-amber-300' 
                                  : 'bg-stone-800 text-stone-400'
                              }`}>
                                {bounty.isFinal ? '0% HP' : `${bounty.hpThresholdPercent}% HP`}
                              </span>
                            </div>
                            <div className="text-[8px] text-stone-400 leading-tight mt-0.5">
                              {isPassedBeforeJoin ? (
                                <span className="text-stone-500 font-medium">{t("reached_before_joined").replace("{percent}", joinedHpPercent.toFixed(0))}</span>
                              ) : bounty.isFinal ? (
                                t("boss_defeated_0hp", "Boss is defeated (0% HP)")
                              ) : (
                                t("drops_to_percent", "{t('boss_hp')} drops to {percent}%").replace("{t('boss_hp')}", t("boss_hp")).replace("{percent}", bounty.hpThresholdPercent.toString())
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Claim / Status Action Button */}
                        <div className="flex flex-col items-end flex-shrink-0">
                          {isClaimed ? (
                            <span className="px-2 py-1 bg-emerald-950 border border-emerald-500/60 rounded-lg text-[8px] font-bold text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 size={10} />{t("claimed")}</span>
                          ) : isReady ? (
                            <button
                              onClick={() => {
                                if (bounty.isFinal) {
                                  setShowBountiesModal(false);
                                  handleClaim();
                                } else {
                                  handleClaimMilestone(bounty.hpThresholdPercent);
                                }
                              }}
                              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-stone-950 font-black text-[9px] uppercase tracking-wider rounded-lg shadow-md active:scale-95 transition-all animate-bounce font-serif flex items-center gap-1"
                            >
                              <Gift size={10} />{t("claim_excl")}</button>
                          ) : isPassedBeforeJoin ? (
                            <span className="px-2 py-0.5 bg-stone-900 border border-stone-800 text-[8px] font-bold text-stone-500 rounded flex items-center gap-1">
                              <Lock size={8} />{t("missed")}</span>
                          ) : isReached && userDamage <= 0 ? (
                            <span className="px-1.5 py-0.5 bg-rose-950/60 border border-rose-600/40 text-[7px] font-bold text-rose-300 rounded text-center">{t("deal_dmg_first")}</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-stone-900 border border-stone-700 text-[8px] font-bold text-stone-400 rounded flex items-center gap-1">
                              <Lock size={9} />{t("locked")}</span>
                          )}
                        </div>
                      </div>

                      {/* What User Will Get based on damage share % */}
                      <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[8px] text-stone-400">
                          <span className={`${isPassedBeforeJoin ? 'text-stone-500' : 'text-amber-200/90'} font-bold`}>
                            {isPassedBeforeJoin 
                              ? t("your_share_0_reached", "Your Share: 0% (Reached before joining)") 
                              : t("your_share_percent", "Your Share ({percent}):").replace("{percent}", rewardShare.hasDamage ? `${rewardShare.percent}%` : "0%")}
                          </span>
                          <span className="text-stone-500">
                            Pool: {bounty.coins.toLocaleString()} 🪙 • {bounty.gems} 💎
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className={`bg-[#120a08]/80 border ${isPassedBeforeJoin ? 'border-stone-800 text-stone-600' : 'border-amber-500/30'} rounded-lg px-2 py-1 flex items-center justify-between`}>
                            <div className="flex items-center gap-1">
                              <span className={`text-xs ${isPassedBeforeJoin ? 'grayscale opacity-40' : ''}`}>🪙</span>
                              <span className="text-[7px] uppercase font-bold text-stone-400">{t("coins")}</span>
                            </div>
                            <span className={`text-[10px] font-mono font-black ${isPassedBeforeJoin ? 'text-stone-600' : 'text-amber-300'}`}>
                              +{rewardShare.coins.toLocaleString()}
                            </span>
                          </div>
                          <div className={`bg-[#120a08]/80 border ${isPassedBeforeJoin ? 'border-stone-800 text-stone-600' : 'border-cyan-500/30'} rounded-lg px-2 py-1 flex items-center justify-between`}>
                            <div className="flex items-center gap-1">
                              <span className={`text-xs ${isPassedBeforeJoin ? 'grayscale opacity-40' : ''}`}>💎</span>
                              <span className="text-[7px] uppercase font-bold text-stone-400">{t("gems")}</span>
                            </div>
                            <span className={`text-[10px] font-mono font-black ${isPassedBeforeJoin ? 'text-stone-600' : 'text-cyan-300'}`}>
                              +{rewardShare.gems.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-[#8b5a2b]/30 mt-2">
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setShowBountiesModal(false);
                  }}
                  className="w-full py-2 bg-[#2b1d19] hover:bg-[#382620] border border-amber-500/50 text-amber-200 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all font-serif"
                >{t("close")}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MILESTONE CELEBRATORY CLAIM DIALOG */}
      <AnimatePresence>
        {milestoneClaimResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            data-no-swipe="true"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 no-swipe"
          >
            <div className="w-full max-w-xs bg-gradient-to-b from-[#2b1d19] via-[#211613] to-[#120a08] border-2 border-amber-400 rounded-2xl p-4 shadow-[0_0_40px_rgba(245,158,11,0.5)] flex flex-col items-center text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-1.5 shadow-inner">
                <span className="text-2xl animate-bounce">{milestoneClaimResult.bounty.icon}</span>
              </div>
              
              <h3 className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-widest font-serif">{t("reward_claimed_excl")}</h3>
              
              <p className="text-[10px] text-amber-100/90 font-bold mt-0.5">
                {milestoneClaimResult.bounty.hpThresholdPercent}% {t("boss_hp")} Milestone Reached
              </p>

              <div className="mt-1 px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-[9px] font-bold text-yellow-300">
                Earned {milestoneClaimResult.percent}% Share of Pool
              </div>

              <div className="grid grid-cols-2 gap-1.5 w-full my-3">
                <div className="bg-[#120a08] border border-yellow-500/40 rounded-xl p-2 flex flex-col items-center">
                  <span className="text-lg mb-0.5">🪙</span>
                  <span className="text-[8px] uppercase font-bold text-amber-200/60">{t("gold_coins")}</span>
                  <span className="text-xs font-black text-amber-300 font-mono">
                    +{milestoneClaimResult.coinsWon.toLocaleString()}
                  </span>
                </div>
                <div className="bg-[#120a08] border border-cyan-500/40 rounded-xl p-2 flex flex-col items-center">
                  <span className="text-lg mb-0.5">💎</span>
                  <span className="text-[8px] uppercase font-bold text-cyan-200/60">{t("gems")}</span>
                  <span className="text-xs font-black text-cyan-300 font-mono">
                    +{milestoneClaimResult.gemsWon.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMilestoneClaimResult(null)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border border-yellow-200 active:scale-95 transition-all font-serif"
              >{t("collect_rewards")}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MOBILE-OPTIMIZED MILESTONE REWARD CARD (TAP ON PIN) */}
      <AnimatePresence>
        {selectedMilestonePreview && (() => {
          const previewShare = getBountyRewardShare(selectedMilestonePreview);
          const isPassedBeforeJoin = joinedHpPercent !== undefined && selectedMilestonePreview.hpThresholdPercent >= joinedHpPercent;
          return (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              data-no-swipe="true"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 no-swipe"
            >
              <div className="w-full max-w-xs bg-gradient-to-b from-[#2b1d19] via-[#211613] to-[#120a08] border-2 border-amber-500/90 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col items-center text-center relative">
                
                {/* Close Button top right */}
                <button
                  onClick={() => setSelectedMilestonePreview(null)}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center border border-stone-600"
                >
                  <X size={13} />
                </button>

                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-1 text-2xl shadow-inner ${
                  isPassedBeforeJoin 
                    ? 'bg-stone-900 border-stone-800 text-stone-600' 
                    : 'bg-amber-500/20 border-amber-400/60'
                }`}>
                  {isPassedBeforeJoin ? <Lock size={20} className="text-stone-500" /> : selectedMilestonePreview.icon}
                </div>

                <h4 className="text-xs font-black text-amber-200 uppercase tracking-wider font-serif mt-1">
                  {selectedMilestonePreview.isFinal ? t("final_victory_reward", "🏆 Final Victory Reward") : t("hp_milestone", "🎯 {percent}% {t('boss_hp')} Milestone").replace("{percent}", selectedMilestonePreview.hpThresholdPercent.toString()).replace("{t('boss_hp')}", t("boss_hp"))}
                </h4>

                <p className="text-[9px] text-amber-100/70 mt-0.5 mb-2">
                  {isPassedBeforeJoin ? (
                    <span className="text-stone-400 font-medium">{t("reached_before_joined_battle").replace("{percent}", joinedHpPercent.toFixed(0))}</span>
                  ) : selectedMilestonePreview.isFinal ? (
                    t("shared_proportional", "Shared proportional to total damage dealt")
                  ) : (
                    t("unlocked_when_drops", "Unlocked when {t('boss_hp')} drops to {percent}%").replace("{t('boss_hp')}", t("boss_hp")).replace("{percent}", selectedMilestonePreview.hpThresholdPercent.toString())
                  )}
                </p>

                {/* User Share Info */}
                <div className="w-full bg-[#170e0c] border border-amber-500/30 rounded-xl px-2.5 py-1.5 mb-2 flex items-center justify-between text-[9px]">
                  <span className="text-amber-200/80 font-bold">{t("your_damage_share")}</span>
                  <span className="font-mono font-black text-yellow-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                    {isPassedBeforeJoin 
                      ? t("zero_percent_reached_before", "0% (Reached before joining)") 
                      : previewShare.hasDamage 
                      ? t("percent_of_pool", "{percent}% of Pool").replace("{percent}", previewShare.percent.toString()) 
                      : t("zero_percent_no_damage", "0% (No damage dealt)")}
                  </span>
                </div>

                {/* What user will get based on damage share % */}
                <div className="grid grid-cols-2 gap-2 w-full my-1">
                  <div className={`bg-[#120a08] border ${isPassedBeforeJoin ? 'border-stone-800 text-stone-600' : 'border-amber-500/40'} rounded-xl p-2 flex flex-col items-center`}>
                    <span className={`text-base mb-0.5 ${isPassedBeforeJoin ? 'grayscale opacity-40' : ''}`}>🪙</span>
                    <span className="text-[8px] uppercase font-bold text-stone-400">{t("your_coins")}</span>
                    <span className={`text-xs font-mono font-black ${isPassedBeforeJoin ? 'text-stone-600' : 'text-amber-300'}`}>
                      +{previewShare.coins.toLocaleString()}
                    </span>
                    <span className="text-[7px] text-stone-500 mt-0.5">
                      Pool: {selectedMilestonePreview.coins.toLocaleString()}
                    </span>
                  </div>
                  <div className={`bg-[#120a08] border ${isPassedBeforeJoin ? 'border-stone-800 text-stone-600' : 'border-cyan-500/40'} rounded-xl p-2 flex flex-col items-center`}>
                    <span className={`text-base mb-0.5 ${isPassedBeforeJoin ? 'grayscale opacity-40' : ''}`}>💎</span>
                    <span className="text-[8px] uppercase font-bold text-stone-400">{t("your_gems")}</span>
                    <span className={`text-xs font-mono font-black ${isPassedBeforeJoin ? 'text-stone-600' : 'text-cyan-300'}`}>
                      +{previewShare.gems}
                    </span>
                    <span className="text-[7px] text-stone-500 mt-0.5">
                      Pool: {selectedMilestonePreview.gems}
                    </span>
                  </div>
                </div>

                {/* Status Note */}
                <div className="text-[9px] text-stone-300 my-2">
                  {isPassedBeforeJoin ? (
                    <span className="text-stone-400 font-medium">
                      ⚠️ Reached by the armada before you joined (at {joinedHpPercent.toFixed(0)}% HP). Deal damage to claim upcoming milestones!
                    </span>
                  ) : hpPercent <= selectedMilestonePreview.hpThresholdPercent ? (
                    (selectedMilestonePreview.isFinal ? currentRaidState.dailyPrizeClaimed : claimedMilestones.includes(selectedMilestonePreview.hpThresholdPercent)) ? (
                      <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 size={12} />{t("reward_already_claimed")}</span>
                    ) : userDamage > 0 ? (
                      <span className="text-yellow-300 font-bold animate-pulse">
                        ✨ Milestone reached! Ready to collect your {previewShare.percent}% share.
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold">
                        {t("deal_at_least_1_hp", "Deal at least 1 HP damage in battle to claim!")}
                      </span>
                    )
                  ) : (
                    <span className="text-stone-400">
                      {t("boss_hp")}: <strong className="text-amber-200">{hpPercent.toFixed(1)}%</strong> {t("need_paren")} <strong className="text-yellow-300">{selectedMilestonePreview.hpThresholdPercent}%</strong>)
                    </span>
                  )}
                </div>

                {/* Action Button */}
                <div className="w-full mt-1">
                  {(() => {
                    const isReached = hpPercent <= selectedMilestonePreview.hpThresholdPercent;
                    const isClaimed = selectedMilestonePreview.isFinal 
                      ? currentRaidState.dailyPrizeClaimed 
                      : claimedMilestones.includes(selectedMilestonePreview.hpThresholdPercent);
                    const isClaimable = isReached && !isClaimed && userDamage > 0 && !isPassedBeforeJoin;

                    if (isClaimable) {
                      return (
                        <button
                          onClick={() => {
                            const bounty = selectedMilestonePreview;
                            setSelectedMilestonePreview(null);
                            if (bounty.isFinal) {
                              handleClaim();
                            } else {
                              handleClaimMilestone(bounty.hpThresholdPercent);
                            }
                          }}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl font-serif shadow-lg active:scale-95 animate-bounce cursor-pointer flex items-center justify-center gap-1.5 border border-yellow-200"
                        >
                          <Gift size={14} />{t("claim")}</button>
                      );
                    }

                    return (
                      <button
                        disabled
                        className="w-full py-2.5 bg-[#25201e] border border-stone-700/60 text-stone-500 font-black text-xs uppercase tracking-wider rounded-xl font-serif cursor-not-allowed flex items-center justify-center gap-1.5 opacity-70"
                      >
                        <Lock size={12} /> {isPassedBeforeJoin ? t("missed_joined_at", "Missed (Joined at {percent}% HP)").replace("{percent}", joinedHpPercent.toFixed(0)) : isClaimed ? t("claimed", "Claimed") : t("claim", "Claim")}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* 4. FINAL GRAND BOUNTY UNLOCKED DIALOG */}
      <AnimatePresence>
        {claimResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            data-no-swipe="true"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 no-swipe"
          >
            <div className="w-full max-w-xs bg-gradient-to-b from-[#2b1d19] via-[#211613] to-[#120a08] border-2 border-amber-400 rounded-2xl p-4 shadow-[0_0_40px_rgba(245,158,11,0.5)] flex flex-col items-center text-center relative">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-1 shadow-inner">
                <Crown size={24} className="text-yellow-400 animate-bounce" />
              </div>
              
              <h3 className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-widest font-serif">{t("final_boss_reward_claimed")}</h3>
              
              <p className="text-[10px] text-amber-100/80 mt-0.5">{t("you_contributed")}<span className="text-emerald-400 font-bold">{claimResult.percent}%</span> of server damage against {currentMonster.shortName}!
              </p>

              <div className="grid grid-cols-2 gap-1.5 w-full my-2.5">
                <div className="bg-[#120a08] border border-yellow-500/40 rounded-xl p-1.5 flex flex-col items-center">
                  <span className="text-base mb-0.5">🪙</span>
                  <span className="text-[8px] uppercase font-bold text-amber-200/60">{t("gold_coins")}</span>
                  <span className="text-xs font-black text-amber-300 font-mono">
                    +{claimResult.coinsWon.toLocaleString()}
                  </span>
                </div>
                <div className="bg-[#120a08] border border-cyan-500/40 rounded-xl p-1.5 flex flex-col items-center">
                  <span className="text-base mb-0.5">💎</span>
                  <span className="text-[8px] uppercase font-bold text-cyan-200/60">{t("gems")}</span>
                  <span className="text-xs font-black text-cyan-300 font-mono">
                    +{claimResult.gemsWon.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setClaimResult(null)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border border-yellow-200 active:scale-95 transition-all font-serif"
              >{t("collect_final_reward")}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. {t("your_damage")} MODAL (1 WALK STEP = 1 HP) */}
      <AnimatePresence>
        {showYourDamageModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            data-no-swipe="true"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 no-swipe"
          >
            <div className="w-full max-w-xs bg-gradient-to-b from-[#2b1d19] via-[#211613] to-[#120a08] border-2 border-amber-500 rounded-2xl p-4 shadow-[0_0_35px_rgba(245,158,11,0.4)] flex flex-col items-center text-center relative">
              <button
                onClick={() => setShowYourDamageModal(false)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/60 border border-amber-500/40 text-stone-400 hover:text-white flex items-center justify-center text-xs"
              >
                <X size={13} />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-2 shadow-inner">
                <Footprints size={24} className="text-amber-300" />
              </div>

              <h3 className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-widest font-serif">{t("your_raid_damage")}</h3>

              <div className="my-2.5 w-full bg-[#120a08]/90 border border-amber-500/40 rounded-xl p-2.5 flex flex-col items-center justify-center">
                <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight leading-none">
                  {userDamage.toLocaleString()} <span className="text-amber-400 text-sm font-serif font-black">{t("hp")}</span>
                </div>
              </div>

              {/* Core Mechanics Badge */}
              <div className="w-full bg-gradient-to-r from-amber-950/80 via-[#331c0e] to-amber-950/80 border border-amber-400/60 rounded-xl px-3 py-2.5 mt-1.5 flex items-center justify-center">
                <div className="text-[11px] font-black text-yellow-300 uppercase tracking-wide flex items-center gap-1.5 font-serif">
                  <Footprints size={13} className="text-emerald-400" />{t("walk_step")}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. {t("damage_share")} MODAL (UPCOMING MILESTONE REWARDS) */}
      <AnimatePresence>
        {showDamageShareModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            data-no-swipe="true"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 no-swipe"
          >
            <div className="w-full max-w-xs bg-gradient-to-b from-[#063a2f] via-[#0b2922] to-[#041713] border-2 border-emerald-400 rounded-2xl p-4 shadow-[0_0_35px_rgba(16,185,129,0.4)] flex flex-col items-center text-center relative">
              <button
                onClick={() => setShowDamageShareModal(false)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/60 border border-emerald-500/40 text-stone-400 hover:text-white flex items-center justify-center text-xs"
              >
                <X size={13} />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-2 shadow-inner">
                <Flame size={24} className="text-emerald-300" />
              </div>

              <h3 className="text-xs sm:text-sm font-black text-emerald-200 uppercase tracking-widest font-serif">
                {t("your_damage")} {t("share_caps", "SHARE")}
              </h3>

              <div className="my-2 w-full bg-[#021c17]/90 border border-emerald-500/40 rounded-xl p-2 flex flex-col items-center gap-0.5">
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-300 tracking-tight leading-none">
                  {userDamagePercent.toFixed(1)}%
                </div>
                <div className="text-[9px] text-stone-300">
                  {userDamage.toLocaleString()} HP of {totalDamageDealt.toLocaleString()} HP Total
                </div>
              </div>

              {/* Nearest Upcoming Milestone Section */}
              {nearestUpcomingMilestone && (
                <div className="w-full bg-[#02211b]/90 border border-emerald-400/50 rounded-xl p-2.5 my-1 flex flex-col items-center text-left">
                  <div className="w-full flex items-center justify-between pb-1 border-b border-emerald-500/30 text-[9px] font-bold">
                    <span className="text-emerald-200 uppercase flex items-center gap-1 font-serif">
                      <span>{nearestUpcomingMilestone.icon}</span>
                      <span>{nearestUpcomingMilestone.isFinal ? t("final_victory", "Final Victory") : t("milestone_hp", "Milestone ({percent}% HP)").replace("{percent}", nearestUpcomingMilestone.hpThresholdPercent.toString())}</span>
                    </span>
                    <span className="text-yellow-400 font-mono">
                      {nearestUpcomingMilestone.isFinal ? '0% HP' : `${nearestUpcomingMilestone.hpThresholdPercent}% HP`}
                    </span>
                  </div>

                  {/* Coins & Gems Grid */}
                  <div className="grid grid-cols-2 gap-1.5 w-full mt-1.5">
                    <div className="bg-[#021310] border border-amber-500/40 rounded-lg p-1.5 flex flex-col items-center">
                      <span className="text-sm">🪙</span>
                      <span className="text-[7px] uppercase font-bold text-amber-200/70">{t("coins")}</span>
                      <span className="text-xs font-mono font-black text-amber-300">
                        +{nearestMilestoneReward?.coins.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="bg-[#021310] border border-cyan-500/40 rounded-lg p-1.5 flex flex-col items-center">
                      <span className="text-sm">💎</span>
                      <span className="text-[7px] uppercase font-bold text-cyan-200/70">{t("gems")}</span>
                      <span className="text-xs font-mono font-black text-cyan-300">
                        +{nearestMilestoneReward?.gems.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>

                  {isNearestPassedBeforeJoin && (
                    <div className="text-[8px] text-stone-400 mt-1.5 text-center w-full">
                      ⚠️ Reached before you joined (Joined at {joinedHpPercent.toFixed(0)}% HP).
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
