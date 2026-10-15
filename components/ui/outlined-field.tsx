import React, { useCallback, useState } from 'react';

import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-themes';

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
  const { theme, density } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.muted }]}>{label.toUpperCase()}</Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            borderColor,
            borderRadius: density.borderRadius,
            height: density.minTouch,
            paddingHorizontal: density.padding,
            backgroundColor: theme.colors.surface,
          },
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
          placeholderTextColor={theme.colors.muted}
          style={[styles.input, { color: theme.colors.text }]}
          {...rest}
        />
      </View>
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
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
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
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
    padding: 0,
  },
  error: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Typography.caption.fontSize,
  },
});