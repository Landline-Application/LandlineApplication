# Auto-Reply & DND Breakthrough Feature Specification

**Date:** 2026-04-07  
**Status:** Requirements Gathered, Pending Implementation  
**Related:** See `future_enhancements.md` for broader roadmap

---

## Overview

Enable granular auto-reply rules and DND breakthrough capabilities based on contact groups and individual contact selection. This feature allows users to control who receives auto-replies and which contacts can break through Do Not Disturb mode.

---

## 1. Auto-Reply with Granular Recipients

### Recipient Selection Options

Users can configure auto-reply behavior at multiple granularity levels:

1. **All contacts** - Reply to everyone
2. **Contact groups** (Android contact groups - e.g., Work, Family)
3. **Individual contacts** (specific people)
4. **Blocked list** - Never reply to these contacts

### Message Scope

- Different auto-reply messages per group
- Example groups: Work, Family, Custom
- Default/fallback message for contacts not matching any specific group

### Proposed Data Model

```typescript
interface ContactRule {
  id: string;
  contactId?: string; // Expo Contacts ID
  phoneNumber?: string; // Normalized phone number (digits only)
  groupId?: string; // Android contact group ID
  ruleType: 'individual' | 'group';
}

interface AutoReplyGroup {
  id: string;
  name: string;
  message: string;
  contacts: ContactRule[];
  isDefault: boolean; // The fallback group for unmatched contacts
}
```

---

## 2. DND Breakthrough Rules

### Rule Types

| Rule                   | Trigger                                | Action                      |
| ---------------------- | -------------------------------------- | --------------------------- |
| **Emergency Contacts** | Any message from these contacts        | Immediate breakthrough      |
| **Priority Contacts**  | 2+ texts within configured time window | Breakthrough on 2nd+ text   |
| **Standard**           | Any message from non-priority contacts | Suppressed, auto-reply sent |
| **Blocked**            | Any message from blocked contacts      | Silently dropped            |

### Configuration

- **Time window** for text twice rule: 5min, 10min, 15min options
- **Count threshold:** Default 2 texts, configurable per contact

### Implementation Approach

**Handled by application layer, NOT Android system DND.**

The app already intercepts all notifications via LandlineNotificationListenerService. The breakthrough logic:

1. Incoming notification received
2. Extract sender phone number from notification
3. Check breakthrough rules for this contact
4. If emergency → post notification immediately
5. If repeat-text rule → check tracker cache
   - First text: Store timestamp, increment count, suppress
   - Subsequent text within window: If count >= threshold → breakthrough
6. If standard → suppress, send auto-reply, log to notebook
7. If blocked → cancel without logging or replying

### Proposed Data Model

```typescript
interface DndBreakthroughRule {
  contactId: string;
  ruleType: 'immediate' | 'repeat_text';
  repeatWindowMs: number; // e.g., 300000 for 5 minutes
  textCountThreshold: number; // e.g., 2 for text twice
}

interface BreakthroughTracker {
  contactId: string;
  firstTextTimestamp: number; // When first text arrived
  textCount: number; // Total texts in current window
  lastTextTimestamp: number; // For window reset logic
}
```

**Storage:** BreakthroughTracker is ephemeral (memory or short-lived SharedPreferences). DndBreakthroughRule is persistent configuration.

---

## 3. Architecture Notes

### DND Handling Strategy

Unlike typical DND apps that rely on Android's system-level interruption filters, Landline implements **application-level notification control**:

- All notifications are intercepted via NotificationListenerService
- The app calls cancelNotification() to suppress unwanted notifications
- Urgent notifications are re-posted via the app's own notification channel
- This approach works consistently across all Android versions and OEM customizations

**Advantages:**

- Full control over notification flow
- Not limited by Android's built-in Priority Contacts limitations
- Can implement complex logic (repeat-text patterns, time windows)
- Bypasses OEM-specific DND implementations

### Key Files to Modify

| File                                                                                | Purpose                              |
| ----------------------------------------------------------------------------------- | ------------------------------------ |
| modules/notification-api-manager/android/.../LandlineNotificationListenerService.kt | Core notification interception logic |
| modules/notification-api-manager/src/NotificationApiManagerModule.ts                | Native module API additions          |
| hooks/use-preferences-store.ts                                                      | State management for rules           |
| app/(settings)/auto-reply.tsx                                                       | Existing auto-reply UI to extend     |
| New: app/(settings)/dnd-breakthrough.tsx                                            | DND breakthrough configuration UI    |
| New: components/contacts/contact-picker.tsx                                         | Reusable contact selection component |

