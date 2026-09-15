import { Pressable } from 'react-native';

import { haptics } from '@/services/haptics';
import { type BottomTabBarButtonProps } from 'expo-router/tabs';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <Pressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          haptics.light();
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
