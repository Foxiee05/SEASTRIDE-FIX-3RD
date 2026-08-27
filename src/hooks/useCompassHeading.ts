import { useState, useEffect, useRef } from "react";

export function useCompassHeading() {
  const [heading, setHeading] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean>(false);
  const [cardinalDirection, setCardinalDirection] = useState<string>("N");

  const headingRef = useRef<number>(0);

  const getCardinal = (deg: number): string => {
    const normalized = ((deg % 360) + 360) % 360;
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    const index = Math.round(normalized / 22.5) % 16;
    return directions[index];
  };

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let compassHeading: number | null = null;

      // iOS WebKit compass heading
      if (
        "webkitCompassHeading" in event &&
        typeof (event as unknown as { webkitCompassHeading: number })
          .webkitCompassHeading === "number"
      ) {
        compassHeading = (event as unknown as { webkitCompassHeading: number })
          .webkitCompassHeading;
      } else if (event.alpha !== null && event.alpha !== undefined) {
        // Android / standard compass
        compassHeading = 360 - event.alpha;
      }

      if (compassHeading !== null && !isNaN(compassHeading)) {
        const rounded = Math.round(compassHeading);
        headingRef.current = rounded;
        setHeading(rounded);
        setCardinalDirection(getCardinal(rounded));
        setHasCompassSensor(true);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("deviceorientation", handleOrientation, true);
      window.addEventListener(
        "deviceorientationabsolute" as unknown as string,
        handleOrientation as unknown as EventListener,
        true,
      );
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "deviceorientation",
          handleOrientation,
          true,
        );
        window.removeEventListener(
          "deviceorientationabsolute" as unknown as string,
          handleOrientation as unknown as EventListener,
          true,
        );
      }
    };
  }, []);

  // Method to manually update heading from GPS bearing if motion sensor is unavailable or when moving
  const setGpsHeading = (gpsBearing: number) => {
    if (!hasCompassSensor && !isNaN(gpsBearing)) {
      const rounded = Math.round(gpsBearing);
      if (headingRef.current !== rounded) {
        headingRef.current = rounded;
        setHeading(rounded);
        setCardinalDirection(getCardinal(rounded));
      }
    }
  };

  return {
    heading,
    cardinalDirection,
    hasCompassSensor,
    setGpsHeading,
    setManualHeading: (deg: number) => {
      const normalized = ((deg % 360) + 360) % 360;
      if (headingRef.current !== normalized) {
        headingRef.current = normalized;
        setHeading(normalized);
        setCardinalDirection(getCardinal(normalized));
      }
    },
  };
}
