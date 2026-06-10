# Landline Design System

Design handoff from Claude Design. Reference these files when building or modifying UI.

## Key files

| File | Purpose |
|------|---------|
| `docs/design-system/SKILL.md` | Brand overview, color tokens, font rules, house rules |
| `docs/design-system/README.md` | Handoff bundle readme — what the files are and how to use them |
| `docs/design-system/_ds_manifest.json` | Full token dump (colors, type scale, spacing, radius, shadows, motion) |
| `constants/theme.ts` | RN token implementation — COLORS, Spacing, Radius, Typography, Shadows, Motion |

## Component docs (`docs/design-system/components/`)

### Brand
- `brand/AppAvatar.prompt.md` — round monogram chip, tint hashed from app name
- `brand/NotificationRow.prompt.md` — captured notification entry (title, text, time, auto-reply badge)
- `brand/RolodexCard.prompt.md` — clay-tab card with punch holes; signature Landline pattern
- `brand/SessionStat.prompt.md` — big Fraunces metric tile (session duration, count)

### Core
- `core/Badge.prompt.md` — status/count pill, tones: primary/secondary/neutral/success/warning/danger
- `core/Button.prompt.md` — moss-green action button, 5 variants, 4 sizes, 0.95 press scale
- `core/Card.prompt.md` — warm paper surface with green-tinted shadow, optional organic corners
- `core/Chip.prompt.md` — pill toggle for filter bars
- `core/StatusIndicator.prompt.md` — pulsing green "session active" dot

### Forms
- `forms/Checkbox.prompt.md` — moss fill + check, used in terms gate
- `forms/OutlinedField.prompt.md` — outlined text field with floating label and focus/error states
- `forms/Switch.prompt.md` — moss-on / stone-off animated toggle

## RN component locations

All production components live in `components/ui/`:

```
badge.tsx            chip.tsx             app-avatar.tsx
notification-row.tsx session-stat.tsx     checkbox.tsx
outlined-field.tsx   switch.tsx           button.tsx
card.tsx             roledex-card.tsx     status-indicator.tsx
```

## Design tokens quick ref

| Token | Value |
|-------|-------|
| Primary (moss) | `#5D7052` |
| Secondary (clay) | `#C18C5D` |
| Background (paper) | `#FDFCF8` |
| Ink (charcoal) | `#2C2C24` |
| Display font | Fraunces (serif) |
| UI font | Nunito (rounded sans) |
| Press scale | 0.95 |
| Base grid | 8px |
| Shadows | Always moss-tinted, never grey |
| Corners | 16px standard / 999px pill / 32px card / asymmetric organic variants |
