# Repositories

Once the contents of this folder change, update this document.

## Architecture
Data access layer providing CRUD operations for models. Implements observable queries for reactive UI, soft delete patterns, position-based ordering, and JSON manual edit tracking.

## File Registry

| Name | Status/Importance | Core Function |
|------|------------------|---------------|
| UserRepository.ts | Core | User CRUD operations with get/create local user support |
| JournalRepository.ts | Critical | Journal entry and transcription block CRUD with pagination, search, and observables |
| index.ts | Utility | Centralized exports for all repositories |
| README.md | Documentation | This manifest file |
