import { NativeModule, requireNativeModule } from "expo";

import {
  AutoReplyManagerModuleEvents,
  AutoReplyResult,
  NotificationInfo,
  ReplyHistoryItem,
} from "./AutoReplyManager.types";

declare class AutoReplyManagerModule extends NativeModule<AutoReplyManagerModuleEvents> {
  isListenerEnabled(): boolean;
  requestListenerPermission(): Promise<AutoReplyResult>;
  isAutoReplyEnabled(): boolean;
  setAutoReplyEnabled(enabled: boolean): Promise<AutoReplyResult>;
  setReplyMessage(message: string): Promise<AutoReplyResult>;
  getReplyMessage(): string;
  setAllowedApps(packageNames: string[]): Promise<AutoReplyResult>;
  getAllowedApps(): string[];
  isServiceRunning(): boolean;
  getActiveNotifications(): Promise<NotificationInfo[]>;
  sendTestNotification(senderName: string, message: string): Promise<AutoReplyResult>;
  getReplyHistory(): ReplyHistoryItem[];
  clearReplyHistory(): Promise<AutoReplyResult>;
}

export default requireNativeModule<AutoReplyManagerModule>("AutoReplyManager");
