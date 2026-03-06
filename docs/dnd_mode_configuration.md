# DND Mode Configuration Feature

**Status:** 🟡 Planned (Not Yet Implemented)  
**Priority:** High  
**Estimated Effort:** MVP ~25 hours, Full Implementation ~60 hours

---

## Overview

The DND Mode Configuration feature provides **full in-app control** over Do Not Disturb settings for Landline Mode. Instead of directing users to Android Settings, all DND configuration happens within the app with a beautiful, intuitive UI.

### Goals

- ✅ **Better UX** - Configure everything in-app, no context switching
- ✅ **Preset System** - Common modes (Total Silence, Emergency Only, Work, Sleep, Driving)
- ✅ **Custom Modes** - Create unlimited custom DND configurations
- ✅ **Emergency Contacts** - Dedicated list that always gets through
- ✅ **Granular Control** - Calls, messages, apps, system sounds, visual settings
- ✅ **Smart Defaults** - Works great out of the box, powerful when needed

---

## User Stories

### Story 1: Quick Setup

> "As a new user, I want to activate Total Silence mode in one tap without any configuration."

**Flow:**

1. User taps "Activate Landline Mode"
2. Default mode is "Total Silence" (blocks everything)
3. Landline activates immediately
4. User can switch modes later if needed

### Story 2: Emergency Contacts

> "As a parent, I want my kids to always be able to reach me, even in Total Silence mode."

**Flow:**

1. User goes to Settings → Emergency Contacts
2. Taps "Add Emergency Contact"
3. Picks contacts from phone (with search)
4. Marks as "Always Allow" (bypasses all DND modes)
5. When Landline is active, these contacts can call/message through

### Story 3: Custom Work Mode

> "As a professional, I want a Work Focus mode that allows Slack and Teams but blocks social media."

**Flow:**

1. User taps "Create New Mode"
2. Names it "Work Focus", picks 💼 icon and blue color
3. Configures:
   - Allow calls: Contacts only
   - Allow messages: Favorites only
   - Allowed apps: Slack, Teams, Email
   - Block: Instagram, Facebook, Twitter
4. Saves mode
5. Can activate with one tap from mode picker

### Story 4: Scheduled Sleep Mode

> "As someone who values sleep, I want DND to automatically activate at 10 PM with only emergency contacts allowed."

**Flow:** (Version 2.0 feature)

1. User creates "Sleep" mode (🌙 icon)
2. Configures: Only emergency contacts + alarms
3. Sets schedule: 10 PM - 7 AM daily
4. Mode auto-activates/deactivates on schedule

---

## Architecture

### Components

#### **1. Native Module Enhancement**

**File:** `modules/dnd-manager/android/src/main/java/expo/modules/dndmanager/DndManagerModule.kt`

**New Functions:**

```kotlin
// Policy Management
fun getNotificationPolicy(): Map<String, Any>
fun setNotificationPolicy(config: Map<String, Any>): Promise<Boolean>
fun getPolicyConstants(): Map<String, Int>

// Contact Management
fun getStarredContacts(): Promise<List<Contact>>
fun getAllContacts(): Promise<List<Contact>>
fun setContactStarred(contactId: String, starred: Boolean): Promise<Boolean>

// AutomaticZenRule Management
fun createZenRule(name: String, config: Map<String, Any>): Promise<String> // returns ruleId
fun updateZenRule(ruleId: String, config: Map<String, Any>): Promise<Boolean>
fun deleteZenRule(ruleId: String): Promise<Boolean>
fun activateZenRule(ruleId: String): Promise<Boolean>
fun getAllZenRules(): Promise<List<ZenRule>>

// Per-App Control (Advanced)
fun canBypassDnd(packageName: String): Promise<Boolean>
fun setAppCanBypassDnd(packageName: String, bypass: Boolean): Promise<Boolean>
fun getNotificationChannels(packageName: String): Promise<List<NotificationChannel>>
```

#### **2. Data Models**

**File:** `utils/database/dnd-schema.ts`

**DNDMode:**

