# Background Service Store Implementation Plan

## Overview

Create a Zustand store to manage background service state and interactions, following the existing patterns used in `useLandlineStore` and `useAutoReplyStore`.

## Current Architecture

### Existing Stores

- **use-landline-store.ts** - Manages Landline Mode, calls BackgroundServiceManager internally
- **use-auto-reply-store.ts** - Manages Auto-Reply settings and state

### BackgroundServiceManager Module

Exposes functions for:

- Foreground service control
- WorkManager scheduling
- Battery optimization management
- System utilities (Doze mode, Android version)

## Proposed Store Structure

```typescript
interface BackgroundServiceState {
  // State
  isForegroundServiceRunning: boolean;
  isBackgroundWorkScheduled: boolean;
  isBatteryOptimizationIgnored: boolean;
  isDozeMode: boolean;
  androidVersion: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  checkStatus: () => void;
  startForegroundService: (title: string, message: string) => Promise<void>;
  stopForegroundService: () => Promise<void>;
  scheduleBackgroundWork: (intervalMinutes: number) => Promise<void>;
  cancelBackgroundWork: () => Promise<void>;
  requestBatteryOptimization: () => Promise<void>;
  openBatterySettings: () => Promise<void>;
  clearError: () => void;
}
```

## Benefits

1. **Consistency** - Matches existing architecture patterns
2. **State Management** - Reactive UI updates when state changes
3. **Encapsulation** - Hide complexity of native calls
4. **Reusability** - Multiple components can access the same state
5. **Error Handling** - Centralized error management

## Implementation Tasks

1. ✅ Create `hooks/use-background-service-store.ts`
2. ✅ Implement state management similar to existing stores
3. ✅ Update `app/(tabs)/debug-tools.tsx` to use the new store
4. ⏳ Consider refactoring `useLandlineStore` to use the service store

## Open Questions

1. **Store Integration**: Should `useLandlineStore` use the new background service store instead of calling `BackgroundServiceManager` directly?
   - Pro: Single source of truth for service state
   - Con: Adds dependency between stores

2. **WorkManager Interval**: What default interval for `scheduleBackgroundWork()`?
   - Android minimum: 15 minutes
   - Recommendation: Start with 15 minutes

3. **Service Notification Text**: Different messages for different contexts?
   - Debug tools manual start
   - Landline Mode activation
   - Background work scheduling

4. **Store Scope**: Should this store be:
   - Purely for debug/manual control?
   - Also manage services used by Landline Mode?
   - Recommendation: Start with debug control, refactor landline store later if needed

## UI Updates Completed

### Debug Tools Screen

- ✅ Updated auto-reply templates (5 options: Meeting, Vacation, Driving, Focus Time, Away)
- ✅ Updated app selection (3 options: All Apps, Messaging Only, WhatsApp Only)
- ✅ Added dynamic toggle buttons for Foreground Service
- ✅ Added dynamic toggle buttons for Background Work
- ✅ Added battery optimization disclaimer
- ✅ Removed redundant Test Notification button

### Button Behavior

- Dynamic title and color based on state
- Green (success) when action enables/starts
- Red (error) when action disables/stops
- Follows existing patterns from Landline Mode and Auto-Reply toggles

## Next Steps

1. Create the background service store
2. Wire up the store to debug tools
3. Test service control functionality
4. Decide on landline store integration
5. Consider adding service controls to main UI (optional)
