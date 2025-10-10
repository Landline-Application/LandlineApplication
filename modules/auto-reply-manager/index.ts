import AutoReplyManagerModule from "./src/AutoReplyManagerModule";

import type {
  AutoReplyResult,
  NotificationInfo,
  ReplyHistoryItem,
} from "./src/AutoReplyManager.types";
export * from "./src/AutoReplyManager.types";

export function isListenerEnabled(): boolean {
  return AutoReplyManagerModule.isListenerEnabled();
}

export function requestListenerPermission(): Promise<AutoReplyResult> {
  return AutoReplyManagerModule.requestListenerPermission();
}

export function isAutoReplyEnabled(): boolean {
  return AutoReplyManagerModule.isAutoReplyEnabled();
}

export function setAutoReplyEnabled(
  enabled: boolean,
): Promise<AutoReplyResult> {
  return AutoReplyManagerModule.setAutoReplyEnabled(enabled);
}

export function setReplyMessage(message: string): Promise<AutoReplyResult> {
  return AutoReplyManagerModule.setReplyMessage(message);
}

export function getReplyMessage(): string {
  return AutoReplyManagerModule.getReplyMessage();
}

export function setAllowedApps(
  packageNames: string[],
): Promise<AutoReplyResult> {
  return AutoReplyManagerModule.setAllowedApps(packageNames);
}

export function getAllowedApps(): string[] {
  return AutoReplyManagerModule.getAllowedApps();
}

export function isServiceRunning(): boolean {
  return AutoReplyManagerModule.isServiceRunning();
}

export function getActiveNotifications(): Promise<NotificationInfo[]> {
  return AutoReplyManagerModule.getActiveNotifications();
}

export function sendTestNotification(
  senderName: string,
  message: string,
): Promise<AutoReplyResult> {
  return AutoReplyManagerModule.sendTestNotification(senderName, message);
}

export function getReplyHistory(): ReplyHistoryItem[] {
  return AutoReplyManagerModule.getReplyHistory();
}

export function clearReplyHistory(): Promise<AutoReplyResult> {
  return AutoReplyManagerModule.clearReplyHistory();
}
