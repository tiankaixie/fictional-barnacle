/**
 * Input: WatermelonDB appSchema
 * Output: Database schema definition with tables and indexes
 * Pos: Core schema definition mirroring iOS Core Data model
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
        { name: 'apple_id', type: 'string', isOptional: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'display_name', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'journal_entries',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
        { name: 'deleted_flag', type: 'boolean', isIndexed: true },
        { name: 'sync_status', type: 'string' },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'cloudkit_record_id', type: 'string', isOptional: true },
        { name: 'cloudkit_change_tag', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'transcription_blocks',
      columns: [
        { name: 'entry_id', type: 'string', isIndexed: true },
        { name: 'content', type: 'string' },
        { name: 'manual_edits', type: 'string', isOptional: true }, // JSON string
        { name: 'audio_duration_ms', type: 'number' },
        { name: 'audio_file_path', type: 'string', isOptional: true },
        { name: 'audio_file_size', type: 'number' },
        { name: 'audio_format', type: 'string', isOptional: true },
        { name: 'position', type: 'number', isIndexed: true },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
        { name: 'deleted_flag', type: 'boolean', isIndexed: true },
        { name: 'cloudkit_record_id', type: 'string', isOptional: true },
        { name: 'cloudkit_change_tag', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'transcription_costs',
      columns: [
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'duration', type: 'number' },
        { name: 'cost', type: 'number' },
        { name: 'provider', type: 'string' },
        { name: 'entry_id', type: 'string', isOptional: true },
      ],
    }),
  ],
});
