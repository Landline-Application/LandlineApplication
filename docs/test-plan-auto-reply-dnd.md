# Test Plan: Auto-Reply & DND Breakthrough (Emulator-Focused)

**Date:** 2026-04-07  
**Status:** Draft - Ready for Implementation  
**Related:** See `auto-reply-dnd-feature-spec.md` for feature specification

---

## Overview

This test plan focuses on verifying the auto-reply and DND breakthrough functionality using an **Android emulator**. Since emulators lack physical vibration motors and may have inconsistent audio routing, tests are designed around **verifiable behaviors** (logs, state, UI) rather than sensory feedback.

---

## Emulator Limitations & Workarounds

| Feature               | Emulator Reality                     | Workaround                                        |
| --------------------- | ------------------------------------ | ------------------------------------------------- |
| **Vibration**         | No physical motor                    | Verify via logs: "Vibration pattern triggered"    |
| **Sound**             | May not route to host audio          | Verify notification posted with `setSound()` flag |
| **DND Bypass**        | Behavior may differ from real device | Test notification appears despite DND settings    |
| **Real SMS/Contacts** | No real phone number                 | Use mock contacts with test notifications         |

---

## Phase 1: Foundation Testing

### Test 1.1: Notification Interception

**Setup:** Enable Landline Mode, send test notification

**Steps:**

```bash
# Via Android Studio terminal or adb
adb shell am startservice -a android.intent.action.MAIN \
  -n expo.modules.notificationapimanager/.LandlineNotificationListenerService
```

**Verification:**

- [ ] Check `landline_notifications` SharedPreferences log entry created
- [ ] Verify notification appears in app's "Notebook" view
- [ ] Check log format: `timestamp|packageName|appName|title|text|...`

### Test 1.2: Standard Suppression

**Setup:** Enable DND filter, app NOT in whitelist

**Verification:**

- [ ] Notification log entry created (silent logging works)
- [ ] Notification does NOT appear in Android status bar (cancelled)
- [ ] Auto-reply triggered (if enabled for this contact)
- [ ] No "emergency alert" notification posted

### Test 1.3: Allowed App Pass-Through

**Setup:** Add WhatsApp to allowed packages list

**Verification:**

- [ ] Notification appears in Android status bar
- [ ] Notification logged in Landline notebook
- [ ] `cancelNotification()` was NOT called (check via debug logs)

---

## Phase 2: Emergency Contact Breakthrough

### Test 2.1: Emergency Contact Detection

**Setup:** Add test contact "+1234567890" to emergency list

**Test Notification:**

```kotlin
// Via test helper or debug screen
val testNotification = Notification.Builder(context, "test_channel")
    .setContentTitle("+1 (234) 567-890")  // Emergency number in title
    .setContentText("Test emergency message")
    .build()
```

**Verification:**

- [ ] `isFromEmergencyContact()` returns `true` (check via logcat)
- [ ] `postEmergencyAlert()` called (verify via log: "Posting emergency alert")
- [ ] Emergency notification channel created with `IMPORTANCE_HIGH`
- [ ] Notification posted with `setBypassDnd(true)` flag
- [ ] Notification appears in status bar despite DND

### Test 2.2: Non-Emergency Contact

**Setup:** Same as 2.1 but use different number "+9999999999"

**Verification:**

- [ ] `isFromEmergencyContact()` returns `false`
- [ ] `cancelNotification()` called (suppressed)
- [ ] No emergency alert posted
- [ ] Standard logging only

### Test 2.3: Phone Number Normalization

**Setup:** Add emergency contact with formatting "(123) 456-7890"

**Test Cases:**

- "+1 (123) 456-7890" → Should match ✓
- "123-456-7890" → Should match ✓
- "123.456.7890" → Should match ✓
- "4567890" → Should NOT match (too short) ✓

**Verification:**

- [ ] Check `normalizeDigits()` function logs
- [ ] Verify matching logic works with various formats

---

## Phase 3: Priority Contact "Text Twice" Breakthrough

### Test 3.1: Tracker State Management

**Setup:** Add contact "+1111111111" as priority with 2-text threshold, 5-min window

**Test Sequence:**

1. Send text #1 from +1111111111
2. Check tracker state within 30 seconds
3. Send text #2 from +1111111111 (within window)
4. Check tracker state
5. Wait 6 minutes
6. Send text #3 from +1111111111

**Verification:**

- [ ] After #1: Tracker shows `textCount: 1`, `firstTextTimestamp` set
- [ ] After #2: `textCount: 2`, breakthrough triggered, notification posted
- [ ] After #3 (outside window): New tracker entry, `textCount: 1` (reset)

### Test 3.2: Per-Contact Isolation

**Setup:** Priority contact A (+1111111111) and Priority contact B (+2222222222)

**Test Sequence:**

1. Text from A
2. Text from B (within window)
3. Text from A again

**Verification:**

- [ ] Both contacts have separate tracker entries
- [ ] A's second text triggers breakthrough (count=2 for A)
- [ ] B's first text does NOT trigger breakthrough (count=1 for B)

### Test 3.3: Threshold Configuration

**Setup:** Change threshold to 3 texts

