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
import { soundFx } from '../utils/audio';
import { useCutoutImage } from '../utils/imageUtils';

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
    joinRaid,
    claimRaidPrize, 
  } = useGame();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [floatingDamages] = useState<FloatingDamage[]>([]);
  const [claimResult, setClaimResult] = useState<{ coinsWon: number; gemsWon: number; percent: number; chestName: string } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('18h 42m 15s');

  // Daily timer countdown simulator
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const userParticipant = currentRaidState.participants.find(p => p.isUser || p.id === 'user_player');
  const userDamage = userParticipant ? userParticipant.damage : 0;
  const totalDamageDealt = currentRaidState.participants.reduce((sum, p) => sum + p.damage, 0);
  const userDamagePercent = totalDamageDealt > 0 ? ((userDamage / totalDamageDealt) * 100) : 0;

  const hpPercent = Math.max(0, Math.min(100, (currentRaidState.currentHp / currentRaidState.maxHp) * 100));

  const handleClaim = () => {
    const res = claimRaidPrize();
    if (res) {
      setClaimResult(res);
    }
  };

  // Sorted participants by damage
  const sortedParticipants = [...currentRaidState.participants].sort((a, b) => b.damage - a.damage);
  const userRankIndex = sortedParticipants.findIndex(p => p.isUser || p.id === 'user_player') + 1;

  const rawMonsterImg = ASSETS.monsters[currentMonster.id] || ASSETS.monsters.kraken;
  const monsterImg = useCutoutImage(rawMonsterImg, { mode: 'edge', keepInternalGreenAsBlack: false });

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

        {/* Top Header Bar */}
        <div className="relative z-20 flex items-center justify-between pb-2 border-b border-[#8b5a2b]/40 flex-shrink-0 w-full min-w-0">
          <button
            onClick={() => {
              soundFx.playClick();
              onBackToMenu?.();
            }}
            className="px-3 py-1 bg-[#2b1d19] hover:bg-[#3d291f] border border-[#8b5a2b] rounded-xl text-xs font-bold text-[#fde68a] shadow active:scale-95 transition-all flex items-center gap-1 flex-shrink-0"
          >
            <ArrowLeft size={13} /> Back
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1a2938]/90 border border-[#38bdf8]/50 rounded-full min-w-0 max-w-[150px] sm:max-w-none shadow">
            <Globe size={12} className="text-sky-400 flex-shrink-0" />
            <span className="text-[10px] font-black uppercase text-sky-100 tracking-wider truncate">
              {currentServer.name}
            </span>
          </div>

          <div className="flex items-center gap-1 px-3 py-1 bg-[#2b1d19]/90 border border-amber-400/50 rounded-full text-[10px] font-bold text-amber-300 flex-shrink-0 shadow">
            <Clock size={11} className="text-amber-400 flex-shrink-0" />
            <span>{timeRemaining}</span>
          </div>
        </div>

        {/* Main Encounter Card */}
        <div className="relative z-10 flex flex-col items-center justify-start py-2 text-center max-w-sm mx-auto w-full gap-3 min-w-0 flex-shrink-0 pb-6">
          
          {/* 1. Question / Joining Rule Contract Box & Action Options */}
          <div className="w-full bg-gradient-to-b from-[#2b1d19] via-[#211613] to-[#170e0c] border-2 border-[#b45309] rounded-2xl p-3.5 shadow-2xl text-left min-w-0">
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-[#facc15] font-serif uppercase tracking-wider mb-1.5">
              <Swords size={16} className="text-[#facc15] flex-shrink-0" /> 
              <span className="truncate">Join Fleet Raid Battle?</span>
            </div>
            
            <p className="text-[11px] sm:text-xs text-amber-100/90 leading-relaxed font-sans">
              Will you join the server armada to conquer <span className="text-[#fde68a] font-bold font-serif">{currentMonster.name}</span>?
            </p>
            
            <div className="mt-2 p-2 bg-[#120a08]/80 border border-[#8b5a2b]/50 rounded-xl flex items-center gap-2 text-[10px] sm:text-[11px] text-amber-200">
              <Footprints size={15} className="text-emerald-400 flex-shrink-0 animate-bounce" />
              <span>
                Every footstep deals <span className="text-emerald-300 font-black">1 HP damage</span> to the leviathan and earns you a share of the sealed bounty!
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
                <Swords size={15} className="flex-shrink-0" /> Yes, Join Raid
              </button>

              <button
                id="decline-join-raid-btn"
                onClick={() => {
                  soundFx.playClick();
                  onBackToMenu?.();
                }}
                className="py-2.5 px-3 bg-[#2b1d19] hover:bg-[#3d291f] text-stone-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-[#8b5a2b] active:scale-95 transition-all flex-shrink-0"
              >
                No, Return
              </button>
            </div>
          </div>

          {/* 2. Dramatic Eye-Catching Title */}
          <div className="w-full flex items-center justify-center gap-2 py-1 px-2 relative min-w-0 max-w-full overflow-hidden flex-shrink-0">
            <div className="h-[2px] flex-1 min-w-[12px] bg-gradient-to-r from-transparent via-amber-400 to-amber-600" />
            <div className="py-1 px-3 bg-[#2b1d19]/90 rounded-xl border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.25)] flex-shrink min-w-0 text-center">
              <span className="text-xs sm:text-sm md:text-base font-black uppercase tracking-[0.16em] text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-serif block leading-tight">
                ⚔️ FROM THE ABYSS, THERE RISES... ⚔️
              </span>
            </div>
            <div className="h-[2px] flex-1 min-w-[12px] bg-gradient-to-l from-transparent via-amber-400 to-amber-600" />
          </div>

          {/* 3. Target Boss Information Showcase */}
          <div className="w-full bg-[#1c130e]/90 border-2 border-[#b45309]/80 rounded-2xl p-3 flex flex-col items-center shadow-xl min-w-0">
            {/* 5-Star Raid Banner */}
            <div className="flex items-center gap-1 bg-[#2b1d19] px-3 py-1 rounded-full border border-yellow-500/50 shadow mb-1.5 flex-shrink-0">
              <div className="flex text-yellow-400">
                <Star size={11} className="fill-yellow-400" />
                <Star size={11} className="fill-yellow-400" />
                <Star size={11} className="fill-yellow-400" />
                <Star size={11} className="fill-yellow-400" />
                <Star size={11} className="fill-yellow-400" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-yellow-300 uppercase tracking-widest ml-1 font-serif">
                TIER 5 RAID TARGET
              </span>
            </div>

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

            {/* Monster Name & Subtitle */}
            <h2 className="text-sm sm:text-base font-black text-amber-200 uppercase tracking-wider flex items-center justify-center gap-1.5 mt-1 truncate max-w-full font-serif">
              <Sparkles size={14} className="text-amber-400 flex-shrink-0" />
              <span className="truncate">{currentMonster.name}</span>
            </h2>
            <p className="text-[9px] sm:text-[10px] text-amber-300/70 italic mb-2 truncate max-w-full">"{currentMonster.subtitle}"</p>
            
            <div className="flex flex-wrap items-center justify-center gap-2 w-full">
              <span className="px-2.5 py-0.5 bg-rose-950/80 border border-rose-500/60 rounded-md text-[9px] font-bold text-rose-300 font-mono">
                {currentRaidState.currentHp.toLocaleString()} HP
              </span>
              <span className="px-2.5 py-0.5 bg-[#2b1d19] border border-[#8b5a2b] rounded-md text-[9px] font-bold text-amber-200 flex items-center gap-1">
                <Users size={10} className="text-sky-400" /> {currentRaidState.participants.length} Active
              </span>
            </div>
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
      <div className="relative z-30 px-3 py-1.5 flex items-center justify-between bg-[#1c120c]/90 backdrop-blur-md border-b border-[#8b5a2b]/40 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {!embeddedMode && onBackToMenu && (
            <button
              id="raid-back-btn"
              onClick={() => {
                soundFx.playClick();
                onBackToMenu();
              }}
              className="px-2.5 py-1 bg-[#2b1d19] hover:bg-[#3d291f] border border-[#8b5a2b] rounded-lg text-[10px] font-bold text-[#fde68a] shadow active:scale-95 transition-all flex items-center gap-1"
            >
              <ArrowLeft size={11} /> Back
            </button>
          )}

          <div className="flex items-center gap-1 px-2.5 py-0.5 bg-[#1a2938]/90 border border-[#38bdf8]/50 rounded-full shadow">
            <Globe size={10} className="text-sky-400" />
            <span className="text-[9px] font-black uppercase text-sky-100 tracking-wider truncate max-w-[100px]">
              {currentServer.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-0.5 bg-[#2b1d19]/90 border border-amber-400/50 rounded-full text-[9px] font-bold text-amber-300 shadow">
            <Clock size={10} className="text-amber-400" />
            <span>{timeRemaining}</span>
          </div>

          {openServerModal && (
            <button
              id="switch-server-btn"
              onClick={() => {
                soundFx.playClick();
                openServerModal();
              }}
              className="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 border border-sky-400 text-white rounded text-[9px] font-bold active:scale-95 transition-all"
            >
              Switch
            </button>
          )}
        </div>
      </div>

      {/* MAIN RAID STAGE */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden relative z-10 px-2.5 sm:px-3 pt-1.5 pb-2 min-w-0">
        
        {/* Dramatic Eye-Catching Title */}
        <div className="w-full flex items-center justify-center gap-2 mb-1 px-1 flex-shrink-0 min-w-0">
          <div className="h-[1.5px] flex-1 min-w-[8px] bg-gradient-to-r from-transparent via-amber-400 to-amber-600" />
          <div className="py-0.5 px-2.5 bg-[#2b1d19]/90 rounded-lg border border-amber-400/50 shadow">
            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-serif block truncate">
              ⚔️ FROM THE ABYSS, THERE RISES... ⚔️
            </span>
          </div>
          <div className="h-[1.5px] flex-1 min-w-[8px] bg-gradient-to-l from-transparent via-amber-400 to-amber-600" />
        </div>

        {/* 1. TOP FLOATING BOSS HUD */}
        <div className="w-full bg-gradient-to-b from-[#2b1d19] via-[#211613] to-[#170e0c] border-2 border-[#b45309] rounded-xl p-2 shadow-lg backdrop-blur-md relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          <div className="flex items-center justify-between mb-1">
            {/* 5-Star Raid Badge */}
            <div className="flex items-center gap-0.5 bg-[#170e0c] px-2 py-0.5 rounded-full border border-yellow-500/40">
              <div className="flex text-yellow-400">
                <Star size={9} className="fill-yellow-400" />
                <Star size={9} className="fill-yellow-400" />
                <Star size={9} className="fill-yellow-400" />
                <Star size={9} className="fill-yellow-400" />
                <Star size={9} className="fill-yellow-400" />
              </div>
              <span className="text-[8px] font-black text-yellow-300 uppercase tracking-widest ml-1 font-serif">
                TIER 5 RAID
              </span>
            </div>

            <span className="text-[9px] font-bold text-amber-300/80 italic font-serif">
              {currentMonster.subtitle}
            </span>
          </div>

          {/* Boss Name */}
          <div className="flex items-center justify-between gap-1.5">
            <h1 className="text-xs sm:text-sm font-black text-[#fde68a] uppercase tracking-wider drop-shadow-md flex items-center gap-1 truncate font-serif">
              <Sparkles size={12} className="text-amber-400 flex-shrink-0" />
              <span className="truncate">{currentMonster.name}</span>
            </h1>
          </div>

          {/* Boss HP Gauge */}
          <div className="mt-1 flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black leading-none">
              <span className="text-rose-400 flex items-center gap-0.5">
                <Flame size={10} className="text-rose-500" /> Boss HP
              </span>
              <span className="text-amber-100 font-mono tracking-tight">
                {currentRaidState.currentHp.toLocaleString()} / {currentRaidState.maxHp.toLocaleString()} <span className="text-yellow-400">({hpPercent.toFixed(1)}%)</span>
              </span>
            </div>

            <div className="w-full h-2.5 bg-[#120a08] rounded-full border border-[#8b5a2b] overflow-hidden relative shadow-inner">
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
                RAID BOSS DEFEATED!
              </span>
              <p className="text-[10px] text-white/80 max-w-xs mt-0.5">
                Your server fleet conquered {currentMonster.shortName}! The sealed mystery bounty is unlocked.
              </p>
              {!currentRaidState.dailyPrizeClaimed ? (
                <button
                  id="claim-revealed-bounty-btn"
                  onClick={handleClaim}
                  className="mt-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-stone-950 font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-xl shadow border border-yellow-200 active:scale-95 transition-all flex items-center gap-1.5 animate-pulse font-serif"
                >
                  <Gift size={13} /> Unseal Mystery Bounty
                </button>
              ) : (
                <div className="mt-1.5 px-2.5 py-0.5 bg-emerald-950/90 border border-emerald-500 rounded-lg text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 size={11} /> Bounty Rewards Claimed
                </div>
              )}
            </motion.div>
          )}

          {/* Active Captains Badge */}
          <div className="absolute top-0 right-1 z-20 flex items-center gap-1 px-2.5 py-0.5 bg-[#2b1d19]/90 backdrop-blur-md rounded-full border border-[#8b5a2b] text-[9px] font-bold text-amber-200 shadow">
            <Users size={10} className="text-sky-400" />
            <span>{currentRaidState.participants.length} In Battle</span>
          </div>

          {/* Step Rule Badge */}
          <div className="absolute bottom-0 left-1 z-20 px-2.5 py-0.5 bg-[#2b1d19]/90 backdrop-blur-md rounded-lg border border-[#8b5a2b] text-[8px] sm:text-[9px] font-bold text-amber-300 flex items-center gap-1 shadow">
            <Footprints size={10} className="text-emerald-400 animate-bounce" /> 1 Walk Step = 1 HP Damage
          </div>
        </div>

        {/* 3. BOTTOM HUD SECTION */}
        <div className="w-full flex flex-col gap-1.5 flex-shrink-0 relative z-20">
          
          {/* THE 3 HERO STAT CARDS */}
          <div className="grid grid-cols-3 gap-1.5 w-full">
            
            {/* 1. YOUR DEALT DAMAGE */}
            <div 
              id="stat-your-damage"
              className="bg-gradient-to-b from-[#3d1808] via-[#2c1206] to-[#1e0a03] border-2 border-amber-500 rounded-xl p-1.5 flex flex-col items-center justify-between shadow-md relative overflow-hidden group min-w-0"
            >
              <div className="flex items-center gap-0.5 mb-0.5">
                <Footprints size={10} className="text-amber-300 flex-shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-200 truncate font-serif">
                  YOUR DAMAGE
                </span>
              </div>

              <div className="text-xs sm:text-sm font-black font-mono text-white drop-shadow tracking-tight my-0.5 text-center leading-none truncate w-full">
                {userDamage.toLocaleString()} <span className="text-[8px] sm:text-[9px] text-amber-300 font-serif">HP</span>
              </div>

              <span className="text-[7px] sm:text-[8px] text-amber-300/90 font-bold truncate">
                {userDamage > 0 ? `${userDamage.toLocaleString()} Steps` : 'Walk to strike'}
              </span>
            </div>

            {/* 2. DAMAGE SHARE */}
            <div 
              id="stat-damage-share"
              className="bg-gradient-to-b from-[#064e3b] via-[#047857] to-[#022c22] border-2 border-emerald-400 rounded-xl p-1.5 flex flex-col items-center justify-between shadow-md relative overflow-hidden group min-w-0"
            >
              <div className="flex items-center gap-0.5 mb-0.5">
                <Flame size={10} className="text-emerald-300 flex-shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-200 truncate font-serif">
                  DAMAGE SHARE
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
            </div>

            {/* 3. SERVER RANK */}
            <div 
              id="stat-server-rank"
              className="bg-gradient-to-b from-[#5c2a07] via-[#451e04] to-[#2e1302] border-2 border-yellow-400 rounded-xl p-1.5 flex flex-col items-center justify-between shadow-md relative overflow-hidden group min-w-0"
            >
              <div className="flex items-center gap-0.5 mb-0.5">
                <Crown size={10} className="text-yellow-300 flex-shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-yellow-200 truncate font-serif">
                  SERVER RANK
                </span>
              </div>

              <div className="text-xs sm:text-sm font-black font-mono text-yellow-300 drop-shadow tracking-tight my-0.5 text-center leading-none truncate w-full">
                #{userRankIndex > 0 ? userRankIndex : '-'}
              </div>

              <span className="text-[7px] sm:text-[8px] text-yellow-200/90 font-bold truncate">
                {userRankIndex === 1 ? '🥇 1st Striker' : userRankIndex === 2 ? '🥈 2nd Striker' : userRankIndex === 3 ? '🥉 3rd Striker' : userRankIndex > 0 ? `Rank #${userRankIndex}` : 'Take Steps'}
              </span>
            </div>

          </div>

          {/* LOWER ACTION STRIP: SEALED BOUNTY + RANKINGS BUTTON */}
          <div className="flex gap-1.5 items-center w-full min-w-0">
            
            {/* Sealed Mystery Bounty Card */}
            <div className="flex-1 bg-gradient-to-r from-[#2b1d19] via-[#211613] to-[#170e0c] border border-[#8b5a2b] rounded-xl px-2.5 py-1.5 flex items-center justify-between shadow min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-[10px] flex-shrink-0">
                  🎁
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-black text-amber-200 uppercase tracking-wider flex items-center gap-0.5 truncate font-serif">
                    SEALED BOUNTY <Lock size={8} className="text-amber-400 flex-shrink-0" />
                  </div>
                  <div className="text-[7px] text-amber-300/70 leading-tight truncate">
                    Unlocks at defeat
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 ml-1">
                {currentRaidState.isDefeated && !currentRaidState.dailyPrizeClaimed ? (
                  <button
                    onClick={handleClaim}
                    className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-[8px] uppercase tracking-wider rounded shadow active:scale-95 transition-all animate-pulse font-serif"
                  >
                    Unseal
                  </button>
                ) : currentRaidState.dailyPrizeClaimed ? (
                  <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-500/60 rounded text-[7px] font-bold text-emerald-300">
                    Claimed
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-[#170e0c] border border-[#8b5a2b] rounded text-[7px] font-black text-amber-300 uppercase">
                    Locked
                  </span>
                )}
              </div>
            </div>

            {/* RANKINGS BUTTON */}
            <button
              id="open-raid-rankings-btn"
              onClick={() => {
                soundFx.playClick();
                setShowLeaderboard(true);
              }}
              className="px-3 py-1.5 bg-[#2b1d19] hover:bg-[#3d291f] border-2 border-amber-500/80 rounded-xl text-[#fde68a] active:scale-95 transition-all flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-md flex-shrink-0 font-serif"
            >
              <Trophy size={13} className="text-amber-400 flex-shrink-0" />
              <span>Rankings</span>
              <ChevronRight size={12} className="text-amber-400 flex-shrink-0" />
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
                    Fleet Damage Rankings
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
                    <span>YOUR PERFORMANCE</span>
                    <span className="px-1 py-0.2 bg-amber-400 text-stone-950 text-[7px] font-black uppercase rounded">
                      YOU
                    </span>
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
                            <span className="px-1 py-0.2 bg-amber-400 text-stone-950 text-[7px] font-black uppercase rounded flex-shrink-0">
                              YOU
                            </span>
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

            {/* Bottom Dismiss Button */}
            <div className="pt-2 border-t border-[#8b5a2b]/30 flex-shrink-0 mt-1">
              <button
                id="return-to-battle-btn"
                onClick={() => {
                  soundFx.playClick();
                  setShowLeaderboard(false);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow active:scale-95 transition-all flex items-center justify-center gap-1.5 font-serif"
              >
                <Swords size={13} /> Return To Battle
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEALED BOUNTY UNLOCKED DIALOG */}
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
              
              <h3 className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-widest font-serif">
                MYSTERY BOUNTY UNSEALED!
              </h3>
              
              <p className="text-[10px] text-amber-100/80 mt-0.5">
                You contributed <span className="text-emerald-400 font-bold">{claimResult.percent}%</span> of server damage against {currentMonster.shortName}!
              </p>

              <div className="grid grid-cols-2 gap-1.5 w-full my-2.5">
                <div className="bg-[#120a08] border border-yellow-500/40 rounded-xl p-1.5 flex flex-col items-center">
                  <span className="text-base mb-0.5">🪙</span>
                  <span className="text-[8px] uppercase font-bold text-amber-200/60">Gold Coins</span>
                  <span className="text-xs font-black text-amber-300 font-mono">
                    +{claimResult.coinsWon.toLocaleString()}
                  </span>
                </div>
                <div className="bg-[#120a08] border border-cyan-500/40 rounded-xl p-1.5 flex flex-col items-center">
                  <span className="text-base mb-0.5">💎</span>
                  <span className="text-[8px] uppercase font-bold text-cyan-200/60">Gems</span>
                  <span className="text-xs font-black text-cyan-300 font-mono">
                    +{claimResult.gemsWon.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="w-full p-2 bg-[#1a120e] border border-amber-500/50 rounded-xl flex items-center justify-center gap-1.5 mb-3">
                <span className="text-sm">🎁</span>
                <span className="text-[10px] font-black text-[#fde68a] font-serif">{claimResult.chestName}</span>
              </div>

              <button
                onClick={() => setClaimResult(null)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border border-yellow-200 active:scale-95 transition-all font-serif"
              >
                Collect Bounty
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
