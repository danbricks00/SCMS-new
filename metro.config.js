const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure Metro to handle path aliases defined in tsconfig.json
const { resolver } = config;

// Add support for the path aliases used in the project
resolver.extraNodeModules = {
  '@': path.resolve(__dirname),
  'app': path.resolve(__dirname, 'app'),
  'assets': path.resolve(__dirname, 'assets'),
  'components': path.resolve(__dirname, 'components'),
  'hooks': path.resolve(__dirname, 'hooks'),
  'constants': path.resolve(__dirname, 'constants'),
  'src': path.resolve(__dirname, 'src')
};

// Performance optimizations
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Optimize bundle size
config.resolver.platforms = ['ios', 'android', 'web'];

// Enable tree shaking for web
if (process.env.EXPO_PLATFORM === 'web') {
  config.transformer.enableBabelRCLookup = false;
}

module.exports = config;