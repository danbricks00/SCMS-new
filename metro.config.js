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

module.exports = config;