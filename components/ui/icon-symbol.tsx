import { type OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export { MaterialIcons };
export type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface IconSymbolProps {
  name: MaterialIconName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}

/**
 * Icon component backed by Material Icons.
 * Browse available names at: https://icons.expo.fyi (filter by MaterialIcons)
 */
export function IconSymbol({ name, size = 24, color, style }: IconSymbolProps) {
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}
