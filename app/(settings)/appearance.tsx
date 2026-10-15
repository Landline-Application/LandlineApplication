import { THEMES, type Density } from '@/config/themes';
import { useAppTheme } from '@/contexts/theme-context';
import { Pressable, ScrollView, Text } from 'react-native';

const DENSITIES: Density[] = ['compact', 'comfortable', 'spacious'];

export default function AppearanceSettings() {
  const { themeId, density, setTheme, setDensity } = useAppTheme();

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', fontFamily: 'Fraunces' }}>Appearance</Text>

      <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 8 }}>Theme</Text>
      {Object.values(THEMES).map((t) => (
        <Pressable
          key={t.id}
          onPress={() => setTheme(t.id)}
          style={{ padding: 16, borderRadius: 16, backgroundColor: themeId === t.id ? '#5D7052' : '#F0EBE5' }}
        >
          <Text style={{ color: themeId === t.id ? '#FFFFFF' : '#2C2C24', fontSize: 16, fontWeight: '600' }}>{t.label}</Text>
        </Pressable>
      ))}

      <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 16 }}>Size</Text>
      {DENSITIES.map((d) => (
        <Pressable
          key={d}
          onPress={() => setDensity(d)}
          style={{ padding: 16, borderRadius: 16, backgroundColor: density === d ? '#5D7052' : '#F0EBE5' }}
        >
          <Text style={{ color: density === d ? '#FFFFFF' : '#2C2C24', fontSize: 16, fontWeight: '600' }}>
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}