/**
 * Input: WatermelonDB Database class, schema, models
 * Output: Configured database instance
 * Pos: Database initialization with SQLite adapter
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '../models/schema';
import User from '../models/User';
import JournalEntry from '../models/JournalEntry';
import TranscriptionBlock from '../models/TranscriptionBlock';
import TranscriptionCost from '../models/TranscriptionCost';

// Create SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  // Optional: migrations for future schema updates
  // migrations,
  jsi: true, // Use JSI for better performance on React Native
  onSetUpError: (error) => {
    console.error('[Database] Setup error:', error);
  },
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [User, JournalEntry, TranscriptionBlock, TranscriptionCost],
});

export default database;