```typescript
interface DNDMode {
  id: string;
  name: string;
  icon: string; // emoji or icon name
  color: string; // hex color
  isPreset: boolean; // true for built-ins, false for custom

  // Call settings
  allowCalls: boolean;
  callFilter: 'anyone' | 'contacts' | 'favorites' | 'custom' | 'none';
  allowRepeatCallers: boolean;
  customCallContacts: string[]; // contact IDs

  // Message settings
  allowMessages: boolean;
  messageFilter: 'anyone' | 'contacts' | 'favorites' | 'custom' | 'none';
  customMessageContacts: string[];

  // App settings
  allowedApps: string[]; // package names that CAN notify
  blockedApps: string[]; // package names explicitly blocked

  // System settings
  allowAlarms: boolean;
  allowMedia: boolean;
  allowSystem: boolean;
  allowReminders: boolean;
  allowEvents: boolean;

  // Visual settings
  suppressBadges: boolean;
  suppressLockScreen: boolean;
  suppressPeek: boolean;
  suppressLights: boolean;

  // Metadata
  createdAt: number;
  updatedAt: number;
  lastUsed: number;
}
```

**EmergencyContact:**

```typescript
interface EmergencyContact {
  id: string;
  contactId: string; // Android contact ID
  name: string;
  phoneNumber: string;
  photoUri?: string;
  priority: number; // 1 = highest priority
  alwaysAllow: boolean; // bypasses ALL DND modes
  addedAt: number;
}
```

#### **3. State Management**

**File:** `hooks/use-dnd-mode-store.ts`

**Store Structure:**

```typescript
interface DNDModeState {
  // Data
  modes: DNDMode[];
  currentModeId: string | null;
  emergencyContacts: EmergencyContact[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions - Modes
  createMode: (mode: Partial<DNDMode>) => Promise<void>;
  updateMode: (id: string, changes: Partial<DNDMode>) => Promise<void>;
  deleteMode: (id: string) => Promise<void>;
  duplicateMode: (id: string) => Promise<void>;
  activateMode: (id: string) => Promise<void>;
  deactivateMode: () => Promise<void>;

  // Actions - Emergency Contacts
  addEmergencyContact: (contact: Partial<EmergencyContact>) => Promise<void>;
  updateEmergencyContact: (id: string, changes: Partial<EmergencyContact>) => Promise<void>;
  removeEmergencyContact: (id: string) => Promise<void>;
  reorderEmergencyContacts: (ids: string[]) => Promise<void>;

  // Actions - Data
  loadModes: () => Promise<void>;
  loadEmergencyContacts: () => Promise<void>;
  syncWithAndroid: () => Promise<void>; // Sync with system DND settings
}
```

#### **4. UI Screens**

**`app/dnd-modes.tsx`** - DND Modes Manager

- Grid of mode cards (presets + custom)
- Active mode highlighted
- "Create New Mode" button
- Search/filter modes
- Edit/Delete actions

**`app/dnd-mode-editor.tsx`** - Mode Configuration Editor

- Mode details (name, icon, color)
- Calls section (allow/filter)
- Messages section (allow/filter)
- Apps section (allow/block list)
- System sounds toggles
- Visual settings toggles
- Preview of what's allowed/blocked
- Save/Cancel buttons

**`app/emergency-contacts.tsx`** - Emergency Contact Manager

- List of emergency contacts (with photos)
- Add from contacts button
- Search contacts
- Drag-to-reorder priority
- Quick actions per contact (call, message, edit, remove)
- "Always Allow" toggle per contact
- Sync with Android starred contacts option

**`components/dnd/DNDModeCard.tsx`** - Reusable mode card

- Icon, name, color theme
- Active indicator
- Quick stats (e.g., "3 contacts, 2 apps allowed")
- Edit/Delete menu (long press)
- Swipe actions

**`components/dnd/ContactPicker.tsx`** - Contact selection UI

- Search bar
- Contact photos + names
- Multi-select checkboxes
- Groups: Favorites, Recent, All Contacts
- Selected count badge
- Select All/None buttons

**`components/dnd/AppPicker.tsx`** - App selection UI

- App icons + names
- Category filters (Messaging, Social, Productivity, etc.)
- Search
- Toggle switches per app
- Notification channel details (if available)
- System apps toggle

---

## Built-in DND Modes (Presets)

### 1. Total Silence 🔇

