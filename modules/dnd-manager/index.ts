// Reexport the native module. On web, it will be resolved to DndManagerModule.web.ts
// and on native platforms to DndManagerModule.ts

import { DndState as DndResult } from "./src/DndManager.types";
import DNDManagerModule from "./src/DndManagerModule";
export * from "./src/DndManager.types";

export function hasPermission(): boolean {
  return DNDManagerModule.hasPermission();
}

export function requestPermission(): Promise<boolean> {
  return DNDManagerModule.requestPermission();
}

export function getCurrentState(): DndResult {
  return DNDManagerModule.getCurrentState();
}

export function setDNDEnabled(enabled: boolean): Promise<DndResult> {
  return DNDManagerModule.setDNDEnabled(enabled);
}
