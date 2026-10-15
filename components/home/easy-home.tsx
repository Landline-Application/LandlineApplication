import { useCallback } from 'react';

import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';

import { router, type Href } from 'expo-router';

import { MaterialIcons, type MaterialIconName } from '@/components/ui/icon-symbol';
import { useActiveRefresh } from '@/hooks/use-active-refresh';
import { useLandlineStore } from '@/hooks/use-landline-store';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { haptics } from '@/services/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SHORTCUTS: { label: string; icon: MaterialIconName; href: Href }[] = [
  { label: 'Messages I Missed', icon: 'menu-book', href: '/(tabs)/notifications' },
  { label: 'Emergency Contacts', icon: 'contact-phone', href: '/emergency-contacts' },
  { label: 'Auto-Reply', icon: 'chat-bubble-outline', href: '/auto-reply' },
  { label: 'Settings', icon: 'settings', href: '/(tabs)/settings' },
];

export function EasyHome() {
  const insets = useSafeAreaInsets();
  const { theme, density } = useThemeTokens();
  const { colors, fonts } = theme;

  const {
    isActive,
    hasPermission,
    isLoading,
    notifications,
    activateLandlineMode,
    deactivateLandlineMode,
    requestPermission,
    checkStatus,
    refreshNotifications,
  } = useLandlineStore();

  useActiveRefresh(refreshNotifications, isActive);

  const body = density.fontSize;
  const big = Math.round(density.fontSize * 1.5);
  const count = notifications.length;

  const turnOff = useCallback(async () => {
    haptics.medium();
    try {
      await deactivateLandlineMode();
    } catch {
      Alert.alert('Sorry', 'Landline Mode could not be turned off. Please try again.');
    }
  }, [deactivateLandlineMode]);

  const handleMainPress = useCallback(async () => {
    haptics.light();

    if (!hasPermission) {
      try {
        await requestPermission();
        Alert.alert(
          'One more step',
          'Find Landline in the list and turn on "Allow notification access". Then come back here.',
          [{ text: 'OK', onPress: () => setTimeout(() => checkStatus(), 2000) }],
        );
      } catch {
        Alert.alert('Sorry', 'Could not open the settings page.');
      }
      return;
    }

    if (isActive) {
      Alert.alert(
        'Turn off Landline Mode?',
        'Your phone will go back to normal and notifications will show again.',
        [
          { text: 'No, keep it on', style: 'cancel' },
          { text: 'Yes, turn it off', onPress: () => void turnOff() },
        ],
      );
      return;
    }

    haptics.medium();
    try {
      await activateLandlineMode('indefinite');
    } catch {
      Alert.alert('Sorry', 'Landline Mode could not be turned on. Please try again.');
    }
  }, [hasPermission, isActive, requestPermission, checkStatus, activateLandlineMode, turnOff]);

  if (Platform.OS !== 'android') {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: density.padding * 2,
          backgroundColor: colors.background,
        }}
      >
        <Text
          style={{ fontSize: big, fontFamily: fonts.bold, color: colors.text, textAlign: 'center' }}
        >
          Landline Mode only works on Android phones.
        </Text>
      </View>
    );
  }

  const mainColor = !hasPermission ? colors.primary : isActive ? colors.danger : colors.success;
  const mainLabel = !hasPermission
    ? 'Allow Notification Access'
    : isActive
      ? 'Turn Landline Mode OFF'
      : 'Turn Landline Mode ON';

  const statusText = !hasPermission
    ? 'Landline needs your permission before it can quiet your notifications.'
    : isActive
      ? 'Landline Mode is ON. Only your emergency contacts can reach you.'
      : 'Landline Mode is OFF. Your phone works normally.';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + density.padding,
        paddingBottom: insets.bottom + density.padding * 2,
        paddingHorizontal: density.padding * 1.5,
        gap: density.gap * 1.5,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ fontSize: big, fontFamily: fonts.bold, color: colors.text }}>Landline</Text>

      {/* Status in plain words */}
      <View
        accessibilityLiveRegion="polite"
        style={{
          padding: density.padding * 1.5,
          borderRadius: density.borderRadius,
          borderWidth: 2,
          borderColor: isActive ? colors.success : colors.border,
          backgroundColor: colors.surface,
          gap: density.gap,
        }}
      >
        <Text
          style={{
            fontSize: body,
            lineHeight: body * 1.4,
            fontFamily: fonts.medium,
            color: colors.text,
          }}
        >
          {statusText}
        </Text>
        {isActive && (
          <Text style={{ fontSize: body, fontFamily: fonts.regular, color: colors.muted }}>
            {count === 0
              ? 'No messages saved yet.'
              : `${count} ${count === 1 ? 'message' : 'messages'} saved for later.`}
          </Text>
        )}
      </View>

      {/* The one big button */}
      <Pressable
        onPress={handleMainPress}
        disabled={isLoading}
        accessibilityRole="button"
        accessibilityLabel={mainLabel}
        style={({ pressed }) => ({
          minHeight: density.minTouch * 2.5,
          borderRadius: density.borderRadius,
          backgroundColor: mainColor,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: density.padding,
          opacity: isLoading ? 0.6 : pressed ? 0.85 : 1,
        })}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primaryText} />
        ) : (
          <Text
            style={{
              fontSize: big,
              fontFamily: fonts.bold,
              color: colors.primaryText,
              textAlign: 'center',
            }}
          >
            {mainLabel}
          </Text>
        )}
      </Pressable>

      {/* Big shortcuts */}
      {SHORTCUTS.map((s) => (
        <Pressable
          key={s.label}
          onPress={() => {
            haptics.light();
            router.push(s.href);
          }}
          accessibilityRole="button"
          accessibilityLabel={s.label}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: density.gap,
            minHeight: density.minTouch * 1.5,
            paddingHorizontal: density.padding * 1.5,
            borderRadius: density.borderRadius,
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: pressed ? colors.border : colors.surface,
          })}
        >
          <MaterialIcons name={s.icon} size={body * 1.6} color={colors.primary} />
          <Text
            style={{ flex: 1, fontSize: body * 1.1, fontFamily: fonts.medium, color: colors.text }}
          >
            {s.label}
          </Text>
          <MaterialIcons name="chevron-right" size={body * 1.6} color={colors.muted} />
        </Pressable>
      ))}
    </ScrollView>
  );
}