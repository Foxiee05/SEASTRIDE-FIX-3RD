import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { CompassRose } from "./CompassRose";
import { useCompassHeading } from "../hooks/useCompassHeading";
import { useGpsTracker, FootprintPoint } from "../hooks/useGpsTracker";
import {
  Footprints,
  Navigation,
  Compass,
  MapPin,
  Play,
  Square,
  RotateCcw,
  Crosshair,
  Sparkles,
  Shield,
  Award,
} from "lucide-react";
import { useGame } from "../context/GameContext";

interface StepMapViewProps {
  onStepLogged?: (steps: number) => void;
}

// Generate SVG string for Left and Right Pirate Footprints
function getFootprintSvg(
  isLeft: boolean,
  angleDeg: number,
  isLatest: boolean = false,
): string {
  const footFill = isLatest ? "#b45309" : "#78350f";
  const strokeColor = isLatest ? "#facc15" : "#451a03";
  const glow = isLatest
    ? "drop-shadow(0px 0px 4px #fbbf24)"
    : "drop-shadow(0px 1px 2px rgba(0,0,0,0.5))";

  // Left vs Right footprint curve
  const solePath = isLeft
    ? "M 10 24 C 7 24 5 19 6 14 C 7 9 9 7 11 7 C 13 7 14 9 14 14 C 14 19 13 24 10 24 Z"
    : "M 10 24 C 13 24 15 19 14 14 C 13 9 11 7 9 7 C 7 7 6 9 6 14 C 6 19 7 24 10 24 Z";

  const heelPath = isLeft
    ? "M 10 32 C 7 32 6 28 7 26 C 8 25 12 25 13 26 C 14 28 13 32 10 32 Z"
    : "M 10 32 C 13 32 14 28 13 26 C 12 25 8 25 7 26 C 6 28 7 32 10 32 Z";

  // Small toe indents
  const toes = isLeft
    ? '<circle cx="6" cy="4" r="1.3" fill="' +
      footFill +
      '" /><circle cx="9" cy="3.2" r="1.4" fill="' +
      footFill +
      '" /><circle cx="12" cy="4" r="1.3" fill="' +
      footFill +
      '" />'
    : '<circle cx="14" cy="4" r="1.3" fill="' +
      footFill +
      '" /><circle cx="11" cy="3.2" r="1.4" fill="' +
      footFill +
      '" /><circle cx="8" cy="4" r="1.3" fill="' +
      footFill +
      '" />';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 36" width="22" height="34" style="transform: rotate(${angleDeg}deg); filter: ${glow};">
      <path d="${solePath}" fill="${footFill}" stroke="${strokeColor}" stroke-width="1" />
      <path d="${heelPath}" fill="${footFill}" stroke="${strokeColor}" stroke-width="1" />
      ${toes}
    </svg>
  `;
}

// Custom Leaflet DivIcon for Footprint
function createFootprintIcon(point: FootprintPoint, isLatest: boolean = false) {
  const svgHtml = getFootprintSvg(point.isLeft, point.heading, isLatest);
  return L.divIcon({
    className: "custom-footprint-marker",
    html: svgHtml,
    iconSize: [22, 34],
    iconAnchor: [11, 17],
  });
}

// Custom Leaflet DivIcon for Current Captain Location
function createCaptainMarkerIcon(heading: number) {
  return L.divIcon({
    className: "custom-captain-marker",
    html: `
      <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; background: rgba(250, 204, 21, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; inset: 3px; background: #78350f; border: 2.5px solid #facc15; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg);">
          <span style="font-size: 16px; transform: translateY(-1px);">🧭</span>
          <div style="position: absolute; top: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 7px solid #ef4444;"></div>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

export const StepMapView: React.FC<StepMapViewProps> = () => {
  const { addSteps, totalStepsToday } = useGame();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const footprintLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const pathPolylineRef = useRef<L.Polyline | null>(null);
  const captainMarkerRef = useRef<L.Marker | null>(null);

  const { heading, cardinalDirection, setGpsHeading } = useCompassHeading();
  const handleGpsStep = useCallback((count: number) => {
    addSteps(count);
  }, [addSteps]);

  const {
    currentLocation,
    footprints,
    isGpsActive,
    gpsError,
    totalDistanceTraveledMeters,
    isSimulatingWalk,
    toggleSimulateWalk,
    logPedometerStep,
    clearTrace,
    startGpsTracking,
  } = useGpsTracker({
    onStepLogged: handleGpsStep,
  });

  const [followCaptain, setFollowCaptain] = useState<boolean>(true);
  const [mapStyle, setMapStyle] = useState<"parchment" | "standard">(
    "parchment",
  );

  // Initialize Leaflet Map instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Map centered at coordinates (10.4925, 106.6821)
    const map = L.map(mapContainerRef.current, {
      center: [currentLocation.lat, currentLocation.lng],
      zoom: 17,
      minZoom: 4,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
    });

    // Add OpenStreetMap Standard Layer (OSM tile layer)
    const osmLayer = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      },
    );
    osmLayer.addTo(map);

    // Create LayerGroup for Footprints & Polyline for trail
    const footprintGroup = L.layerGroup().addTo(map);
    footprintLayerGroupRef.current = footprintGroup;

    const polyline = L.polyline([], {
      color: "#b45309",
      weight: 3,
      opacity: 0.75,
      dashArray: "4, 8",
      lineCap: "round",
    }).addTo(map);
    pathPolylineRef.current = polyline;

    // Create Captain marker
    const captainMarker = L.marker([currentLocation.lat, currentLocation.lng], {
      icon: createCaptainMarkerIcon(heading || 0),
      zIndexOffset: 1000,
    }).addTo(map);
    captainMarkerRef.current = captainMarker;

    mapInstanceRef.current = map;

    // User drag breaks auto-follow mode
    map.on("dragstart", () => {
      setFollowCaptain(false);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Footprint Markers & Polyline Path when footprints state changes
  useEffect(() => {
    if (!footprintLayerGroupRef.current || !pathPolylineRef.current) return;

    // Clear previous footprint markers
    footprintLayerGroupRef.current.clearLayers();

    const latLngs: L.LatLngExpression[] = [];

    footprints.forEach((point, idx) => {
      latLngs.push([point.lat, point.lng]);
      const isLatest = idx === footprints.length - 1;
      const marker = L.marker([point.lat, point.lng], {
        icon: createFootprintIcon(point, isLatest),
        interactive: false,
      });
      footprintLayerGroupRef.current?.addLayer(marker);
    });

    pathPolylineRef.current.setLatLngs(latLngs);
  }, [footprints]);

  // Sync GPS heading when location heading updates
  useEffect(() => {
    if (
      currentLocation.heading !== null &&
      currentLocation.heading !== undefined
    ) {
      setGpsHeading(currentLocation.heading);
    }
  }, [currentLocation.heading, setGpsHeading]);

  // Update Captain Marker position & heading rotation
  useEffect(() => {
    if (!captainMarkerRef.current || !mapInstanceRef.current) return;

    captainMarkerRef.current.setLatLng([
      currentLocation.lat,
      currentLocation.lng,
    ]);
    captainMarkerRef.current.setIcon(
      createCaptainMarkerIcon(heading || currentLocation.heading || 0),
    );

    if (followCaptain) {
      mapInstanceRef.current.panTo([currentLocation.lat, currentLocation.lng], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [currentLocation.lat, currentLocation.lng, currentLocation.heading, heading, followCaptain]);

  // Handler to recenter map on captain
  const handleRecenter = () => {
    setFollowCaptain(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [currentLocation.lat, currentLocation.lng],
        17,
        {
          animate: true,
        },
      );
    }
  };

  // Zoom helpers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Step button to trigger immediate step trail increment
  const handleManualStep = () => {
    logPedometerStep(heading);
    addSteps(1);
  };

  return (
    <div className="relative w-full h-[62dvh] sm:h-[480px] min-h-[360px] rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 border-[#2b1d19] shadow-2xl flex flex-col select-none group bg-[#1a0f0d]">
      {/* Top Map Header & Live Telemetry HUD */}
      <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between gap-1.5 pointer-events-none">
        {/* Left Telemetry Card */}
        <div className="bg-[#2b1d19]/95 border border-[#b45309] backdrop-blur-md px-2.5 py-1 rounded-xl text-amber-100 shadow-xl flex items-center gap-2 pointer-events-auto">
          <div className="w-6 h-6 bg-[#4a2c17] rounded-lg flex items-center justify-center text-amber-300 border border-[#ca8a04]">
            <Footprints className="w-3.5 h-3.5 text-[#facc15]" />
          </div>
          <div>
            <div className="text-[8px] sm:text-[9px] font-mono uppercase text-[#fde68a] leading-none flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isGpsActive ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`}
              />
              <span>{isGpsActive ? "GPS Trace Live" : "Pedometer Map"}</span>
            </div>
            <div className="text-[10px] sm:text-xs font-black text-white font-mono leading-tight">
              {footprints.length} Footprints •{" "}
              {(totalDistanceTraveledMeters / 1000).toFixed(2)} km
            </div>
          </div>
        </div>

        {/* Action Buttons: Style Toggle */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <button
            onClick={() =>
              setMapStyle((s) => (s === "parchment" ? "standard" : "parchment"))
            }
            className="bg-[#4a2c17] hover:bg-[#92400e] text-[#fde68a] border border-[#b45309] px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase shadow flex items-center gap-1"
            title="Toggle Vintage Parchment Filter"
          >
            {mapStyle === "parchment" ? "📜 Parchment" : "🗺️ Standard"}
          </button>
        </div>
      </div>

      {/* ROTATING COMPASS ROSE OVERLAY (Top-Right / Reacts to Device Orientation & GPS Heading) */}
      <div className="absolute top-12 right-2 sm:top-14 sm:right-3 z-30 pointer-events-auto">
        <CompassRose
          heading={heading}
          cardinalDirection={cardinalDirection}
          size="sm"
        />
      </div>

      {/* LEAFLET OPENSTREETMAP CANVAS */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full relative z-10 transition-all duration-300 ${
          mapStyle === "parchment"
            ? "filter sepia-[0.45] hue-rotate-[-20deg] contrast-[1.12] brightness-[0.96] saturate-[1.25]"
            : ""
        }`}
        style={{ minHeight: "100%" }}
      />

      {/* Vintage Map Parchment Paper Texture & Vignette Overlay */}
      {mapStyle === "parchment" && (
        <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(69,26,3,0.35)_100%)] shadow-inner" />
      )}

      {/* Map Control Buttons: Zoom In/Out, Recenter, Clear */}
      <div className="absolute bottom-12 left-2 z-30 flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={handleRecenter}
          className={`p-2 rounded-xl border-2 shadow-xl flex items-center justify-center transition-all ${
            followCaptain
              ? "bg-[#93bb44] border-b-4 border-[#658627] text-white shadow-sm border-[#064e3b] text-white"
              : "bg-[#2b1d19] border-[#b45309] text-[#fde68a] hover:bg-[#4a2c17]"
          }`}
          title="Center on Captain"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomIn}
          className="w-8 h-8 bg-[#2b1d19] hover:bg-[#4a2c17] border border-[#b45309] rounded-lg text-white font-black text-sm flex items-center justify-center shadow"
        >
          +
        </button>

        <button
          onClick={handleZoomOut}
          className="w-8 h-8 bg-[#2b1d19] hover:bg-[#4a2c17] border border-[#b45309] rounded-lg text-white font-black text-sm flex items-center justify-center shadow"
        >
          -
        </button>

        <button
          onClick={clearTrace}
          className="p-2 bg-[#2b1d19] hover:bg-[#4a2c17] border border-[#b45309] rounded-lg text-red-300 shadow"
          title="Clear footprint trail"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Step Stamp / Quick Walk Button */}
      <div className="absolute bottom-12 right-2 z-30 pointer-events-auto">
        <button
          onClick={handleManualStep}
          className="bg-[#d97706] hover:bg-[#f59e0b] active:scale-95 text-white font-serif font-black text-xs px-3 py-2 rounded-xl border-b-3 border-[#4a2c17] shadow-2xl flex items-center gap-1.5 uppercase italic"
        >
          <Footprints className="w-4 h-4 text-[#fef3c7]" />
          <span>Stamp Step</span>
        </button>
      </div>

      {/* Bottom Live Coordinates & Voyage Bar */}
      <div className="absolute bottom-0 inset-x-0 z-30 bg-[#2b1d19]/95 border-t-2 border-[#4a2c17] px-2.5 py-1 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-[#fde68a] backdrop-blur-sm">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3 h-3 text-[#facc15] flex-shrink-0" />
          <span className="truncate">
            Lat: {currentLocation.lat.toFixed(5)}° • Lng:{" "}
            {currentLocation.lng.toFixed(5)}°
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[#fbbf24] font-bold">
            Heading: {Math.round(heading)}° ({cardinalDirection})
          </span>
        </div>
      </div>
    </div>
  );
};
