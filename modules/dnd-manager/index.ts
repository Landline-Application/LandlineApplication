// Reexport the native module. On web, it will be resolved to DndManagerModule.web.ts
// and on native platforms to DndManagerModule.ts

import DNDManagerModule from './src/DndManagerModule'
export * from './src/DndManager.types'

export function openDNDSettings() {
  DNDManagerModule.openDNDSettings()
}

export function getDNDSettings() {
  return DNDManagerModule.getDNDSettings()
}

export function getDNDStatus() {
  return DNDManagerModule.getDNDStatus()
}

export function requestDNDPermissions() {
  return DNDManagerModule.requestDNDPermissions()
}
