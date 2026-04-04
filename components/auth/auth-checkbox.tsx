/**
 * M3-aligned checkbox.
 *
 * Spec references:
 *  - Container: 18dp, rounded 2dp corners, colorOnSurface (unchecked) → colorPrimary (checked)
 *  - Icon: checkmark, colorOnPrimary
 *  - Touch target: minimum 48dp (achieved via padding)
 *  - Label: bodyMedium, colorOnSurface
 *  - Disabled: 38% opacity
 */
import React from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Fonts } from '@/constants/theme';
import { haptics } from '@/services/haptics';

export interface AuthCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: React.ReactNode;
  disabled?: boolean;
  error?: boolean;
}

export function AuthCheckbox({
  checked,
  onToggle,
  label,
  disabled = false,
  error = false,
}: AuthCheckboxProps) {
  const handlePress = () => {
    if (disabled) return;
    haptics.light();
    onToggle();
  };

  const boxColor = error ? COLORS.destructive : checked ? COLORS.primary : 'transparent';

  const borderColor = error
    ? COLORS.destructive
    : checked
      ? COLORS.primary
      : COLORS.mutedForeground;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [styles.row, disabled && styles.disabled, pressed && styles.pressed]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={typeof label === 'string' ? label : undefined}
    >
      {/* M3 checkbox box — 18dp, 2dp corner radius */}
      <View style={[styles.box, { backgroundColor: boxColor, borderColor }]}>
        {checked && <MaterialIcons name="check" size={14} color={COLORS.primaryForeground} />}
      </View>

      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    // 48dp minimum touch target via vertical padding
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.38,
  },
  box: {
    // M3: 18dp container, 2dp corner radius, 2dp border when unchecked
    width: 18,
    height: 18,
    borderRadius: 2,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.foreground,
  },
});
