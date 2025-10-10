import { NativeModule, requireNativeModule } from "expo";

import {
  AppInfo,
  DndManagerModuleEvents,
  DndState,
  InterruptionFilterConstants,
  NotificationPermissionResult,
} from "./DndManager.types";

declare class DndManagerModule extends NativeModule<DndManagerModuleEvents> {
  hasPermission(): boolean;
  requestPermission(): Promise<boolean>;
  getCurrentState(): DndState;
  setDNDEnabled(enabled: boolean): Promise<DndState>;
  setInterruptionFilter(filter: number): Promise<DndState>;
  getAllInstalledApps(includeSystemApps: boolean): Promise<AppInfo[]>;
  getAppNotificationStatus(
    packageName: string
  ): Promise<NotificationPermissionResult>;
  openAppNotificationSettings(packageName: string): Promise<boolean>;
  getInterruptionFilterConstants(): InterruptionFilterConstants;
}

export default requireNativeModule<DndManagerModule>("DndManager");