**Color:** Red (#dc2626)  
**Use Case:** Complete focus, meditation, important meetings

**Configuration:**

- ❌ Calls: None
- ❌ Messages: None
- ❌ Apps: None
- ✅ Alarms: Allowed (so you don't miss appointments)
- ❌ All other sounds: Blocked

### 2. Emergency Only 🚨

**Color:** Orange (#ea580c)  
**Use Case:** Default mode, allows important people through

**Configuration:**

- ✅ Calls: Emergency contacts only
- ✅ Repeat callers: Allowed (2 calls within 15 min)
- ❌ Messages: Blocked
- ❌ Apps: Blocked
- ✅ Alarms: Allowed

### 3. Work Focus 💼

**Color:** Cyan (#0891b2)  
**Use Case:** During work hours, allow work-related communication

**Configuration:**

- ✅ Calls: Contacts only
- ✅ Messages: Contacts only
- ✅ Allowed apps: Slack, Teams, Email, Calendar
- ❌ Blocked apps: Social media, games
- ✅ Alarms, reminders, events: Allowed

### 4. Sleep 😴

**Color:** Purple (#7c3aed)  
**Use Case:** Nighttime, emergencies only

**Configuration:**

- ✅ Calls: Emergency contacts only
- ✅ Repeat callers: Allowed
- ❌ Messages: Blocked
- ❌ Apps: Blocked
- ✅ Alarms: Allowed (wake up alarm)
- ✅ Suppress lock screen notifications (dark screen)

### 5. Driving 🚗

**Color:** Green (#16a34a)  
**Use Case:** Minimal distractions while driving

**Configuration:**

- ✅ Calls: Emergency contacts only
- ✅ Repeat callers: Allowed
- ❌ Messages: Blocked (read later!)
- ✅ Allowed apps: Navigation, Music
- ✅ Media sounds: Allowed
- ✅ Alarms: Allowed

### 6. Custom ⚙️

**User creates their own**

---

## Implementation Phases

### Phase 1: MVP (Essential Features)

**Effort:** ~25 hours  
**Goal:** Basic in-app DND configuration

**Deliverables:**

- [ ] Enhanced native DND module
  - `getNotificationPolicy()`, `setNotificationPolicy()`
  - Basic contact access
- [ ] 3 built-in presets: Total Silence, Emergency Only, Custom
- [ ] Simple mode selector UI (bottom sheet)
- [ ] Emergency contacts list (manual entry, no photos)
- [ ] AsyncStorage persistence
- [ ] Integration with Landline activation
- [ ] Basic testing in debug-tools

**User Value:** Users can pick from 3 modes and add emergency contacts without leaving the app.

---

### Phase 2: Enhanced UX

**Effort:** ~20 hours  
**Goal:** Beautiful UI and all presets

**Deliverables:**

- [ ] Full DND mode editor screen
- [ ] All 5 built-in presets (Work, Sleep, Driving added)
- [ ] Custom mode creation/editing
- [ ] Contact picker with photos and search
- [ ] App picker for notification control
- [ ] Visual settings (badges, lock screen, peek)
- [ ] SQLite database for modes (better performance)
- [ ] Mode cards with icons and colors
- [ ] Swipe gestures for quick actions

**User Value:** Professional-grade DND configuration UI that's better than Android Settings.

---

### Phase 3: Advanced Features

**Effort:** ~30 hours  
**Goal:** Power user features

**Deliverables:**

- [ ] AutomaticZenRule integration
  - Each Landline mode = separate Android DND rule
  - Shows in Android Settings as "Landline: Work Focus", etc.
- [ ] DND schedules (time-based activation)
- [ ] Location-based activation (geofencing)
- [ ] Per-app notification channel control
- [ ] Mode templates/import/export
- [ ] Quick Actions (widgets, shortcuts)
- [ ] Usage analytics (which modes used most)
- [ ] Smart suggestions (AI-powered mode recommendations)

**User Value:** Advanced automation and customization for power users.

---

## User Flow Examples

### First-Time User Setup

```
1. User installs Landline app
2. Completes permissions setup
3. Reaches main Landline screen
4. Taps "Activate Landline Mode"
   ↓
5. Bottom sheet appears: "Choose DND Mode"
   - Shows 3 cards: Total Silence 🔇, Emergency Only 🚨, Custom ⚙️
   - "Emergency Only" is pre-selected (recommended)
   ↓
6. User taps "Emergency Only"
   ↓
7. Prompt: "Add emergency contacts who can always reach you?"
   - [Skip] [Add Contacts]
   ↓
8. User taps "Add Contacts"
   ↓
9. Contact picker opens
   - Shows all contacts with search
   - User selects: Mom, Dad, Spouse
   - Taps "Done"
   ↓
10. Landline Mode activates
    - Emergency Only DND applied
    - Notification appears: "Landline Active - 3 emergency contacts can reach you"
```

### Power User: Creating Custom Work Mode

```
1. User opens Settings → DND Modes
2. Taps "+ Create New Mode"
   ↓
3. Mode Editor opens
   ↓
4. User fills in details:
   - Name: "Work Focus"
   - Icon: 💼 (from emoji picker)
   - Color: Blue (#0891b2)
   ↓
5. Configures Calls:
   - Toggle ON "Allow Calls"
   - Selects "Contacts Only"
   - Toggle OFF "Repeat Callers" (too distracting)
   ↓
6. Configures Messages:
   - Toggle ON "Allow Messages"
   - Selects "Favorites Only"
   - Picks 3 favorite contacts
   ↓
7. Configures Apps:
   - Taps "Select Apps"
   - App picker opens
   - User enables: Slack, Teams, Outlook, Calendar
   - User blocks: Instagram, Facebook, Twitter
   ↓
8. Configures System:
   - Toggle ON: Alarms, Reminders, Events
   - Toggle OFF: Media, System sounds
   ↓
9. Reviews preview:
   "✅ Calls from 47 contacts
    ✅ Messages from 3 favorites
    ✅ Notifications from 4 apps
    ❌ 12 apps blocked
    ✅ Alarms, reminders, events"
   ↓
10. Taps "Save"
    ↓
11. "Work Focus" mode now appears in mode list
12. Can activate with one tap
```

---

## Technical Considerations

### Android API Compatibility

| Feature                    | API Level         | Fallback                       |
| -------------------------- | ----------------- | ------------------------------ |
| NotificationManager.Policy | 23+ (Android 6.0) | Basic interruption filter only |
| AutomaticZenRule           | 24+ (Android 7.0) | Use global policy              |
| Notification Channels      | 26+ (Android 8.0) | Per-app only (no per-channel)  |
| Conversation Priority      | 30+ (Android 11)  | Use contact-based filtering    |

**Minimum SDK:** 23 (Android 6.0)  
**Target SDK:** 34 (Android 14)

### Permissions Required

```xml
<!-- Already in manifest -->
<uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />

<!-- New permissions needed -->
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.GET_ACCOUNTS" /> <!-- For starred contacts -->
```

### Data Storage

**AsyncStorage** (MVP - Phase 1)

- Simple JSON storage
- Good for <100 modes and contacts
- Fast prototyping

**SQLite** (Phase 2+)

- Better performance at scale
- Relational queries (e.g., "all modes that allow app X")
- Schema versioning
- Use `expo-sqlite`

**Database Schema:**

```sql
CREATE TABLE dnd_modes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_preset INTEGER DEFAULT 0,
  config TEXT, -- JSON blob of settings
  created_at INTEGER,
  updated_at INTEGER,
  last_used INTEGER
);

CREATE TABLE emergency_contacts (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT,
  photo_uri TEXT,
  priority INTEGER DEFAULT 0,
  always_allow INTEGER DEFAULT 1,
  added_at INTEGER
);

CREATE TABLE mode_contacts (
  mode_id TEXT,
  contact_id TEXT,
  type TEXT, -- 'call' or 'message'
  FOREIGN KEY(mode_id) REFERENCES dnd_modes(id) ON DELETE CASCADE,
  PRIMARY KEY(mode_id, contact_id, type)
);

CREATE TABLE mode_apps (
  mode_id TEXT,
  package_name TEXT,
  allowed INTEGER DEFAULT 1, -- 1=allowed, 0=blocked
  FOREIGN KEY(mode_id) REFERENCES dnd_modes(id) ON DELETE CASCADE,
  PRIMARY KEY(mode_id, package_name)
);
```

### Sync Strategy

**Problem:** User might modify DND settings in Android Settings outside the app

**Solution 1: Read-Only Sync** (MVP)

- Periodically read Android policy
- Show warning if drift detected
- Offer to "Reapply Landline Mode" or "Update Mode to Match"

**Solution 2: Two-Way Sync** (Phase 3)

- When app launches, read Android AutomaticZenRules
- Import any user-created rules as custom modes
- Keep Landline modes and Android rules in sync
- Show unified view

**Recommendation:** Start with Solution 1 (simpler), upgrade to Solution 2 if users request it.

---

## UX Design Guidelines

### Visual Design

**Mode Cards:**

- Large icon (48x48 dp)
- Mode name (16sp, bold)
- Subtitle showing key settings (12sp, muted)
- Color accent bar on left edge
- Active state: border + background tint
- Shadow for depth

**Color Palette:**

- Total Silence: Red (#dc2626)
- Emergency Only: Orange (#ea580c)
- Work Focus: Cyan (#0891b2)
- Sleep: Purple (#7c3aed)
- Driving: Green (#16a34a)
- Custom: User picks from 12 preset colors

**Icons:**

- Use emoji for quick implementation
- Later: Custom SVG icons for polish
- Icon picker: Grid of 50+ relevant icons

### Interaction Patterns

**Tap Mode Card:**

- Activate immediately (if Landline is active)
- Or select for next activation (if Landline is off)
- Haptic feedback on selection

**Long Press Mode Card:**

- Show context menu:
  - Edit
  - Duplicate
  - Delete (only custom modes)
  - Share (export config)

**Swipe Mode Card:**

- Left swipe: Edit
- Right swipe: Delete (with confirmation)

**Pull to Refresh:**

- Sync with Android settings
- Reload contacts
- Update app list

### Accessibility

- All interactive elements >44dp touch target
- Color contrast ratio >4.5:1
- Screen reader labels for all icons
- Voice control support
- Reduce motion option (disable animations)

---

## Testing Strategy

### Unit Tests

- DND mode CRUD operations
- Emergency contact management
- Policy configuration logic
- Data persistence (AsyncStorage/SQLite)

### Integration Tests

- Native module calls
- Android policy API integration
- Contact provider queries
- AutomaticZenRule management

### E2E Tests

- Create custom mode flow
- Add emergency contacts flow
- Activate/deactivate modes
- Mode editor save/cancel
- Contact picker multi-select

### Manual Testing Checklist

- [ ] All 5 presets work as expected
- [ ] Custom mode creation
- [ ] Emergency contacts override DND
- [ ] Repeat callers work
- [ ] App allow/block works
- [ ] Visual settings work (badges, lock screen)
- [ ] Mode persists across app restarts
- [ ] Mode survives device reboot
- [ ] Sync with Android settings
- [ ] Edge case: No contacts permission
- [ ] Edge case: No DND policy permission
- [ ] Edge case: User deletes mode while active

---

## Edge Cases & Error Handling

### Permission Denied Scenarios

**READ_CONTACTS denied:**

- Emergency contacts: Allow manual phone number entry
- Contact picker: Show message "Grant contacts permission for full features"
- Fallback: Use phone number strings instead of contact IDs

**ACCESS_NOTIFICATION_POLICY denied:**

- Show prominent warning
- Disable DND mode features
- Offer "Open Settings" button
- Graceful degradation: Landline works without DND

### Invalid State Scenarios

**User deletes starred contact externally:**

- Sync check on mode activation
- Show warning: "Contact 'John Doe' no longer exists"
- Offer to remove from mode or pick replacement

**App uninstalled:**

- Check package existence before applying mode
- Silently skip missing apps
- Log warning for debugging

**Mode active when app crashes:**

- On app restart, check if mode should still be active
- Reapply if Landline is active
- Or deactivate if Landline was turned off

### Conflict Resolution

**Multiple apps want to control DND:**

- AutomaticZenRule allows multiple rules
- Landline modes have "landline\_" prefix
- Show all rules in sync view
- Warn if conflict detected

---

## Performance Considerations

### Optimization Strategies

**Lazy Loading:**

- Load mode list immediately (from cache)
- Load contact photos on demand
- Load app icons as user scrolls

**Caching:**

- Cache contact list for 5 minutes
- Cache app list for 1 hour
- Cache policy state for 30 seconds
- Invalidate on user action

**Batch Operations:**

- When setting policy, apply all changes at once
- Don't call Android API for each toggle
- Debounce frequent updates

**Background Sync:**

- Use WorkManager for periodic sync
- Only sync when app is in foreground (user-initiated)
- Don't wake device for sync

### Memory Management

**Mode List:**

- Store only metadata in memory
- Load full config on edit
- Limit custom modes to 50

**Contact List:**

- Virtualized list (react-native-fast-list)
- Only render visible contacts
- Release photo bitmaps when off-screen

**App List:**

- Filter system apps by default
- Search indexes pre-built
- Icons lazy-loaded

---

## Future Enhancements (Post-MVP)

### Smart Features

- **AI Mode Suggestions:** "You usually use Work Focus on weekdays 9-5. Create a schedule?"
- **Context Awareness:** Auto-suggest mode based on location, time, calendar events
- **Learning:** Remember which contacts user allows through over time

### Social Features

- **Mode Sharing:** Export/import mode configs
- **Community Presets:** Download popular modes from other users
- **Mode Templates:** Curated collection for different professions

### Advanced Automation

- **IFTTT Integration:** Trigger modes from external events
- **Tasker Support:** Android automation integration
- **Calendar Integration:** Auto-activate based on calendar events (e.g., meetings)

### Premium Features (Monetization)

- **Unlimited Custom Modes:** Free tier = 3 custom modes, paid = unlimited
- **Advanced Schedules:** Complex time-based rules
- **Analytics Dashboard:** Detailed stats on DND usage
- **Family Sharing:** Share emergency contacts across family accounts

---

## Success Metrics

### User Adoption

- **Target:** 70% of Landline users configure DND modes within first week
- **Measure:** Percentage of users who interact with DND settings

### Engagement

- **Target:** Average 2.5 modes per user (1 preset + 1.5 custom)
- **Measure:** Total modes created / total users

### Satisfaction

- **Target:** <5% users who revert to Android Settings for DND
- **Measure:** User surveys + support tickets

### Performance

- **Target:** Mode activation <500ms on mid-range devices
- **Measure:** Performance monitoring (Firebase Performance)

### Reliability

- **Target:** <1% mode activation failures
- **Measure:** Error tracking (Sentry)

---

## Open Questions

1. **Should we allow infinite custom modes or impose a limit?**
   - Considerations: Storage, UX clutter, performance
   - Recommendation: 50 max (with option to archive unused)

2. **How to handle mode conflicts with other DND apps?**
   - Recommendation: Detect conflicts, show warning, offer to disable other app's rules

3. **Should emergency contacts be global or per-mode?**
   - Current plan: Global (always allowed)
   - Alternative: Per-mode override option

4. **Export format for mode sharing?**
   - JSON? QR code? Deep link?
   - Recommendation: JSON with Base64 encoding for deep links

5. **Should we show Android's native DND settings at all?**
   - Recommendation: Yes, as "Advanced" option for power users

---

## Resources

### Android Documentation

- [Do Not Disturb (DND) Best Practices](https://developer.android.com/training/notify-user/do-not-disturb)
- [NotificationManager.Policy](https://developer.android.com/reference/android/app/NotificationManager.Policy)
- [AutomaticZenRule](https://developer.android.com/reference/android/app/AutomaticZenRule)
- [Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)

### Design Inspiration

- iOS Focus Modes (Settings → Focus)
- Google Digital Wellbeing (Focus mode)
- OnePlus Zen Mode
- Samsung Modes and Routines

### Libraries to Consider

- `expo-contacts` - Contact access
- `expo-sqlite` - Local database
- `react-native-gesture-handler` - Swipe gestures
- `react-native-reanimated` - Smooth animations
- `react-native-emoji-picker` - Icon selection

---

## Changelog

### 2026-03-06

- Initial documentation created
- Defined MVP scope and phases
- Created data models and architecture
- Listed built-in presets
- Outlined user flows

---

## Notes

**Implementation Priority:** This feature is marked as high priority but should be implemented AFTER core Landline functionality is stable. The MVP phase can be completed in ~25 hours and provides significant UX improvement over directing users to Android Settings.

**Phased Approach:** Start with MVP (3 presets, basic UI), gather user feedback, then expand to full feature set. Avoid over-engineering in Phase 1.

**UX Philosophy:** Better to have 5 well-designed presets that cover 90% of use cases than 50 mediocre options. Focus on simplicity first, power features later.
