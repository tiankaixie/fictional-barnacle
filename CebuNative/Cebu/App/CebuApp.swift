/**
 * Input: SwiftUI, Core Data PersistenceController
 * Output: App entry point, main window group
 * Pos: Application lifecycle management and dependency injection
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import SwiftUI
import CoreData

@main
struct CebuApp: App {
    // Core Data persistence controller
    let persistenceController = PersistenceController.shared

    // Local authentication service (no Apple Sign In required)
    @StateObject private var authService: LocalAuthService

    // Theme manager for app-wide theme control
    @StateObject private var themeManager = ThemeManager()

    // Model manager for WhisperKit model selection
    @StateObject private var modelManager = ModelManager()

    // Biometric authentication service for app lock
    @StateObject private var biometricService = BiometricAuthService()

    // Cloud sync service for iCloud synchronization
    @StateObject private var cloudSyncService: CloudSyncService

    // Audio playback service for playing recorded audio
    @StateObject private var audioPlaybackService = AudioPlaybackService()

    // Scene phase for background/foreground detection
    @Environment(\.scenePhase) var scenePhase

    init() {
        let persistenceController = PersistenceController.shared
        let context = persistenceController.container.viewContext
        let userRepository = UserRepository(context: context)
        _authService = StateObject(wrappedValue: LocalAuthService(userRepository: userRepository))
        _cloudSyncService = StateObject(wrappedValue: CloudSyncService(container: persistenceController.container))
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .environmentObject(authService)
                .environmentObject(themeManager)
                .environmentObject(modelManager)
                .environmentObject(biometricService)
                .environmentObject(cloudSyncService)
                .environmentObject(audioPlaybackService)
                .task {
                    await authService.checkAuthenticationState()
                }
        }
        .onChange(of: scenePhase) { newPhase in
            switch newPhase {
            case .background:
                // Lock when app goes to background
                biometricService.lock()
            case .active:
                // Authenticate when app becomes active
                if biometricService.isLocked && biometricService.isEnabled {
                    Task {
                        try? await biometricService.authenticate()
                    }
                }
            default:
                break
            }
        }
    }
}

struct ContentView: View {
    @Environment(\.colorScheme) var colorScheme
    @EnvironmentObject var authService: LocalAuthService
    @EnvironmentObject var themeManager: ThemeManager
    @EnvironmentObject var biometricService: BiometricAuthService

    var body: some View {
        Group {
            if authService.isLoading {
                // Loading screen
                VStack {
                    ProgressView()
                    Text("Loading...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.top, 8)
                }
                .liquidGlassBackground()
            } else if authService.isAuthenticated {
                // Main app
                MainAppView()
            } else {
                // Fallback (should auto-create local user)
                ProgressView("Setting up...")
                    .liquidGlassBackground()
            }
        }
        .overlay {
            // Biometric lock overlay
            if biometricService.isLocked {
                AppLockView(biometricService: biometricService)
                    .transition(.opacity)
            }
        }
        .environment(\.themeColors, themeManager.effectiveTheme)
        .preferredColorScheme(themeManager.effectiveColorScheme)
        .onChange(of: colorScheme) { newScheme in
            themeManager.updateSystemColorScheme(newScheme)
        }
        .onAppear {
            themeManager.updateSystemColorScheme(colorScheme)
        }
    }
}

// MARK: - Main App View

struct MainAppView: View {
    @Environment(\.managedObjectContext) var context
    @EnvironmentObject var authService: LocalAuthService

    var body: some View {
        Group {
            if let user = authService.currentUser {
                // Create ViewModels with actual user
                MainContentView(user: user, context: context)
            } else {
                // Fallback loading state
                ProgressView("Loading...")
            }
        }
    }
}

struct MainContentView: View {
    let user: User
    let context: NSManagedObjectContext

    @StateObject private var whisperService = OpenAIWhisperService()
    @StateObject private var audioStorageService = AudioStorageService()
    @StateObject private var costTrackingService: CostTrackingService
    @StateObject private var journalViewModel: JournalListViewModel
    @StateObject private var recordingViewModel: RecordingViewModel

    init(user: User, context: NSManagedObjectContext) {
        self.user = user
        self.context = context

        // Initialize ViewModels with actual user
        let repository = JournalRepository(context: context)
        let journalVM = JournalListViewModel(repository: repository, user: user)
        _journalViewModel = StateObject(wrappedValue: journalVM)

        let whisperSvc = OpenAIWhisperService()
        _whisperService = StateObject(wrappedValue: whisperSvc)

        let audioStorageSvc = AudioStorageService()
        _audioStorageService = StateObject(wrappedValue: audioStorageSvc)

        let costSvc = CostTrackingService(context: context)
        _costTrackingService = StateObject(wrappedValue: costSvc)

        let recordingVM = RecordingViewModel(
            whisperService: whisperSvc,
            journalViewModel: journalVM,
            audioStorageService: audioStorageSvc,
            costTrackingService: costSvc
        )
        _recordingViewModel = StateObject(wrappedValue: recordingVM)
    }

    var body: some View {
        JournalListView(
            viewModel: journalViewModel,
            recordingViewModel: recordingViewModel
        )
        .environmentObject(audioStorageService)
        .environmentObject(whisperService)
        .environmentObject(costTrackingService)
        .task {
            // Initialize OpenAI Whisper service on app launch
            await recordingViewModel.initialize()
        }
    }
}

#Preview("Authenticated") {
    let context = PersistenceController.preview.container.viewContext
    let userRepository = UserRepository(context: context)
    let authService = LocalAuthService(userRepository: userRepository)
    let themeManager = ThemeManager()
    let modelManager = ModelManager()

    return ContentView()
        .environmentObject(authService)
        .environmentObject(themeManager)
        .environmentObject(modelManager)
        .environment(\.themeColors, .light)
        .onAppear {
            Task {
                authService.currentUser = try? await userRepository.getCurrentUser()
                authService.isAuthenticated = true
            }
        }
}

#Preview("Loading") {
    let context = PersistenceController.preview.container.viewContext
    let userRepository = UserRepository(context: context)
    let authService = LocalAuthService(userRepository: userRepository)
    let themeManager = ThemeManager()
    let modelManager = ModelManager()

    return ContentView()
        .environmentObject(authService)
        .environmentObject(themeManager)
        .environmentObject(modelManager)
        .environment(\.themeColors, .dark)
        .preferredColorScheme(.dark)
}
