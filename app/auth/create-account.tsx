import React from 'react';

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { CreateAccountForm } from '@/components/auth/create-account-form';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Fonts } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthCreateAccountPage() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: COLORS.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.foreground} />
        </Pressable>
        <Text style={styles.topBarTitle}>Create Account</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Join Landline</Text>
        <Text style={styles.subheading}>
          Create an account to sync your settings and notifications across devices.
        </Text>

        <CreateAccountForm
          onSuccess={() => router.back()}
          onSignIn={() => router.replace('/auth/sign-in')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  backButtonPressed: {
    backgroundColor: COLORS.surface.overlay,
  },
  topBarTitle: {
    flex: 1,
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    fontSize: 17,
    color: COLORS.foreground,
    textAlign: 'center',
  },
  topBarSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  heading: {
    fontFamily: Fonts?.serifBold ?? 'Fraunces_700Bold',
    fontSize: 28,
    color: COLORS.foreground,
    marginBottom: 6,
  },
  subheading: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.mutedForeground,
    lineHeight: 22,
    marginBottom: 28,
  },
});
