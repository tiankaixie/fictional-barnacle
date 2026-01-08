/**
 * Input: expo-sqlite database instance
 * Output: Database initialization and migration functions
 * Pos: SQLite schema definitions and database setup
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'cebu.db';

export async function initializeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      apple_id TEXT UNIQUE,
      google_id TEXT UNIQUE,
      email TEXT,
      display_name TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Daily journal entries
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      last_synced_at INTEGER,
      sync_status TEXT DEFAULT 'pending',
      is_deleted INTEGER DEFAULT 0,
      UNIQUE(user_id, date)
    );

    -- Transcription blocks within a day
    CREATE TABLE IF NOT EXISTS transcription_blocks (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      content TEXT NOT NULL,
      manual_edits TEXT,
      audio_duration_ms INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      position INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE
    );

    -- Sync metadata for iCloud
    CREATE TABLE IF NOT EXISTS sync_metadata (
      id TEXT PRIMARY KEY,
      record_type TEXT NOT NULL,
      record_id TEXT NOT NULL,
      cloudkit_record_id TEXT,
      cloudkit_change_tag TEXT,
      last_sync_attempt INTEGER,
      sync_error TEXT,
      UNIQUE(record_type, record_id)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_entries_date ON journal_entries(date DESC);
    CREATE INDEX IF NOT EXISTS idx_entries_user ON journal_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_entries_sync ON journal_entries(sync_status) WHERE sync_status = 'pending';
    CREATE INDEX IF NOT EXISTS idx_blocks_entry ON transcription_blocks(entry_id);
    CREATE INDEX IF NOT EXISTS idx_blocks_position ON transcription_blocks(entry_id, position);
  `);
}

export async function getOrCreateTodayEntry(
  db: SQLite.SQLiteDatabase,
  userId: string
): Promise<string> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Try to get existing entry
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM journal_entries WHERE user_id = ? AND date = ? AND is_deleted = 0',
    [userId, today]
  );

  if (existing) {
    return existing.id;
  }

  // Create new entry
  const id = crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO journal_entries (id, user_id, date) VALUES (?, ?, ?)',
    [id, userId, today]
  );

  return id;
}

export async function addTranscriptionBlock(
  db: SQLite.SQLiteDatabase,
  entryId: string,
  content: string
): Promise<string> {
  const id = crypto.randomUUID();

  // Get next position
  const result = await db.getFirstAsync<{ maxPos: number | null }>(
    'SELECT MAX(position) as maxPos FROM transcription_blocks WHERE entry_id = ? AND is_deleted = 0',
    [entryId]
  );
  const position = (result?.maxPos ?? -1) + 1;

  await db.runAsync(
    'INSERT INTO transcription_blocks (id, entry_id, content, position) VALUES (?, ?, ?, ?)',
    [id, entryId, content, position]
  );

  // Update entry timestamp
  await db.runAsync(
    'UPDATE journal_entries SET updated_at = ?, sync_status = ? WHERE id = ?',
    [Date.now(), 'pending', entryId]
  );

  return id;
}

export async function updateTranscriptionBlock(
  db: SQLite.SQLiteDatabase,
  blockId: string,
  content: string,
  originalContent: string
): Promise<void> {
  const now = Date.now();
  const manualEdits = JSON.stringify({
    original: originalContent,
    edited: content,
    editedAt: now,
  });

  await db.runAsync(
    'UPDATE transcription_blocks SET content = ?, manual_edits = ?, updated_at = ? WHERE id = ?',
    [content, manualEdits, now, blockId]
  );
}

export async function getEntriesPaginated(
  db: SQLite.SQLiteDatabase,
  userId: string,
  offset: number = 0,
  limit: number = 20
): Promise<Array<{
  entryId: string;
  date: string;
  blocks: Array<{
    id: string;
    content: string;
    createdAt: number;
    position: number;
  }>;
}>> {
  const entries = await db.getAllAsync<{
    id: string;
    date: string;
  }>(
    `SELECT id, date FROM journal_entries
     WHERE user_id = ? AND is_deleted = 0
     ORDER BY date DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  const result = [];
  for (const entry of entries) {
    const blocks = await db.getAllAsync<{
      id: string;
      content: string;
      created_at: number;
      position: number;
    }>(
      `SELECT id, content, created_at, position FROM transcription_blocks
       WHERE entry_id = ? AND is_deleted = 0
       ORDER BY position ASC`,
      [entry.id]
    );

    result.push({
      entryId: entry.id,
      date: entry.date,
      blocks: blocks.map((b) => ({
        id: b.id,
        content: b.content,
        createdAt: b.created_at,
        position: b.position,
      })),
    });
  }

  return result;
}
