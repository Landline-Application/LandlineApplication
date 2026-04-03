import React from 'react';

import { KeyboardAvoidingView, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function FormLayout({ children, style }: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2b2b2b', // Or import from Colors
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
