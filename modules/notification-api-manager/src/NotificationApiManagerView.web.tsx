import * as React from 'react';

import { NotificationApiManagerViewProps } from './NotificationApiManager.types';

export default function NotificationApiManagerView(props: NotificationApiManagerViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
