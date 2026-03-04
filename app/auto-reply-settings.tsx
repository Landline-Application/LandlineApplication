import React, { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect } from 'expo-router';

import { useAppTheme } from '@/contexts/theme-context';
import {
  getAllowedApps,
  getReplyMessage,
  isAutoReplyEnabled,
  isListenerEnabled,
  requestListenerPermission,
  setAllowedApps,
  setAutoReplyEnabled,
  setReplyMessage,
} from '@/modules/auto-reply-manager';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 'meeting',
    label: 'In a Meeting',
    message: "I'm currently in a meeting. I'll get back to you as soon as it's over.",
  },
  {
    id: 'vacation',
    label: 'On Vacation',
    message:
      "I'm currently out of office on vacation. I'll respond when I return. For urgent matters, please contact my team.",
  },
  {
    id: 'driving',
    label: 'Driving',
    message: "I'm driving right now and can't respond. I'll reply when I arrive safely.",
  },
  {
    id: 'focus',
    label: 'Focus Time',
    message: "I'm in focus mode and not checking messages right now. I'll catch up with you later.",
  },
  {
    id: 'away',
    label: 'Away',
    message: "I'm away from my phone right now. I'll get back to you shortly.",
  },
];

// ─── App category presets ─────────────────────────────────────────────────────

