/**
 * Input: WatermelonDB Model class
 * Output: User model with decorators
 * Pos: User entity representing a local or Apple Sign In user
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { Model, Query } from '@nozbe/watermelondb';
import { field, readonly, date, children } from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type JournalEntry from './JournalEntry';

export default class User extends Model {
  static table = 'users';

  static associations: Associations = {
    journal_entries: { type: 'has_many', foreignKey: 'user_id' },
  };

  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @field('apple_id') appleId?: string;
  @field('email') email?: string;
  @field('display_name') displayName?: string;

  @children('journal_entries') entries!: Query<JournalEntry>;
}
