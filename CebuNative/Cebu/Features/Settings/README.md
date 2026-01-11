Once the contents of this folder change, update this document.

# Settings Feature

## Architecture
User settings interface providing theme mode and AI model configuration with persistent storage, real-time UI updates, and quality indicators.

## File Registry

| Name | Status | Core Function |
|------|--------|---------------|
| `Views/SettingsView.swift` | Production | Settings screen with theme mode and WhisperKit model selection UI, quality stars, haptic feedback, and animated transitions |
| `README.md` | Documentation | Feature overview and file registry |

## Integration

This feature works in conjunction with:
- `Core/Data/Models/ThemeMode.swift` - Theme mode enum definition
- `Core/Data/Models/WhisperModel.swift` - WhisperKit model enum with quality metadata
- `Core/Services/ThemeManager.swift` - Theme state management and persistence
- `Core/Services/ModelManager.swift` - Model state management and persistence
- `UI/Theme/Colors.swift` - Theme color definitions
- `App/CebuApp.swift` - Service environment injection

## User Flow

### Theme Selection
1. User taps gear icon in top-right of JournalListView
2. Settings sheet appears
3. User selects a theme mode (Auto/Light/Dark)
4. Theme changes with 0.3s animation
5. Selection persists via UserDefaults

### Model Selection
1. User views available models with quality stars (1-5 stars)
2. User taps info icon to see model explanation
3. User selects desired model (default: Large V3)
4. Model size, description, and quality level displayed
5. Selection persists via UserDefaults
6. Next recording automatically uses new model

### Models Available
- **Tiny** (75MB, ⭐): Fastest, lowest accuracy
- **Base** (150MB, ⭐⭐): Quick, basic accuracy
- **Small** (500MB, ⭐⭐⭐): Balanced speed and accuracy
- **Medium** (1.5GB, ⭐⭐⭐⭐): Slower, high accuracy
- **Large V3** (3GB, ⭐⭐⭐⭐⭐): Slowest, highest accuracy
- **Large V3 Turbo** (1.6GB, ⭐⭐⭐⭐⭐): Fast, highest accuracy (default) ✅

Only multilingual models are shown (supports Chinese).
