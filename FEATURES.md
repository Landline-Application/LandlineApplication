# Landline Application - Features Documentation

## Overview

Landline is an Android-first mobile application built with Expo and React Native that silently intercepts and logs notifications, manages auto-replies, and controls device interruption settings. Built with Expo SDK 54, React 19, React Native 0.81, and TypeScript. Uses the New Architecture and experimental React Compiler.

**Current Status:** Functional backend and native modules; UI/UX design needed; user flow not finalized. Authentication flows use mock API calls (no real backend).

**Platform:** Android-primary. iOS has scaffolded native module stubs but no functional implementation. Web has partial fallbacks (auto-reply only); other native modules will crash on web.

---

## Authentication & Onboarding

### Phone Authentication

- **Description:** Sign up and log in using phone numbers with country detection and validation via libphonenumber-js.
- **Routes:** `/create-account`, `/login`
- **Status:** UI complete; backend is mocked (`setTimeout` simulation). Does NOT call `AuthContext.signIn()`/`signUp()`, so auth state is not persisted through the login flow.
- **Components:** PhoneInput with validation, `usePhoneAuth` hook, `ContinueWithSocials`

### Email Authentication

- **Description:** Sign up and log in using email and password. Signup includes age verification (13+).
- **Routes:** `/create-account-email`, `/login-email`
- **Status:** UI complete; backend is mocked. Same auth state persistence gap as phone auth. Inline password validation (6+ chars) differs from the stricter `validators.ts` utility (8+ chars, uppercase, lowercase, digit, special char) which is not currently wired up.
- **Components:** EmailPasswordInput, `ContinueWithSocials`

### Google OAuth

- **Description:** "Continue with Google" buttons appear on all auth pages.
- **Status:** Stub only. Handler is a no-op `console.log`.

### Skip Authentication

- **Description:** All auth pages include a "Skip" button that navigates directly to the main app, bypassing authentication entirely.
- **Status:** Functional. Intended for development convenience; likely needs removal or gating before production.

### Auth Context

- **Description:** React Context (`AuthProvider`) with `useAuth()` hook. Stores user in AsyncStorage under `@user` key.
- **Status:** Mounted at root layout but disconnected from login/signup flows. Only `signOut()` (on the home page) is wired up. `signIn()` and `signUp()` exist but are mock implementations with TODO comments.

### Onboarding Carousel

- **Description:** 5-slide animated horizontal carousel with gradient backgrounds, pagination dots (react-native-reanimated), skip button.
- **Route:** `/onboarding`
- **Status:** Complete and functional
- **Navigation:** Displayed after terms acceptance; slide 5 covers permissions and transitions to account creation

### Terms & Privacy

- **Description:** Legal agreement gate with tabbed Terms/Privacy content, scroll-to-bottom requirement, checkbox agreement. Must be accepted before accessing the app.
- **Route:** `/terms-and-privacy`
- **Status:** Complete and functional
- **Features:** Acceptance tracking with version (`1.0.0`) — if version is bumped, users must re-accept. Reset capability in Settings for testing.

---

## Core Features

### Notification Logging (Landline Log)

- **Description:** Silently intercept and log all notifications when Landline Mode is enabled. Display logs in a formatted notebook-style interface.
- **Route:** `(tabs)/notifications`
- **Status:** Partially complete
- **Missing:** "Classic view" toggle exists in UI but the view is a placeholder (not implemented)
- **Current Implementation:** `NotebookLogView` component — styled card layout with alphabetical side tabs, spiral binding holes, lined paper rules, and grouped-by-app-name display
- **Backend:** `NotificationApiManager.getLoggedNotifications()` retrieves pipe-delimited logs from SharedPreferences
- **Note:** Notification logs are stored as pipe-delimited strings in SharedPreferences. Code comments indicate this is temporary and will be replaced with a database.

### Notification Detail View

- **Description:** Display detailed information for individual notification categories (Texts, Emails, Missed Calls, Voicemails, App Notifications) with color-coded icons. Supports individual and bulk dismiss.
- **Route:** `/notification-detail`
- **Status:** Complete and functional

### Settings & Data Management

- **Description:** Storage info display, data export (JSON via Share API or web download), permanent data deletion with typed confirmation ("DELETE"), terms acceptance reset.
- **Route:** `(tabs)/settings`
- **Status:** Complete and functional
- **Export Format:** JSON containing `exportDate`, `appVersion`, `platform`, and all `@landline_` prefixed AsyncStorage data
- **Deletion:** Calls both AsyncStorage clear and native `clearAllData()` to wipe SharedPreferences

