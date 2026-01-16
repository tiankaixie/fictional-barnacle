# UI System

Once the contents of this folder change, update this document.

## Architecture
Complete Liquid Glass design system with three-mode theming (light/dark/auto), glassmorphism components, and ambient animations. Provides reusable UI primitives for consistent visual language across the app.

## File Registry

| Name | Status | Core Function |
|------|--------|---------------|
| theme/colors.ts | ✅ Complete | Theme color definitions for light and dark modes |
| theme/ThemeProvider.tsx | ✅ Complete | React context provider for theme management with auto/light/dark modes |
| theme/index.ts | ✅ Complete | Barrel export for theme system |
| components/GlassCard.tsx | ✅ Complete | Card component with liquid glass effect (blur + gradient + shadow) |
| components/GlassBackground.tsx | ✅ Complete | Full-screen background with animated gradient |
| components/GlassButton.tsx | ✅ Complete | Interactive button with glassmorphism and haptic feedback |
| components/PulsingGlow.tsx | ✅ Complete | Animated pulsing glow effect for ambient decoration |
| components/index.ts | ✅ Complete | Barrel export for UI components |

## Usage

### Theme System

```typescript
import { ThemeProvider, useTheme } from './ui/theme';

// Wrap app with ThemeProvider
<ThemeProvider>
  <App />
</ThemeProvider>

// Access theme in components
const { mode, effectiveTheme, colors, setMode } = useTheme();

// Change theme mode
setMode('dark'); // 'light' | 'dark' | 'auto'
```

### Liquid Glass Components

```typescript
import { GlassCard, GlassBackground, GlassButton, PulsingGlow } from './ui/components';

// Glass card container
<GlassCard intensity={20} borderRadius={12}>
  <Text>Content</Text>
</GlassCard>

// Full-screen background
<GlassBackground>
  <View>Screen content</View>
</GlassBackground>

// Interactive button
<GlassButton
  title="Press Me"
  variant="primary"
  size="medium"
  onPress={() => {}}
/>

// Ambient glow effect
<PulsingGlow color="#007AFF" size={120} duration={2000} />
```

## Design Tokens

### Light Mode
- Background: `#F5F5F7` (iOS light gray)
- Glass: `rgba(255, 255, 255, 0.7)` with blur
- Text: `#000000`, `#666666`, `#8E8E93`
- Primary: `#007AFF` (iOS blue)

### Dark Mode
- Background: `#000000` (true black for OLED)
- Glass: `rgba(28, 28, 30, 0.7)` with blur
- Text: `#FFFFFF`, `#EBEBF5`, `#8E8E93`
- Primary: `#0A84FF` (iOS blue adjusted for dark)

### Effects
- Blur intensity: 15-20
- Shadow opacity: 0.1 (light), 0.3 (dark)
- Border gradient: Highlight → Border
- Background gradient: Glass → Secondary
