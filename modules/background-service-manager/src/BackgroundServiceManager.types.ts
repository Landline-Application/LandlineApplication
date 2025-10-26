/**
 * Type definitions for Background Service Manager module
 */

export type AndroidVersionInfo = {
  sdkInt: number;
  release: string;
  codename: string;
};

export type TaskType = 'notification_check' | string;

export interface BackgroundServiceManagerModuleType {
  // Foreground Service
  startForegroundService(title: string, message: string): boolean;
  stopForegroundService(): boolean;
  isForegroundServiceRunning(): boolean;

  // WorkManager (Battery-efficient background tasks)
  scheduleBackgroundWork(intervalMinutes: number, taskType: TaskType): boolean;
  cancelBackgroundWork(): boolean;
  isBackgroundWorkScheduled(): boolean;

  // Battery Optimization
  isIgnoringBatteryOptimizations(): boolean;
  requestIgnoreBatteryOptimizations(): Promise<boolean>;
  openBatteryOptimizationSettings(): Promise<boolean>;

  // Utility
  getAndroidVersion(): AndroidVersionInfo;
  isDeviceIdleMode(): boolean;
}

