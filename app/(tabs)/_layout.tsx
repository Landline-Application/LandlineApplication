import React from 'react';

import { Tabs } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { NavigationBar } from '@/components/ui/navigation-bar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <NavigationBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Log',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="menu-book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Landline',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={24}
              name="phone"
              color={color}
              style={{ transform: [{ rotate: '135deg' }] }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="settings" color={color} />,
        }}
      />
      <Tabs.Screen
        name="landline"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="debug-tools"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
