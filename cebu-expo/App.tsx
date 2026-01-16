/**
 * Cebu Expo - Voice Journal App Demo
 * Testing recording flow with mock ASR and journal list
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecordingOverlay } from './src/features/recording/components';
import { SimpleJournalList } from './src/features/journal/components/SimpleJournalList';
import { useRecording } from './src/features/recording/hooks/useRecording';
import { database } from './src/core/data/database';
import { JournalRepository } from './src/core/data/repositories';
import { audioStorageService } from './src/core/services';

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

  // Initialize audio storage on mount
  useEffect(() => {
    audioStorageService.initialize().catch(console.error);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* Main content - tab based */}
      <View style={styles.content}>
        {activeTab === 'journal' && (
          <View style={styles.recordTab}>
            <Text style={styles.recordTabText}>日记列表</Text>
            <Text style={styles.recordTabSubtext}>正在开发中...</Text>
            <SimpleJournalList />
          </View>
        )}
        {activeTab === 'record' && (
          <View style={styles.recordTab}>
            <Text style={styles.recordTabText}>录音功能已集成</Text>
            <Text style={styles.recordTabSubtext}>点击下方麦克风按钮开始录音</Text>
          </View>
        )}
      </View>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'journal' && styles.tabActive]}
          onPress={() => setActiveTab('journal')}
        >
          <Ionicons
            name={activeTab === 'journal' ? 'book' : 'book-outline'}
            size={24}
            color={activeTab === 'journal' ? '#007AFF' : '#8E8E93'}
          />
          <Text style={[styles.tabText, activeTab === 'journal' && styles.tabTextActive]}>
            日记
          </Text>
        </Pressable>

        {/* Center floating action button */}
        <Pressable
          style={styles.fabButton}
          onPress={() => setShowRecordingOverlay(true)}
          disabled={!isInitialized}
        >
          <Ionicons name="mic" size={28} color="#FFFFFF" />
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'record' && styles.tabActive]}
          onPress={() => setActiveTab('record')}
        >
          <Ionicons
            name={activeTab === 'record' ? 'settings' : 'settings-outline'}
            size={24}
            color={activeTab === 'record' ? '#007AFF' : '#8E8E93'}
          />
          <Text style={[styles.tabText, activeTab === 'record' && styles.tabTextActive]}>
            设置
          </Text>
        </Pressable>
      </View>

      {/* Recording Overlay */}
      <RecordingOverlay
        visible={showRecordingOverlay}
        onClose={() => setShowRecordingOverlay(false)}
      />
    </SafeAreaView>
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
    <QueryClientProvider client={queryClient}>
      <MainScreen />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  recordTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  recordTabText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  recordTabSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabActive: {
    // Active tab styling handled by icon and text color
  },
  tabText: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF453A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
});
