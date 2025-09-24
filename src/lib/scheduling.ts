import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';
import { addDays, addHours, startOfDay, setHours } from 'date-fns';
import type { CadenceConfig } from '../types/post';

export interface ScheduleSlots {
  scheduledAt: number; // When to publish (epoch ms)
  createAt: number;    // When to create draft (epoch ms)
}

/**
 * Computes the next publishing slot and draft creation time
 * based on cadence configuration and current time
 */
export function computeNextSlots(
  nowISO: string, 
  config: CadenceConfig
): ScheduleSlots {
  // Parse current time in the target timezone
  const now = new Date(nowISO);
  const zonedNow = utcToZonedTime(now, config.timezone);
  
  // Set the publish hour for today
  const todayAtPublishHour = setHours(startOfDay(zonedNow), config.publishHour);
  
  // If we've already passed today's publish hour, start from tomorrow
  const basePublishTime = todayAtPublishHour < zonedNow 
    ? addDays(todayAtPublishHour, 1)
    : todayAtPublishHour;
  
  // Find the next slot that aligns with our interval
  // Using January 1, 2025 as anchor date for consistent intervals
  const anchor = new Date('2025-01-01T00:00:00');
  const anchorInTimezone = utcToZonedTime(anchor, config.timezone);
  const anchorAtPublishHour = setHours(startOfDay(anchorInTimezone), config.publishHour);
  
  const daysSinceAnchor = Math.floor(
    (basePublishTime.getTime() - anchorAtPublishHour.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const remainder = daysSinceAnchor % config.intervalDays;
  const nextSlotDate = remainder === 0 
    ? basePublishTime 
    : addDays(basePublishTime, config.intervalDays - remainder);
  
  // Convert back to UTC for storage
  const scheduledAtUTC = zonedTimeToUtc(nextSlotDate, config.timezone);
  const createAtUTC = zonedTimeToUtc(
    addHours(nextSlotDate, -config.draftLeadHours), 
    config.timezone
  );
  
  return {
    scheduledAt: scheduledAtUTC.getTime(),
    createAt: createAtUTC.getTime()
  };
}

/**
 * Formats a timestamp for display in the configured timezone
 */
export function formatScheduledTime(
  timestamp: number, 
  timezone: string, 
  formatStr: string = 'PPP p'
): string {
  const date = new Date(timestamp);
  const zonedDate = utcToZonedTime(date, timezone);
  return format(zonedDate, formatStr, { timeZone: timezone });
}

/**
 * Checks if a scheduled time has passed
 */
export function isScheduledTimePassed(scheduledAt: number): boolean {
  return Date.now() >= scheduledAt;
}

/**
 * Gets the time remaining until a scheduled publish
 */
export function getTimeUntilPublish(scheduledAt: number): {
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
} {
  const now = Date.now();
  const diff = scheduledAt - now;
  
  if (diff < 0) {
    return { days: 0, hours: 0, minutes: 0, isPast: true };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, isPast: false };
}

/**
 * Generates a human-readable relative time string
 */
export function getRelativeTimeString(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  
  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  
  if (diff < 0) {
    // Past
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  } else {
    // Future
    if (minutes < 60) return `in ${minutes} minutes`;
    if (hours < 24) return `in ${hours} hours`;
    return `in ${days} days`;
  }
}

/**
 * Default cadence configuration
 */
export const DEFAULT_CADENCE_CONFIG: CadenceConfig = {
  intervalDays: 2,
  publishHour: 10, // 10:00 AM
  timezone: 'America/Toronto',
  draftLeadHours: 24, // Create draft 24 hours before publish
  reminderHours: 4 // Send reminder 4 hours before publish if not approved
};
