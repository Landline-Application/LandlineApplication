import { NativeModule, requireNativeModule } from "expo";

import { DndManagerModuleEvents, DndState } from "./DndManager.types";

declare class DndManagerModule extends NativeModule<DndManagerModuleEvents> {
  hasPermission(): boolean;
  requestPermission(): Promise<boolean>;
  getCurrentState(): DndState;
  setDNDEnabled(enabled: boolean): Promise<DndState>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<DndManagerModule>("DndManager");
