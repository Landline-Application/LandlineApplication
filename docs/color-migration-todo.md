# Color & Token Migration

The app has been migrated to a standardized design token system in `constants/theme.ts`.

## Standardized Patterns

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

- `Radius.sm` (8px), `Radius.md` (12px), `Radius.lg` (16px), `Radius.xl` (24px)
- `Radius.full` (9999px), `Radius.pill` (999px)
- `Radius.card` (32px)
- `Radius.standard` (16px)

## Implementation Notes

- **CVA:** New components should use `class-variance-authority` for variant management (see `components/ui/form/button.tsx`).
- **Standardized Tokens:** Avoid hardcoded hex values. Always prefer `COLORS`, `Radius`, and `Spacing` tokens.
- **Landline Mode Store:** Use `useLandlineStore` for managing Landline sessions. The store now handles auto-deactivation and refresh intervals internally.
