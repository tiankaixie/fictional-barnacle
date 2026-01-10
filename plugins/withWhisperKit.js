const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');

/**
 * Expo config plugin to add WhisperKit Swift Package to Xcode project
 */
const withWhisperKit = (config) => {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;

    // Add WhisperKit as a Swift Package dependency
    const whisperKitPackage = {
      repositoryURL: 'https://github.com/argmaxinc/WhisperKit.git',
      requirement: {
        kind: 'upToNextMajorVersion',
        minimumVersion: '0.7.0',
      },
    };

    // Get the project reference
    const projectUuid = xcodeProject.getFirstProject().uuid;
    const projectSection = xcodeProject.pbxProjectSection();
    const project = projectSection[projectUuid];

    // Initialize packageReferences if it doesn't exist
    if (!project.packageReferences) {
      project.packageReferences = [];
    }

    // Check if WhisperKit is already added
    const existingPackage = project.packageReferences.find(
      (ref) => xcodeProject.pbxXCRemoteSwiftPackageReference.section[ref.value]?.repositoryURL === whisperKitPackage.repositoryURL
    );

    if (!existingPackage) {
      // Add package reference
      const packageRef = xcodeProject.addSwiftPackage(
        whisperKitPackage.repositoryURL,
        whisperKitPackage.requirement.minimumVersion,
        whisperKitPackage.requirement
      );

      // Add to target
      const targets = xcodeProject.pbxNativeTargetSection();
      const targetKey = Object.keys(targets).find(
        (key) => !key.endsWith('_comment') && targets[key].name === config.modRequest.projectName
      );

      if (targetKey) {
        const target = targets[targetKey];
        if (!target.packageProductDependencies) {
          target.packageProductDependencies = [];
        }

        // Add WhisperKit product dependency
        const productDep = xcodeProject.addSwiftPackageProductDependency({
          package: packageRef.packageReference,
          product: 'WhisperKit',
        });

        target.packageProductDependencies.push({
          value: productDep.uuid,
          comment: 'WhisperKit',
        });
      }

      console.log('✅ WhisperKit Swift Package added to Xcode project');
    } else {
      console.log('ℹ️  WhisperKit already added to Xcode project');
    }

    return config;
  });
};

module.exports = withWhisperKit;
