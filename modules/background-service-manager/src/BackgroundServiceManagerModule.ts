import { requireNativeModule } from 'expo-modules-core';
import type { BackgroundServiceManagerModuleType, TaskType, AndroidVersionInfo } from './BackgroundServiceManager.types';

const Native: BackgroundServiceManagerModuleType = requireNativeModule('BackgroundServiceManager');

// ============================================================
// FOREGROUND SERVICE FUNCTIONS
// ============================================================

/**
 * Start the foreground service with a visible notification.
 * This is required for any background work that should continue when the app is not visible.
 * 
 * @param title - Title for the notification
 * @param message - Message for the notification
 * @returns true if service started successfully
 */
export function startForegroundService(title: string, message: string): boolean {
  return Native.startForegroundService(title, message);
}

/**
 * Stop the foreground service
 * @returns true if service stopped successfully
 */
export function stopForegroundService(): boolean {
  return Native.stopForegroundService();
}

/**
 * Check if foreground service is currently running
 * @returns true if service is running
 */
export function isForegroundServiceRunning(): boolean {
  return Native.isForegroundServiceRunning();
}

// ============================================================
// WORKMANAGER FUNCTIONS (Battery-Efficient Background Tasks)
// ============================================================

/**
 * Schedule periodic background work using WorkManager.
 * WorkManager respects Doze mode and battery optimization settings.
 * 
 * Note: Minimum interval is 15 minutes (Android system requirement)
 * 
 * @param intervalMinutes - How often to run the task (minimum 15 minutes)
 * @param taskType - Type of task to perform (default: 'notification_check')
 * @returns true if work was scheduled successfully
 */
export function scheduleBackgroundWork(
  intervalMinutes: number,
  taskType: TaskType = 'notification_check'
): boolean {
  return Native.scheduleBackgroundWork(intervalMinutes, taskType);
}

/**
 * Cancel scheduled background work
 * @returns true if work was cancelled successfully
 */
export function cancelBackgroundWork(): boolean {
  return Native.cancelBackgroundWork();
}

/**
 * Check if background work is currently scheduled
 * @returns true if work is scheduled
 */
export function isBackgroundWorkScheduled(): boolean {
  return Native.isBackgroundWorkScheduled();
}

// ============================================================
// BATTERY OPTIMIZATION FUNCTIONS
// ============================================================

/**
 * Check if the app is ignoring battery optimizations.
 * When true, the app can run more freely in the background.
 * 
 * @returns true if app is ignoring battery optimizations
 */
export function isIgnoringBatteryOptimizations(): boolean {
  return Native.isIgnoringBatteryOptimizations();
}

/**
 * Request user to disable battery optimizations for this app.
 * 
 * ⚠️ WARNING: Only use if absolutely necessary for your app's core functionality.
 * Google Play may reject apps that abuse this permission.
 * 
 * @returns Promise that resolves to true if request was successful
 */
export function requestIgnoreBatteryOptimizations(): Promise<boolean> {
  return Native.requestIgnoreBatteryOptimizations();
}

/**
 * Open battery optimization settings for the app.
 * This is less aggressive than requesting to ignore optimizations.
 * 
 * @returns Promise that resolves to true if settings opened successfully
 */
export function openBatteryOptimizationSettings(): Promise<boolean> {
  return Native.openBatteryOptimizationSettings();
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get Android version information
 * Useful for implementing conditional behavior based on Android version
 * 
 * @returns Object containing sdkInt, release, and codename
 */
export function getAndroidVersion(): AndroidVersionInfo {
  return Native.getAndroidVersion();
}

/**
 * Check if device is in Doze mode.
 * In Doze mode, background work is heavily restricted.
 * 
 * @returns true if device is in Doze mode
 */
export function isDeviceIdleMode(): boolean {
  return Native.isDeviceIdleMode();
}

// Default export with all functions
export default {
  startForegroundService,
  stopForegroundService,
  isForegroundServiceRunning,
  scheduleBackgroundWork,
  cancelBackgroundWork,
  isBackgroundWorkScheduled,
  isIgnoringBatteryOptimizations,
  requestIgnoreBatteryOptimizations,
  openBatteryOptimizationSettings,
  getAndroidVersion,
  isDeviceIdleMode,
};

