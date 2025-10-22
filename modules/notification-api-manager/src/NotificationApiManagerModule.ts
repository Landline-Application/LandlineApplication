import { requireNativeModule } from "expo-modules-core";

/**
 * This shape must match what your Kotlin module exposes:
 * - hasPostPermission(): boolean
 * - requestPostPermission(): Promise<boolean>
 * - createChannel(id, name, importance): boolean
 * - notify(title, body, channelId, notificationId): boolean
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
};

const Native: NotificationApiNativeModule =
    requireNativeModule("NotificationApiManager");

// JS-friendly exports (same names you use in your screen)
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

export default {
    hasPostPermission,
    requestPostPermission,
    createChannel,
    notify,
};