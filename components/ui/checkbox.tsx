import React, { useCallback } from 'react';

import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { COLORS, Motion, Radius, Typography } from '@/constants/theme';

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Checkbox({ checked = false, onChange, label, disabled = false, style }: CheckboxProps) {
  const handlePress = useCallback(() => {
    if (!disabled) onChange?.(!checked);
  }, [checked, disabled, onChange]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      style={[styles.row, disabled && styles.disabled, style]}
    >
      <View
        style={[
          styles.box,
          checked ? styles.boxChecked : styles.boxUnchecked,
        ]}
      >
        {checked && (
          <MaterialIcons name="check" size={16} color={COLORS.text.onPrimary} />
        )}
      </View>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  boxChecked: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
  },
  boxUnchecked: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  label: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Typography.bodySm.fontSize,
    color: COLORS.text.primary,
    flexShrink: 1,
  },
});
