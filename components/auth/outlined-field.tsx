/**
 * M3-aligned outlined text field.
 *
 * Spec references:
 *  - Outlined variant: 1dp resting stroke → 2dp focused stroke, colorOutline → colorPrimary
 *  - Floating label: body-small above the field when focused/populated
 *  - Error state: stroke + label + supporting text switch to colorError
 *  - Supporting text: 12sp, sits 4dp below the container
 *  - Min height: 56dp container
 *  - Touch target: 48dp minimum (satisfied by 56dp container)
 */
import React, { useCallback, useRef, useState } from 'react';

import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { COLORS, Fonts } from '@/constants/theme';

export interface OutlinedFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  /** Trailing icon element (e.g. show/hide password toggle) */
  trailingIcon?: React.ReactNode;
}

export function OutlinedField({
  label,
  value,
  onChangeText,
  error,
  trailingIcon,
  editable = true,
  ...rest
}: OutlinedFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  // Use a single value for all animations to ensure synchronization and avoid driver conflicts
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false, // Must be false to animate colors and background
    }).start();
  }, [anim]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  }, [anim, value]);

  // Interpolate label position and size
  const labelTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -27],
  });
  const labelScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });
  // Compensate for scale shift to keep text perfectly aligned at 16dp from left
  const labelTranslateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  const hasError = !!error;
  const strokeColor = hasError ? COLORS.destructive : isFocused ? COLORS.primary : COLORS.border;
  const strokeWidth = isFocused || hasError ? 2 : 1;
  const labelColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      COLORS.mutedForeground,
      hasError ? COLORS.destructive : isFocused ? COLORS.primary : COLORS.mutedForeground,
    ],
  });
  // Show background only when floating to prevent covering the cursor
  const labelBgColor = anim.interpolate({
    inputRange: [0, 0.9, 1],
    outputRange: ['transparent', 'transparent', COLORS.background],
  });

  return (
    <View style={styles.wrapper}>
      {/* Container */}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.container,
          {
            borderColor: strokeColor,
            borderWidth: strokeWidth,
            opacity: editable ? 1 : 0.48,
          },
        ]}
        accessible={false}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          style={[styles.input, { zIndex: 2 }]}
          placeholderTextColor={COLORS.mutedForeground}
          accessibilityLabel={label}
          accessibilityState={{ disabled: !editable }}
          {...rest}
        />

        {/* Floating label */}
        <Animated.Text
          style={[
            styles.label,
            {
              top: 17,
              transform: [
                { translateY: labelTranslateY },
                { scale: labelScale },
                { translateX: labelTranslateX },
              ],
              transformOrigin: 'left top',
              color: labelColor,
              backgroundColor: labelBgColor,
              paddingHorizontal: 4,
              zIndex: 1,
            },
          ]}
          numberOfLines={1}
          pointerEvents="none"
        >
          {label}
        </Animated.Text>

        {trailingIcon != null && (
          <View style={[styles.trailingIcon, { zIndex: 3 }]}>{trailingIcon}</View>
        )}
      </Pressable>

      {/* Supporting text — error or helper (M3: bodySmall, colorError / colorOnSurfaceVariant) */}
      {hasError && (
        <Text
          style={styles.supportingText}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  container: {
    // M3 outlined field: 56dp min height, extra-small corner radius (4dp)
    minHeight: 56,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  label: {
    position: 'absolute',
    left: 12,
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    lineHeight: 20,
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.foreground,
    padding: 0,
    margin: 0,
    // Suppress Android's default underline
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' } : {}),
  },
  trailingIcon: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 24,
    minHeight: 24,
  },
  supportingText: {
    // M3: bodySmall, colorError, 4dp gap below container
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 12,
    color: COLORS.destructive,
    marginTop: 4,
    marginLeft: 16,
    lineHeight: 16,
  },
});
