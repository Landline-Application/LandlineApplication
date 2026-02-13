export type DndManagerModuleEvents = {
  onDNDStatusChanged: (state: DndState) => void;
};

export type DndState = {
  success: boolean;
  message: string;
  currentState?: number;
  ruleId?: string;
};

export type AppInfo = {
  packageName: string;
  appName: string;
  notificationsEnabled: boolean;
  isSystemApp: boolean;
};

export type NotificationPermissionResult = {
  success: boolean;
  message: string;
  notificationsEnabled?: boolean;
};

export enum InterruptionFilter {
  ALL = 1,
  PRIORITY = 2,
  NONE = 3,
  ALARMS = 4,
  UNKNOWN = 0,
}

export type InterruptionFilterConstants = {
  ALL: number;
  PRIORITY: number;
  NONE: number;
  ALARMS: number;
  UNKNOWN: number;
};
