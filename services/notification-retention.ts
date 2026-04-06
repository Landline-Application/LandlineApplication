import NotificationApiManager from '@/modules/notification-api-manager';
import { STORAGE_KEYS } from '@/utils/storage/storage-keys';
import { StorageManager } from '@/utils/storage/storage-manager';

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

/**
 * Get the current retention period setting
 * @returns Retention period in days (0 = keep forever, default = 30)
 */
export async function getRetentionPeriod(): Promise<RetentionDays> {
  try {
    const value = await StorageManager.getItem<number>(STORAGE_KEYS.NOTIFICATION_RETENTION_DAYS);
    // Check if it's a valid retention option
    if (value !== null && RETENTION_OPTIONS.some((opt) => opt.value === value)) {
      return value as RetentionDays;
    }
    return DEFAULT_RETENTION_DAYS;
  } catch {
    return DEFAULT_RETENTION_DAYS;
  }
}

/**
 * Set the retention period and reset last cleanup timestamp
 * This gives the user a full grace period before any cleanup occurs
 */
export async function setRetentionPeriod(days: RetentionDays): Promise<void> {
  try {
    await StorageManager.setItem(STORAGE_KEYS.NOTIFICATION_RETENTION_DAYS, days);
    // Reset last cleanup to now so user gets the full period
    await StorageManager.setItem(STORAGE_KEYS.NOTIFICATION_LAST_CLEANUP, Date.now());
  } catch (error) {
    console.error('Error setting retention period:', error);
    throw error;
  }
}

/**
 * Initialize retention settings for a fresh install
 * Sets default retention (30 days) and lastCleanup to now
 */
export async function initializeRetentionSettings(): Promise<void> {
  try {
    const existing = await StorageManager.getItem<number>(STORAGE_KEYS.NOTIFICATION_RETENTION_DAYS);
    if (existing === null) {
      // Fresh install - set defaults
      await StorageManager.setItem(
        STORAGE_KEYS.NOTIFICATION_RETENTION_DAYS,
        DEFAULT_RETENTION_DAYS,
      );
      await StorageManager.setItem(STORAGE_KEYS.NOTIFICATION_LAST_CLEANUP, Date.now());
    }
  } catch (error) {
    console.error('Error initializing retention settings:', error);
  }
}

/**
 * Get the timestamp of the last successful cleanup
 */
export async function getLastCleanupTimestamp(): Promise<Date | null> {
  try {
    const timestamp = await StorageManager.getItem<number>(STORAGE_KEYS.NOTIFICATION_LAST_CLEANUP);
    if (timestamp) {
      return new Date(timestamp);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Update the last cleanup timestamp to now
 */
export async function updateLastCleanupTimestamp(): Promise<void> {
  try {
    await StorageManager.setItem(STORAGE_KEYS.NOTIFICATION_LAST_CLEANUP, Date.now());
  } catch (error) {
    console.error('Error updating last cleanup timestamp:', error);
  }
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

    // Update last cleanup timestamp
    await updateLastCleanupTimestamp();

    return { cleaned: true, deletedCount };
  } catch (error) {
    console.error('Error running cleanup:', error);
    return { cleaned: false, deletedCount: 0 };
  }
}
