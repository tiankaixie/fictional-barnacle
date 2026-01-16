# Models

Once the contents of this folder change, update this document.

## Architecture
WatermelonDB model classes with decorators for schema definition. Mirrors iOS Core Data entities with soft delete support, position-based ordering, and JSON manual edits storage.

## File Registry

| Name | Status/Importance | Core Function |
|------|------------------|---------------|
| schema.ts | Critical | Database schema definition with tables, columns, and indexes |
| User.ts | Core | User model with basic profile fields and has_many relationship to entries |
| JournalEntry.ts | Core | Daily journal entry model with belongs_to User and has_many TranscriptionBlocks |
| TranscriptionBlock.ts | Core | Transcription block model with JSON manual edits and position ordering |
| TranscriptionCost.ts | Core | Cost tracking model for transcription API usage |
| index.ts | Utility | Centralized exports for all models and schema |
| README.md | Documentation | This manifest file |
