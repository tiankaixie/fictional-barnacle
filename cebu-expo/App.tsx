/**
 * Cebu Expo - Voice Journal App Demo
 * Testing recording flow with mock ASR and journal list
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Pressable, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from './src/ui/theme';
import { GlassBackground, GlassCard } from './src/ui/components';
import { RecordingOverlay } from './src/features/recording/components';
import { JournalListScreen } from './src/features/journal/components';
import { SettingsScreen } from './src/features/settings/components';
import { useRecording } from './src/features/recording/hooks/useRecording';
import { database } from './src/core/data/database';
import { JournalRepository } from './src/core/data/repositories';
import { audioStorageService } from './src/core/services';
import { BlurView } from 'expo-blur';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

type TabType = 'record' | 'journal';

/**
 * Main app screen with tab navigation
 */
function MainScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('journal');
  const [showRecordingOverlay, setShowRecordingOverlay] = useState(false);
  const { isInitialized } = useRecording();
  const { colors, effectiveTheme } = useTheme();

  // Initialize audio storage on mount
  useEffect(() => {
    audioStorageService.initialize().catch(console.error);
  }, []);

  return (
    <GlassBackground>
      <StatusBar style="auto" />

      {/* Main content - tab based */}
      <View style={styles.content}>
        <View style={styles.contentInner}>
          {activeTab === 'journal' && <JournalListScreen />}
          {activeTab === 'record' && <SettingsScreen />}
        </View>
      </View>

      {/* Bottom tab bar with glass effect */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBarWrapper}>
          {/* Glass blur background */}
          <BlurView
            intensity={20}
            tint={effectiveTheme}
            style={StyleSheet.absoluteFill}
          />

          {/* Tab bar content */}
          <View style={styles.tabBar}>
            <Pressable
              style={styles.tab}
              onPress={() => setActiveTab('journal')}
            >
              <Ionicons
                name={activeTab === 'journal' ? 'book' : 'book-outline'}
                size={24}
                color={activeTab === 'journal' ? colors.primary : colors.textTertiary}
              />
              <Text style={[styles.tabText, { color: activeTab === 'journal' ? colors.primary : colors.textTertiary }]}>
                日记
              </Text>
            </Pressable>

            {/* Center floating action button */}
            <Pressable
              style={[styles.fabButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowRecordingOverlay(true)}
              disabled={!isInitialized}
            >
              <Ionicons name="mic" size={28} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={styles.tab}
              onPress={() => setActiveTab('record')}
            >
              <Ionicons
                name={activeTab === 'record' ? 'settings' : 'settings-outline'}
                size={24}
                color={activeTab === 'record' ? colors.primary : colors.textTertiary}
              />
              <Text style={[styles.tabText, { color: activeTab === 'record' ? colors.primary : colors.textTertiary }]}>
                设置
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Recording Overlay */}
      <RecordingOverlay
        visible={showRecordingOverlay}
        onClose={() => setShowRecordingOverlay(false)}
      />
    </GlassBackground>
  );
}

/**
 * Root App component with providers
 */
export default function App() {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);

  // Initialize database
  useEffect(() => {
    database
      .write(async () => {
        console.log('[App] Database initialized');
      })
      .then(() => setIsDatabaseReady(true))
      .catch((error) => {
        console.error('[App] Database initialization failed:', error);
      });
  }, []);

  if (!isDatabaseReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>初始化数据库...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MainScreen />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80, // Space for tab bar + safe area
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000, // Ensure tab bar is above content
  },
  tabBarWrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8, // Account for iPhone home indicator
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4, // Thinner (was 8)
  },
  tabText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -20,           // Float above tab bar
    left: '50%',
    marginLeft: -28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,   // Softer shadow (was 8)
    elevation: 12,
  },
});
