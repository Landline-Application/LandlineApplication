import React from 'react';

import {
  type DimensionValue,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, Fonts, Radius, Shadows } from '@/constants/theme';
import { haptics } from '@/services/haptics';

/**
 * Ambient background blob — positioned absolutely, rounded shape
 * that creates depth and color washes behind content.
 */
interface BlobProps {
  color: string;
  size: number;
  top?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
  opacity?: number;
  /** Index 0-3 selects a different border-radius shape */
  shapeIndex?: number;
}

const BLOB_SHAPES = [
  {
    borderTopLeftRadius: '50%',
    borderTopRightRadius: '50%',
    borderBottomLeftRadius: '50%',
    borderBottomRightRadius: '50%',
  },
  {
    borderTopLeftRadius: '50%',
    borderTopRightRadius: '50%',
    borderBottomLeftRadius: '50%',
    borderBottomRightRadius: '50%',
  },
  {
    borderTopLeftRadius: '50%',
    borderTopRightRadius: '50%',
    borderBottomLeftRadius: '50%',
    borderBottomRightRadius: '50%',
  },
  {
    borderTopLeftRadius: '50%',
    borderTopRightRadius: '50%',
    borderBottomLeftRadius: '50%',
    borderBottomRightRadius: '50%',
  },
];

export function Blob({
  color,
  size,
  top,
  left,
  right,
  bottom,
  opacity = 0.15,
  shapeIndex = 0,
}: BlobProps) {
  const shape = BLOB_SHAPES[shapeIndex % BLOB_SHAPES.length];
  const radiusScale = size / 2;
  const parsePercent = (val: string) => (parseFloat(val) / 100) * radiusScale;

  return (
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        backgroundColor: color,
        opacity,
        top,
        left,
        right,
        bottom,
        borderTopLeftRadius: parsePercent(shape.borderTopLeftRadius as string),
        borderTopRightRadius: parsePercent(shape.borderTopRightRadius as string),
        borderBottomLeftRadius: parsePercent(shape.borderBottomLeftRadius as string),
        borderBottomRightRadius: parsePercent(shape.borderBottomRightRadius as string),
      }}
    />
  );
}

/**
 * Subtle grain/noise texture overlay — simulates paper quality.
 */
export function GrainOverlay() {
  return (
    <View style={styles.grainContainer} pointerEvents="none">
      <LinearGradient
        colors={['rgba(44, 44, 36, 0.025)', 'rgba(44, 44, 36, 0.015)', 'rgba(44, 44, 36, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/**
 * Page wrapper with background, blobs, and grain.
 */
interface PageProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  blobs?: BlobProps[];
}

export function Page({ children, style, blobs }: PageProps) {
  return (
    <View style={[styles.page, style]}>
      {blobs?.map((blob) => (
        <Blob key={`${blob.color}-${blob.size}-${blob.top ?? ''}-${blob.left ?? ''}`} {...blob} />
      ))}
      <GrainOverlay />
      {children}
    </View>
  );
}

/**
 * Pill-shaped button with primary/secondary/outline/ghost variants.
 */
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  labelStyle,
}: ButtonProps) {
  const buttonStyles = [
    styles.buttonBase,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'outline' && styles.buttonOutline,
    variant === 'ghost' && styles.buttonGhost,
    variant === 'secondary' && styles.buttonSecondary,
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyles: StyleProp<TextStyle>[] = [
    styles.buttonText,
    variant === 'primary' && styles.buttonTextPrimary,
    variant === 'outline' && styles.buttonTextOutline,
    variant === 'ghost' && styles.buttonTextGhost,
    variant === 'secondary' && styles.buttonTextSecondary,
    disabled && styles.buttonTextDisabled,
    labelStyle,
  ];

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        ...buttonStyles,
        pressed && { transform: [{ scale: 0.96 }] },
        !pressed && !disabled && variant === 'primary' && Shadows.sm,
      ]}
    >
      <Text style={textStyles}>{loading ? 'Loading...' : label}</Text>
    </Pressable>
  );
}

/**
 * Card with configurable border radius and colored shadow.
 */
interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  shapeVariant?: number;
}

export function Card({ children, style }: CardProps) {
  const radii = { borderRadius: Radius.card };

  return <View style={[styles.card, radii, Shadows.sm, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  grainContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    opacity: 0.6,
  },
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },

  // Button styles
  buttonBase: {
    height: 56,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonSecondary: {
    backgroundColor: COLORS.secondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: Fonts?.sansBold ?? 'Nunito_700Bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  buttonTextPrimary: {
    color: COLORS.primaryForeground,
  },
  buttonTextOutline: {
    color: COLORS.secondary,
  },
  buttonTextGhost: {
    color: COLORS.primary,
  },
  buttonTextSecondary: {
    color: COLORS.secondaryForeground,
  },
  buttonTextDisabled: {
    color: COLORS.mutedForeground,
  },

  // Card styles
  card: {
    backgroundColor: COLORS.surface.card,
    borderWidth: 1,
    borderColor: 'rgba(222, 216, 207, 0.5)',
    padding: 20,
  },
});
