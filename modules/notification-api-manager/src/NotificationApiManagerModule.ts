import { EventEmitter, requireNativeModule, type EventSubscription } from 'expo-modules-core';

import { parseLandlineSchedules, type LandlineSchedule } from '@/utils/landline-schedule';

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
 * - removeLoggedNotifications(keys): number
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
export type NotificationLogKey = {
  timestamp?: number;
  packageName: string;
  postTime: number;
  id: number;
};

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
  removeLoggedNotifications(keys: NotificationLogKey[]): number;
  // Notification permissions: allowed apps + emergency numbers during Landline Mode
  isNotificationFilterEnabled(): boolean;
  setNotificationFilterEnabled(enabled: boolean): boolean;
  getAllowedNotificationPackages(): string[];
  setAllowedNotificationPackages(packageNames: string[]): boolean;
  getEmergencyPhoneNumbers(): string[];
  setEmergencyPhoneNumbers(phoneNumbers: string[]): boolean;
  isNotificationFilterConfigured(): boolean;
  // Repeat-call bypass (Android incoming call notifications)
  isRepeatCallBypassEnabled(): boolean;
  setRepeatCallBypassEnabled(enabled: boolean): boolean;
  getRepeatCallBypassWindowMs(): number;
  setRepeatCallBypassWindowMs(windowMs: number): boolean;
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
  // Notification Retention - delete notifications older than cutoff timestamp
  deleteNotificationsOlderThan(cutoffTimestamp: number): Promise<number>;
  // Recurring Landline Mode schedules (Android)
  getLandlineSchedulesJson(): string;
  setLandlineSchedulesJson(json: string): boolean;
  noteLandlineScheduleManualOverride(): boolean;
  canScheduleExactAlarms(): boolean;
  requestExactAlarmPermission(): boolean;
  getScheduleSessionStartMs(): number;
  consumePendingScheduleSession(): { startMs: number; endMs: number };
  ensureLandlineSchedulesArmed(): boolean;
  addListener(eventName: string, listener: (event: { active: boolean }) => void): EventSubscription;
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

function callScheduleNative<T>(name: string, fallback: T, ...args: unknown[]): T {
  const fn = Native[name];
  if (typeof fn !== 'function') return fallback;
  try {
    return (fn as (...params: unknown[]) => T).apply(Native, args);
  } catch (error) {
    console.warn(`${name} failed`, error);
    return fallback;
  }
}

export function areLandlineSchedulesSupported(): boolean {
  return typeof Native.getLandlineSchedulesJson === 'function';
}

export function getLandlineSchedules(): LandlineSchedule[] {
  const json = callScheduleNative('getLandlineSchedulesJson', '[]');
  return parseLandlineSchedules(typeof json === 'string' ? json : '[]');
}

export function setLandlineSchedules(schedules: LandlineSchedule[]): boolean {
  return callScheduleNative<boolean>('setLandlineSchedulesJson', false, JSON.stringify(schedules));
}

export function noteLandlineScheduleManualOverride(): void {
  callScheduleNative('noteLandlineScheduleManualOverride', false);
}

export function canScheduleExactAlarms(): boolean {
  return callScheduleNative<boolean>('canScheduleExactAlarms', true);
}

export function requestExactAlarmPermission(): boolean {
  return callScheduleNative<boolean>('requestExactAlarmPermission', false);
}

export function getScheduleSessionStartMs(): number {
  const value = callScheduleNative('getScheduleSessionStartMs', 0);
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function consumePendingScheduleSession(): { startMs: number; endMs: number } {
  const value = callScheduleNative('consumePendingScheduleSession', { startMs: 0, endMs: 0 });
  if (!value || typeof value !== 'object') return { startMs: 0, endMs: 0 };
  const startMs = 'startMs' in value && typeof value.startMs === 'number' ? value.startMs : 0;
  const endMs = 'endMs' in value && typeof value.endMs === 'number' ? value.endMs : 0;
  return { startMs, endMs };
}

export function ensureLandlineSchedulesArmed(): void {
  callScheduleNative('ensureLandlineSchedulesArmed', false);
}

export function addLandlineScheduleListener(
  listener: (event: { active: boolean }) => void,
): { remove: () => void } | null {
  if (typeof Native.addListener !== 'function') return null;
  try {
    const emitter = new EventEmitter(Native);
    const subscription = emitter.addListener('onLandlineScheduleApplied', listener);
    return { remove: () => subscription.remove() };
  } catch (error) {
    console.warn('Landline schedule listener unavailable', error);
    return null;
  }
}

export function getLoggedNotifications() {
  return Native.getLoggedNotifications();
}

export function clearLoggedNotifications() {
  return Native.clearLoggedNotifications();
}

export function removeLoggedNotifications(keys: NotificationLogKey[]) {
  const fn = Native.removeLoggedNotifications;
  if (typeof fn === 'function') {
    return fn.call(Native, keys);
  }
  console.warn('removeLoggedNotifications native method not available');
  return 0;
}

export function toNotificationLogKey(entry: {
  timestamp?: number;
  packageName: string;
  postTime: number;
  id: number;
}): NotificationLogKey {
  return {
    timestamp: entry.timestamp,
    packageName: entry.packageName,
    postTime: entry.postTime,
    id: entry.id,
  };
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

export function isRepeatCallBypassEnabled() {
  const fn = Native.isRepeatCallBypassEnabled;
  return typeof fn === 'function' ? fn.call(Native) : true;
}

export function setRepeatCallBypassEnabled(enabled: boolean) {
  const fn = Native.setRepeatCallBypassEnabled;
  return typeof fn === 'function' ? fn.call(Native, enabled) : false;
}

export function getRepeatCallBypassWindowMs() {
  const fn = Native.getRepeatCallBypassWindowMs;
  return typeof fn === 'function' ? fn.call(Native) : 7 * 60 * 1000;
}

export function setRepeatCallBypassWindowMs(windowMs: number) {
  const fn = Native.setRepeatCallBypassWindowMs;
  return typeof fn === 'function' ? fn.call(Native, windowMs) : false;
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

export function deleteNotificationsOlderThan(cutoffTimestamp: number): Promise<number> {
  const fn = Native.deleteNotificationsOlderThan;
  if (typeof fn === 'function') {
    return fn.call(Native, cutoffTimestamp);
  }
  // Fallback: return 0 if native method not available (stale dev client)
  console.warn('deleteNotificationsOlderThan native method not available');
  return Promise.resolve(0);
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
  areLandlineSchedulesSupported,
  getLandlineSchedules,
  setLandlineSchedules,
  noteLandlineScheduleManualOverride,
  canScheduleExactAlarms,
  requestExactAlarmPermission,
  getScheduleSessionStartMs,
  consumePendingScheduleSession,
  ensureLandlineSchedulesArmed,
  addLandlineScheduleListener,
  getLoggedNotifications,
  clearLoggedNotifications,
  removeLoggedNotifications,
  toNotificationLogKey,
  isNotificationFilterEnabled,
  setNotificationFilterEnabled,
  getAllowedNotificationPackages,
  setAllowedNotificationPackages,
  getEmergencyPhoneNumbers,
  setEmergencyPhoneNumbers,
  isNotificationFilterConfigured,
  isNotificationFilterEffective,
  isRepeatCallBypassEnabled,
  setRepeatCallBypassEnabled,
  getRepeatCallBypassWindowMs,
  setRepeatCallBypassWindowMs,
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
  deleteNotificationsOlderThan,
};
