/**
 * M3 Navigation Bar
 * Spec: https://m3.material.io/components/navigation-bar/guidelines
 *
 * - 80dp height container (above system gesture bar)
 * - Active indicator: 64×32dp pill behind icon
 * - Icon: 24dp, centered inside indicator
 * - Label: 12sp labelMedium, always visible
 * - Active: icon+label use `primary`; indicator uses `primaryContainer` (15% alpha tint)
 * - Inactive: icon+label use `onSurfaceVariant` (text.muted)
 * - No top border — surface elevation differentiates the bar
 * - Minimum 48dp touch target per item
 */
import React from 'react';

import { Animated, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import * as Haptics from 'expo-haptics';

import { COLORS, Shadows, Typography } from '@/constants/theme';
import { type BottomTabBarProps } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// M3 spec dimensions
const NAV_BAR_HEIGHT = 80;
const INDICATOR_WIDTH = 64;
const INDICATOR_HEIGHT = 32;
const ICON_SIZE = 24;

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

function NavItem({
  label,
  icon,
  focused,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: NavItemProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const indicatorScaleAnim = React.useRef(new Animated.Value(focused ? 1 : 0.8)).current;
  const indicatorOpacityAnim = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(indicatorScaleAnim, {
        toValue: focused ? 1 : 0.8,
        useNativeDriver: true,
        bounciness: 4,
        speed: 20,
      }),
      Animated.timing(indicatorOpacityAnim, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, indicatorScaleAnim, indicatorOpacityAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 6,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const activeColor = COLORS.primary;
  const inactiveColor = COLORS.text.muted;
  const indicatorBg = COLORS.primary + '22'; // ~13% opacity tint

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      testID={testID}
      style={styles.itemContainer}
    >
      <Animated.View style={[styles.itemInner, { transform: [{ scale: scaleAnim }] }]}>
        {/* Active indicator pill */}
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: indicatorBg,
              opacity: indicatorOpacityAnim,
              transform: [{ scaleX: indicatorScaleAnim }, { scaleY: indicatorScaleAnim }],
            },
          ]}
        />

        {/* Icon */}
        <View style={styles.iconWrapper}>
          <View style={{ opacity: 1 }}>
            {React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, {
                  color: focused ? activeColor : inactiveColor,
                })
              : icon}
          </View>
        </View>

        {/* Label */}
        <Text
          style={[
            styles.label,
            { color: focused ? activeColor : inactiveColor },
            focused && styles.labelActive,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function NavigationBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    // expo-router sets tabBarItemStyle.display='none' when href is null
    const itemStyle = options.tabBarItemStyle as { display?: string } | undefined;
    return itemStyle?.display !== 'none';
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          height: NAV_BAR_HEIGHT + insets.bottom,
        },
      ]}
    >
      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === state.routes.indexOf(route);

        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : (options.title ?? route.name);

        const icon = options.tabBarIcon
          ? options.tabBarIcon({
              focused: isFocused,
              color: isFocused ? COLORS.primary : COLORS.text.muted,
              size: ICON_SIZE,
            })
          : null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <NavItem
            key={route.key}
            label={label}
            icon={icon}
            focused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface.elevated,
    // M3: elevation 2 — use shadow instead of border
    ...Shadows.sm,
    elevation: 2,
  } as ViewStyle,

  itemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
    // Minimum 48dp touch target
    minHeight: 48,
  } as ViewStyle,

  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  indicator: {
    position: 'absolute',
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2, // pill shape
    top: 0,
  } as ViewStyle,

  iconWrapper: {
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  label: {
    fontSize: Typography.labelSm.fontSize, // 12sp
    fontFamily: 'Nunito_600SemiBold', // labelMedium weight
    marginTop: 4,
    letterSpacing: 0.5,
  },

  labelActive: {
    fontFamily: 'Nunito_700Bold',
  },
});
