/**
 * Input: Model classes
 * Output: TypeScript interfaces for database models
 * Pos: Type definitions for database entities
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import type User from '../core/data/models/User';
import type JournalEntry from '../core/data/models/JournalEntry';
import type TranscriptionBlock from '../core/data/models/TranscriptionBlock';
import type TranscriptionCost from '../core/data/models/TranscriptionCost';

export interface IUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  appleId?: string;
  email?: string;
  displayName?: string;
}

export interface IJournalEntry {
  id: string;
  userId: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedFlag: boolean;
  entryStatus: string; // Renamed from syncStatus to avoid conflict with WatermelonDB Model.syncStatus
  lastSyncedAt?: Date;
  cloudkitRecordId?: string;
  cloudkitChangeTag?: string;
}

export interface ITranscriptionBlock {
  id: string;
  entryId: string;
  content: string;
  manualEdits?: string; // JSON string
  audioDurationMs: number;
  audioFilePath?: string;
  audioFileSize: number;
  audioFormat?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  deletedFlag: boolean;
  cloudkitRecordId?: string;
  cloudkitChangeTag?: string;
}

export interface ITranscriptionCost {
  id: string;
  date: Date;
  duration: number;
  cost: number;
  provider: string;
  entryId?: string;
}

export interface ManualEdit {
  original: string;
  edited: string;
  editedAt: number; // timestamp
}

export interface JournalEntryWithBlocks {
  entry: JournalEntry;
  blocks: TranscriptionBlock[];
}

export interface SearchFilter {
  startDate?: Date;
  endDate?: Date;
  sortOption?: 'relevance' | 'dateDesc' | 'dateAsc';
}

// Model types (for repository methods)
export type { User, JournalEntry, TranscriptionBlock, TranscriptionCost };
