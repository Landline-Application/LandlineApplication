import React from 'react';

import { View } from 'react-native';

import { Tabs } from 'expo-router';

import { TutorialOverlay } from '@/components/tutorial/tutorial-overlay';
import { TutorialTargetsProvider } from '@/components/tutorial/tutorial-targets-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { NavigationBar } from '@/components/ui/navigation-bar';

export default function TabLayout() {
  return (
    <TutorialTargetsProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          tabBar={(props: any) => <NavigationBar {...props} />}
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
        </Tabs>
        <TutorialOverlay />
      </View>
    </TutorialTargetsProvider>
  );
}
