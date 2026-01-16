/**
 * Input: @expo/config-plugins, fs, path
 * Output: ConfigPlugin for bundling ONNX model files
 * Pos: Expo Config Plugin to copy SenseVoice ONNX models to iOS and Android native projects
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import {
  ConfigPlugin,
  withDangerousMod,
  withXcodeProject,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

interface ModelFile {
  filename: string;
  required: boolean;
}

const MODEL_FILES: ModelFile[] = [
  { filename: 'model.onnx', required: true },
  { filename: 'tokens.txt', required: true },
  { filename: 'config.json', required: true },
];

const MODELS_SOURCE_DIR = 'assets/models';
const MODELS_DEST_SUBPATH = 'models';

/**
 * Copy files with error handling and logging
 */
function copyFilesSafely(
  sourceDir: string,
  destDir: string,
  files: ModelFile[],
  platform: 'ios' | 'android'
): void {
  const errors: string[] = [];
  const warnings: string[] = [];
  const copied: string[] = [];

  // Ensure destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log(`✓ Created ${platform} models directory: ${destDir}`);
  }

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file.filename);
    const destPath = path.join(destDir, file.filename);

    if (!fs.existsSync(sourcePath)) {
      const message = `Missing model file: ${sourcePath}`;
      if (file.required) {
        errors.push(message);
      } else {
        warnings.push(message);
      }
      continue;
    }

    try {
      // Check if file already exists and is identical
      if (fs.existsSync(destPath)) {
        const sourceStats = fs.statSync(sourcePath);
        const destStats = fs.statSync(destPath);

        if (sourceStats.size === destStats.size) {
          console.log(`  ↳ Skipped ${file.filename} (already exists, same size)`);
          continue;
        }
      }

      // Copy file
      fs.copyFileSync(sourcePath, destPath);
      const stats = fs.statSync(destPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      copied.push(`${file.filename} (${sizeMB} MB)`);
      console.log(`  ↳ Copied ${file.filename} (${sizeMB} MB)`);
    } catch (error) {
      errors.push(
        `Failed to copy ${file.filename}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Report results
  if (copied.length > 0) {
    console.log(`✓ Copied ${copied.length} file(s) to ${platform}`);
  }

  if (warnings.length > 0) {
    warnings.forEach((warning) => console.warn(`⚠ Warning: ${warning}`));
  }

  if (errors.length > 0) {
    const errorMessage = `Failed to copy required model files for ${platform}:\n${errors.join('\n')}`;
    throw new Error(errorMessage);
  }
}

/**
 * iOS: Add model files to Xcode project and copy to Resources
 */
const withIOSModels: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const sourceDir = path.join(projectRoot, MODELS_SOURCE_DIR);

      // Get iOS project directory
      const iosProjectDir = modConfig.modRequest.platformProjectRoot;
      const projectName = path.basename(iosProjectDir.replace(/\.xcodeproj$/, ''));
      const destDir = path.join(
        iosProjectDir,
        projectName,
        'Resources',
        MODELS_DEST_SUBPATH
      );

      console.log('\n📱 Configuring iOS model files...');
      console.log(`   Source: ${sourceDir}`);
      console.log(`   Destination: ${destDir}`);

      copyFilesSafely(sourceDir, destDir, MODEL_FILES, 'ios');

      return modConfig;
    },
  ]);
};

/**
 * iOS: Add files to Xcode project build phases
 */
const withIOSXcodeProject: ConfigPlugin = (config) => {
  return withXcodeProject(config, (modConfig) => {
    const { project } = modConfig.modResults;

    console.log('\n🔧 Adding model files to Xcode project...');

    // Get or create Resources group
    let resourcesGroup = project.pbxGroupByName('Resources');
    if (!resourcesGroup) {
      const mainGroupKey = project.findPBXGroupKey({ name: 'CustomTemplate' });
      if (mainGroupKey) {
        resourcesGroup = project.addPbxGroup([], 'Resources', mainGroupKey);
        console.log('  ↳ Created Resources group');
      }
    }

    // Get or create models group under Resources
    let modelsGroup = project.pbxGroupByName(MODELS_DEST_SUBPATH);
    if (!modelsGroup && resourcesGroup) {
      const resourcesGroupKey = project.findPBXGroupKey({ name: 'Resources' });
      if (resourcesGroupKey) {
        modelsGroup = project.addPbxGroup(
          [],
          MODELS_DEST_SUBPATH,
          resourcesGroupKey,
          `Resources/${MODELS_DEST_SUBPATH}`
        );
        console.log('  ↳ Created models group');
      }
    }

    // Add files to project
    MODEL_FILES.forEach((file) => {
      const filePath = `Resources/${MODELS_DEST_SUBPATH}/${file.filename}`;

      // Check if file already exists in project
      const existingFile = project.pbxFileReferenceSection();
      const alreadyExists = Object.values(existingFile || {}).some(
        (ref: any) => ref.path === filePath
      );

      if (!alreadyExists) {
        // Add file reference
        const fileRef = project.addFile(filePath, modelsGroup);

        if (fileRef) {
          // Add to resources build phase
          project.addResourceFile(filePath);
          console.log(`  ↳ Added ${file.filename} to project`);
        }
      } else {
        console.log(`  ↳ ${file.filename} already in project`);
      }
    });

    return modConfig;
  });
};

/**
 * Android: Copy model files to assets directory
 */
const withAndroidModels: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const sourceDir = path.join(projectRoot, MODELS_SOURCE_DIR);

      // Android assets directory
      const androidProjectRoot = modConfig.modRequest.platformProjectRoot;
      const destDir = path.join(
        androidProjectRoot,
        'app',
        'src',
        'main',
        'assets',
        MODELS_DEST_SUBPATH
      );

      console.log('\n🤖 Configuring Android model files...');
      console.log(`   Source: ${sourceDir}`);
      console.log(`   Destination: ${destDir}`);

      copyFilesSafely(sourceDir, destDir, MODEL_FILES, 'android');

      return modConfig;
    },
  ]);
};

/**
 * Main plugin: Combines iOS and Android configurations
 */
const withSenseVoiceModels: ConfigPlugin = (config) => {
  console.log('\n🎙️  SenseVoice Models Plugin');
  console.log('================================');

  // Apply all modifications
  config = withIOSModels(config);
  config = withIOSXcodeProject(config);
  config = withAndroidModels(config);

  console.log('\n✅ SenseVoice models plugin configured successfully\n');

  return config;
};

export default withSenseVoiceModels;
