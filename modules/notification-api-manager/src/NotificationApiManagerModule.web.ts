import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './NotificationApiManager.types';

type NotificationApiManagerModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class NotificationApiManagerModule extends NativeModule<NotificationApiManagerModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(NotificationApiManagerModule, 'NotificationApiManagerModule');
