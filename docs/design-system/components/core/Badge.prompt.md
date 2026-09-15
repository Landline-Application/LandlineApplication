A small rounded pill for counts, statuses, and tags — soft tinted by default.

```jsx
<Badge tone="primary" label="12" />
<Badge tone="primary" soft>Auto Replied</Badge>
<Badge tone="warning" soft={false}>Live</Badge>
```

Tones: `primary|secondary|neutral|success|warning|danger`. `soft` (default) gives a 14% tint with a hairline border; set `soft={false}` for a solid fill.
