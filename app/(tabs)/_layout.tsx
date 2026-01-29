import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#0F0F0F' : '#fff',
          borderTopColor: colorScheme === 'dark' ? '#333' : '#eee',
        },
      }}>
      {/* Main Landline Mode Screen */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Landline',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="phone.fill" color={color} />,
        }}
      />
      {/* Notification Log */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.fill" color={color} />,
        }}
      />
      {/* Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
      {/* Hidden dev/test screens */}
      <Tabs.Screen
        name="landline-mode-test"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="background-service-demo"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
