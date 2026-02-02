import React from 'react';

import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { COLORS } from '@/constants/colors';

interface RolodexCardProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function RolodexCard({ title, children, style }: RolodexCardProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.tab}>
        <Text style={styles.tabText}>{title}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.content}>{children}</View>

        <View style={styles.punchHoleContainer}>
          <View style={styles.punchHole} />
          <View style={styles.punchHole} />
        </View>
      </View>

      <View style={styles.shadowLayer} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 20,
    width: '100%',
  },

  tab: {
    alignSelf: 'center',
    backgroundColor: COLORS.tabBg,
    paddingVertical: 6,
    paddingHorizontal: 24,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.tabBorder,
    marginBottom: -1,
    zIndex: 2,
  },
  tabText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    zIndex: 1,
    overflow: 'hidden',
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },

  punchHoleContainer: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 80,
    zIndex: 10,
  },
  punchHole: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  shadowLayer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    bottom: -10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    zIndex: 0,
  },
});
