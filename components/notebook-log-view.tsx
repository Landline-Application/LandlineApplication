import React, { useState } from 'react';

import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

interface NotebookLogEntry {
  id: number;
  appName: string;
  title: string;
  text: string;
  postTime: number;
  packageName: string;
}

interface NotebookLogViewProps {
  notifications: NotebookLogEntry[];
  onRefresh?: () => void;
}

const { width } = Dimensions.get('window');
const TAB_WIDTH = 40;
const PAGE_MARGIN = 20;

export default function NotebookLogView({ notifications, onRefresh: _ }: NotebookLogViewProps) {
  const [selectedTab, setSelectedTab] = useState<string>('all');

  // Group notifications by first letter of app name
  const groupedNotifications = notifications.reduce(
    (acc, notif) => {
      const firstLetter = notif.appName[0]?.toUpperCase() || '#';
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(notif);
      return acc;
    },
    {} as Record<string, NotebookLogEntry[]>,
  );

  const tabs = ['all', ...Object.keys(groupedNotifications).sort()];
  const displayNotifications =
    selectedTab === 'all' ? notifications : groupedNotifications[selectedTab] || [];

  return (
    <View style={styles.container}>
      {/* Notebook Cover/Background */}
      <LinearGradient colors={['#8B7355', '#6B5A44', '#4A3F2F']} style={StyleSheet.absoluteFill} />

      {/* Side Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive, { top: index * 45 }]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={styles.tabText}>{tab === 'all' ? 'ALL' : tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notebook Page */}
      <View style={styles.pageContainer}>
        {/* Page Shadow */}
        <View style={styles.pageShadow} />

        {/* Main Page */}
        <View style={styles.page}>
          {/* Red Margin Line */}
          <View style={styles.marginLine} />

          {/* Spiral Binding Holes */}
          <View style={styles.bindingHoles}>
            {[...Array(12)].map((_, i) => (
              <View key={i} style={styles.hole} />
            ))}
          </View>

          {/* Page Content */}
          <ScrollView
            style={styles.pageScroll}
            contentContainerStyle={styles.pageContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Page Header */}
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>Landline Log</Text>
              <Text style={styles.pageSubtitle}>
                {displayNotifications.length}{' '}
                {displayNotifications.length === 1 ? 'notification' : 'notifications'}
              </Text>
            </View>

            {/* Notifications List */}
            {displayNotifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No notifications logged yet</Text>
                <Text style={styles.emptySubtext}>Activate Landline Mode to start capturing</Text>
              </View>
            ) : (
              displayNotifications.map((notif, index) => (
                <View key={`${notif.id}-${index}`} style={styles.logEntry}>
                  {/* Horizontal Rule (lined paper effect) */}
                  <View style={styles.linedPaperRule} />

                  {/* Log Entry Content */}
                  <View style={styles.entryContent}>
                    {/* Header Row */}
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryApp} numberOfLines={1}>
                        📱 {notif.appName}
                      </Text>
                      <Text style={styles.entryTime}>{formatTime(notif.postTime)}</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.entryTitle} numberOfLines={2}>
                      {notif.title}
                    </Text>

                    {/* Body Text */}
                    {notif.text && (
                      <Text style={styles.entryText} numberOfLines={3}>
                        {notif.text}
                      </Text>
                    )}

                    {/* Timestamp */}
                    <Text style={styles.entryTimestamp}>
                      {new Date(notif.postTime).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                  </View>
                </View>
              ))
            )}

            {/* Page Footer */}
            <View style={styles.pageFooter}>
              <Text style={styles.pageNumber}>{new Date().toLocaleDateString()}</Text>
            </View>
          </ScrollView>
        </View>

        {/* Page Edge Effect */}
        <View style={styles.pageEdge} />
      </View>
    </View>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3d3325',
  },
  tabsContainer: {
    position: 'absolute',
    right: 0,
    top: 60,
    bottom: 0,
    width: TAB_WIDTH,
    zIndex: 10,
  },
  tabsContent: {
    paddingVertical: 20,
  },
  tab: {
    width: TAB_WIDTH,
    height: 40,
    backgroundColor: '#D4AF7A',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#8B7355',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  tabActive: {
    backgroundColor: '#F4E4C1',
    width: TAB_WIDTH + 8,
    borderColor: '#6B5A44',
    shadowOpacity: 0.5,
  },
  tabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3d3325',
    transform: [{ rotate: '-90deg' }],
    width: 35,
    textAlign: 'center',
  },
  pageContainer: {
    flex: 1,
    marginTop: 40,
    marginBottom: 20,
    marginLeft: PAGE_MARGIN,
    marginRight: TAB_WIDTH + PAGE_MARGIN,
  },
  pageShadow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: -8,
    bottom: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
  },
  page: {
    flex: 1,
    backgroundColor: '#F9F7F3',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d4c5a9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  marginLine: {
    position: 'absolute',
    left: 50,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#E8B4B8',
    opacity: 0.6,
  },
  bindingHoles: {
    position: 'absolute',
    left: 10,
    top: 30,
    bottom: 30,
    width: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  hole: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0D5C7',
    borderWidth: 1,
    borderColor: '#c4b5a0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    paddingLeft: 65,
    paddingRight: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  pageHeader: {
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: '#3d3325',
    paddingBottom: 15,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c2416',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6b6256',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b6256',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9b9186',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  logEntry: {
    marginBottom: 20,
    position: 'relative',
  },
  linedPaperRule: {
    position: 'absolute',
    top: 0,
    left: -15,
    right: 0,
    height: 1,
    backgroundColor: '#D4E4F7',
    opacity: 0.5,
  },
  entryContent: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  entryApp: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A6FA5',
    flex: 1,
    marginRight: 10,
  },
  entryTime: {
    fontSize: 11,
    color: '#9b9186',
    fontStyle: 'italic',
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2416',
    marginBottom: 6,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  entryText: {
    fontSize: 14,
    color: '#4a4035',
    lineHeight: 20,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  entryTimestamp: {
    fontSize: 11,
    color: '#9b9186',
    fontStyle: 'italic',
    marginTop: 4,
  },
  pageFooter: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#D4E4F7',
    alignItems: 'center',
  },
  pageNumber: {
    fontSize: 12,
    color: '#9b9186',
    fontStyle: 'italic',
  },
  pageEdge: {
    position: 'absolute',
    right: -4,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#E0D5C7',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
