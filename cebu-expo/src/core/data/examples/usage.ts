/**
 * Input: None (example file)
 * Output: Usage examples for repositories
 * Pos: Documentation showing how to use the data layer
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { UserRepository, JournalRepository } from '../repositories';
import database from '../database';

/**
 * Example usage of the data layer
 *
 * This file demonstrates common patterns for working with the WatermelonDB data layer.
 * It mirrors the iOS Core Data patterns from the Swift implementation.
 */

// =============================================================================
// User Management
// =============================================================================

export async function exampleGetOrCreateUser() {
  // Get or create local user (single user app)
  const user = await UserRepository.getOrCreateLocalUser();
  console.log('User ID:', user.id);
  return user;
}

export async function exampleUpdateUser() {
  const user = await UserRepository.getCurrentUser();
  if (user) {
    await UserRepository.updateUser(user, {
      displayName: 'John Doe',
      email: 'john@example.com',
    });
  }
}

// =============================================================================
// Journal Entry Management
// =============================================================================

export async function exampleGetOrCreateTodayEntry() {
  const user = await UserRepository.getOrCreateLocalUser();

  // Get or create today's entry
  const todayEntry = await JournalRepository.getOrCreateTodayEntry(user.id);
  console.log('Today entry:', todayEntry.date);
  return todayEntry;
}

export async function exampleGetEntriesPaginated() {
  const user = await UserRepository.getOrCreateLocalUser();

  // Get first page of entries (20 per page)
  const page1 = await JournalRepository.getEntriesPaginated(user.id, 0, 20);
  console.log('Page 1:', page1.length, 'entries');

  // Get second page
  const page2 = await JournalRepository.getEntriesPaginated(user.id, 20, 20);
  console.log('Page 2:', page2.length, 'entries');

  return page1;
}

export async function exampleSearchEntries() {
  const user = await UserRepository.getOrCreateLocalUser();

  // Search for entries containing "meeting"
  const results = await JournalRepository.searchEntries(
    user.id,
    'meeting',
    {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      sortOption: 'dateDesc',
    },
    0,
    20
  );

  console.log('Found', results.length, 'entries with "meeting"');
  return results;
}

export async function exampleDeleteEntry() {
  const user = await UserRepository.getOrCreateLocalUser();
  const entries = await JournalRepository.getEntriesPaginated(user.id, 0, 1);

  if (entries.length > 0) {
    // Soft delete (sets deletedFlag = true)
    await JournalRepository.deleteEntry(entries[0].entry);
    console.log('Entry soft deleted');
  }
}

// =============================================================================
// Transcription Block Management
// =============================================================================

export async function exampleAddTranscriptionBlock() {
  const user = await UserRepository.getOrCreateLocalUser();
  const entry = await JournalRepository.getOrCreateTodayEntry(user.id);

  // Add a new transcription block
  const block = await JournalRepository.addTranscriptionBlock(
    entry,
    'This is my voice note transcription',
    5000 // 5 seconds in milliseconds
  );

  console.log('Block created at position:', block.position);
  return block;
}

export async function exampleUpdateTranscriptionBlock() {
  const user = await UserRepository.getOrCreateLocalUser();
  const entry = await JournalRepository.getOrCreateTodayEntry(user.id);
  const blocks = await JournalRepository.getBlocks(entry);

  if (blocks.length > 0) {
    const block = blocks[0];

    // Update block content (stores edit history in manualEdits JSON)
    await JournalRepository.updateTranscriptionBlock(
      block,
      'This is my edited voice note transcription'
    );

    console.log('Block updated, manual edit recorded');
  }
}

export async function exampleUpdateAudioMetadata() {
  const user = await UserRepository.getOrCreateLocalUser();
  const entry = await JournalRepository.getOrCreateTodayEntry(user.id);
  const blocks = await JournalRepository.getBlocks(entry);

  if (blocks.length > 0) {
    const block = blocks[0];

    // Update audio file metadata
    await JournalRepository.updateBlockAudioMetadata(
      block,
      'file:///audio/recording_123.m4a',
      1024000, // 1MB
      'm4a'
    );

    console.log('Audio metadata updated');
  }
}

export async function exampleDeleteTranscriptionBlock() {
  const user = await UserRepository.getOrCreateLocalUser();
  const entry = await JournalRepository.getOrCreateTodayEntry(user.id);
  const blocks = await JournalRepository.getBlocks(entry);

  if (blocks.length > 0) {
    // Soft delete (sets deletedFlag = true)
    await JournalRepository.deleteTranscriptionBlock(blocks[0]);
    console.log('Block soft deleted');
  }
}

// =============================================================================
// Observable Queries (for React Components)
// =============================================================================

export function exampleObservableEntries(userId: string) {
  // Returns an observable that updates when data changes
  const observable = JournalRepository.getEntriesPaginatedObservable(userId, 0, 20);

  // Use with withObservables HOC or hooks
  return observable;
}

export function exampleObservableBlocks(entryId: string) {
  // Observe blocks for an entry (reactive)
  return database.get('journal_entries').findAndObserve(entryId).pipe(
    // You can use RxJS operators here
  );
}

// =============================================================================
// Statistics
// =============================================================================

export async function exampleGetStatistics() {
  const user = await UserRepository.getOrCreateLocalUser();

  const entryCount = await JournalRepository.getEntryCount(user.id);
  const transcriptionCount = await JournalRepository.getTranscriptionCount(user.id);

  console.log('Total entries:', entryCount);
  console.log('Total transcriptions:', transcriptionCount);

  return { entryCount, transcriptionCount };
}

// =============================================================================
// React Component Example
// =============================================================================

/*
import { useEffect, useState } from 'react';
import { JournalRepository } from '../repositories';
import type { JournalEntryWithBlocks } from '../../../types/database';

export function useJournalEntries(userId: string) {
  const [entries, setEntries] = useState<JournalEntryWithBlocks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true);
      const data = await JournalRepository.getEntriesPaginated(userId, 0, 20);
      setEntries(data);
      setLoading(false);
    };

    loadEntries();
  }, [userId]);

  return { entries, loading };
}

// Or with observables for reactive updates:
import withObservables from '@nozbe/with-observables';

function JournalListComponent({ entries }: { entries: JournalEntry[] }) {
  return (
    <View>
      {entries.map(entry => (
        <Text key={entry.id}>{entry.date.toDateString()}</Text>
      ))}
    </View>
  );
}

export const JournalList = withObservables(['userId'], ({ userId }) => ({
  entries: JournalRepository.getEntriesPaginatedObservable(userId, 0, 20),
}))(JournalListComponent);
*/
