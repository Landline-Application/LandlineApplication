import DNDManagerModule from "./src/DndManagerModule";

import type {
  AppInfo,
  DndState,
  InterruptionFilterConstants,
  NotificationPermissionResult,
} from "./src/DndManager.types";
export * from "./src/DndManager.types";

export function hasPermission(): boolean {
  return DNDManagerModule.hasPermission();
}

export function requestPermission(): Promise<boolean> {
  return DNDManagerModule.requestPermission();
}

export function getCurrentState(): DndState {
  return DNDManagerModule.getCurrentState();
}

export function setDNDEnabled(enabled: boolean): Promise<DndState> {
  return DNDManagerModule.setDNDEnabled(enabled);
}

export function setInterruptionFilter(filter: number): Promise<DndState> {
  return DNDManagerModule.setInterruptionFilter(filter);
}

export function getAllInstalledApps(
  includeSystemApps: boolean = false,
): Promise<AppInfo[]> {
  return DNDManagerModule.getAllInstalledApps(includeSystemApps);
}

export function getAppNotificationStatus(
  packageName: string,
): Promise<NotificationPermissionResult> {
  return DNDManagerModule.getAppNotificationStatus(packageName);
}

export function openAppNotificationSettings(
  packageName: string,
): Promise<boolean> {
  return DNDManagerModule.openAppNotificationSettings(packageName);
}

export function getInterruptionFilterConstants(): InterruptionFilterConstants {
  return DNDManagerModule.getInterruptionFilterConstants();
}
