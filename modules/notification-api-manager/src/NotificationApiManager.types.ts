export type NotificationApiManagerModuleType = {
    hello(): string;

    // Android 13+; true below 33
    hasPostPermission(): boolean;
    requestPostPermission(): Promise<boolean>;

    // O+ channel mgmt
    createChannel(id: string, name: string, importance: number): boolean;

    // Post a notification
    notify(
        title: string,
        body: string,
        channelId: string,
        notificationId: number
    ): boolean;
};