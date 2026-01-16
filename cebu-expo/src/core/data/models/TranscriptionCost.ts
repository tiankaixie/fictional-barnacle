/**
 * Input: WatermelonDB Model class
 * Output: TranscriptionCost model for tracking API costs
 * Pos: Cost tracking entity for transcription API usage
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class TranscriptionCost extends Model {
  static table = 'transcription_costs';

  @date('date') date!: Date;
  @field('duration') duration!: number;
  @field('cost') cost!: number;
  @field('provider') provider!: string;
  @field('entry_id') entryId?: string;
}
