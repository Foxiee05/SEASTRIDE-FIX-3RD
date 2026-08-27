import { useState, useEffect, useRef, useCallback } from "react";

export interface FootprintPoint {
  id: string;
  lat: number;
  lng: number;
  heading: number;
  isLeft: boolean;
  timestamp: number;
  stepIndex: number;
}

export interface GpsLocation {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

// Default initial location specified by user (OpenStreetMap reference: 10.4925, 106.6821)
export const DEFAULT_COORDS = {
  lat: 10.4925,
  lng: 106.6821,
};

// Calculate Haversine distance in meters between two lat/lng points
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate bearing in degrees from point 1 to point 2
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const y =
    Math.sin(((lon2 - lon1) * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

interface UseGpsTrackerOptions {
  onStepLogged?: (steps: number) => void;
}

export function useGpsTracker(options?: UseGpsTrackerOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [currentLocation, setCurrentLocation] = useState<GpsLocation>({
    lat: DEFAULT_COORDS.lat,
    lng: DEFAULT_COORDS.lng,
    accuracy: 10,
    speed: 0,
    heading: 0,
    timestamp: Date.now(),
  });

  const [footprints, setFootprints] = useState<FootprintPoint[]>(() => {
    // Generate initial retro starter footprint path around base coordinates
    const initialPoints: FootprintPoint[] = [];
    const baseLat = DEFAULT_COORDS.lat;
    const baseLng = DEFAULT_COORDS.lng;

    // 8 initial trail steps leading to captain's current position
    for (let i = 0; i < 8; i++) {
      const angle = (i * 25 * Math.PI) / 180;
      const dist = (8 - i) * 0.00018;
      const offsetLat = baseLat - Math.cos(angle) * dist;
      const offsetLng = baseLng - Math.sin(angle) * dist;
      const stepAngle = 45 + i * 10;

      initialPoints.push({
        id: `init_footprint_${i}`,
        lat: offsetLat,
        lng: offsetLng,
        heading: stepAngle,
        isLeft: i % 2 === 0,
        timestamp: Date.now() - (8 - i) * 15000,
        stepIndex: i + 1,
      });
    }

    return initialPoints;
  });

  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [totalDistanceTraveledMeters, setTotalDistanceTraveledMeters] =
    useState<number>(140);
  const [isSimulatingWalk, setIsSimulatingWalk] = useState<boolean>(false);

  const prevLocationRef = useRef<GpsLocation | null>(null);
  const stepCountRef = useRef<number>(footprints.length);
  const watchIdRef = useRef<number | null>(null);
  const simIntervalRef = useRef<number | null>(null);
  const simAngleRef = useRef<number>(0);

  // Add footprint at coordinate
  const addFootprint = useCallback(
    (lat: number, lng: number, heading: number) => {
      stepCountRef.current += 1;
      const isLeft = stepCountRef.current % 2 === 0;

      // Slight lateral offset for left vs right foot (~0.4m perpendicular)
      const perpAngle = (heading + (isLeft ? -90 : 90)) * (Math.PI / 180);
      const lateralOffset = 0.0000035; // approx 0.35 meters
      const footLat = lat + Math.cos(perpAngle) * lateralOffset;
      const footLng = lng + Math.sin(perpAngle) * lateralOffset;

      const newPoint: FootprintPoint = {
        id: `foot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        lat: footLat,
        lng: footLng,
        heading,
        isLeft,
        timestamp: Date.now(),
        stepIndex: stepCountRef.current,
      };

      setFootprints((prev) => {
        // Keep up to latest 150 footprints for buttery smooth performance
        const updated = [...prev, newPoint];
        if (updated.length > 150) {
          return updated.slice(updated.length - 150);
        }
        return updated;
      });
    },
    [],
  );

  // Update position handler
  const handlePositionUpdate = useCallback(
    (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;

      let calculatedHeading = heading;
      if (prevLocationRef.current) {
        const dist = calculateDistance(
          prevLocationRef.current.lat,
          prevLocationRef.current.lng,
          latitude,
          longitude,
        );

        if (dist > 1.2) {
          // If moved > 1.2 meters, calculate new heading and record footprint
          calculatedHeading = calculateBearing(
            prevLocationRef.current.lat,
            prevLocationRef.current.lng,
            latitude,
            longitude,
          );

          setTotalDistanceTraveledMeters((prev) => prev + dist);
          addFootprint(latitude, longitude, calculatedHeading || 0);

          if (optionsRef.current?.onStepLogged) {
            const stepsEarned = Math.max(1, Math.round(dist / 0.75));
            optionsRef.current.onStepLogged(stepsEarned);
          }
        }
      }

      const newLoc: GpsLocation = {
        lat: latitude,
        lng: longitude,
        accuracy: accuracy || 10,
        speed: speed || 0,
        heading:
          calculatedHeading !== null
            ? calculatedHeading
            : prevLocationRef.current?.heading || 0,
        timestamp: pos.timestamp,
      };

      prevLocationRef.current = newLoc;
      setCurrentLocation(newLoc);
      setIsGpsActive(true);
      setGpsError(null);
    },
    [addFootprint],
  );

  // Start GPS watching
  const startGpsTracking = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsError("Geolocation is not supported by this browser.");
      return;
    }

    // First attempt to get current position immediately
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePositionUpdate(pos);
      },
      (err) => {
        console.warn("GPS initial position warning:", err.message);
        setGpsError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    // Watch position continuously
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        handlePositionUpdate(pos);
      },
      (err) => {
        console.warn("GPS watch error:", err.message);
        setGpsError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000,
      },
    );
    setIsGpsActive(true);
  }, [handlePositionUpdate]);

  const stopGpsTracking = useCallback(() => {
    if (
      watchIdRef.current !== null &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsGpsActive(false);
  }, []);

  // Step event integration: when user triggers a pedometer step, plot a footprint ahead along heading
  const logPedometerStep = useCallback(
    (stepHeading?: number) => {
      const headingToUse =
        stepHeading !== undefined ? stepHeading : currentLocation.heading || 0;
      const stepDistance = 0.000007; // approx 0.78 meters in lat/lon
      const rad = (headingToUse * Math.PI) / 180;

      const nextLat = currentLocation.lat + Math.cos(rad) * stepDistance;
      const nextLng = currentLocation.lng + Math.sin(rad) * stepDistance;

      const nextLoc: GpsLocation = {
        ...currentLocation,
        lat: nextLat,
        lng: nextLng,
        heading: headingToUse,
        timestamp: Date.now(),
      };

      setCurrentLocation(nextLoc);
      prevLocationRef.current = nextLoc;
      addFootprint(nextLat, nextLng, headingToUse);
      setTotalDistanceTraveledMeters((prev) => prev + 0.78);
    },
    [currentLocation, addFootprint],
  );

  // Simulated GPS Voyage Walk (for instant demonstration & desktop users)
  const toggleSimulateWalk = useCallback(() => {
    if (isSimulatingWalk) {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      setIsSimulatingWalk(false);
    } else {
      setIsSimulatingWalk(true);
      let angle = simAngleRef.current;

      simIntervalRef.current = window.setInterval(() => {
        angle += Math.random() * 20 - 8; // Natural winding walk curve
        simAngleRef.current = (angle + 360) % 360;

        setCurrentLocation((prev) => {
          const stepDist = 0.000009; // ~1 meter per step
          const rad = (simAngleRef.current * Math.PI) / 180;
          const nextLat = prev.lat + Math.cos(rad) * stepDist;
          const nextLng = prev.lng + Math.sin(rad) * stepDist;

          addFootprint(nextLat, nextLng, simAngleRef.current);
          setTotalDistanceTraveledMeters((d) => d + 1.1);

          if (optionsRef.current?.onStepLogged) {
            optionsRef.current.onStepLogged(1);
          }

          return {
            ...prev,
            lat: nextLat,
            lng: nextLng,
            heading: simAngleRef.current,
            speed: 1.4, // ~5 km/h walking speed
            timestamp: Date.now(),
          };
        });
      }, 1000);
    }
  }, [isSimulatingWalk, addFootprint]);

  // Clean up on unmount
  useEffect(() => {
    startGpsTracking();

    return () => {
      stopGpsTracking();
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  // Reset footprint trace
  const clearTrace = useCallback(() => {
    setFootprints([]);
    setTotalDistanceTraveledMeters(0);
  }, []);

  return {
    currentLocation,
    footprints,
    isGpsActive,
    gpsError,
    totalDistanceTraveledMeters,
    isSimulatingWalk,
    startGpsTracking,
    stopGpsTracking,
    toggleSimulateWalk,
    logPedometerStep,
    clearTrace,
    setCurrentLocation,
  };
}
