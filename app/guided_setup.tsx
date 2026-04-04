import { useState } from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOTAL_STEPS = 3;

const STEP_CONTENT: { title: string; body: string }[] = [
  {
    title: 'Choose apps',
    body: 'Placeholder - app selection will move here in the next task.',
  },
  {
    title: 'Emergency contact',
    body: 'Placeholder - emergency contact step will go here.',
  },
  {
    title: 'Review',
    body: 'Placeholder - summary and confirm before finishing.',
  },
];

export default function GuidedSetup() {
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);

  const isFirst = step === 1;
  const isLast = step === TOTAL_STEPS;
  const index = step - 1;

  const { title, body } = STEP_CONTENT[index];

  function goBack() {
    if (!isFirst) setStep((s) => s - 1);
  }

  function goNext() {
    if (isLast) {
      router.replace('/(tabs)' as any);
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
    >
      <Text style={styles.progress}>
        {' '}
        Step {step} of {TOTAL_STEPS}{' '}
      </Text>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{body}</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, isFirst && styles.buttonDisabled]}
          onPress={goBack}
          disabled={isFirst}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonTextSecondary, isFirst && styles.buttonTextDisabled]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={goNext} activeOpacity={0.8}>
          <Text style={styles.buttonTextPrimary}>{isLast ? 'Finish' : 'Next'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.exitLink}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  progress: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
    marginBottom: 32,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#999',
  },
  exitLink: {
    fontSize: 15,
    color: '#007AFF',
    textAlign: 'center',
  },
});
