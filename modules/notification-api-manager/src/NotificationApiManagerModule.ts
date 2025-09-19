import { NativeModule, requireNativeModule } from 'expo';

import { NotificationApiManagerModuleEvents } from './NotificationApiManager.types';

declare class NotificationApiManagerModule extends NativeModule<NotificationApiManagerModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NotificationApiManagerModule>('NotificationApiManager');
