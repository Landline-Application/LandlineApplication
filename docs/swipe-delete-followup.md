# Swipe-to-Delete Follow-up (PR #63)

## UI / UX Issues

The goal is for users to feel oriented — they should discover the gesture naturally, understand
what it does, and feel confident it worked (or didn't).

### Discoverability
- **No swipe affordance** — there is no visual cue that rows are swipeable. Users are unlikely
  to find this by accident. Options: a subtle trailing arrow/chevron icon on each row, a brief
  peek animation on first load, or a one-time tooltip on the log screen.

### Gesture feel
- The red delete reveal animates in from the right but needs visual polish. Review `friction`,
  snap point, and `swipeDeleteTrack`/`swipeDeleteButton` sizing.
- **Haptic fires on button tap, not on swipe** — firing `haptics.medium()` when the swipe
  threshold is crossed (`onSwipeableWillOpen`) rather than on the button press gives earlier,
  more natural feedback that confirms the gesture before the user lifts their finger.

### After delete
- **No undo** — deletion is immediate and permanent. A Snackbar-style undo toast (standard
  Android pattern) would reduce anxiety around accidental swipes, especially with no
  confirmation dialog.
- **Silent failure is disorienting** — if delete returns `false`, an Alert fires but the row
  stays swiped open. The row should snap closed on failure (`swipeableRef.close()`) and then
  show the error, so the UI returns to a consistent state.

## Code Issues

1. **No close-on-delete** — After pressing delete, the swipe action stays open until
   `refreshNotifications` resolves and re-renders. Close the swipeable optimistically before
   the async call via `swipeableRef.close()`.

2. **Missing `ref` on `Swipeable`** — Without a ref there is no way to programmatically close
   the row. If delete fails (`ok === false`), the row stays swiped open in an inconsistent
   state. Add a `useRef<Swipeable>` per row and call `.close()` on failure too.

3. **Duplicate `ScrollView` import** — `ScrollView` is still imported from `react-native` in
   `components/notifications/notebook-log-view.tsx` (line 9) but is no longer used; it has
   been replaced by `GestureScrollView`. Remove it.

4. **`overflow: 'visible'` side effect** — `notificationGroup` previously used
   `overflow: 'hidden'`. The change to `visible` is required for the swipe reveal, but
   border-radius clipping on the group container needs a visual check.

5. **No iOS native stub** — The `Platform.OS !== 'android'` guard is fine for now. If iOS
   support is added later, `NotificationApiManagerModule.web.ts` will need an iOS counterpart.
   Add a `// TODO(ios): add native stub when iOS log persistence is implemented` comment there.

6. **Accessibility** — Swipe hint text is good. Add `accessibilityActions={[{ name: 'delete',
   label: 'Delete notification' }]}` and an `onAccessibilityAction` handler to the row
   `Pressable` so users who cannot swipe can still delete via accessibility services.

7. **No pending state during delete** — While `onDeleteNotification` is in flight the delete
   button remains pressable. A fast double-tap could fire two concurrent deletions against the
   same row. Disable the button or track a local `deleting` flag until the Promise resolves.

8. **SharedPreferences read-modify-write performance** — `deleteLoggedNotification` reads the
   entire log blob, splits, filters, and re-joins on every delete. For large log histories this
   could be slow. Worth noting as a future concern if log volume grows significantly.

9. **Trailing newline consistency (Kotlin)** — `kept.joinToString("\n")` produces no trailing
   newline. If `logNotification` or `getNotificationLogs` writes/reads lines as newline-
   terminated (rather than newline-separated), the last entry after a delete could be parsed
   incorrectly. Verify the log reader handles both cases.
