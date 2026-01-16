/**
 * Input: All data layer modules
 * Output: Centralized data layer exports
 * Pos: Main entry point for data layer access
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

// Database instance
export { default as database } from './database';

// Models
export {
  User,
  JournalEntry,
  TranscriptionBlock,
  TranscriptionCost,
  schema,
} from './models';
export type { ManualEdit } from './models';

// Repositories
export { UserRepository, JournalRepository } from './repositories';

// Types
export type {
  IUser,
  IJournalEntry,
  ITranscriptionBlock,
  ITranscriptionCost,
  JournalEntryWithBlocks,
  SearchFilter,
} from '../../types/database';
