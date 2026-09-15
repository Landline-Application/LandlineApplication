The Landline action button — moss-green by default, rounded 24px, presses down to 0.95.

```jsx
<Button label="Start Session" variant="primary" size="lg" fullWidth onClick={begin} />
<Button label="Stay in Landline" variant="ghost" />
<Button label="End Session" variant="danger" />
```

Variants: `primary` (moss), `secondary` (clay), `ghost` (moss outline), `danger` (rust), `text` (quiet link). Sizes `sm|md|lg|xl` map to 40/48/56/64px heights. Use `leadingIcon` to place a Material icon before the label.
