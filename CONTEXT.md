# Domain Context

## LandlineSession

The module that owns the lifecycle of a Landline Mode session: activation, deactivation, and state reconstruction from persistent storage. It encapsulates the interaction with the native landline-mode API, DND policy application, and session journal. Callers interact with it through a narrow interface (`hydrate`, `start`, `stop`, `refreshNotifications`).

## SessionJournal

The persistent storage adapter for session metadata. Owns the AsyncStorage keys used to record when a session started, what mode it is in (`indefinite` or `timer`), and when it should end. Hides key names and serialization from all other modules.

## SessionClock

Manages timer intervals for a live session: the 30-second notification refresh cycle and the 5-second countdown timer check. Decouples interval lifecycle from both the store and the session module.

## LandlinePolicy

Encapsulates the DND (Do Not Disturb) changes required to enter and exit Landline Mode. Applying the policy configures the interruption filter and notification policy; restoring it returns the device to its pre-session state.
