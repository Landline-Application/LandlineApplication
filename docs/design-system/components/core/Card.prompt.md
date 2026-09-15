The default surface — warm paper, green-tinted shadow, generous 32px corners.

```jsx
<Card variant="card" elevation="sm" padding="lg">…</Card>
<Card organic={2} elevation="md">Hand-thrown corners</Card>
```

`variant` picks the paper tone (`base|card|elevated|outlined`). `organic` swaps the symmetric 32px radius for an asymmetric pottery corner — pass `true`, or `0–3` to choose which of the four corner sets.
