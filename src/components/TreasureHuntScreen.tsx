import React, { useState, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { useGame } from "../context/GameContext";
import {
  useGpsTracker,
  calculateDistance,
  calculateBearing,
  DEFAULT_COORDS,
} from "../hooks/useGpsTracker";
import { useCompassHeading } from "../hooks/useCompassHeading";
import { ServerTreasure, TreasureRewardType, TreasureRarity, Decoration } from "../types";
import { getRarityMetadata } from "../utils/treasureRewards";
import { soundFx } from "../utils/audio";
import { useTransparentCutout } from "../utils/imageUtils";
import {
  Radio,
  Sparkles,
  MapPin,
  Clock,
  Globe,
  Info,
  Gift,
  Flame,
  Crown,
  Crosshair,
  Navigation,
  Compass,
  Trophy,
  Coins,
  Gem,
  PackageOpen,
  CheckCircle2,
  HelpCircle,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return "Today";
}

// Modal displaying opened treasure box
interface RewardModalProps {
  reward: TreasureRewardType;
  treasureTitle: string;
  rarity: TreasureRarity;
  onClose: () => void;
}

const SecretItemCutout: React.FC<{ item: Decoration }> = ({ item }) => {
  const transparentSrc = useTransparentCutout(item.imageUrl, {
    mode: "edge",
    keepInternalGreenAsBlack: false,
  });

  return (
    <div className="relative w-36 h-36 mx-auto my-3 flex items-center justify-center">
      {/* Halo Glow */}
      <div className="absolute inset-0 bg-amber-500/30 rounded-full filter blur-xl animate-pulse" />
      {transparentSrc ? (
        <img
          src={transparentSrc}
          alt={item.name}
          className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] z-10 scale-105 transition-transform"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="text-6xl z-10">{item.icon}</span>
      )}
    </div>
  );
};

