const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': './src',
  '@/components': './src/components',
  '@/screens': './src/screens',
  '@/services': './src/services',
  '@/utils': './src/utils',
  '@/types': './src/types',
  '@/contexts': './src/contexts',
  '@/hooks': './src/hooks',
  '@/constants': './src/constants',
  '@/assets': './assets',
};

module.exports = config;