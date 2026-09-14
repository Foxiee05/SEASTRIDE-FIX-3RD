// src/utils/analytics.ts

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export type EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Safely calls window.gtag('event', ...)
 * - Does nothing without errors if gtag is not available (e.g. blocked by ad blocker)
 * - Never blocks gameplay, account loading, multiplayer, or UI rendering.
 */
export const trackEvent = (eventName: string, params?: EventParams) => {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      // Clean undefined values
      const cleanParams: Record<string, any> = {};
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            cleanParams[key] = value;
          }
        });
      }
      window.gtag('event', eventName, Object.keys(cleanParams).length > 0 ? cleanParams : undefined);
    }
  } catch (err) {
    // Silently catch tracking errors to never block gameplay
    console.warn('Analytics tracking failed:', err);
  }
};

/**
 * Tracks a screen view.
 * Prevent duplicate screen events when a component rerenders without an actual screen change.
 */
let lastScreen = '';
export const trackScreenView = (screenName: string) => {
  if (lastScreen === screenName) return;
  lastScreen = screenName;
  trackEvent('screen_view', { screen_name: screenName });
};
