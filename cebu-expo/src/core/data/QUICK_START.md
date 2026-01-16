# Quick Start Guide

## Installation

Dependencies already included in package.json:
```bash
npm install
# or
yarn install
```

## Basic Usage

### 1. Import the data layer

```typescript
import { UserRepository, JournalRepository, database } from './core/data';
```

### 2. Initialize user

```typescript
// Get or create local user (app handles single user)
const user = await UserRepository.getOrCreateLocalUser();
console.log('User ID:', user.id);
```

### 3. Work with journal entries

```typescript
// Get or create today's entry
const todayEntry = await JournalRepository.getOrCreateTodayEntry(user.id);

// Add a voice note transcription
const block = await JournalRepository.addTranscriptionBlock(
  todayEntry,
  'Just finished the meeting with the team. We discussed the new features.',
  12000 // duration in milliseconds (12 seconds)
);

// Update audio metadata after recording is saved
await JournalRepository.updateBlockAudioMetadata(
  block,
  'file:///audio/recording_123.m4a',
  1024000, // size in bytes
  'm4a'
);
```

### 4. List entries with pagination

```typescript
// Get first 20 entries (sorted by date, newest first)
const entries = await JournalRepository.getEntriesPaginated(user.id, 0, 20);

entries.forEach(({ entry, blocks }) => {
  console.log(`Entry: ${entry.date.toDateString()}`);
  blocks.forEach(block => {
    console.log(`  - ${block.content} (${block.audioDurationMs}ms)`);
  });
});

// Load next page
const nextPage = await JournalRepository.getEntriesPaginated(user.id, 20, 20);
```

### 5. Search entries

```typescript
const results = await JournalRepository.searchEntries(
  user.id,
  'meeting', // search query
  {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    sortOption: 'dateDesc' // or 'dateAsc' or 'relevance'
  },
  0, // offset
  20 // limit
);

console.log(`Found ${results.length} entries containing "meeting"`);
```

### 6. Edit transcription

```typescript
const entry = await JournalRepository.getOrCreateTodayEntry(user.id);
const blocks = await JournalRepository.getBlocks(entry);

if (blocks.length > 0) {
  const block = blocks[0];

  // Update content (automatically stores edit history in manualEdits)
  await JournalRepository.updateTranscriptionBlock(
    block,
    'Just finished the meeting with the team. We discussed the new features and timeline.'
  );

  // Check edit history
  const editHistory = block.manualEdits;
  if (editHistory) {
    console.log('Original:', editHistory.original);
    console.log('Edited:', editHistory.edited);
    console.log('Edited at:', new Date(editHistory.editedAt));
  }
}
```

### 7. Delete entries/blocks (soft delete)

```typescript
// Delete a single block
await JournalRepository.deleteTranscriptionBlock(block);

// Delete entire entry (also soft-deletes all blocks)
await JournalRepository.deleteEntry(entry);

// Note: Soft deletes set deletedFlag = true
// All queries automatically filter out soft-deleted items
```

### 8. Get statistics

```typescript
const entryCount = await JournalRepository.getEntryCount(user.id);
const transcriptionCount = await JournalRepository.getTranscriptionCount(user.id);

console.log(`Total entries: ${entryCount}`);
console.log(`Total transcriptions: ${transcriptionCount}`);
```

## React Component Integration

### Using with React hooks

```typescript
import { useState, useEffect } from 'react';
import { JournalRepository, UserRepository } from './core/data';
import type { JournalEntryWithBlocks } from './types/database';

function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntryWithBlocks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntries() {
      const user = await UserRepository.getOrCreateLocalUser();
      const data = await JournalRepository.getEntriesPaginated(user.id, 0, 20);
      setEntries(data);
      setLoading(false);
    }
    loadEntries();
  }, []);

  return { entries, loading };
}

function JournalListScreen() {
  const { entries, loading } = useJournalEntries();

  if (loading) return <Text>Loading...</Text>;

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.entry.id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.entry.date.toDateString()}</Text>
          {item.blocks.map(block => (
            <Text key={block.id}>{block.content}</Text>
          ))}
        </View>
      )}
    />
  );
}
```

### Using with observables (reactive)

```typescript
import withObservables from '@nozbe/with-observables';
import { JournalRepository } from './core/data';

interface Props {
  userId: string;
}

function JournalListComponent({ entries }: { entries: JournalEntry[] }) {
  // This component will automatically re-render when entries change!
  return (
    <FlatList
      data={entries}
      renderItem={({ item }) => (
        <Text>{item.date.toDateString()}</Text>
      )}
    />
  );
}

const JournalList = withObservables(['userId'], ({ userId }: Props) => ({
  entries: JournalRepository.getEntriesPaginatedObservable(userId, 0, 20),
}))(JournalListComponent);

// Usage
<JournalList userId={currentUser.id} />
```

## Common Patterns

### Get entry by specific date

```typescript
const user = await UserRepository.getOrCreateLocalUser();
const specificDate = new Date('2024-01-15');
const entry = await JournalRepository.getEntry(user.id, specificDate);

if (entry) {
  console.log('Found entry for', specificDate);
} else {
  console.log('No entry for that date');
}
```

### Add multiple blocks to an entry

```typescript
const entry = await JournalRepository.getOrCreateTodayEntry(user.id);

// Blocks are automatically positioned (0, 1, 2, ...)
await JournalRepository.addTranscriptionBlock(entry, 'First voice note', 3000);
await JournalRepository.addTranscriptionBlock(entry, 'Second voice note', 4000);
await JournalRepository.addTranscriptionBlock(entry, 'Third voice note', 2500);

// Get all blocks (sorted by position)
const blocks = await JournalRepository.getBlocks(entry);
console.log(blocks.map(b => b.position)); // [0, 1, 2]
```

### Transaction handling

```typescript
import { database } from './core/data';

// WatermelonDB automatically handles transactions
// All repository methods use database.write() internally

// For custom batch operations:
await database.write(async () => {
  // Multiple operations in single transaction
  const entry = await JournalRepository.getOrCreateTodayEntry(user.id);
  await JournalRepository.addTranscriptionBlock(entry, 'Note 1', 1000);
  await JournalRepository.addTranscriptionBlock(entry, 'Note 2', 1000);
  // All succeed or all fail together
});
```

## Troubleshooting

### Decorators not working

Ensure tsconfig.json has:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

### Types not recognized

Import from the correct path:
```typescript
import type { JournalEntryWithBlocks } from './types/database';
```

### Queries returning deleted items

All repository methods filter soft-deleted items automatically. If you're writing custom queries:
```typescript
import { Q } from '@nozbe/watermelondb';

const entries = await database
  .get('journal_entries')
  .query(
    Q.where('deleted_flag', false) // Always filter this!
  )
  .fetch();
```

## Performance Tips

1. **Use pagination**: Always paginate large lists
2. **Use observables**: For reactive UI updates
3. **Batch operations**: Group related writes
4. **Indexes**: Already added on key fields
5. **Lazy loading**: Relationships load on demand

## Next Steps

- Read [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for iOS comparison
- Check [examples/usage.ts](./examples/usage.ts) for more examples
- Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture details
