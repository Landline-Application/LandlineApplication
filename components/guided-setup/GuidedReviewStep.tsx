import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AppSelectionModel } from '@/components/app-selection/use-app-selection';

type Props = {
  model: AppSelectionModel;
};

export function GuidedReviewStep({ model }: Props) {
  const { filterEnabled, allowedPackages, emergencyNumbers, installedApps } = model;

  const allowedAppRows = useMemo(() => {
    const rows: { key: string; label: string }[] = [];
    for (const pkg of allowedPackages) {
      const app = installedApps.find((a) => a.packageName === pkg);
      rows.push({ key: pkg, label: app?.appName ?? pkg });
    }
    return rows.sort((a, b) => a.label.localeCompare(b.label));
  }, [allowedPackages, installedApps]);

  const isAndroid = Platform.OS === 'android';

  if (!isAndroid) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardBody}>
            Notification filtering and emergency numbers are set up on Android. On this device you
            skipped those steps; tap Finish to complete setup.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Notification filtering</Text>
      <View style={styles.card}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Landline Mode filter</Text>
          <Text style={[styles.summaryValue, filterEnabled ? styles.on : styles.off]}>
            {filterEnabled ? 'On' : 'Off'}
          </Text>
        </View>
        <Text style={styles.cardFootnote}>
          {filterEnabled
            ? 'Only selected apps and matching emergency numbers keep notifications in the shade.'
            : 'Landline Mode will not restrict notifications by app using this filter.'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Apps that can bypass</Text>
      <View style={styles.card}>
        {!filterEnabled ? (
          <Text style={styles.muted}>Not used while filtering is off.</Text>
        ) : allowedAppRows.length === 0 ? (
          <Text style={styles.muted}>
            No apps selected. If filtering stays on, add apps in the previous step or rely on
            emergency numbers only.
          </Text>
        ) : (
          allowedAppRows.map(({ key, label }) => (
            <View key={key} style={styles.listRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{label}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>Emergency numbers</Text>
      <View style={styles.card}>
        {emergencyNumbers.length === 0 ? (
          <Text style={styles.muted}>None added</Text>
        ) : (
          emergencyNumbers.map((num) => (
            <View key={num} style={styles.listRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{num}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5e5',
  },
  cardBody: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  on: {
    color: '#34c759',
  },
  off: {
    color: '#888',
  },
  cardFootnote: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  muted: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 4,
  },
  bullet: {
    fontSize: 15,
    color: '#007AFF',
    marginRight: 8,
    lineHeight: 22,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    lineHeight: 22,
  },
});