### Native Layer Changes Required

In LandlineNotificationListenerService.kt:

1. Add breakthroughTracker map (contactId → tracker data)
2. Modify onNotificationPosted() to check breakthrough rules before suppression
3. Add checkBreakthroughRule() method
4. Add updateBreakthroughTracker() method
5. Modify handleAutoReplyIfNeeded() to check auto-reply groups before replying

---

## 4. User Flow

### Configuration Flow

1. User navigates to Auto-Reply settings
2. Selects recipient mode:
   - Reply to everyone (current behavior)
   - Customize by contact
3. If customizing:
   - Create/manage groups (e.g., Work, Family)
   - Select contacts or contact groups for each
   - Write custom message per group
   - Set default message for unmatched contacts
4. Navigate to DND Breakthrough settings
5. Configure breakthrough rules:
   - Select emergency contacts (immediate breakthrough)
   - Select priority contacts (repeat-text breakthrough)
   - Configure time window and threshold
6. Save configuration (syncs to Firebase if enabled)

### Runtime Flow

```
Incoming SMS/WhatsApp notification
    ↓
LandlineNotificationListenerService.onNotificationPosted()
    ↓
Extract sender phone number
    ↓
Check DND Breakthrough Rules
├── Emergency? → Post immediately, done
├── Priority + threshold met? → Post immediately, done
├── Priority + below threshold? → Update tracker, suppress
├── Blocked? → Cancel, done
└── Standard? → Suppress, continue...
    ↓
Check Auto-Reply Groups
├── Find matching group → Send group-specific reply
├── No match + has default → Send default reply
└── No match + no default → Skip reply
    ↓
Log to notification notebook
```

---

## 5. Open Questions (To Be Answered Before Implementation)

### 5.1 Storage Strategy

**Question:** Should contact rules and breakthrough settings sync to Firebase (cross-device) or remain local-only?

**Considerations:**

- Firebase sync: Consistent experience across devices
- Local-only: Faster, works offline, privacy-focused
- Hybrid: Local with optional cloud sync

**Recommendation:** TBD based on user privacy preferences

### 5.2 Default Contact Behavior

**Question:** How should the system handle contacts not in any auto-reply group?

**Options:**

1. Send default/fallback auto-reply (if configured)
2. Send no auto-reply (silent)
3. Block entirely (no log, no reply)
4. Prompt user on first occurrence

**Recommendation:** Option 1 with clear Default Group UI

### 5.3 Contact Group Membership Sync

**Question:** Android contact groups can change outside the app. How should we handle membership changes?

**Options:**

1. Static copy: Store contact IDs at time of selection. Group changes don't affect rules.
2. Dynamic reference: Store group ID reference. Membership changes dynamically apply.
3. Hybrid: Store both, let user choose behavior per group.

**Recommendation:** TBD based on expected user behavior

### 5.4 Message Templates

**Question:** Should we provide pre-defined message templates per group type?

**Options:**

1. Free-form text entry only
2. Suggested templates (e.g., In a meeting for Work, Focusing for Personal)
3. Smart suggestions based on time of day (Work hours vs evening)

**Recommendation:** Start with option 2 (templates), easy to add later

### 5.5 Breakthrough Notification Presentation

**Question:** How should breakthrough notifications appear to distinguish them from normal notifications?

**Options:**

1. Standard notification (same as without DND)
2. Enhanced notification with visual indicator (badge/icon/color)
3. Special sound/vibration pattern

**Recommendation:** Option 2 (visual indicator)

---

## 6. Implementation Notes

### Technical Feasibility

**Strengths of Current Architecture:**

1. Notification Listener Service already captures every notification in real-time
2. SharedPreferences can store breakthrough tracking data
3. Emergency contact bypass already proves phone number matching works
4. DND Manager can dynamically change interruption filters
5. Expo Contacts integration already exists for contact picking

### Implementation Complexity: Medium

- Native Kotlin changes to listener service (tracking repeat notifications)
- New preferences data structures
- UI screens for contact selection
- No new permissions required
