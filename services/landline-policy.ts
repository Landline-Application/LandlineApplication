import * as DndManager from '@/modules/dnd-manager';

export interface LandlinePolicy {
  apply(): Promise<void>;
  restore(): Promise<void>;
}

export const landlinePolicy: LandlinePolicy = {
  async apply() {
    if (!DndManager.hasPermission()) {
      throw new Error('DND permission is required for Landline Mode');
    }
    const constants = DndManager.getInterruptionFilterConstants();
    DndManager.setLandlineNotificationPolicy();
    await DndManager.setInterruptionFilter(constants.PRIORITY);
  },
  async restore() {
    if (!DndManager.hasPermission()) return;
    DndManager.restoreNotificationPolicy();
    await DndManager.setDNDEnabled(false);
  },
};
