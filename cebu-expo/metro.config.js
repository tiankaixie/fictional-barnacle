/**
 * Input: @expo/metro-config, Metro bundler
 * Output: Metro configuration for handling large ONNX model files
 * Pos: Metro bundler configuration to prevent bundling ONNX files as JavaScript and handle large assets
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure asset registry to handle ONNX files as static assets
config.resolver.assetExts.push(
  // ONNX model files
  'onnx',
  // Additional model-related files
  'bin',
  'pb',
  'tflite',
  'mlmodel'
);

// Exclude ONNX files from being processed as JavaScript
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => !['onnx', 'bin', 'pb', 'tflite', 'mlmodel'].includes(ext)
);

// Configure transformer to handle large files
config.transformer = {
  ...config.transformer,
  // Enable inline requires for better performance
  inlineRequires: true,

  // Asset plugins configuration
  assetPlugins: [],

  // Increase max worker memory for handling large files
  maxWorkers: 2,
};

// Asset registry configuration for ONNX files
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Configure server to handle large requests
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Increase payload size limit for large model files
      if (req.url?.includes('.onnx') || req.url?.includes('/assets/models/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      return middleware(req, res, next);
    };
  },
};

// Watchman configuration to ignore large model files for better performance
config.watchFolders = [__dirname];
config.watchman = {
  ...config.watchman,
  // Don't watch model files for changes (they're static)
  ignorePattern: /assets\/models\/.*/,
};

// Configure asset scales - ONNX files don't have scales
config.resolver.assetResolutions = ['1x', '2x', '3x'];

// Log configuration for debugging
console.log('📦 Metro Config Loaded');
console.log('  ↳ Asset Extensions:', config.resolver.assetExts.filter(ext =>
  ['onnx', 'bin', 'pb', 'tflite', 'mlmodel'].includes(ext)
));
console.log('  ↳ ONNX files will be treated as static assets (not bundled as JS)');

module.exports = config;
