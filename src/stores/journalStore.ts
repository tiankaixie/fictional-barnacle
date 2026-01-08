/**
 * Input: Database operations, transcription events
 * Output: Zustand store for journal state management
 * Pos: Global state for current recording, entries, and UI state
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import {
  DB_NAME,
  getOrCreateTodayEntry,
  addTranscriptionBlock,
} from '../services/database/schema';

const asyncStorageWrapper = {
  getItem: async (name: string) => {
    const value = await AsyncStorage.getItem(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await AsyncStorage.removeItem(name);
  },
};

interface JournalState {
  isRecording: boolean;
  liveTranscript: string;
  currentEntryId: string | null;
  refreshTrigger: number;

  // Actions
  setIsRecording: (recording: boolean) => void;
  setLiveTranscript: (transcript: string) => void;
  addTranscription: (content: string) => Promise<void>;
  triggerRefresh: () => void;
}

// Default user ID for local-only mode
const LOCAL_USER_ID = 'local-user';

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      isRecording: false,
      liveTranscript: '',
      currentEntryId: null,
      refreshTrigger: 0,

      setIsRecording: (recording) => set({ isRecording: recording }),

      setLiveTranscript: (transcript) => set({ liveTranscript: transcript }),

      addTranscription: async (content: string) => {
        try {
          const db = await SQLite.openDatabaseAsync(DB_NAME);
          const entryId = await getOrCreateTodayEntry(db, LOCAL_USER_ID);
          await addTranscriptionBlock(db, entryId, content);
          set({ currentEntryId: entryId, refreshTrigger: get().refreshTrigger + 1 });
        } catch (error) {
          console.error('Failed to add transcription:', error);
          throw error;
        }
      },

      triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
    }),
    {
      name: 'journal-store',
      storage: createJSONStorage(() => asyncStorageWrapper),
      partialize: (state) => ({
        currentEntryId: state.currentEntryId,
      }),
    }
  )
);
