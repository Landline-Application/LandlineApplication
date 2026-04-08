# Theme Reference

This document describes the standardized design system used throughout the app, defined in `constants/theme.ts`.

## Fonts

The application uses two custom font families:

### Fraunces (Serif Display Font)

- **Usage**: Headings, titles, display text
- **Weights available**: 700 (Bold)
- **File**: `Fraunces_700Bold.ttf`

### Nunito (Sans-Serif UI Font)

- **Usage**: Body text, labels, buttons, UI elements
- **Weights available**: 400 (Regular), 600 (SemiBold), 700 (Bold)
- **Files**:
  - `Nunito_400Regular.ttf`
  - `Nunito_600SemiBold.ttf`
  - `Nunito_700Bold.ttf`

### Typography Tokens

| Token                  | Font Family | Size | Weight | Line Height | Usage              |
| ---------------------- | ----------- | ---- | ------ | ----------- | ------------------ |
| `Typography.h1`        | Fraunces    | 32px | 700    | 40px        | Page titles        |
| `Typography.h2`        | Fraunces    | 28px | 700    | 36px        | Section headers    |
| `Typography.h3`        | Fraunces    | 24px | 700    | 32px        | Subsection headers |
| `Typography.bodyLg`    | Nunito      | 18px | 400    | 28px        | Large body text    |
| `Typography.body`      | Nunito      | 16px | 400    | 24px        | Default body text  |
| `Typography.bodySm`    | Nunito      | 14px | 400    | 20px        | Small body text    |
| `Typography.labelLg`   | Nunito      | 16px | 600    | 24px        | Large labels       |
| `Typography.label`     | Nunito      | 14px | 600    | 20px        | Default labels     |
| `Typography.labelSm`   | Nunito      | 12px | 600    | 16px        | Small labels       |
| `Typography.caption`   | Nunito      | 12px | 400    | 16px        | Captions           |
| `Typography.captionSm` | Nunito      | 10px | 400    | 14px        | Small captions     |

## General Components

The following components are available for general use throughout the application. Import them from `@/components`:

### Core Components (`components/core/`)

| Component          | Import         | Description                                                                                                                                 |
| ------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`           | `@/components` | Primary button with variants (primary, secondary, ghost, danger) and sizes (sm, md, lg, xl). Includes press animations and haptic feedback. |
| `Card`             | `@/components` | Container component with variants (base, elevated, outlined), configurable shadows, padding, and border radius.                             |
| `StatusIndicator`  | `@/components` | Animated status dot with optional glow effect. Supports active/inactive states and multiple sizes.                                          |
| `SessionCard`      | `@/components` | Data display card showing a label and value, styled for session statistics.                                                                 |
| `RotaryDialButton` | `@/components` | Specialized circular button with rotary dial styling.                                                                                       |

### UI Components (`components/ui/`)

| Component       | Import Path                      | Description                                                                                |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `IconSymbol`    | `@/components/ui/icon-symbol`    | Cross-platform icon component using Material Icons. Browse icons at https://icons.expo.fyi |
| `Collapsible`   | `@/components/ui/collapsible`    | Accordion component with chevron animation for expandable content.                         |
| `ExternalLink`  | `@/components/ui/external-link`  | Link component that opens URLs in-app browser on native, external tab on web.              |
| `FormLayout`    | `@/components/ui/form-layout`    | SafeArea + KeyboardAvoidingView wrapper for form screens with scroll handling.             |
| `NavigationBar` | `@/components/ui/navigation-bar` | Material Design 3 bottom navigation bar with active indicator pills.                       |
| `HapticTab`     | `@/components/ui/haptic-tab`     | Tab bar button wrapper providing haptic feedback on iOS.                                   |

### Form Components (`components/ui/form/`)

| Component             | Import Path                                     | Description                                                                              |
| --------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Button` (form)       | `@/components/ui/form/button`                   | Alternative button using class-variance-authority for variants (primary, outline, text). |
| `PhoneInput`          | `@/components/ui/form/phone-number`             | Phone number input with country flag display and validation.                             |
| `EmailPasswordInput`  | `@/components/ui/form/email-password-input`     | Combined email and password input fields.                                                |
| `ContinueWithSocials` | `@/components/ui/form/continue-socials-buttons` | Social login button group (Google, Email, Phone).                                        |

