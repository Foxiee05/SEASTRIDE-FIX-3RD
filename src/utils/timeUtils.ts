/**
 * Utilities for in-app time calculations in UTC+7 (Indochina Time)
 * for Raid Boss and Treasure Hunt systems.
 */

import { SeaMonsterId } from '../types';

export const UTC7_OFFSET_HOURS = 7;
export const UTC7_OFFSET_MS = UTC7_OFFSET_HOURS * 60 * 60 * 1000;

export interface Utc7DateParts {
  year: number;
  month: number; // 0-11
  date: number;  // 1-31
  day: number;   // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  hours: number; // 0-23
  minutes: number;
  seconds: number;
  milliseconds: number;
}

/**
 * Break down an absolute epoch timestamp into its UTC+7 calendar components.
 */
export function getUtc7Parts(timestamp: number = Date.now()): Utc7DateParts {
  const d = new Date(timestamp + UTC7_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    date: d.getUTCDate(),
    day: d.getUTCDay(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    seconds: d.getUTCSeconds(),
    milliseconds: d.getUTCMilliseconds(),
  };
}

/**
 * Construct an absolute epoch timestamp from UTC+7 date & time components.
 */
export function makeUtc7Timestamp(
  year: number,
  month: number,
  date: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0
): number {
  return Date.UTC(year, month, date, hours, minutes, seconds, ms) - UTC7_OFFSET_MS;
}

/**
 * Returns a YYYY-MM-DD string representing the calendar date in UTC+7.
 */
export function getUtc7DateString(timestamp: number = Date.now()): string {
  const p = getUtc7Parts(timestamp);
  const m = String(p.month + 1).padStart(2, '0');
  const d = String(p.date).padStart(2, '0');
  return `${p.year}-${m}-${d}`;
}

/**
 * Calculate the next daily reset time (00:00:00 UTC+7 midnight).
 * Resets every 24 hours at 00:00:00 UTC+7.
 */
export function getNextTreasureResetTimeUtc7(timestamp: number = Date.now()): number {
  const parts = getUtc7Parts(timestamp);
  // Next 00:00:00 UTC+7 is the start of date + 1
  return makeUtc7Timestamp(parts.year, parts.month, parts.date + 1, 0, 0, 0, 0);
}

export interface RaidSessionInfo {
  isActive: boolean;
  sessionId: string; // Unique ID for this session, e.g. "raid_session_2026_09_11"
  sessionStartTime: number; // Friday 00:00:00 UTC+7
  sessionEndTime: number;   // Monday 23:59:59.999 UTC+7
  nextSessionStartTime: number; // Following Friday 00:00:00 UTC+7
  msUntilEnd: number;
  msUntilNextStart: number;
}

/**
 * Raid boss session rules:
 * Appears from 00:00:00 AM Friday till next week Monday 23:59:59 PM (UTC+7).
 * Days in UTC+7:
 * - Friday (day 5): Active
 * - Saturday (day 6): Active
 * - Sunday (day 0): Active
 * - Monday (day 1): Active (ends at 23:59:59.999)
 * - Tuesday (day 2): Inactive (waiting for next Friday)
 * - Wednesday (day 3): Inactive
 * - Thursday (day 4): Inactive
 */
export function getRaidSessionInfo(timestamp: number = Date.now()): RaidSessionInfo {
  const parts = getUtc7Parts(timestamp);
  const day = parts.day;

  // Active if Friday (5), Saturday (6), Sunday (0), or Monday (1)
  const isActive = day === 5 || day === 6 || day === 0 || day === 1;

  if (isActive) {
    // Days elapsed since Friday 00:00:00 UTC+7
    const daysSinceFriday = day === 5 ? 0 : day === 6 ? 1 : day === 0 ? 2 : 3;
    const sessionStartTime = makeUtc7Timestamp(parts.year, parts.month, parts.date - daysSinceFriday, 0, 0, 0, 0);
    // Friday + 3 days = Monday at 23:59:59.999 UTC+7
    const sessionEndTime = makeUtc7Timestamp(parts.year, parts.month, parts.date - daysSinceFriday + 3, 23, 59, 59, 999);
    // Next session starts next Friday 00:00:00 UTC+7
    const nextSessionStartTime = makeUtc7Timestamp(parts.year, parts.month, parts.date - daysSinceFriday + 7, 0, 0, 0, 0);

    const startParts = getUtc7Parts(sessionStartTime);
    const sessionId = `raid_session_${startParts.year}_${String(startParts.month + 1).padStart(2, '0')}_${String(startParts.date).padStart(2, '0')}`;

    return {
      isActive: true,
      sessionId,
      sessionStartTime,
      sessionEndTime,
      nextSessionStartTime,
      msUntilEnd: Math.max(0, sessionEndTime - timestamp),
      msUntilNextStart: Math.max(0, nextSessionStartTime - timestamp),
    };
  } else {
    // Tuesday (2), Wednesday (3), Thursday (4)
    const daysUntilFriday = 5 - day;
    const nextSessionStartTime = makeUtc7Timestamp(parts.year, parts.month, parts.date + daysUntilFriday, 0, 0, 0, 0);
    const nextSessionEndTime = makeUtc7Timestamp(parts.year, parts.month, parts.date + daysUntilFriday + 3, 23, 59, 59, 999);

    const nextParts = getUtc7Parts(nextSessionStartTime);
    const sessionId = `raid_session_${nextParts.year}_${String(nextParts.month + 1).padStart(2, '0')}_${String(nextParts.date).padStart(2, '0')}`;

    return {
      isActive: false,
      sessionId,
      sessionStartTime: nextSessionStartTime,
      sessionEndTime: nextSessionEndTime,
      nextSessionStartTime,
      msUntilEnd: 0,
      msUntilNextStart: Math.max(0, nextSessionStartTime - timestamp),
    };
  }
}

/**
 * Deterministically pick ONE sea monster boss for a given session ID.
 * This guarantees the exact same random boss remains throughout the session.
 */
export function getDeterministicSessionBoss(sessionId: string): SeaMonsterId {
  const keys: SeaMonsterId[] = ['megalodon', 'siren', 'scylla', 'kraken'];
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = ((hash << 5) - hash) + sessionId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % keys.length;
  return keys[index];
}

/**
 * Format milliseconds into human-readable duration string:
 * "2d 14h 32m 10s" or "14h 32m 10s"
 */
export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
  }
  return `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
}
