# Landline Application

This is an Android first mobile application designed to help users disconnect from constant notifications while maintaining emergency accessibility, mimicking the experience of traditional landline phones.

## Overview

The Landline Application offers the following features by creating a "landline mode" on your smartphone that limits distractions:

- Intercepts and logs notifications without displaying them.
- Provides a simple interface for making and receiving calls and texts.
  - Whitelist specific contacts for calls and texts.
  - Auto-reply to texts/calls/emails when in landline mode.
  - Emergency bypass for important contacts.
- Preserves battery life by reducing background activity.
- Customizable settings for notification handling and app behavior.

## Installation & Setup

Check the [BUILD.md](BUILD.md) file for detailed instructions on setting up the development environment and running the application.

## Permissions Required

- Notification Access
- Accessibility Service
- Device Admin (for lock screen functionality)
- Overlay Permission (for floating widgets)
- Usage Access (for monitoring app usage)
- Battery Optimization Exemption (to ensure background services run smoothly)

## Modules

- **notification-api-manager**: Manages notification access and handling.

## Contributing

We primarily use Jira for task management.