---

## Advanced Features (Currently in Testing)

### Landline Mode Control

- **Description:** Toggle notification logging on/off. When enabled, the `LandlineNotificationListenerService` silently captures all incoming notifications without displaying them.
- **Current Implementation:** Test page at `(tabs)/landline-mode-test`
- **Status:** Functional test page; exposed as a production tab (should not be)
- **Backend:** `NotificationApiManager` native module; state stored in `landline_mode_prefs` SharedPreferences
- **Note:** The self-notification filter in `LandlineNotificationListenerService` is temporarily disabled for testing. A broadcast intent (`com.landlineapp.NOTIFICATION_RECEIVED`) is emitted for real-time UI updates but no receiver exists in the React Native layer.

### Auto-Reply System

- **Description:** Send automatic replies to messaging app notifications during Landline Mode. Configure reply message, whitelist apps for auto-reply, track reply history.
- **Current Implementation:** Test page at `/auto-reply-test`
- **Status:** Functional test page; not integrated into production UI
- **Backend:** `AutoReplyManager` native module with `AutoReplyListenerService` (requires API 35+)
- **Features Available:** Message configuration, app whitelisting (empty = all apps), reply history tracking (max 50 entries stored as JSON in SharedPreferences), test notifications with `MessagingStyle` and `RemoteInput`
- **Includes:** `TestNotificationHelper` with `ReplyReceiver` BroadcastReceiver for testing

### Do Not Disturb Control

- **Description:** Toggle device Do Not Disturb modes, set interruption filters (Total Silence/Priority/Alarms/Normal), query per-app notification status, open per-app system notification settings.
- **Current Implementation:** Test page at `/dnd-test`
- **Status:** Functional test page; not integrated into production UI
- **Backend:** `DndManager` native module. Declares `onDNDStatusChanged` event (not yet actively emitted).
- **Permissions:** `ACCESS_NOTIFICATION_POLICY`, `QUERY_ALL_PACKAGES`

### Background Services Management

- **Description:** Control foreground services (`START_STICKY` for auto-restart), schedule periodic background tasks via WorkManager, manage battery optimization settings, monitor Doze mode status.
- **Current Implementation:** Test page at `(tabs)/background-service-demo`
- **Status:** Functional test page; exposed in production tabs (should not be)
- **Backend:** `BackgroundServiceManager` native module
- **Note:** `BackgroundWorker.performNotificationCheck()` is a TODO placeholder — the actual background work logic is not implemented. Foreground service uses `foregroundServiceType="specialUse"`. Wake lock support exists but is disabled in code.

---

## Pages Needing UI Design & Integration

**Status:** No UI designs exist; no user flow finalized.

### Home/Dashboard Page

- **Current State:** Test/demo page with buttons for: request permissions, send test notification, auto-reply test, DND test, sign out, view onboarding
- **File:** `app/(tabs)/index.tsx`

### Landline Mode Integration

- **Current State:** Test page exposed as production tab
- **File:** `app/(tabs)/landline-mode-test.tsx`

### Auto-Reply Configuration

- **Current State:** Standalone test page linked from home
- **File:** `app/auto-reply-test.tsx`

### Do Not Disturb Control

- **Current State:** Standalone test page linked from home
- **File:** `app/dnd-test.tsx`

### Background Services Control

- **Current State:** Test page exposed as production tab
- **File:** `app/(tabs)/background-service-demo.tsx`

### Notification Log "Classic View"

- **Current State:** Toggle exists in UI; classic view is a placeholder returning `null`
- **File:** `app/(tabs)/notifications.tsx`

---

## Native Modules

All four modules live under `modules/<name>/` with TypeScript API in `index.ts` and Kotlin implementation under `android/`. iOS Swift stubs exist for `notification-api-manager` and `auto-reply-manager` but are scaffolded only. Module documentation is in `docs/`.

### Notification API Manager

