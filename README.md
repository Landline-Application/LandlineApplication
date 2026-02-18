# Landline Application

An Android-first mobile app that turns your smartphone into a "landline" — intercepting and silencing notifications while keeping you reachable for what actually matters.

## Overview

Landline Mode limits distractions by:

- Intercepting and logging notifications without surfacing them to the user
- White-listing specific contacts for calls, texts, and emails
- Auto-replying to messages when in landline mode
- Providing an emergency bypass for urgent contacts
- Reducing background activity to preserve battery life

## Getting Started

See [BUILD.md](BUILD.md) for environment setup, prerequisites, and instructions for running on a device or emulator.

## Native Modules

The app ships four custom Android native modules built with [Expo Modules Core](https://docs.expo.dev/modules/overview/). Each module lives under `modules/<name>/` with a TypeScript API surface in `index.ts` and Kotlin implementation under `android/`.

| Module                       | Purpose                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `notification-api-manager`   | Posts notifications, manages channels, logs intercepted notifications for Landline Mode             |
| `dnd-manager`                | Controls Android Do-Not-Disturb / interruption filters; queries per-app notification status         |
| `auto-reply-manager`         | Sends auto-replies via `NotificationListenerService` when Landline Mode is active                   |
| `background-service-manager` | Manages a foreground service and WorkManager periodic tasks; handles battery optimization exemption |

Module-level documentation is in [`docs/`](docs/).

## Permissions Required

| Permission                     | Reason                                          |
| ------------------------------ | ----------------------------------------------- |
| Notification Access            | Read and suppress incoming notifications        |
| Notification Listener Service  | Power auto-reply and notification logging       |
| Do Not Disturb Access          | Control interruption filters                    |
| Battery Optimization Exemption | Keep background services alive                  |
| Accessibility Service          | Lock screen and overlay functionality (planned) |
| Device Admin                   | Lock screen control (planned)                   |
| Overlay Permission             | Floating widget (planned)                       |
| Usage Access                   | Monitor per-app usage (planned)                 |

## Contributing

Task tracking is done in Jira. Run `pnpm lint` before pushing; the CI pipeline enforces it on every PR.
