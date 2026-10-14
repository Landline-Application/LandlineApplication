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
  removeLoggedNotifications() {
    return 0;
  }

  isNotificationFilterEnabled() {
    return false;
  }
  setNotificationFilterEnabled() {
    return false;
  }
  getAllowedNotificationPackages() {
    return [];
  }
  setAllowedNotificationPackages() {
    return false;
  }
  getEmergencyPhoneNumbers() {
    return [];
  }
  setEmergencyPhoneNumbers() {
    return false;
  }
  isNotificationFilterConfigured() {
    return false;
  }

  isRepeatCallBypassEnabled() {
    return true;
  }
  setRepeatCallBypassEnabled() {
    return false;
  }
  getRepeatCallBypassWindowMs() {
    return 7 * 60 * 1000;
  }
  setRepeatCallBypassWindowMs() {
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

  // Emergency contacts (web stubs)
  setEmergencyContactsJson() {
    return false;
  }
  getEmergencyContactsJson() {
    return '[]';
  }

  // Recurring schedules (web stubs)
  getLandlineSchedulesJson() {
    return '[]';
  }
  setLandlineSchedulesJson() {
    return false;
  }
  noteLandlineScheduleManualOverride() {
    return false;
  }
  canScheduleExactAlarms() {
    return false;
  }
  requestExactAlarmPermission() {
    return false;
  }
  getScheduleSessionStartMs() {
    return 0;
  }
  consumePendingScheduleSession() {
    return { startMs: 0, endMs: 0 };
  }
  ensureLandlineSchedulesArmed() {
    return false;
  }

  // Data Management
  async clearAllData() {
    return false;
  }
}

export default registerWebModule(NotificationApiManagerModule, 'NotificationApiManagerModule');

export function areLandlineSchedulesSupported() {
  return false;
}
export function getLandlineSchedules() {
  return [];
}
export function setLandlineSchedules() {
  return false;
}
export function noteLandlineScheduleManualOverride() {}
export function canScheduleExactAlarms() {
  return false;
}
export function requestExactAlarmPermission() {
  return false;
}
export function getScheduleSessionStartMs() {
  return 0;
}
export function consumePendingScheduleSession() {
  return { startMs: 0, endMs: 0 };
}
export function ensureLandlineSchedulesArmed() {}
export function addLandlineScheduleListener() {
  return null;
}
