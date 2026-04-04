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
  hasSmsPermission(): boolean;
  requestSmsNotificationPermission(): Promise<boolean>;
  setLandlineMode(isActive: boolean): boolean;
  isLandlineModeActive(): boolean;
  getLoggedNotifications(): Promise<any[]>;
  clearLoggedNotifications(): boolean;
  // Notification permissions: allowed apps + emergency numbers during Landline Mode
  isNotificationFilterEnabled(): boolean;
  setNotificationFilterEnabled(enabled: boolean): boolean;
  getAllowedNotificationPackages(): string[];
  setAllowedNotificationPackages(packageNames: string[]): boolean;
  getEmergencyPhoneNumbers(): string[];
  setEmergencyPhoneNumbers(phoneNumbers: string[]): boolean;
  isNotificationFilterConfigured(): boolean;
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
  // Data Management
  clearAllData(): Promise<boolean>;
};

// Stale dev clients may omit newer native methods; avoid crashing until `expo run:android` picks up Kotlin.
const Native = requireNativeModule('NotificationApiManager') as NotificationApiNativeModule & {
  [key: string]: unknown;
};

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

export function requestSmsNotificationPermission() {
  return Native.requestSmsNotificationPermission();
}

export function hasSmsPermission() {
  return Native.hasSmsPermission();
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

export function isNotificationFilterEnabled() {
  const fn = Native.isNotificationFilterEnabled;
  return typeof fn === 'function' ? fn.call(Native) : false;
}

export function setNotificationFilterEnabled(enabled: boolean) {
  const fn = Native.setNotificationFilterEnabled;
  return typeof fn === 'function' ? fn.call(Native, enabled) : false;
}

export function getAllowedNotificationPackages() {
  const fn = Native.getAllowedNotificationPackages;
  return typeof fn === 'function' ? fn.call(Native) : [];
}

export function setAllowedNotificationPackages(packageNames: string[]) {
  const fn = Native.setAllowedNotificationPackages;
  return typeof fn === 'function' ? fn.call(Native, packageNames) : false;
}

export function getEmergencyPhoneNumbers() {
  const fn = Native.getEmergencyPhoneNumbers;
  return typeof fn === 'function' ? fn.call(Native) : [];
}

export function setEmergencyPhoneNumbers(phoneNumbers: string[]) {
  const fn = Native.setEmergencyPhoneNumbers;
  return typeof fn === 'function' ? fn.call(Native, phoneNumbers) : false;
}

export function isNotificationFilterConfigured() {
  const fn = Native.isNotificationFilterConfigured;
  return typeof fn === 'function' ? fn.call(Native) : false;
}

/** True when notification permissions are on and at least one bypass app or emergency number is set. */
export function isNotificationFilterEffective() {
  return isNotificationFilterEnabled() && isNotificationFilterConfigured();
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
  hasSmsPermission,
  requestSmsNotificationPermission,
  setLandlineMode,
  isLandlineModeActive,
  getLoggedNotifications,
  clearLoggedNotifications,
  isNotificationFilterEnabled,
  setNotificationFilterEnabled,
  getAllowedNotificationPackages,
  setAllowedNotificationPackages,
  getEmergencyPhoneNumbers,
  setEmergencyPhoneNumbers,
  isNotificationFilterConfigured,
  isNotificationFilterEffective,
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
  clearAllData,
};
