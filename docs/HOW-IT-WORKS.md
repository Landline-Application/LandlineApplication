# How Landline Works

An Android-first mobile app that turns your smartphone into a "landline" — intercepting and silencing notifications while keeping you reachable for what actually matters.

Built with **Expo**, **React Native**, and **TypeScript**. Core notification behavior runs in custom Android native modules.

## Overview

When **Landline Mode** is on, the phone stays quiet: notifications are intercepted and logged instead of interrupting you. You can still configure auto-replies, emergency contacts, and Do Not Disturb so important people can break through.

Landline Mode limits distractions by:

- Intercepting and logging notifications without surfacing them to the user
- Auto-replying to messages when in Landline Mode
- Supporting emergency / priority contacts that can break through
- Controlling Android Do Not Disturb / interruption filters
- Tracking app attention / usage (via a native usage-stats module)

## How It Works

### User flow

1. **Onboarding** — Accept terms, walk through feature slides, grant permissions (notification access, DND, etc.), and create an account (phone, email, or Google via Firebase).
2. **Home (Landline tab)** — Activate or end Landline Mode (indefinite or timed session). A rotary-dial-style control is the main action.
3. **Log tab** — Review intercepted notifications in a notebook-style log, grouped by app.
4. **Settings** — Configure auto-reply, emergency contacts, preferences, permissions, account, and feedback. Debug tools live under Settings for development.

Typical session:

```
Activate Landline Mode
        ↓
Native listener starts capturing notifications
        ↓
Alerts are suppressed; entries are written to the log
        ↓
Optional auto-reply is sent for messaging apps
        ↓
Deactivate (or timer ends) → normal phone behavior resumes
```

### Technical flow

```
React Native UI (Expo Router)
        ↓
Zustand stores (landline, auto-reply, preferences, …)
        ↓
Expo native modules (TypeScript API → Kotlin)
        ↓
Android system services
  • NotificationListenerService  → intercept / log / auto-reply
  • NotificationManager / DND    → interruption filters
  • UsageStatsManager            → app attention data
```

- **UI layer** — File-based routes under `app/` (Expo Router). Tabs: Log, Landline (home), Settings.
- **State** — Zustand stores in `hooks/` sync UI with native module state (e.g. `useLandlineStore` for mode on/off, session timing, and notification refresh).
- **Native layer** — Modules under `modules/` talk to Android APIs that React Native cannot reach directly. Mode flags and notification logs are stored in SharedPreferences on device; app preferences and auth use AsyncStorage / Firebase.

Landline Mode itself is primarily driven by `notification-api-manager`: when mode is active, `LandlineNotificationListenerService` captures incoming notifications and stores them for the Log tab. Auto-reply and DND are separate modules that can run alongside that flow.

## Project structure

```
app/                 # Screens & routes (Expo Router)
  (onboarding)/      # Terms, walkthrough, permissions, signup
  (tabs)/            # Main tabs: Log, Landline, Settings
  (settings)/        # Settings sub-screens
  auth/              # Sign-in, create account, password reset
  debug/             # Dev / diagnostics tools
components/          # Shared UI
hooks/               # Zustand stores and shared hooks
modules/             # Custom Expo native modules (Android)
services/            # Reminders, haptics, background tasks
utils/               # Storage, Firebase helpers, validators
docs/                # Module APIs, setup, and testing guides
```

## Native Modules

The app ships custom Android native modules built with [Expo Modules Core](https://docs.expo.dev/modules/overview/). Each module lives under `modules/<name>/` with a TypeScript API surface and a Kotlin implementation under `android/`.

| Module                     | Purpose                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `notification-api-manager` | Posts notifications, manages channels, logs intercepted notifications for Landline Mode     |
| `dnd-manager`              | Controls Android Do-Not-Disturb / interruption filters; queries per-app notification status |
| `auto-reply-manager`       | Sends auto-replies via `NotificationListenerService` when Landline Mode is active           |
| `usage-stats-manager`      | Reads Android usage stats for app-attention features                                        |

Module-level documentation is in [`docs/`](docs/). Feature inventory and status notes live in [FEATURES.md](FEATURES.md).

## Permissions Required

| Permission                     | Reason                                          |
| ------------------------------ | ----------------------------------------------- |
| Notification Access            | Read and suppress incoming notifications        |
| Notification Listener Service  | Power auto-reply and notification logging       |
| Do Not Disturb Access          | Control interruption filters                    |
| Battery Optimization Exemption | Keep background reminders / work reliable       |
| Usage Access                   | Monitor per-app usage / attention               |
| Accessibility Service          | Lock screen and overlay functionality (planned) |
| Device Admin                   | Lock screen control (planned)                   |
| Overlay Permission             | Floating widget (planned)                       |

## Related docs

| Doc | Contents |
| --- | -------- |
| [README.md](README.md) | Project overview and contributing |
| [BUILD.md](BUILD.md) | Local setup, Android SDK, run & troubleshoot |
| [FEATURES.md](FEATURES.md) | Feature-by-feature status and gaps |
| [docs/](docs/) | Native module APIs, Firebase/EAS setup, testing guides |
