import { requireNativeModule } from 'expo-modules-core';

/**
 * This shape must match what your Kotlin module exposes:
 * - hasPostPermission(): boolean
 * - requestPostPermission(): Promise<boolean>
 * - createChannel(id, name, importance): boolean
 * - notify(title, body, channelId, notificationId): boolean
 * - hasNotificationListenerPermission(): boolean
 * - requestNotificationListenerPermission(): Promise<boolean>
 * - setLandlineMode(isActive: boolean): boolean
 * - isLandlineModeActive(): boolean
 * - getLoggedNotifications(): Array
 * - clearLoggedNotifications(): boolean
 * - isAutoReplyEnabled(): boolean
 * - setAutoReplyEnabled(enabled: boolean): boolean
 * - setReplyMessage(message: string): boolean
 * - getReplyMessage(): string
 * - setAllowedApps(packageNames: string[]): boolean
 * - getAllowedApps(): string[]
 * - getReplyHistory(): Array
 * - clearReplyHistory(): boolean
 * - isServiceRunning(): boolean
 * - getActiveNotifications(): Array
 * - clearAllData(): Promise<boolean>
 */
type NotificationApiNativeModule = {
  hasPostPermission(): boolean;
  requestPostPermission(): Promise<boolean>;
  createChannel(id: string, name: string, importance: number): boolean;
  notify(title: string, body: string, channelId: string, notificationId: number): boolean;
  // Notification Listener (Landline Mode)
  hasNotificationListenerPermission(): boolean;
  requestNotificationListenerPermission(): Promise<boolean>;
  setLandlineMode(isActive: boolean): boolean;
  isLandlineModeActive(): boolean;
  getLoggedNotifications(): Promise<any[]>;
  clearLoggedNotifications(): boolean;
  // Auto-Reply
  isAutoReplyEnabled(): boolean;
  setAutoReplyEnabled(enabled: boolean): boolean;
  setReplyMessage(message: string): boolean;
  getReplyMessage(): string;
  setAllowedApps(packageNames: string[]): boolean;
  getAllowedApps(): string[];
  getReplyHistory(): Promise<any[]>;
  clearReplyHistory(): boolean;
  isServiceRunning(): boolean;
  getActiveNotifications(): Promise<any[]>;
  // Emergency contacts (JSON array of { name, phone })
  setEmergencyContactsJson(json: string): boolean;
  getEmergencyContactsJson(): string;
  /** Legacy: replaces list with a single contact */
  setEmergencyContact(name: string, phone: string): boolean;
  /** Legacy: first contact if any */
  getEmergencyContact(): { name: string | null; phone: string | null };
  clearEmergencyContact(): boolean;
  // Data Management
  clearAllData(): Promise<boolean>;
};

const Native: NotificationApiNativeModule = requireNativeModule('NotificationApiManager');

// ============================================================
// NOTIFICATION PERMISSION
// ============================================================

export function hasPostPermission() {
  return Native.hasPostPermission();
}

export function requestPostPermission() {
  return Native.requestPostPermission();
}

export function createChannel(id: string, name: string, importance: number) {
  return Native.createChannel(id, name, importance);
}

export function notify(title: string, body: string, channelId: string, notificationId: number) {
  return Native.notify(title, body, channelId, notificationId);
}

// ============================================================
// NOTIFICATION LISTENER (Landline Mode)
// ============================================================

export function hasNotificationListenerPermission() {
  return Native.hasNotificationListenerPermission();
}

export function requestNotificationListenerPermission() {
  return Native.requestNotificationListenerPermission();
}

export function setLandlineMode(isActive: boolean) {
  return Native.setLandlineMode(isActive);
}

export function isLandlineModeActive() {
  return Native.isLandlineModeActive();
}

export function getLoggedNotifications() {
  return Native.getLoggedNotifications();
}

export function clearLoggedNotifications() {
  return Native.clearLoggedNotifications();
}

// ============================================================
// AUTO-REPLY
// ============================================================

export function isAutoReplyEnabled() {
  return Native.isAutoReplyEnabled();
}

export function setAutoReplyEnabled(enabled: boolean) {
  return Native.setAutoReplyEnabled(enabled);
}

export function setReplyMessage(message: string) {
  return Native.setReplyMessage(message);
}

export function getReplyMessage() {
  return Native.getReplyMessage();
}

export function setAllowedApps(packageNames: string[]) {
  return Native.setAllowedApps(packageNames);
}

export function getAllowedApps() {
  return Native.getAllowedApps();
}

export function getReplyHistory() {
  return Native.getReplyHistory();
}

export function clearReplyHistory() {
  return Native.clearReplyHistory();
}

export function isServiceRunning() {
  return Native.isServiceRunning();
}

export function getActiveNotifications() {
  return Native.getActiveNotifications();
}

// ============================================================
// EMERGENCY CONTACTS
// ============================================================

export type EmergencyContactEntry = { name: string; phone: string };

export function setEmergencyContactsJson(json: string) {
  return Native.setEmergencyContactsJson(json);
}

export function getEmergencyContactsJson() {
  return Native.getEmergencyContactsJson();
}

/** Parse native JSON; ignores invalid entries. */
export function parseEmergencyContactsJson(json: string): EmergencyContactEntry[] {
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    const out: EmergencyContactEntry[] = [];
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const phone = typeof o.phone === 'string' ? o.phone.trim() : '';
      if (!phone) continue;
      const name = typeof o.name === 'string' ? o.name.trim() : '';
      out.push({ name, phone });
    }
    return out;
  } catch {
    return [];
  }
}

export function setEmergencyContact(name: string, phone: string) {
  return Native.setEmergencyContact(name, phone);
}

export function getEmergencyContact() {
  return Native.getEmergencyContact();
}

export function clearEmergencyContact() {
  return Native.clearEmergencyContact();
}

// ============================================================
// DATA MANAGEMENT
// ============================================================

export function clearAllData() {
  return Native.clearAllData();
}

export default {
  hasPostPermission,
  requestPostPermission,
  createChannel,
  notify,
  hasNotificationListenerPermission,
  requestNotificationListenerPermission,
  setLandlineMode,
  isLandlineModeActive,
  getLoggedNotifications,
  clearLoggedNotifications,
  isAutoReplyEnabled,
  setAutoReplyEnabled,
  setReplyMessage,
  getReplyMessage,
  setAllowedApps,
  getAllowedApps,
  getReplyHistory,
  clearReplyHistory,
  isServiceRunning,
  getActiveNotifications,
  setEmergencyContactsJson,
  getEmergencyContactsJson,
  parseEmergencyContactsJson,
  setEmergencyContact,
  getEmergencyContact,
  clearEmergencyContact,
  clearAllData,
};
