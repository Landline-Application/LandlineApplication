# AGENTS.md

## Project Overview

Landline is a React Native/Expo application for Android that captures notifications for focused review.

## Commands

### Development & Building

- `pnpm start` - Start development server
- `pnpm android` - Build and run on Android device/emulator
- `pnpm export` - Export JavaScript and assets for production
- `pnpm prebuild` - Regenerate native Android project (clears existing directories)
- `pnpm clean` - Clean build artifacts (removes android/, .expo/, .gradle/, and cache directories)

### Linting & Formatting

- `pnpm lint` - Run ESLint with Expo-optimized settings
- `pnpm lint:fix` - Automatically fix linting issues
- `pnpm format` - Format code with Prettier

### Package Management (Infrequent)

- `npx expo install <package>` - Install package compatible with current react-native version
- `npx expo install --check` - Validate installed package versions
- `npx expo install --fix` - Automatically update invalid package versions

### Configuration (Setup/Debugging)

- `npx expo config` - Evaluate app config (app.json or app.config.js)
- `npx expo customize` - Generate default project files (babel.config.js, metro.config.js, etc.)

### Authentication (One-time Setup)

- `npx expo login` - Login to Expo account
- `npx expo logout` - Logout from Expo account
- `npx expo whoami` - Check current authentication status

See `BUILD.md` for detailed build instructions

## Code Style

- Use TypeScript with strict mode enabled
- All new code must be type-safe
- No `any` types unless absolutely necessary

### Naming Conventions

- **Components**: PascalCase (`LandlineScreen`, `NotificationCard`)
- **Functions/variables**: camelCase (`handlePress`, `isLoading`)
- **Constants**: SCREAMING_SNAKE_CASE where appropriate
- **Files**: kebab-case for everything

### Error Handling

- Use try/catch for async operations
- Always show user-friendly error messages via Alert
- Log errors appropriately for debugging

### React Native Patterns

- Use `StyleSheet.create` for all styles (no inline objects)
- Use `useCallback` for event handlers passed to children
- Use `useSafeAreaInsets` for safe area handling
- Use `Platform.OS` for platform-specific code
- Use `expo-router` for navigation (file-based routing in `app/`)

### Path Aliases

Use `@/` prefix for absolute imports from project root:

```typescript
import MyModule from '@/modules/notification-api-manager';
```

### Native Modules

- Located in `modules/` directory as Expo modules
- Follow Expo module creation patterns
- See `docs/creating_a_native_module.md` for guidance

## Key Files

- `app/` - Expo Router pages (file-based routing)
- `modules/` - Native Expo modules
- `services/` - API and native services
- `contexts/` - React Context providers
- `constants/` - App-wide constants and configuration
- `utils/` - Utility functions and helpers
- `docs/` - Feature documentation
- `BUILD.md` - Build troubleshooting

## Environment Variables

Useful Expo CLI environment variables:

- `EXPO_OFFLINE` - Skip all network requests when applicable
- `DEBUG=expo:*` or `EXPO_DEBUG` - Enable debug logs for the CLI
- `EXPO_EDITOR` - Editor to open when pressing `O` in Terminal UI (e.g., `code`, `vim`)
- `CI=1` - Enable CI mode (disables interactive prompts)
- `EXPO_NO_TELEMETRY` - Disable anonymous usage collection
- `EXPO_TUNNEL_SUBDOMAIN` - Set subdomain for tunnel URLs (experimental)
- `EXPO_NO_CACHE` - Disable all global caching

See https://docs.expo.dev/more/expo-cli/#environment-variables for a complete list.

## Git commits

When committing follow convectional commit messages like "fix:|feat:" etc.
Keep it super concise.