const RewardModal: React.FC<RewardModalProps> = ({
  reward,
  treasureTitle,
  rarity,
  onClose,
}) => {
  const meta = getRarityMetadata(rarity);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-[#3a2012] border-3 sm:border-4 border-amber-500 rounded-3xl w-full max-w-xs sm:max-w-sm max-h-[88vh] overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.5)] text-amber-100 flex flex-col relative text-center"
      >
        {/* Top Header */}
        <div className="bg-[#201109] border-b-2 border-amber-500/40 p-2.5 sm:p-3.5 flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 mx-auto font-serif">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>TREASURE CHEST OPENED!</span>
          </span>
        </div>

        {/* Chest Content */}
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-widest ${meta.borderStyle}`}
            >
              {meta.badge} CHEST
            </span>
            <h3 className="text-base sm:text-lg font-serif font-black text-white drop-shadow">
              {treasureTitle}
            </h3>
          </div>

          {reward.type === "secret_item" ? (
            <div className="bg-[#261309] border-2 border-amber-500/60 rounded-2xl p-3 sm:p-4 space-y-2">
              <div className="text-[11px] font-black text-amber-400 uppercase tracking-wide flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>⭐ LEGENDARY SECRET RELIC ⭐</span>
              </div>

              <SecretItemCutout item={reward.secretItem} />

              <div className="text-xs sm:text-sm font-serif font-black text-amber-200">
                {reward.secretItem.name}
              </div>
              <p className="text-[11px] text-amber-100/80 leading-relaxed max-w-xs mx-auto">
                {reward.secretItem.description}
              </p>
              <div className="pt-1.5 border-t border-amber-500/30 text-[10px] text-[#93bb44] font-black uppercase">
                ✨ Added directly to your Shop inventory!
              </div>
            </div>
          ) : (
            <div className="bg-[#261309] border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-2 sm:space-y-3">
              <div className="text-4xl sm:text-5xl animate-bounce">
                {reward.type === "coins" ? "🪙" : "💎"}
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  Loot Discovered
                </div>
                <div className="text-xl sm:text-2xl font-serif font-black text-white drop-shadow">
                  +{reward.amount.toLocaleString()}{" "}
                  {reward.type === "coins" ? "Coins" : "Gems"}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-[#93bb44] hover:bg-[#a6d14f] border-b-4 border-[#658627] text-white font-black py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm uppercase italic tracking-wider shadow-lg active:translate-y-1 transition-all"
          >
            Claim & Continue Hunting
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Helper for cardinal compass directions
function getCardinalDirection(bearing: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(((bearing % 360) / 45)) % 8;
  return directions[index];
}

// Create Captain divIcon for Leaflet (at the radar bullseye)
function createCaptainAvatarMarker(avatarUrl: string, headingDeg: number = 0) {
  const avatarSrc = avatarUrl || "https://api.dicebear.com/7.x/bottts/svg?seed=captain";
  const html = `
    <div class="relative w-12 h-12 flex items-center justify-center pointer-events-none select-none">
      <!-- Radar Pulse Ring -->
      <div class="absolute inset-0 rounded-full bg-emerald-500/35 animate-ping"></div>
      <div class="absolute -inset-1.5 rounded-full border-2 border-emerald-400/60 animate-pulse"></div>

      <!-- Heading Needle Pointer -->
      <div class="absolute inset-0 flex items-center justify-center transition-transform duration-300" style="transform: rotate(${headingDeg}deg)">
        <div class="absolute -top-2.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-amber-400 drop-shadow-[0_0_6px_#f59e0b]"></div>
      </div>

      <!-- Player Avatar Frame -->
      <div class="relative w-10 h-10 rounded-full border-2 border-amber-400 bg-[#25130a] overflow-hidden shadow-[0_0_14px_rgba(245,158,11,0.9)] z-10 flex items-center justify-center">
        <img src="${avatarSrc}" alt="Captain" class="w-full h-full object-cover" />
      </div>

      <!-- Captain Helm Icon Badge -->
      <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border border-white text-[9px] flex items-center justify-center z-20 shadow-md">
        ⛵
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "captain-bullseye-marker",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

// Create Treasure Chest divIcon for Leaflet Map
function createTreasureMarkerIcon(treasure: ServerTreasure, isSelected: boolean = false) {
  const meta = getRarityMetadata(treasure.rarity);
  const iconEmoji =
    treasure.rarity === "legendary"
      ? "👑"
      : treasure.rarity === "rare"
      ? "💎"
      : treasure.rarity === "uncommon"
      ? "🗝️"
      : "📦";

  const distLabel = treasure.distanceMeters !== undefined ? `${treasure.distanceMeters}m` : "";

  const html = `
    <div class="relative w-10 h-10 flex flex-col items-center justify-center cursor-pointer transition-transform duration-200 ${
      isSelected ? "scale-125 z-30" : "hover:scale-110"
    }">
      <!-- Pulsing Aura -->
      <div class="absolute inset-0 rounded-full animate-ping opacity-60" style="background-color: ${meta.glowColor}"></div>
      
      <!-- Icon Chest Bubble -->
      <div class="relative w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.8)] z-10" style="background-color: ${meta.glowColor}">
        <span class="drop-shadow">${iconEmoji}</span>
      </div>

      <!-- Distance Badge -->
      ${
        distLabel
          ? `<div class="absolute -bottom-2.5 bg-[#1a0f0a]/95 text-[8.5px] font-mono font-bold text-amber-200 px-1.5 py-0.2 rounded border border-amber-500/50 whitespace-nowrap shadow-md z-20">
              ${distLabel}
            </div>`
          : ""
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: "treasure-radar-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export const TreasureHuntScreen: React.FC = () => {
  const {
    serverTreasures,
    claimTreasure,
    treasureLogs,
    todayLoot,
    spawnNewDailyTreasures,
    remainingTreasuresCount,
    totalDailyTreasures,
    treasureResetTime,
    currentServer,
    profile,
  } = useGame();

  const { currentLocation } = useGpsTracker();
  const { heading } = useCompassHeading();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const captainMarkerRef = useRef<L.Marker | null>(null);
  const radarCircleRef = useRef<L.Circle | null>(null);
  const treasureMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const claimedIdsRef = useRef<Set<string>>(new Set());

  const [selectedTreasureId, setSelectedTreasureId] = useState<string | null>(null);
  const [openedReward, setOpenedReward] = useState<{
    reward: TreasureRewardType;
    title: string;
    rarity: TreasureRarity;
  } | null>(null);
  const [showDropRates, setShowDropRates] = useState<boolean>(false);
  const [showDescription, setShowDescription] = useState<boolean>(() => {
    try {
      const seen = localStorage.getItem("has_seen_treasure_hunt_intro");
      if (!seen) {
        localStorage.setItem("has_seen_treasure_hunt_intro", "true");
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  // 24-hour Reset Countdown timer string (HH:MM:SS)
  const [countdownStr, setCountdownStr] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      const remainingMs = Math.max(0, treasureResetTime - Date.now());
      const totalSeconds = Math.floor(remainingMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const pad = (n: number) => n.toString().padStart(2, "0");
      setCountdownStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [treasureResetTime]);

  // Captain GPS coordinates (always cleanly fallback to DEFAULT_COORDS)
  const captainLat = currentLocation?.lat ?? DEFAULT_COORDS.lat;
  const captainLng = currentLocation?.lng ?? DEFAULT_COORDS.lng;
  const captainHeading = heading || currentLocation?.heading || 0;

  // Compute live distances and bearings for all unclaimed treasures within 2km
  const detectedTreasures = useMemo(() => {
    return serverTreasures
      .filter((t) => !t.isClaimed)
      .map((t) => {
        const dist = calculateDistance(captainLat, captainLng, t.lat, t.lng);
        const bearing = calculateBearing(captainLat, captainLng, t.lat, t.lng);
        return {
          ...t,
          distanceMeters: Math.round(dist),
          bearing: Math.round(bearing),
        };
      })
      .filter((t) => (t.distanceMeters ?? 9999) <= 2000) // Strictly within 2.0 km
      .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  }, [serverTreasures, captainLat, captainLng]);

  // Ensure treasures exist within 2km of captain's active location
  useEffect(() => {
    if (detectedTreasures.length === 0) {
      spawnNewDailyTreasures(true, captainLat, captainLng);
    }
  }, [detectedTreasures.length, captainLat, captainLng, spawnNewDailyTreasures]);

  const nearestTreasure = detectedTreasures[0] ?? null;
  const selectedTreasure =
    detectedTreasures.find((t) => t.id === selectedTreasureId) ?? nearestTreasure ?? null;

  // Initialize Leaflet Map (locked, centered on radar bullseye, zoom level 13.8 to fit 2km radius)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Map with all panning and zooming completely disabled
    const map = L.map(mapContainerRef.current, {
      center: [captainLat, captainLng],
      zoom: 13.8,
      zoomSnap: 0.1,
      minZoom: 13,
      maxZoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    // Standard Leaflet / OpenStreetMap visual tile layer
    const tileLayer = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }
    );
    tileLayer.addTo(map);

    // 2.0 km Radar Perimeter Circle
    const radarCircle = L.circle([captainLat, captainLng], {
      radius: 2000,
      color: "#10b981",
      fillColor: "#064e3b",
      fillOpacity: 0.12,
      weight: 1.5,
      dashArray: "6, 8",
    }).addTo(map);
    radarCircleRef.current = radarCircle;

    // Treasure Layer Group
    const treasureGroup = L.layerGroup().addTo(map);
    treasureMarkersGroupRef.current = treasureGroup;

    // Captain Marker with Profile Avatar (always strictly at radar bullseye)
    const captainMarker = L.marker([captainLat, captainLng], {
      icon: createCaptainAvatarMarker(profile.avatarUrl, captainHeading),
      zIndexOffset: 1000,
    }).addTo(map);
    captainMarkerRef.current = captainMarker;

    mapInstanceRef.current = map;

    // Invalidate map size after container mounts
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Captain Marker, Radar Range Circle & lock map center to user's GPS
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Update Captain Marker position and avatar
    if (captainMarkerRef.current) {
      captainMarkerRef.current.setLatLng([captainLat, captainLng]);
      captainMarkerRef.current.setIcon(
        createCaptainAvatarMarker(profile.avatarUrl, captainHeading)
      );
    }

    // Update Radar Perimeter Circle Center
    if (radarCircleRef.current) {
      radarCircleRef.current.setLatLng([captainLat, captainLng]);
    }

    // User's location always sticks to the radar's bullseye
    mapInstanceRef.current.setView([captainLat, captainLng], 13.8, { animate: false });
    mapInstanceRef.current.invalidateSize();
  }, [captainLat, captainLng, captainHeading, profile.avatarUrl]);

  // Update Treasure markers on Leaflet Map
  useEffect(() => {
    if (!mapInstanceRef.current || !treasureMarkersGroupRef.current) return;

    treasureMarkersGroupRef.current.clearLayers();

    detectedTreasures.forEach((t) => {
      const isSelected = selectedTreasure?.id === t.id;
      const marker = L.marker([t.lat, t.lng], {
        icon: createTreasureMarkerIcon(t, isSelected),
        zIndexOffset: isSelected ? 500 : 100,
      });

      marker.on("click", () => {
        setSelectedTreasureId(t.id);
        soundFx.playClick();

        // Check if user is touching/in range of treasure (distance <= 45m)
        const currentDist = calculateDistance(captainLat, captainLng, t.lat, t.lng);
        if (currentDist <= 45) {
          const res = claimTreasure(t.id);
          if (res) {
            setOpenedReward({
              reward: res.reward,
              title: t.title,
              rarity: t.rarity,
            });
          }
        }
      });

      treasureMarkersGroupRef.current?.addLayer(marker);
    });
  }, [detectedTreasures, selectedTreasure?.id, captainLat, captainLng, claimTreasure]);

  // AUTOMATIC TOUCH COLLECTION TRIGGER:
  // If user's avatar touches the treasure icon (physical proximity <= 45m), automatically collect it!
  useEffect(() => {
    if (detectedTreasures.length === 0) return;

    // Find any treasure touching captain that hasn't been claimed yet
    const touchingTreasure = detectedTreasures.find(
      (t) => (t.distanceMeters ?? 999) <= 45 && !t.isClaimed && !claimedIdsRef.current.has(t.id)
    );

    if (touchingTreasure) {
      claimedIdsRef.current.add(touchingTreasure.id);
      const res = claimTreasure(touchingTreasure.id);
      if (res) {
        setOpenedReward({
          reward: res.reward,
          title: touchingTreasure.title,
          rarity: touchingTreasure.rarity,
        });
      }
    }
  }, [detectedTreasures, claimTreasure]);

  return (
    <div className="w-full flex flex-col space-y-3 pb-8 select-none text-amber-100">
      {/* Game Mode Description Modal */}
      {showDescription && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#3a2012] border-2 sm:border-4 border-amber-500 rounded-2xl w-full max-w-sm flex flex-col p-4 text-amber-100 shadow-2xl relative overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5 flex-shrink-0">
              <div className="flex items-center gap-2 font-serif font-black text-amber-300">
                <Compass className="w-4 h-4 text-amber-400" />
                <span className="uppercase text-xs sm:text-sm tracking-wider">Treasure Hunt</span>
              </div>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowDescription(false);
                }}
                className="p-1 rounded-lg bg-[#2b160b] hover:bg-[#4a2713] text-amber-300 text-xs px-2 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-3.5 text-xs text-amber-100/90 leading-relaxed font-sans space-y-2">
              <p>
                Each day, between <strong>5 to 15 random treasures</strong> spawn exclusively within a <strong>2 km radius</strong> of your coordinates and remain anchored in place for 24 hours.
              </p>
              <p>
                <strong>Server-Wide Isolation:</strong> Each server has its own unique daily treasures and feed. Pirates on other servers cannot see or claim your server's treasures!
              </p>
              <p>
                Track markers with your live radar and touch chests (&le;45m) to plunder them before fellow captains on your server claim them!
              </p>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-amber-500/30 flex-shrink-0">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowDescription(false);
                }}
                className="w-full bg-[#93bb44] hover:bg-[#a6d14f] border-b-2 border-[#658627] text-white font-black py-2 rounded-xl text-xs uppercase italic tracking-wide active:translate-y-0.5 shadow-md"
              >
                Got It!
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Drop Rates Modal */}
      {showDropRates && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#3a2012] border-2 sm:border-4 border-amber-500/80 rounded-2xl w-full max-w-sm max-h-[82vh] flex flex-col p-3.5 sm:p-4 text-amber-100 shadow-2xl relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 font-serif font-black text-amber-300">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="uppercase text-xs tracking-wider">Treasure Drop Rates</span>
              </div>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowDropRates(false);
                }}
                className="p-1 rounded-lg bg-[#2b160b] hover:bg-[#4a2713] text-amber-300 text-xs px-2 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Drop Rate Items */}
            <div className="space-y-1.5 text-[11px] overflow-y-auto py-2.5 pr-1 flex-1">
              {[
                { name: "100 Gold Coins", rarity: "Common", rate: "30.0%", icon: "🪙", color: "text-slate-300" },
                { name: "1 Precious Gem", rarity: "Common", rate: "30.0%", icon: "💎", color: "text-slate-300" },
                { name: "1,000 Gold Coins", rarity: "Uncommon", rate: "12.5%", icon: "🪙", color: "text-sky-300" },
                { name: "5 Precious Gems", rarity: "Uncommon", rate: "12.5%", icon: "💎", color: "text-sky-300" },
                { name: "10,000 Gold Coins", rarity: "Rare", rate: "6.5%", icon: "🪙", color: "text-purple-300" },
                { name: "100 Precious Gems", rarity: "Rare", rate: "6.5%", icon: "💎", color: "text-purple-300" },
                { name: "Secret Item Relic*", rarity: "Legendary", rate: "2.0%", icon: "👑", color: "text-amber-400 font-bold" },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-[#25130a] border border-amber-500/20"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{row.icon}</span>
                    <span className={`${row.color} text-[11px]`}>{row.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-black/40 text-amber-200/60 font-mono">
                      {row.rarity}
                    </span>
                    <span className="font-mono font-bold text-amber-300 text-[11px] w-12 text-right">
                      {row.rate}
                    </span>
                  </div>
                </div>
              ))}

              <div className="mt-2.5 p-2 rounded-xl bg-[#201007] border border-amber-500/30 text-[10px] text-amber-200/70 leading-relaxed">
                * Secret item drops are unlisted from the shop catalog until plundered from a legendary chest. Once found, they immediately unlock in your decoration inventory.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-amber-500/30 flex-shrink-0">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowDropRates(false);
                }}
                className="w-full bg-[#93bb44] hover:bg-[#a6d14f] border-b-2 border-[#658627] text-white font-black py-2 rounded-xl text-xs uppercase italic tracking-wide active:translate-y-0.5 shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claimed Reward Popup */}
      <AnimatePresence>
        {openedReward && (
          <RewardModal
            reward={openedReward.reward}
            treasureTitle={openedReward.title}
            rarity={openedReward.rarity}
            onClose={() => {
              soundFx.playClick();
              setOpenedReward(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Mode Sub-Header Info Bar */}
      <div className="bg-[#24130b] border-2 border-amber-500/40 rounded-2xl p-3 flex items-center justify-between shadow-lg flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/40">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-serif font-black uppercase text-amber-300 flex items-center gap-1.5 flex-wrap">
              <span>TREASURE HUNT</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                2 KM RADAR
              </span>
            </div>
            <div className="text-[10px] text-amber-200/60 font-mono">
              Server: <span className="text-white font-bold">{currentServer.name}</span> | Active: <span className="text-emerald-300 font-bold">{detectedTreasures.length} Chests</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* 24-Hour Reset Countdown Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#1e0f08] border border-amber-500/40 text-amber-300 text-[10.5px] font-mono shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-amber-200/70">Reset in:</span>
            <span className="text-amber-300 font-bold font-mono">{countdownStr || "24:00:00"}</span>
          </div>

          {/* "?" Button to show game mode description */}
          <button
            onClick={() => {
              soundFx.playClick();
              setShowDescription(true);
            }}
            title="Game Mode Description"
            className="w-7 h-7 rounded-xl bg-[#25130a] hover:bg-[#432313] border border-amber-500/40 text-xs font-black text-amber-300 flex items-center justify-center shadow-sm active:scale-95 transition-all"
          >
            ?
          </button>

          {/* Drop Rates Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              setShowDropRates(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-[#25130a] hover:bg-[#432313] border border-amber-500/40 text-[11px] font-black text-amber-300 uppercase inline-flex items-center gap-1 shadow-sm active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Drop Rates</span>
          </button>
        </div>
      </div>

      {/* Real-time Radar Screen with Leaflet Map Behind */}
      <div className="bg-[#24130b] border-4 border-[#5a2e16] rounded-3xl p-4 shadow-2xl relative overflow-hidden space-y-3">
        {/* Header Title with 2km Radar Status */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <div>
              <h2 className="text-sm font-serif font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                <span>TREASURE RADAR MAP</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                  LIVE GPS
                </span>
              </h2>
              <p className="text-[11px] text-amber-200/70">
                {detectedTreasures.length > 0
                  ? `⚡ ${detectedTreasures.length} Treasure${detectedTreasures.length > 1 ? "s" : ""} located within 2km radar. Walk to touch & collect!`
                  : "📡 Radar scanning 2km radius around captain coordinates..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a0c06] border border-amber-500/25 text-[10.5px] font-mono text-amber-200/80">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset in {countdownStr}</span>
            </div>
          </div>
        </div>

        {/* Leaflet Map Radar Viewport */}
        <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-inner bg-[#0a1410]">
          {/* Leaflet Map instance (Tiles & Markers) */}
          <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full pointer-events-auto" />

          {/* Radar HUD Overlay (Rings, Cardinal Directions, and Scanning Beam) */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {/* Concentric Radar Range Rings */}
            <div className="w-[85%] h-[85%] rounded-full border border-emerald-500/30 absolute" />
            <div className="w-[58%] h-[58%] rounded-full border border-emerald-500/30 absolute" />
            <div className="w-[30%] h-[30%] rounded-full border border-emerald-500/40 absolute" />

            {/* Radar Crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-emerald-500/25" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-emerald-500/25" />

            {/* Cardinal Directions */}
            <span className="absolute top-2 text-[10px] font-black text-emerald-400 font-mono drop-shadow bg-black/40 px-1 rounded">N</span>
            <span className="absolute bottom-2 text-[10px] font-black text-emerald-400 font-mono drop-shadow bg-black/40 px-1 rounded">S</span>
            <span className="absolute left-2 text-[10px] font-black text-emerald-400 font-mono drop-shadow bg-black/40 px-1 rounded">W</span>
            <span className="absolute right-2 text-[10px] font-black text-emerald-400 font-mono drop-shadow bg-black/40 px-1 rounded">E</span>

            {/* Rotating Radar Sweep Cone */}
            <div
              className="absolute inset-0 origin-center pointer-events-none animate-spin"
              style={{
                animationDuration: "5s",
                background:
                  "conic-gradient(from 0deg, rgba(16, 185, 129, 0.25) 0deg, rgba(16, 185, 129, 0) 60deg)",
              }}
            />
          </div>

          {/* Proximity Warning / Touch Status */}
          {nearestTreasure && (
            <div className="absolute top-2 right-2 z-20 bg-[#1a0f0a]/90 border border-amber-500/40 rounded-xl px-2.5 py-1 text-[10px] font-mono text-emerald-300 backdrop-blur-sm shadow flex items-center gap-1">
              <span>Nearest:</span>
              <strong className="text-amber-300">{nearestTreasure.distanceMeters}m</strong>
            </div>
          )}
        </div>

        {/* Selected Treasure Guidance Card (if specific treasure selected on map) */}
        {selectedTreasure && selectedTreasure.id !== nearestTreasure?.id && (
          <div className="bg-[#1f0f08] border-2 border-amber-500/50 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="text-2xl p-1.5 bg-[#2f180c] border border-amber-500/40 rounded-xl shadow">
                  {selectedTreasure.rarity === "legendary"
                    ? "👑"
                    : selectedTreasure.rarity === "rare"
                    ? "💎"
                    : selectedTreasure.rarity === "uncommon"
                    ? "🗝️"
                    : "📦"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-serif font-black text-amber-200">
                      {selectedTreasure.title}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        getRarityMetadata(selectedTreasure.rarity).borderStyle
                      }`}
                    >
                      {selectedTreasure.rarity}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-2 mt-0.5">
                    <span>📍 {selectedTreasure.distanceMeters}m away</span>
                    <span>🧭 {selectedTreasure.bearing}° {getCardinalDirection(selectedTreasure.bearing || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-right">
                {selectedTreasure.distanceMeters! <= 45 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500 text-black font-black text-[10px] animate-pulse shadow">
                    ✨ TOUCHING CHEST!
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-200/70 font-mono">
                    Walk within 45m to claim
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DEDICATED BOX: NEAREST AVAILABLE TREASURE */}
      {nearestTreasure && (
        <div className="bg-[#24130b] border-2 border-emerald-500/60 rounded-2xl p-3.5 space-y-3 shadow-xl relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/25 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                <Target className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-serif font-black uppercase text-amber-300 tracking-wide flex items-center gap-1.5">
                  <span>NEAREST AVAILABLE TREASURE</span>
                </h3>
                <p className="text-[10px] text-emerald-400/80 font-mono">
                  Closest target on your 2 km radar
                </p>
              </div>
            </div>

            <span
              className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                getRarityMetadata(nearestTreasure.rarity).borderStyle
              }`}
            >
              {nearestTreasure.rarity}
            </span>
          </div>

          {/* Body Info */}
          <div className="flex items-center justify-between gap-3 bg-[#190c06] p-3 rounded-xl border border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="text-3xl p-2 bg-[#2a140a] border border-amber-500/50 rounded-2xl shadow-inner flex items-center justify-center">
                {nearestTreasure.rarity === "legendary"
                  ? "👑"
                  : nearestTreasure.rarity === "rare"
                  ? "💎"
                  : nearestTreasure.rarity === "uncommon"
                  ? "🗝️"
                  : "📦"}
              </div>
              <div>
                <div className="text-sm font-serif font-black text-white">
                  {nearestTreasure.title}
                </div>
                <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {nearestTreasure.distanceMeters}m away
                  </span>
                  <span className="flex items-center gap-0.5 text-amber-300">
                    <Navigation
                      className="w-3 h-3 transition-transform"
                      style={{ transform: `rotate(${nearestTreasure.bearing || 0}deg)` }}
                    />
                    {nearestTreasure.bearing}° {getCardinalDirection(nearestTreasure.bearing || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action / Touch Range Status */}
            <div className="text-right flex flex-col items-end gap-1">
              {nearestTreasure.distanceMeters! <= 45 ? (
                <button
                  onClick={() => {
                    const res = claimTreasure(nearestTreasure.id);
                    if (res) {
                      soundFx.playVictory();
                      setOpenedReward({
                        reward: res.reward,
                        title: nearestTreasure.title,
                        rarity: nearestTreasure.rarity,
                      });
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#93bb44] hover:bg-[#a6d14f] border-b-2 border-[#658627] text-white font-black text-[11px] uppercase italic tracking-wider shadow-lg active:translate-y-0.5"
                >
                  Plunder Chest!
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedTreasureId(nearestTreasure.id);
                    soundFx.playClick();
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#2f180c] hover:bg-[#432313] border border-amber-500/40 text-amber-200 text-[10px] font-bold flex items-center gap-1"
                >
                  <span>Focus Target</span>
                  <ArrowUpRight className="w-3 h-3 text-amber-400" />
                </button>
              )}
            </div>
          </div>

          {/* Proximity Progress Bar towards 45m Touch Zone */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-200/70">
              <span>Proximity to Touch Zone (&le;45m)</span>
              <span className="text-emerald-300 font-bold">
                {Math.max(0, 2000 - (nearestTreasure.distanceMeters ?? 2000))} / 2000m
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#150904] border border-amber-500/20 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(5, ((2000 - (nearestTreasure.distanceMeters ?? 2000)) / 2000) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* USER'S TODAY LOOT BOX */}
      <div className="bg-[#24130b] border-2 border-amber-500/60 rounded-2xl p-4 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-amber-500/25 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-serif font-black uppercase text-amber-300 tracking-wide">
                TODAY'S PLUNDERED LOOT
              </h3>
              <p className="text-[10px] text-amber-200/60 font-mono">
                {todayLoot.totalChestsOpened} Chest{todayLoot.totalChestsOpened !== 1 ? "s" : ""} Collected Today
              </p>
            </div>
          </div>

          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Daily Stash
          </span>
        </div>

        {/* 3-Pillar Loot Summary Counters */}
        <div className="grid grid-cols-3 gap-2">
          {/* Coins Looted */}
          <div className="p-2.5 rounded-xl bg-[#1a0c06] border border-amber-500/20 flex flex-col items-center justify-center text-center">
            <div className="text-xl mb-0.5">🪙</div>
            <span className="text-[10px] uppercase font-bold text-amber-200/60">Coins Looted</span>
            <span className="text-sm font-black font-serif text-amber-300">
              +{todayLoot.totalCoins.toLocaleString()}
            </span>
          </div>

          {/* Gems Looted */}
          <div className="p-2.5 rounded-xl bg-[#1a0c06] border border-amber-500/20 flex flex-col items-center justify-center text-center">
            <div className="text-xl mb-0.5">💎</div>
            <span className="text-[10px] uppercase font-bold text-amber-200/60">Gems Looted</span>
            <span className="text-sm font-black font-serif text-sky-300">
              +{todayLoot.totalGems.toLocaleString()}
            </span>
          </div>

          {/* Secret Relics */}
          <div className="p-2.5 rounded-xl bg-[#1a0c06] border border-amber-500/20 flex flex-col items-center justify-center text-center">
            <div className="text-xl mb-0.5">👑</div>
            <span className="text-[10px] uppercase font-bold text-amber-200/60">Secret Relics</span>
            <span className="text-sm font-black font-serif text-amber-400">
              {todayLoot.secretRelics.length} Found
            </span>
          </div>
        </div>

        {/* Secret Relics Unlocked Today (if any) */}
        {todayLoot.secretRelics.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-serif font-black uppercase text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Legendary Relics Unlocked Today</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {todayLoot.secretRelics.map((relic) => (
                <div
                  key={relic.id}
                  className="p-2 rounded-xl bg-gradient-to-r from-amber-950/60 to-[#261309] border border-amber-500/40 flex items-center gap-2"
                >
                  <span className="text-2xl">{relic.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-amber-200 font-serif truncate">
                      {relic.name}
                    </div>
                    <div className="text-[9px] text-[#93bb44] font-bold uppercase">
                      ✓ In Shop Inventory
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Claim History List for Today */}
        <div className="space-y-1.5 pt-1 border-t border-amber-500/20">
          <div className="text-[11px] font-serif font-black uppercase text-amber-300/90">
            Today's Plunder History ({todayLoot.claimedHistory.length})
          </div>

          {todayLoot.claimedHistory.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {todayLoot.claimedHistory.map((item, idx) => (
                <div
                  key={`${item.id}_${idx}`}
                  className="p-2 rounded-xl bg-[#180c06] border border-amber-500/20 text-[11px] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#93bb44] flex-shrink-0" />
                    <span className="font-bold text-white truncate">{item.title}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300 flex-shrink-0">
                    +{item.reward.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-3 rounded-xl bg-[#180c06]/60 border border-dashed border-amber-500/20 text-xs text-amber-200/60">
              No treasures claimed yet today. Walk towards the map icons to touch and collect!
            </div>
          )}
        </div>
      </div>

      {/* SERVER HUNTING FEED */}
      <div className="bg-[#24130b] border-2 border-amber-500/40 rounded-2xl p-3.5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-serif font-black uppercase text-amber-300">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>SERVER HUNTING FEED</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
              {currentServer.name}
            </span>
          </div>
          <span className="text-[10px] text-amber-200/60 font-mono">Server-wide Live Feed</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {treasureLogs.length > 0 ? (
            treasureLogs.map((log, idx) => (
              <div
                key={`${log.id}_${idx}`}
                className={`p-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                  log.isUser
                    ? "bg-amber-950/70 border-amber-500/50 text-amber-200 shadow-sm"
                    : "bg-[#180c06] border-amber-500/15 text-amber-100/90"
                }`}
              >
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  {log.avatarUrl ? (
                    <img
                      src={log.avatarUrl}
                      alt={log.playerName}
                      className="w-6 h-6 rounded-full object-cover border border-amber-400/40 flex-shrink-0 mt-0.5 sm:mt-0"
                    />
                  ) : (
                    <span className="text-base flex-shrink-0">🏴‍☠️</span>
                  )}
                  <div className="flex-1 break-words leading-relaxed">
                    <span className="font-bold text-white mr-1.5">
                      {log.playerName}
                      {log.isUser && (
                        <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono font-bold">
                          You
                        </span>
                      )}
                    </span>
                    <span className="text-amber-100/90">
                      claimed <strong className="text-amber-300 font-bold">{log.rewardLabel}</strong>
                    </span>
                    {log.locationName && (
                      <span className="text-[10px] text-amber-200/50 block sm:inline sm:ml-1.5">
                        • {log.locationName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2b170c] border border-amber-500/20 font-mono text-amber-300/80 whitespace-nowrap">
                    {log.serverName}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400/60 whitespace-nowrap">
                    {formatTimeAgo(log.timestamp)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-3 rounded-xl bg-[#180c06]/60 border border-dashed border-amber-500/20 text-xs text-amber-200/60">
              No treasure activity on {currentServer.name} yet today. Be the first to claim a chest!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
