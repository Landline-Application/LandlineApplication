// Reexport the native module. On web, it will be resolved to NotificationApiManagerModule.web.ts
// and on native platforms to NotificationApiManagerModule.ts
export { default } from "./src/NotificationApiManagerModule";
export * from "./src/NotificationApiManagerModule";
export { default as NotificationApiManagerView } from "./src/NotificationApiManagerView";
