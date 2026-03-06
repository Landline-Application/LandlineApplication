import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/**
 * SF Symbols to Material Icons mapping.
 * - Material Icons: https://icons.expo.fyi
 * - SF Symbols: https://developer.apple.com/sf-symbols/
 */
const ICON_MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'bell.fill': 'notifications',
  'phone.fill': 'phone',
  'checkmark.circle.fill': 'check-circle',
  'slider.horizontal.3': 'settings',
  'list.bullet': 'list',
  code: 'code',
  gear: 'settings',
  'gear.circle.fill': 'settings',
  'wrench.fill': 'build',
} as const;

type IconName = keyof typeof ICON_MAPPING;

interface IconSymbolProps {
  name: IconName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}

/**
 * Icon component that maps SF Symbols (iOS) to Material Icons (Android/web).
 * Ensures consistent cross-platform appearance.
 */
export function IconSymbol({ name, size = 24, color, style }: IconSymbolProps) {
  return <MaterialIcons name={ICON_MAPPING[name]} size={size} color={color} style={style} />;
}
