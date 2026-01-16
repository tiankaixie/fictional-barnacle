/**
 * Input: WatermelonDB Model class, JournalEntry relation
 * Output: TranscriptionBlock model with decorators and JSON manual edits
 * Pos: Individual voice note transcription within a journal entry
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { Model, Relation } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type JournalEntry from './JournalEntry';

export interface ManualEdit {
  original: string;
  edited: string;
  editedAt: number; // timestamp
}

export default class TranscriptionBlock extends Model {
  static table = 'transcription_blocks';

  static associations: Associations = {
    journal_entries: { type: 'belongs_to', key: 'entry_id' },
  };

  @field('entry_id') entryId!: string;
  @field('content') content!: string;
  @field('manual_edits') _manualEdits?: string; // JSON string
  @field('audio_duration_ms') audioDurationMs!: number;
  @field('audio_file_path') audioFilePath?: string;
  @field('audio_file_size') audioFileSize!: number;
  @field('audio_format') audioFormat?: string;
  @field('position') position!: number;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('deleted_flag') deletedFlag!: boolean;
  @field('cloudkit_record_id') cloudkitRecordId?: string;
  @field('cloudkit_change_tag') cloudkitChangeTag?: string;

  @relation('journal_entries', 'entry_id') entry!: Relation<JournalEntry>;

  // Helper methods for manual edits JSON
  get manualEdits(): ManualEdit | null {
    if (!this._manualEdits) return null;
    try {
      return JSON.parse(this._manualEdits);
    } catch {
      return null;
    }
  }

  setManualEdits(edit: ManualEdit | null): void {
    // This will be used in repository during update
    (this as any)._manualEdits = edit ? JSON.stringify(edit) : null;
  }
}