- **Location:** `modules/notification-api-manager/`
- **Platform:** Android (iOS scaffolded, web stub non-functional)
- **Functions (11):** `hasPostPermission`, `requestPostPermission`, `createChannel`, `notify`, `hasNotificationListenerPermission`, `requestNotificationListenerPermission`, `setLandlineMode`, `isLandlineModeActive`, `getLoggedNotifications`, `clearLoggedNotifications`, `clearAllData`
- **Native Storage:** `landline_mode_prefs` (mode toggle), `landline_notifications` (pipe-delimited logs)
- **Service:** `LandlineNotificationListenerService` — captures all non-empty, non-system-UI notifications when Landline Mode is active. Auto-reconnects on Android N+.

### Auto-Reply Manager

- **Location:** `modules/auto-reply-manager/`
- **Platform:** Android (web stub returns graceful failures)
- **Functions (12):** `isListenerEnabled`, `requestListenerPermission`, `isAutoReplyEnabled`, `setAutoReplyEnabled`, `setReplyMessage`, `getReplyMessage`, `setAllowedApps`, `getAllowedApps`, `isServiceRunning`, `getActiveNotifications`, `sendTestNotification`, `getReplyHistory`, `clearReplyHistory`
- **Service:** `AutoReplyListenerService` (API 35+) — detects reply actions in incoming notifications, sends configured reply, deduplicates via `repliedNotifications` set

### DND Manager

- **Location:** `modules/dnd-manager/`
- **Platform:** Android only (no web fallback)
- **Functions (8 + 1 constants):** `hasPermission`, `requestPermission`, `getCurrentState`, `setDNDEnabled`, `setInterruptionFilter`, `getAllInstalledApps`, `getAppNotificationStatus`, `openAppNotificationSettings`, `getInterruptionFilterConstants`

### Background Service Manager

- **Location:** `modules/background-service-manager/`
- **Platform:** Android only (no web fallback)
- **Functions (11):** `startForegroundService`, `stopForegroundService`, `isForegroundServiceRunning`, `scheduleBackgroundWork`, `cancelBackgroundWork`, `isBackgroundWorkScheduled`, `isIgnoringBatteryOptimizations`, `requestIgnoreBatteryOptimizations`, `openBatteryOptimizationSettings`, `getAndroidVersion`, `isDeviceIdleMode`

---

## Navigation & Routing

### Architecture

Root layout (`app/_layout.tsx`) wraps the app in `SafeAreaProvider` > `AuthProvider` > `ThemeProvider` (dark/light based on system preference) > `Stack` navigator. Terms acceptance is checked on mount — if not accepted, user is redirected to `/terms-and-privacy`.

**Flow:** `terms-and-privacy` → `onboarding` → `create-account` (or `login`) → `(tabs)/index`

### Tab Bar

Five tabs defined in `app/(tabs)/_layout.tsx`. Uses `HapticTab` for iOS press feedback.

| Tab                       | Title         | Production Ready  |
| ------------------------- | ------------- | ----------------- |
| `index`                   | Home          | No (test content) |
| `notifications`           | Notifications | Partial           |
| `landline-mode-test`      | Landline      | No (test page)    |
| `background-service-demo` | BG Service    | No (test page)    |
| `settings`                | Settings      | Yes               |

### Route Table

| Route                   | Page                 | Status                         |
| ----------------------- | -------------------- | ------------------------------ |
| `/terms-and-privacy`    | Legal agreement      | Complete                       |
| `/onboarding`           | 5-slide carousel     | Complete                       |
| `/login`                | Phone login          | Complete (mock API)            |
| `/login-email`          | Email login          | Complete (mock API)            |
| `/create-account`       | Phone signup         | Complete (mock API)            |
| `/create-account-email` | Email signup         | Complete (mock API)            |
| `(tabs)/index`          | Home/Dashboard       | Needs redesign                 |
| `(tabs)/notifications`  | Notification log     | Partial (missing classic view) |
| `(tabs)/settings`       | Settings & data      | Complete                       |
| `/notification-detail`  | Notification details | Complete                       |

### Test Pages (Should Not Be in Production)

| Route                            | Purpose                    | Exposure           |
| -------------------------------- | -------------------------- | ------------------ |
| `(tabs)/landline-mode-test`      | Landline mode testing      | Production tab     |
| `(tabs)/background-service-demo` | Background service testing | Production tab     |
| `/auto-reply-test`               | Auto-reply testing         | Linked from home   |
| `/dnd-test`                      | DND testing                | Linked from home   |
| `/modal`                         | Template modal             | Unused placeholder |

---

## Shared Components

