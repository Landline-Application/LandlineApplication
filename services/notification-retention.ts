import { usePreferencesStore } from '@/hooks/use-preferences-store';
import NotificationApiManager from '@/modules/notification-api-manager';

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
 * Get the current retention period setting.
 * Reads directly from the preferences store — instant and offline-safe.
 */
export function getRetentionPeriod(): RetentionDays {
  const days = usePreferencesStore.getState().notificationRetentionDays;
  if (RETENTION_OPTIONS.some((opt) => opt.value === days)) {
    return days as RetentionDays;
  }
  return DEFAULT_RETENTION_DAYS;
}

/**
 * Set the retention period.
 * Updates the preferences store (which persists locally and syncs to Firestore).
 */
export function setRetentionPeriod(days: RetentionDays): void {
  usePreferencesStore.getState().setRetentionDays(days);
  // Reset last cleanup to now so the user gets the full new period
  cachedLastCleanup = new Date();
}

/**
 * Initialize retention settings for a fresh install.
 * Only sets the last cleanup timestamp locally (device-specific).
 */
export async function initializeRetentionSettings(): Promise<void> {
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
    const retentionDays = getRetentionPeriod();

    if (retentionDays === 0) {
      return false;
    }

    const lastCleanup = await getLastCleanupTimestamp();

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
 */
export async function cleanupExpiredNotifications(retentionDays: RetentionDays): Promise<number> {
  try {
    if (retentionDays === 0) {
      return 0;
    }

    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
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

    const retentionDays = getRetentionPeriod();
    const deletedCount = await cleanupExpiredNotifications(retentionDays);

    await updateLastCleanupTimestamp();

    return { cleaned: true, deletedCount };
  } catch (error) {
    console.error('Error running cleanup:', error);
    return { cleaned: false, deletedCount: 0 };
  }
}
