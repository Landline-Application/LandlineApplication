import { requireNativeModule } from "expo-modules-core";

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
 */
type NotificationApiNativeModule = {
    hasPostPermission(): boolean;
    requestPostPermission(): Promise<boolean>;
    createChannel(id: string, name: string, importance: number): boolean;
    notify(
        title: string,
        body: string,
        channelId: string,
        notificationId: number
    ): boolean;
    // Notification Listener (Landline Mode)
    hasNotificationListenerPermission(): boolean;
    requestNotificationListenerPermission(): Promise<boolean>;
    setLandlineMode(isActive: boolean): boolean;
    isLandlineModeActive(): boolean;
    getLoggedNotifications(): any[];
    clearLoggedNotifications(): boolean;
};

const Native: NotificationApiNativeModule =
    requireNativeModule("NotificationApiManager");

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

export function notify(
    title: string,
    body: string,
    channelId: string,
    notificationId: number
) {
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
};
