Once the contents of this folder change, update this document.

# Core Data Models

## Architecture
Core data models defining the persistent entities and app configuration types for the Cebu journal application.

## File Registry

| Name | Status | Core Function |
|------|--------|---------------|
| `JournalEntry.swift` | Production | Core Data entity representing daily journal entries with timestamps and user relationships |
| `TranscriptionBlock.swift` | Production | Core Data entity for individual transcribed voice segments within journal entries |
| `User.swift` | Production | Core Data entity for user authentication and profile data |
| `ThemeMode.swift` | Production | Theme configuration enum (auto/light/dark) with display properties for user preferences |
| `README.md` | Documentation | Model overview and file registry |

## Entity Relationships

```
User (1) ─────< (many) JournalEntry (1) ─────< (many) TranscriptionBlock
```

## Configuration Models

- **ThemeMode**: Non-persistent enum used by ThemeManager for app-wide theme configuration
