/**
 * Input: expo-sqlite, database schema
 * Output: Database context and hook for data operations
 * Pos: Database provider and CRUD operations hook
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import * as SQLite from 'expo-sqlite';
import {
  DB_NAME,
  initializeDatabase,
  getOrCreateTodayEntry,
  addTranscriptionBlock,
  updateTranscriptionBlock,
  getEntriesPaginated,
} from '../services/database/schema';

// Default user ID for local-only mode
const LOCAL_USER_ID = 'local-user';

interface DatabaseContextValue {
  isReady: boolean;
  db: SQLite.SQLiteDatabase | null;
  getTodayEntryId: () => Promise<string>;
  addBlock: (content: string) => Promise<string>;
  updateBlock: (blockId: string, content: string, originalContent: string) => Promise<void>;
  getEntries: (offset?: number, limit?: number) => Promise<Array<{
    entryId: string;
    date: string;
    blocks: Array<{
      id: string;
      content: string;
      createdAt: number;
      position: number;
    }>;
  }>>;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        const database = await SQLite.openDatabaseAsync(DB_NAME);
        await initializeDatabase(database);
        setDb(database);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    }
    setup();
  }, []);

  const getTodayEntryId = useCallback(async () => {
    if (!db) throw new Error('Database not ready');
    return getOrCreateTodayEntry(db, LOCAL_USER_ID);
  }, [db]);

  const addBlock = useCallback(async (content: string) => {
    if (!db) throw new Error('Database not ready');
    const entryId = await getOrCreateTodayEntry(db, LOCAL_USER_ID);
    return addTranscriptionBlock(db, entryId, content);
  }, [db]);

  const updateBlock = useCallback(async (
    blockId: string,
    content: string,
    originalContent: string
  ) => {
    if (!db) throw new Error('Database not ready');
    return updateTranscriptionBlock(db, blockId, content, originalContent);
  }, [db]);

  const getEntries = useCallback(async (offset = 0, limit = 20) => {
    if (!db) throw new Error('Database not ready');
    return getEntriesPaginated(db, LOCAL_USER_ID, offset, limit);
  }, [db]);

  const value = useMemo(
    () => ({
      isReady,
      db,
      getTodayEntryId,
      addBlock,
      updateBlock,
      getEntries,
    }),
    [isReady, db, getTodayEntryId, addBlock, updateBlock, getEntries]
  );

  return (
    <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextValue {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
