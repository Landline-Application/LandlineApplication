# Color Migration TODO

`ThemedView` and `ThemedText` have been removed and replaced with plain `View` and `Text`.
The components no longer auto-inject `backgroundColor` or text `color`.

The files below need inline color values added using tokens from `constants/colors.ts` (`COLORS`).

## COLORS reference

```ts
COLORS.background; // '#2b2b2b'  — dark app background
COLORS.cardBg; // '#f5f1e8'  — cream card background
COLORS.cardBorder; // '#d4c5a0'
COLORS.activeBorder; // '#5d4e37'
COLORS.tabBg; // '#c8b88a'
COLORS.tabBorder; // '#a89968'
COLORS.textPrimary; // '#5d4e37'  — brown, for use on light (cardBg) backgrounds
COLORS.textSecondary; // '#7a6a4a'
COLORS.inputBg; // '#ffffff'
COLORS.placeholder; // '#999999'
COLORS.googleBlue; // '#4285F4'
COLORS.shadow; // '#000000'
```

---

## Files needing color pass

### app/(tabs)/background-service-demo.tsx

- `<View>` (was `<ThemedView>`) — needs `backgroundColor`
- `<Text>` (was `<ThemedText>`) — needs text `color`

### app/(tabs)/index.tsx

- `<View>` (was `<ThemedView>`) — needs `backgroundColor`
- `<Text>` (was `<ThemedText>`) — needs text `color`

### app/(tabs)/landline-mode-test.tsx

- `<View>` (was `<ThemedView>`) — needs `backgroundColor`
- `<Text>` (was `<ThemedText>`) — needs text `color`

### app/(tabs)/settings.tsx

- `<View>` (was `<ThemedView>`) — needs `backgroundColor`
- `<Text>` (was `<ThemedText>`) — needs text `color`

### app/(tabs)/explore.tsx

- `<View>` (was `<ThemedView>`) — needs `backgroundColor`
- `<Text>` (was `<ThemedText>`) — needs text `color`
- `headerBackgroundColor` prop on `ParallaxScrollView` — still has hardcoded `light`/`dark` values, replace with `COLORS` token

### app/onboarding.tsx

- `<View>` (was `<ThemedView>`, `style={styles.container}`) — had `backgroundColor: '#000'` already in StyleSheet, likely fine
- `<Text>` nodes inside gradient slides — most already have `color: '#fff'` in StyleSheet styles, review remaining unstyled ones

### app/auto-reply-test.tsx

- `<View>` (was `<ThemedView>`) — needs `backgroundColor`
- `<Text>` (was `<ThemedText>`) — needs text `color`

### app/dnd-test.tsx

- `<View>` (was `<ThemedView>`) — needs `backgroundColor`
- `<Text>` (was `<ThemedText>`) — needs text `color`

### app/modal.tsx

- `<View>` (was `<ThemedView>`) — needs `backgroundColor`
- `<Text>` (was `<ThemedText>`) — needs text `color`

### components/ui/collapsible.tsx

- `<View>` and `<Text>` — title text color not yet set, icon color uses `COLORS.textSecondary` (done)

### components/parallax-scroll-view.tsx

- `headerBackgroundColor` — prop still accepts `{ light, dark }` shape but now only reads `.light`; callers should be updated to pass a single color or the prop shape cleaned up

---

## Notes

- `ThemedText` had a `type` prop with a typographic scale (`title`, `subtitle`, `defaultSemiBold`, `link`). Those type-specific font sizes/weights were dropped during the swap. Where headings look wrong, re-add font size/weight to the relevant StyleSheet entries.
- `parallax-scroll-view.tsx` no longer reads `backgroundColor` from theme; the `<Animated.ScrollView>` background is now transparent (inherits). Add `backgroundColor: COLORS.background` to the scrollview style when doing the color pass.
