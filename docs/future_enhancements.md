# Future Enhancements

## Real-time State Updates via Native Event Listeners

**Current Implementation:** The Zustand store (`hooks/useLandlineStore.ts`) uses 30-second polling to refresh notification data when Landline Mode is active. This works reliably but has a delay between when notifications arrive and when the UI updates.

**Proposed Enhancement:** Replace or supplement polling with native event listeners. When notifications arrive or Landline Mode state changes in the native Android layer, the native module would emit events that the Zustand store listens to, triggering immediate UI updates. This would require modifications to the `NotificationApiManager` native module to emit events (using React Native's `DeviceEventEmitter` or `NativeEventEmitter`), and updates to the Zustand store to subscribe to these events. The benefit would be instant UI updates without waiting for the next poll cycle, improving the user experience with more responsive state synchronization.

**Tradeoff:** Increased complexity in native code and event lifecycle management vs. better real-time responsiveness. Current polling approach is simpler and proven to work well for the 30-second refresh requirement.
