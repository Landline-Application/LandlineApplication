import * as React from 'react';

import { requireNativeView } from 'expo';

import { NotificationApiManagerViewProps } from './NotificationApiManager.types';

const NativeView: React.ComponentType<NotificationApiManagerViewProps> =
  requireNativeView('NotificationApiManager');

export default function NotificationApiManagerView(props: NotificationApiManagerViewProps) {
  return <NativeView {...props} />;
}
