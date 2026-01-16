# Scripts

Once the contents of this folder change, update this document.

## Architecture
Helper scripts for development, testing, and validation of the SenseVoice models plugin setup.

## File Registry

| Name | Status | Core Function |
|------|--------|---------------|
| `create-test-models.sh` | Production-ready | Creates placeholder model files for testing the plugin (10MB test file + config files) |
| `verify-setup.sh` | Production-ready | Validates complete plugin setup: checks files, dependencies, plugin registration, and native bundles |
| `README.md` | Current | Scripts documentation and usage guide |

---

## Usage

### create-test-models.sh

Creates placeholder model files for testing the plugin during development.

```bash
# Create test model files
./scripts/create-test-models.sh

# Output:
# 🎙️  Creating test model files...
# Creating model.onnx (10 MB placeholder)...
#   ✓ Created assets/models/model.onnx
# Creating tokens.txt...
#   ✓ Created assets/models/tokens.txt
# Creating config.json...
#   ✓ Created assets/models/config.json
# ✅ Test model files created successfully!
```

**What it does:**
- Creates `assets/models/` directory
- Generates 10 MB placeholder `model.onnx` file
- Creates sample `tokens.txt` with basic vocabulary
- Creates `config.json` with model metadata

**Warning:** These are placeholder files only. Replace with real SenseVoice ONNX models for production.

### verify-setup.sh

Validates the entire plugin setup and reports any issues.

```bash
# Run verification
./scripts/verify-setup.sh

# Output shows 6 checks:
# 1. Plugin file exists
# 2. Metro config exists
# 3. Plugin registered in app.json
# 4. Dependencies installed
# 5. Model files exist
# 6. Native projects generated with models
```

**Exit codes:**
- `0`: Success (all checks passed)
- `1`: Errors found (setup incomplete)

**Example output:**
```
🔍 Verifying SenseVoice Models Plugin Setup
==========================================

1. Checking plugin file...
   ✓ Plugin file exists
2. Checking Metro config...
   ✓ Metro config exists
3. Checking app.json...
   ✓ Plugin registered in app.json
4. Checking dependencies...
   ✓ @expo/config-plugins installed
5. Checking model files...
   ✓ model.onnx exists (150M)
   ✓ tokens.txt exists (50K)
   ✓ config.json exists (2.0K)
6. Checking native projects...
   ✓ iOS project exists
   ✓ iOS models directory exists
   ✓ Found 3 model file(s) in iOS
   ✓ Android project exists
   ✓ Android models directory exists
   ✓ Found 3 model file(s) in Android

==========================================
Summary:
  Errors: 0
  Warnings: 0

✅ Setup is complete and verified!
```

## Typical Workflow

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Create test models (or add real models to assets/models/)
./scripts/create-test-models.sh

# 3. Verify setup
./scripts/verify-setup.sh

# 4. Generate native projects
npx expo prebuild

# 5. Verify models are bundled
./scripts/verify-setup.sh

# 6. Run app
npm run ios
# or
npm run android
```

### After Making Changes

```bash
# After modifying plugin or model files
npx expo prebuild --clean

# Verify everything still works
./scripts/verify-setup.sh
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml

- name: Setup test models
  run: ./scripts/create-test-models.sh

- name: Verify plugin setup
  run: ./scripts/verify-setup.sh

- name: Build native projects
  run: npx expo prebuild

- name: Verify models bundled
  run: ./scripts/verify-setup.sh
```

## Troubleshooting

### Script permission denied

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### Models not created

```bash
# Check directory exists
mkdir -p assets/models

# Run create script with bash explicitly
bash scripts/create-test-models.sh
```

### Verification fails

```bash
# See detailed error messages
./scripts/verify-setup.sh

# Common issues:
# - Plugin not in app.json: Add to plugins array
# - Dependencies not installed: Run npm install
# - Native projects not generated: Run npx expo prebuild
```

## Adding New Scripts

When adding new scripts to this directory:

1. Make script executable: `chmod +x scripts/your-script.sh`
2. Add shebang line: `#!/bin/bash`
3. Use `set -e` to exit on errors
4. Add helpful output messages
5. Update this README with documentation
6. Update the file registry table above