| Component             | File                                              | Purpose                                                                                                |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `NotebookLogView`     | `components/notebook-log-view.tsx`                | Styled notebook/journal view for notification logs with alphabetical tabs, spiral binding, lined paper |
| `HapticTab`           | `components/haptic-tab.tsx`                       | Tab bar press wrapper with haptic feedback (iOS)                                                       |
| `FormLayout`          | `components/ui/form-layout.tsx`                   | SafeAreaView + KeyboardAvoidingView wrapper for auth pages                                             |
| `RolodexCard`         | `components/ui/roledex-card.tsx`                  | Branded card with tab header and punch holes for auth pages                                            |
| `IconSymbol`          | `components/ui/icon-symbol.tsx`                   | Cross-platform icon (MaterialIcons on Android/web, SF Symbols on iOS)                                  |
| `Button`              | `components/ui/form/button.tsx`                   | Three variants: primary, outline, text. Supports loading state.                                        |
| `PhoneInput`          | `components/ui/form/phone-number.tsx`             | Phone number input with country flag emoji and validation                                              |
| `EmailPasswordInput`  | `components/ui/form/email-password-input.tsx`     | Email + password fields with error border support                                                      |
| `ContinueWithSocials` | `components/ui/form/continue-socials-buttons.tsx` | Configurable Google/Email/Phone social login buttons                                                   |
| `Collapsible`         | `components/ui/collapsible.tsx`                   | Accordion component with chevron animation (exists but unused)                                         |
| `ExternalLink`        | `components/external-link.tsx`                    | Opens URLs in in-app browser on native (exists but unused)                                             |

---

## Architecture & Dependencies

### Framework

- Expo 54.0.33 (New Architecture enabled)
- React 19.1.0 (experimental React Compiler enabled)
- React Native 0.81.5
- TypeScript ~5.9.2
- Package manager: pnpm 10.17.0

### Navigation

- Expo Router ~6.0.23 (file-based routing with typed routes)
- @react-navigation/bottom-tabs, @react-navigation/native, @react-navigation/elements

### State Management

- React Context (`AuthContext` for authentication)
- Component-local `useState` for all other UI state
- No external state library (no Redux, Zustand, etc.)

### Storage

- AsyncStorage (local persistence for user data, terms acceptance)
- Android SharedPreferences (native module state: landline mode, notification logs, auto-reply config/history)

### Key Libraries

- `libphonenumber-js` — phone validation and country detection
- `react-native-reanimated` — animations (onboarding carousel, collapsible)
- `expo-linear-gradient` — gradient backgrounds (onboarding)
- `expo-haptics` — haptic feedback (tab bar)
- `expo-notifications` — used in auto-reply test page

### Unused Dependencies

These packages are installed but not imported anywhere in the codebase:

- `expo-image`
- `expo-device`
- `expo-font` (in plugins but no custom fonts loaded)
- `expo-constants`

### Utilities

| File                               | Purpose                                                                                      |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `utils/acceptance-storage.ts`      | Terms acceptance state with version tracking                                                 |
| `utils/phone-number.ts`            | Country flag emoji, country detection, phone validation                                      |
| `utils/validators.ts`              | Email/password validators (password validator unused — stricter than inline checks)          |
| `utils/storage/storage-manager.ts` | Centralized AsyncStorage wrapper: get/set/delete, export, summary                            |
| `utils/storage/storage-keys.ts`    | Key definitions; has commented-out future keys for preferences, theme, notification settings |

### Constants

| File                         | Purpose                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------- |
| `constants/colors.ts`        | 12 color tokens — warm, vintage/Rolodex-inspired palette                         |
| `constants/theme.ts`         | Platform-specific font families (sans, serif, rounded, mono)                     |
| `constants/legal-content.ts` | Terms of Use (12 sections) and Privacy Policy (16 sections) as template literals |

---

## CI/CD

Two GitHub Actions workflows in `.github/workflows/`:

| Workflow    | Trigger     | Steps                                                            |
| ----------- | ----------- | ---------------------------------------------------------------- |
| `lint.yml`  | PRs to main | Runs `pnpm lint`                                                 |
| `build.yml` | PRs to main | Lint + Android compile check (prebuild + run:android --no-build) |

EAS Build profiles defined in `eas.json`: `development` (dev client, internal), `preview` (APK, internal), `production` (app-bundle).

---

## Permissions Required (Android)

