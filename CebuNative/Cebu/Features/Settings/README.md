Once the contents of this folder change, update this document.

# Settings Feature

## Architecture
User settings interface providing theme mode configuration (Auto/Light/Dark) with persistent storage and real-time UI updates.

## File Registry

| Name | Status | Core Function |
|------|--------|---------------|
| `Views/SettingsView.swift` | Production | Settings screen with theme mode selection UI, haptic feedback, and animated transitions |
| `README.md` | Documentation | Feature overview and file registry |

## Theme System Integration

This feature works in conjunction with:
- `Core/Data/Models/ThemeMode.swift` - Theme mode enum definition
- `Core/Services/ThemeManager.swift` - Theme state management and persistence
- `UI/Theme/Colors.swift` - Theme color definitions
- `App/CebuApp.swift` - Theme environment injection

## User Flow

1. User taps gear icon in top-right of JournalListView
2. Settings sheet appears with three theme options
3. User selects a mode (Auto/Light/Dark)
4. Theme changes with 0.3s animation
5. Selection persists via UserDefaults
6. User dismisses with "完成" button
