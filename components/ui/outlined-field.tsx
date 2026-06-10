import React, { useCallback, useState } from 'react';

import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { COLORS, Radius, Spacing, Typography } from '@/constants/theme';

export interface OutlinedFieldProps extends Omit<TextInputProps, 'onChange' | 'style'> {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  leadingIcon?: React.ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
}

export function OutlinedField({
  label,
  value,
  onChangeText,
  error,
  leadingIcon,
  disabled = false,
  style,
  ...rest
}: OutlinedFieldProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? COLORS.destructive
    : focused
      ? COLORS.primary
      : COLORS.border;

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={styles.label}>{label.toUpperCase()}</Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          { borderColor },
          disabled && styles.disabled,
        ]}
      >
        {leadingIcon ? <View style={styles.icon}>{leadingIcon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          placeholderTextColor={COLORS.text.muted}
          style={styles.input}
          {...rest}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.sm,
  },
  label: {
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600',
    fontSize: Typography.labelSm.fontSize,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: COLORS.text.secondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    backgroundColor: COLORS.surface.base,
    gap: Spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: Typography.body.fontSize,
    color: COLORS.text.primary,
    padding: 0,
  },
  error: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Typography.caption.fontSize,
    color: COLORS.destructive,
  },
});
