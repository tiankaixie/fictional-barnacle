# WatermelonDB Migration Guide

This document explains the differences between the iOS Core Data implementation and the Expo WatermelonDB implementation.

## Key Differences

### 1. Field Naming

#### iOS Core Data → WatermelonDB Mapping

- `syncStatus` → `entryStatus` (renamed to avoid conflict with WatermelonDB's built-in `syncStatus` property)
- All snake_case in database, camelCase in model classes
- Field decorators map between database columns and model properties

### 2. Decorator Usage

WatermelonDB uses decorators for schema definition:

```typescript
// iOS Core Data
@NSManaged public var date: Date?

// WatermelonDB
@date('date') date!: Date;
```

### 3. Relationships

#### iOS Core Data
```swift
@NSManaged public var blocks: NSSet?
```

#### WatermelonDB
```typescript
@children('transcription_blocks') blocks!: Query<TranscriptionBlock>;
```

Relationships are lazy-loaded and observable.

### 4. Queries

#### iOS Core Data (Swift)
```swift
let request = JournalEntry.fetchRequest()
request.predicate = NSPredicate(format: "user == %@ AND deletedFlag == NO", user)
let entries = try context.fetch(request)
```

#### WatermelonDB (TypeScript)
```typescript
const entries = await database
  .get<JournalEntry>('journal_entries')
  .query(
    Q.where('user_id', userId),
    Q.where('deleted_flag', false)
  )
  .fetch();
```

### 5. Observables

WatermelonDB provides reactive queries out of the box:

```typescript
// Automatically updates when data changes
const observable = database
  .get<JournalEntry>('journal_entries')
  .query(Q.where('user_id', userId))
  .observe();
```

Use with `withObservables` HOC or create custom hooks.

### 6. Transactions

#### iOS Core Data
```swift
try await context.perform {
  entry.deletedFlag = true
  try context.save()
}
```

#### WatermelonDB
```typescript
await database.write(async () => {
  await entry.update(e => {
    e.deletedFlag = true;
  });
});
```

### 7. Manual Edits JSON

Both implementations store manual edits as JSON:

#### iOS (Binary Data)
```swift
if let data = try? JSONEncoder().encode(manualEdit) {
  block.manualEdits = data
}
```

#### WatermelonDB (JSON String)
```typescript
await block.update(b => {
  b._manualEdits = JSON.stringify(manualEdit);
});
```

## Schema Comparison

### User Table

| iOS Core Data | WatermelonDB | Type |
|---------------|--------------|------|
| id | id (auto) | UUID/String |
| createdAt | created_at | Date/Number |
| updatedAt | updated_at | Date/Number |
| appleID | apple_id | String? |
| email | email | String? |
| displayName | display_name | String? |

### JournalEntry Table

| iOS Core Data | WatermelonDB | Type |
|---------------|--------------|------|
| id | id (auto) | UUID/String |
| userId | user_id | String |
| date | date | Date/Number |
| createdAt | created_at | Date/Number |
| updatedAt | updated_at | Date/Number |
| deletedFlag | deleted_flag | Boolean |
| syncStatus | sync_status (mapped to entryStatus) | String |
| lastSyncedAt | last_synced_at | Date?/Number? |

### TranscriptionBlock Table

| iOS Core Data | WatermelonDB | Type |
|---------------|--------------|------|
| id | id (auto) | UUID/String |
| entryId | entry_id | String |
| content | content | String |
| manualEdits | manual_edits | Binary/String (JSON) |
| audioDurationMs | audio_duration_ms | Int32/Number |
| audioFilePath | audio_file_path | String? |
| audioFileSize | audio_file_size | Int64/Number |
| audioFormat | audio_format | String? |
| position | position | Int32/Number |
| createdAt | created_at | Date/Number |
| updatedAt | updated_at | Date/Number |
| deletedFlag | deleted_flag | Boolean |

## Common Patterns

### 1. Get or Create Today's Entry

#### iOS
```swift
func getOrCreateTodayEntry(for user: User) async throws -> JournalEntry {
  let today = Calendar.current.startOfDay(for: Date())
  // ... NSFetchRequest logic
}
```

#### WatermelonDB
```typescript
async getOrCreateTodayEntry(userId: string): Promise<JournalEntry> {
  const today = this.getStartOfDay(new Date());
  // ... query logic
}
```

### 2. Position-Based Ordering

Both implementations use a `position` field for ordering transcription blocks:

```typescript
// Get next position
const maxPosition = existingBlocks.reduce(
  (max, block) => Math.max(max, block.position),
  -1
);
const nextPosition = maxPosition + 1;
```

### 3. Soft Delete Pattern

Both use `deletedFlag` for soft deletes:

```typescript
await entry.update(e => {
  e.deletedFlag = true;
});
```

All queries filter out soft-deleted records:

```typescript
Q.where('deleted_flag', false)
```

## Best Practices

### 1. Always Use Transactions

```typescript
await database.write(async () => {
  // All database writes here
});
```

### 2. Filter Soft Deletes

```typescript
Q.where('deleted_flag', false)
```

### 3. Use Observables for UI

```typescript
const observable = JournalRepository.getEntriesPaginatedObservable(userId, 0, 20);
// Subscribe in React component
```

### 4. Type Safety

Use TypeScript interfaces from `src/types/database.ts` for type safety.

### 5. Batch Operations

WatermelonDB automatically batches writes for performance.

## Migration Checklist

- [x] Schema defined with correct column types and indexes
- [x] User model with relationships
- [x] JournalEntry model with relationships
- [x] TranscriptionBlock model with JSON manual edits
- [x] UserRepository with get/create operations
- [x] JournalRepository with full CRUD
- [x] Observable queries for reactive UI
- [x] Soft delete pattern throughout
- [x] Position-based ordering for blocks
- [x] TypeScript types and interfaces
- [x] README documentation
- [x] Usage examples

## Future Enhancements

1. **Migrations**: Add schema migrations for future updates
2. **Sync**: Implement CloudKit sync (currently disabled)
3. **Search**: Add full-text search indexing
4. **Performance**: Add query optimization and caching
5. **Testing**: Add unit tests for repositories
