# Cebu - Voice Note App

Once the contents of this folder change, update this document.

## Architecture

A voice-first daily journal app built with Expo and WhisperKit for on-device speech recognition. Features real-time transcription, daily auto-organization, and iCloud sync.

## Project Structure

| File/Directory | Status | Core Function |
|----------------|--------|---------------|
| `app/` | Core | Expo Router pages (main, auth layouts) |
| `src/components/` | Core | UI components (journal, recording, ui) |
| `src/hooks/` | Core | React hooks (theme, database) |
| `src/stores/` | Core | Zustand state stores |
| `src/services/` | Core | Database schema and services |
| `src/constants/` | Core | Colors and theme configuration |
| `src/types/` | Core | TypeScript type definitions |
| `modules/whisperkit/` | Core | WhisperKit native module (iOS) |

## Quick Start

```bash
npm install
npx expo start
```

## Key Features

- **Voice Recording**: Tap to record, real-time transcription
- **Daily Organization**: Auto-groups entries by day
- **Read-Only Default**: Long-press to edit, prevents accidental changes
- **Dark Mode**: Supports system theme and manual toggle
- **Offline-First**: Local SQLite storage with iCloud sync

## Tech Stack

- Expo SDK 54 + Expo Router 6
- WhisperKit (on-device speech recognition)
- SQLite + iCloud sync
- Zustand + React Query
- Apple/Google Sign-In
