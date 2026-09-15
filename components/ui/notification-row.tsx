import React from 'react';

import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppAvatar } from '@/components/ui/app-avatar';
import { Badge } from '@/components/ui/badge';
import { COLORS, Spacing } from '@/constants/theme';

export interface NotificationRowProps {
  appName: string;
  title: string;
  text?: string;
  time?: string;
  autoReplied?: boolean;
  showAvatar?: boolean;
  divider?: boolean;
  style?: ViewStyle;
}

export function NotificationRow({
  appName,
  title,
  text,
  time,
  autoReplied = false,
  showAvatar = false,
  divider = false,
  style,
}: NotificationRowProps) {
  return (
    <View style={[styles.row, divider && styles.divider, style]}>
      {showAvatar && <AppAvatar name={appName} size={32} />}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {time ? <Text style={styles.time}>{time}</Text> : null}
        </View>
        {text ? <Text style={styles.text} numberOfLines={2}>{text}</Text> : null}
        {autoReplied ? (
          <View style={styles.badgeWrap}>
            <Badge label="↩ Auto Replied" tone="primary" soft />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: COLORS.surface.base,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.muted,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: 'Fraunces_700Bold',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.text.primary,
  },
  time: {
    flexShrink: 0,
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    lineHeight: 18,
    color: COLORS.text.muted,
  },
  text: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text.secondary,
  },
  badgeWrap: {
    marginTop: 3,
    alignSelf: 'flex-start',
  },
});
