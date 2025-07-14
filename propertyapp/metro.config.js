const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add web platform support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure web-specific aliases and polyfills
config.resolver.alias = {
  ...config.resolver.alias,
  // Use react-native-web for react-native-screens on web
  'react-native-screens': 'react-native-web/dist/exports/View',
  'react-native-screens/lib/module/index.web.js': 'react-native-web/dist/exports/View',
};

// Ensure proper handling of web extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'];

// Add resolver for node modules
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

module.exports = config;