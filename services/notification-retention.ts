import NotificationApiManager from '@/modules/notification-api-manager';
import { auth } from '@/utils/firebase/auth';
import {
  type UserPreferences,
  getUserPreferences,
  mergeUserPreferences,
} from '@/utils/firebase/user-service';

/**
 * Retention period options for notification cleanup
 * 0 = Keep forever (no auto-deletion)
 */
export const RETENTION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 0, label: 'Keep forever' },
] as const;

export type RetentionDays = (typeof RETENTION_OPTIONS)[number]['value'];

export const DEFAULT_RETENTION_DAYS: RetentionDays = 30;

// In-memory cache for last cleanup timestamp (device-specific, not synced)
let cachedLastCleanup: Date | null = null;

/**
 * Get the current user's UID or null if not logged in
 */
function getCurrentUserId(): string | null {
  return auth.currentUser?.uid ?? null;
}

/**
 * Get the current retention period setting from Firebase
 * Falls back to default if not set or user not logged in
 * @returns Retention period in days (0 = keep forever, default = 30)
 */
export async function getRetentionPeriod(): Promise<RetentionDays> {
  try {
    const uid = getCurrentUserId();
    if (!uid) {
      return DEFAULT_RETENTION_DAYS;
    }

    const prefs = await getUserPreferences(uid);
    const value = prefs?.notificationRetentionDays;

    // Check if it's a valid retention option
    if (value !== undefined && RETENTION_OPTIONS.some((opt) => opt.value === value)) {
      return value as RetentionDays;
    }
    return DEFAULT_RETENTION_DAYS;
  } catch (error) {
    console.error('Error getting retention period from Firebase:', error);
    return DEFAULT_RETENTION_DAYS;
  }
}

/**
 * Set the retention period in Firebase
 * Also updates the last cleanup timestamp locally
 */
export async function setRetentionPeriod(days: RetentionDays): Promise<void> {
  try {
    const uid = getCurrentUserId();
    if (!uid) {
      throw new Error('User not logged in');
    }

    // Update Firebase
    await mergeUserPreferences(uid, { notificationRetentionDays: days });

    // Reset last cleanup to now so user gets the full period
    cachedLastCleanup = new Date();
  } catch (error) {
    console.error('Error setting retention period:', error);
    throw error;
  }
}

/**
 * Initialize retention settings for a fresh install
 * Only sets the last cleanup timestamp locally (device-specific)
 * Does NOT write default to Firebase - defaults are handled in code
 */
export async function initializeRetentionSettings(): Promise<void> {
  // Initialize last cleanup to now (device-specific, not synced)
  cachedLastCleanup = new Date();
}

/**
 * Get the timestamp of the last successful cleanup (device-specific, not synced)
 */
export async function getLastCleanupTimestamp(): Promise<Date | null> {
  return cachedLastCleanup;
}

/**
 * Update the last cleanup timestamp to now (device-specific, not synced)
 */
export async function updateLastCleanupTimestamp(): Promise<void> {
  cachedLastCleanup = new Date();
}

/**
 * Check if cleanup should run based on retention period and last cleanup time
 */
export async function shouldRunCleanup(): Promise<boolean> {
  try {
    const retentionDays = await getRetentionPeriod();

    // If set to keep forever, never run cleanup
    if (retentionDays === 0) {
      return false;
    }

    const lastCleanup = await getLastCleanupTimestamp();

    // If never cleaned before, run cleanup
    if (!lastCleanup) {
      return true;
    }

    const now = Date.now();
    const daysSinceCleanup = (now - lastCleanup.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceCleanup >= retentionDays;
  } catch (error) {
    console.error('Error checking if cleanup should run:', error);
    return false;
  }
}

/**
 * Calculate the next cleanup date based on retention period and last cleanup
 * @returns Date of next cleanup, or null if retention is "forever"
 */
export function calculateNextCleanupDate(
  retentionDays: RetentionDays,
  lastCleanup: Date | null,
): Date | null {
  if (retentionDays === 0) {
    return null; // Keep forever
  }

  const baseTime = lastCleanup ? lastCleanup.getTime() : Date.now();
  return new Date(baseTime + retentionDays * 24 * 60 * 60 * 1000);
}

/**
 * Format the next cleanup date as a relative string for display
 * Examples: "In 22 days", "Tomorrow", "Today", "In 1 day"
 */
export function formatNextCleanupRelative(
  retentionDays: RetentionDays,
  lastCleanup: Date | null,
): string {
  if (retentionDays === 0) {
    return 'Kept forever';
  }

  const nextCleanup = calculateNextCleanupDate(retentionDays, lastCleanup);
  if (!nextCleanup) {
    return 'Kept forever';
  }

  const now = Date.now();
  const diffMs = nextCleanup.getTime() - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else {
    return `In ${diffDays} days`;
  }
}

/**
 * Get the label for a retention period value
 */
export function getRetentionLabel(days: RetentionDays): string {
  const option = RETENTION_OPTIONS.find((opt) => opt.value === days);
  return option?.label || `${days} days`;
}

/**
 * Clean up notifications older than the retention period
 * Returns the number of deleted notifications
 *
 * Uses the native deleteNotificationsOlderThan method for efficient cleanup
 */
export async function cleanupExpiredNotifications(retentionDays: RetentionDays): Promise<number> {
  try {
    // If set to keep forever, don't delete anything
    if (retentionDays === 0) {
      return 0;
    }

    // Calculate cutoff timestamp
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    // Use native method to delete notifications older than cutoff
    const deletedCount = await NotificationApiManager.deleteNotificationsOlderThan(cutoffTime);

    if (deletedCount > 0) {
      console.log(
        `Notification cleanup: deleted ${deletedCount} notifications older than ${retentionDays} days`,
      );
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    return 0;
  }
}

/**
 * Run cleanup if needed based on retention settings
 * Returns result with whether cleanup ran and how many were deleted
 */
export async function runCleanupIfNeeded(): Promise<{
  cleaned: boolean;
  deletedCount: number;
}> {
  try {
    const shouldClean = await shouldRunCleanup();

    if (!shouldClean) {
      return { cleaned: false, deletedCount: 0 };
    }

    const retentionDays = await getRetentionPeriod();
    const deletedCount = await cleanupExpiredNotifications(retentionDays);

    // Update last cleanup timestamp (device-specific)
    await updateLastCleanupTimestamp();

    return { cleaned: true, deletedCount };
  } catch (error) {
    console.error('Error running cleanup:', error);
    return { cleaned: false, deletedCount: 0 };
  }
}

/**
 * Sync retention preference from Firestore to local state
 * Called when user signs in or when preferences are updated remotely
 */
export async function syncRetentionFromRemote(prefs: UserPreferences): Promise<void> {
  if (prefs.notificationRetentionDays !== undefined) {
    // The retention period is now stored in Firebase, so we just validate it
    const value = prefs.notificationRetentionDays;
    if (!RETENTION_OPTIONS.some((opt) => opt.value === value)) {
      console.warn('Invalid retention period from remote:', value);
    }
  }
}
