Once the contents of this folder change, update this document.

# Core Services

## Architecture
Observable services managing app-wide state, authentication, AI transcription, and theme configuration with dependency injection via SwiftUI environment.

## File Registry

| Name | Status | Core Function |
|------|--------|---------------|
| `AuthenticationService.swift` | Production | Core authentication logic and user session management |
| `LocalAuthService.swift` | Production | ObservableObject wrapper for local authentication flow without Apple Sign In |
| `WhisperKitService.swift` | Production | WhisperKit integration for on-device speech-to-text transcription (small model, 500MB) |
| `ThemeManager.swift` | Production | ObservableObject managing theme mode (auto/light/dark) with UserDefaults persistence and system colorScheme synchronization |
| `README.md` | Documentation | Service overview and file registry |

## Service Lifecycle

All services are instantiated as `@StateObject` in `CebuApp.swift` and injected via `.environmentObject()` for app-wide access.

## Dependencies

- **LocalAuthService** → UserRepository (Core Data)
- **WhisperKitService** → WhisperKit framework
- **ThemeManager** → UserDefaults, ThemeMode enum, ThemeColors
