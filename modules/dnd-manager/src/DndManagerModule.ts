import { NativeModule, requireNativeModule } from 'expo'

import { DndManagerModuleEvents } from './DndManager.types'

declare class DndManagerModule extends NativeModule<DndManagerModuleEvents> {
  getDNDStatus(): Promise<boolean>
  getDNDSettings(): Promise<{ enabled: boolean; mode: string }>
  openDNDSettings(): Promise<boolean>
  requestDNDPermissions(): Promise<boolean>
}

// This call loads the native module object from the JSI.
export default requireNativeModule<DndManagerModule>('DndManager')
