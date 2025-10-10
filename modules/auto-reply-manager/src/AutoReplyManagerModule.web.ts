import { registerWebModule, NativeModule } from "expo";

import {
  AutoReplyManagerModuleEvents,
  AutoReplyResult,
  NotificationInfo,
} from "./AutoReplyManager.types";

class AutoReplyManagerModule extends NativeModule<AutoReplyManagerModuleEvents> {
  isListenerEnabled(): boolean {
    console.warn("AutoReplyManager is not supported on web");
    return false;
  }

  async requestListenerPermission(): Promise<AutoReplyResult> {
    return {
      success: false,
      message: "AutoReplyManager is not supported on web",
    };
  }

  isAutoReplyEnabled(): boolean {
    return false;
  }

  async setAutoReplyEnabled(_enabled: boolean): Promise<AutoReplyResult> {
    return {
      success: false,
      message: "AutoReplyManager is not supported on web",
    };
  }

  async setReplyMessage(_message: string): Promise<AutoReplyResult> {
    return {
      success: false,
      message: "AutoReplyManager is not supported on web",
    };
  }

  getReplyMessage(): string {
    return "";
  }

  async setAllowedApps(_packageNames: string[]): Promise<AutoReplyResult> {
    return {
      success: false,
      message: "AutoReplyManager is not supported on web",
    };
  }

  getAllowedApps(): string[] {
    return [];
  }

  isServiceRunning(): boolean {
    return false;
  }

  async getActiveNotifications(): Promise<NotificationInfo[]> {
    return [];
  }

  async sendTestNotification(_senderName: string, _message: string): Promise<AutoReplyResult> {
    return {
      success: false,
      message: "Test notifications not supported on web",
    };
  }
}

export default registerWebModule(AutoReplyManagerModule, "AutoReplyManager");
