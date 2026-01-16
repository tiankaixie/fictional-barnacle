/**
 * Input: WatermelonDB database instance, JournalEntry and TranscriptionBlock models
 * Output: Journal and TranscriptionBlock CRUD operations
 * Pos: Data access layer for journal entries and transcription blocks
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { Q } from '@nozbe/watermelondb';
import database from '../database';
import JournalEntry from '../models/JournalEntry';
import TranscriptionBlock from '../models/TranscriptionBlock';
import User from '../models/User';
import type { JournalEntryWithBlocks, SearchFilter } from '../../../types/database';

class JournalRepository {
  private db = database;

  // MARK: - Journal Entry Management

  /**
   * Get or create today's entry for a user
   */
  async getOrCreateTodayEntry(userId: string): Promise<JournalEntry> {
    const today = this.getStartOfDay(new Date());
    const todayTimestamp = today.getTime();

    // Try to find existing entry
    const existingEntries = await this.db
      .get<JournalEntry>('journal_entries')
      .query(
        Q.where('user_id', userId),
        Q.where('date', todayTimestamp),
        Q.where('deleted_flag', false)
      )
      .fetch();

    if (existingEntries.length > 0) {
      return existingEntries[0];
    }

    // Create new entry
    return await this.db.write(async () => {
      const entry = await this.db.get<JournalEntry>('journal_entries').create((newEntry) => {
        newEntry.userId = userId;
        newEntry.date = today;
        newEntry.deletedFlag = false;
        newEntry.entryStatus = 'pending';
      });
      console.log('[JournalRepository] Created today\'s entry for', today.toDateString());
      return entry;
    });
  }

  /**
   * Get entries with pagination (observable)
   */
  getEntriesPaginatedObservable(userId: string, offset: number = 0, limit: number = 20) {
    return this.db
      .get<JournalEntry>('journal_entries')
      .query(
        Q.where('user_id', userId),
        Q.where('deleted_flag', false),
        Q.sortBy('date', Q.desc),
        Q.skip(offset),
        Q.take(limit)
      )
      .observe();
  }

  /**
   * Get entries with pagination (fetch)
   */
  async getEntriesPaginated(
    userId: string,
    offset: number = 0,
    limit: number = 20
  ): Promise<JournalEntryWithBlocks[]> {
    const entries = await this.db
      .get<JournalEntry>('journal_entries')
      .query(
        Q.where('user_id', userId),
        Q.where('deleted_flag', false),
        Q.sortBy('date', Q.desc),
        Q.skip(offset),
        Q.take(limit)
      )
      .fetch();

    // Fetch blocks for each entry
    const entriesWithBlocks: JournalEntryWithBlocks[] = await Promise.all(
      entries.map(async (entry) => {
        const blocks = await this.getBlocks(entry);
        return {
          entry,
          blocks,
        };
      })
    );

    return entriesWithBlocks;
  }

  /**
   * Get single entry by date
   */
  async getEntry(userId: string, date: Date): Promise<JournalEntry | null> {
    const dayStart = this.getStartOfDay(date);
    const dayStartTimestamp = dayStart.getTime();

    const entries = await this.db
      .get<JournalEntry>('journal_entries')
      .query(
        Q.where('user_id', userId),
        Q.where('date', dayStartTimestamp),
        Q.where('deleted_flag', false)
      )
      .fetch();

    return entries.length > 0 ? entries[0] : null;
  }

  /**
   * Search entries by keyword in transcription content
   */
  async searchEntries(
    userId: string,
    query: string,
    filters: SearchFilter = {},
    offset: number = 0,
    limit: number = 20
  ): Promise<JournalEntryWithBlocks[]> {
    // First, find all blocks matching the query
    const blockConditions = [
      Q.where('deleted_flag', false),
      Q.where('content', Q.like(`%${Q.sanitizeLikeString(query)}%`)),
    ];

    const matchingBlocks = await this.db
      .get<TranscriptionBlock>('transcription_blocks')
      .query(...blockConditions)
      .fetch();

    // Get unique entry IDs from matching blocks
    const entryIds = Array.from(new Set(matchingBlocks.map((block) => block.entryId)));

    if (entryIds.length === 0) {
      return [];
    }

    // Build entry query conditions
    const entryConditions = [
      Q.where('user_id', userId),
      Q.where('deleted_flag', false),
      Q.where('id', Q.oneOf(entryIds)),
    ];

    // Add date range filters
    if (filters.startDate) {
      const startOfDay = this.getStartOfDay(filters.startDate);
      entryConditions.push(Q.where('date', Q.gte(startOfDay.getTime())));
    }

    if (filters.endDate) {
      const endOfDay = this.getEndOfDay(filters.endDate);
      entryConditions.push(Q.where('date', Q.lte(endOfDay.getTime())));
    }

    // Apply sort
    const ascending = filters.sortOption === 'dateAsc';
    const sortDirection = ascending ? Q.asc : Q.desc;

    const entries = await this.db
      .get<JournalEntry>('journal_entries')
      .query(
        ...entryConditions,
        Q.sortBy('date', sortDirection),
        Q.skip(offset),
        Q.take(limit)
      )
      .fetch();

    // Fetch blocks for each entry
    const entriesWithBlocks: JournalEntryWithBlocks[] = await Promise.all(
      entries.map(async (entry) => {
        const blocks = await this.getBlocks(entry);
        return {
          entry,
          blocks,
        };
      })
    );

    return entriesWithBlocks;
  }

  /**
   * Delete entry (soft delete)
   */
  async deleteEntry(entry: JournalEntry): Promise<void> {
    await this.db.write(async () => {
      // Soft delete the entry
      await entry.update((e: JournalEntry) => {
        e.deletedFlag = true;
        e.entryStatus = 'pending';
      });

      // Soft delete all blocks
      const blocks = await entry.blocks.fetch();
      await Promise.all(
        blocks.map((block) =>
          block.update((b: TranscriptionBlock) => {
            b.deletedFlag = true;
          })
        )
      );

      console.log('[JournalRepository] Deleted entry and all blocks');
    });
  }

  // MARK: - Transcription Block Management

  /**
   * Add transcription block to an entry
   */
  async addTranscriptionBlock(
    entry: JournalEntry,
    content: string,
    audioDuration: number = 0
  ): Promise<TranscriptionBlock> {
    return await this.db.write(async () => {
      // Get existing blocks to calculate next position
      const existingBlocks = await this.db
        .get<TranscriptionBlock>('transcription_blocks')
        .query(
          Q.where('entry_id', entry.id),
          Q.where('deleted_flag', false)
        )
        .fetch();

      const maxPosition = existingBlocks.reduce(
        (max, block) => Math.max(max, block.position),
        -1
      );
      const nextPosition = maxPosition + 1;

      // Create block
      const block = await this.db.get<TranscriptionBlock>('transcription_blocks').create((newBlock) => {
        newBlock.entryId = entry.id;
        newBlock.content = content;
        newBlock.audioDurationMs = audioDuration;
        newBlock.audioFileSize = 0;
        newBlock.position = nextPosition;
        newBlock.deletedFlag = false;
      });

      // Update entry
      await entry.update((e: JournalEntry) => {
        e.entryStatus = 'pending';
      });

      console.log('[JournalRepository] Added transcription block at position', nextPosition);
      return block;
    });
  }

  /**
   * Update transcription block content
   */
  async updateTranscriptionBlock(
    block: TranscriptionBlock,
    newContent: string
  ): Promise<void> {
    await this.db.write(async () => {
      const originalContent = block.content;

      // Create manual edit record
      const manualEdit = {
        original: originalContent,
        edited: newContent,
        editedAt: Date.now(),
      };

      await block.update((b) => {
        b.content = newContent;
        b._manualEdits = JSON.stringify(manualEdit);
      });

      // Update entry
      const entry = await block.entry.fetch();
      if (entry) {
        await entry.update((e: JournalEntry) => {
          e.entryStatus = 'pending';
        });
      }

      console.log('[JournalRepository] Updated transcription block');
    });
  }

  /**
   * Update audio metadata for transcription block
   */
  async updateBlockAudioMetadata(
    block: TranscriptionBlock,
    path: string,
    size: number,
    format: string
  ): Promise<void> {
    await this.db.write(async () => {
      await block.update((b) => {
        b.audioFilePath = path;
        b.audioFileSize = size;
        b.audioFormat = format;
      });

      // Update entry
      const entry = await block.entry.fetch();
      if (entry) {
        await entry.update((e: JournalEntry) => {
          e.entryStatus = 'pending';
        });
      }

      console.log('[JournalRepository] Updated audio metadata:', path, `(${size} bytes)`);
    });
  }

  /**
   * Delete transcription block (soft delete)
   */
  async deleteTranscriptionBlock(block: TranscriptionBlock): Promise<void> {
    await this.db.write(async () => {
      await block.update((b) => {
        b.deletedFlag = true;
      });

      // Update entry
      const entry = await block.entry.fetch();
      if (entry) {
        await entry.update((e: JournalEntry) => {
          e.entryStatus = 'pending';
        });
      }

      console.log('[JournalRepository] Deleted transcription block');
    });
  }

  /**
   * Get all blocks for an entry (sorted by position)
   */
  async getBlocks(entry: JournalEntry): Promise<TranscriptionBlock[]> {
    const blocks = await this.db
      .get<TranscriptionBlock>('transcription_blocks')
      .query(
        Q.where('entry_id', entry.id),
        Q.where('deleted_flag', false),
        Q.sortBy('position', Q.asc)
      )
      .fetch();

    return blocks;
  }

  /**
   * Observe blocks for an entry (reactive)
   */
  observeBlocks(entry: JournalEntry) {
    return this.db
      .get<TranscriptionBlock>('transcription_blocks')
      .query(
        Q.where('entry_id', entry.id),
        Q.where('deleted_flag', false),
        Q.sortBy('position', Q.asc)
      )
      .observe();
  }

  // MARK: - Statistics

  /**
   * Get total entry count for user
   */
  async getEntryCount(userId: string): Promise<number> {
    const count = await this.db
      .get<JournalEntry>('journal_entries')
      .query(
        Q.where('user_id', userId),
        Q.where('deleted_flag', false)
      )
      .fetchCount();

    return count;
  }

  /**
   * Get total transcription count for user
   */
  async getTranscriptionCount(userId: string): Promise<number> {
    // Get all entries for user
    const entries = await this.db
      .get<JournalEntry>('journal_entries')
      .query(
        Q.where('user_id', userId),
        Q.where('deleted_flag', false)
      )
      .fetch();

    const entryIds = entries.map((e) => e.id);

    if (entryIds.length === 0) {
      return 0;
    }

    const count = await this.db
      .get<TranscriptionBlock>('transcription_blocks')
      .query(
        Q.where('entry_id', Q.oneOf(entryIds)),
        Q.where('deleted_flag', false)
      )
      .fetchCount();

    return count;
  }

  // MARK: - Helper Methods

  private getStartOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getEndOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}

export default new JournalRepository();
