import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GuidedEmergencyStep } from '@/components/guided-setup/GuidedEmergencyStep';
import { GuidedNotificationStep } from '@/components/guided-setup/GuidedNotificationStep';
import { GuidedReviewStep } from '@/components/guided-setup/GuidedReviewStep';
import { G } from '@/components/guided-setup/theme';
import { useAppSelection } from '@/components/app-selection/use-app-selection';
import { COLORS } from '@/constants/colors';
import { STORAGE_KEYS } from '@/utils/storage/storage-keys';

const TOTAL_STEPS = 3;

const STEP_CONTENT: { title: string; body: string }[] = [
  {
    title: 'Choose apps',
    body:
      'Turn on notification filtering if you want it, then choose which apps can still notify you during Landline Mode. You’ll add emergency contacts in the next step. Tap Save when you’re ready, then Next.',
  },
  {
    title: 'Emergency numbers',
    body:
      'Add numbers that should still break through notification filtering when their digits appear in an alert (for example a text from that number). This is optional if you turned filtering off. Tap Save when you’re ready, then Next.',
  },
  {
    title: 'Review',
    body:
      'Here’s what you chose. Go back if you want to change anything. Tap Finish when you’re ready.',
  },
];

export default function GuidedSetup() {
  const insets = useSafeAreaInsets();

  const appSelection = useAppSelection({ onSaveSuccessDismiss: () => {} });
  const { loading: appListLoading, saving, hasChanges, persist } = appSelection;

  const [step, setStep] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.GUIDED_SETUP_STEP);
        if (cancelled) return;
        if (raw != null) {
          const n = parseInt(raw, 10);
          if (!Number.isNaN(n)) {
            setStep(Math.min(TOTAL_STEPS, Math.max(1, n)));
          }
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistStep = useCallback(async (next: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GUIDED_SETUP_STEP, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  const clearProgress = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.GUIDED_SETUP_STEP);
    } catch {
      /* ignore */
    }
  }, []);

  const markCompleted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GUIDED_SETUP_COMPLETED, 'true');
    } catch {
      /* ignore */
    }
  }, []);

  const isFirst = step === 1;
  const isLast = step === TOTAL_STEPS;
  const index = step - 1;
  const { title, body } = STEP_CONTENT[index];

  function goBack() {
    if (!isFirst) {
      const next = step - 1;
      setStep(next);
      void persistStep(next);
    }
  }

  async function goNext() {
    if (isLast) {
      await markCompleted();
      await clearProgress();
      router.replace('/(tabs)' as any);
      return;
    }
    const next = Math.min(TOTAL_STEPS, step + 1);
    setStep(next);
    void persistStep(next);
  }

  if (!hydrated) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <ActivityIndicator size="large" color={G.headline} />
      </View>
    );
  }

  const showAndroidStep1 = step === 1 && Platform.OS === 'android';
  const showAndroidStep2 = step === 2 && Platform.OS === 'android';
  const showStep3 = step === 3;
  const showSaveInFooter =
    showAndroidStep1 ||
    showAndroidStep2 ||
    (showStep3 && Platform.OS === 'android' && hasChanges);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <Text style={styles.progress}>
        Step {step} of {TOTAL_STEPS}
      </Text>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{body}</Text>

      {showAndroidStep1 &&
        (appListLoading ? (
          <View style={styles.stepBody}>
            <ActivityIndicator size="large" color={COLORS.textPrimary} />
            <Text style={styles.loadingHint}>Loading your apps…</Text>
          </View>
        ) : (
          <View style={styles.stepBody}>
            <GuidedNotificationStep model={appSelection} />
          </View>
        ))}

      {step === 1 && Platform.OS !== 'android' && (
        <Text style={styles.hint}>
          Notification app selection is available on Android. Use Next to continue the rest of the
          setup on this device.
        </Text>
      )}

      {showAndroidStep2 &&
        (appListLoading ? (
          <View style={styles.stepBody}>
            <ActivityIndicator size="large" color={COLORS.textPrimary} />
            <Text style={styles.loadingHint}>Loading…</Text>
          </View>
        ) : (
          <View style={styles.stepBody}>
            <GuidedEmergencyStep model={appSelection} />
          </View>
        ))}

      {step === 2 && Platform.OS !== 'android' && (
        <Text style={styles.hint}>
          Emergency numbers for notification filtering are available on Android. Use Next to
          continue.
        </Text>
      )}

      {showStep3 &&
        (appListLoading && Platform.OS === 'android' ? (
          <View style={styles.stepBody}>
            <ActivityIndicator size="large" color={COLORS.textPrimary} />
            <Text style={styles.loadingHint}>Loading…</Text>
          </View>
        ) : (
          <View style={styles.stepBody}>
            <GuidedReviewStep model={appSelection} />
          </View>
        ))}

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

        {showSaveInFooter && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonOutline,
              (!hasChanges || saving) && styles.buttonDisabled,
            ]}
            onPress={() => void persist()}
            disabled={!hasChanges || saving}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.buttonTextOutline,
                (!hasChanges || saving) && styles.buttonTextOutlineMuted,
              ]}
            >
              {saving ? '…' : 'Save'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.button} onPress={() => void goNext()} activeOpacity={0.8}>
          <Text style={styles.buttonTextPrimary}>{isLast ? 'Finish' : 'Next'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={styles.exitLink}>Exit setup</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: G.screen,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBody: {
    flex: 1,
    minHeight: 0,
    marginBottom: 12,
    backgroundColor: G.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: G.panelBorder,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  loadingHint: {
    marginTop: 12,
    fontSize: 14,
    color: G.muted,
    textAlign: 'center',
  },
  progress: {
    fontSize: 12,
    fontWeight: '800',
    color: G.progress,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    color: G.headline,
    letterSpacing: 0.5,
    ...Platform.select({
      ios: { fontFamily: 'Courier' },
      default: { fontFamily: 'monospace' },
    }),
  },
  subtitle: {
    fontSize: 15,
    color: G.subOnDark,
    lineHeight: 22,
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: G.subOnDark,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    marginBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: G.primary,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonSecondary: {
    backgroundColor: G.secondarySurface,
    borderWidth: 1,
    borderColor: G.secondaryBorder,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: G.outlineOnDark,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonTextPrimary: {
    color: G.onPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonTextSecondary: {
    color: G.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: G.onPrimary,
  },
  buttonTextOutline: {
    color: G.outlineOnDark,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonTextOutlineMuted: {
    color: G.outlineOnDark,
  },
  exitLink: {
    fontSize: 15,
    color: G.headline,
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
