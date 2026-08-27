import { useState, useEffect } from "react";

const transparentCache = new Map<string, string>();

/**
 * Converts a JPG image with a light/white background into a PNG Data URL
 * with a transparent background and 100% OPAQUE artwork (no translucency).
 */
export function processCutoutImage(
  src: string,
  options: {
    threshold?: number;
    mode?: "white" | "edge";
    keepInternalGreenAsBlack?: boolean;
  } = {},
): Promise<string> {
  const threshold = options.threshold ?? 220;
  const mode = options.mode ?? "white";
  const keepInternalGreenAsBlack = options.keepInternalGreenAsBlack ?? true;
  const cacheKey = `${src}_${mode}_${threshold}_${keepInternalGreenAsBlack}`;

  if (transparentCache.has(cacheKey)) {
    return Promise.resolve(transparentCache.get(cacheKey)!);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];

        // Auto-detect green screen background from top-left pixel
        const isGreenScreen =
          (bgG > bgR + 25 && bgG > bgB + 25) || mode === "edge";

        if (isGreenScreen) {
          const W = canvas.width;
          const H = canvas.height;
          const totalPixels = W * H;
          const isBg = new Uint8Array(totalPixels);
          const queue = new Int32Array(totalPixels);
          let head = 0;
          let tail = 0;

          const isGreenCandidate = (idx4: number) => {
            const pr = data[idx4];
            const pg = data[idx4 + 1];
            const pb = data[idx4 + 2];
            const dist = Math.sqrt(
              Math.pow(pr - bgR, 2) +
                Math.pow(pg - bgG, 2) +
                Math.pow(pb - bgB, 2),
            );
            return (pg > pr + 12 && pg > pb + 12) || dist < 65;
          };

          // Seed border pixels
          for (let x = 0; x < W; x++) {
            let idx4 = x * 4;
            let idx = x;
            if (!isBg[idx] && isGreenCandidate(idx4)) {
              isBg[idx] = 1;
              queue[tail++] = idx;
            }
            idx4 = ((H - 1) * W + x) * 4;
            idx = (H - 1) * W + x;
            if (!isBg[idx] && isGreenCandidate(idx4)) {
              isBg[idx] = 1;
              queue[tail++] = idx;
            }
          }
          for (let y = 0; y < H; y++) {
            let idx4 = y * W * 4;
            let idx = y * W;
            if (!isBg[idx] && isGreenCandidate(idx4)) {
              isBg[idx] = 1;
              queue[tail++] = idx;
            }
            idx4 = (y * W + (W - 1)) * 4;
            idx = y * W + (W - 1);
            if (!isBg[idx] && isGreenCandidate(idx4)) {
              isBg[idx] = 1;
              queue[tail++] = idx;
            }
          }

          // BFS flood fill from exterior background seeds
          while (head < tail) {
            const current = queue[head++];
            const cx = current % W;
            const cy = (current / W) | 0;

            if (cx > 0) {
              const nIdx = current - 1;
              if (!isBg[nIdx] && isGreenCandidate(nIdx * 4)) {
                isBg[nIdx] = 1;
                queue[tail++] = nIdx;
              }
            }
            if (cx < W - 1) {
              const nIdx = current + 1;
              if (!isBg[nIdx] && isGreenCandidate(nIdx * 4)) {
                isBg[nIdx] = 1;
                queue[tail++] = nIdx;
              }
            }
            if (cy > 0) {
              const nIdx = current - W;
              if (!isBg[nIdx] && isGreenCandidate(nIdx * 4)) {
                isBg[nIdx] = 1;
                queue[tail++] = nIdx;
              }
            }
            if (cy < H - 1) {
              const nIdx = current + W;
              if (!isBg[nIdx] && isGreenCandidate(nIdx * 4)) {
                isBg[nIdx] = 1;
                queue[tail++] = nIdx;
              }
            }
          }

          // Process pixels: exterior background -> transparent, internal green (skull logo) -> black
          for (let i = 0; i < data.length; i += 4) {
            const pixelIdx = (i / 4) | 0;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (isBg[pixelIdx] === 1) {
              data[i + 3] = 0; // Exterior green background removed completely
            } else {
              // Inside the asset
              if (g > r + 15 && g > b + 15) {
                if (keepInternalGreenAsBlack) {
                  // Internal green (like the skull logo on level 1 sail) -> fill with black
                  data[i] = 15;
                  data[i + 1] = 15;
                  data[i + 2] = 15;
                  data[i + 3] = 255;
                } else {
                  data[i + 3] = 0; // Make internal transparent areas truly transparent
                }
              } else {
                data[i + 3] = 255; // Solid opaque asset
              }
            }
          }
        } else {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (r > threshold && g > threshold && b > threshold) {
              data[i + 3] = 0; // Completely transparent background
            } else {
              const avg = (r + g + b) / 3;
              if (avg > threshold - 15) {
                const alpha = Math.max(
                  0,
                  255 - ((avg - (threshold - 15)) / 15) * 255,
                );
                data[i + 3] = Math.round(alpha);
              } else {
                data[i + 3] = 255; // 100% OPAQUE ship/item
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        transparentCache.set(cacheKey, dataUrl);
        resolve(dataUrl);
      } catch (e) {
        console.error("Cutout processing failed:", e);
        resolve(src);
      }
    };

    img.onerror = () => resolve(src);
    img.src = src;
  });
}

/**
 * Custom React hook to get the processed cutout URL for an image.
 */
export function useCutoutImage(
  src?: string,
  options: {
    threshold?: number;
    mode?: "white" | "edge";
    keepInternalGreenAsBlack?: boolean;
  } = {},
): string {
  if (!src) return "";
  const cacheKey = `${src}_${options.mode || "white"}_${options.threshold || 220}_${options.keepInternalGreenAsBlack ?? true}`;
  const [cutoutUrl, setCutoutUrl] = useState<string>(
    transparentCache.get(cacheKey) || src,
  );

  useEffect(() => {
    let isMounted = true;
    if (transparentCache.has(cacheKey)) {
      const cached = transparentCache.get(cacheKey)!;
      setCutoutUrl((prev) => (prev === cached ? prev : cached));
    } else {
      processCutoutImage(src, options).then((url) => {
        if (isMounted) {
          setCutoutUrl(url);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [src, options.mode, options.threshold, cacheKey]);

  return cutoutUrl;
}

export const useTransparentCutout = useCutoutImage;

/**
 * Pre-warm cutout processing for a list of image URLs.
 */
export function preloadCutouts(
  srcs: string[],
  options: {
    threshold?: number;
    mode?: "white" | "edge";
    keepInternalGreenAsBlack?: boolean;
  } = {},
): void {
  srcs.forEach((src) => {
    if (src) {
      const cacheKey = `${src}_${options.mode || "white"}_${options.threshold || 220}_${options.keepInternalGreenAsBlack ?? true}`;
      if (!transparentCache.has(cacheKey)) {
        processCutoutImage(src, options);
      }
    }
  });
}
