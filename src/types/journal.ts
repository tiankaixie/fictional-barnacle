/**
 * Input: None
 * Output: TypeScript types for journal entries and transcription blocks
 * Pos: Type definitions for journal data structures
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  createdAt: number;
  updatedAt: number;
  lastSyncedAt?: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
  isDeleted: boolean;
  blocks: TranscriptionBlock[];
}

export interface TranscriptionBlock {
  id: string;
  entryId: string;
  content: string;
  manualEdits?: {
    original: string;
    edited: string;
    editedAt: number;
  };
  audioDurationMs?: number;
  createdAt: number;
  updatedAt: number;
  position: number;
  isDeleted: boolean;
}

export interface DayGroup {
  date: string;
  formattedDate: string;
  entries: TranscriptionBlock[];
}