const APP_PRESETS = [
  {
    id: 'all',
    label: 'All Apps',
    description: 'Reply to any app with a reply action',
    packages: [] as string[],
  },
  {
    id: 'messaging',
    label: 'Messaging Only',
    description: 'WhatsApp, Messenger, Telegram, SMS',
    packages: [
      'com.whatsapp',
      'com.facebook.orca',
      'org.telegram.messenger',
      'com.google.android.apps.messaging',
      'com.samsung.android.messaging',
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Only',
    description: 'Only reply to WhatsApp messages',
    packages: ['com.whatsapp'],
  },
];

// ─── Main component ──────────────────────────────────────────────────────────

export default function AutoReplySettingsScreen() {
  const { isDark } = useAppTheme();
  const t = isDark ? dark : light;

  const [enabled, setEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [message, setMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [allowedApps, setAllowedAppsState] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('all');

  const refresh = useCallback(() => {
    if (Platform.OS !== 'android') return;
    setHasPermission(isListenerEnabled());
    setEnabled(isAutoReplyEnabled());
    const msg = getReplyMessage();
    setMessage(msg);
    setEditingMessage(msg);

    const apps = getAllowedApps();
    setAllowedAppsState(apps);
    const match = APP_PRESETS.find(
      (p) => p.packages.length === apps.length && p.packages.every((pkg) => apps.includes(pkg)),
    );
    setSelectedPreset(match?.id ?? 'custom');
  }, []);

  useFocusEffect(refresh);

  const handleToggleEnabled = async (value: boolean) => {
    if (value && !hasPermission) {
      Alert.alert(
        'Permission Required',
        'Notification Listener access is needed for auto-reply to work.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Grant Permission',
            onPress: async () => {
              await requestListenerPermission();
              setTimeout(refresh, 1000);
            },
          },
        ],
      );
      return;
    }
    await setAutoReplyEnabled(value);
    setEnabled(value);
  };

  const handleSelectTemplate = (tmpl: (typeof TEMPLATES)[number]) => {
    setEditingMessage(tmpl.message);
    setIsEditing(true);
  };

  const handleSaveMessage = async () => {
    if (!editingMessage.trim()) {
      Alert.alert('Empty Message', 'Please enter a reply message.');
      return;
    }
    await setReplyMessage(editingMessage.trim());
    setMessage(editingMessage.trim());
    setIsEditing(false);
    Alert.alert('Saved', 'Your auto-reply message has been updated.');
  };

  const handleCancelEdit = () => {
    setEditingMessage(message);
    setIsEditing(false);
  };

  const handleSelectPreset = async (preset: (typeof APP_PRESETS)[number]) => {
    await setAllowedApps(preset.packages);
    setAllowedAppsState(preset.packages);
    setSelectedPreset(preset.id);
  };

  if (Platform.OS !== 'android') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
        <View style={styles.center}>
          <Text style={{ color: t.textSecondary }}>Android only</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Enable / Disable */}
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text style={[styles.cardTitle, { color: t.text }]}>Auto-Reply</Text>
              <Text style={[styles.cardSubtitle, { color: t.textSecondary }]}>
                Automatically respond to incoming messages
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: '#555', true: '#5B7FE8' }}
              thumbColor={enabled ? '#fff' : '#ccc'}
            />
          </View>
          {!hasPermission && (
            <View style={[styles.warningBanner, { backgroundColor: t.warningBg }]}>
              <Text style={styles.warningText}>Notification Listener permission required</Text>
            </View>
          )}
        </View>

        {/* Current message */}
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <Text style={[styles.cardTitle, { color: t.text }]}>Reply Message</Text>
          {isEditing ? (
            <>
              <TextInput
                style={[
                  styles.messageInput,
                  {
                    backgroundColor: t.inputBg,
                    color: t.text,
                    borderColor: t.border,
                  },
                ]}
                value={editingMessage}
                onChangeText={setEditingMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={t.textSecondary}
                placeholder="Type your auto-reply message..."
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: t.border }]}
                  onPress={handleCancelEdit}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.editButtonText, { color: t.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton]}
                  onPress={handleSaveMessage}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={[styles.messagePreview, { backgroundColor: t.inputBg }]}>
                <Text style={[styles.messagePreviewText, { color: t.text }]}>
                  {message || 'No message set'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.editTrigger, { borderColor: t.accent }]}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.editTriggerText, { color: t.accent }]}>Edit Message</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Templates */}
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <Text style={[styles.cardTitle, { color: t.text }]}>Quick Templates</Text>
          <Text style={[styles.cardSubtitle, { color: t.textSecondary }]}>
            Tap a template to load it into the editor
          </Text>
          <View style={styles.templateList}>
            {TEMPLATES.map((tmpl) => (
              <TouchableOpacity
                key={tmpl.id}
                style={[styles.templateChip, { borderColor: t.border }]}
                onPress={() => handleSelectTemplate(tmpl)}
                activeOpacity={0.7}
              >
                <Text style={[styles.templateChipLabel, { color: t.text }]}>{tmpl.label}</Text>
                <Text
                  style={[styles.templateChipPreview, { color: t.textSecondary }]}
                  numberOfLines={1}
                >
                  {tmpl.message}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allowed apps */}
        <View style={[styles.card, { backgroundColor: t.card }]}>
          <Text style={[styles.cardTitle, { color: t.text }]}>Reply to Apps</Text>
          <Text style={[styles.cardSubtitle, { color: t.textSecondary }]}>
            Choose which apps trigger an auto-reply
          </Text>
          {APP_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetRow,
                  { borderColor: isSelected ? t.accent : t.border },
                  isSelected && { backgroundColor: t.accentBg },
                ]}
                onPress={() => handleSelectPreset(preset)}
                activeOpacity={0.7}
              >
                <View style={styles.presetRadio}>
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: isSelected ? t.accent : t.textSecondary },
                    ]}
                  >
                    {isSelected && (
                      <View style={[styles.radioInner, { backgroundColor: t.accent }]} />
                    )}
                  </View>
                </View>
                <View style={styles.presetInfo}>
                  <Text style={[styles.presetLabel, { color: t.text }]}>{preset.label}</Text>
                  <Text style={[styles.presetDesc, { color: t.textSecondary }]}>
                    {preset.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {selectedPreset === 'custom' && (
            <View style={[styles.customBadge, { backgroundColor: t.warningBg }]}>
              <Text style={styles.customBadgeText}>
                Custom app selection ({allowedApps.length} apps)
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const light = {
  bg: '#f5f5f5',
  card: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#777',
  border: '#e0e0e0',
  accent: '#5B7FE8',
  accentBg: 'rgba(91,127,232,0.08)',
  inputBg: '#f8f8f8',
  warningBg: '#FFF3CD',
};

const dark = {
  bg: '#0a0a0a',
  card: '#1c1c1c',
  text: '#f0f0f0',
  textSecondary: '#888',
  border: '#2a2a2a',
  accent: '#5B7FE8',
  accentBg: 'rgba(91,127,232,0.12)',
  inputBg: '#141414',
  warningBg: '#3a2e00',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    padding: 16,
    gap: 14,
  },

  card: {
    borderRadius: 14,
    padding: 18,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    flex: 1,
    marginRight: 16,
  },
  warningBanner: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#856404',
  },

  messagePreview: {
    borderRadius: 10,
    padding: 14,
    minHeight: 60,
  },
  messagePreviewText: {
    fontSize: 15,
    lineHeight: 22,
  },
  editTrigger: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editTriggerText: {
    fontSize: 14,
    fontWeight: '600',
  },

  messageInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 110,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#5B7FE8',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  templateList: {
    gap: 8,
  },
  templateChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  templateChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  templateChipPreview: {
    fontSize: 12,
    lineHeight: 16,
  },

  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  presetRadio: {
    marginRight: 14,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  presetInfo: {
    flex: 1,
  },
  presetLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  presetDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  customBadge: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  customBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#856404',
  },
});
