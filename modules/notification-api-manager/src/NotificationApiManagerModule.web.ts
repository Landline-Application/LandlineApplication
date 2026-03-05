import { NativeModule, registerWebModule } from 'expo';

type NotificationApiManagerModuleEvents = {
  onChange: (params: { value: string }) => void;
};

class NotificationApiManagerModule extends NativeModule<NotificationApiManagerModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }

  // Notification Permission (Web stubs - not supported)
  hasPostPermission() {
    return false;
  }
  async requestPostPermission() {
    return false;
  }
  createChannel() {
    return false;
  }
  notify() {
    return false;
  }

  // Notification Listener (Web stubs - not supported)
  hasNotificationListenerPermission() {
    return false;
  }
  async requestNotificationListenerPermission() {
    return false;
  }
  setLandlineMode() {
    return false;
  }
  isLandlineModeActive() {
    return false;
  }
  async getLoggedNotifications() {
    return [];
  }
  clearLoggedNotifications() {
    return false;
  }

  // Auto-Reply (Web stubs - not supported)
  isAutoReplyEnabled() {
    return false;
  }
  setAutoReplyEnabled() {
    return false;
  }
  setReplyMessage() {
    return false;
  }
  getReplyMessage() {
    return '';
  }
  setAllowedApps() {
    return false;
  }
  getAllowedApps() {
    return [];
  }
  async getReplyHistory() {
    return [];
  }
  clearReplyHistory() {
    return false;
  }
  isServiceRunning() {
    return false;
  }
  async getActiveNotifications() {
    return [];
  }

  // Data Management
  async clearAllData() {
    return false;
  }
}

export default registerWebModule(NotificationApiManagerModule, 'NotificationApiManagerModule');
