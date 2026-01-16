/**
 * Input: WatermelonDB Model class, User relation
 * Output: JournalEntry model with decorators and relationships
 * Pos: Daily journal entry entity with one-to-many relationship to TranscriptionBlocks
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { Model, Query } from '@nozbe/watermelondb';
import { field, readonly, date, relation, children } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type User from './User';
import type TranscriptionBlock from './TranscriptionBlock';

export default class JournalEntry extends Model {
  static table = 'journal_entries';

  static associations: Associations = {
    users: { type: 'belongs_to', key: 'user_id' },
    transcription_blocks: { type: 'has_many', foreignKey: 'entry_id' },
  };

  @field('user_id') userId!: string;
  @date('date') date!: Date;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('deleted_flag') deletedFlag!: boolean;
  @field('sync_status') entryStatus!: string; // Renamed to avoid conflict with Model.syncStatus
  @date('last_synced_at') lastSyncedAt?: Date;
  @field('cloudkit_record_id') cloudkitRecordId?: string;
  @field('cloudkit_change_tag') cloudkitChangeTag?: string;

  @relation('users', 'user_id') user!: User;
  @children('transcription_blocks') blocks!: Query<TranscriptionBlock>;
}
