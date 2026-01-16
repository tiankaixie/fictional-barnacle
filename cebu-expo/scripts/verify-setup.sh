#!/bin/bash

# Verify the SenseVoice models plugin setup

set -e

echo "🔍 Verifying SenseVoice Models Plugin Setup"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Check 1: Plugin file exists
echo "1. Checking plugin file..."
if [ -f "plugins/withSenseVoiceModels.ts" ]; then
  echo "   ✓ Plugin file exists"
else
  echo "   ✗ Plugin file not found: plugins/withSenseVoiceModels.ts"
  ERRORS=$((ERRORS + 1))
fi

# Check 2: Metro config exists
echo "2. Checking Metro config..."
if [ -f "metro.config.js" ]; then
  echo "   ✓ Metro config exists"
else
  echo "   ⚠ Metro config not found (optional but recommended)"
  WARNINGS=$((WARNINGS + 1))
fi

# Check 3: Plugin registered in app.json
echo "3. Checking app.json..."
if grep -q "withSenseVoiceModels" app.json; then
  echo "   ✓ Plugin registered in app.json"
else
  echo "   ✗ Plugin not registered in app.json"
  echo "     Add: \"plugins\": [\"./plugins/withSenseVoiceModels\"]"
  ERRORS=$((ERRORS + 1))
fi

# Check 4: Dependencies installed
echo "4. Checking dependencies..."
if [ -d "node_modules/@expo/config-plugins" ]; then
  echo "   ✓ @expo/config-plugins installed"
else
  echo "   ✗ @expo/config-plugins not installed"
  echo "     Run: npm install"
  ERRORS=$((ERRORS + 1))
fi

# Check 5: Model files exist
echo "5. Checking model files..."
MODEL_FILES=("model.onnx" "tokens.txt" "config.json")
MISSING_MODELS=0

for file in "${MODEL_FILES[@]}"; do
  if [ -f "assets/models/$file" ]; then
    SIZE=$(du -h "assets/models/$file" | cut -f1)
    echo "   ✓ $file exists ($SIZE)"
  else
    echo "   ✗ $file not found"
    MISSING_MODELS=$((MISSING_MODELS + 1))
  fi
done

if [ $MISSING_MODELS -gt 0 ]; then
  echo ""
  echo "   ⚠ $MISSING_MODELS model file(s) missing"
  echo "     Create test files: ./scripts/create-test-models.sh"
  echo "     Or add real models to: assets/models/"
  WARNINGS=$((WARNINGS + 1))
fi

# Check 6: Native projects generated
echo "6. Checking native projects..."
IOS_EXISTS=false
ANDROID_EXISTS=false

if [ -d "ios" ]; then
  echo "   ✓ iOS project exists"
  IOS_EXISTS=true

  # Check if models are in iOS
  if [ -d "ios/CebuExpo/Resources/models" ] || find ios -name "models" -type d 2>/dev/null | grep -q "Resources/models"; then
    echo "   ✓ iOS models directory exists"

    # Count model files
    MODEL_COUNT=$(find ios -path "*/Resources/models/*" -type f 2>/dev/null | wc -l | tr -d ' ')
    if [ "$MODEL_COUNT" -gt 0 ]; then
      echo "   ✓ Found $MODEL_COUNT model file(s) in iOS"
    else
      echo "   ⚠ No model files found in iOS"
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo "   ⚠ iOS models not bundled yet"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "   ⚠ iOS project not generated (run: npx expo prebuild)"
  WARNINGS=$((WARNINGS + 1))
fi

if [ -d "android" ]; then
  echo "   ✓ Android project exists"
  ANDROID_EXISTS=true

  # Check if models are in Android
  if [ -d "android/app/src/main/assets/models" ]; then
    echo "   ✓ Android models directory exists"

    # Count model files
    MODEL_COUNT=$(find android/app/src/main/assets/models -type f 2>/dev/null | wc -l | tr -d ' ')
    if [ "$MODEL_COUNT" -gt 0 ]; then
      echo "   ✓ Found $MODEL_COUNT model file(s) in Android"
    else
      echo "   ⚠ No model files found in Android"
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo "   ⚠ Android models not bundled yet"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo "   ⚠ Android project not generated (run: npx expo prebuild)"
  WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "=========================================="
echo "Summary:"
echo "  Errors: $ERRORS"
echo "  Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ Setup is complete and verified!"
  echo ""
  echo "Next steps:"
  echo "  • Run: npm run ios"
  echo "  • Run: npm run android"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "⚠️  Setup is mostly complete but has warnings"
  echo ""
  echo "Recommended actions:"
  if ! $IOS_EXISTS || ! $ANDROID_EXISTS; then
    echo "  • Run: npx expo prebuild"
  fi
  if [ $MISSING_MODELS -gt 0 ]; then
    echo "  • Add model files to: assets/models/"
    echo "    Or create test files: ./scripts/create-test-models.sh"
  fi
  exit 0
else
  echo "❌ Setup is incomplete"
  echo ""
  echo "Required actions:"
  echo "  • Fix the errors listed above"
  echo "  • Run: npm install"
  if [ $MISSING_MODELS -gt 0 ]; then
    echo "  • Add model files or run: ./scripts/create-test-models.sh"
  fi
  echo "  • Run: npx expo prebuild"
  exit 1
fi