| Permission                             | Reason                                                    | Status                                                     |
| -------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| `POST_NOTIFICATIONS`                   | Post notifications (Android 13+)                          | Declared in app.json                                       |
| Notification Listener Service          | Read/suppress notifications, power auto-reply and logging | Requested at runtime                                       |
| `ACCESS_NOTIFICATION_POLICY`           | Control DND / interruption filters                        | Declared in DND module manifest                            |
| `QUERY_ALL_PACKAGES`                   | List installed apps for per-app notification settings     | Declared in DND module manifest                            |
| `FOREGROUND_SERVICE`                   | Persistent foreground service                             | Declared in Background Service module manifest             |
| `FOREGROUND_SERVICE_SPECIAL_USE`       | Special-use foreground service type                       | Declared in Background Service module manifest             |
| `WAKE_LOCK`                            | Keep CPU active during background work                    | Declared in Background Service module manifest             |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Exempt from Doze mode                                     | Declared in Background Service module manifest             |
| `BIND_NOTIFICATION_LISTENER_SERVICE`   | Notification listener services                            | Declared in Notification API + Auto-Reply module manifests |

---

## Future Features (Not Yet Started)

From project documentation (README.md) but no implementation in the codebase:

- Emergency contact override (allow calls/messages from specific contacts during Landline Mode)
- Call interception (capture and log incoming calls)
- SMS/Text message interception (capture and log incoming messages)
- Accessibility Service for lock screen and overlay functionality
- Device Admin for lock screen control
- Overlay Permission for floating widget
- Usage Access for per-app usage monitoring
- Color/theme migration (documented in `docs/color-migration-todo.md`)

---

## Known Issues & Technical Debt

1. **Auth not wired up:** Login/signup pages do not call `AuthContext.signIn()`/`signUp()` — auth state is not persisted through the actual login flow
2. **Test pages in production tabs:** `landline-mode-test` and `background-service-demo` are visible as production tabs
3. **Home page is a test page:** Contains debug buttons, no production dashboard
4. **Notification log classic view:** Toggle exists but the view returns `null`
5. **Password validation mismatch:** `validators.ts` requires 8+ chars with complexity rules; auth pages only check 6+ chars inline
6. **Google OAuth stub:** Buttons rendered on all auth pages but handler is a no-op
7. **Skip auth in production:** All auth pages allow skipping directly to the main app
8. **Background worker placeholder:** `BackgroundWorker.performNotificationCheck()` is a TODO — no actual work is performed
9. **Self-notification filter disabled:** `LandlineNotificationListenerService` self-filter is temporarily disabled for testing
10. **Notification broadcast receiver missing:** Native layer emits `NOTIFICATION_RECEIVED` broadcast but no React Native receiver exists
11. **Pipe-delimited storage:** Notification logs use pipe-delimited strings in SharedPreferences (intended to be replaced with a database)
12. **No UI designs:** All pages needing production UI lack design specifications
13. **No user flow designed:** Feature integration points and navigation paths not finalized
14. **Template artifacts:** React logo images in assets and `.reactLogo` styles in test pages are leftovers from the Expo template
15. **Unused dependencies:** `expo-image`, `expo-device`, `expo-font`, `expo-constants` are installed but not used

---

## Documentation

| File                                    | Purpose                                                   |
| --------------------------------------- | --------------------------------------------------------- |
| `README.md`                             | Project overview, module table, permissions, contributing |
| `BUILD.md`                              | Environment setup, install, run, troubleshooting          |
| `FEATURES.md`                           | This file                                                 |
| `docs/auto_reply_manager_api.md`        | Auto-reply module API reference                           |
| `docs/auto_reply_testing_limitation.md` | Known testing limitations                                 |
| `docs/color-migration-todo.md`          | Planned color/theme migration                             |
| `docs/creating_a_native_module.md`      | Guide for adding new native modules                       |
| `docs/dnd_manager_api.md`               | DND module API reference                                  |
| `docs/notification_visibility_fix.md`   | Notification visibility fix notes                         |
| `docs/testing_auto_reply.md`            | Auto-reply testing guide                                  |
| `docs/testing_real_messages.md`         | Testing with real messages                                |
| `docs/troubleshooting_notifications.md` | Notification troubleshooting                              |
| `docs/using_dnd_manager.md`             | DND manager usage guide                                   |
| `docs/viewing_auto_reply_messages.md`   | Viewing auto-reply messages                               |
| `scripts/test-notification.sh`          | CLI script for testing notifications                      |
