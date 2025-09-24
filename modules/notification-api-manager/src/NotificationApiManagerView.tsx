import { requireNativeView } from 'expo';
import * as React from 'react';

import { NotificationApiManagerViewProps } from './NotificationApiManager.types';

const NativeView: React.ComponentType<NotificationApiManagerViewProps> =
  requireNativeView('NotificationApiManager');

export default function NotificationApiManagerView(props: NotificationApiManagerViewProps) {
  return <NativeView {...props} />;
}
