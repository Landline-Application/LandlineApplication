export type AutoReplyManagerModuleEvents = {
  onNotificationReceived: (notification: NotificationInfo) => void;
  onAutoReplySent: (info: { packageName: string; message: string }) => void;
};

export type AutoReplyResult = {
  success: boolean;
  message: string;
};

export type NotificationInfo = {
  packageName: string;
  title?: string;
  text?: string;
  timestamp: number;
  hasReplyAction: boolean;
};

export type ReplyHistoryItem = {
  message: string;
  timestamp: number;
};