### Usage Example

```tsx
import { Button, Card, StatusIndicator } from '@/components';
import { FormLayout } from '@/components/ui/form-layout';
import { IconSymbol } from '@/components/ui/icon-symbol';

// In your component:
<FormLayout>
  <Card variant="elevated" shadow="md">
    <StatusIndicator active={true} />
    <IconSymbol name="settings" size={24} color={COLORS.primary} />
    <Button label="Save" onPress={handleSave} variant="primary" />
  </Card>
</FormLayout>;
```

## Design Tokens

### Colors (`COLORS`)

- `COLORS.text.primary` — Main body/heading text (`#2C2C24`)
- `COLORS.text.secondary` — Muted/secondary text (`#6B6B63`)
- `COLORS.text.muted` — Placeholder or disabled text
- `COLORS.text.onPrimary` — Text on top of primary color background
- `COLORS.surface.base` — Main app background
- `COLORS.surface.elevated` — Elevated surface (e.g. Navigation Bar)
- `COLORS.surface.card` — Card background
- `COLORS.surface.border` — Standard border color

### Radius (`Radius`)

| Token             | Value  | Usage                |
| ----------------- | ------ | -------------------- |
| `Radius.xs`       | 4px    | Small elements       |
| `Radius.sm`       | 8px    | Buttons, small cards |
| `Radius.md`       | 12px   | Input fields         |
| `Radius.lg`       | 16px   | Cards, modals        |
| `Radius.xl`       | 24px   | Large cards          |
| `Radius.xxl`      | 32px   | Feature cards        |
| `Radius.full`     | 9999px | Circles              |
| `Radius.pill`     | 999px  | Pill buttons         |
| `Radius.card`     | 32px   | Standard cards       |
| `Radius.standard` | 16px   | Default radius       |

### Spacing (`Spacing`)

The spacing system uses an 8px grid:

| Token           | Value | Usage             |
| --------------- | ----- | ----------------- |
| `Spacing.xs`    | 4px   | Tight gaps        |
| `Spacing.sm`    | 8px   | Small gaps        |
| `Spacing.md`    | 12px  | Default gaps      |
| `Spacing.lg`    | 16px  | Section padding   |
| `Spacing.xl`    | 20px  | Large gaps        |
| `Spacing.xxl`   | 24px  | Component padding |
| `Spacing.xxxl`  | 32px  | Large sections    |
| `Spacing.jumbo` | 40px  | Hero sections     |

### Shadows (`Shadows`)

| Token        | Description                                  |
| ------------ | -------------------------------------------- |
| `Shadows.sm` | Small elevation (cards, buttons)             |
| `Shadows.md` | Medium elevation (modals, dropdowns)         |
| `Shadows.lg` | Large elevation (dialogs, sheets)            |
| `Shadows.xl` | Extra large elevation (full-screen overlays) |

### Motion (`Motion`)

| Token               | Value | Usage                |
| ------------------- | ----- | -------------------- |
| `Motion.fast`       | 150ms | Micro-interactions   |
| `Motion.normal`     | 300ms | Standard transitions |
| `Motion.slow`       | 500ms | Emphasis animations  |
| `Motion.scalePress` | 0.95  | Press feedback scale |
| `Motion.scaleHover` | 1.02  | Hover feedback scale |

## Implementation Notes

- **CVA:** New components should use `class-variance-authority` for variant management (see `components/ui/form/button.tsx`).
- **Standardized Tokens:** Avoid hardcoded hex values. Always prefer `COLORS`, `Radius`, and `Spacing` tokens.
- **Landline Mode Store:** Use `useLandlineStore` for managing Landline sessions. The store handles auto-deactivation and refresh intervals internally.