**Test Sequence:**

- Text #1: No breakthrough
- Text #2: No breakthrough
- Text #3: Breakthrough ✓

**Verification:**

- [ ] Breakthrough only on 3rd text
- [ ] Tracker respects `textCountThreshold` value

---

## Phase 4: Auto-Reply Group Logic

### Test 4.1: Group Matching

**Setup:** Create groups:

- "Work": Contact A, Message: "In a meeting"
- "Family": Contact B, Message: "Focusing, call if urgent"
- Default: "I'll reply later"

**Test Cases:**

- Text from Contact A → Reply: "In a meeting"
- Text from Contact B → Reply: "Focusing, call if urgent"
- Text from Contact C (no group) → Reply: "I'll reply later"

**Verification:**

- [ ] Check auto-reply history log for correct message sent
- [ ] Verify `findMatchingGroup()` returns correct group ID
- [ ] Default group applied to unmatched contacts

### Test 4.2: Blocked List

**Setup:** Add Contact D to blocked list

**Verification:**

- [ ] Text from D → No auto-reply sent
- [ ] Text from D → Not logged (or logged as blocked)
- [ ] No tracker entry created

---

## Phase 5: Integration Flow

### Test 5.1: Full DND + Priority Flow

**Scenario:** Landline Mode ON, DND active, Priority contact texts twice

**Expected Flow:**

```
Text #1:
├── Check breakthrough rules → Priority, count=1 < threshold
├── Update tracker: count=1, timestamp=now
├── Check auto-reply groups → Send group message
├── Log notification
└── Suppress (cancelNotification)

Text #2 (within window):
├── Check breakthrough rules → Priority, count=2 >= threshold
├── Post breakthrough notification (bypass DND)
├── Do NOT auto-reply (breakthrough = urgent, skip auto-reply?)
└── Log notification
```

**Questions to Resolve:**

1. Should we still auto-reply on breakthrough texts? (Probably no)
2. Should the breakthrough notification include "This person texted twice" context?

---

## Phase 6: Edge Cases & Error Handling

### Test 6.1: Rapid Fire Texts

**Setup:** Send 5 texts from same priority contact within 10 seconds

**Verification:**

- [ ] Tracker increments correctly (not race conditions)
- [ ] Breakthrough on 2nd text
- [ ] 3rd, 4th, 5th texts also breakthrough (already above threshold)
- [ ] No duplicate notifications for same text

### Test 6.2: App Restart During Window

**Setup:**

1. Send text #1 (tracker saved to ephemeral storage)
2. Kill and restart app
3. Send text #2

**Expected:** Text #2 treated as first text (tracker reset)

**Verification:**

- [ ] Tracker map cleared on restart
- [ ] New tracker entry created for text #2
- [ ] No breakthrough (count=1)

### Test 6.3: Invalid Phone Numbers

**Test Cases:**

- Empty string ""
- "unknown"
- "Facebook User"
- "+123" (too short)

**Verification:**

- [ ] Graceful handling (no crash)
- [ ] Treated as non-emergency/non-priority
- [ ] Falls through to default auto-reply group

---

## Emulator-Specific Test Tools

### Debug Screen Commands

Add to your debug screen (`app/debug/tools.tsx`):

```typescript
// Test notification injection
const testEmergencyContact = () => {
  NotificationApiManager.postTestNotification({
    title: '+1234567890',
    text: 'Test emergency message',
    packageName: 'com.whatsapp',
  });
};

// Check tracker state
const getTrackerState = () => {
  return NotificationApiManager.getBreakthroughTracker();
};

// Force reset tracker
const resetTracker = () => {
  NotificationApiManager.clearBreakthroughTracker();
};
```

### Logcat Filters

```bash
# Watch Landline notification logs
adb logcat -s LandlineNotificationListenerService:D

# Watch all notification service activity
adb logcat -s NotificationService:D *:S
```

---

## Success Criteria Summary

| Component             | Test                   | Pass Criteria                           |
| --------------------- | ---------------------- | --------------------------------------- |
| **Suppression**       | Standard notification  | Logged, not shown in status bar         |
| **Emergency**         | Emergency contact text | Posted with bypass DND flag             |
| **Priority Tracking** | 2 texts in window      | Tracker increments, breakthrough on 2nd |
| **Auto-Reply Groups** | Group member texts     | Correct message sent per group          |
| **Blocked**           | Blocked contact texts  | No reply, no log, suppressed            |

---

## Open Implementation Questions

1. **Auto-reply on breakthrough?** When someone breaks through via "text twice", should we still send auto-reply, or skip it since they're already alerting the user?

2. **Tracker persistence?** Should the "text twice" tracker survive app restarts? (Currently ephemeral)

3. **Visual differentiation?** Should breakthrough notifications look different (color/icon) from normal notifications?

4. **Emulator audio verification?** Do you want me to add a debug toast or log entry that explicitly states "SOUND WOULD PLAY HERE" for emulator testing?

---

## Related Documents

- `auto-reply-dnd-feature-spec.md` - Feature specification
- `future_enhancements.md` - Broader roadmap
- `testing_auto_reply.md` - Existing auto-reply testing guide
